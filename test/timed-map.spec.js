const {TimedMap} = require('../dist/index')

describe('TimedMap', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.spyOn(global, 'setTimeout')
    jest.spyOn(global, 'clearTimeout')
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should create empty map with specified TTL', () => {
      const map = new TimedMap(1000)
      expect(map.ttl).toBe(1000)
      expect(map.size).toBe(0)
      expect(map.timeouts.size).toBe(0)
    })

    it('should extend Map', () => {
      const map = new TimedMap(1000)
      expect(map).toBeInstanceOf(Map)
    })
  })

  describe('set', () => {
    it('should store value and create timeout', () => {
      const map = new TimedMap(1000)
      map.set('key', 'value')

      expect(map.get('key')).toBe('value')
      expect(map.timeouts.size).toBe(1)
      expect(global.setTimeout).toHaveBeenCalledTimes(1)
      expect(global.setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000)
    })

    it('should allow chaining of set operations', () => {
      const map = new TimedMap(1000)
      const returnValue = map.set('key1', 'value1')

      expect(returnValue).toBe(map)
      map.set('key2', 'value2').set('key3', 'value3')
      expect(map.size).toBe(3)
    })

    it('should reset timeout when updating existing key', () => {
      const map = new TimedMap(1000)
      map.set('key', 'value1')

      jest.advanceTimersByTime(500)

      map.set('key', 'value2')
      expect(global.clearTimeout).toHaveBeenCalledTimes(1)
      expect(global.setTimeout).toHaveBeenCalledTimes(2)

      jest.advanceTimersByTime(800)
      expect(map.has('key')).toBe(true)

      jest.advanceTimersByTime(200)
      expect(map.has('key')).toBe(false)
    })

    it('should remove value after TTL expires', () => {
      const map = new TimedMap(1000)
      map.set('key', 'value')

      expect(map.get('key')).toBe('value')

      jest.advanceTimersByTime(1000)

      expect(map.has('key')).toBe(false)
      expect(map.get('key')).toBeUndefined()
      expect(map.timeouts.has('key')).toBe(false)
    })
  })

  describe('delete', () => {
    it('should remove value and clear timeout', () => {
      const map = new TimedMap(1000)
      map.set('key', 'value')

      const deleted = map.delete('key')

      expect(deleted).toBe(true)
      expect(map.has('key')).toBe(false)
      expect(map.timeouts.has('key')).toBe(false)
      expect(global.clearTimeout).toHaveBeenCalledTimes(1)
    })

    it('should return false when deleting non-existent key', () => {
      const map = new TimedMap(1000)
      const deleted = map.delete('nonexistent')

      expect(deleted).toBe(false)
      expect(global.clearTimeout).not.toHaveBeenCalled()
    })

    it('should handle multiple deletions of same key', () => {
      const map = new TimedMap(1000)
      map.set('key', 'value')

      expect(map.delete('key')).toBe(true)
      expect(map.delete('key')).toBe(false)
      expect(global.clearTimeout).toHaveBeenCalledTimes(1)
    })
  })

  describe('automatic cleanup', () => {
    it('should handle multiple entries with different TTLs', () => {
      const map = new TimedMap(1000)
      map.set('key1', 'value1')
      map.set('key2', 'value2')
      map.set('key3', 'value3')

      jest.advanceTimersByTime(1000)

      expect(map.size).toBe(0)
      expect(map.timeouts.size).toBe(0)
    })

    it('should handle rapid set/delete operations', () => {
      const map = new TimedMap(1000)

      map.set('key', 'value1')
      map.set('key', 'value2')
      map.delete('key')
      map.set('key', 'value3')

      expect(global.setTimeout).toHaveBeenCalledTimes(3)  // ✓ This is correct!
      expect(global.clearTimeout).toHaveBeenCalledTimes(2) // ✓ This matches our output
      expect(map.get('key')).toBe('value3')
    })
  })

  describe('edge cases', () => {
    it('should handle zero TTL', () => {
      const map = new TimedMap(0)
      map.set('key', 'value')
      jest.advanceTimersByTime(0)
      expect(map.has('key')).toBe(false)
    })

    it('should handle setting undefined and null values', () => {
      const map = new TimedMap(1000)

      map.set('key1', undefined)
      map.set('key2', null)

      expect(map.get('key1')).toBeUndefined()
      expect(map.get('key2')).toBeNull()

      jest.advanceTimersByTime(1000)

      expect(map.has('key1')).toBe(false)
      expect(map.has('key2')).toBe(false)
    })
  })
})
