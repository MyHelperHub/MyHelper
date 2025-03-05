use crate::utils::database::{
    batch_insert_plugin_configs, batch_remove_plugin_configs, query_plugin_ids,
};
use crate::utils::error::{AppError, AppResult};
use crate::utils::logger::{LogEntry, Logger};
use crate::utils::path::get_myhelper_path;
use serde_json::{json, Value};
use simd_json;
use std::collections::HashSet;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::fs as tokio_fs;
use tokio::io::AsyncReadExt;
use tokio::sync::Semaphore;
use tokio::task::JoinSet;
use tokio::try_join;

// 批处理大小
const BATCH_SIZE: usize = 100;
// 并发限制 - 增加到32以优化I/O密集型任务
const MAX_CONCURRENT: usize = 32;

/// 高性能同步插件目录和配置
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
        .map_err(|e| AppError::from(e))?;

    // 如果插件目录不存在，创建它
    if !plugin_root.exists() {
        tokio_fs::create_dir_all(&plugin_root)
            .await
            .map_err(|e| AppError::from(format!("创建插件目录失败: {}", e)))?;
        return Ok(());
    }

    // 一次性读取所有插件记录到内存
    let existing_plugins: HashSet<String> = query_plugin_ids()?;
    let mut processed_plugins = HashSet::new();

    // 收集需要插入的插件
    let mut to_insert = Vec::with_capacity(BATCH_SIZE);

    // 读取所有目录条目
    let mut entries = Vec::new();
    let mut dir = tokio_fs::read_dir(&plugin_root)
        .await
        .map_err(|e| AppError::from(format!("读取插件目录失败: {}", e)))?;

    while let Some(entry) = dir
        .next_entry()
        .await
        .map_err(|e| AppError::from(format!("读取插件目录条目失败: {}", e)))?
    {
        entries.push(entry);
    }

    // 创建信号量控制并发
    let semaphore = Arc::new(Semaphore::new(MAX_CONCURRENT));

    // 创建任务集合
    let mut tasks = JoinSet::new();

    // 创建任务
    for entry in entries {
        let semaphore = semaphore.clone();
        let existing = existing_plugins.clone();

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

        // 添加到任务集合
        tasks.spawn(async move {
            // 获取许可
            let _permit = semaphore.acquire().await.unwrap();

            // 处理插件
            process_plugin(&plugin_dir, &window_id, &existing).await
        });
    }

    // 处理任务结果
    while let Some(result) = tasks.join_next().await {
        if let Ok(Ok(Some((window_id, info, config, data)))) = result {
            if !existing_plugins.contains(&window_id) {
                // 批量序列化以减少冗余操作
                let (info_str, config_str, data_str) = tokio::task::spawn_blocking(move || {
                    (
                        serde_json::to_string(&info).unwrap_or_default(),
                        serde_json::to_string(&config).unwrap_or_default(),
                        serde_json::to_string(&data).unwrap_or_default(),
                    )
                })
                .await
                .map_err(|e| AppError::Error(format!("序列化任务失败: {}", e)))?;

                // 检查序列化结果
                if !info_str.is_empty() && !config_str.is_empty() {
                    to_insert.push((window_id.clone(), info_str, config_str, data_str));

                    // 批量处理插入操作
                    if to_insert.len() >= BATCH_SIZE {
                        batch_insert_plugin_configs(&to_insert)?;
                        to_insert.clear();
                    }
                }
            }
            processed_plugins.insert(window_id);
        }
    }

    // 处理剩余的插入操作
    if !to_insert.is_empty() {
        batch_insert_plugin_configs(&to_insert)?;
    }

    // 批量删除不存在的插件记录
    let to_delete: Vec<String> = existing_plugins
        .difference(&processed_plugins)
        .cloned()
        .collect();

    if !to_delete.is_empty() {
        for window_id in &to_delete {
            Logger::write_log(LogEntry {
                level: "info".to_string(),
                message: format!("删除不存在的插件配置: {}", window_id),
                timestamp: String::new(),
                details: None,
            })?;
        }

        batch_remove_plugin_configs(&to_delete)?;
    }

    Logger::write_log(LogEntry {
        level: "info".to_string(),
        message: format!(
            "插件配置同步完成，共发现 {} 个有效插件",
            processed_plugins.len()
        ),
        timestamp: String::new(),
        details: None,
    })?;

    Ok(())
}

/// 处理单个插件目录
async fn process_plugin(
    plugin_dir: &PathBuf,
    window_id: &str,
    existing_plugins: &HashSet<String>,
) -> AppResult<Option<(String, Value, Value, Value)>> {
    // 检查是否为目录和必要文件
    let (dir_meta, index_exists) = try_join!(
        tokio_fs::metadata(plugin_dir),
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

    // 读取主配置文件 - 使用异步I/O优化
    let config_path = plugin_dir.join("mhPlugin.json");
    let mut config_buffer = async {
        // 直接使用异步文件I/O代替spawn_blocking包装的同步I/O
        let mut file = match tokio_fs::File::open(&config_path).await {
            Ok(file) => file,
            Err(_) => return Vec::new(),
        };

        let mut buffer = Vec::with_capacity(4096); // 预分配4KB
        match file.read_to_end(&mut buffer).await {
            Ok(_) => buffer,
            Err(_) => Vec::new(),
        }
    }
    .await;

    // 使用simd-json解析主配置文件
    let mut data: Value = if !config_buffer.is_empty() {
        match simd_json::serde::from_slice::<serde_json::Value>(&mut config_buffer) {
            Ok(config) => config,
            Err(_) => {
                // 如果SIMD解析失败，回退到标准serde_json
                match serde_json::from_slice::<Value>(&config_buffer) {
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
            }
        }
    } else {
        return Ok(None);
    };

    // 验证 windowId
    if data.get("windowId").and_then(|v| v.as_str()) != Some(window_id) {
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
        .join(window_id)
        .join("index.html");
    if let Some(url) = plugin_path.to_str() {
        if let Some(data_obj) = data.as_object_mut() {
            data_obj.insert("url".to_string(), json!(url.replace('\\', "/")));
        }
    }

    // 只有在记录不存在时才读取 init.json
    let (info, config_value) = if !existing_plugins.contains(window_id) {
        let init_path = plugin_dir.join("init.json");
        let mut init_buffer = async {
            // 直接使用异步文件I/O
            let mut file = match tokio_fs::File::open(&init_path).await {
                Ok(file) => file,
                Err(_) => return Vec::new(),
            };

            let mut buffer = Vec::with_capacity(4096);
            match file.read_to_end(&mut buffer).await {
                Ok(_) => buffer,
                Err(_) => Vec::new(),
            }
        }
        .await;

        if !init_buffer.is_empty() {
            // 使用simd-json解析init.json
            match simd_json::serde::from_slice::<serde_json::Value>(&mut init_buffer) {
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
                Err(_) => {
                    // 如果SIMD解析失败，回退到标准serde_json
                    match serde_json::from_slice::<Value>(&init_buffer) {
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
                        Err(_) => (json!({}), json!({})),
                    }
                }
            }
        } else {
            (json!({}), json!({}))
        }
    } else {
        (json!({}), json!({}))
    };

    Ok(Some((window_id.to_string(), info, config_value, data)))
}
