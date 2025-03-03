import { listen, UnlistenFn } from "@tauri-apps/api/event";

// 定义一个动作处理器映射
const actionHandlers: Record<string, () => void> = {
  console_log: () => {
    console.log("触发全局快捷键: Ctrl+\\");
    // 添加更明显的提示
    alert("触发全局快捷键: Ctrl+\\");
  },
};

// 保存监听器的引用，以便在需要时可以取消监听
let hotkeyUnlistener: UnlistenFn | null = null;

/**
 * 初始化快捷键监听器
 */
export const initHotkeyListener = async (): Promise<void> => {
  try {
    console.log("正在初始化快捷键监听器...");

    // 如果已经有监听器，先取消它
    if (hotkeyUnlistener) {
      await hotkeyUnlistener();
      console.log("已取消旧的快捷键监听器");
    }

    // 监听来自后端的快捷键事件
    hotkeyUnlistener = await listen(
      "hotkey-triggered",
      (event: { payload: string }) => {
        console.log("收到快捷键事件:", event.payload);

        const action = event.payload;

        // 使用预定义的处理器处理动作
        const handler = actionHandlers[action];
        if (handler) {
          handler();
        } else {
          console.warn("未找到对应的处理器:", action);
        }
      },
    );

    console.log("快捷键监听器初始化成功");
  } catch (error) {
    console.error("初始化快捷键监听器失败:", error);
    alert("初始化快捷键监听器失败: " + error);
  }
};

/**
 * 注册新的快捷键动作处理器
 */
export const registerActionHandler = (
  action: string,
  handler: () => void,
): void => {
  actionHandlers[action] = handler;
};

/**
 * 取消快捷键监听
 */
export const cleanupHotkeyListener = async (): Promise<void> => {
  if (hotkeyUnlistener) {
    await hotkeyUnlistener();
    hotkeyUnlistener = null;
  }
};
