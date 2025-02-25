use crate::utils::database::{insert_plugin_config, query_plugin_ids, remove_plugin_config};
use crate::utils::error::{AppError, AppResult};
use crate::utils::logger::{LogEntry, Logger};
use crate::utils::path::get_myhelper_path;
use serde_json::{json, Value};
use std::collections:: HashSet;
use tokio::fs as tokio_fs;
use tokio::try_join;

/// 同步插件目录和配置
///
/// 同步逻辑：
/// 1. 检查记录与本地文件是否对应
/// 2. 如果对应，保持不变
/// 3. 如果不对应：
///    - 如果文件不存在，删除数据库记录
///    - 如果记录不存在，且文件符合校验规则，插入新记录
pub async fn sync_plugins() -> AppResult<()> {
    // 获取插件根目录
    let plugin_root = get_myhelper_path()
        .map(|path| path.join("Plugin"))
        .map_err(|_e| AppError::from(_e))?;

    // 如果插件目录不存在，创建它
    if !plugin_root.exists() {
        tokio_fs::create_dir_all(&plugin_root)
            .await
            .map_err(|_e| AppError::from(format!("创建插件目录失败: {}", _e)))?;
        return Ok(());
    }

    // 获取现有的插件配置
    let existing_plugins = query_plugin_ids()?;
    let existing_plugins = std::sync::Arc::new(existing_plugins);
    let mut processed_plugins = HashSet::new();

    // 扫描插件目录
    let mut entries = tokio_fs::read_dir(&plugin_root)
        .await
        .map_err(|_e| AppError::from(format!("读取插件目录失败: {}", _e)))?;

    // 并发处理插件目录
    let mut tasks = Vec::new();

    while let Some(entry) = entries
        .next_entry()
        .await
        .map_err(|_e| AppError::from(format!("读取插件目录条目失败: {}", _e)))?
    {
        // 检查目录名是否有效
        let window_id = match entry.file_name().to_str() {
            Some(name)
                if !name.is_empty()
                    && name
                        .chars()
                        .all(|c| c.is_alphanumeric() || c == '-' || c == '_') =>
            {
                name.to_string()
            }
            _ => {
                Logger::write_log(LogEntry {
                    level: "warn".to_string(),
                    message: format!("插件目录名无效: {:?}", entry.file_name()),
                    timestamp: String::new(),
                    details: None,
                })?;
                continue;
            }
        };

        let plugin_dir = entry.path();
        let existing_plugins = existing_plugins.clone();
        
        tasks.push(tokio::spawn(async move {
            async {
                // 检查是否为目录和必要文件
                let (dir_meta, index_exists) = try_join!(
                    tokio_fs::metadata(&plugin_dir),
                    tokio_fs::metadata(plugin_dir.join("index.html"))
                )
                .map_err(|_e| {
                    let _ = Logger::write_log(LogEntry {
                        level: "warn".to_string(),
                        message: format!("插件目录 {} 缺少必要文件或不是目录", window_id),
                        timestamp: String::new(),
                        details: None,
                    });
                    AppError::Error("插件目录无效".into())
                })?;

                if !dir_meta.is_dir() || !index_exists.is_file() {
                    return Ok(None);
                }

                // 读取主配置文件
                let config_path = plugin_dir.join("mhPlugin.json");
                let config_content = tokio::task::spawn_blocking(move || {
                    std::fs::read(&config_path)
                        .map(|content| String::from_utf8_lossy(&content).into_owned())
                        .unwrap_or_default()
                }).await.map_err(|e| AppError::Error(format!("读取配置文件失败: {}", e)))?;

                // 解析主配置文件
                let mut data: Value = if !config_content.is_empty() {
                    match serde_json::from_str(&config_content) {
                        Ok(config) => config,
                        Err(e) => {
                            Logger::write_log(LogEntry {
                                level: "warn".to_string(),
                                message: format!("解析配置失败: {}", window_id),
                                timestamp: String::new(),
                                details: Some(e.to_string()),
                            })?;
                            return Ok(None);
                        }
                    }
                } else {
                    return Ok(None);
                };

                // 验证 windowId
                if data.get("windowId").and_then(|v| v.as_str()) != Some(&window_id) {
                    Logger::write_log(LogEntry {
                        level: "warn".to_string(),
                        message: format!("插件配置的 windowId 无效或不匹配: {}", window_id),
                        timestamp: String::new(),
                        details: None,
                    })?;
                    return Ok(None);
                }

                // 添加 url 字段
                let plugin_path = get_myhelper_path()?
                    .join("Plugin")
                    .join(&window_id)
                    .join("index.html");
                if let Some(url) = plugin_path.to_str() {
                    if let Some(data_obj) = data.as_object_mut() {
                        data_obj.insert("url".to_string(), json!(url.replace('\\', "/")));
                    }
                }

                // 只有在记录不存在时才读取 init.json
                let (info, config_value) = if !existing_plugins.contains(&window_id) {
                    let init_path = plugin_dir.join("init.json");
                    let init_content = tokio::task::spawn_blocking(move || {
                        std::fs::read(&init_path)
                            .map(|content| String::from_utf8_lossy(&content).into_owned())
                            .unwrap_or_default()
                    }).await.map_err(|e| AppError::Error(format!("读取初始化文件失败: {}", e)))?;

                    if !init_content.is_empty() {
                        match serde_json::from_str::<Value>(&init_content) {
                            Ok(init_config) => (
                                init_config
                                    .get("info")
                                    .cloned()
                                    .unwrap_or_else(|| json!({})),
                                init_config
                                    .get("config")
                                    .cloned()
                                    .unwrap_or_else(|| json!({})),
                            ),
                            Err(_) => (json!({}), json!({}))
                        }
                    } else {
                        (json!({}), json!({}))
                    }
                } else {
                    (json!({}), json!({}))
                };

                Ok(Some((window_id, info, config_value, data)))
            }
            .await as AppResult<Option<(String, Value, Value, Value)>>
        }));
    }

    // 等待所有任务完成并处理结果
    
    // 直接处理任务结果，避免中间集合
    for task in tasks {
        if let Ok(Ok(Some((window_id, info, config, data)))) = task.await {
            // 如果是新插件，立即插入数据库
            if !existing_plugins.contains(&window_id) {
                let info_str = serde_json::to_string(&info)
                    .map_err(|e| AppError::Error(format!("序列化info失败: {}", e)))?;
                let config_str = serde_json::to_string(&config)
                    .map_err(|e| AppError::Error(format!("序列化config失败: {}", e)))?;
                let data_str = serde_json::to_string(&data)
                    .map_err(|e| AppError::Error(format!("序列化data失败: {}", e)))?;
                
                insert_plugin_config(window_id.clone(), info_str, config_str, data_str)?;
            }
            processed_plugins.insert(window_id);
        }
    }

    // 删除不存在的插件配置
    for window_id in existing_plugins.difference(&processed_plugins) {
        Logger::write_log(LogEntry {
            level: "info".to_string(),
            message: format!("删除不存在的插件配置: {}", window_id),
            timestamp: String::new(),
            details: None,
        })?;
        remove_plugin_config(window_id)?;
    }

    Logger::write_log(LogEntry {
        level: "info".to_string(),
        message: format!("插件配置同步完成，共发现 {} 个有效插件", processed_plugins.len()),
        timestamp: String::new(),
        details: None,
    })?;

    Ok(())
}

