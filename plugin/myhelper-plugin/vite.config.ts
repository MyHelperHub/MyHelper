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
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 只打包使用到的 primevue 组件
            if (id.includes('primevue')) {
              const componentName = id.split('primevue/')[1]?.split('/')[0]
              if (componentName) {
                return `primevue-${componentName}`
              }
            }
            // 其他第三方库单独打包
            return 'vendor'
          }
        }
      }
    },
    minify: 'esbuild',
    target: 'esnext'
  }
})
