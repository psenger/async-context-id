/**
 * A Map extension that automatically deletes entries after a specified time-to-live (TTL).
 * @extends {Map}
 *
 * @example
 * const cache = new TimedMap(5000); // 5 second TTL
 * cache.set('key1', 'value1');
 * console.log(cache.get('key1')); // 'value1'
 * // After 5 seconds:
 * console.log(cache.get('key1')); // undefined
 *
 * @example
 * // Resetting TTL on value update
 * const cache = new TimedMap(2000);
 * cache.set('user', { name: 'Alice' });
 * // 1 second later:
 * cache.set('user', { name: 'Alice', age: 30 }); // Resets the 2-second timer
 */
class TimedMap extends Map {
  /**
   * Creates a new TimedMap instance.
   * @param {number} ttl - Time-to-live in milliseconds for each key-value pair
   *
   * @example
   * const sessionCache = new TimedMap(1800000); // 30 minute TTL
   */
  constructor(ttl) {
    super()
    this.ttl = ttl
    this.timeouts = new Map()
  }

  /**
   * Sets a value in the map with an automatic deletion timer.
   * If the key already exists, its timer is reset.
   * @param {*} key - The key to set
   * @param {*} value - The value to store
   * @returns {this} The TimedMap instance for chaining
   *
   * @example
   * const cache = new TimedMap(10000);
   * cache.set('apiKey', 'xyz123')
   *      .set('timestamp', Date.now());
   */
  set(key, value) {
    if (this.timeouts.has(key)) clearTimeout(this.timeouts.get(key))
    this.timeouts.set(
      key,
      setTimeout(() => this.delete(key), this.ttl),
    )
    return super.set(key, value)
  }

  /**
   * Deletes a key-value pair and its associated timer.
   * @param {*} key - The key to delete
   * @returns {boolean} True if the element was deleted, false if it didn't exist
   *
   * @example
   * const cache = new TimedMap(5000);
   * cache.set('temp', 'data');
   * cache.delete('temp'); // Manually delete before TTL expires
   */
  delete(key) {
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key))
      this.timeouts.delete(key)
    }
    return super.delete(key)
  }
}
export default TimedMap
