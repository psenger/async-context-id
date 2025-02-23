#!/usr/bin/env node
const http = require('http')
const { v4: uuidv4 } = require('uuid')
const { faker } = require('@faker-js/faker')
const CONCURRENT_REQUESTS = 7
const TOTAL_REQUESTS = 200
const TARGET_HOST = 'localhost'
const TARGET_PORT = 3000

const agent = new http.Agent({
  keepAlive: true,
  maxSockets: CONCURRENT_REQUESTS
})

function makeRequest() {
  const correlationId = uuidv4();
  const fullName = faker.person.fullName();

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      fullName: fullName
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
        console.log(`Completed request ${correlationId} for ${fullName}`)
        resolve({ correlationId, fullName, status: res.statusCode, data })
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

async function main() {
  console.log(`Starting ${TOTAL_REQUESTS} requests with ${CONCURRENT_REQUESTS} concurrent connections`)
  const promises = []
  for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENT_REQUESTS) {
    const batch = Array.from({ length: Math.min(CONCURRENT_REQUESTS, TOTAL_REQUESTS - i) },
      () => makeRequest())
    const results = await Promise.allSettled(batch)
    promises.push(...results)
    console.log(`Completed batch starting at request ${i}`)
  }
  const successful = promises.filter(r => r.status === 'fulfilled').length
  const failed = promises.filter(r => r.status === 'rejected').length
  console.log(`All requests completed! ${successful} successful, ${failed} failed`)
  agent.destroy()
}

main()
  .then(() => {
    process.exit(0);
  }).catch(console.error)
