import { invokeApi } from "./wrapper";

/**
 * 设置配置值
 * @param key 配置键名
 * @param value 配置值
 */
export async function ipcSetConfigValue(
  key: string,
  value: any,
): Promise<void> {
  await invokeApi<void>("set_config_value", { key, value });
}

/**
 * 获取配置值
 * @param key 配置键名
 * @returns 配置值，如果不存在返回 null
 */
export async function ipcGetConfigValue<T = any>(
  key: string,
): Promise<T | null> {
  return await invokeApi<T | null>("get_config_value", { key });
}

/**
 * 删除配置值
 * @param key 配置键名，如果为空字符串则删除所有配置
 */
export async function ipcDeleteConfigValue(key: string): Promise<void> {
  await invokeApi<void>("delete_config_value", { key });
}

/**
 * 设置插件配置值
 * @param windowId 窗口ID
 * @param info 插件信息
 * @param config 配置信息
 * @param data 数据信息
 */
export async function ipcSetPluginConfigValue(
  windowId: string,
  info: any,
  config: any,
  data: any,
): Promise<void> {
  await invokeApi<void>("set_plugin_config_value", {
    windowId,
    info,
    config,
    data,
  });
}

/**
 * 获取插件配置值
 * @param windowId 窗口ID，可选
 * @returns 插件配置列表
 */
export async function ipcGetPluginConfigValue(windowId?: string): Promise<any[]> {
  return await invokeApi<any[]>("get_plugin_config_value", { windowId });
}

/**
 * 删除插件配置值
 * @param windowId 窗口ID，可选
 */
export async function ipcDeletePluginConfigValue(windowId?: string): Promise<void> {
  await invokeApi<void>("delete_plugin_config_value", { windowId });
}
