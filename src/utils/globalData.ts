import { ipcGetGlobalData, ipcSetGlobalData, ipcDeleteGlobalData } from "@/api/ipc/state.api";

class GlobalData {
  /**
   * 设置全局数据
   * @param key 键名，用来标识存储的数据
   * @param value 数据值
   */
  static async set(key: string, value: any) {
    try {
      const strValue = JSON.stringify(value);
      await ipcSetGlobalData(key, strValue);
      return value;
    } catch (error) {
      console.error("设置全局数据失败:", error);
      throw error;
    }
  }

  /**
   * 获取全局数据
   * @param key 键名，用来检索数据
   * @returns 返回存储的数据
   */
  static async get(key: string): Promise<any> {
    try {
      const value = await ipcGetGlobalData(key);
      if (!value) return null;
      return JSON.parse(value);
    } catch (error) {
      console.error("获取全局数据失败:", error);
      throw error;
    }
  }

  /**
   * 删除全局数据
   * @param key 键名，用来指定需要删除的数据
   */
  static async delete(key: string) {
    try {
      await ipcDeleteGlobalData(key);
    } catch (error) {
      console.error("删除全局数据失败:", error);
      throw error;
    }
  }
}

export default GlobalData;
