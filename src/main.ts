import "@/assets/css/main.css";
import "@/assets/css/base.css";
import "virtual:uno.css";

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "primeicons/primeicons.css";
import { Window } from "@tauri-apps/api/window";
import PrimeVue from "primevue/config";
import Lara from "@primeuix/themes/aura";
import { ipcSetWindowSize } from "./api/ipc/window.api";
import Tooltip from "primevue/tooltip";
import ConfirmationService from "primevue/confirmationservice";
import ToastService from "primevue/toastservice";
import { ErrorHandler } from "./utils/errorHandler";
import {
  preInitTheme,
  completeThemeInit,
  initMainWindow,
} from "./utils/appInit";

// 预初始化主题
await preInitTheme();

if (Window.getCurrent().label === "main") {
  ipcSetWindowSize(65, 65);
  initMainWindow().catch((error) =>
    ErrorHandler.handleError(error, "主窗口初始化失败"),
  );
}

// 生产环境禁用右键菜单
if (!import.meta.env.DEV) {
  document.oncontextmenu = (event) => {
    event.preventDefault();
  };
}

const app = createApp(App);

app.config.errorHandler = async (err, _, info) => {
  await ErrorHandler.handleError(err, info);
};

app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: Lara,
    options: {
      darkModeSelector: ".dark",
      cssLayer: {
        name: "primevue",
        order: "tailwind-base, primevue, tailwind-utilities",
      },
    },
  },
});
app.directive("tooltip", Tooltip);
app.use(ConfirmationService);
app.use(ToastService);

// 完成主题系统初始化
completeThemeInit().catch((error) =>
  ErrorHandler.handleError(error, "主题系统初始化失败"),
);

app.mount("#app");
