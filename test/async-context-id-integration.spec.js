const {AsyncContextId} = require('../dist/index')
const asyncHooks = require('async_hooks')

describe('AsyncContextId Integration', () => {
  let tracker
  beforeEach(() => {
    AsyncContextId.instance = null
    tracker = new AsyncContextId()
  })
  afterEach(() => {
    if (tracker) {
      tracker.clear()
    }
  })
  it('should track different async contexts', (done) => {
    const initialAsyncId = asyncHooks.executionAsyncId()
    tracker.setContext({ metadata: { phase: 'initial' } })
    setImmediate(() => {
      const immediateAsyncId = asyncHooks.executionAsyncId()
      expect(immediateAsyncId).not.toBe(initialAsyncId)
      const context = tracker.getContext()
      expect(context.metadata).toEqual({ phase: 'initial' })
      done()
    })
  })
  it('should track async context through resolved promises', async () => {
    const initialAsyncId = asyncHooks.executionAsyncId()
    tracker.setContext({ metadata: { phase: 'initial' } })
    await Promise.resolve()
    const afterResolveId = asyncHooks.executionAsyncId()
    expect(afterResolveId).not.toBe(initialAsyncId)
    const context = tracker.getContext()
    expect(context.metadata).toEqual({ phase: 'initial' })
  })
})
