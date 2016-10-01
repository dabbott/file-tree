import EventEmitter from 'events'
import chokidar from 'chokidar'
import fs from 'fs-extra'

import { Tree, WorkQueue, chokidarAdapter, walkAdapter, createAction } from 'file-tree-common'

const defaultOptions = {
  scan: false,
  maxScannedFiles: 10000,
}

module.exports = class extends EventEmitter {

  constructor(transport, rootPath, options = defaultOptions) {
    super()

    if (options !== defaultOptions) {
      options = {...defaultOptions, ...options}
    }

    this.options = options

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
    const {tree, watcher, transport, _workQueue: workQueue} = this

    workQueue.on('finish', this._handleFinishQueue)
    transport.on('connection', this._handleConnection)

    tree.on('change', this._onTreeChange)
    watcher.on('all', this._onWatcherEvent.bind(this, chokidarAdapter(tree)))

    this.options.scan && this.scan()
  }

  // Emit a change event when the tree changes
  _onTreeChange = () => {
    const {tree} = this

    if (this.listenerCount('change') > 0) {
      const action = createAction('change', tree.toJS())
      this.emit('change', action)
    }
  }

  // Emit an event on watcher updates
  _onWatcherEvent = (updater, name, path, stat) => {
    const {_workQueue: workQueue} = this

    const action = createAction('event', name, path, stat)

    this.emit('event', action)

    // Update the tree
    updater(name, path, stat)

    // Enqueue the event. They are sent to clients in batches.
    workQueue.push(this._enqueueAction.bind(this, action))
  }

  _enqueueAction = (action) => this._batchedActions.push(action)

  _sendState = (transport = this.transport) => {
    const {rootPath, tree} = this

    transport.send(createAction('initialState', tree.toJS(), rootPath))
  }

  scan() {
    const {rootPath, tree, transport, options} = this
    const updateTree = walkAdapter(tree)

    const stream = fs.walk(rootPath)
    let limit = options.maxScannedFiles

    stream.on('data', (item) => {
      updateTree(item)

      if (limit-- < 0) {
        stream.pause()
        this._sendState()
        console.log(`WARNING: file-tree-server walked over ${options.maxScannedFiles} paths, stopping.`)
      }
    })

    // Update all clients, since we may have discovered thousands of new paths
    stream.on('end', () => this._sendState())
  }

  _handleFinishQueue = () => {
    const {transport, _batchedActions: batchedActions} = this
    const actions = batchedActions.slice()
    const batchAction = createAction('batch', actions)

    batchedActions.length = 0
    transport.send(batchAction)
  }

  _handleConnection = (client) => {
    const {tree, rootPath} = this

    // console.log('connection')

    client.on('message', this._handleMessage.bind(this, client))

    if (rootPath) {
      this._sendState(client)
    }
  }

  _handleMethodSideEffects(methodName, args) {
    const {rootPath, tree, watcher} = this
    switch(methodName) {
      case 'rename': {
        const [oldPath, newPath] = args
        if (newPath != rootPath && watcher.getWatched()[oldPath]) {
          watcher.add(newPath)
        }
        break
      }
    }
  }

  _handleMessage(client, action) {
    const {rootPath, tree, watcher} = this
    const {type, payload, meta} = action

    // console.log('message', action)

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
          this._handleMethodSideEffects(methodName, args)

          // console.log('done', methodName, id, err, data)

          client.send(createAction('response', id, err, data))

          // If the operation failed, the client may be in a bad state.
          // Push the server's accurate state to reset the client.
          if (err) {
            this._sendState(client)
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

    this.options.scan && this.scan()
    this._sendState()
  }

}
