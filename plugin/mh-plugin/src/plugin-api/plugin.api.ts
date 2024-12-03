import { ipcCloseWindow } from "#/api/ipc/window.api";
import { invoke } from "@tauri-apps/api/core";

/** 关闭当前窗口 */
export const closeWindow = ipcCloseWindow;

/**
 * 获取当前插件持久化配置
 * @param keys 配置项的键值数组，指定需要获取的配置项
 * @returns 返回对应的配置值
 *
 * @example
 * // 获取插件的 'theme' 配置
 * const theme = await getSelfConfig(['theme']);
 *
 * // 获取插件的 'position.x' 配置
 * const x = await getSelfConfig(['position', 'x']);
 */
export const getSelfConfig = async (keys: Array<string>) => {
  return invoke("mh_get_self_config", { keys });
};

/**
 * 设置当前插件持久化配置
 * @param keys 配置项的键值数组，指定需要设置的配置项
 * @param value 要设置的值，可以是任意类型
 *
 * @example
 * // 设置插件的 'theme' 为 'dark'
 * await setSelfConfig(['theme'], 'dark');
 *
 * // 设置插件的 'position' 为 {x: 100, y: 200}
 * await setSelfConfig(['position'], {x: 100, y: 200});
 */
export const setSelfConfig = async (keys: Array<string>, value: any) => {
  return invoke("mh_set_self_config", { keys, value });
};

/**
 * 删除当前插件持久化配置
 * @param keys 配置项的键值数组，删除指定的配置项。空数组表示删除所有配置
 *
 * @example
 * // 删除插件的 'theme' 配置
 * await deleteSelfConfig(['theme']);
 *
 * // 删除插件的所有配置
 * await deleteSelfConfig([]);
 */
export const deleteSelfConfig = async (keys: Array<string>) => {
  return invoke("mh_delete_self_config", { keys });
};
