# UI Style Rules

## Component Library

When building UI, always use PrimeVue components. Never use raw HTML elements when a PrimeVue component exists.

## Colors and Theming

When styling components:

- Use `surface` color utilities for backgrounds and borders: `bg-surface-800`, `border-surface-700`
- Use `bg-surface-800` for main backgrounds (matches Caido app background)
- Use `bg-surface-700` for Card component backgrounds
- Keep the color palette minimal - avoid introducing new colors

## Layout

When creating layouts:

- Use PrimeVue `Splitter` and `SplitterPanel` for split views
- Add `h-full` class to Cards that should fill their container
- Always use PrimeVue's `pt` prop to customize component styling:

```vue
<Card
  class="h-full"
  :pt="{
    body: { class: 'h-full p-0' },
    content: { class: 'h-full flex flex-col' },
  }"
>
  <template #content>
    <!-- content here -->
  </template>
</Card>
```

## Named Slots

When using PrimeVue components, always use named slots (`#content`, `#header`, `#footer`). Never put content directly in the component without a slot.

## Data Tables

When displaying structured data:

- Use PrimeVue `DataTable` component
- Add the `stripedRows` prop
- Place action buttons (Install, Delete, etc.) in the last column
- Show friendly empty state messages with icons when no data

## Icons

When adding icons, always use Font Awesome solid icons with the `fas fa-` prefix:

```vue
<i class="fas fa-rocket"></i>
```

Never use any other icon library.
