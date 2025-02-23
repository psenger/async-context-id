## Node Native http example of passing a correlation id down stream

```javascript

const http = require('http')
const {v4: uuidv4} = require('uuid')

const TARGET_HOST = 'localhost'
const TARGET_PORT = 3000

const agent = new http.Agent({
  keepAlive: true,
})

function postRequest() {
  const correlationId = uuidv4();

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      msg: 'some random message'
    });

    const options = {
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      path: `/${correlationId}`,
      method: 'POST',
      agent: agent,
      headers: {
        'x-correlation-id': correlationId,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        console.log(`Completed request ${correlationId}`)
        resolve({correlationId, status: res.statusCode, data})
      })
    })

    req.on('error', (error) => {
      console.error(`Error for request ${correlationId}:`, error.message)
      reject(error)
    })

    req.write(postData)
    req.end()
  })
}

postRequest()
  .then((data) => {
    console.log(JSON.stringify(data, null, 4))
    process.exit(0)
  })
  .catch(console.error)
```

1. Initial Setup
```javascript
const http = require('http')
const {v4: uuidv4} = require('uuid')
```
This imports the built-in Node.js HTTP module and the UUID v4 generator from the uuid package. UUID v4 generates random unique identifiers.

2. Configuration Constants
```javascript
const TARGET_HOST = 'localhost'
const TARGET_PORT = 3000
```
These define where the HTTP requests will be sent - in this case, to localhost on port 3000.

3. HTTP Agent Setup
```javascript
const agent = new http.Agent({
  keepAlive: true,
})
```
Creates an HTTP agent that keeps connections alive for reuse, which is more efficient than creating new connections for each request.

4. The Main Request Function
```javascript
function postRequest() {
  const correlationId = uuidv4();
```
Defines a function that generates a unique ID for tracking each request.

5. Promise Wrapper
```javascript
  return new Promise((resolve, reject) => {
```
Wraps the HTTP request in a Promise to handle asynchronous operations.

6. Request Data Preparation
```javascript
    const postData = JSON.stringify({
      msg: 'some random message'
    });
```
Creates the JSON payload to send in the POST request.

7. Request Configuration
```javascript
    const options = {
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      path: `/${correlationId}`,
      method: 'POST',
      agent: agent,
      headers: {
        'x-correlation-id': correlationId,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }
```
Sets up the HTTP request configuration including:
- The target URL and port
- The request path (includes the correlation ID)
- The HTTP method (POST)
- Headers including content type and length
- Most importantly, the `x-correlation-id` is passed to the server.

8. Request Creation and Response Handling
```javascript
    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        console.log(`Completed request ${correlationId}`)
        resolve({correlationId, status: res.statusCode, data})
      })
    })
```
Creates the request and handles the response:
- Collects response data chunks as they arrive
- When all data is received, resolves the promise with the results

9. Error Handling
```javascript
    req.on('error', (error) => {
      console.error(`Error for request ${correlationId}:`, error.message)
      reject(error)
    })
```
Sets up error handling for the request.

10. Request Completion
```javascript
    req.write(postData)
    req.end()
```
Sends the POST data and signals that the request is complete.

11. Result Processing
```javascript
postRequest()
  .then((data) => {
    console.log(JSON.stringify(data, null, 4))
    process.exit(0)
  })
  .catch(console.error)
```
Executes the request and:
- Pretty prints the response data if successful
- Exits the process with success code 0
- Logs any errors that occur

This code makes a single HTTP POST request to a local server and tracks it using a correlation ID.

## Node with Axios example of passing a correlation id down stream

```javascript
const axios = require('axios')
const {v4: uuidv4} = require('uuid')

const TARGET_HOST = 'localhost'
const TARGET_PORT = 3000

const client = axios.create({
  baseURL: `http://${TARGET_HOST}:${TARGET_PORT}`,
  timeout: 5000,
})

async function postRequest() {
  const correlationId = uuidv4();

  try {
    const response = await client.post(`/${correlationId}`, {
      msg: 'some random message'
    }, {
      headers: {
        'x-correlation-id': correlationId
      }
    })

    console.log(`Completed request ${correlationId}`)
    return {
      correlationId,
      status: response.status,
      data: response.data
    }
  } catch (error) {
    console.error(`Error for request ${correlationId}:`, error.message)
    throw error
  }
}

postRequest()
  .then((data) => {
    console.log(JSON.stringify(data, null, 4))
    process.exit(0)
  })
  .catch(console.error)
```

1. Initial Setup
```javascript
const axios = require('axios')
const {v4: uuidv4} = require('uuid')
```
- Imports the Axios HTTP client library
- Imports the UUID v4 generator for creating unique identifiers

2. Configuration Constants
```javascript
const TARGET_HOST = 'localhost'
const TARGET_PORT = 3000
```
- Defines where requests will be sent - localhost:3000

3. Axios Client Setup
```javascript
const client = axios.create({
  baseURL: `http://${TARGET_HOST}:${TARGET_PORT}`,
  timeout: 5000,
})
```
- Creates a configured Axios instance
- Sets the base URL for all requests
- Sets a timeout of 5 seconds
- This instance can be reused for multiple requests

4. Request Function Definition
```javascript
async function postRequest() {
  const correlationId = uuidv4();
```
- Defines an async function for making requests
- Generates a unique ID for tracking this specific request

5. Request Try Block
```javascript
  try {
    const response = await client.post(`/${correlationId}`, {
      msg: 'some random message'
    }, {
      headers: {
        'x-correlation-id': correlationId
      }
    })
```
- Makes a POST request using the Axios client
- First argument: request path with correlation ID which will be passed down stream.
- Second argument: request body (automatically JSON stringified)
- Third argument: request configuration including headers
- `await` pauses execution until the request completes

6. Success Response Handling
```javascript
    console.log(`Completed request ${correlationId}`)
    return {
      correlationId,
      status: response.status,
      data: response.data
    }
```
- Logs completion message
- Returns an object with request details:
  - The correlation ID
  - HTTP status code
  - Response data

7. Error Handling
```javascript
  } catch (error) {
    console.error(`Error for request ${correlationId}:`, error.message)
    throw error
  }
```
- Catches any errors during the request
- Logs the error with the correlation ID
- Re-throws the error for handling upstream

8. Request Execution and Result Processing
```javascript
postRequest()
  .then((data) => {
    console.log(JSON.stringify(data, null, 4))
    process.exit(0)
  })
  .catch(console.error)
```
- Calls the postRequest function
- On success:
  - Pretty prints the response data with indentation
  - Exits the process with success code 0
- On error:
  - Logs the error to console
