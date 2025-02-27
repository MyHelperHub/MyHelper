import {
  ipcInstallPlugin,
  ipcUninstallPlugin,
} from "@/api/ipc/plugin.api";
import { ipcGetPluginConfigValue, ipcSetPluginConfigValue, ipcDeletePluginConfigValue } from "@/api/ipc/database.api";

interface PluginConfigData {
  windowId: string;
  info: Record<string, any>;
  config: Record<string, any>;
  data: Record<string, any>;
  [key: string]: any;
}

type PluginConfigOrEmpty = PluginConfigData | {
  info: Record<string, any>;
  config: Record<string, any>;
  data: Record<string, any>;
  [key: string]: any;
};

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
    if (keys[0] === 'pluginList') {
      const result = await ipcGetPluginConfigValue() as PluginConfigData[];
      return result;
    }

    // 如果指定了具体的插件ID
    if (keys.length > 1) {
      const result = await ipcGetPluginConfigValue(keys[1]) as PluginConfigData[];
      if (!result || result.length === 0) {
        return null;
      }
      
      const plugin = result[0];
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
 * 设置插件配置数据
 * @param {Array<string>} keys - 配置项的键列表
 * @param {any} value - 要设置的值
 * @returns {Promise<void>}
 * @throws 如果设置配置失败，将抛出错误
 */
export const setPluginConfig = async (keys: Array<string>, value: any): Promise<void> => {
  try {
    if (keys[0] === 'pluginList') {
      // 删除所有现有配置
      await ipcDeletePluginConfigValue();
      
      // 添加新的配置
      if (Array.isArray(value)) {
        for (const plugin of value) {
          await ipcSetPluginConfigValue(
            plugin.windowId,
            plugin.info,
            plugin.config || {},
            plugin.data
          );
        }
      }
      return;
    }

    // 如果指定了具体的插件ID
    if (keys.length > 1) {
      const windowId = keys[1];
      const result = await ipcGetPluginConfigValue(windowId) as PluginConfigData[];
      const plugin = result && result.length > 0 ? result[0] : {
        info: {},
        config: {},
        data: {},
      } as PluginConfigOrEmpty;

      // 根据keys路径设置具体的配置值
      let current = plugin;
      for (let i = 2; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current)) {
          current[key] = {};
        }
        current = current[key];
      }

      if (keys.length > 2) {
        const lastKey = keys[keys.length - 1];
        current[lastKey] = value;
      } else {
        Object.assign(current, value);
      }

      await ipcSetPluginConfigValue(
        windowId,
        plugin.info,
        plugin.config,
        plugin.data
      );
    }
  } catch (error) {
    console.error("设置插件配置失败:", error);
    throw error;
  }
};

/**
 * 删除插件配置数据
 * @param {Array<string>} keys - 要删除的配置键列表
 * @returns {Promise<void>}
 * @throws 如果删除配置失败，将抛出错误
 */
export const deletePluginConfig = async (keys: Array<string>): Promise<void> => {
  try {
    if (keys.length === 0 || keys[0] === 'pluginList') {
      await ipcDeletePluginConfigValue();
      return;
    }

    if (keys.length > 1) {
      await ipcDeletePluginConfigValue(keys[1]);
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