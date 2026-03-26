import { reactive, toRefs } from 'vue'

const TOAST_DURATION = 3000

const state = reactive({
  toasts: [],
})

function removeToast(id) {
  state.toasts = state.toasts.filter((toast) => toast.id !== id)
}

function enqueueToast(message, variant) {
  const toast = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    message,
    variant,
  }

  state.toasts.push(toast)

  setTimeout(() => {
    removeToast(toast.id)
  }, TOAST_DURATION)
}

function showSuccess(message) {
  enqueueToast(message, 'success')
}

function showError(message) {
  enqueueToast(message, 'error')
}

export function useToast() {
  return {
    ...toRefs(state),
    showSuccess,
    showError,
    removeToast,
  }
}
