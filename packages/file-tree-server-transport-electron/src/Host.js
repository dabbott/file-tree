import EventEmitter from 'events'

import Client from './Client'

export default class extends EventEmitter {
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

    main.on('connection', this.handleConnection.bind(this))
  }

  handleConnection(event) {
    const {connections} = this
    const client = new Client(event.sender)

    client.on('disconnect', () => {
      this.handleDisconnect(client)
    })

    connections.push(client)
    this.emit('connection', client)
  }

  handleDisconnect(client) {
    const {connections} = this
    const index = connections.indexOf(client)

    if (index !== -1) {
      connections.splice(index, 1)
    }

    client.removeAllListeners()
  }

  send(message) {
    const {connections} = this

    connections.forEach((conn) => {
      conn.send(message)
    })
  }
}
