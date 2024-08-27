import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
// import { setupTray } from "./utils/tray";

// setupTray();
const app = createApp(App);
app.use(router)
app.mount("#app");
