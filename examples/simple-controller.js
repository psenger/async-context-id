const {AsyncContextId} = require('../dist/index') // '@psenger/async-context-id'
const TRACKER = new AsyncContextId()
module.exports = function (req, res) {
  const id = req.params.id
  const correlationId = TRACKER.getContext().correlationId
  console.log(`${correlationId} saw ${id} in controller`)
  TRACKER.setContext({
    metadata: {
      id,
    }
  })
  // do something else here which will expose meta upstream
}
