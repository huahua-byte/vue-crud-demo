<script setup>
const props = defineProps({
  toasts: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['dismiss-toast'])

function handleDismiss(id) {
  emit('dismiss-toast', id)
}
</script>

<template>
  <div class="app-toast" aria-live="polite" aria-atomic="true">
    <article
      v-for="toast in props.toasts"
      :key="toast.id"
      class="app-toast__item"
      :class="`app-toast__item--${toast.variant}`"
    >
      <p class="app-toast__message">{{ toast.message }}</p>
      <button class="app-toast__dismiss" type="button" @click="handleDismiss(toast.id)">
        Dismiss
      </button>
    </article>
  </div>
</template>

<style scoped>
.app-toast {
  position: fixed;
  top: var(--spacing-lg);
  right: var(--spacing-lg);
  z-index: 20;
  display: grid;
  gap: var(--spacing-sm);
  width: min(22rem, calc(100vw - 2rem));
}

.app-toast__item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--spacing-sm);
  align-items: center;
  padding: 0.9rem 1rem;
  color: #ffffff;
  border-radius: var(--radius);
  box-shadow: 0 14px 30px rgba(44, 62, 80, 0.18);
}

.app-toast__item--success {
  background: var(--color-success);
}

.app-toast__item--error {
  background: var(--color-danger);
}

.app-toast__message {
  line-height: 1.4;
}

.app-toast__dismiss {
  color: inherit;
  background: transparent;
  border: none;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  opacity: 0.85;
}

@media (max-width: 640px) {
  .app-toast {
    top: var(--spacing-md);
    right: var(--spacing-md);
  }

  .app-toast__item {
    grid-template-columns: 1fr;
  }
}
</style>
