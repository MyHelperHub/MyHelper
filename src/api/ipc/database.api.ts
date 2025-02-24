import { invoke } from "@tauri-apps/api/core";

/**
 * 设置配置值
 * @param key 配置键名
 * @param value 配置值
 */
export async function ipcSetConfigValue(key: string, value: any): Promise<void> {
  await invoke("set_config_value", { key, value });
}

/**
 * 获取配置值
 * @param key 配置键名
 * @returns 配置值，如果不存在返回 null
 */
export async function ipcGetConfigValue<T = any>(key: string): Promise<T | null> {
  return await invoke<T | null>("get_config_value", { key });
}

/**
 * 删除配置值
 * @param key 配置键名，如果为空字符串则删除所有配置
 */
export async function ipcDeleteConfigValue(key: string): Promise<void> {
  await invoke("delete_config_value", { key });
} 