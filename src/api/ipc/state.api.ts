import { invoke } from "@tauri-apps/api/core";

/**
 * 设置或更新全局数据
 * @param key 键名
 * @param value 数据值
 */
export const ipcSetGlobalData = async (
  key: string,
  value: string,
): Promise<void> => {
  return await invoke("set_global_data", { key, value });
};

/**
 * 获取全局数据
 * @param key 键名，如果不传则返回所有数据
 * @returns 返回存储的数据，如果不存在则返回 null
 */
export const ipcGetGlobalData = async (
  key?: string,
): Promise<string | null> => {
  return await invoke("get_global_data", { key });
};

/**
 * 删除全局数据
 * @param key 键名
 */
export const ipcDeleteGlobalData = async (key: string): Promise<void> => {
  return await invoke("delete_global_data", { key });
};
