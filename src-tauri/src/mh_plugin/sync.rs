use crate::utils::config::{utils_get_config, utils_set_config};
use crate::utils::error::{AppError, AppResult};
use crate::utils::logger::{LogEntry, Logger};
use crate::utils::path::get_myhelper_path;
use serde_json::{json, Value};
use std::collections::{HashMap, HashSet};
use tokio::fs as tokio_fs;

/// 同步插件目录和配置
///
/// 扫描 Plugin 目录下的所有插件，确保配置与实际的插件目录同步。
/// 每个插件的配置存储在其自己的目录下的 mhPlugin.json 中。
pub async fn sync_plugins() -> AppResult<()> {
    Logger::write_log(LogEntry {
        level: "info".to_string(),
        message: "开始同步插件配置".to_string(),
        timestamp: String::new(),
        details: None,
    })
    .map_err(|e| AppError::from(e))?;

    // 获取插件根目录
    let plugin_root = get_myhelper_path()
        .map(|path| path.join("Plugin"))
        .map_err(|e| AppError::from(e))?;

    // 如果插件目录不存在，创建它
    if !plugin_root.exists() {
        tokio_fs::create_dir_all(&plugin_root)
            .await
            .map_err(|e| AppError::from(format!("创建插件目录失败: {}", e)))?;
        
        // 只有在目录不存在时才保存空配置
        let empty_config = HashMap::from([
            ("pluginList".to_string(), Value::Array(Vec::new()))
        ]);
        utils_set_config("plugin", empty_config)
            .map_err(|e| AppError::from(format!("保存空插件配置失败: {}", e)))?;
        return Ok(());
    }

    // 获取实际的插件目录列表
    let mut plugin_dirs = tokio_fs::read_dir(&plugin_root)
        .await
        .map_err(|e| AppError::from(format!("读取插件目录失败: {}", e)))?;

    // 获取现有的插件配置
    let current_config = utils_get_config("plugin", vec![])
        .map_err(|e| AppError::from(format!("读取插件配置失败: {}", e)))?
        .unwrap_or_else(|| json!({"pluginList": []}));

    let empty_vec = Vec::new();
    let current_list = current_config.get("pluginList")
        .and_then(|v| v.as_array())
        .unwrap_or(&empty_vec);

    // 收集有效的插件配置
    let mut plugin_list = Vec::new();
    let mut found_any_plugin = false;
    let mut processed_plugins = HashSet::new();

    // 首先添加现有配置中的插件（保持顺序）
    for existing_plugin in current_list {
        if let Some(window_id) = existing_plugin.get("windowId").and_then(|v| v.as_str()) {
            processed_plugins.insert(window_id.to_string());
            plugin_list.push(existing_plugin.clone());
        }
    }

    while let Some(entry) = plugin_dirs.next_entry().await
        .map_err(|e| AppError::from(format!("读取插件目录条目失败: {}", e)))? {
        found_any_plugin = true;
        
        // 检查目录名是否有效
        let file_name = entry.file_name();
        let window_id = match file_name.to_str() {
            Some(name) if !name.is_empty() && name.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_') => name,
            _ => {
                Logger::write_log(LogEntry {
                    level: "warn".to_string(),
                    message: format!("插件目录名无效: {:?}", file_name),
                    timestamp: String::new(),
                    details: None,
                }).map_err(|e| AppError::from(e))?;
                continue;
            }
        };

        // 如果这个插件已经处理过了（在现有配置中），跳过它
        if processed_plugins.contains(window_id) {
            continue;
        }

        if entry.file_type().await
            .map_err(|e| AppError::from(format!("获取文件类型失败: {}", e)))?.is_dir() {
            let plugin_dir = entry.path();
            let config_path = plugin_dir.join("mhPlugin.json");

            // 检查插件目录是否包含必要文件
            let has_index = tokio_fs::metadata(plugin_dir.join("index.html")).await.is_ok();

            if has_index {
                // 读取插件的配置文件
                match tokio_fs::read_to_string(&config_path).await {
                    Ok(content) => {
                        match serde_json::from_str::<Value>(&content) {
                            Ok(config) => {
                                // 检查顶层 windowId 和 data.windowId 是否都与文件夹名一致
                                let top_level_id = config.get("windowId").and_then(|v| v.as_str());
                                let data_level_id = config.get("data")
                                    .and_then(|d| d.get("windowId"))
                                    .and_then(|v| v.as_str());

                                if top_level_id == Some(window_id) && data_level_id == Some(window_id) {
                                    plugin_list.push(config);
                                    processed_plugins.insert(window_id.to_string());
                                    continue;
                                }
                                
                                Logger::write_log(LogEntry {
                                    level: "warn".to_string(),
                                    message: format!("插件配置的 windowId 无效或不匹配: {}", window_id),
                                    timestamp: String::new(),
                                    details: None,
                                }).map_err(|e| AppError::from(e))?;
                            }
                            Err(e) => {
                                Logger::write_log(LogEntry {
                                    level: "warn".to_string(),
                                    message: format!("插件配置解析失败: {}", window_id),
                                    timestamp: String::new(),
                                    details: Some(format!("错误: {}", e)),
                                }).map_err(|e| AppError::from(e))?;
                            }
                        }
                    }
                    Err(e) => {
                        Logger::write_log(LogEntry {
                            level: "warn".to_string(),
                            message: format!("无法读取插件配置文件: {}", window_id),
                            timestamp: String::new(),
                            details: Some(format!("错误: {}", e)),
                        }).map_err(|e| AppError::from(e))?;
                    }
                }
            } else {
                Logger::write_log(LogEntry {
                    level: "warn".to_string(),
                    message: format!("插件目录 {} 缺少必要文件", window_id),
                    timestamp: String::new(),
                    details: None,
                })
                .map_err(|e| AppError::from(e))?;
            }
        }
    }

    // 如果没有找到任何插件，保存空配置
    if !found_any_plugin {
        let empty_config = HashMap::from([
            ("pluginList".to_string(), Value::Array(Vec::new()))
        ]);
        utils_set_config("plugin", empty_config)
            .map_err(|e| AppError::from(format!("保存空插件配置失败: {}", e)))?;
        return Ok(());
    }

    // 检查配置是否有变化
    if plugin_list.len() == current_list.len() && plugin_list.iter().zip(current_list.iter())
        .all(|(a, b)| a == b) {
        return Ok(());
    }

    // 只有在配置有变化时才保存
    let plugin_count = plugin_list.len();
    let config_hashmap = HashMap::from([("pluginList".to_string(), Value::Array(plugin_list))]);
    utils_set_config("plugin", config_hashmap)
        .map_err(|e| AppError::from(format!("保存更新后的插件配置失败: {}", e)))?;

    Logger::write_log(LogEntry {
        level: "info".to_string(),
        message: format!("插件配置同步完成，共发现 {} 个有效插件", plugin_count),
        timestamp: String::new(),
        details: None,
    })
    .map_err(|e| AppError::from(e))?;

    Ok(())
}
