## Usage

### Enhanced Logging with Console Monkey Patching

This example demonstrates how to automatically inject correlation IDs into console logs
using [monkey patching](https://en.wikipedia.org/wiki/Monkey_patch). The code below
intercepts standard console methods and prepends each log message with its log level
and correlation ID.

eg `LOG-LEVEL CORRELATION-ID`

<!--START_CODE_FENCE_SECTION:javascript:file:examples/monkey-patch-logs.js-->
<!--END_CODE_FENCE_SECTION:javascript:file:examples/monkey-patch-logs.js-->

### Express Middleware

This Express middleware automatically manages correlation IDs across HTTP requests. It
extracts the correlation ID from incoming request headers, propagates it through the
request lifecycle, and includes it in the response headers.

**Note:** Register this middleware early in your Express application's middleware chain
to ensure correlation IDs are available throughout the entire request lifecycle.

#### `correlation-middleware.js`

<!--START_CODE_FENCE_SECTION:javascript:file:examples/correlation-middleware.js-->
<!--END_CODE_FENCE_SECTION:javascript:file:examples/correlation-middleware.js-->

#### `app.js`

<!--START_CODE_FENCE_SECTION:javascript:file:examples/app.js-->
<!--END_CODE_FENCE_SECTION:javascript:file:examples/app.js-->

#### `simple-controller.js`

<!--START_CODE_FENCE_SECTION:javascript:file:examples/simple-controller.js-->
<!--END_CODE_FENCE_SECTION:javascript:file:examples/simple-controller.js-->

### Winston Logger Integration

<!--START_CODE_FENCE_SECTION:javascript:file:examples/winston-logger.js-->
<!--END_CODE_FENCE_SECTION:javascript:file:examples/winston-logger.js-->

## ‼️ Caution - Memory Management Strategies

All scaling systems degrade when affected by memory leaks. This module hosts a single map
and addresses such leaks through two configurable Map implementations for context tracking:

* LRU (Least Recently Used) Map
* Timed Map

These maps can be configured during AsyncContextId initialization. As AsyncContextId operates
as a singleton, the map implementation must be set at creation and remains immutable.

## ‼️ Caution - Correlation ID with `UUID`

The default implementation of correlation ID uses non-cryptographic UUID generation to prevent recursive
async hook triggers that would otherwise occur with Node's Crypto module (internal crypto operations
would initiate new async hooks). Since this is based on UUID v4, it may be necessary for consumers
to increase the complexity of the correlation ID. Therefore, this functionality has been exposed as
an option ( `correlationIdFn` ).

e.g.
```javascript
// Safe UUID v4 implementation without Crypto
generateCorrelationId() {
  if (this.correlationIdFn) {
    return this.correlationIdFn()
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
```

## ‼️ Limitations

The async hooks implementation tracks context through EventEmitters, Timers, and Node.js
core callbacks. However, as async hooks remain experimental, context propagation should be
tested extensively in production like scenarios. In the event that something does not work as
expected, there are some untested patterns and suggested work around. Remember it is better
to error on the side of caution rather than create a memory leak.

### Untested pattern - **Process Next Tick**

```javascript
process.nextTick(() => {
    // context may get lost
    const context = tracker.getContext(); // will create new context
});
```

### Untested pattern - **Node.js Core Module Callbacks** (like fs, http, etc.):

```javascript
const fs = require('fs');
fs.readFile('somefile.txt', (err, data) => {
    // context may get lost
    const context = tracker.getContext(); // will create new context
});
```

### Solution to Untested pattern

Despite the untested patterns, these callbacks can be wrapped and bound. Word of caution, Arrow Functions
can not be bound therefore, you must use `function` declaration.

```javascript
class CorrelationTracker {
    bindCallback(fn) {
        const currentContext = this.getContext();
        return (...args) => {
            const asyncId = asyncHooks.executionAsyncId();
            this.correlationStore.set(asyncId, JSON.parse(JSON.stringify(currentContext)));
            try {
                return fn(...args);
            } finally {
                this.correlationStore.delete(asyncId);
            }
        };
    }
}

// Usage:
emitter.on('someEvent', tracker.bindCallback(() => {
    // context is preserved
    const context = tracker.getContext();
}));
```

2. Or use the async_hooks executionAsyncResource when available:

```javascript
const asyncHooks = require('async_hooks');
const { AsyncResource } = require('async_hooks');

class TrackedEmitter extends EventEmitter {
    emit(event, ...args) {
        const asyncResource = new AsyncResource(event);
        return asyncResource.runInAsyncScope(() => {
            return super.emit(event, ...args);
        });
    }
}
```
