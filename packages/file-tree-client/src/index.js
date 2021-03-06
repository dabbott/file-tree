import EventEmitter from 'events'

import { Tree, WorkQueue, createAction, eventAdapter, fsAdapter, treeUtils } from 'file-tree-common'

let requestId = 0
const getRequestId = () => ++requestId

module.exports = class extends EventEmitter {

  constructor(transport) {
    super()

    this._transport = transport

    this._requestMap = {}
    this._tree = new Tree()
    this._workQueue = new WorkQueue()
    this._updateTreeOnEvent = eventAdapter(this._tree)
    this._updateTreeOnFSRequest = fsAdapter(this._tree)

    this._emitChange = this._emitAction.bind(this, "change")
    this._performAction = this._performAction.bind(this)
    this.startOperation = this.startOperation.bind(this)
    this.finishOperation = this.finishOperation.bind(this)

    this.initialize()
  }

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

  initialize() {
    const {transport, tree, _workQueue: workQueue} = this

    tree.on('change', this._emitChange)
    tree.on('version', this.emit.bind(this, 'version'))
    transport.on('message', this._performAction)

    workQueue.on('start', (taskCount) => {
      console.log('tasks =>', taskCount)
      tree.startTransaction()
    })
    workQueue.on('finish', tree.finishTransaction)
  }

  _emitAction(type, ...args) {
    const action = createAction(type, ...args)
    this.emit(type, action)
  }

  _performAction(action) {
    const {tree, _workQueue: workQueue, _requestMap: requestMap} = this
    const {type, payload, error, meta} = action

    switch (type) {
      case 'initialState': {
        console.log('loading initial tree', tree)
        const {rootPath, state: {tree, stat, metadata}} = payload

        this.tree.set(rootPath, tree, stat, metadata)
        break
      }
      case 'batch': {
        console.log('executing batch =>', payload.length)
        tree.startTransaction()
        payload.forEach(this._performAction)
        tree.finishTransaction()
        break
      }
      case 'event': {
        const task = this._updateTreeOnEvent.bind(null, action.payload)

        console.log('task =>', action.payload)
        this.emit(action)
        workQueue.push(task)
        break
      }
      case 'response': {
        const {id} = meta

        requestMap[id][error ? 'reject' : 'resolve'](payload)
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

  run(methodName, ...args) {
    const id = getRequestId()

    // Assume operation occurs successfully.
    // On failure, the server will push a fresh state.
    this._updateTreeOnFSRequest(methodName, ...args)

    // Run the operation on the server
    this._transport.send(createAction('request', id, methodName, args))

    return new Promise((resolve, reject) => {
      this._requestMap[id] = {resolve, reject}
    })
  }

  watchPath(path) {
    this._transport.send(createAction('watchPath', path))
  }

  setRootPath(path, reset) {
    this._transport.send(createAction('rootPath', path, reset))
  }

  filter(f, limit) {
    const {tree: {state: {tree}}} = this

    return treeUtils.filter(tree, f, limit)
  }

  search(matcher, type, limit) {
    const {tree: {state: {tree}}} = this

    return treeUtils.search(tree, matcher, type, limit)
  }
}
