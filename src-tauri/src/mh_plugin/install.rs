use crate::utils::error::{AppError, AppResult};
use crate::utils::logger::{LogEntry, Logger};
use crate::utils::path::get_myhelper_path;
use reqwest::Client;
use std::fs::{self, File};
use std::io::{self, Cursor};
use url::Url;
use zip::read::ZipArchive;

const MAX_ZIP_SIZE: usize = 15 * 1024 * 1024; // 15MB
const REQUIRED_FILES: [&str; 2] = ["index.html", "mhPlugin.json"];

#[tauri::command]
pub async fn mh_plugin_install(url: &str, window_id: &str) -> AppResult<()> {
    println!("开始安装插件: window_id={}, url={}", window_id, url);

    // 解析URL
    let parsed_url = Url::parse(url).map_err(|e| AppError::from(format!("无效的URL: {}", e)))?;

    let host = parsed_url
        .host_str()
        .ok_or_else(|| AppError::from("URL中缺少host"))?;
    let port = parsed_url
        .port()
        .map_or(String::new(), |p| format!(":{}", p));
    let host_with_port = format!("{}{}", host, port);

    // 验证窗口ID格式
    if window_id.is_empty()
        || !window_id
            .chars()
            .all(|c| c.is_alphanumeric() || c == '-' || c == '_')
    {
        Logger::write_log(LogEntry {
            level: "error".to_string(),
            message: format!("无效的窗口ID: {}", window_id),
            timestamp: String::new(),
            details: None,
        })
        .map_err(|e| AppError::from(e))?;
        return Err(AppError::from(
            "无效的窗口ID，只能包含字母、数字、连字符或下划线",
        ));
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
    })
    .map_err(|e| AppError::from(e))?;

    // 如果目录已存在，先删除
    if target_dir.exists() {
        fs::remove_dir_all(&target_dir)
            .map_err(|e| AppError::from(format!("删除目录失败: {}", e)))?;
    }
    fs::create_dir_all(&target_dir).map_err(|e| AppError::from(format!("创建目录失败: {}", e)))?;

    // 创建异步HTTP客户端
    let client = Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .no_proxy()  // 禁用系统代理
        .danger_accept_invalid_certs(true)  // 接受无效证书
        .build()
        .map_err(|e| AppError::from(format!("创建HTTP客户端失败: {}", e)))?;

    let response = client
        .get(url)
        .header("Accept", "*/*")
        .header("Accept-Encoding", "gzip, deflate")
        .header("Connection", "keep-alive")
        .header("Host", host_with_port)
        .send()
        .await
        .map_err(|e| AppError::from(format!("下载文件失败: {}", e)))?;

    println!("响应状态: {:?}", response.status());
    println!("响应头: {:#?}", response.headers());

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        println!("错误响应内容: {}", error_text);
        return Err(AppError::from(format!(
            "下载失败，状态码: {} - 错误内容: {}",
            status, error_text
        )));
    }

    let content_type = response
        .headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok());
    println!("Content-Type: {:?}", content_type);

    let bytes = response
        .bytes()
        .await
        .map_err(|e| AppError::from(format!("读取响应失败: {}", e)))?;

    println!("下载的内容大小: {} bytes", bytes.len());
    if bytes.len() < 100 {
        // 如果内容太小，可能不是ZIP文件，打印出来看看
        println!("下载的内容: {:?}", String::from_utf8_lossy(&bytes));
    }

    if bytes.len() > MAX_ZIP_SIZE {
        return Err(AppError::from(format!("插件包太大: {} bytes", bytes.len())));
    }

    // 检查文件头是否为ZIP格式（ZIP文件的魔数是 PK\x03\x04）
    if bytes.len() < 4 || &bytes[0..4] != b"PK\x03\x04" {
        return Err(AppError::from("下载的文件不是有效的ZIP格式"));
    }

    // 解压ZIP文件
    let cursor = Cursor::new(bytes);
    let mut archive =
        ZipArchive::new(cursor).map_err(|e| AppError::from(format!("无效的ZIP文件: {}", e)))?;

    // 检查必要文件是否存在
    let mut found_files = vec![false; REQUIRED_FILES.len()];
    for i in 0..archive.len() {
        let file = archive
            .by_index(i)
            .map_err(|e| AppError::from(format!("读取ZIP文件失败: {}", e)))?;
        let name = file.name();
        for (idx, required_file) in REQUIRED_FILES.iter().enumerate() {
            if name.ends_with(required_file) {
                found_files[idx] = true;
            }
        }
    }

    if found_files.iter().any(|&found| !found) {
        let missing_files: Vec<_> = REQUIRED_FILES
            .iter()
            .zip(found_files.iter())
            .filter(|(_, &found)| !found)
            .map(|(&name, _)| name)
            .collect();
        return Err(AppError::from(format!("缺少必要文件: {:?}", missing_files)));
    }

    // 解压文件
    for i in 0..archive.len() {
        let mut file = archive
            .by_index(i)
            .map_err(|e| AppError::from(format!("提取文件失败: {}", e)))?;
        let out_path = target_dir.join(file.mangled_name());

        if out_path.starts_with(&target_dir) {
            if let Some(parent) = out_path.parent() {
                // 如果父目录路径存在且是一个文件，先删除它
                if parent.exists() && parent.is_file() {
                    fs::remove_file(parent)
                        .map_err(|e| AppError::from(format!("删除已存在的文件失败: {}", e)))?;
                }
                // 创建父目录
                fs::create_dir_all(parent)
                    .map_err(|e| AppError::from(format!("创建目录失败: {}", e)))?;
            }
            // 如果文件已存在，先删除
            if out_path.exists() {
                if out_path.is_file() {
                    fs::remove_file(&out_path)
                        .map_err(|e| AppError::from(format!("删除已存在的文件失败: {}", e)))?;
                } else {
                    fs::remove_dir_all(&out_path)
                        .map_err(|e| AppError::from(format!("删除已存在的目录失败: {}", e)))?;
                }
            }
            let mut output_file = File::create(&out_path)
                .map_err(|e| AppError::from(format!("创建文件失败: {}", e)))?;
            io::copy(&mut file, &mut output_file)
                .map_err(|e| AppError::from(format!("写入文件失败: {}", e)))?;
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
    })
    .map_err(|e| AppError::from(e))?;

    Ok(())
}

#[tauri::command]
pub fn mh_plugin_uninstall(window_id: &str) -> AppResult<()> {
    // 验证窗口ID格式
    if window_id.is_empty()
        || !window_id
            .chars()
            .all(|c| c.is_alphanumeric() || c == '-' || c == '_')
    {
        return Err(AppError::from(
            "无效的窗口ID，只能包含字母、数字、连字符或下划线",
        ));
    }

    // 记录开始卸载的日志
    Logger::write_log(LogEntry {
        level: "info".to_string(),
        message: format!("开始卸载插件，窗口ID: {}", window_id),
        timestamp: String::new(),
        details: None,
    })
    .map_err(|e| AppError::from(e))?;

    // 获取用户目录
    let target_dir = get_myhelper_path()
        .map(|path| path.join("Plugin").join(window_id))
        .map_err(|e| AppError::from(e))?;

    // 删除文件夹及其内容
    if target_dir.exists() {
        fs::remove_dir_all(&target_dir)
            .map_err(|e| AppError::from(format!("删除插件目录失败: {}", e)))?;
    } else {
        return Err(AppError::from("插件目录不存在"));
    }

    // 记录卸载成功的日志
    Logger::write_log(LogEntry {
        level: "info".to_string(),
        message: format!("插件卸载成功，窗口ID: {}", window_id),
        timestamp: String::new(),
        details: None,
    })
    .map_err(|e| AppError::from(e))?;

    Ok(())
}
