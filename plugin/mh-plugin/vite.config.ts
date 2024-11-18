import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from "url"

export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    port: 1421,
  },
  resolve: {
    dedupe: ['vue'],
    alias: {
      '@': fileURLToPath(new URL("../../src", import.meta.url)),
      'vue': fileURLToPath(new URL("../../node_modules/vue", import.meta.url))
    }
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('vue')) {
              return 'vendor-vue'
            }
            return 'vendor'
          }
        }
      }
    },
    minify: 'esbuild',
    target: 'esnext'
  }
})
