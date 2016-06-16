import EventEmitter from 'events'
import chokidar from 'chokidar'

import { Tree, WorkQueue, chokidarAdapter, createAction } from 'file-tree-common'

module.exports = class extends EventEmitter {

  get watcher() {
    return this._watcher
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

  constructor(rootPath, transport) {
    super()

    this._rootPath = rootPath
    this._transport = transport

    this._workQueue = new WorkQueue(10)
    this._batchedActions = []

    this._workQueue.on('finish', () => {
      // console.log('this._batchedActions', this._batchedActions)

      this.transport.send({
        type: 'batch',
        payload: this._batchedActions.slice(),
      })

      this._batchedActions.length = 0
    })

    this._emitEvent = this._emitAction.bind(this, "event")
    this._emitChange = this._emitAction.bind(this, "change")

    this.watch(rootPath)

    this.transport.on('connection', (socket) => {
      console.log('connection')
      const {tree: {state}, rootPath} = this
      socket.send(createAction("initialState", state, rootPath))

      socket.on('message', (action) => {
        console.log('message', action)
        const {type, payload} = action

        switch (type) {
          case 'watchPath': {
            const {path} = payload
            this.watcher.add(path + '/')
            console.log('watching path', path)
            break
          }
        }
      })
    })
  }

  watch(rootPath) {
    this._watcher = chokidar.watch(rootPath, {
      persistent: true,
      depth: 0,
    })

    this._tree = new Tree(rootPath)
    this._tree.on('change', this._emitChange)

    this._watcher.on('all', chokidarAdapter(this._tree, true))
    this._watcher.on('all', this._emitEvent)
  }

  _batchAction(batch, action) {
    // console.log('adding', action.type, 'to batch', batch.length)
    batch.push(action)
  }

  _emitAction(type, ...args) {
    const action = createAction(type, ...args)

    switch (type) {
      // case 'change': {
      //   this.transport.send(action)
      //   break
      // }
      case 'event': {
        this._workQueue.push(
          this._batchAction.bind(this, this._batchedActions, action)
        )
      }
    }

    this.emit(type, action)
  }
}
