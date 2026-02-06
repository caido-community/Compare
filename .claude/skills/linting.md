# Linting

## Running the Linter

After making any code changes, run the linter:

```bash
pnpm lint
```

Fix all reported issues before committing.

## Nullable String Checks

When checking if a string is defined, never use truthiness checks:

Wrong:
```typescript
if (!str) {}
if (str) {}
```

Correct:
```typescript
if (str === undefined) {}
if (str !== undefined) {}
```

This prevents false positives when the string is empty but defined.
