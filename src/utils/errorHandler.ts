import { Logger } from "./logger";

/** 错误处理类 */
export class ErrorHandler {
  static async handleError(error: any, context?: string) {
    let message = "操作失败";
    let details: any;

    if (error instanceof Error) {
      message = error.message;
      details = {
        name: error.name,
        stack: error.stack,
        context,
      };
    } else if (typeof error === "string") {
      message = error;
      details = { context };
    } else {
      details = {
        error: JSON.stringify(error),
        context,
      };
    }

    // 记录到日志
    await Logger.error(message, details);
  }
}
