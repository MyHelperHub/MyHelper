import { shallowRef, Ref } from "vue";
import {
  ipcGetGlobalData,
  ipcSetGlobalData,
  ipcDeleteGlobalData,
} from "@/api/ipc/state.api";
import { Logger } from "./logger";

/** 全局数据管理类 */
class GlobalData {
  /** 响应式数据缓存 */
  private static reactiveCache: Map<string, Ref<any>> = new Map();
  /** 普通数据缓存 */
  private static plainCache: Map<string, any> = new Map();

  /** 需要响应式的key列表 */
  private static readonly REACTIVE_KEYS = new Set([
    "userInfo",
    "theme",
    "settings",
    "selectedPetModel",
    "petModelCache",
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
        if (!this.reactiveCache.has(key)) {
          this.reactiveCache.set(key, shallowRef(value));
        } else {
          this.reactiveCache.get(key)!.value = value;
        }
      } else {
        this.plainCache.set(key, value);
      }

      await ipcSetGlobalData(key, value);
      return value;
    } catch (error) {
      Logger.error("设置全局数据失败:", String(error));
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

      if (isReactive && this.reactiveCache.has(key)) {
        return this.reactiveCache.get(key)!.value;
      } else if (!isReactive && this.plainCache.has(key)) {
        return this.plainCache.get(key);
      }

      const value = await ipcGetGlobalData(key);
      if (value === null) return null;

      if (isReactive) {
        this.reactiveCache.set(key, shallowRef(value));
      } else {
        this.plainCache.set(key, value);
      }

      return value;
    } catch (error) {
      Logger.error("获取全局数据失败:", String(error));
      throw error;
    }
  }

  /**
   * 删除全局数据
   * @param key 键名，用来指定需要删除的数据
   */
  static async delete(key: string) {
    try {
      this.reactiveCache.delete(key);
      this.plainCache.delete(key);
      await ipcDeleteGlobalData(key);
    } catch (error) {
      Logger.error("删除全局数据失败:", String(error));
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
