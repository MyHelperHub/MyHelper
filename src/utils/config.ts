import {
  getConfigValue,
  setConfigValue,
  deleteConfigValue,
  initDatabase
} from './database';

// 初始化数据库
initDatabase();

/**
 * 获取用户配置
 * @returns {Promise<any>} 返回整个用户配置对象
 * 
 * @example
 * const userConfig = await getUserConfig();
 * console.log(userConfig.theme); // 'dark'
 */
export const getUserConfig = async (): Promise<any> => {
  try {
    return await getConfigValue('userConfig') || {};
  } catch (error) {
    throw error;
  }
};

/**
 * 设置用户配置
 * @param {Partial<any>} config - 要设置的配置对象，可以是部分配置
 * @returns {Promise<void>}
 * 
 * @example
 * // 设置整个配置
 * await setUserConfig({ theme: 'dark', token: 'xxx' });
 * 
 * // 更新部分配置
 * await setUserConfig({ theme: 'light' }); // 只更新主题，其他配置保持不变
 */
export const setUserConfig = async (config: Partial<any>): Promise<void> => {
  try {
    const currentConfig = await getUserConfig();
    await setConfigValue('userConfig', { ...currentConfig, ...config });
  } catch (error) {
    throw error;
  }
};

/**
 * 获取配置数据
 * @param {Array<string>} keys - 配置项的键列表
 * @returns {Promise<any>} - 返回配置数据
 *
 * @example
 * // 获取 'position' 配置项的值
 * const position = await getConfig(['position']);
 *
 * // 获取 'position.x' 配置项的值
 * const positionX = await getConfig(['position', 'x']);
 */
export const getConfig = async (keys: Array<string>): Promise<any> => {
  try {
    const key = keys.join('.');
    return await getConfigValue(key);
  } catch (error) {
    throw error;
  }
};

/**
 * 保存配置数据
 * @param {Array<string>} keys - 要设置的配置项的键路径
 * @param {any} value - 要设置的值
 * @returns {Promise<void>}
 *
 * @example
 * // 设置 'position.x' 为 100
 * await setConfig(['position', 'x'], 100);
 *
 * // 设置 'theme' 为 'dark'
 * await setConfig(['theme'], 'dark');
 */
export const setConfig = async (
  keys: Array<string>,
  value: any,
): Promise<void> => {
  try {
    const key = keys.join('.');
    await setConfigValue(key, value);
  } catch (error) {
    throw error;
  }
};

/**
 * 删除配置数据
 * @param {Array<string>} keys - 要删除的配置项的键路径
 * @returns {Promise<void>}
 * 
 * @example
 * // 删除 'test.x' 
 * await deleteConfig(["test", "x"]); 

 * // 删除整个 'test' 对象
 * await deleteConfig(["test"]);
 */
export const deleteConfig = async (keys: Array<string>): Promise<void> => {
  try {
    const key = keys.join('.');
    await deleteConfigValue(key);
  } catch (error) {
    throw error;
  }
};
