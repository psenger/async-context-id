const {AsyncContextId} = require('../dist/index') // '@psenger/async-context-id'
const TRACKER = new AsyncContextId()
const PROCESSOR = require('./detached-processor')
const randomError = () => {
  if (Math.floor(Math.random() * 10) + 1 === 1) {
    throw new Error('self inflicted gunshot wound')
  }
}
module.exports = function (req, res) {
  const id = req.params.id
  const fullName = req.body.fullName || 'Unknown User'
  TRACKER.setContext({
    metadata: {
      id,
      fullName
    }
  })
  console.log(`${id} controller`)
  Promise.resolve()
    .then(async () => {
      console.log(`${id} controller+promise-chain`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      PROCESSOR.process(id)
      randomError()
      res.json({correlationId: TRACKER.getContext().correlationId})
    })
    .catch(() => {
      console.error(`${id} controller+promise-catch`)
      res.json({correlationId: TRACKER.getContext().correlationId})
    })
}
