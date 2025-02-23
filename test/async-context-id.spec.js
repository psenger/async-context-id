const {AsyncContextId} = require('../dist/index')

jest.mock('async_hooks', () => {
  const hook = {
    enable: jest.fn(),
    disable: jest.fn()
  }

  return {
    createHook: jest.fn(callbacks => {
      // hookInit = callbacks.init
      return hook
    }),
    executionAsyncId: jest.fn(() => 1)
  }
})

describe('AsyncContextId', () => {
  let tracker
  let mockStore
  beforeEach(() => {
    jest.clearAllMocks()
    AsyncContextId.instance = null
    mockStore = new Map()
    jest.spyOn(Date, 'now').mockImplementation(() => 1234567890)
    tracker = new AsyncContextId({store:mockStore})
  })
  afterEach(() => {
    jest.restoreAllMocks()
    tracker.clear()
  })
  describe('constructor', () => {
    it('should create a singleton instance', () => {
      const tracker1 = new AsyncContextId()
      const tracker2 = new AsyncContextId()
      expect(tracker1).toBe(tracker2)
    })
  })
  describe('correlation ID management', () => {
    it('should generate and return new correlation ID when none exists', () => {
      const correlationId = tracker.getCorrelationId()
      expect(correlationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })
    it('should return existing correlation ID', () => {
      const existingId = 'existing-id'
      tracker.setCorrelationId(existingId)
      expect(tracker.getCorrelationId()).toBe(existingId)
    })
    it('should set and preserve new correlation ID', () => {
      const newId = 'new-correlation-id'
      tracker.setCorrelationId(newId)
      expect(tracker.getCorrelationId()).toBe(newId)
    })
  })
  describe('context management', () => {
    it('should initialize new context with default values', () => {
      const context = tracker.getContext()
      expect(context).toMatchObject({
        startTime: 1234567890,
        metadata: {}
      })
      expect(context.correlationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })
    it('should merge metadata when setting context', () => {
      tracker.setContext({metadata: {key1: 'value1'}})
      tracker.setContext({metadata: {key2: 'value2'}})
      const context = tracker.getContext()
      expect(context.metadata).toEqual({
        key2: 'value2'
      })
    })
    it('should preserve startTime when updating context', () => {
      tracker.setContext({metadata: {key1: 'value1'}})
      const firstContext = tracker.getContext()
      Date.now.mockReturnValue(1234567891)
      tracker.setContext({metadata: {key2: 'value2'}})
      const secondContext = tracker.getContext()
      expect(secondContext.startTime).toBe(firstContext.startTime)
    })
  })
  describe('clear', () => {
    it('should remove context for current async ID', () => {
      tracker.setContext({correlationId: 'test-id'})
      tracker.clear()
      expect(tracker.contextStore.has(1)).toBe(false)
    })
  })
  describe('async context tracking', () => {
    it('should maintain separate contexts across different async operations', async () => {
      const tracker = new AsyncContextId()

      // Set parent context
      tracker.setContext({metadata: {'operation': 'parent'}})

      // First async operation
      const promise1 = Promise.resolve().then(() => {
        tracker.setContext({metadata: {'operation': 'async1'}})
      })

      // Second async operation
      const promise2 = Promise.resolve().then(() => {
        tracker.setContext({metadata: {'operation': 'async2'}})
      })

      // Wait for both to complete
      await Promise.all([promise1, promise2])

      // Parent context should remain unchanged
      const finalContext = tracker.getContext()
      expect(finalContext.metadata['operation']).toBe('parent')
    })
  })
})
