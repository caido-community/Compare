# Caido Plugin Development

This is a Caido plugin project. Caido is a web application security auditing toolkit with HTTP proxy, replay, automation, and workflow features.

## When working in this codebase

Always remember you are building a plugin that runs inside the Caido application. The plugin communicates with Caido through its SDK.

## Project Structure

When creating or modifying files, place them in the correct package:

- Put server-side logic, data processing, and API endpoints in `packages/backend`
- Put UI components, user interactions, and frontend code in `packages/frontend`
- Put shared types in files that both packages can import

## Plugin Architecture

When implementing features that need both UI and server logic:

1. Define the API function in `packages/backend/src/index.ts`
2. Register it with `sdk.api.register()`
3. Export the API type using `DefineAPI`
4. Call it from frontend via `sdk.backend.functionName()`

When implementing frontend-only features:

1. Create components in `packages/frontend`
2. Register pages with `sdk.sidebar.registerItem()`
3. Register commands with `sdk.commands.register()`
