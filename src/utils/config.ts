import { invoke } from "@tauri-apps/api/core";

/**
 * 获取配置数据
 * @param {Array<string>} keys - 配置项的键列表
 * @returns {Promise<any>} - 返回配置数据
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
 * @param {Object} data - 要保存的配置数据
 * @returns {Promise<void>}
 */
export const setConfig = async (data: object): Promise<void> => {
    try {
        await invoke('set_config', { data });
        console.log('Config set successfully');
    } catch (error) {
        console.error('Error setting config:', error);
        throw error;
    }
};

/**
 * 删除配置数据
 * @param {string} key - 要删除的配置项的键
 * @returns {Promise<void>}
 */
export const deleteConfig = async (key: string): Promise<void> => {
    try {
        await invoke('delete_config', { key });
        console.log('Config deleted successfully');
    } catch (error) {
        console.error('Error deleting config:', error);
        throw error;
    }
};

// 使用示例
// const testConfigFunctions = async () => {
//     try {
//         // 获取配置
//         const config = await getConfig(['position']);
//         console.log('Config:', config);

//         // 设置配置
//         await setConfig({ position: { x: 100, y: 200 } });

//         // 删除配置
//         await deleteConfig('position');
//     } catch (error) {
//         console.error('操作配置时出错:', error);
//     }
// };
