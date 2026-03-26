<script setup>
import TodoItem from './TodoItem.vue'

const props = defineProps({
  todos: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['edit-todo', 'delete-todo'])

function handleEditTodo(todo) {
  emit('edit-todo', todo)
}

function handleDeleteTodo(id) {
  emit('delete-todo', id)
}
</script>

<template>
  <section class="todo-list">
    <p v-if="!props.todos.length" class="todo-list__empty">No todos yet. Add your first task.</p>
    <div v-else class="todo-list__items">
      <TodoItem
        v-for="todo in props.todos"
        :key="todo.id"
        :todo="todo"
        @edit-todo="handleEditTodo"
        @delete-todo="handleDeleteTodo"
      />
    </div>
  </section>
</template>

<style scoped>
.todo-list {
  min-height: 12rem;
}

.todo-list__items {
  display: grid;
  gap: var(--spacing-md);
}

.todo-list__empty {
  padding: calc(var(--spacing-lg) * 1.25);
  color: var(--color-text-muted);
  text-align: center;
  background: rgba(255, 255, 255, 0.7);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius);
}
</style>
