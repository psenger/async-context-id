## Winston Logger Integration

```javascript
const winston = require('winston');
const {AsyncContextId} = require('@psenger/async-context-id');

const tracker = new AsyncContextId()

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format((info) => {
            const context = tracker.getContext();
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

```

1. Logger Creation
```javascript
const logger = winston.createLogger({...})
```
This creates a new Winston logger instance with custom configuration.

2. Format Chain
```javascript
format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winston.format((info) => {...})()
)
```
This sets up a chain of formatters that process each log message:
- `timestamp()`: Adds a timestamp to each log entry
- `json()`: Converts the log message to JSON format
- Custom format function: Adds correlation ID and metadata

3. Custom Format Function
```javascript
winston.format((info) => {
    const context = tracker.getContext();
    return {
        ...info,              // Spreads existing log info
        correlationId: context?.correlationId || 'no-correlation-id',  // Adds correlation ID
        metadata: context?.metadata || {}      // Adds metadata
    };
})()
```
This adds the async context tracking to each log message:
- Gets current async context using the tracker
- Adds correlation ID (with fallback)
- Adds any metadata from the context
- Notice the `()` at the end - this immediately invokes the format function

4. Transport Configuration
```javascript
transports: [
    new winston.transports.Console()
]
```
Configures logger to output to console (could be extended to file, HTTP, etc.)

5. Usage Example
```javascript
logger.info('Processing request', { userId: '123' });
```
When this runs:
- The message and userId get merged into initial info object
- Timestamp gets added
- Correlation ID and metadata from current async context get added
- Everything gets converted to JSON
- The result gets written to console

The output combines all this information:
```javascript
{
    "message": "Processing request",
    "userId": "123",
    "correlationId": "123e4567...",
    "metadata": {},
    "timestamp": "2024-02-05T..."
}
```
