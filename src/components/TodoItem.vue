<script setup>
import { computed } from 'vue'

const props = defineProps({
  todo: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['edit-todo', 'delete-todo'])

const formattedCreatedAt = computed(() => {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(props.todo.createdAt))
})

function handleEdit() {
  emit('edit-todo', props.todo)
}

function handleDelete() {
  emit('delete-todo', props.todo.id)
}
</script>

<template>
  <article class="todo-item">
    <div class="todo-item__content">
      <p class="todo-item__meta">Created {{ formattedCreatedAt }}</p>
      <h3 class="todo-item__title">{{ todo.title }}</h3>
      <p v-if="todo.description" class="todo-item__description">
        {{ todo.description }}
      </p>
    </div>

    <div class="todo-item__actions">
      <button class="todo-item__button todo-item__button--edit" type="button" @click="handleEdit">
        Edit
      </button>
      <button
        class="todo-item__button todo-item__button--delete"
        type="button"
        @click="handleDelete"
      >
        Delete
      </button>
    </div>
  </article>
</template>

<style scoped>
.todo-item {
  display: grid;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: 0 16px 32px rgba(44, 62, 80, 0.06);
}

.todo-item__content {
  display: grid;
  gap: 0.4rem;
}

.todo-item__meta {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.todo-item__title {
  font-size: 1.1rem;
  line-height: 1.3;
}

.todo-item__description {
  color: var(--color-text-muted);
}

.todo-item__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.todo-item__button {
  border: none;
  border-radius: calc(var(--radius) - 2px);
  padding: 0.7rem 1rem;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.todo-item__button--edit {
  color: #ffffff;
  background: var(--color-primary);
}

.todo-item__button--edit:hover {
  background: var(--color-primary-hover);
}

.todo-item__button--delete {
  color: #ffffff;
  background: var(--color-danger);
}

.todo-item__button--delete:hover {
  background: var(--color-danger-hover);
}

@media (min-width: 720px) {
  .todo-item {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
  }

  .todo-item__actions {
    justify-content: flex-end;
  }
}
</style>
