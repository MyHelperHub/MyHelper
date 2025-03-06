import {
  startClipboardListening,
  stopClipboardListening,
} from "@/utils/clipboard";
import { setHotkeyEnabled } from "@/utils/hotkey";
import { registerTask } from "./startupManager";
import { AppConfig } from "@/interface/database";
/**
 * 初始化设置
 */
export const initSetting = async (
  settingConfig: AppConfig["settingConfig"],
) => {
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
      await setHotkeyEnabled(settingConfig.hotkey);
    },
    disabledFn: async () => {
      await setHotkeyEnabled(settingConfig.hotkey);
      // 清理操作已在setHotkeyEnabled内部处理
    },
  });
};
