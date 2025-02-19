import { invoke } from "@tauri-apps/api/core";
import { WindowConfig } from "@/interface/window";
import { WindowOperation } from "@/interface/enum";

/**
 * 创建新窗口
 * @param options 窗口配置选项
 */
export const ipcCreateNewWindow = async (options: WindowConfig) => {
  try {
    await invoke("create_new_window", { ...options });
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * 统一的窗口控制函数
 * @param operation 操作类型
 * @param params 窗口控制参数，包含 window_id 等
 */
export const ipcWindowControl = async (
  operation: WindowOperation,
  params?: any
) => {
  try {
    await invoke("window_control", { operation, params });
  } catch (e) {
    throw e;
  }
};

/**
 * 设置窗口的大小
 * @param width 窗口宽度
 * @param height 窗口高度
 */
export const ipcSetWindowSize = (width: number, height: number) => {
  invoke("set_window_size", { width, height });
};
