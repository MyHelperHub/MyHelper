use crate::utils::path::get_myhelper_path;
use once_cell::sync::Lazy;
use parking_lot::RwLock;
use serde_json::{json, Value};
use simd_json;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::Window;
use tokio::fs as tokio_fs;
use tokio::io::AsyncReadExt;
use tokio::io::AsyncWriteExt;

// 使用Lazy和RwLock缓存配置路径，避免重复计算
static CONFIG_PATHS: Lazy<RwLock<HashMap<String, PathBuf>>> =
    Lazy::new(|| RwLock::new(HashMap::new()));

/// 获取插件自身配置
#[tauri::command]
pub async fn mh_get_self_config(window: Window, keys: Vec<String>) -> Result<Value, String> {
    let window_id = window.label();
    let config_path = get_self_config_path(window_id)?;
    let config = read_config_async(&config_path).await?;

    // 如果 keys 为空,返回整个配置
    if keys.is_empty() {
        return Ok(config);
    }

    // 根据 keys 获取指定配置项
    let mut current = &config;
    for key in keys {
        current = current
            .get(&key)
            .ok_or_else(|| format!("配置项 {} 不存在", key))?;
    }
    Ok(current.clone())
}

/// 设置插件自身配置
#[tauri::command]
pub async fn mh_set_self_config(
    window: Window,
    keys: Vec<String>,
    value: Value,
) -> Result<(), String> {
    let window_id = window.label();
    let config_path = get_self_config_path(window_id)?;
    let mut config = read_config_async(&config_path).await?;

    // 根据 keys 设置配置项
    let mut current = &mut config;
    for (i, key) in keys.iter().enumerate() {
        if i == keys.len() - 1 {
            current[key] = value.clone();
        } else {
            if !current[key].is_object() {
                current[key] = json!({});
            }
            current = current.get_mut(key).unwrap();
        }
    }

    write_config_async(&config_path, &config).await
}

/// 删除插件自身配置
#[tauri::command]
pub async fn mh_delete_self_config(window: Window, keys: Vec<String>) -> Result<(), String> {
    let window_id = window.label();
    let config_path = get_self_config_path(window_id)?;

    if keys.is_empty() {
        // 删除整个配置文件
        if config_path.exists() {
            tokio_fs::remove_file(&config_path)
                .await
                .map_err(|e| e.to_string())?;
        }
        return Ok(());
    }

    let mut config = read_config_async(&config_path).await?;
    let mut current = &mut config;

    // 根据 keys 删除配置项
    for (i, key) in keys.iter().enumerate() {
        if i == keys.len() - 1 {
            current.as_object_mut().ok_or("无效的配置结构")?.remove(key);
        } else {
            current = current.get_mut(key).ok_or("配置项不存在")?;
        }
    }

    write_config_async(&config_path, &config).await
}

// 获取配置文件路径，使用缓存提高性能
fn get_self_config_path(window_id: &str) -> Result<PathBuf, String> {
    // 先检查缓存
    {
        let cache = CONFIG_PATHS.read();
        if let Some(path) = cache.get(window_id) {
            return Ok(path.clone());
        }
    }

    if window_id.is_empty()
        || !window_id
            .chars()
            .all(|c| c.is_alphanumeric() || c == '-' || c == '_')
    {
        return Err("Invalid window ID, must contain only alphanumeric characters, hyphens, or underscores.".to_string());
    }

    // 获取用户目录
    let target_dir = get_myhelper_path()
        .map(|path| path.join("Plugin").join(window_id))
        .map_err(|e| e.to_string())?;

    fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;
    let config_path = target_dir.join("selfConfig.json");

    // 更新缓存
    {
        let mut cache = CONFIG_PATHS.write();
        cache.insert(window_id.to_string(), config_path.clone());
    }

    Ok(config_path)
}

// 异步读取配置文件
async fn read_config_async(path: &PathBuf) -> Result<Value, String> {
    if !path.exists() {
        return Ok(json!({}));
    }

    // 使用tokio异步读取文件
    let mut file = tokio_fs::File::open(path)
        .await
        .map_err(|e| e.to_string())?;

    let mut buffer = Vec::with_capacity(4096);
    file.read_to_end(&mut buffer)
        .await
        .map_err(|e| e.to_string())?;

    // 使用simd-json加速解析
    match simd_json::serde::from_slice::<Value>(&mut buffer) {
        Ok(data) => Ok(data),
        Err(_) => {
            // 回退到标准serde_json
            serde_json::from_slice(&buffer).map_err(|e| e.to_string())
        }
    }
}

// 异步写入配置文件
async fn write_config_async(path: &PathBuf, config: &Value) -> Result<(), String> {
    // 使用serde_json序列化，因为simd-json主要优化解析而非序列化
    let content = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;

    // 使用tokio异步写入文件
    let mut file = tokio_fs::File::create(path)
        .await
        .map_err(|e| e.to_string())?;

    file.write_all(content.as_bytes())
        .await
        .map_err(|e| e.to_string())?;

    file.flush().await.map_err(|e| e.to_string())?;

    Ok(())
}
