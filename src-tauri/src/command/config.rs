use crate::utils::error::{AppError, AppResult};
use crate::utils::config::{utils_get_config, utils_set_config};
use serde_json::{Map, Value};
use std::collections::HashMap;

/// 获取配置数据
/// 
/// # Arguments
/// 
/// * `keys` - 配置键的路径，以数组形式表示嵌套层级
/// 
/// # Returns
/// 
/// * `AppResult<Option<Value>>` - 成功返回配置值，失败返回错误信息
#[tauri::command]
pub fn get_config(keys: Vec<String>) -> AppResult<Option<Value>> {
    utils_get_config(keys).map_err(|e| AppError::ConfigError(e))
}

/// 保存配置数据
/// 
/// # Arguments
/// 
/// * `keys` - 配置键的路径，以数组形式表示嵌套层级
/// * `value` - 要设置的配置值
/// 
/// # Returns
/// 
/// * `AppResult<()>` - 操作成功返回 Ok(()), 失败返回错误信息
#[tauri::command]
pub fn set_config(keys: Vec<String>, value: Value) -> AppResult<()> {
    let mut config_data = utils_get_config(vec![])
        .map_err(|e| AppError::ConfigError(e))?
        .unwrap_or_default();

    // 使用递归函数更新嵌套字段
    fn update_nested_value(data: &mut Value, keys: &[String], value: Value) -> AppResult<()> {
        if keys.is_empty() {
            return Err(AppError::ConfigError("缺少要设置的键".to_string()));
        }

        let key = keys[0].clone();

        if keys.len() == 1 {
            // 到达最后一个键，更新值
            match data {
                Value::Object(map) => {
                    map.insert(key, value);
                }
                _ => {
                    return Err(AppError::ConfigError(
                        "无法更新非对象类型的配置数据".to_string(),
                    ));
                }
            }
        } else {
            // 确保父级键存在并是对象，如果不存在则创建一个新对象
            let nested_data = {
                let map = data
                    .as_object_mut()
                    .ok_or_else(|| AppError::ConfigError("配置数据不是对象类型".to_string()))?;
                map.entry(key.clone())
                    .or_insert_with(|| Value::Object(Map::new()))
            };

            if let Value::Object(_) = nested_data {
                update_nested_value(nested_data, &keys[1..], value)?;
            } else {
                return Err(AppError::ConfigError(format!(
                    "配置中键 {} 的类型不是对象",
                    key
                )));
            }
        }

        Ok(())
    }

    update_nested_value(&mut config_data, &keys, value)?;

    // 将 Map<String, Value> 转换为 HashMap<String, Value>
    let config_hashmap: HashMap<String, Value> = config_data
        .as_object()
        .ok_or_else(|| AppError::ConfigError("配置数据不是对象类型".to_string()))?
        .clone()
        .into_iter()
        .collect();

    utils_set_config(config_hashmap).map_err(|e| AppError::ConfigError(e))
}

/// 删除配置数据
/// 
/// # Arguments
/// 
/// * `keys` - 要删除的配置键路径，空数组表示删除所有配置
/// 
/// # Returns
/// 
/// * `AppResult<()>` - 操作成功返回 Ok(()), 失败返回错误信息
#[tauri::command]
pub fn delete_config(keys: Vec<String>) -> AppResult<()> {
    let mut data = utils_get_config(vec![])
        .map_err(|e| AppError::ConfigError(e))?
        .unwrap_or_default();

    // 如果传入的 keys 为空，删除所有配置
    if keys.is_empty() {
        match data {
            Value::Object(ref mut map) => {
                map.clear();
            }
            _ => {
                return Err(AppError::ConfigError(
                    "无法从非对象类型的配置数据中删除所有键".to_string(),
                ));
            }
        }
    } else {
        // 使用递归函数删除嵌套字段
        fn delete_nested_key(data: &mut Value, keys: &[String]) -> AppResult<()> {
            if keys.is_empty() {
                return Err(AppError::ConfigError("缺少要删除的键".to_string()));
            }

            let key = keys[0].clone();

            if keys.len() == 1 {
                // 到达最后一个键，删除值
                match data {
                    Value::Object(map) => {
                        map.remove(&key);
                    }
                    _ => {
                        return Err(AppError::ConfigError(
                            "无法从非对象类型的配置数据中删除键".to_string(),
                        ));
                    }
                }
            } else {
                // 递归删除嵌套字段
                match data.get_mut(&key) {
                    Some(nested_data) => {
                        delete_nested_key(nested_data, &keys[1..])?;
                    }
                    None => {
                        return Err(AppError::ConfigError(format!("配置中不存在键: {}", key)));
                    }
                }
            }

            Ok(())
        }

        delete_nested_key(&mut data, &keys)?;
    }

    // 将 Map<String, Value> 转换为 HashMap<String, Value>
    let config_hashmap: HashMap<String, Value> = data
        .as_object()
        .ok_or_else(|| AppError::ConfigError("配置数据不是对象类型".to_string()))?
        .clone()
        .into_iter()
        .collect();

    utils_set_config(config_hashmap).map_err(|e| AppError::ConfigError(e))
}
