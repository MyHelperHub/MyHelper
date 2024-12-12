import { ipcGetGlobalData, ipcSetGlobalData, ipcDeleteGlobalData } from "@/api/ipc/state.api";

class GlobalData {
  private static cache: Map<string, any> = new Map();

  /**
   * 设置全局数据
   * @param key 键名，用来标识存储的数据
   * @param value 数据值
   */
  static async set(key: string, value: any) {
    try {
      // 更新缓存
      this.cache.set(key, value);
      // 持久化存储
      await ipcSetGlobalData(key, value);
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
      // 优先从缓存中获取
      if (this.cache.has(key)) {
        return this.cache.get(key);
      }
      
      // 缓存中没有，从持久化存储获取
      const value = await ipcGetGlobalData(key);
      if (!value) return null;
      
      // 将获取到的值存入缓存
      this.cache.set(key, value);
      return value;
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
      // 从缓存中删除
      this.cache.delete(key);
      // 从持久化存储中删除
      await ipcDeleteGlobalData(key);
    } catch (error) {
      console.error("删除全局数据失败:", error);
      throw error;
    }
  }

  /**
   * 清空缓存
   */
  static clearCache() {
    this.cache.clear();
  }
}

export default GlobalData;