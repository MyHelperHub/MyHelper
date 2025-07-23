import {
  ipcSetConfigValue,
  ipcGetConfigValue,
  ipcGetConfigValuesBatch,
  ipcDeleteConfigValue,
} from "@/api/ipc/database.api";

export async function setConfigValue(key: string, value: any) {
  await ipcSetConfigValue(key, value);
}

export async function getConfigValue<T = any>(key: string): Promise<T | null> {
  return await ipcGetConfigValue<T>(key);
}

export async function getConfigValuesBatch<T = any>(
  keys: string[],
): Promise<Record<string, T | null>> {
  return await ipcGetConfigValuesBatch<T>(keys);
}

export async function deleteConfigValue(key: string) {
  await ipcDeleteConfigValue(key);
}
