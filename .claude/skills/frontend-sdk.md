# Frontend SDK Patterns

## Frontend Entry Point

When setting up the frontend plugin in `packages/frontend/src/index.ts`:

```typescript
import { Caido } from "@caido/sdk-frontend";
import { API, BackendEvents } from "backend";

export type FrontendSDK = Caido<API, BackendEvents>;

export const init = (sdk: FrontendSDK) => {
  // Create pages and register sidebar items here
};
```

## SDK Type Definition

When the plugin has a backend, define FrontendSDK like this:

```typescript
import { Caido } from "@caido/sdk-frontend";
import { API, BackendEvents } from "backend";

export type FrontendSDK = Caido<API, BackendEvents>;
```

When the plugin has NO backend, use empty records:

```typescript
export type FrontendSDK = Caido<Record<string, never>, Record<string, never>>;
```

## Registering Commands

When adding user-triggerable actions, register commands with this pattern:

```typescript
const Commands = {
  processData: "my-plugin.process-data",
  exportResults: "my-plugin.export-results",
} as const;

sdk.commands.register(Commands.processData, {
  name: "Process Data",
  run: async () => {
    const result = await sdk.backend.processData();
    sdk.window.showToast(`Processed ${result.count} items`, {
      variant: "success",
    });
  },
  group: "My Plugin",
});

// Add to command palette
sdk.commandPalette.register(Commands.processData);

// Add to context menu
sdk.menu.registerItem({
  type: "Request",
  commandId: Commands.processData,
  leadingIcon: "fas fa-cog",
});
```

## Logging

Use `sdk.log.*` methods for logging in the frontend. The frontend does NOT have `sdk.console`:

```typescript
// Info level logging
sdk.log.info("User action performed");
sdk.log.info("Loaded data:", data);

// Error logging
sdk.log.error("Failed to process:", error);

// Warning logging
sdk.log.warn("Deprecated feature used");
```

**Important**: Never use `sdk.console` in frontend code - it doesn't exist. Always use `sdk.log.info()`, `sdk.log.error()`, `sdk.log.warn()`, etc.

## Handling Backend Results

When calling backend APIs, always check the Result type:

```typescript
const result = await sdk.backend.processData(inputValue);

if (result.kind === "Error") {
  sdk.window.showToast(result.error, { variant: "error" });
  return;
}

// Use result.value here
sdk.window.showToast("Success!", { variant: "success" });
```

Never wrap backend calls in try/catch - use Result type checking.

## Sending HTTP Requests

When sending HTTP requests from the frontend:

```typescript
import { RequestSpec } from "caido:utils";

const spec = new RequestSpec("https://api.example.com/data");
spec.setMethod("POST");
spec.setHeader("Content-Type", "application/json");
spec.setBody(JSON.stringify({ key: "value" }));

const result = await sdk.requests.send(spec);
if (result.response) {
  const statusCode = result.response.getCode();
  const body = result.response.getBody()?.toText();
}
```

## Creating Request/Response Editors

When displaying HTTP request/response data:

```typescript
const reqEditor = sdk.ui.httpRequestEditor();
const respEditor = sdk.ui.httpResponseEditor();

const container = document.createElement("div");
container.style.display = "flex";
container.appendChild(reqEditor.getElement());
container.appendChild(respEditor.getElement());
```
