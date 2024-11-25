use crate::utils::path::get_myhelper_path;
use reqwest::blocking::Client;
use sha2::{Digest, Sha256};
use std::fs::{self, File};
use std::io::{self};
use zip::read::ZipArchive;

#[tauri::command]
pub fn mh_plugin_install(url: &str, expected_hash: &str) -> Result<(), String> {
    // 检查 URL 是否以指定的域名开头
    if !url.starts_with("https://helper.ialtone.xyz/") {
        return Err("Invalid URL, only https://helper.ialtone.xyz/ is allowed.".to_string());
    }

    // 获取用户目录
    let target_dir = get_myhelper_path()
        .map(|path| path.join("Plugin"))
        .map_err(|e| e.to_string())?;

    if !target_dir.exists() {
        fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;
    }

    // 创建自定义 HTTP 客户端
    let client = Client::builder()
        .danger_accept_invalid_certs(false)
        .build()
        .map_err(|e| e.to_string())?;

    // 下载 ZIP 文件
    let response = client.get(url).send().map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err("Failed to download file".to_string());
    }

    let bytes = response.bytes().map_err(|e| e.to_string())?;

    // 计算 SHA256 哈希
    let mut hasher = Sha256::new();
    hasher.update(&bytes);
    let hash = hasher.finalize();
    let hash_hex = format!("{:x}", hash);

    // 验证完整性
    if hash_hex != expected_hash {
        return Err("Hash mismatch, file may be corrupted".to_string());
    }

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
            return Err("Invalid file path in ZIP archive".to_string());
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
