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

    this._tree = new Tree(undefined, { emitRelative: true })
    this._tree.on('change', this._emitChange)

    transport.on('message', (action) => {
      const {type, payload} = action

      switch (type) {
        case 'initialState': {
          const {rootPath, state: {tree, stat}} = payload
          this.tree.set(rootPath, tree, stat)
          break
        }
        default: {
          const {path, stat} = payload
          chokidarAdapter(this.tree, true)(type, path, stat)
        }
      }
    })
  }

  _emitAction(type, ...args) {
    const action = createAction(type, ...args)
    this.emit(type, action)
  }
}
