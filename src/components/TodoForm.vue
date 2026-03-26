<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  initialValues: {
    type: Object,
    required: true,
  },
  isEditing: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['submit-todo', 'cancel-edit'])

const form = reactive({
  title: '',
  description: '',
})

watch(
  () => props.initialValues,
  (values) => {
    form.title = values.title ?? ''
    form.description = values.description ?? ''
  },
  { immediate: true }
)

function handleSubmit() {
  const title = form.title.trim()

  if (!title) {
    return
  }

  emit('submit-todo', {
    title,
    description: form.description.trim(),
  })

  if (!props.isEditing) {
    form.title = ''
    form.description = ''
  }
}

function handleCancel() {
  form.title = props.initialValues.title ?? ''
  form.description = props.initialValues.description ?? ''
  emit('cancel-edit')
}
</script>

<template>
  <form
    class="todo-form"
    :class="{ 'todo-form--editing': isEditing }"
    @submit.prevent="handleSubmit"
  >
    <div class="todo-form__field">
      <label class="todo-form__label" for="todo-title">Title</label>
      <input
        id="todo-title"
        v-model="form.title"
        class="todo-form__input"
        type="text"
        name="title"
        placeholder="What needs to get done?"
        required
      />
    </div>

    <div class="todo-form__field">
      <label class="todo-form__label" for="todo-description">Description</label>
      <textarea
        id="todo-description"
        v-model="form.description"
        class="todo-form__textarea"
        name="description"
        rows="4"
        placeholder="Add more context for this task"
      />
    </div>

    <div class="todo-form__actions">
      <button class="todo-form__button todo-form__button--primary" type="submit">
        {{ isEditing ? 'Update' : 'Add' }}
      </button>
      <button
        v-if="isEditing"
        class="todo-form__button todo-form__button--secondary"
        type="button"
        @click="handleCancel"
      >
        Cancel
      </button>
    </div>
  </form>
</template>

<style scoped>
.todo-form {
  display: grid;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: 0 18px 40px rgba(44, 62, 80, 0.08);
}

.todo-form--editing {
  border-color: var(--color-primary);
}

.todo-form__field {
  display: grid;
  gap: var(--spacing-sm);
}

.todo-form__label {
  font-size: 0.95rem;
  font-weight: 600;
}

.todo-form__input,
.todo-form__textarea {
  width: 100%;
  padding: 0.85rem 1rem;
  color: var(--color-text);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: calc(var(--radius) - 2px);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.todo-form__input:focus,
.todo-form__textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.18);
}

.todo-form__textarea {
  resize: vertical;
  min-height: 7rem;
}

.todo-form__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.todo-form__button {
  border: none;
  border-radius: calc(var(--radius) - 2px);
  padding: 0.8rem 1.25rem;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.todo-form__button:hover {
  transform: translateY(-1px);
}

.todo-form__button--primary {
  color: #ffffff;
  background: var(--color-primary);
}

.todo-form__button--primary:hover {
  background: var(--color-primary-hover);
}

.todo-form__button--secondary {
  color: var(--color-text);
  background: transparent;
  border: 1px solid var(--color-border);
}

@media (max-width: 640px) {
  .todo-form {
    padding: var(--spacing-md);
  }

  .todo-form__actions {
    flex-direction: column;
  }

  .todo-form__button {
    width: 100%;
  }
}
</style>
