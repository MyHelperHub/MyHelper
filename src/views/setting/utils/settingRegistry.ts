import {
  startClipboardListening,
  stopClipboardListening,
} from "@/composables/clipboard.ts";
import { setHotkeyEnabled } from "@/composables/hotkey.ts";
import { registerTask } from "./startupManager";
import { AppConfig } from "@/interface/database";
import { getConfig } from "@/utils/config";
import { setAutoStartEnabled, syncAutoStartState } from "@/composables/autosStart.ts";

// 模块级缓存变量，存储初始化时的配置
let cachedSettingConfig: AppConfig["settingConfig"] | null = null;

/**
 * 获取最新设置配置
 * 优先使用传入的配置，然后是缓存的初始配置，最后才从数据库获取
 */
const getLatestConfig = async (passedConfig?: AppConfig["settingConfig"]): Promise<AppConfig["settingConfig"]> => {
  // 优先使用传入的配置（避免重复数据库查询）
  if (passedConfig) {
    return passedConfig;
  }

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
/** 初始化时执行的设置相关的函数 */
const initFunction = async (config: AppConfig["settingConfig"]) => {
  // 初始化时同步开机启动状态
  await syncAutoStartState(config.autoStart);
};

/**
 * 初始化设置
 */
export const initSetting = async (
  settingConfig?: AppConfig["settingConfig"],
) => {
  // 缓存初始配置供后续使用
  cachedSettingConfig = settingConfig || null;

  await initFunction(await getLatestConfig(settingConfig));

  // 注册剪贴板监听任务
  registerTask({
    key: "clipboardListening",
    enabledFn: () => {
      startClipboardListening();
    },
    disabledFn: () => {
      stopClipboardListening();
    },
  });

  // 注册快捷键任务
  registerTask({
    key: "hotkey.enabled",
    enabledFn: async () => {
      const config = await getLatestConfig(settingConfig);
      await setHotkeyEnabled(config.hotkey);
    },
    disabledFn: async () => {
      const config = await getLatestConfig(settingConfig);
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
    startEnabledFn: false,
  });

  // 清空缓存（注意：不能过早清空，因为启动任务是异步执行的）
  // cachedSettingConfig = null; // 移除这行，让缓存在实际使用时清空
};
