import { invoke } from "@tauri-apps/api/core";
import { WindowConfig } from "@/interface/window";

/**
 * 创建新窗口
 * @param options 窗口配置选项
 */
export const ipcCreateNewWindow = async (options: WindowConfig) => {
  try {
    await invoke("create_new_window", { ...options });
  } catch (e) {
    return 0;
  }
};

/**
 * 关闭指定窗口
 * @param windowId 窗口唯一标识符
 */
export const ipcCloseWindow = async (windowId: string) => {
  try {
    await invoke("close_new_window", { windowId });
  } catch (e) {
    throw e;
  }
};

/**
 * 设置窗口是否置顶
 * @param windowId 窗口唯一标识符
 * @param isAlwaysOnTop 窗口是否总是置顶
 */
export const ipcSetWindowAlwaysOnTop = async (
  windowId: string,
  isAlwaysOnTop: boolean,
) => {
  invoke("set_window_always_on_top", { windowId, isAlwaysOnTop });
};

/**
 * 设置窗口的大小
 * @param width 窗口宽度
 * @param height 窗口高度
 */
export const ipcSetWindowSize = (width: number, height: number) => {
  invoke("set_window_size", { width, height });
};
