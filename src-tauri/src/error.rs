use serde::{de::Error, Serialize};
use std::io::Error as IoError;
use serde_json::Error as JsonError;

#[derive(Debug, Serialize)]
pub enum AppError {
    ConfigError(String),
    WindowError(String),
    SystemError(String),
    IoError(String),
    SerdeError(String),
    ClipboardError(String),
    PluginError(String),
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AppError::ConfigError(msg) => write!(f, "{}", msg),
            AppError::WindowError(msg) => write!(f, "{}", msg),
            AppError::SystemError(msg) => write!(f, "{}", msg),
            AppError::IoError(msg) => write!(f, "{}", msg),
            AppError::SerdeError(msg) => write!(f, "{}", msg),
            AppError::ClipboardError(msg) => write!(f, "{}", msg),
            AppError::PluginError(msg) => write!(f, "{}", msg),
        }
    }
}

impl std::error::Error for AppError {}

pub type AppResult<T> = Result<T, AppError>;

impl From<AppError> for tauri::Error {
    fn from(error: AppError) -> Self {
        match error {
            AppError::IoError(e) => tauri::Error::Io(IoError::new(std::io::ErrorKind::Other, e)),
            AppError::SerdeError(e) => tauri::Error::Json(JsonError::custom(e)),
            _ => tauri::Error::Io(IoError::new(std::io::ErrorKind::Other, error.to_string()))
        }
    }
}
