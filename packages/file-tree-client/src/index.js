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

  get metadata() {
    return this._tree.state.metadata
  }

  constructor(transport) {
    super()

    this._transport = transport

    this._emitEvent = this._emitAction.bind(this, "event")
    this._emitChange = this._emitAction.bind(this, "change")
    this._performAction = this._performAction.bind(this)
    this.startOperation = this.startOperation.bind(this)
    this.finishOperation = this.finishOperation.bind(this)

    this._tree = new Tree()
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
      case 'event': {
        const {name, path, stat} = payload
        const task = this._actions.bind(null, name, path, stat)
        console.log('task =>', name, path)
        this._workQueue.push(task)
        break
      }
    }
  }

  startOperation() {
    this._tree.startTransaction()
  }

  finishOperation() {
    this._tree.finishTransaction()
  }

  updateNodeMetadata(path, field, value) {
    this._tree.setMetadataField(path, field, value)
  }

  watchPath(path) {
    this._transport.send({
      type: 'watchPath',
      payload: { path },
    })
  }

  _emitAction(type, ...args) {
    const action = createAction(type, ...args)
    this.emit(type, action)
  }
}
