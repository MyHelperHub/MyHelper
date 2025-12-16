import { Window } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import type { UnlistenFn } from "@tauri-apps/api/event";

import { getConfig, getConfigs } from "./config";
import { Logger } from "./logger";
import GlobalData from "./globalData";

import { User } from "../types/user";
import { initTheme, setupThemeListener } from "@/themes/theme";
import { initThemeHelpers } from "@/themes/themeHelpers";
import { initSetting } from "../views/setting/utils/settingRegistry";
import {
  handleSettingChange,
  runStartupTasks,
} from "../views/setting/utils/startupManager";
import { PetGlobalManager } from "../components/Pet/PetGlobalManager";
import { ThemeConfig } from "@/types/theme";

type MainWindowConfigs = {
  themeConfig?: any;
  settingConfig?: any;
  userConfig?: any;
  searchConfig?: any;
};

/**
 * 应用初始化管理器
 */
class AppInitManager {
  private static instance: AppInitManager;
  private isThemeReady = false;
  private unlistenSettingChange?: UnlistenFn;
  private totalConfigs: MainWindowConfigs = {};
  private constructor() {}

  static getInstance(): AppInitManager {
    if (!AppInitManager.instance) {
      AppInitManager.instance = new AppInitManager();
    }
    return AppInitManager.instance;
  }

  async getTotalConfigs(): Promise<MainWindowConfigs> {
    if (Object.keys(this.totalConfigs).length === 0) {
      this.totalConfigs = await getConfigs([
        "themeConfig",
        "settingConfig",
        "userConfig",
        "searchConfig",
      ]);
    }
    return this.totalConfigs;
  }

  /** 获取单个配置 */
  async getSingleConfig(key: string): Promise<any> {
    return this.totalConfigs[key as keyof MainWindowConfigs];
  }

  /** 更新单个配置缓存 */
  updateSingleConfig(key: string, value: any): void {
    this.totalConfigs[key as keyof MainWindowConfigs] = value;
  }
  /**
   * 预初始化主题系统
   * 分阶段初始化的第一步，在Vue应用创建前执行，用于提前设置主题避免闪烁
   * @param themeConfig 可选的主题配置，如果不提供则从数据库获取
   */
  async preInitTheme(themeConfig?: any): Promise<void> {
    if (this.isThemeReady) return;

    try {
      // 如果没有传入themeConfig，则单独获取
      if (themeConfig) {
        this.totalConfigs.themeConfig = themeConfig;
      } else if (this.totalConfigs?.themeConfig) {
        // 已有，无需处理
      } else {
        this.totalConfigs.themeConfig =
          await getConfig<ThemeConfig>("themeConfig");
      }

      await initTheme(this.totalConfigs.themeConfig);

      this.isThemeReady = true;
    } catch (error) {
      this.isThemeReady = false;
      throw error;
    }
  }

  /**
   * 完成主题系统初始化
   * 分阶段初始化的第二步，在Vue应用挂载后执行，用于完成主题系统的完整初始化
   */
  async completeThemeInit(): Promise<void> {
    try {
      await Promise.all([setupThemeListener(), initThemeHelpers()]);
    } catch (error) {
      await Logger.error(error, "主题系统初始化失败");
    }
  }

  /**
   * 初始化主窗口功能
   */
  async initMainWindow(preloadedConfigs?: MainWindowConfigs): Promise<void> {
    if (Window.getCurrent().label !== "main") return;

    try {
      // 批量获取所有配置，包括themeConfig
      const configs = preloadedConfigs ?? this.totalConfigs;
      const themeConfig = configs.themeConfig;
      const settingConfig = configs.settingConfig || {};
      const userConfig = configs.userConfig;

      // 预初始化主题系统，传入已获取的themeConfig
      await this.preInitTheme(themeConfig);

      // 初始化设置系统
      await initSetting(settingConfig);

      // 监听设置变化
      this.unlistenSettingChange?.();
      try {
        this.unlistenSettingChange = await listen(
          "update:setting",
          (event: { payload: { key: string; value: boolean } }) => {
            const { key, value } = event.payload;
            handleSettingChange(key, value);
          },
        );
      } catch (error) {
        await Logger.error(error, "监听设置变化失败");
      }

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

      await Promise.all([
        this.initUserState(userConfig),
        this.initPetManager(),
      ]);
    } catch (error) {
      await Logger.error(error, "主窗口初始化失败");
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

  /**
   * 初始化宠物管理器
   */
  private async initPetManager(): Promise<void> {
    try {
      await PetGlobalManager.init();
    } catch (error) {
      await Logger.error(error, "宠物管理器初始化失败");
    }
  }

  getThemeConfig(): any {
    return this.totalConfigs.themeConfig;
  }

  isThemeInitialized(): boolean {
    return this.isThemeReady;
  }
}

export const appInit = AppInitManager.getInstance();

export const preInitTheme = (themeConfig?: MainWindowConfigs["themeConfig"]) =>
  appInit.preInitTheme(themeConfig);
export const completeThemeInit = () => appInit.completeThemeInit();
export const initMainWindow = (preloadedConfigs?: MainWindowConfigs) =>
  appInit.initMainWindow(preloadedConfigs);
export const getTotalConfigs = () => appInit.getTotalConfigs();
export const getSingleConfig = (key: string) => appInit.getSingleConfig(key);
export const updateSingleConfig = (key: string, value: any) =>
  appInit.updateSingleConfig(key, value);
