
import EventEmitter from 'events'

const nextFrame = typeof window !== 'undefined' ?
  window.requestAnimationFrame.bind(window) :
  process.nextTick.bind(process)

export default class extends EventEmitter {
  constructor(queue = []) {
    super()

    this.run = this.run.bind(this)

    this.queue = queue
    this.willRun = false
  }

  push(f) {
    this.queue.push(f)

    if (! this.willRun) {
      this.willRun = true
      nextFrame(this.run)
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
        console.log(elapsed, i)
        this.willRun = true
        nextFrame(this.run)
        break
      }
    }

    this.emit('finish', i)

    this.queue.splice(0, i)
  }
}
