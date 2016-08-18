import EventEmitter from 'events'
import chokidar from 'chokidar'
import fs from 'fs-extra'

import { Tree, WorkQueue, chokidarAdapter, createAction } from 'file-tree-common'

module.exports = class extends EventEmitter {

  constructor(transport, rootPath) {
    super()

    this._transport = transport
    this._rootPath = rootPath

    this._workQueue = new WorkQueue(10)
    this._batchedActions = []

    this._tree = new Tree(rootPath)
    this._watcher = chokidar.watch(rootPath, {
      persistent: true,
      depth: 0,
    })

    this.initialize()
  }

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

  initialize() {
    const {rootPath, tree, watcher, transport, _workQueue: workQueue, _batchedActions: batchedActions} = this
    const updateTree = chokidarAdapter(tree, true)
    const enqueueAction = (action) => batchedActions.push(action)

    workQueue.on('finish', this.handleFinishQueue.bind(this))
    transport.on('connection', this.handleConnection.bind(this))

    tree.on('change', () => {
      const action = createAction('change', tree.toJS())

      this.emit('change', action)
    })

    watcher.on('all', (name, path, stat) => {
      const action = createAction('event', name, path, stat)

      this.emit('event', action)

      // Update the tree
      updateTree(name, path, stat)

      // Enqueue the event. They are sent to clients in batches.
      workQueue.push(enqueueAction.bind(this, action))
    })
  }

  handleFinishQueue() {
    const {transport, _batchedActions: batchedActions} = this
    const actions = batchedActions.slice()
    const batchAction = createAction('batch', actions)

    batchedActions.length = 0
    transport.send(batchAction)
  }

  handleConnection(client) {
    const {tree, rootPath} = this

    console.log('connection')

    client.on('message', this.handleMessage.bind(this, client))

    if (rootPath) {
      client.send(createAction("initialState", tree.toJS(), rootPath))
    }
  }

  handleMethodSideEffects(methodName, args) {
    const {rootPath, tree, watcher} = this
    switch(methodName) {
      case 'rename':
        const [oldPath, newPath] = args
        if (newPath != rootPath && watcher.getWatched()[oldPath]) {
          watcher.add(newPath)
        }
        break;
    }
  }

  handleMessage(client, action) {
    const {rootPath, tree, watcher} = this
    const {type, payload, meta} = action

    console.log('message', action)

    switch (type) {
      case 'watchPath': {
        const {path} = payload

        // Don't watch the root again... strange behavior
        if (path === '/' && watcher.getWatched()[path]) {
          break
        }

        watcher.add(path)
        break
      }
      case 'rootPath': {
        const {path} = payload
        this.setRootPath(path)
        break
      }
      case 'request': {
        const {methodName, args} = payload
        const {id} = meta

        // Perform a fs operation
        fs[methodName](...args, (err, data) => {
          this.handleMethodSideEffects(methodName, args)

          console.log('done', methodName, id, err, data)

          client.send(createAction('response', id, err, data))

          // If the operation failed, the client may be in a bad state.
          // Push the server's accurate state to reset the client.
          if (err) {
            client.send(createAction('initialState', tree.toJS(), rootPath))
          }
        })
        break
      }
    }
  }

  setRootPath(rootPath, reset) {
    const {watcher, tree, transport} = this
    
    if (reset) {
      watcher.close()
      this._rootPath = rootPath
      tree.set(rootPath)
      this._watcher = chokidar.watch(rootPath, {
        persistent: true,
        depth: 0,
      })
    } else {
      // Set new root path
      this._rootPath = rootPath
      tree.set(rootPath)
      watcher.add(rootPath)
    }

    // Update all clients to new tree
    transport.send(createAction('initialState', tree.toJS(), rootPath))
  }

}
