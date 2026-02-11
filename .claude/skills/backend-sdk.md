# Backend SDK Patterns

## Runtime Environment

The Caido backend runs on QuickJS, not Node.js. This means:
- Do not use Node.js-specific APIs or types
- Do not add `@types/node` as a dependency
- The `net` module is available but works differently than Node.js
- Use `Uint8Array` instead of `Buffer` for binary data
- Implement your own string encoding/decoding functions if needed

## Creating Backend API Functions

When adding a new backend API function, follow this exact pattern in `packages/backend/src/index.ts`:

```typescript
import { SDK, DefineAPI } from "caido:plugin";

// 1. Define the function with SDK as first parameter
function myFunction(sdk: SDK, param: string) {
  sdk.console.log(`Called with: ${param}`);
  return `Processed: ${param}`;
}

// 2. Add to the API type definition
export type API = DefineAPI<{
  myFunction: typeof myFunction;
}>;

// 3. Register in the init function
export function init(sdk: SDK<API>) {
  sdk.api.register("myFunction", myFunction);
}
```

## Return Types

When backend functions can fail, always return a Result type instead of throwing:

```typescript
export type Result<T> =
  | { kind: "Error"; error: string }
  | { kind: "Ok"; value: T };

function processData(sdk: SDK, input: string): Result<ProcessedData> {
  try {
    const processed = doSomeProcessing(input);
    return { kind: "Ok", value: processed };
  } catch (error) {
    return { kind: "Error", error: error.message };
  }
}
```

Never throw exceptions from API functions - always return Result types.

## Backend Events

When the backend needs to push updates to the frontend, define events:

```typescript
import { DefineEvents, SDK } from "caido:plugin";

export type BackendEvents = DefineEvents<{
  "data-updated": { message: string };
  "status-changed": { status: "active" | "inactive" };
}>;

export type CaidoBackendSDK = SDK<never, BackendEvents>;
```

## Adding Multiple Endpoints

When adding multiple API endpoints, register each one separately:

```typescript
export type API = DefineAPI<{
  getData: typeof getData;
  saveData: typeof saveData;
  deleteData: typeof deleteData;
}>;

export function init(sdk: SDK<API>) {
  sdk.api.register("getData", getData);
  sdk.api.register("saveData", saveData);
  sdk.api.register("deleteData", deleteData);
}
```
