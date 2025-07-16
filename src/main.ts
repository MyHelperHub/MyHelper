import "@/assets/css/main.css";
import "@/assets//css/base.css";
import "virtual:uno.css";

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "primeicons/primeicons.css";
import { Window } from "@tauri-apps/api/window";
import PrimeVue from "primevue/config";
import Lara from "@primeuix/themes/aura";
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

// 主题系统
import { initTheme, setupThemeListener } from "@/themes/theme";
import { initThemeHelpers } from "@/themes/themeHelpers";

if (Window.getCurrent().label === "main") {
  ipcSetWindowSize(65, 65);
  async function initializeApp() {
    try {
      // 初始化设置
      const settingConfig = (await getConfig("settingConfig")) || {};
      await initSetting(settingConfig);
      // 监听设置变化,将所有设置都放在main窗口里执行
      listen(
        "update:setting",
        (event: { payload: { key: string; value: boolean } }) => {
          const { key, value } = event.payload;
          handleSettingChange(key, value);
        },
      );

      await runStartupTasks((key) => {
        // 通过键路径获取值（支持嵌套路径如'hotkey.enabled'）
        const getValue = (obj: any, path: string): any => {
          if (!obj || !path) return undefined;
          const keys = path.split(".");

          for (const key of keys) {
            if (obj === undefined || obj === null) return undefined;
            obj = obj[key];
          }

          return obj;
        };

        return getValue(settingConfig, key) === true;
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
    } catch (error) {
      await ErrorHandler.handleError(error, "初始化失败");
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

app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: Lara,
    options: {
      darkModeSelector: '.dark',
      cssLayer: {
        name: 'primevue',
        order: 'tailwind-base, primevue, tailwind-utilities'
      }
    }
  },
});
app.directive("tooltip", Tooltip);
app.use(ConfirmationService);
app.use(ToastService);

// 初始化主题系统
Promise.all([
  initTheme(), 
  setupThemeListener(), 
  initThemeHelpers()
]).catch(
  (error) => ErrorHandler.handleError(error, "主题系统初始化失败"),
);

app.mount("#app");
