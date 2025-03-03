//! 暂未使用 统一API响应结构体

use serde::Serialize;

/// 统一API响应结构体
#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub code: i32,
    pub data: Option<T>,
    pub message: String,
}

// 错误码定义
pub const SUCCESS: i32 = 0; // 成功
pub const ERR_SYSTEM: i32 = 1001; // 系统错误
#[allow(dead_code)]
pub const ERR_CONFIG: i32 = 1002; // 配置错误
#[allow(dead_code)]
pub const ERR_PARAMS: i32 = 1003; // 参数错误

impl<T> ApiResponse<T> {
    /// 创建成功响应
    pub fn success(data: T) -> Self {
        Self {
            code: SUCCESS,
            data: Some(data),
            message: "操作成功".to_string(),
        }
    }

    /// 创建成功响应（带自定义消息）
    #[allow(dead_code)]
    pub fn success_with_message(data: T, message: impl Into<String>) -> Self {
        Self {
            code: SUCCESS,
            data: Some(data),
            message: message.into(),
        }
    }

    /// 创建错误响应
    pub fn error(code: i32, message: impl Into<String>) -> ApiResponse<T> {
        ApiResponse {
            code,
            data: None,
            message: message.into(),
        }
    }
}

// 从 Result 转换为 ApiResponse
impl<T, E: std::fmt::Display> From<Result<T, E>> for ApiResponse<T> {
    fn from(result: Result<T, E>) -> Self {
        match result {
            Ok(data) => ApiResponse::success(data),
            Err(e) => ApiResponse::error(ERR_SYSTEM, e.to_string()),
        }
    }
}
