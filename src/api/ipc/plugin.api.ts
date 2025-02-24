import { invoke } from "@tauri-apps/api/core";

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
