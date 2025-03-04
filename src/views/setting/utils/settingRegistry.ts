import {
  startClipboardListening,
  stopClipboardListening,
} from "@/utils/clipboard";
import {
  initHotkeyListener,
  setHotkeyEnabled
} from "@/utils/hotkey";
import { registerTask } from "./startupManager";

/**
 * 初始化设置
 */
export const initSetting = async () => {
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
    key: "hotkeyEnabled",
    enabledFn: async () => {
      await setHotkeyEnabled(true);
      await initHotkeyListener();
    },
    disabledFn: async () => {
      await setHotkeyEnabled(false);
      // 清理操作已在setHotkeyEnabled内部处理
    },
  });
};
