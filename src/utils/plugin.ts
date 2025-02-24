import {
  ipcInstallPlugin,
  ipcUninstallPlugin,
} from "@/api/ipc/plugin.api";
import { getConfigValue, setConfigValue, deleteConfigValue } from "./database";
import { PluginConfig } from "@/interface/plugin";

const PLUGIN_LIST_KEY = 'pluginList';

/**
 * 获取插件配置数据
 * @param {Array<string>} keys - 配置项的键列表
 * @returns {Promise<unknown>} - 返回配置数据，如果配置不存在则返回null
 * @throws 如果获取配置失败，将抛出错误
 *
 * @example
 * // 获取插件列表
 * const pluginList = await getPluginConfig(['pluginList']);
 */
export const getPluginConfig = async (keys: Array<string>): Promise<unknown> => {
  try {
    if (keys[0] === PLUGIN_LIST_KEY) {
      return await getConfigValue(PLUGIN_LIST_KEY);
    }

    // 如果指定了具体的插件ID
    if (keys.length > 1) {
      const plugins = await getConfigValue<PluginConfig[]>(PLUGIN_LIST_KEY) || [];
      const plugin = plugins.find(p => p.windowId === keys[1]);
      if (!plugin) {
        return null;
      }
      
      // 根据keys路径获取具体的配置值
      let value: any = plugin;
      for (let i = 2; i < keys.length; i++) {
        if (value === null || value === undefined) {
          return null;
        }
        value = value[keys[i]];
      }
      return value;
    }

    return null;
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
    if (keys[0] === PLUGIN_LIST_KEY) {
      // 如果是设置整个插件列表
      await setConfigValue(PLUGIN_LIST_KEY, value);
    } else if (keys.length > 1) {
      // 如果是设置特定插件的配置
      const plugins = await getConfigValue<PluginConfig[]>(PLUGIN_LIST_KEY) || [];
      const pluginIndex = plugins.findIndex(p => p.windowId === keys[1]);
      
      if (pluginIndex === -1) {
        throw new Error(`Plugin ${keys[1]} not found`);
      }
      
      // 根据keys路径设置值
      let target: any = plugins[pluginIndex];
      for (let i = 2; i < keys.length - 1; i++) {
        if (!(keys[i] in target)) {
          target[keys[i]] = {};
        }
        target = target[keys[i]];
      }
      target[keys[keys.length - 1]] = value;
      
      // 更新插件列表
      await setConfigValue(PLUGIN_LIST_KEY, plugins);
    }
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
    if (keys.length === 0 || (keys[0] === PLUGIN_LIST_KEY && keys.length === 1)) {
      // 删除所有插件配置
      await deleteConfigValue(PLUGIN_LIST_KEY);
    } else if (keys.length > 1) {
      // 删除特定插件的配置
      const plugins = await getConfigValue<PluginConfig[]>(PLUGIN_LIST_KEY) || [];
      const updatedPlugins = plugins.filter(p => p.windowId !== keys[1]);
      await setConfigValue(PLUGIN_LIST_KEY, updatedPlugins);
    }
  } catch (error) {
    console.error("删除插件配置失败:", error);
    throw error;
  }
};

/**
 * 安装插件
 * @param {string} url - 插件下载地址，必须是以 https://helper.ialtone.xyz/ 开头的URL
 * @param {string} windowId - 插件的窗口ID
 * @returns {Promise<void>} - 安装成功返回void
 * @throws 如果安装失败或参数无效，将抛出错误
 * 
 * @example
 * await installPlugin(
 *   'https://helper.ialtone.xyz/plugins/my-plugin.zip',
 *   'my-plugin-window',
 * );
 */
export const installPlugin = async (
  url: string,
  windowId: string,
): Promise<void> => {
  try {
    await ipcInstallPlugin(url, windowId);
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