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

export async function ipcSetPluginConfigValue(windowId: string, info: any, config: any, data: any) {
  return await invoke("set_plugin_config_value", { windowId, info, config, data });
}

export async function ipcGetPluginConfigValue(windowId?: string) {
  return await invoke("get_plugin_config_value", { windowId });
}

export async function ipcDeletePluginConfigValue(windowId?: string) {
  return await invoke("delete_plugin_config_value", { windowId });
} 