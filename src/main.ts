import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./assets/main.css";
import { invoke } from "@tauri-apps/api/core";
import { Window } from "@tauri-apps/api/window";
import { startClipboardListening } from "./utils/clipboard";
if (Window.getCurrent().label === "main") {
  invoke("set_window_size", { width: 65, height: 65 });
}

const app = createApp(App);
app.use(router);
app.mount("#app");


startClipboardListening();