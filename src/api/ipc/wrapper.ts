import { invoke } from "@tauri-apps/api/core";
import { ApiStatusCode } from "../../interface/enum";

/**
 * API响应结构体接口（与Rust后端统一）
 */
export interface ApiResponse<T> {
  code: number;
  data: T | null;
  message: string;
}

/**
 * API调用异常类
 */
export class ApiError extends Error {
  public readonly code: number;
  
  constructor(code: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

/**
 * 处理ApiResponse，如果有错误则抛出异常
 * @param response API响应
 * @returns 响应数据
 * @throws {ApiError} 当响应码不为成功时抛出异常
 */
export function handleApiResponse<T>(response: ApiResponse<T>): T {
  if (response.code !== ApiStatusCode.SUCCESS) {
    throw new ApiError(response.code, response.message);
  }
  return response.data as T;
}

/**
 * 通用的Tauri命令调用包装器
 * @param command 命令名称
 * @param args 命令参数
 * @returns 处理后的响应数据
 * @throws {ApiError} 当API调用失败时抛出异常
 */
export async function invokeApi<T>(command: string, args?: Record<string, any>): Promise<T> {
  try {
    const response = await invoke<ApiResponse<T>>(command, args);
    return handleApiResponse(response);
  } catch (error) {
    // 如果是已知的ApiError，直接重抛
    if (error instanceof ApiError) {
      throw error;
    }
    
    // 如果是Tauri调用错误，包装为ApiError
    if (error instanceof Error) {
      throw new ApiError(ApiStatusCode.ERR_SYSTEM, error.message);
    }
    
    // 未知错误
    throw new ApiError(ApiStatusCode.ERR_SYSTEM, String(error));
  }
}

/**
 * 安全的API调用包装器（不抛出异常）
 * @param command 命令名称
 * @param args 命令参数
 * @returns API响应对象，包含成功或失败的完整信息
 */
export async function safeInvokeApi<T>(command: string, args?: Record<string, any>): Promise<ApiResponse<T>> {
  try {
    return await invoke<ApiResponse<T>>(command, args);
  } catch (error) {
    // Tauri调用异常，包装为ApiResponse格式
    if (error instanceof Error) {
      return {
        code: ApiStatusCode.ERR_SYSTEM,
        data: null,
        message: error.message,
      };
    }
    
    return {
      code: ApiStatusCode.ERR_SYSTEM,
      data: null,
      message: String(error),
    };
  }
}

/**
 * 检查响应是否成功
 * @param response API响应
 * @returns 是否成功
 */
export function isApiSuccess<T>(response: ApiResponse<T>): boolean {
  return response.code === ApiStatusCode.SUCCESS;
}

/**
 * 获取状态码对应的错误描述
 * @param code 状态码
 * @returns 错误描述
 */
export function getErrorDescription(code: number): string {
  const descriptions: Record<number, string> = {
    [ApiStatusCode.SUCCESS]: "成功",
    [ApiStatusCode.ERR_SYSTEM]: "系统错误",
    [ApiStatusCode.ERR_CONFIG]: "配置错误",
    [ApiStatusCode.ERR_DATABASE]: "数据库错误",
    [ApiStatusCode.ERR_PERMISSION]: "权限错误",
    [ApiStatusCode.ERR_PARAMS]: "参数错误",
    [ApiStatusCode.ERR_PARAMS_MISSING]: "参数缺失",
    [ApiStatusCode.ERR_PARAMS_INVALID]: "参数无效",
    [ApiStatusCode.ERR_USER_NOT_FOUND]: "用户不存在",
    [ApiStatusCode.ERR_USER_UNAUTHORIZED]: "用户未授权",
    [ApiStatusCode.ERR_FILE_NOT_FOUND]: "文件不存在",
    [ApiStatusCode.ERR_FILE_READ]: "文件读取失败",
    [ApiStatusCode.ERR_FILE_WRITE]: "文件写入失败",
    [ApiStatusCode.ERR_NETWORK]: "网络错误",
    [ApiStatusCode.ERR_NETWORK_TIMEOUT]: "网络超时",
    [ApiStatusCode.ERR_NETWORK_UNREACHABLE]: "网络不可达",
  };
  
  return descriptions[code] || `未知错误 (${code})`;
}