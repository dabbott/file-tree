
import EventEmitter from 'events'
import throttle from 'lodash.throttle'

const nextFrame = typeof window !== 'undefined' ?
  window.requestAnimationFrame.bind(window) :
  process.nextTick.bind(process)

export default class extends EventEmitter {
  constructor(wait = 0) {
    super()

    this.queue = []
    this.willRun = false

    this.run = this.run.bind(this)

    if (wait > 0) {
      this.enqueue = throttle(this.run, wait, {
        leading: false,
        trailing: true,
      })
    } else {
      this.enqueue = () => nextFrame(this.run)
    }
  }

  push(f) {
    const {queue} = this

    queue.push(f)

    if (! this.willRun) {
      this.willRun = true
      this.enqueue()
    }
  }

  run() {
    if (! this.willRun) {
      return
    }

    const {queue} = this
    const startTime = Date.now()

    this.willRun = false

    this.emit('start', queue.length)

    let i = 0
    while (i < queue.length) {
      queue[i]()
      i++

      // Yield control after 30ms
      if (Date.now() - startTime > 30) {
        this.willRun = true
        this.enqueue()
        break
      }
    }

    this.emit('finish', i)

    queue.splice(0, i)
  }
}
