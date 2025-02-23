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
