
import EventEmitter from 'events'
import throttle from 'lodash.throttle'

const nextFrame = typeof window !== 'undefined' ?
  window.requestAnimationFrame.bind(window) :
  process.nextTick.bind(process)

export default class extends EventEmitter {
  constructor(wait = 0) {
    super()

    this.run = this.run.bind(this)

    if (wait > 0) {
      this.enqueue = throttle(this.run, wait, {
        leading: false,
        trailing: true,
      })
    } else {
      this.enqueue = () => nextFrame(this.run)
    }

    this.queue = []
    this.willRun = false
  }

  push(f) {
    this.queue.push(f)

    if (! this.willRun) {
      this.willRun = true
      this.enqueue()
    }
  }

  run() {
    if (! this.willRun) {
      return
    }

    this.willRun = false

    const startTime = Date.now()

    this.emit('start', this.queue.length)

    let i = 0
    while (i < this.queue.length) {
      this.queue[i]()
      const elapsed = Date.now() - startTime

      i++

      if (elapsed > 30) {
        console.log('elapsed =>', elapsed, i)
        this.willRun = true
        this.enqueue()
        break
      }
    }

    this.emit('finish', i)

    this.queue.splice(0, i)
  }
}
