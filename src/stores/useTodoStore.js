import { reactive, toRefs } from 'vue'

const STORAGE_KEY = 'vue-crud-todos'

const state = reactive({
  todos: [],
  editingId: null,
})

function loadFromStorage() {
  if (typeof localStorage === 'undefined') {
    state.todos = []
    return
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    state.todos = raw ? JSON.parse(raw) : []
  } catch {
    state.todos = []
  }
}

function saveToStorage() {
  if (typeof localStorage === 'undefined') {
    return
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos))
}

function generateTodoId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return String(Date.now())
}

function addTodo(payload) {
  const title = payload.title.trim()

  if (!title) {
    return false
  }

  state.todos.unshift({
    id: generateTodoId(),
    title,
    description: payload.description.trim(),
    createdAt: new Date().toISOString(),
  })
  saveToStorage()
  return true
}

function updateTodo(id, payload) {
  const title = payload.title.trim()

  if (!title) {
    return false
  }

  const todoIndex = state.todos.findIndex((todo) => todo.id === id)

  if (todoIndex === -1) {
    return false
  }

  state.todos[todoIndex] = {
    ...state.todos[todoIndex],
    title,
    description: payload.description.trim(),
  }
  saveToStorage()
  return true
}

function deleteTodo(id) {
  const nextTodos = state.todos.filter((todo) => todo.id !== id)

  if (nextTodos.length === state.todos.length) {
    return false
  }

  state.todos = nextTodos

  if (state.editingId === id) {
    state.editingId = null
  }

  saveToStorage()
  return true
}

function startEditing(id) {
  state.editingId = id
}

function resetEditing() {
  state.editingId = null
}

loadFromStorage()

export function useTodoStore() {
  return {
    ...toRefs(state),
    addTodo,
    updateTodo,
    deleteTodo,
    startEditing,
    resetEditing,
  }
}
