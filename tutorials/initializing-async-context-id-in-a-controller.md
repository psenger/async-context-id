In this tutorial, new the AsyncContextId and inject
into the metadata, some data that down stream processes
can fetch.

Latter, add the `correlationId` to the logs.

`clear` ensures no lingering data remains.

```javascript
// Get the singleton instance,
const {AsyncContextId} = require('@psenger/async-context-id');
const tracker = new AsyncContextId();

async function processRequest(req, res) {
  try {
    // Set correlation ID from upstream service
    if (req.headers['x-correlation-id']) {
      tracker.setCorrelationId(req.headers['x-correlation-id']);
    }

    // Add request context
    tracker.setContext({
      metadata: {
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent']
      }
    });

    const result = await processData(req.body);

    // Log with context
    const context = tracker.getContext();
    console.log('Request processed', {
      correlationId: context.correlationId,
      duration: Date.now() - context.startTime,
      metadata: context.metadata
    });

    res.json(result);
  } finally {
    // Clean up context
    tracker.clear();
  }
}
```
