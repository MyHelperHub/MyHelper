use crate::utils::path::get_myhelper_path;
use reqwest::blocking::Client;
use sha2::{Digest, Sha256};
use std::fs::{self, File};
use std::io::{self, Write};
use zip::read::ZipArchive;

#[tauri::command]
pub fn mh_plugin_install(url: &str, expected_hash: &str, uuid: &str) -> Result<(), String> {
    // 检查 URL 是否以指定的域名开头
    if !url.starts_with("https://helper.ialtone.xyz/") {
        return Err("Invalid URL, only https://helper.ialtone.xyz/ is allowed.".to_string());
    }

    // 验证 UUID 格式
    if uuid.len() != 32 || !uuid.chars().all(|c| c.is_digit(16)) {
        return Err("Invalid UUID, must be a 16-character hexadecimal string.".to_string());
    }

    // 获取用户目录
    let target_dir = get_myhelper_path()
        .map(|path| path.join("Plugin").join(uuid))
        .map_err(|e| e.to_string())?;

    if !target_dir.exists() {
        fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;
    }

    // 创建自定义 HTTP 客户端
    let client = Client::builder()
        .danger_accept_invalid_certs(false) // 设置为 false 以启用证书验证
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

    // 创建 ZIP 文件，并将其命名为 UUID
    let zip_path = target_dir.join(format!("{}.zip", uuid));
    let mut zip_file = File::create(&zip_path).map_err(|e| e.to_string())?;
    zip_file.write_all(&bytes).map_err(|e| e.to_string())?;

    // 解压 ZIP 文件
    let file = File::open(&zip_path).map_err(|e| e.to_string())?;
    let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        let out_path = target_dir.join(file.mangled_name()); // 使用 mangled_name

        // 检查输出路径，确保不在上级目录
        if out_path.starts_with(&target_dir) {
            // 创建父目录
            if let Some(parent) = out_path.parent() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }

            // 写入文件
            let mut output_file = File::create(&out_path).map_err(|e| e.to_string())?;
            io::copy(&mut file, &mut output_file).map_err(|e| e.to_string())?;
        } else {
            return Err("Invalid file path in ZIP archive".to_string());
        }
    }

    // 删除下载的 ZIP 文件
    fs::remove_file(zip_path).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn mh_plugin_uninstall(uuid: &str) -> Result<(), String> {
    // 验证 UUID 格式
    if uuid.len() != 32 || !uuid.chars().all(|c| c.is_digit(16)) {
        return Err("Invalid UUID, must be a 16-character hexadecimal string.".to_string());
    }

    // 获取用户目录
    let target_dir = get_myhelper_path()
        .map(|path| path.join("Plugin").join(uuid))
        .map_err(|e| e.to_string())?;

    // 删除文件夹及其内容
    if target_dir.exists() {
        fs::remove_dir_all(&target_dir).map_err(|e| e.to_string())?;
    } else {
        return Err("Directory does not exist.".to_string());
    }

    Ok(())
}
