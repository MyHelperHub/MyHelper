use serde::Serialize;

#[derive(Debug, Serialize)]
pub enum AppError {
    Error(String),
}

// 手动实现 std::error::Error trait
impl std::error::Error for AppError {}

// 手动实现 Display trait 用于错误显示
impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AppError::Error(msg) => write!(f, "{}", msg),
        }
    }
}

// 实现 From<String> trait
impl From<String> for AppError {
    fn from(error: String) -> Self {
        AppError::Error(error)
    }
}

// 实现 From<&str> trait
impl From<&str> for AppError {
    fn from(error: &str) -> Self {
        AppError::Error(error.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
