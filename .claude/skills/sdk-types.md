# SDK Types Reference

## Importing Types

When working with Request and Response objects, import them from `caido:utils`:

```typescript
import { type Request, type Response } from "caido:utils";
```

## Request Object Methods

When accessing request data, use these methods:

- `getId()` - Get request ID
- `getHost()` - Get target host
- `getPort()` - Get target port
- `getTls()` - Check if HTTPS
- `getMethod()` - Get HTTP method
- `getPath()` - Get URL path
- `getQuery()` - Get query string
- `getUrl()` - Get full URL
- `getHeaders()` - Get all headers as `Record<string, Array<string>>`
- `getHeader(name)` - Get specific header values
- `getBody()?.toText()` - Get body as text
- `getRaw()` - Get raw request bytes
- `toSpec()` - Convert to RequestSpec for modification

## Response Object Methods

When accessing response data, use these methods:

- `getId()` - Get response ID
- `getCode()` - Get HTTP status code
- `getHeaders()` - Get all headers
- `getHeader(name)` - Get specific header values
- `getBody()?.toText()` - Get body as text
- `getRaw()` - Get raw response bytes
- `getRoundtripTime()` - Get request duration

## Creating Findings

When you need to alert users about interesting traffic, create a finding:

```typescript
await sdk.findings.create({
  title: `Success Response ${response.getCode()}`,
  description: `Request ID: ${request.getId()}\nResponse Code: ${response.getCode()}`,
  reporter: "My Plugin",
  request: request,
  dedupeKey: `${request.getPath()}-${response.getCode()}`
});
```

Always include a `dedupeKey` to prevent duplicate findings.

## SDK API Usage Rules

When calling SDK methods:

- Call SDK methods directly without checking if they exist
- Never use `typeof` or `in` operator to check for SDK methods
- Never add runtime validation for SDK APIs

Correct:
```typescript
sdk.window.showToast("Message", { variant: "error" });
```

Wrong - never do this:
```typescript
if ("showToast" in sdk.window) {
  sdk.window.showToast("Message");
}
```

The SDK is fully typed. If TypeScript compiles, the method exists.
