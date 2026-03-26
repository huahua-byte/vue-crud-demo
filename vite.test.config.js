import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: '.test-dist',
    rollupOptions: {
      input: 'src/test/run-booking-tests.ts',
      output: {
        entryFileNames: 'run-booking-tests.mjs',
        format: 'es',
      },
    },
    ssr: true,
    target: 'node20',
  },
})
