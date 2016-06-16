import path from 'path'
import EventEmitter from 'events'

import { split, within } from './utils/pathUtils'
import { ensureNode, createFileNode, createDirectoryNode } from './utils/treeUtils'

class Tree extends EventEmitter {
  constructor(rootPath = '/', options = {}) {
    super()

    this.emitChange = this.emitChange.bind(this)
    this.startTransaction = this.startTransaction.bind(this)
    this.finishTransaction = this.finishTransaction.bind(this)

    this.inTransaction = false
    this.state = {
      version: 0,
    }
    this.options = options

    this.set(rootPath)
  }
  set(rootPath, tree, stat, metadata) {
    this.rootPath = rootPath

    const {state} = this

    this.startTransaction()

    if (tree || ! state.tree) {
      state.tree = tree || ensureNode(rootPath)
    }

    if (stat || ! state.stat) {
      state.stat = stat || {}
    }

    if (metadata || ! state.metadata) {
      state.metadata = metadata || {}
    }

    this.finishTransaction()
  }
  emitChange() {
    if (this.inTransaction) {
      return
    }

    const {options, state} = this

    state.version++

    if (options.emitRelative) {
      const {metadata, stat} = state

      this.emit('change', {
        ...state,
        tree: this.get(this.rootPath),
      })
    } else {
      this.emit('change', state)
    }
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
    const {state: {tree}, rootPath} = this

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

    this.emitChange()

    return item
  }
  setMetadataField(itemPath, field, value) {
    let metadata = this.state.metadata[itemPath]

    if (! metadata) {
      metadata = this.state.metadata[itemPath] = {}
    }

    metadata[field] = value

    this.emitChange()
  }
  removeFile(itemPath) {
    this.remove(itemPath)
  }
  removeDir(itemPath) {
    this.remove(itemPath)
  }
  toJS() {
    return this.state
  }
}

export default Tree
