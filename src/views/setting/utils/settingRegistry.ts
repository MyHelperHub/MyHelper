import {
  startClipboardListening,
  stopClipboardListening,
} from "@/utils/clipboard";
import { setHotkeyEnabled } from "@/utils/hotkey";
import { registerTask } from "./startupManager";
import { AppConfig } from "@/interface/database";
import { getConfig } from "@/utils/config";
import { setAutoStartEnabled } from "@/utils/autosSart";

// 模块级缓存变量，存储初始化时的配置
let cachedSettingConfig: AppConfig["settingConfig"] | null = null;

/**
 * 获取最新设置配置
 * 优先使用缓存的初始配置，如果没有则从数据库获取
 */
const getLatestConfig = async (): Promise<AppConfig["settingConfig"]> => {
  if (cachedSettingConfig) {
    const config = cachedSettingConfig;
    // 使用后立即清空缓存，确保下次获取最新值
    cachedSettingConfig = null;
    return config;
  }

  // 缓存为空时从数据库获取最新配置
  const latestConfig = (await getConfig("settingConfig")) || {};
  return latestConfig;
};

/**
 * 初始化设置
 */
export const initSetting = async (
  settingConfig?: AppConfig["settingConfig"],
) => {
  // 缓存初始配置供后续使用
  cachedSettingConfig = settingConfig || null;

  registerTask({
    key: "clipboardListening",
    enabledFn: () => {
      startClipboardListening();
    },
    disabledFn: () => {
      stopClipboardListening();
    },
  });

  registerTask({
    key: "hotkey.enabled",
    enabledFn: async () => {
      const config = await getLatestConfig();
      await setHotkeyEnabled(config.hotkey);
    },
    disabledFn: async () => {
      const config = await getLatestConfig();
      // 确保总开关关闭
      const hotkeyConfig = { ...config.hotkey, enabled: false };
      await setHotkeyEnabled(hotkeyConfig);
    },
  });

  // 注册自动启动任务
  registerTask({
    key: "autoStart",
    enabledFn: async () => {
      await setAutoStartEnabled(true);
    },
    disabledFn: async () => {
      await setAutoStartEnabled(false);
    },
    startEnabledFn: true,
    startDisabledFn: true,
  });

  cachedSettingConfig = null;
};
