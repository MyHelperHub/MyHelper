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
 * 批量获取配置值
 * @param keys 配置键名数组
 * @returns 配置值映射对象，键为配置名，值为配置值（不存在时为null）
 */
export async function ipcGetConfigValuesBatch<T = any>(
  keys: string[],
): Promise<Record<string, T | null>> {
  return await invokeApi<Record<string, T | null>>("get_config_values_batch", {
    keys,
  });
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
export async function ipcGetPluginConfigValue(
  windowId?: string,
): Promise<any[]> {
  return await invokeApi<any[]>("get_plugin_config_value", { windowId });
}

/**
 * 删除插件配置值
 * @param windowId 窗口ID，可选
 */
export async function ipcDeletePluginConfigValue(
  windowId?: string,
): Promise<void> {
  await invokeApi<void>("delete_plugin_config_value", { windowId });
}

// === 宠物配置相关 API ===

/**
 * 设置宠物配置
 * @param configType 配置类型 ('selectedModel' | 'preferences')
 * @param configData 配置数据
 */
export async function ipcSetPetConfig(
  configType: string,
  configData: any,
): Promise<void> {
  await invokeApi<void>("set_pet_config", { configType, configData });
}

/**
 * 获取宠物配置
 * @param configType 配置类型 ('selectedModel' | 'preferences')
 * @returns 配置数据，如果不存在返回 null
 */
export async function ipcGetPetConfig<T = any>(
  configType: string,
): Promise<T | null> {
  return await invokeApi<T | null>("get_pet_config", { configType });
}

/**
 * 删除宠物配置
 * @param configType 配置类型
 */
export async function ipcDeletePetConfig(configType: string): Promise<void> {
  await invokeApi<void>("delete_pet_config", { configType });
}
