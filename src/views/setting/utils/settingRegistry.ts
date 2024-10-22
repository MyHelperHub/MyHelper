import {
  startClipboardListening,
  stopClipboardListening,
} from "@/utils/clipboard";
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
};
