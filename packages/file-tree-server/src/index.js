import EventEmitter from 'events'
import chokidar from 'chokidar'
import fs from 'fs-extra'

import { Tree, WorkQueue, eventAdapter, createAction } from 'file-tree-common'

const defaultOptions = {
  scan: false,
  stat: false,
  maxScannedFiles: 10000,
  plugins: [],
}

module.exports = class extends EventEmitter {

  constructor(transport, rootPath, options = defaultOptions) {
    super()

    if (options !== defaultOptions) {
      options = {...defaultOptions, ...options}
    }

    this.options = options
    this._applyPlugins(options.plugins)

    this._transport = transport

    this._workQueue = new WorkQueue(10)
    this._batchedActions = []

    this._tree = new Tree(rootPath)
    this._watcher = this._startWatcher(rootPath)

    this.rootPath = rootPath

    this._applyEventToTree = eventAdapter(this._tree)

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

  set rootPath(value) {
    this._rootPath = value
    this.emit('rootPath', value)
  }

  initialize() {
    const {tree, watcher, transport, _workQueue: workQueue} = this

    workQueue.on('finish', this._handleFinishQueue)
    transport.on('connection', this._handleConnection)

    tree.on('change', this._onTreeChange)
    tree.on('version', this.emit.bind(this, 'version'))
    watcher.on('all', this._onWatcherEvent)

    this.options.scan && this.scan()
  }

  _applyPlugins(plugins) {
    plugins.forEach(plugin => {
      Object.keys(plugin).forEach(key => {
        this.on(key, plugin[key])
      })
    })
  }

  _startWatcher(rootPath) {
    return chokidar.watch(rootPath, {
      persistent: true,
      depth: 0,
    })
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
  _onWatcherEvent = (name, path, stats) => {
    const {_workQueue: workQueue, options} = this

    const action = options.stat ?
      createAction('event', name, path, stats) :
      createAction('event', name, path)

    // Emit an event - consumers may change the action object
    this.emit('event', action)
    this._applyEventToTree(action.payload)

    // Enqueue the event. They are sent to clients in batches.
    workQueue.push(this._enqueueAction.bind(this, action))
  }

  // Emit an events during the recursive scan.
  // Don't push to the client though, since that hurts perf. Wait till the end.
  _onWalkerEvent = (item) => {
    const {options} = this
    const {path, stats} = item

    let name
    if (stats.isFile(path)) {
      name = 'add'
    } else if (stats.isDirectory(path)) {
      name = 'addDir'
    }

    const action = options.stat ?
      createAction('event', name, path, stats) :
      createAction('event', name, path)

    // Emit an event - consumers may change the action object
    this.emit('event', action)
    this._applyEventToTree(action.payload)
  }

  _enqueueAction = (action) => this._batchedActions.push(action)

  _sendState = (transport = this.transport) => {
    const {rootPath, tree} = this

    transport.send(createAction('initialState', tree.toJS(), rootPath))
  }

  scan() {
    const {rootPath, tree, transport, options} = this

    const stream = fs.walk(rootPath)
    let limit = options.maxScannedFiles

    stream.on('data', (item) => {
      this._onWalkerEvent(item)

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

    this.rootPath = rootPath
    tree.set(rootPath)

    if (reset) {
      watcher.close()
      this._watcher = this._startWatcher(rootPath)
    } else {
      watcher.add(rootPath)
    }

    this.options.scan && this.scan()
    this._sendState()
  }

}
