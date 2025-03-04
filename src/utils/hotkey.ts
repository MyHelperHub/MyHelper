import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { Logger } from "./logger";
import { ipcSetHotkeyEnabled } from "@/api/ipc/hotkey.api";

const actionHandlers = new Map<string, () => void>([
  ["console_log", () => {
    console.log("触发全局快捷键: Ctrl+\\");
  }],
  ["delete", () => {
    console.log("触发全局快捷键: Ctrl+Delete");
  }],
]);

// 监听器的引用
let hotkeyUnlistener: UnlistenFn | null = null;

/**
 * 初始化快捷键监听器
 */
export const initHotkeyListener = async (): Promise<void> => {
  try {
    // 如果已经有监听器，先取消它
    if (hotkeyUnlistener) {
      await hotkeyUnlistener();
      hotkeyUnlistener = null;
    }

    // 监听来自后端的快捷键事件
    hotkeyUnlistener = await listen(
      "hotkey-triggered",
      (event: { payload: string }) => {
        const action = event.payload;

        const handler = actionHandlers.get(action);
        if (handler) {
          handler();
        } else {
          Logger.warn("未找到对应的处理器:", action);
        }
      },
    );
    console.log("快捷键监听器初始化成功");
  } catch (error) {
    Logger.error("初始化快捷键监听器失败:", error);
  }
};

/**
 * 清理热键监听器
 */
const cleanupHotkeyListener = async (): Promise<void> => {
  if (hotkeyUnlistener) {
    await hotkeyUnlistener();
    hotkeyUnlistener = null;
  }
};

/**
 * 注册新的快捷键动作处理器
 */
export const registerActionHandler = (
  action: string,
  handler: () => void,
): void => {
  actionHandlers.set(action, handler);
};

/**
 * 设置热键启用状态
 * @param enabled 是否启用热键
 * @returns 设置是否成功
 */
export const setHotkeyEnabled = async (enabled: boolean): Promise<boolean> => {
  try {
    // 设置后端热键状态
    await ipcSetHotkeyEnabled(enabled);
    
    // 根据状态清理或初始化监听器
    if (enabled) {
      // 不在这里调用初始化，让外部调用
    } else {
      // 如果禁用热键，清理现有的监听器
      await cleanupHotkeyListener();
    }

    return true;
  } catch (error) {
    Logger.error("设置热键状态失败:", error);
    return false;
  }
};
