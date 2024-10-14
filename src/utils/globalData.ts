import { reactive } from "vue";

class GlobalData {
  private static data: Map<string, any> = new Map();

  static set(key: string, value: any) {
    // 如果是对象，使用 reactive 转换为响应式对象
    if (typeof value === "object" && value !== null) {
      value = reactive(value);
    }
    this.data.set(key, value);
  }

  static get(key: string): any {
    return this.data.get(key);
  }

  static delete(key: string) {
    this.data.delete(key);
  }
}

export default GlobalData;
