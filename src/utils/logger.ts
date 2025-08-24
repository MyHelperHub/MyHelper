import { invoke } from "@tauri-apps/api/core";

export interface LogEntry {
  level: "info" | "warn" | "error";
  message: string;
  timestamp: string;
  details?: string;
}

export class Logger {

  private static async writeLog(entry: LogEntry): Promise<void> {
    try {
      await invoke("write_log", { entry });
    } catch (error) {
      console.error("Failed to write log:", error);
    }
  }

  static async info(message: string, details?: string): Promise<void> {
    const entry: LogEntry = {
      level: "info",
      message,
      timestamp: new Date().toISOString(),
      details,
    };
    await this.writeLog(entry);
  }

  static async warn(message: string, details?: string): Promise<void> {
    const entry: LogEntry = {
      level: "warn",
      message,
      timestamp: new Date().toISOString(),
      details,
    };
    await this.writeLog(entry);
  }

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
