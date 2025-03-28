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
 * 安装本地插件
 * @param filePath 本地插件文件路径
 * @param windowId 插件的窗口ID
 */
export const ipcInstallLocalPlugin = async (
  filePath: string,
  windowId: string,
) => {
  return invoke("mh_plugin_install_local", { filePath, windowId });
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

/**
 * 解析插件包
 * @param filePath 本地插件文件路径
 * @returns 插件包信息，包含插件ID、名称、描述等
 */
export const ipcAnalyzePluginPackage = async (filePath: string) => {
  return invoke("mh_plugin_analyze_package", { filePath });
};
