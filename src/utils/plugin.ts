import {
  ipcGetPluginConfig,
  ipcSetPluginConfig,
  ipcDeletePluginConfig,
  ipcInstallPlugin,
  ipcUninstallPlugin,
} from "@/api/ipc/plugin.api";

/**
 * 获取插件配置数据
 * @param {Array<string>} keys - 配置项的键列表
 * @returns {Promise<unknown>} - 返回配置数据，如果配置不存在则返回null
 * @throws 如果获取配置失败，将抛出错误
 *
 * @example
 * // 获取插件的 'windowId' 配置
 * const windowId = await getPluginConfig(['windowId']);
 *
 * // 获取插件的 'size.width' 配置
 * const width = await getPluginConfig(['size', 'width']);
 */
export const getPluginConfig = async (keys: Array<string>): Promise<unknown> => {
  try {
    return await ipcGetPluginConfig(keys);
  } catch (error) {
    console.error("获取插件配置失败:", error);
    throw error;
  }
};

/**
 * 保存插件配置数据
 * @param {Array<string>} keys - 要设置的配置项的键路径
 * @param {unknown} value - 要设置的值
 * @returns {Promise<void>} - 设置成功返回void
 * @throws 如果设置配置失败，将抛出错误
 *
 * @example
 * // 设置插件的 'position' 为 [100, 200]
 * await setPluginConfig(['position'], [100, 200]);
 *
 * // 设置插件的 'alwaysOnTop' 为 true
 * await setPluginConfig(['alwaysOnTop'], true);
 */
export const setPluginConfig = async (
  keys: Array<string>,
  value: unknown,
): Promise<void> => {
  try {
    await ipcSetPluginConfig(keys, value);
  } catch (error) {
    console.error("设置插件配置失败:", error);
    throw error;
  }
};

/**
 * 删除插件配置数据
 * @param {Array<string>} keys - 要删除的配置项的键路径
 * @returns {Promise<void>} - 删除成功返回void
 * @throws 如果删除配置失败，将抛出错误
 * 
 * @example
 * // 删除插件的 'position' 配置
 * await deletePluginConfig(['position']);
 * 
 * // 删除插件的所有配置
 * await deletePluginConfig([]);
 */
export const deletePluginConfig = async (keys: Array<string>): Promise<void> => {
  try {
    await ipcDeletePluginConfig(keys);
  } catch (error) {
    console.error("删除插件配置失败:", error);
    throw error;
  }
};

/**
 * 安装插件
 * @param {string} url - 插件下载地址，必须是以 https://helper.ialtone.xyz/ 开头的URL
 * @param {string} expectedHash - 插件文件的预期SHA-256哈希值
 * @returns {Promise<void>} - 安装成功返回void
 * @throws 如果安装失败或参数无效，将抛出错误
 * 
 * @example
 * await installPlugin(
 *   'https://helper.ialtone.xyz/plugins/my-plugin.zip',
 *   'abc123def456...',  // 64位SHA-256哈希值
 * );
 */
export const installPlugin = async (
  url: string,
  expectedHash: string,
): Promise<void> => {
  try {
    await ipcInstallPlugin(url, expectedHash);
  } catch (error) {
    console.error("安装插件失败:", error);
    throw error;
  }
};

/**
 * 卸载插件
 * @param {string} windowId - 要卸载的插件的窗口ID
 * @returns {Promise<void>} - 卸载成功返回void
 * @throws 如果卸载失败或窗口ID无效，将抛出错误
 * 
 * @example
 * await uninstallPlugin('my-plugin-window');
 */
export const uninstallPlugin = async (windowId: string): Promise<void> => {
  try {
    await ipcUninstallPlugin(windowId);
  } catch (error) {
    console.error("卸载插件失败:", error);
    throw error;
  }
};