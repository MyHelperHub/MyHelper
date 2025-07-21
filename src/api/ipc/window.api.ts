import { invokeApi, safeInvokeApi } from "./wrapper";
import { WindowConfig } from "@/interface/window";
import { WindowOperation } from "@/interface/enum";

/**
 * 创建新窗口
 * @param options 窗口配置选项
 * @returns 创建是否成功
 */
export const ipcCreateNewWindow = async (options: WindowConfig): Promise<boolean> => {
  const response = await safeInvokeApi<void>("create_new_window", { ...options });
  return response.code === 0; // 成功返回 true，失败返回 false
};

/**
 * 统一的窗口控制函数
 * @param operation 操作类型
 * @param params 窗口控制参数，包含 window_id 等
 */
export const ipcWindowControl = async (
  operation: WindowOperation,
  params?: any,
): Promise<void> => {
  await invokeApi<void>("window_control", { operation, params });
};

/**
 * 设置窗口的大小
 * @param width 窗口宽度
 * @param height 窗口高度
 */
export const ipcSetWindowSize = async (width: number, height: number): Promise<void> => {
  await invokeApi<void>("set_window_size", { width, height });
};
