//! 统一API响应结构体

use crate::utils::error::{AppError, AppResult};
use serde::{Deserialize, Serialize};

/// API状态码枚举
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ApiStatusCode {
    // 成功
    Success = 0,

    // 系统错误码 (1000-1099)
    ErrSystem = 1000,
    ErrConfig = 1001,
    ErrDatabase = 1002,
    ErrPermission = 1003,

    // 参数错误码 (1100-1199)
    ErrParams = 1100,
    ErrParamsMissing = 1101,
    ErrParamsInvalid = 1102,

    // 业务错误码 (1200-1299)
    ErrUserNotFound = 1200,
    ErrUserUnauthorized = 1201,

    // 文件错误码 (1300-1399)
    ErrFileNotFound = 1300,
    ErrFileRead = 1301,
    ErrFileWrite = 1302,

    // 网络错误码 (1400-1499)
    ErrNetwork = 1400,
    ErrNetworkTimeout = 1401,
    ErrNetworkUnreachable = 1402,
}

impl ApiStatusCode {
    /// 获取状态码的数值
    pub fn code(&self) -> i32 {
        *self as i32
    }

    /// 判断是否为成功状态
    #[allow(dead_code)]
    pub fn is_success(&self) -> bool {
        *self == ApiStatusCode::Success
    }
}

/// 统一API响应结构体
#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub code: i32,
    pub data: Option<T>,
    pub message: String,
}

impl<T> ApiResponse<T> {
    /// 创建成功响应
    pub fn success(data: T) -> Self {
        Self {
            code: ApiStatusCode::Success.code(),
            data: Some(data),
            message: "操作成功".to_string(),
        }
    }

    /// 创建成功响应（带自定义消息）
    #[allow(dead_code)]
    pub fn success_with_message(data: T, message: impl Into<String>) -> Self {
        Self {
            code: ApiStatusCode::Success.code(),
            data: Some(data),
            message: message.into(),
        }
    }

    /// 创建错误响应
    pub fn error(status_code: ApiStatusCode, message: impl Into<String>) -> ApiResponse<T> {
        ApiResponse {
            code: status_code.code(),
            data: None,
            message: message.into(),
        }
    }

    /// 从 AppResult 转换为 ApiResponse
    pub fn from_app_result(result: AppResult<T>) -> Self {
        match result {
            Ok(data) => Self::success(data),
            Err(AppError::Error(msg)) => Self::error(ApiStatusCode::ErrSystem, msg),
        }
    }
}

// 从 AppResult 转换为 ApiResponse
impl<T> From<AppResult<T>> for ApiResponse<T> {
    fn from(result: AppResult<T>) -> Self {
        Self::from_app_result(result)
    }
}
