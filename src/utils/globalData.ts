import { reactive } from "vue";

class GlobalData {
  // 用来存储全局数据的 Map 对象
  private static data: Map<string, any> = new Map();

  /**
   * 设置全局数据
   * @param key 键名，用来标识存储的数据
   * @param value 数据值，如果是对象类型会转换为响应式对象
   */
  static set(key: string, value: any) {
    // 如果是对象类型并且非空，则使用 Vue 的 reactive 函数将其转换为响应式对象
    if (typeof value === "object" && value !== null) {
      value = reactive(value);
    }
    // 将数据存储在 Map 中
    this.data.set(key, value);
  }

  /**
   * 获取全局数据
   * @param key 键名，用来检索数据
   * @returns 返回存储的数据，可能是普通数据或响应式对象
   */
  static get(key: string): any {
    return this.data.get(key);
  }

  /**
   * 删除全局数据
   * @param key 键名，用来指定需要删除的数据
   */
  static delete(key: string) {
    this.data.delete(key);
  }
}

export default GlobalData;
