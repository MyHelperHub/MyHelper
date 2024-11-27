import { getConfig, setConfig } from "./config";

/**
 * 获取用户配置
 * @param {Array<string>} [keys] - 配置项的键列表,不传则获取整个 userConfig
 * @returns {Promise<any>} - 返回用户配置数据
 * 
 * @example
 * // 获取整个用户配置
 * const config = await getUserConfig();
 * 
 * // 获取用户名
 * const username = await getUserConfig(['username']);
 * 
 * // 获取用户主题设置
 * const theme = await getUserConfig(['settings', 'theme']);
 */
export const getUserConfig = async (keys: Array<string>): Promise<any> => {
  try {
    const fullKeys = ["userConfig", ...keys];
    return await getConfig(fullKeys);
  } catch (error) {
    console.error("获取用户配置失败:", error);
    throw error;
  }
};

/**
 * 保存用户配置
 * @param {Array<string>} keys - 要设置的配置项的键路径
 * @param {any} value - 要设置的值
 * @returns {Promise<void>}
 * 
 * @example
 * // 设置整个用户配置
 * await setUserConfig([], { username: 'zhang' });
 * 
 * // 设置用户主题
 * await setUserConfig(['settings', 'theme'], 'dark');
 */
export const setUserConfig = async (
  keys: Array<string>,
  value: any,
): Promise<void> => {
  try {
    const fullKeys = ["userConfig", ...keys];
    await setConfig(fullKeys, value);
  } catch (error) {
    console.error("设置用户配置失败:", error);
    throw error;
  }
};


import { ipcFileExists } from "@/api/ipc/launch.api";
import { convertFileSrc } from "@tauri-apps/api/core";
import { appDataDir } from "@tauri-apps/api/path";

export const checkLogoPath = async (): Promise<string> => {
  const appDataPath = await appDataDir();
  const logoPath = `${appDataPath}/Image/logo.png`;

  const exists = await ipcFileExists(logoPath);
  if (exists) {
    return `${convertFileSrc(logoPath)}?timestamp=${new Date().getTime()}`;
  } else {
    return "/logo.png";
  }
};
