import { invoke } from "@tauri-apps/api/core";

export interface LogEntry {
  level: "info" | "warn" | "error";
  message: string;
  timestamp: string;
  details?: any;
}

export class Logger {
  private static formatError(error: any): string {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}\nStack: ${error.stack}`;
    }
    return JSON.stringify(error, null, 2);
  }

  private static async writeLog(entry: LogEntry): Promise<void> {
    try {
      await invoke("write_log", { entry });
    } catch (error) {
      console.error("Failed to write log:", error);
    }
  }

  static async info(message: string, details?: any): Promise<void> {
    const entry: LogEntry = {
      level: "info",
      message,
      timestamp: new Date().toISOString(),
      details,
    };
    await this.writeLog(entry);
  }

  static async warn(message: string, details?: any): Promise<void> {
    const entry: LogEntry = {
      level: "warn",
      message,
      timestamp: new Date().toISOString(),
      details,
    };
    await this.writeLog(entry);
  }

  static async error(message: string, error?: any): Promise<void> {
    const entry: LogEntry = {
      level: "error",
      message,
      timestamp: new Date().toISOString(),
      details: error ? this.formatError(error) : undefined,
    };
    await this.writeLog(entry);
  }
} 