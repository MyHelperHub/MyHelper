import { createApp } from "vue";
import PrimeVue from "primevue/config";
import App from "./App.vue";
import "#/assets/css/main.css";
import "primeicons/primeicons.css";
import Lara from "@primevue/themes/lara";
import ToastService from "primevue/toastservice";

const app = createApp(App);
app.use(PrimeVue, {
  theme: {
    preset: Lara,
  },
});
app.use(ToastService);
app.mount("#app");
