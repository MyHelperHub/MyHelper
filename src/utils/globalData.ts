import { shallowRef, Ref } from "vue";
import {
  ipcGetGlobalData,
  ipcSetGlobalData,
  ipcDeleteGlobalData,
} from "@/api/ipc/state.api";
import { Logger } from "./logger";

class GlobalData {
  // 使用两个Map分别存储响应式和非响应式数据
  private static reactiveCache: Map<string, Ref<any>> = new Map();
  private static plainCache: Map<string, any> = new Map();

  // 定义需要响应式的key列表
  private static readonly REACTIVE_KEYS = new Set([
    "userInfo",
    "theme",
    "settings",
    "selectedPetModel", // 当前选中的宠物模型
    "petModelCache", // 宠物模型缓存
  ]);

  /**
   * 判断是否需要响应式
   */
  private static needsReactive(key: string): boolean {
    return this.REACTIVE_KEYS.has(key);
  }

  /**
   * 设置全局数据
   * @param key 键名，用来标识存储的数据
   * @param value 数据值
   */
  static async set(key: string, value: any) {
    try {
      if (this.needsReactive(key)) {
        // 响应式数据使用 shallowRef 以减少深层响应带来的性能开销
        if (!this.reactiveCache.has(key)) {
          this.reactiveCache.set(key, shallowRef(value));
        } else {
          this.reactiveCache.get(key)!.value = value;
        }
      } else {
        // 非响应式数据直接存储
        this.plainCache.set(key, value);
      }

      // 持久化存储
      await ipcSetGlobalData(key, value);
      return value;
    } catch (error) {
      Logger.error("设置全局数据失败:", error);
      throw error;
    }
  }

  /**
   * 获取全局数据
   * @param key 键名，用来检索数据
   * @returns 返回存储的数据值（非响应式引用）
   */
  static async get(key: string): Promise<any> {
    try {
      const isReactive = this.needsReactive(key);

      // 优先从对应的缓存中获取
      if (isReactive && this.reactiveCache.has(key)) {
        return this.reactiveCache.get(key)!.value;
      } else if (!isReactive && this.plainCache.has(key)) {
        return this.plainCache.get(key);
      }

      // 缓存中没有，从持久化存储获取
      const value = await ipcGetGlobalData(key);
      if (value === null) return null;

      // 根据是否需要响应式存入对应的缓存
      if (isReactive) {
        this.reactiveCache.set(key, shallowRef(value));
      } else {
        this.plainCache.set(key, value);
      }

      return value;
    } catch (error) {
      Logger.error("获取全局数据失败:", error);
      throw error;
    }
  }

  /**
   * 删除全局数据
   * @param key 键名，用来指定需要删除的数据
   */
  static async delete(key: string) {
    try {
      // 从两个缓存中都删除
      this.reactiveCache.delete(key);
      this.plainCache.delete(key);
      // 从持久化存储中删除
      await ipcDeleteGlobalData(key);
    } catch (error) {
      Logger.error("删除全局数据失败:", error);
      throw error;
    }
  }

  /**
   * 清空缓存
   */
  static clearCache() {
    this.reactiveCache.clear();
    this.plainCache.clear();
  }
}

export default GlobalData;