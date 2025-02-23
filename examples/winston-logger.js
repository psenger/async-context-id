const winston = require('winston')
const {AsyncContextId} = require('../dist/index') // '@psenger/async-context-id'

const TRACKER = new AsyncContextId()

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winston.format((info) => {
      const context = TRACKER.getContext();
      return {
        ...info,
        correlationId: context?.correlationId || 'no-correlation-id',
        metadata: context?.metadata || {}
      };
    })()
  ),
  transports: [
    new winston.transports.Console()
  ]
});
