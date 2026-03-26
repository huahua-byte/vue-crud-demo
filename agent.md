# Agent Guide

A Vue 3 + Vite CRUD application. Read the docs below before writing any code.

## Tech Stack
- Vue 3 (Composition API with `<script setup>`)
- Vite for build tooling
- No UI framework — custom CSS with CSS variables (see `src/style.css`)
- Data persistence via localStorage

## Project Structure
```
src/
├── main.js              # App entry point (do not modify)
├── App.vue              # Root component, mounts router views or top-level components
├── style.css            # Global CSS variables and resets
├── composables/         # Reusable composition functions (useXxx.js)
├── components/          # Vue SFC components
│   ├── TodoForm.vue     # Form for create/edit
│   ├── TodoList.vue     # List display
│   ├── TodoItem.vue     # Single item card
│   └── AppToast.vue     # Toast notification
└── stores/              # State management (reactive stores)
    └── useTodoStore.js  # Todo CRUD + localStorage persistence
```

## Key Rules
1. Read `docs/conventions.md` for component patterns and naming
2. Read `docs/store-pattern.md` for state management approach
3. Always use Composition API (`<script setup>`), never Options API
4. Run `npm run build` after changes to verify no errors
