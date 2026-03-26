# Vue Component Conventions

## File Naming
- Components: PascalCase (`TodoItem.vue`, `AppToast.vue`)
- Composables: camelCase with `use` prefix (`useTodoStore.js`, `useToast.js`)
- One component per file

## Component Structure
Every `.vue` file must follow this order:
```vue
<script setup>
// 1. imports
// 2. props/emits
// 3. reactive state
// 4. computed
// 5. methods
// 6. lifecycle hooks
</script>

<template>
  <!-- single root element -->
</template>

<style scoped>
/* component-specific styles */
</style>
```

## Props & Events
- Define props with `defineProps()` and full type annotations
- Define events with `defineEmits()`
- Prop names: camelCase in JS, kebab-case in templates
- Event names: kebab-case (`@update-todo`, `@delete-todo`)

Example:
```vue
<script setup>
const props = defineProps({
  todo: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['edit-todo', 'delete-todo'])
</script>
```

## Template Rules
- Use `v-for` with `:key` always bound to a unique id
- Use `v-model` for two-way binding on form inputs
- Prefer `@click` over `v-on:click`
- Conditional rendering: `v-if` / `v-else`, avoid `v-show` unless toggling frequently

## CSS
- Always use `<style scoped>`
- Use CSS variables from `src/style.css` for colors and spacing
- Class names: BEM-style (`.todo-item__title`, `.todo-form--editing`)
