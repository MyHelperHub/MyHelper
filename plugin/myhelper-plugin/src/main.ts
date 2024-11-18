import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import App from './App.vue'
import '@/assets/css/main.css'
import 'primeicons/primeicons.css'

const app = createApp(App)
app.use(PrimeVue as any)
app.mount('#app')
