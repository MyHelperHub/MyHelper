use open::that;
use crate::utils::error::{AppError, AppResult};

/// 打开网页或本地应用程序
/// 
/// # Arguments
/// 
/// * `path` - 要打开的路径，可以是网址或本地应用程序路径
/// 
/// # Returns
/// 
/// * `AppResult<()>` - 操作成功返回 Ok(()), 失败返回错误信息

#[permission_macro::permission("main")]
#[tauri::command]
pub fn open_web_or_app(path: String) -> AppResult<()> {
    that(&path).map_err(|e| AppError::Error(format!("Failed to open {}: {}", path, e)))
}
