use crate::utils::error::{AppError, AppResult};
use open::that;
#[allow(unused_imports)]
use std::process::Command;

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
    // 首先尝试使用 open::that
    if let Ok(_) = that(&path) {
        return Ok(());
    }

    // 如果在 Linux 下 open::that 失败，尝试直接执行
    #[cfg(target_os = "linux")]
    {
        if !path.starts_with("http://") && !path.starts_with("https://") {
            Command::new(&path)
                .spawn()
                .map_err(|e| AppError::Error(format!("无法执行 {}: {}", path, e)))?;
            return Ok(());
        }
    }

    Err(AppError::Error(format!("无法打开 {}", path)))
}
