import "@/assets/css/main.css";
import "@/assets//css/base.css";
import "virtual:uno.css";

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "primeicons/primeicons.css";
import PrimeVue from "primevue/config";
import Lara from "@primevue/themes/lara";
import Tooltip from "primevue/tooltip";
import ConfirmationService from "primevue/confirmationservice";

// 非开发环境下禁用默认右键菜单
if (!import.meta.env.DEV) {
  document.oncontextmenu = (event) => {
    event.preventDefault();
  };
}
const app = createApp(App);
app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: Lara,
  },
});
app.directive("tooltip", Tooltip);
app.use(ConfirmationService);

app.mount("#app");
