import EventEmitter from 'events'

class Client extends EventEmitter {
  constructor(browserWindow) {
    super()

    this._browserWindow = browserWindow
  }

  send(action) {
    console.log('sending', arguments)
    this._browserWindow.send('message', action)
  }
}

class Host extends EventEmitter {
  constructor(main) {
    super()

    this._main = main
    this._connections = []

    this.initialize()
  }

  get main() {
    return this._main
  }

  get connections() {
    return this._connections
  }

  initialize() {
    const {main, connections} = this

    main.on('connection', (event, arg) => {
      console.log('connection event', event, arg)
      const client = new Client(event.sender)

      connections.push(client)

      this.emit('connection', client)
    })
  }

  send(message) {
    const {connections} = this

    connections.forEach((conn) => {
      conn.send(message)
    })
  }
}

export default (ipcMain) => {
  return new Host(ipcMain)
}
