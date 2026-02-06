# Vue Component Patterns

## Script Setup

When creating Vue components, always use this script tag format:

```vue
<script setup lang="ts">
// component logic here
</script>
```

Never use the Options API or `<script>` without `setup`.

## Component Folder Structure

When creating a new component, create this folder structure:

```
ComponentName/
  ├─ index.ts           # Re-export only
  ├─ Container.vue      # Main component
  ├─ useForm.ts         # Composable (if needed)
  └─ ChildComponent.vue # Sub-components
```

Always create the `index.ts` re-export file with this exact pattern:

```ts
export { default as ComponentName } from "./Container.vue";
```

## Nested Components

When a child component becomes complex, extract it into its own folder using the same pattern:

```
ComponentName/
  └─ DependentComponent/
       ├─ index.ts
       └─ Container.vue
```

## Composables

When component logic grows beyond simple reactivity:

1. Extract the logic into a `useX.ts` composable file
2. Keep the composable in the same component folder
3. Import and use it in `Container.vue`
