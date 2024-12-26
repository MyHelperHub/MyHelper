use crate::utils::path::get_myhelper_path;
use reqwest::blocking::Client;
use std::fs::{self, File};
use std::io::{self};
use zip::read::ZipArchive;

#[tauri::command]
pub fn mh_plugin_install(url: &str, window_id: &str) -> Result<(), String> {
    // 验证窗口ID格式
    if window_id.is_empty() || !window_id.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_') {
        return Err("无效的窗口ID，只能包含字母、数字、连字符或下划线".to_string());
    }

    // 获取用户目录
    let target_dir = get_myhelper_path()
        .map(|path| path.join("Plugin").join(window_id))
        .map_err(|e| e.to_string())?;

    // 如果目录已存在，先删除
    if target_dir.exists() {
        fs::remove_dir_all(&target_dir).map_err(|e| e.to_string())?;
    }
    fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;

    // 创建自定义 HTTP 客户端
    let client = Client::builder()
        .danger_accept_invalid_certs(false)
        .build()
        .map_err(|e| e.to_string())?;

    // 下载 ZIP 文件
    let response = client.get(url).send().map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err("下载文件失败".to_string());
    }

    let bytes = response.bytes().map_err(|e| e.to_string())?;

    // 解压 ZIP 文件
    let mut archive = ZipArchive::new(std::io::Cursor::new(bytes)).map_err(|e| e.to_string())?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        let out_path = target_dir.join(file.mangled_name());

        if out_path.starts_with(&target_dir) {
            if let Some(parent) = out_path.parent() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            let mut output_file = File::create(&out_path).map_err(|e| e.to_string())?;
            io::copy(&mut file, &mut output_file).map_err(|e| e.to_string())?;
        } else {
            return Err("ZIP文件中包含非法路径".to_string());
        }
    }

    Ok(())
}

#[tauri::command]
pub fn mh_plugin_uninstall(window_id: &str) -> Result<(), String> {
    // 验证窗口ID格式
    if window_id.is_empty() || !window_id.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_') {
        return Err("Invalid window ID, must contain only alphanumeric characters, hyphens, or underscores.".to_string());
    }

    // 获取用户目录
    let target_dir = get_myhelper_path()
        .map(|path| path.join("Plugin").join(window_id))
        .map_err(|e| e.to_string())?;

    // 删除文件夹及其内容
    if target_dir.exists() {
        fs::remove_dir_all(&target_dir).map_err(|e| e.to_string())?;
    } else {
        return Err("Directory does not exist.".to_string());
    }

    Ok(())
}
