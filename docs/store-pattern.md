# Store Pattern

This project uses a lightweight reactive store pattern (no Pinia/Vuex).

## Structure

Each store is a composable function in `src/stores/` that returns reactive state and methods.

```js
// src/stores/useTodoStore.js
import { reactive, toRefs } from 'vue'

const STORAGE_KEY = 'vue-crud-todos'

// Module-level state (singleton, shared across components)
const state = reactive({
  todos: [],
  editingId: null,
})

// Load from localStorage on module init
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    state.todos = raw ? JSON.parse(raw) : []
  } catch {
    state.todos = []
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos))
}

export function useTodoStore() {
  // ... return { ...toRefs(state), addTodo, updateTodo, deleteTodo, ... }
}
```

## Rules

1. State is module-level `reactive()` — all components share the same instance
2. Always call `saveToStorage()` after mutating `state.todos`
3. Each todo object shape: `{ id: string, title: string, description: string, createdAt: string }`
4. Generate `id` with `crypto.randomUUID()` (fallback: `Date.now()`)
5. `editingId` tracks which todo is being edited (null = create mode)
6. Export the composable as a named function: `export function useTodoStore()`
7. Use `toRefs()` so destructured state stays reactive in components
