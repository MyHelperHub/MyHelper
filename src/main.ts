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
import { Logger } from "./utils/logger";
import {
  preInitTheme,
  completeThemeInit,
  initMainWindow,
  getTotalConfigs,
} from "./utils/appInit";
import windowDrag from "./utils/windowDrag";

if (!import.meta.env.DEV) {
  document.oncontextmenu = (event) => {
    event.preventDefault();
  };
}

const bootstrap = async () => {
  const isMainWindow = Window.getCurrent().label === "main";
  let mainWindowConfigs;
  if (isMainWindow) {
    mainWindowConfigs = await getTotalConfigs();
  }
  await preInitTheme(mainWindowConfigs?.themeConfig);

  if (isMainWindow) {
    await ipcSetWindowSize(65, 65).catch((error) =>
      Logger.error(error, "设置窗口尺寸失败"),
    );

    await initMainWindow(mainWindowConfigs);
  }

  const app = createApp(App);

  app.config.errorHandler = async (err, _, info) => {
    await Logger.error(err, info);
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
  app.directive("window-drag", windowDrag);

  app.mount("#app");

  await completeThemeInit().catch((error) =>
    Logger.error(error, "主题系统初始化失败"),
  );
};

bootstrap().catch((error) => Logger.error(error, "应用启动失败"));
