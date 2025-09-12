import {
  ipcSetConfigValue,
  ipcGetConfigValue,
  ipcGetConfigValuesBatch,
  ipcDeleteConfigValue,
} from "@/api/ipc/database.api";

/** 设置配置值 */
export async function setConfigValue(key: string, value: any) {
  await ipcSetConfigValue(key, value);
}

/** 获取配置值 */
export async function getConfigValue<T = any>(key: string): Promise<T | null> {
  return await ipcGetConfigValue<T>(key);
}

/** 批量获取配置值 */
export async function getConfigValuesBatch<T = any>(
  keys: string[],
): Promise<Record<string, T | null>> {
  return await ipcGetConfigValuesBatch<T>(keys);
}

/** 删除配置值 */
export async function deleteConfigValue(key: string) {
  await ipcDeleteConfigValue(key);
}
