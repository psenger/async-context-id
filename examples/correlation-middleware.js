const {AsyncContextId} = require('../dist/index') // '@psenger/async-context-id'
const asyncContextId = new AsyncContextId()
const correlationMiddleware = () => (req, res, next) => {
  try {
    asyncContextId.clear()
    let correlationId = req.headers['x-correlation-id']
    correlationId = asyncContextId.setCorrelationId(correlationId)
    res.setHeader('x-correlation-id', correlationId)
    res.on('finish', () => {
      asyncContextId.clear()
    })
    next()
  } catch (error) {
    next(error)
  }
}
module.exports = correlationMiddleware
