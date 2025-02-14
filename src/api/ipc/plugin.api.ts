import { invoke } from "@tauri-apps/api/core";

/**
 * 获取插件配置数据
 * @param {Array<string>} keys - 配置项的键列表
 * @returns {Promise<unknown>} - 返回配置数据，如果配置不存在则返回null
 * @throws 如果获取配置失败，将抛出错误
 *
 * @example
 * // 获取插件列表
 * const pluginList = await ipcGetPluginConfig(['pluginList']);
 * 
 * // 获取特定插件的配置
 * const pluginConfig = await ipcGetPluginConfig(['pluginList', 'my-plugin']);
 */
export const ipcGetPluginConfig = async (keys: Array<string>) => {
  return invoke("get_plugin_config", { keys });
};

/**
 * 设置插件配置
 * @param keys 配置项的键值数组，指定需要设置的插件配置项
 * @param value 要设置的值，可以是任意类型
 * 
 * @example
 * // 设置插件的 'position' 为 [100, 200]
 * await ipcSetPluginConfig(['position'], [100, 200]);
 * 
 * // 设置插件的 'alwaysOnTop' 为 true
 * await ipcSetPluginConfig(['alwaysOnTop'], true);
 */
export const ipcSetPluginConfig = async (keys: Array<string>, value: any) => {
  return invoke("set_plugin_config", { keys, value });
};

/**
 * 删除插件配置
 * @param keys 配置项的键值数组，删除指定的插件配置项。空数组表示删除所有配置
 * 
 * @example
 * // 删除插件的 'position' 配置
 * await ipcDeletePluginConfig(['position']);
 * 
 * // 删除插件的所有配置
 * await ipcDeletePluginConfig([]);
 */
export const ipcDeletePluginConfig = async (keys: Array<string>) => {
  return invoke("delete_plugin_config", { keys });
};

/**
 * 安装插件
 * @param url 插件下载地址
 * @param windowId 插件的窗口ID
 */
export const ipcInstallPlugin = async (url: string, windowId: string) => {
  return invoke("mh_plugin_install", { url, windowId });
};

/**
 * 卸载插件
 * @param windowId 要卸载的插件的窗口ID
 * 
 * @example
 * await ipcUninstallPlugin('my-plugin-window');
 */
export const ipcUninstallPlugin = async (windowId: string) => {
  return invoke("mh_plugin_uninstall", { windowId });
};
