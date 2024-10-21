import { invoke } from "@tauri-apps/api/core";

/**
 * 获取配置项
 * @param keys 配置项的键值数组，获取指定的配置项
 * @returns 返回对应的配置值
 */
export const ipcGetConfig = async (keys: Array<string>) => {
  return invoke("get_config", { keys });
};

/**
 * 设置配置项
 * @param keys 配置项的键值数组，指定需要设置的配置项
 * @param value 要设置的值，可以是任意类型
 */
export const ipcSetConfig = async (keys: Array<string>, value: any) => {
  return invoke("set_config", { keys, value });
};

/**
 * 删除配置项
 * @param keys 配置项的键值数组，删除指定的配置项
 */
export const ipcDeleteConfig = async (keys: Array<string>) => {
  return invoke("delete_config", { keys });
};
