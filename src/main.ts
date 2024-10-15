import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./assets/main.css";
import "primeicons/primeicons.css";
import { invoke } from "@tauri-apps/api/core";
import { Window } from "@tauri-apps/api/window";
import PrimeVue from "primevue/config";
import Lara from "@primevue/themes/lara";
if (Window.getCurrent().label === "main") {
  invoke("set_window_size", { width: 65, height: 65 });
}

const app = createApp(App);
app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: Lara,
  },
});
app.mount("#app");
