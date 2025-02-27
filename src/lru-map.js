/**
 * A Map extension implementing Least Recently Used (LRU) caching strategy.
 * Automatically removes oldest entries when size limit is reached.
 * @extends {Map}
 *
 * @example
 * const cache = new LruMap(3);
 * cache.set('a', 1).set('b', 2).set('c', 3);
 * cache.set('d', 4); // Removes 'a', now contains b,c,d
 */
class LruMap extends Map {
  /**
   * Creates an LRU cache with specified maximum size.
   * @param {number} maxSize - Maximum number of entries
   *
   * @example
   * const cache = new LruMap(1000);
   */
  constructor(maxSize) {
    super()
    this.maxSize = maxSize
  }

  /**
   * Sets a value, removing oldest entry if size limit reached.
   * @param {*} key - The key to set
   * @param {*} value - The value to store
   * @returns {this} The LruMap instance for chaining
   *
   * @example
   * const cache = new LruMap(2);
   * cache.set('key1', 'value1')
   *      .set('key2', 'value2')
   *      .set('key3', 'value3'); // Removes key1
   */
  set(key, value) {
    if (!this.has(key) && this.size >= this.maxSize) {
      const firstKey = this.keys().next().value
      this.delete(firstKey)
    }
    return super.set(key, value)
  }
}
export default LruMap
