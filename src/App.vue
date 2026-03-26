<script setup>
import { computed } from 'vue'
import AppToast from './components/AppToast.vue'
import TodoForm from './components/TodoForm.vue'
import TodoList from './components/TodoList.vue'
import { useToast } from './composables/useToast'
import { useTodoStore } from './stores/useTodoStore'

const { todos, editingId, addTodo, updateTodo, deleteTodo, startEditing, resetEditing } = useTodoStore()
const { toasts, showSuccess, showError, removeToast } = useToast()

const currentTodo = computed(() => {
  return todos.value.find((todo) => todo.id === editingId.value) ?? null
})

const isEditing = computed(() => editingId.value !== null)

const formValues = computed(() => {
  return currentTodo.value
    ? {
        title: currentTodo.value.title,
        description: currentTodo.value.description,
      }
    : {
        title: '',
        description: '',
      }
})

function handleSubmitTodo(payload) {
  if (!payload.title.trim()) {
    showError('Title is required.')
    return
  }

  if (isEditing.value) {
    const updated = updateTodo(editingId.value, payload)

    if (!updated) {
      showError('Unable to update that todo.')
      return
    }

    resetEditing()
    showSuccess('Todo updated.')
    return
  }

  const added = addTodo(payload)

  if (!added) {
    showError('Unable to add that todo.')
    return
  }

  showSuccess('Todo added.')
}

function handleEditTodo(todo) {
  startEditing(todo.id)
}

function handleDeleteTodo(id) {
  const deleted = deleteTodo(id)

  if (!deleted) {
    showError('Unable to delete that todo.')
    return
  }

  showSuccess('Todo deleted.')
}

function handleCancelEdit() {
  resetEditing()
}
</script>

<template>
  <div id="app">
    <header class="app-shell__header">
      <p class="app-shell__eyebrow">Vue 3 CRUD Demo</p>
      <h1 class="app-shell__title">Keep your tasks clear, current, and local.</h1>
      <p class="app-shell__subtitle">
        Create, edit, and remove todos with local persistence and lightweight notifications.
      </p>
    </header>

    <main class="app-shell__content">
      <TodoForm
        :initial-values="formValues"
        :is-editing="isEditing"
        @submit-todo="handleSubmitTodo"
        @cancel-edit="handleCancelEdit"
      />
      <TodoList :todos="todos" @edit-todo="handleEditTodo" @delete-todo="handleDeleteTodo" />
    </main>

    <AppToast :toasts="toasts" @dismiss-toast="removeToast" />
  </div>
</template>

<style scoped>
#app {
  width: min(960px, calc(100vw - 2rem));
  margin: 0 auto;
  padding: 4rem 0 3rem;
}

#app::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(circle at top left, rgba(74, 144, 217, 0.2), transparent 34%),
    radial-gradient(circle at bottom right, rgba(39, 174, 96, 0.14), transparent 28%);
}

.app-shell__header {
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.78));
  border: 1px solid rgba(220, 223, 230, 0.9);
  border-radius: calc(var(--radius) * 1.5);
  box-shadow: 0 22px 45px rgba(44, 62, 80, 0.08);
}

.app-shell__eyebrow {
  margin-bottom: var(--spacing-sm);
  color: var(--color-primary);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.app-shell__title {
  max-width: 12ch;
  font-size: clamp(2.4rem, 5vw, 4.2rem);
  line-height: 0.95;
}

.app-shell__subtitle {
  max-width: 42rem;
  margin-top: var(--spacing-md);
  color: var(--color-text-muted);
  font-size: 1.05rem;
}

.app-shell__content {
  display: grid;
  gap: var(--spacing-lg);
}

@media (max-width: 640px) {
  #app {
    width: min(100vw - 1rem, 960px);
    padding-top: 1rem;
  }

  .app-shell__header {
    padding: var(--spacing-lg);
  }
}
</style>
