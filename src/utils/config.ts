import { invoke } from "@tauri-apps/api/core";

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
        const result = await invoke('get_config', { keys });
        return result;
    } catch (error) {
        console.error('Error getting config:', error);
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
export const setConfig = async (keys: Array<string>, value: any): Promise<void> => {
    try {
        await invoke('set_config', { keys, value });
    } catch (error) {
        console.error('Error setting config:', error);
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
        await invoke('delete_config', { keys });
    } catch (error) {
        console.error('Error deleting config:', error);
        throw error;
    }
};