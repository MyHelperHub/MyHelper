import "@/assets/css/main.css";
import "@/assets//css/base.css";
import "virtual:uno.css";

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "primeicons/primeicons.css";
import { Window } from "@tauri-apps/api/window";
import PrimeVue from "primevue/config";
import Lara from "@primevue/themes/lara";
import { ipcSetWindowSize } from "./api/ipc/window.api";
import {
  handleSettingChange,
  runStartupTasks,
} from "./views/setting/utils/startupManager";
import { initSetting } from "./views/setting/utils/settingRegistry";
import { getConfig } from "./utils/config";
import { listen } from "@tauri-apps/api/event";
import Tooltip from "primevue/tooltip";
import ConfirmationService from "primevue/confirmationservice";
import ToastService from "primevue/toastservice";
import { getUserConfig } from "./utils/user";
import GlobalData from "./utils/globalData";
import { User } from "./interface/user";
import { ErrorHandler } from "./utils/errorHandler";
import { initHotkeyListener } from "./utils/hotkey";

if (Window.getCurrent().label === "main") {
  ipcSetWindowSize(65, 65);
  async function initializeApp() {
    try {
      // 初始化设置
      initSetting();
      const config = await getConfig<Record<string, boolean>>("settingConfig");
      const settingData: Record<string, boolean> = config || {};
      // 监听设置变化,将所有设置都放在main窗口里执行
      listen(
        "update:setting",
        (event: { payload: { key: string; value: boolean } }) => {
          const { key, value } = event.payload;
          handleSettingChange(key, value);
        },
      );
      await runStartupTasks((key) => {
        return settingData[key] === true;
      });

      // 初始化登录状态
      const userConfig = await getUserConfig();
      if (!userConfig) {
        await GlobalData.set("userInfo", {
          UserId: -1,
          Username: "",
          Email: "",
          Avatar: "",
          Token: "",
        } as User);
      } else {
        await GlobalData.set("userInfo", userConfig as User);
      }
      
      // 初始化快捷键监听器
      await initHotkeyListener();
    } catch (error) {
      console.error("初始化失败:", error);
    }
  }

  initializeApp();
}
// 非开发环境下禁用默认右键菜单
if (!import.meta.env.DEV) {
  document.oncontextmenu = (event) => {
    event.preventDefault();
  };
}
const app = createApp(App);

// 注入全局错误处理
app.config.errorHandler = async (err, _, info) => {
  await ErrorHandler.handleError(err, info);
};

// 捕获未处理的 Promise 错误
window.addEventListener("unhandledrejection", async (event) => {
  await ErrorHandler.handleError(event.reason, "Unhandled Promise Rejection");
});

app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: Lara,
  },
});
app.directive("tooltip", Tooltip);
app.use(ConfirmationService);
app.use(ToastService);

app.mount("#app");
