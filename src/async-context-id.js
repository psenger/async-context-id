import asyncHooks from "async_hooks";

let instance = null;

/**
 * A singleton class that tracks correlation IDs across asynchronous operations in Node.js.
 * Uses async_hooks to automatically propagate correlation context across async boundaries.
 *
 * @class
 * @description This class provides context propagation across async operations in Node.js
 * applications. It maintains correlation IDs and metadata throughout the async execution chain.
 *
 * @property {Map} contextStore - Storage for async context data
 * @property {AsyncHook} hook - The async_hooks instance for tracking async operations
 * @property {Function} cleanUpFn - Cleanup function registered for process exit
 *
 * @tutorial initializing-async-context-id-in-a-controller
 * @tutorial monkey-patch-logs
 * @tutorial down-stream-http-hand-off
 * @tutorial winston
 */
class AsyncContextId {
  contextStore;
  correlationIdFn;
  hook;
  cleanUpFn;

  /**
   * Creates a new AsyncContextId instance or returns the existing singleton.
   * Initializes async hooks and sets up process cleanup.
   *
   * @param {Object} [options={}] - Configuration options
   * @param {Map} [options.store=new Map()] - Optional Map instance for context storage, this package includes both a LRU ( Least Recently Used ) Map and a Timed Map.
   * @param {fn} [options.correlationIdFn] -Optional function to override default UUID generation. Should return a string
   * @returns {AsyncContextId} The singleton instance
   * @example
   * // Using default Map and UUID generation
   * const tracker = new AsyncContextId();
   *
   * @example
   * // Using custom LRU Map and correlation ID generator
   * const tracker = new AsyncContextId({
   *   store: new LruMap(1000),
   *   correlationIdFn: () => `custom-${Date.now()}`
   * });
   */
  constructor({store, correlationIdFn} = {
    store: new Map(), correlationIdFn: null
  }) {
    if (instance) {
      return instance;
    }
    this.contextStore = store;
    this.correlationIdFn = correlationIdFn;
    this.hook = asyncHooks.createHook({
      init: (asyncId, type, triggerAsyncId) => {
        // Copy parent context for new async operations to maintain same correlation ID
        if (this.contextStore.has(triggerAsyncId)) {
          const parentContext = this.contextStore.get(triggerAsyncId);
          const newContext = JSON.parse(JSON.stringify(parentContext));
          this.contextStore.set(asyncId, newContext);
        }
      },
      promiseResolve: (asyncId) => {
        const context = this.contextStore.get(asyncId);
        if (context) {
          const currentAsyncId = asyncHooks.executionAsyncId();
          this.contextStore.set(
            currentAsyncId,
            JSON.parse(JSON.stringify(context)),
          );
        }
      },
      destroy: (asyncId) => {
        this.contextStore.delete(asyncId);
      },
    });

    /**
     * remove the listener of itself to prevent memory leaks
     */
    this.cleanUpFn = () => {
      process.removeListener("beforeExit", this.cleanUpFn);
      this.hook.disable();
      this.contextStore.clear();
    };
    this.hook.enable();
    process.on("beforeExit", this.cleanUpFn);
    instance = this;
    return this;
  }

  /**
   * Generates a correlation ID for tracking.
   * Uses custom correlation ID generator if provided, otherwise generates UUID v4.
   *
   * @private
   * @returns {string} A correlation ID string
   * @throws {Error} If custom correlationIdFn throws or returns non-string
   *
   * @example
   * // Using default UUID v4 generator
   * const id = this.generateCorrelationId();
   * // Returns: "123e4567-e89b-12d3-a456-426614174000"
   *
   * @example
   * // Using custom generator
   * const tracker = new AsyncContextId({
   *   correlationIdFn: () => `custom-${Date.now()}`
   * });
   * const id = tracker.generateCorrelationId();
   * // Returns: "custom-1708704000000"
   */
  generateCorrelationId() {
    if (this.correlationIdFn) {
      return this.correlationIdFn()
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Retrieves the correlation ID for the current async context.
   * Creates a new context with generated ID if none exists.
   *
   * @returns {string} The current correlation ID
   * @throws {Error} If async hooks are not enabled
   *
   * @example
   * const correlationId = tracker.getCorrelationId();
   * res.setHeader('x-correlation-id', correlationId);
   */
  getCorrelationId() {
    const asyncId = asyncHooks.executionAsyncId();
    if (!this.contextStore.has(asyncId)) {
      this.contextStore.set(asyncId, {
        correlationId: this.generateCorrelationId(),
        startTime: Date.now(),
        metadata: {},
      });
    }
    return this.contextStore.get(asyncId).correlationId;
  }

  /**
   * Sets the correlation ID for the current async context.
   * Creates a new context if none exists.
   *
   * @param {string} correlationId - The correlation ID to set
   * @throws {Error} If the correlationId is not a string
   * @throws {Error} If async hooks are not enabled
   *
   * @example
   * const upstreamId = req.headers['x-correlation-id'];
   * if (upstreamId) {
   *   tracker.setCorrelationId(upstreamId);
   * }
   */
  setCorrelationId(correlationId = this.generateCorrelationId()) {
    const asyncId = asyncHooks.executionAsyncId();
    if (!this.contextStore.has(asyncId)) {
      this.contextStore.set(asyncId, {
        correlationId,
        startTime: Date.now(),
        metadata: {},
      });
    } else {
      const existingContext = this.contextStore.get(asyncId);
      const newContext = JSON.parse(JSON.stringify(existingContext));
      newContext.correlationId = correlationId;
      this.contextStore.set(asyncId, newContext);
    }
    return correlationId;
  }

  /**
   * Retrieves the complete context object for the current async operation.
   * Creates a new context if none exists.
   *
   * @returns {Object} The correlation context
   * @returns {string} context.correlationId - The correlation ID
   * @returns {number} context.startTime - Unix timestamp of context creation
   * @returns {Object} context.metadata - Custom metadata object
   * @throws {Error} If async hooks are not enabled
   *
   * @example
   * const context = tracker.getContext();
   * console.log({
   *   correlationId: context.correlationId,
   *   duration: Date.now() - context.startTime,
   *   metadata: context.metadata
   * });
   */
  getContext() {
    const asyncId = asyncHooks.executionAsyncId();
    if (!this.contextStore.has(asyncId)) {
      this.contextStore.set(asyncId, {
        correlationId: this.generateCorrelationId(),
        startTime: Date.now(),
        metadata: {},
      });
    }
    return JSON.parse(JSON.stringify(this.contextStore.get(asyncId)));
  }

  /**
   * Updates the context for the current async operation.
   * Creates a new context if none exists. Preserves existing correlationId
   * and startTime unless explicitly overridden.
   *
   * @param {Object} [context={}] - The context object to merge
   * @param {string} [context.correlationId] - Optional correlation ID override
   * @param {Object} [context.metadata] - Optional metadata to merge
   * @throws {Error} If async hooks are not enabled
   * @throws {Error} If context is not an object
   *
   * @example
   * // Add request context
   * tracker.setContext({
   *   metadata: {
   *     operation: 'processData',
   *     requestId: req.id,
   *     userId: req.user.id
   *   }
   * });
   */
  setContext(context = {}) {
    const asyncId = asyncHooks.executionAsyncId();
    const existingContext = this.contextStore.get(asyncId) || {
      correlationId: this.generateCorrelationId(),
      startTime: Date.now(),
      metadata: {},
    };
    const clonedExisting = JSON.parse(JSON.stringify(existingContext));
    const clonedNew = JSON.parse(JSON.stringify(context));
    Object.assign(clonedExisting, clonedNew);
    clonedExisting.correlationId =
      clonedNew.correlationId || clonedExisting.correlationId;
    clonedExisting.startTime = existingContext.startTime;
    this.contextStore.set(asyncId, clonedExisting);
  }

  /**
   * Removes the correlation context for the current async operation.
   *
   * @throws {Error} If async hooks are not enabled
   *
   * @example
   * try {
   *   await processRequest(data);
   * } finally {
   *   tracker.clear();
   * }
   */
  clear() {
    const asyncId = asyncHooks.executionAsyncId();
    this.contextStore.delete(asyncId);
  }
}

export default AsyncContextId;
export {instance};
