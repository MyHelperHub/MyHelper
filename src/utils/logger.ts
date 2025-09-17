import { invoke } from "@tauri-apps/api/core";

/** 日志条目接口 */
export type LogEntry = {
  level: "info" | "warn" | "error";
  message: string;
  timestamp: string;
  details?: string;
}

/** 日志管理器 */
export class Logger {
  /** 写入日志 */
  private static async writeLog(entry: LogEntry): Promise<void> {
    try {
      await invoke("write_log", { entry });
    } catch (error) {
      console.error("Failed to write log:", error);
    }
  }

  /** 记录信息级别日志 */
  static async info(message: string, details?: string): Promise<void> {
    const entry: LogEntry = {
      level: "info",
      message,
      timestamp: new Date().toISOString(),
      details,
    };
    await this.writeLog(entry);
  }

  /** 记录警告级别日志 */
  static async warn(message: string, details?: string): Promise<void> {
    const entry: LogEntry = {
      level: "warn",
      message,
      timestamp: new Date().toISOString(),
      details,
    };
    await this.writeLog(entry);
  }

  /** 记录错误级别日志 */
  static async error(message: string, error?: string): Promise<void> {
    const entry: LogEntry = {
      level: "error",
      message,
      timestamp: new Date().toISOString(),
      details: error,
    };
    await this.writeLog(entry);
  }
}
