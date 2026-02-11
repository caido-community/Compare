# Code Quality Rules

## TypeScript

When writing TypeScript code:

- Always use `type` declarations, never use `interface`
- Never use `any` type - find the correct type or use `unknown`
- Never cast to `any` - use proper type narrowing instead
- Always use `undefined` instead of `null`
- Never add comments to generated code
- Never add unnecessary `try`/`catch` blocks - only catch errors you can handle

## Vue Reactivity

When working with Vue reactive state:

- Use `computed` for derived state instead of separate reactive variables
- Only create reactive variables for source state that changes independently

## Refactoring

When renaming types or refactoring:

- Never create alias types like `export type Options = ScanConfig`
- Actually rename the type and fix all occurrences across the codebase
- Run `knip` to identify and remove unused code after large changes

## Naming Conventions

When creating new files and folders:

- Name regular folders in camelCase: `intercept`, `replay`, `httpHistory`
- Name component folders in PascalCase: `PassiveFormCreate`, `PassiveTable`
- Name non-component files in camelCase: `useForm.ts`, `assistant.graphql`

## Code Organization

When writing functions and components:

- Declare variables close to where they are first used, not at the top
- Group related variables together (e.g., event bus declarations next to listeners)
- Break large template blocks into smaller composed components
- Colocate code that changes together in the same file or folder

## Simplicity

When implementing features:

- Only create abstractions when there are 3+ concrete use cases
- Prefer clear function and variable names over inline comments
- Use inline expressions instead of helper functions for simple operations
- Use built-in Tailwind values; avoid custom CSS variables

## Knip (Unused Code Detection)

Run `pnpm knip` to find unused code and dependencies:

- **When to run**: After refactoring, removing features, or large changes
- **What it finds**: Unused exports, unused dependencies, unused files, unused types
- **Fix issues**: Remove the unused code rather than adding `// knip-ignore` comments

Common knip findings to address:

- Exported functions/types that are never imported elsewhere
- Dependencies in `package.json` that are never used
- Files that are not referenced by any other file
- Type definitions that are never used
