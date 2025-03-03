use crate::utils::error::{AppError, AppResult};
use crate::utils::path::get_myhelper_path;
use std::fs;

/**
 * 删除本地图标
 * @param filename 图片文件名（不含路径）
 * @param app_type 应用类型，0为网页图标，1为应用图标
 */
#[tauri::command]
pub fn delete_icon(filename: &str, app_type: u32) -> AppResult<String> {
    // 获取基础路径
    let myhelper_path = get_myhelper_path().map_err(|e| AppError::Error(e.to_string()))?;

    // 根据类型确定目标目录
    let target_dir = match app_type {
        0 => myhelper_path.join("Image").join("WebIcon"),
        1 => myhelper_path.join("Image").join("AppIcon"),
        _ => return Err(AppError::Error("Invalid app type".to_string())),
    };

    // 构建完整的文件路径
    let file_path = target_dir.join(filename);

    // 检查文件是否存在
    if !file_path.exists() {
        return Err(AppError::Error("File not found".to_string()));
    }

    // 验证文件不会超出目标目录（防止路径穿越）
    if !file_path.starts_with(&target_dir) {
        return Err(AppError::Error("Invalid file location".to_string()));
    }

    // 执行删除
    fs::remove_file(file_path).map_err(|e| AppError::Error(e.to_string()))?;

    Ok("File deleted successfully".to_string())
}
