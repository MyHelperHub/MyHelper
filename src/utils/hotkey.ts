import { listen, UnlistenFn } from '@tauri-apps/api/event';

// 定义一个动作处理器映射
const actionHandlers: Record<string, () => void> = {
  console_log: () => console.log('触发全局快捷键: Ctrl+\\'),
};

// 保存监听器的引用，以便在需要时可以取消监听
let hotkeyUnlistener: UnlistenFn | null = null;

/**
 * 初始化快捷键监听器
 */
export const initHotkeyListener = async(): Promise<void> => {
  try {
    // 如果已经有监听器，先取消它
    if (hotkeyUnlistener) {
      await hotkeyUnlistener();
    }
    
    // 监听来自后端的快捷键事件
    hotkeyUnlistener = await listen('hotkey-triggered', (event: { payload: string }) => {
      const action = event.payload;
      
      // 使用预定义的处理器处理动作
      const handler = actionHandlers[action];
      if (handler) {
        handler();
      } else {
        console.log(`未知的快捷键动作: ${action}`);
      }
    });
    
    console.log('快捷键监听器已初始化');
  } catch (error) {
    console.error('初始化快捷键监听器失败:', error);
  }
};

/**
 * 注册新的快捷键动作处理器
 */
export const registerActionHandler = (action: string, handler: () => void): void => {
  actionHandlers[action] = handler;
};

/**
 * 取消快捷键监听
 */
export const cleanupHotkeyListener = async(): Promise<void> => {
  if (hotkeyUnlistener) {
    await hotkeyUnlistener();
    hotkeyUnlistener = null;
    console.log('快捷键监听器已清理');
  }
}; 
