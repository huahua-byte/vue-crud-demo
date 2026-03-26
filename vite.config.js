import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      'vue-router': fileURLToPath(new URL('./src/router/vue-router-shim.ts', import.meta.url)),
    },
  },
})
