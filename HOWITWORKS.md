## How It Works

This library uses Node.js's `async_hooks` module to track async operations:

```mermaid
stateDiagram-v2
    [*] --> AsyncContextId: Create Instance

    state AsyncContextId {
        state "Async Hooks Setup" as setup {
            [*] --> Hook
            Hook --> Init: New Async Operation
            Hook --> PromiseResolve: Promise Resolved
            Hook --> Destroy: Operation Complete
        }

        state "Context Operations" as ops {
            state "Context Store (Map)" as store {
                SetContext --> Store: Update Context
                GetContext --> Store: Retrieve Context
                SetCorrelationId --> Store: Update ID
                GetCorrelationId --> Store: Get/Generate ID
                Clear --> Store: Delete Context
            }
        }

        state fork_state <<fork>>

        Init --> fork_state
        fork_state --> CopyParentContext: Has Parent Context
        fork_state --> CreateNewContext: No Parent Context

        CopyParentContext --> Store: Set New AsyncID
        CreateNewContext --> Store: Generate New ID

        PromiseResolve --> Store: Copy Context to New AsyncID
        Destroy --> Store: Delete Context for AsyncID
    }

    state "Example Flow" as example {
        Request --> SetCorrelationId: Upstream ID
        SetCorrelationId --> ProcessData: Async Operation
        ProcessData --> GetContext: Get Results
        GetContext --> Clear: Cleanup
    }

    AsyncContextId --> BeforeExit: Process Exit
    BeforeExit --> [*]: Cleanup Hook & Store
```

## Flow Diagram Explanation

### Instance Creation

* Program starts by creating a singleton `AsyncContextId` instance
* Sets up async hooks and initializes the context store (Map)

### Async Hooks Setup

* Hook listens for three main events:
  * `init`: When new async operations are created
  * `promiseResolve`: When promises are resolved
  * `destroy`: When async operations complete

### Context Operations

Custom data is stored in the `meta` attribute. All context / `meta`
operations use deep cloning to ensure isolation between async operations.

* Main operations on the context store:
  * `setContext`: Updates context for current async ID
  * `getContext`: Retrieves context for current async ID
  * `setCorrelationId`: Sets/updates correlation ID
  * `getCorrelationId`: Gets or generates correlation ID
  * `clear`: Removes context for current async ID

### Context Propagation

* When a new async operation starts:
  * If parent context exists, it's copied to new async ID
  * If no parent context, new context is created with generated ID
* When promises resolve, context is copied to new async ID
* When operations complete, context is cleaned up

### Cleanup

* On process exit:
  * Disables async hooks
  * Clears context store
  * Removes event listeners

### Example Flow

* Shows typical request handling:
  * Set correlation ID from upstream
  * Process data asynchronously
  * Retrieve context for logging
  * Clear context when done

