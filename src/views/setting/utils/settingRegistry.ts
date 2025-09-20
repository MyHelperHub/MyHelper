import {
  startClipboardListening,
  stopClipboardListening,
} from "@/composables/clipboard.ts";
import { registerTask } from "./startupManager";
import {
  setAutoStartEnabled,
  syncAutoStartState,
} from "@/composables/autosStart.ts";
import { SettingConfig } from "@/types/setting";
import { loadSettingConfig, setHotkeyEnabledState } from "./settingStore";

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
  const initialConfig = await loadSettingConfig(settingConfig);

  await initFunction(initialConfig);

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
      await setHotkeyEnabledState(true);
    },
    disabledFn: async () => {
      await setHotkeyEnabledState(false);
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
