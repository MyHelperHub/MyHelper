use serde_json::{Map, Value};
use simd_json;
use std::collections::HashMap;
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};

use super::path::get_myhelper_path;

// 获取配置文件的路径并确保目录存在
pub fn get_config_path(config_type: &str) -> Result<PathBuf, String> {
    let myhelper_path = get_myhelper_path()?;
    let file_name = match config_type {
        "config" => "config.json",
        // plugin这个暂时用不到，暂存下以后可能会拓展
        "plugin" => "plugin.json",
        _ => return Err("Invalid config type".to_string()),
    };
    let config_path = myhelper_path.join(file_name);

    // 如果配置文件不存在，则创建它并初始化为空的 JSON 对象
    if !config_path.exists() {
        let mut file = fs::File::create(&config_path).map_err(|e| e.to_string())?;
        file.write_all(b"{}").map_err(|e| e.to_string())?;
    }

    Ok(config_path)
}

// 读取配置文件
fn read_config(config_path: &Path) -> Result<HashMap<String, Value>, String> {
    if config_path.exists() {
        let mut file = File::open(config_path).map_err(|e| e.to_string())?;
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer).map_err(|e| e.to_string())?;

        // 如果文件为空，返回空的 HashMap
        if buffer.is_empty() {
            return Ok(HashMap::new());
        }

        // 使用simd-json加速解析
        match simd_json::serde::from_slice::<HashMap<String, Value>>(&mut buffer) {
            Ok(data) => Ok(data),
            Err(_) => {
                // 回退到标准serde_json
                serde_json::from_slice(&buffer).map_err(|e| e.to_string())
            }
        }
    } else {
        Ok(HashMap::new())
    }
}

// 保存配置数据
pub fn utils_set_config(config_type: &str, new_data: HashMap<String, Value>) -> Result<(), String> {
    let config_path = get_config_path(config_type)?;
    let mut current_data = read_config(&config_path)?;

    // 合并新数据
    for (key, value) in new_data {
        current_data.insert(key, value);
    }

    let config_data = serde_json::to_string_pretty(&current_data).map_err(|e| e.to_string())?;

    std::fs::write(&config_path, config_data).map_err(|e| e.to_string())?;

    Ok(())
}

// 获取配置数据，支持嵌套字段访问
pub fn utils_get_config(config_type: &str, keys: Vec<String>) -> Result<Option<Value>, String> {
    let config_path = get_config_path(config_type)?;
    let data = read_config(&config_path)?;

    let mut current_value = Value::Object(data.into_iter().collect::<Map<_, _>>());

    for key in keys {
        match current_value.get(&key) {
            Some(value) => current_value = value.clone(),
            None => return Ok(None),
        }
    }

    Ok(Some(current_value))
}
