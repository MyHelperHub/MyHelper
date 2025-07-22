import { Window } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";

import { getConfig, getConfigs } from "./config";
import { ErrorHandler } from "./errorHandler";
import GlobalData from "./globalData";

import { User } from "../interface/user";
import { initTheme, setupThemeListener } from "@/themes/theme";
import { initThemeHelpers } from "@/themes/themeHelpers";
import { initSetting } from "../views/setting/utils/settingRegistry";
import {
  handleSettingChange,
  runStartupTasks,
} from "../views/setting/utils/startupManager";

/**
 * 应用初始化管理器
 */
class AppInitManager {
  private static instance: AppInitManager;
  private themeConfig: any = null;
  private isThemeReady = false;

  private constructor() {}

  static getInstance(): AppInitManager {
    if (!AppInitManager.instance) {
      AppInitManager.instance = new AppInitManager();
    }
    return AppInitManager.instance;
  }

  /**
   * 预初始化主题系统
   */
  async preInitTheme(): Promise<void> {
    if (this.isThemeReady) return;

    try {
      const themeConfig = await getConfig("themeConfig");
      this.themeConfig = themeConfig;

      if (this.themeConfig) {
        await initTheme(this.themeConfig);
      }

      this.isThemeReady = true;
    } catch (error) {
      ErrorHandler.handleError(error, "预初始化主题失败");
      this.isThemeReady = true;
    }
  }

  /**
   * 完成主题系统初始化
   */
  async completeThemeInit(): Promise<void> {
    try {
      await Promise.all([setupThemeListener(), initThemeHelpers()]);
    } catch (error) {
      await ErrorHandler.handleError(error, "主题系统初始化失败");
    }
  }

  /**
   * 初始化主窗口功能
   */
  async initMainWindow(): Promise<void> {
    if (Window.getCurrent().label !== "main") return;

    try {
      await this.preInitTheme();

      // 批量获取剩余配置
      const configs = await getConfigs(["settingConfig", "userConfig"]);
      const settingConfig = configs.settingConfig || {};
      const userConfig = configs.userConfig;

      // 初始化设置系统
      await initSetting(settingConfig);

      // 监听设置变化
      listen(
        "update:setting",
        (event: { payload: { key: string; value: boolean } }) => {
          const { key, value } = event.payload;
          handleSettingChange(key, value);
        },
      );

      // 执行启动任务
      await runStartupTasks((key) => {
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

      await this.initUserState(userConfig);
    } catch (error) {
      await ErrorHandler.handleError(error, "主窗口初始化失败");
    }
  }

  /**
   * 初始化用户状态
   */
  private async initUserState(userConfig: any): Promise<void> {
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
  }

  getThemeConfig(): any {
    return this.themeConfig;
  }

  isThemeInitialized(): boolean {
    return this.isThemeReady;
  }
}

export const appInit = AppInitManager.getInstance();

export const preInitTheme = () => appInit.preInitTheme();
export const completeThemeInit = () => appInit.completeThemeInit();
export const initMainWindow = () => appInit.initMainWindow();
