use crate::utils::path::get_myhelper_path;
use serde_json::{json, Value};
use std::fs;
use std::path::PathBuf;
use tauri::Window;

/// 获取插件自身配置
#[tauri::command]
pub async fn mh_get_self_config(window: Window, keys: Vec<String>) -> Result<Value, String> {
    let window_id = window.label();
    let config_path = get_self_config_path(window_id)?;
    let config = read_config(&config_path)?;

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
    let mut config = read_config(&config_path)?;

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

    write_config(&config_path, &config)
}

/// 删除插件自身配置
#[tauri::command]
pub async fn mh_delete_self_config(window: Window, keys: Vec<String>) -> Result<(), String> {
    let window_id = window.label();
    let config_path = get_self_config_path(window_id)?;

    if keys.is_empty() {
        // 删除整个配置文件
        if config_path.exists() {
            fs::remove_file(&config_path).map_err(|e| e.to_string())?;
        }
        return Ok(());
    }

    let mut config = read_config(&config_path)?;
    let mut current = &mut config;

    // 根据 keys 删除配置项
    for (i, key) in keys.iter().enumerate() {
        if i == keys.len() - 1 {
            current.as_object_mut().ok_or("无效的配置结构")?.remove(key);
        } else {
            current = current.get_mut(key).ok_or("配置项不存在")?;
        }
    }

    write_config(&config_path, &config)
}

// 获取配置文件路径
fn get_self_config_path(window_id: &str) -> Result<PathBuf, String> {
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
    Ok(target_dir.join("selfConfig.json"))
}

// 读取配置文件
fn read_config(path: &PathBuf) -> Result<Value, String> {
    if !path.exists() {
        return Ok(json!({}));
    }
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

// 写入配置文件
fn write_config(path: &PathBuf, config: &Value) -> Result<(), String> {
    let content = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(path, content).map_err(|e| e.to_string())
}
