import "@/assets/css/main.css";
import "@/assets//css/base.css";

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "primeicons/primeicons.css";
import { Window } from "@tauri-apps/api/window";
import PrimeVue from "primevue/config";
import Lara from "@primevue/themes/lara";
import { ipcSetWindowSize } from "./api/ipc/window.api";
if (Window.getCurrent().label === "main") {
  ipcSetWindowSize(65, 65);
}

const app = createApp(App);
app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: Lara,
  },
});
app.mount("#app");
