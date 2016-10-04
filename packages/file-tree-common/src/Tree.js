import path from 'path'
import EventEmitter from 'events'

import { split, within } from './utils/pathUtils'
import { traverse, ensureNode, createFileNode, createDirectoryNode } from './utils/treeUtils'

class Tree extends EventEmitter {
  constructor(rootPath = '/') {
    super()

    this.emitChange = this.emitChange.bind(this)
    this.startTransaction = this.startTransaction.bind(this)
    this.finishTransaction = this.finishTransaction.bind(this)

    this.inTransaction = false
    this._state = {
      version: 0,
    }

    this.set(rootPath)
  }
  get state() {
    const {_state: {stat, metadata, version}} = this

    return {
      stat,
      metadata,
      version,
      tree: this.get(this.rootPath),
    }
  }
  set(rootPath, tree, stat, metadata) {
    this.rootPath = rootPath

    const {_state} = this

    this.startTransaction()

    if (tree || ! _state.tree) {
      _state.tree = tree || ensureNode(rootPath)
    } else {
      ensureNode(rootPath, _state.tree)
    }

    if (stat || ! _state.stat) {
      _state.stat = stat || {}
    }

    if (! _state.metadata) {
      _state.metadata = metadata || {}
    } else {
      for (let path in metadata) {
        this.mergeMetadata(path, metadata[path])
      }
    }

    this.finishTransaction()
  }
  emitChange() {
    if (this.inTransaction) {
      return
    }

    const {_state} = this

    _state.version++

    this.emit('change', this.state)
    this.emit('version', _state.version)
  }
  startTransaction() {
    if (this.inTransaction) {
      throw new Error(`Already in transaction, can't start another.`)
    }

    this.inTransaction = true
  }
  finishTransaction() {
    if (! this.inTransaction) {
      throw new Error(`Can't end transaction, not in one.`)
    }

    this.inTransaction = false
    this.emitChange()
  }
  get(filePath) {
    const {_state: {tree}, rootPath} = this

    const isWithin = within(filePath, rootPath)

    if (! isWithin) {
      console.log(`file-tree-common/tree: Can't get path ${filePath} outside root ${rootPath}`)
      return null
    }

    const parts = split(filePath)

    let parent = tree
    while (parts.length) {
      const part = parts[0]

      if (typeof parent.children[part] === 'undefined') {
        return null
      }

      parts.shift()
      parent = parent.children[part]
    }

    return parent
  }
  add(itemPath, item) {
    const parentPath = path.dirname(itemPath)

    const parent = this.get(parentPath)
    if (! parent) {
      console.log(`Can't add path - parent doesn't exist`)
      return null
    }

    const basePath = path.basename(itemPath)
    item.name = basePath
    item.path = itemPath
    parent.children[basePath] = item

    this.emitChange()

    return item
  }
  addFile(filePath, stat, metadata) {
    const item = this.add(filePath, createFileNode(filePath))

    if (item) {
      if (stat) {
        this._state.stat[filePath] = stat
      }
      metadata && this.mergeMetadata(filePath, metadata)
    }

    return item
  }
  addDir(dirPath, stat, metadata) {
    const {rootPath} = this

    if (! within(dirPath, rootPath) || dirPath === rootPath) {
      console.log('No need to add', dirPath)
      return null
    }

    const item = this.add(dirPath, createDirectoryNode(dirPath))

    if (item) {
      if (stat) {
        this._state.stat[dirPath] = stat
      }
      metadata && this.mergeMetadata(dirPath, metadata)
    }

    return item
  }
  remove(itemPath) {
    const parentPath = path.dirname(itemPath)

    const parent = this.get(parentPath)
    if (! parent) {
      console.log(`Can't add path - parent doesn't exist`)
      return null
    }

    const basePath = path.basename(itemPath)
    const item = parent.children[basePath]
    delete parent.children[basePath]
    this.deleteMetadata(itemPath)

    this.emitChange()

    return item
  }
  removeFile(itemPath) {
    this.remove(itemPath)
  }
  removeDir(itemPath) {
    this.remove(itemPath)
  }
  move(oldPath, newPath) {
    const {_state: {metadata}} = this
    const itemMetadata = metadata[oldPath]
    const item = this.remove(oldPath)

    if (item) {
      this.add(newPath, item)
      metadata[newPath] = itemMetadata

      // Update names and paths of children
      traverse(item, (child, childPath) => {
        const basePath = path.basename(childPath)
        const oldChildPath = child.path
        child.name = basePath
        child.path = childPath

        // a bit of duplication
        // we want the directories metadata to be present on the first noticeable "change" event
        if (childPath != newPath) {
          this.moveMetadata(oldChildPath, childPath)
        }
      })
    }

    this.emitChange()
  }
  deleteMetadata(itemPath) {
    delete this._state.metadata[itemPath]
  }
  moveMetadata(oldPath, newPath) {
    const metadataCopy = {
      ...this._state.metadata[oldPath],
    }
    delete this._state.metadata[oldPath]
    this._state.metadata[newPath] = metadataCopy
  }
  mergeMetadata(itemPath, obj) {
    const {_state: {metadata}} = this

    let itemMetadata = metadata[itemPath]

    if (!itemMetadata) {
      metadata[itemPath] = obj
    } else {
      Object.assign(itemMetadata, obj)
    }
  }
  setMetadataField(itemPath, field, value) {
    let metadata = this._state.metadata[itemPath]

    if (! metadata) {
      metadata = this._state.metadata[itemPath] = {}
    }

    metadata[field] = value

    this.emitChange()
  }
  toJS() {
    return this._state
  }
}

export default Tree
