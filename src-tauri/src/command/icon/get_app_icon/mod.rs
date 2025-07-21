#[cfg(target_os = "linux")]
mod linux;
#[cfg(target_os = "macos")]
mod mac;
#[cfg(target_os = "windows")]
mod win;

use crate::utils::error::AppError;
use crate::utils::response::ApiResponse;

#[tauri::command]
pub fn get_app_icon(exe_path: &str) -> Result<ApiResponse<String>, AppError> {
    #[cfg(target_os = "windows")]
    {
        win::get_app_icon(exe_path).map_err(AppError::from)
    }
    #[cfg(target_os = "macos")]
    {
        mac::get_app_icon(exe_path).map_err(AppError::from)
    }
    #[cfg(target_os = "linux")]
    {
        linux::get_app_icon(exe_path).map_err(AppError::from)
    }
}
