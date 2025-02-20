import {
  getConfigValue,
  setConfigValue,
  deleteConfigValue,
  initDatabase,
} from "./database";

// 初始化数据库
initDatabase();

/**
 * 获取配置值
 * @param {string} key - 配置键名
 * @returns {Promise<T | null>} 返回配置值，如果不存在返回 null
 *
 * @example
 * const theme = await getConfig<string>('theme');
 * const settings = await getConfig<AppSettings>('settings');
 */
export const getConfig = async <T = any>(key: string): Promise<T | null> => {
  try {
    return await getConfigValue<T>(key);
  } catch (error) {
    console.error(`获取配置[${key}]失败:`, error);
    throw error;
  }
};

/**
 * 设置配置值
 * @param {string} key - 配置键名
 * @param {T} value - 配置值
 * @returns {Promise<void>}
 *
 * @example
 * await setConfig('theme', 'dark');
 * await setConfig('settings', { notification: true });
 */
export const setConfig = async <T = any>(
  key: string,
  value: T,
): Promise<void> => {
  try {
    await setConfigValue(key, value);
  } catch (error) {
    console.error(`设置配置[${key}]失败:`, error);
    throw error;
  }
};

/**
 * 删除配置
 * @param {string} key - 要删除的配置键名
 * @returns {Promise<void>}
 *
 * @example
 * await deleteConfig('tempSetting');
 */
export const deleteConfig = async (key: string): Promise<void> => {
  try {
    await deleteConfigValue(key);
  } catch (error) {
    console.error(`删除配置[${key}]失败:`, error);
    throw error;
  }
};

/**
 * 更新配置（合并现有配置）
 * @param {string} key - 配置键名
 * @param {Partial<T>} value - 要更新的配置部分
 * @returns {Promise<void>}
 *
 * @example
 * await updateConfig('settings', { notification: true }); // 只更新 settings 中的 notification
 */
export const updateConfig = async <T extends object>(
  key: string,
  value: Partial<T>,
): Promise<void> => {
  try {
    const currentValue = await getConfig<T>(key);
    await setConfig(key, { ...currentValue, ...value });
  } catch (error) {
    console.error(`更新配置[${key}]失败:`, error);
    throw error;
  }
};
