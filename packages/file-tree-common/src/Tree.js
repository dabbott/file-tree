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

    if (metadata || ! _state.metadata) {
      _state.metadata = metadata || {}
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
      throw new Error(`Can't get path outside root`)
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
  addFile(filePath, stat) {
    return this.add(filePath, createFileNode(filePath, stat))
  }
  addDir(dirPath, stat) {
    const {rootPath} = this

    // console.log('add dir', dirPath, 'root', rootPath)
    if (! within(dirPath, rootPath) || dirPath === rootPath) {
      console.log('No need to add', dirPath)
      return
    }

    return this.add(dirPath, createDirectoryNode(dirPath, stat))
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
    const item = this.remove(oldPath)

    if (item) {
      this.moveMetadata(oldPath, newPath)
      this.add(newPath, item)

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
