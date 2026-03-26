import { ref, watchEffect } from 'vue'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'vue-crud-theme'

const theme = ref<Theme>(loadTheme())

function loadTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') {
      return stored
    }
  } catch {
    // localStorage unavailable
  }
  return 'light'
}

watchEffect(() => {
  document.documentElement.setAttribute('data-theme', theme.value)
  try {
    localStorage.setItem(STORAGE_KEY, theme.value)
  } catch {
    // localStorage unavailable
  }
})

function toggleTheme(): void {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

export function useTheme() {
  return {
    theme,
    toggleTheme,
  }
}
