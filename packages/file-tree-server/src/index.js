import path from 'path'
import EventEmitter from 'events'
import chokidar from 'chokidar'

import { Tree, chokidarAdapter } from 'file-tree-common'

const actions = {
  initialState: (state, rootPath) => {
    return {
      type: "initialState",
      payload: { state, rootPath },
    }
  },
  change: (state) => {
    return {
      type: "change",
      payload: state,
    }
  },
  event: (name, path, stat) => {
    return {
      type: name,
      payload: { path, stat },
    }
  },
}

const createAction = (type, ...args) => actions[type](...args)

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

    this._emitEvent = this._emitAction.bind(this, "event")
    this._emitChange = this._emitAction.bind(this, "change")

    this.watch(rootPath)

    this.transport.on('connection', () => {
      const {tree: {state}, rootPath} = this
      this.transport.send(createAction("initialState", state, rootPath))
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

  _emitAction(type, ...args) {
    const action = createAction(type, ...args)
    this.transport.send(action)
    this.emit(type, action)
  }
}
