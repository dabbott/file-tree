import EventEmitter from 'events'

export default class extends EventEmitter {
  constructor(browserWindow) {
    super()

    this._browserWindow = browserWindow

    this.initialize()
  }

  get browserWindow() {
    return this._browserWindow
  }

  initialize() {
    const {browserWindow} = this

    browserWindow.on('ipc-message', (event, [name, action]) => {
      switch (name) {
        case 'message': {
          this.emit('message', action)
          break
        }
        case 'disconnect': {
          this.emit('disconnect')
          break
        }
      }
    })
  }

  send(action) {
    const {browserWindow} = this

    browserWindow.send('message', action)
  }
}
