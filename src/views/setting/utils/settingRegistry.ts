import {
  startClipboardListening,
  stopClipboardListening,
} from "@/composables/clipboard.ts";
import { setHotkeyEnabled } from "@/composables/hotkey.ts";
import { registerTask } from "./startupManager";
import { getConfig } from "@/utils/config";
import {
  setAutoStartEnabled,
  syncAutoStartState,
} from "@/composables/autosStart.ts";
import { SettingConfig } from "@/types/setting";

/** 模块级缓存变量，存储初始化时的配置 */
let cachedSettingConfig: SettingConfig | null = null;

/**
 * 获取最新设置配置
 * 优先使用传入的配置，然后是缓存的初始配置，最后才从数据库获取
 */
const getLatestConfig = async (
  passedConfig?: SettingConfig,
): Promise<SettingConfig> => {
  if (passedConfig) {
    return passedConfig;
  }

  if (cachedSettingConfig) {
    const config = cachedSettingConfig;
    cachedSettingConfig = null;
    return config;
  }

  const latestConfig =
    (await getConfig<SettingConfig>("settingConfig")) || ({} as SettingConfig);
  return latestConfig;
};
/** 初始化时执行的设置相关的函数 */
const initFunction = async (config: SettingConfig) => {
  // 初始化时同步开机启动状态
  await syncAutoStartState(config.autoStart);
};

/**
 * 初始化设置
 */
export const initSetting = async (settingConfig?: SettingConfig) => {
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
};
