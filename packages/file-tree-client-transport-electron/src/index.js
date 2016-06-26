import EventEmitter from 'events'

class Client extends EventEmitter {
  constructor(renderer) {
    super()

    this._renderer = renderer
  }

  on(eventName, f) {
    this._renderer.on(eventName, (event, arg) => {
      f(arg)
    })
  }

  send(action) {
    this._renderer.send('message', action)
  }
}

export default (ipcRenderer) => {
  ipcRenderer.send('connection')

  return new Client(ipcRenderer)
}
