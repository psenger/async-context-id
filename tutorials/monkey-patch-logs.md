Implementing a custom logging system that modifies the default console logging behavior (commonly referred to as Monkey Patching).

```javascript
const fs = require('fs')
const path = require('path')
const util = require('util')
const {AsyncContextId} = require('../dist/index')
const TRACKER = new AsyncContextId()
const logFile = path.join(__dirname, 'app.log')
const original = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.debug,
  info: console.info
}
try {
  if (fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, '')
  }
} catch (err) {
  console.error('Error handling log file:', err)
}
function formatApacheErrorTimestamp(date = new Date()) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `[${days[date.getDay()]} ${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')} ` +
    `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:` +
    `${String(date.getSeconds()).padStart(2, '0')}.${String(date.getMilliseconds()).padStart(3, '0')} ` +
    `${date.getFullYear()}]`
}
Object.keys(original).forEach(method => {
  console[method] = function (...args) {
    const prefix = `${formatApacheErrorTimestamp()} [${method.toLowerCase()}] [${TRACKER.getContext().correlationId}] ${TRACKER.getContext()?.metadata?.fullName} `
    if (typeof args[0] === 'string') {
      args[0] = prefix + args[0]
    } else {
      args.unshift(prefix)
    }
    original[method].apply(console, args)
    fs.appendFileSync(logFile, util.format(...args) + '\n')
  }
})
```

Let's go through it step by step:

1. Initial Setup:
```javascript
const fs = require('fs')
const path = require('path')
const util = require('util')
const {AsyncContextId} = require('../dist/index')
const TRACKER = new AsyncContextId()
const logFile = path.join(__dirname, 'app.log')
```

This imports necessary modules

2. Backup Original Console Methods:
```javascript
const original = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.debug,
  info: console.info
}
```
This preserves the original console methods before overriding them. This is a common pattern when you want to modify built-in functionality while keeping access to the original behavior.

3. Log File Initialization:
```javascript
try {
  if (fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, '')
  }
} catch (err) {
  console.error('Error handling log file:', err)
}
```
This clears the log file if it exists, effectively starting with a fresh log each time the application runs. At this point you could implement a log rotation, but that is out of scope and can be handled by other means.

4. Apache-style Timestamp Formatter:
```javascript
function formatApacheErrorTimestamp(date = new Date()) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `[${days[date.getDay()]} ${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')} ...`
}
```
This creates timestamps in Apache log format, e.g., `[Sun Feb 23 14:30:45.123 2025]`

5. Console Method Override:
```javascript
Object.keys(original).forEach(method => {
  console[method] = function (...args) {
    const prefix = `${formatApacheErrorTimestamp()} [${method.toLowerCase()}] [${TRACKER.getContext().correlationId}] ${TRACKER.getContext()?.metadata?.fullName} `
```
This is the core of the functionality. For each console method (log, error, warn, etc.), it:
- Creates a prefix containing:
  - Timestamp
  - Log level (e.g., "log", "error")
  - Correlation ID from the async context tracker
  - Full name from context metadata

6. Log Message Handling:
```javascript
    if (typeof args[0] === 'string') {
      args[0] = prefix + args[0]
    } else {
      args.unshift(prefix)
    }
    original[method].apply(console, args)
    fs.appendFileSync(logFile, util.format(...args) + '\n')
```
This section:
- Adds the prefix to the first argument if it's a string, or prepends it as a new argument
- Calls the original console method with the modified arguments
- Writes the formatted log message to the log file

The end result is that all console logging will:
1. Include detailed contextual information (timestamp, log level, correlation ID, user name)
2. Show up in both the console AND the log file
3. Maintain the original console formatting capabilities

For example, if you called:
```javascript
console.log('User logged in')
```
It might output something like:
```
[Sun Feb 23 14:30:45.123 2025] [log] [abc123] John Doe User logged in
```

Because this modifies a global library it is advisable to do this immediately. For example
if you had this in an express app, right after you import everything.

```javascript
const express = require('express')
const app = express()
const router = express.Router()
const {systemTimer} = require('./timer')
const controller = require('./controller')
const correlationMiddleware = require('./correlation-middleware')
require('./monkey-patch-logs')
systemTimer()
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(correlationMiddleware())
router.post('/:id', controller)
app.use('/', router)
module.exports = app
```

This is extremely useful for:
- Debugging asynchronous operations (via correlation IDs)
- Maintaining audit trails
- Troubleshooting production issues
- Tracking user actions

