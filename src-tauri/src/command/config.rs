use crate::utils::config::{utils_get_config, utils_set_config};
use serde_json::{Map, Value};
use std::collections::HashMap;

/// 获取配置数据
#[tauri::command]
pub fn get_config(keys: Vec<String>) -> Result<Option<Value>, String> {
    utils_get_config(keys)
}

/// 保存配置数据，支持嵌套字段更新
#[tauri::command]
pub fn set_config(keys: Vec<String>, value: Value) -> Result<(), String> {
    let mut config_data = utils_get_config(vec![])
        .unwrap_or_default()
        .unwrap_or_default();

    // 使用递归函数更新嵌套字段
    fn update_nested_value(data: &mut Value, keys: &[String], value: Value) -> Result<(), String> {
        if keys.is_empty() {
            return Err("缺少要设置的键".to_string());
        }

        let key = keys[0].clone();

        if keys.len() == 1 {
            // 到达最后一个键，更新值
            match data {
                Value::Object(map) => {
                    map.insert(key, value);
                }
                _ => {
                    return Err("无法更新非对象类型的配置数据".to_string());
                }
            }
        } else {
            // 确保父级键存在并是对象，如果不存在则创建一个新对象
            let nested_data = {
                let map = data
                    .as_object_mut()
                    .ok_or("配置数据不是对象类型".to_string())?;
                map.entry(key.clone())
                    .or_insert_with(|| Value::Object(Map::new()))
            };

            if let Value::Object(_) = nested_data {
                update_nested_value(nested_data, &keys[1..], value)?;
            } else {
                return Err(format!("配置中键 {} 的类型不是对象", key));
            }
        }

        Ok(())
    }

    update_nested_value(&mut config_data, &keys, value)?;

    // 将 Map<String, Value> 转换为 HashMap<String, Value>
    let config_hashmap: HashMap<String, Value> = config_data
        .as_object()
        .ok_or("配置数据不是对象类型".to_string())?
        .clone()
        .into_iter()
        .collect();

    utils_set_config(config_hashmap)
}

/// 删除配置数据
#[tauri::command]
pub fn delete_config(keys: Vec<String>) -> Result<(), String> {
    let mut data = utils_get_config(vec![])
        .unwrap_or_default()
        .unwrap_or_default();

    // 使用递归函数删除嵌套字段
    fn delete_nested_key(data: &mut Value, keys: &[String]) -> Result<(), String> {
        if keys.is_empty() {
            return Err("缺少要删除的键".to_string());
        }

        let key = keys[0].clone();

        if keys.len() == 1 {
            // 到达最后一个键，删除值
            match data {
                Value::Object(map) => {
                    map.remove(&key);
                }
                _ => {
                    return Err("无法从非对象类型的配置数据中删除键".to_string());
                }
            }
        } else {
            // 递归删除嵌套字段
            match data.get_mut(&key) {
                Some(nested_data) => {
                    delete_nested_key(nested_data, &keys[1..])?;
                }
                None => {
                    return Err(format!("配置中不存在键: {}", key));
                }
            }
        }

        Ok(())
    }

    delete_nested_key(&mut data, &keys)?;

    // 将 Map<String, Value> 转换为 HashMap<String, Value>
    let config_hashmap: HashMap<String, Value> = data
        .as_object()
        .ok_or("配置数据不是对象类型".to_string())?
        .clone()
        .into_iter()
        .collect();

    utils_set_config(config_hashmap)
}
