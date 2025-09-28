import { SelectItem } from "@/types/common";
import { ipcGetAppIcon, ipcGetWebIcon } from "@/api/ipc/launch.api";

/** 统一路径处理工具 */
export class PathHandler {
  /** 判断路径是否为网址 */
  static isWebUrl(path: string): boolean {
    return /^(https?:\/\/)?(((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))|(\[[0-9a-fA-F:]+\])|(([\w-]+\.)+[a-z]{2,})|localhost)(:\d{1,5})?(\/.*)?$/i.test(
      path,
    );
  }

  /** 格式化网址，确保有协议前缀 */
  static formatUrl(url: string): string {
    if (!/^https?:\/\//i.test(url)) {
      return `http://${url}`;
    }
    return url;
  }

  /** 格式化文件路径，统一使用正斜杠 */
  static formatFilePath(path: string): string {
    return path.replace(/\\/g, "/");
  }

  /** 获取图标 */
  static async getIcon(path: string): Promise<string> {
    if (this.isWebUrl(path)) {
      return (await ipcGetWebIcon(path)) as string;
    } else {
      return (await ipcGetAppIcon(path.replace(/\//g, "\\"))) as string;
    }
  }

  /** 创建默认项目 */
  static createDefaultItem(): SelectItem {
    return {
      id: -1,
      title: "",
      path: "",
      logo: "",
    };
  }

  /** 验证项目数据 */
  static validateItem(item: SelectItem): {
    isValid: boolean;
    message?: string;
  } {
    if (!item.title) {
      return { isValid: false, message: "请输入名称" };
    }

    if (!item.path) {
      return { isValid: false, message: "请输入路径或网址" };
    }

    if (!item.logo) {
      return { isValid: false, message: "请选择图标" };
    }

    return { isValid: true };
  }
}
