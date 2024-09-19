use crate::utils::config::{utils_get_config, utils_set_config};
use serde_json::Value;
use std::collections::HashMap;

/// 获取配置数据
#[tauri::command]
pub fn get_config(keys: Vec<String>) -> Result<Option<Value>, String> {
    utils_get_config(keys)
}

/// 保存配置数据
#[tauri::command]
pub fn set_config(data: HashMap<String, Value>) -> Result<(), String> {
    utils_set_config(data)
}

/// 删除配置数据
#[tauri::command]
pub fn delete_config(key: String) -> Result<(), String> {
    let mut data = utils_get_config(vec![])
        .unwrap_or_default()
        .unwrap_or_default();

    match data.as_object_mut() {
        Some(map) => {
            map.remove(&key);
            utils_set_config(map.clone().into_iter().collect())?;
            Ok(())
        }
        None => Err("无法删除配置数据，数据不是对象类型".to_string()),
    }
}
