const {LruMap} = require('../dist/index')

describe('LruMap', () => {
  describe('constructor', () => {
    it('should create an empty map with specified max size', () => {
      const map = new LruMap(3)
      expect(map.maxSize).toBe(3)
      expect(map.size).toBe(0)
    })

    it('should extend Map', () => {
      const map = new LruMap(3)
      expect(map).toBeInstanceOf(Map)
    })
  })
  describe('set', () => {
    it('should add entries up to maxSize', () => {
      const map = new LruMap(3)
      map.set('a', 1)
        .set('b', 2)
        .set('c', 3)
      expect(map.size).toBe(3)
      expect([...map.entries()]).toEqual([
        ['a', 1],
        ['b', 2],
        ['c', 3]
      ])
    })
    it('should remove oldest entry when exceeding maxSize', () => {
      const map = new LruMap(3)
      map.set('a', 1)
        .set('b', 2)
        .set('c', 3)
        .set('d', 4)
      expect(map.size).toBe(3)
      expect(map.has('a')).toBe(false)
      expect([...map.entries()]).toEqual([
        ['b', 2],
        ['c', 3],
        ['d', 4]
      ])
    })
    it('should update existing key without removing oldest', () => {
      const map = new LruMap(3)
      map.set('a', 1)
        .set('b', 2)
        .set('c', 3)
        .set('b', 20)
      expect(map.size).toBe(3)
      expect([...map.entries()]).toEqual([
        ['a', 1],
        ['b', 20],
        ['c', 3]
      ])
    })
    it('should return the map instance for chaining', () => {
      const map = new LruMap(3)
      const returnValue = map.set('a', 1)
      expect(returnValue).toBe(map)
    })
    it('should handle maxSize of 1', () => {
      const map = new LruMap(1)
      map.set('a', 1)
        .set('b', 2)
      expect(map.size).toBe(1)
      expect(map.has('a')).toBe(false)
      expect(map.get('b')).toBe(2)
    })
    it('should handle setting undefined and null values', () => {
      const map = new LruMap(2)
      map.set('a', undefined)
        .set('b', null)
      expect(map.get('a')).toBeUndefined()
      expect(map.get('b')).toBeNull()
    })
  })

  describe('inherited Map methods', () => {
    it('should maintain LRU behavior with delete', () => {
      const map = new LruMap(3)
      map.set('a', 1)
        .set('b', 2)
        .set('c', 3)
      map.delete('b')
      map.set('d', 4)
      expect(map.size).toBe(3)
      expect([...map.entries()]).toEqual([
        ['a', 1],
        ['c', 3],
        ['d', 4]
      ])
    })
    it('should work with other Map methods', () => {
      const map = new LruMap(3)
      map.set('a', 1)
        .set('b', 2)
      expect(map.has('a')).toBe(true)
      expect(map.get('a')).toBe(1)
      expect([...map.keys()]).toEqual(['a', 'b'])
      expect([...map.values()]).toEqual([1, 2])
      map.clear()
      expect(map.size).toBe(0)
    })
  })
})
