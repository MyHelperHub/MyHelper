import { defineConfig } from 'unocss'
import presetUno from '@unocss/preset-uno'

export default defineConfig({
  presets: [
    presetUno()
  ],
  theme: {
    colors: {
      // 可以定义与 PrimeVue 匹配的颜色
      primary: {
        50: 'var(--p-primary-50)',
        // ... 其他色阶
      }
    }
  }
})