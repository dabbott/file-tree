import EventEmitter from 'events'

import { Tree, WorkQueue, createAction, chokidarAdapter } from 'file-tree-common'

module.exports = class extends EventEmitter {

  get tree() {
    return this._tree
  }

  get transport() {
    return this._transport
  }

  get rootPath() {
    return this._rootPath
  }

  constructor(transport) {
    super()

    this._transport = transport

    this._emitEvent = this._emitAction.bind(this, "event")
    this._emitChange = this._emitAction.bind(this, "change")
    this._performAction = this._performAction.bind(this)

    this._tree = new Tree(undefined, { emitRelative: true })
    this._tree.on('change', this._emitChange)

    this._workQueue = new WorkQueue()
    this._workQueue.on('start', (taskCount) => {
      console.log('tasks =>', taskCount)
      this._tree.startTransaction()
    })
    this._workQueue.on('finish', this._tree.finishTransaction)

    this._actions = chokidarAdapter(this.tree)

    transport.on('message', this._performAction)
  }

  _performAction(action) {
    const {type, payload} = action

    switch (type) {
      case 'initialState': {
        const {rootPath, state: {tree, stat}} = payload
        this.tree.set(rootPath, tree, stat)
        break
      }
      case 'batch': {
        console.log('executing batch =>', payload.length)
        this.tree.startTransaction()
        payload.forEach(this._performAction)
        this.tree.finishTransaction()
        break
      }
      default: {
        const {path, stat} = payload
        const task = this._actions.bind(null, type, path, stat)
        console.log('task =>', type, path)
        this._workQueue.push(task)
      }
    }
  }

  updateNodeMetadata(path, field, value) {
    this._tree.setMetadataField(path, field, value)
  }

  _emitAction(type, ...args) {
    const action = createAction(type, ...args)
    this.emit(type, action)
  }
}
