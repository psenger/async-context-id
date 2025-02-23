const EventEmitter = require('events');
const {initiatedTimer} = require('./timer')

class DetachedProcessor extends EventEmitter {
  constructor() {
    super()
  }
  process(id) {
    console.log(`${id} emit`)
    this.emit('processReceived', { id })
  }
}

const processor = new DetachedProcessor()

const run = async (id) => {
  await new Promise(resolve => {
    initiatedTimer(id)
    setTimeout(resolve, 1000)
  })
  console.log(`${id} event+promise-chain`)
}

processor.on('processReceived', async ({id}) => {
  console.log(`${id} event`)
  await run(id)
})

module.exports = processor
