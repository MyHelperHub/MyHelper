use crate::utils::path::get_myhelper_path;
use crate::utils::error::{AppError, AppResult};
use crate::utils::logger::{Logger, LogEntry};
use reqwest::blocking::Client;
use std::fs::{self, File};
use std::io::{self};
use zip::read::ZipArchive;

const MAX_ZIP_SIZE: usize = 15 * 1024 * 1024; // 15MB
const REQUIRED_FILES: [&str; 2] = ["index.html", "mhPlugin.json"];

#[tauri::command]
pub fn mh_plugin_install(url: &str, window_id: &str) -> AppResult<()> {
    // 验证窗口ID格式
    if window_id.is_empty() || !window_id.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_') {
        Logger::write_log(LogEntry {
            level: "error".to_string(),
            message: format!("无效的窗口ID: {}", window_id),
            timestamp: String::new(),
            details: None,
        }).map_err(|e| AppError::from(e))?;
        return Err(AppError::from("无效的窗口ID，只能包含字母、数字、连字符或下划线"));
    }

    // 获取用户目录
    let target_dir = get_myhelper_path()
        .map(|path| path.join("Plugin").join(window_id))
        .map_err(|e| AppError::from(e))?;

    // 记录开始安装的日志
    Logger::write_log(LogEntry {
        level: "info".to_string(),
        message: format!("开始安装插件，窗口ID: {}", window_id),
        timestamp: String::new(),
        details: Some(format!("下载地址: {}", url)),
    }).map_err(|e| AppError::from(e))?;

    // 如果目录已存在，先删除
    if target_dir.exists() {
        fs::remove_dir_all(&target_dir).map_err(|e| AppError::from(format!("删除目录失败: {}", e)))?;
    }
    fs::create_dir_all(&target_dir).map_err(|e| AppError::from(format!("创建目录失败: {}", e)))?;

    // 创建自定义 HTTP 客户端
    let client = Client::builder()
        .danger_accept_invalid_certs(false)
        .build()
        .map_err(|e| AppError::from(format!("Failed to create HTTP client: {}", e)))?;

    // 下载 ZIP 文件
    let response = client.get(url).send().map_err(|e| AppError::from(format!("下载文件失败: {}", e)))?;

    if !response.status().is_success() {
        return Err(AppError::from(format!("下载失败，状态码: {}", response.status())));
    }

    let bytes = response.bytes().map_err(|e| AppError::from(format!("读取响应失败: {}", e)))?;
    
    // 检查文件大小
    if bytes.len() > MAX_ZIP_SIZE {
        return Err(AppError::from(format!("插件包太大: {} bytes", bytes.len())));
    }

    // 解压 ZIP 文件
    let mut archive = ZipArchive::new(std::io::Cursor::new(bytes.clone()))
        .map_err(|e| AppError::from(format!("无效的ZIP文件: {}", e)))?;

    // 检查必要文件是否存在
    let mut found_files = vec![false; REQUIRED_FILES.len()];
    for i in 0..archive.len() {
        let file = archive.by_index(i).map_err(|e| AppError::from(format!("读取ZIP文件失败: {}", e)))?;
        let name = file.name();
        for (idx, required_file) in REQUIRED_FILES.iter().enumerate() {
            if name.ends_with(required_file) {
                found_files[idx] = true;
            }
        }
    }

    if found_files.iter().any(|&found| !found) {
        let missing_files: Vec<_> = REQUIRED_FILES.iter()
            .zip(found_files.iter())
            .filter(|(_, &found)| !found)
            .map(|(&name, _)| name)
            .collect();
        return Err(AppError::from(format!("缺少必要文件: {:?}", missing_files)));
    }

    // 重新打开压缩包进行解压
    let mut archive = ZipArchive::new(std::io::Cursor::new(bytes))
        .map_err(|e| AppError::from(format!("重新打开ZIP文件失败: {}", e)))?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| AppError::from(format!("提取文件失败: {}", e)))?;
        let out_path = target_dir.join(file.mangled_name());

        if out_path.starts_with(&target_dir) {
            if let Some(parent) = out_path.parent() {
                fs::create_dir_all(parent).map_err(|e| AppError::from(format!("创建目录失败: {}", e)))?;
            }
            let mut output_file = File::create(&out_path).map_err(|e| AppError::from(format!("创建文件失败: {}", e)))?;
            io::copy(&mut file, &mut output_file).map_err(|e| AppError::from(format!("写入文件失败: {}", e)))?;
        } else {
            return Err(AppError::from("ZIP文件包含非法路径"));
        }
    }

    // 记录安装成功的日志
    Logger::write_log(LogEntry {
        level: "info".to_string(),
        message: format!("插件安装成功，窗口ID: {}", window_id),
        timestamp: String::new(),
        details: None,
    }).map_err(|e| AppError::from(e))?;

    Ok(())
}

#[tauri::command]
pub fn mh_plugin_uninstall(window_id: &str) -> AppResult<()> {
    // 验证窗口ID格式
    if window_id.is_empty() || !window_id.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_') {
        return Err(AppError::from("无效的窗口ID，只能包含字母、数字、连字符或下划线"));
    }

    // 记录开始卸载的日志
    Logger::write_log(LogEntry {
        level: "info".to_string(),
        message: format!("开始卸载插件，窗口ID: {}", window_id),
        timestamp: String::new(),
        details: None,
    }).map_err(|e| AppError::from(e))?;

    // 获取用户目录
    let target_dir = get_myhelper_path()
        .map(|path| path.join("Plugin").join(window_id))
        .map_err(|e| AppError::from(e))?;

    // 删除文件夹及其内容
    if target_dir.exists() {
        fs::remove_dir_all(&target_dir).map_err(|e| AppError::from(format!("删除插件目录失败: {}", e)))?;
    } else {
        return Err(AppError::from("插件目录不存在"));
    }

    // 记录卸载成功的日志
    Logger::write_log(LogEntry {
        level: "info".to_string(),
        message: format!("插件卸载成功，窗口ID: {}", window_id),
        timestamp: String::new(),
        details: None,
    }).map_err(|e| AppError::from(e))?;

    Ok(())
}
