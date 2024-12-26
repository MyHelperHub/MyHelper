use crate::utils::error::{AppError, AppResult};
use crate::utils::config::{utils_get_config, utils_set_config}; 
use crate::utils::logger::{Logger, LogEntry};
use serde_json::{Map, Value};
use std::collections::HashMap;

#[permission_macro::permission("main","pluginMarket")]
#[tauri::command]
pub fn get_plugin_config(keys: Vec<String>) -> AppResult<Option<Value>> {
    Logger::write_log(LogEntry {
        level: "info".to_string(),
        message: format!("获取插件配置，键: {:?}", keys),
        timestamp: String::new(),
        details: None,
    }).map_err(|e| AppError::from(e))?;

    utils_get_config("plugin", keys.clone())
        .map_err(|e| {
            let err = AppError::from(e);
            Logger::write_log(LogEntry {
                level: "error".to_string(),
                message: format!("获取插件配置失败，键: {:?}", keys),
                timestamp: String::new(),
                details: Some(format!("{}", err)),
            }).unwrap_or(());
            err
        })
}

/// 保存插件配置数据
/// 
/// # Arguments
/// 
/// * `keys` - 配置键的路径，以数组形式表示嵌套层级
/// * `value` - 要设置的配置值
/// 
/// # Returns
/// 
/// * `AppResult<()>` - 操作成功返回 Ok(()), 失败返回错误信息
#[permission_macro::permission("main","pluginMarket")]
#[tauri::command]
pub fn set_plugin_config(keys: Vec<String>, value: Value) -> AppResult<()> {
    Logger::write_log(LogEntry {
        level: "info".to_string(),
        message: format!("设置插件配置，键: {:?}", keys),
        timestamp: String::new(),
        details: Some(format!("值: {}", value)),
    }).map_err(|e| AppError::from(e))?;

    let mut config_data = utils_get_config("plugin", vec![])
        .map_err(|e| {
            let err = AppError::from(e);
            Logger::write_log(LogEntry {
                level: "error".to_string(),
                message: "获取现有插件配置失败".to_string(),
                timestamp: String::new(),
                details: Some(format!("{}", err)),
            }).unwrap_or(());
            err
        })?
        .unwrap_or_default();

    // 使用递归函数更新嵌套字段
    fn update_nested_value(data: &mut Value, keys: &[String], value: Value) -> AppResult<()> {
        if keys.is_empty() {
            return Err(AppError::from("缺少要设置的键"));
        }

        let key = keys[0].clone();

        if keys.len() == 1 {
            // 到达最后一个键，更新值
            match data {
                Value::Object(map) => {
                    map.insert(key, value);
                }
                _ => {
                    return Err(AppError::from("无法更新非对象类型的配置数据"));
                }
            }
        } else {
            // 确保父级键存在并是对象，如果不存在则创建一个新对象
            let nested_data = {
                let map = data
                    .as_object_mut()
                    .ok_or_else(|| AppError::from("配置数据不是对象类型"))?;
                map.entry(key.clone())
                    .or_insert_with(|| Value::Object(Map::new()))
            };

            if let Value::Object(_) = nested_data {
                update_nested_value(nested_data, &keys[1..], value)?;
            } else {
                return Err(AppError::from(format!(
                    "配置中键 {} 的类型不是对象",
                    key
                )));
            }
        }

        Ok(())
    }

    if let Err(e) = update_nested_value(&mut config_data, &keys, value) {
        Logger::write_log(LogEntry {
            level: "error".to_string(),
            message: format!("更新嵌套值失败，键: {:?}", keys),
            timestamp: String::new(),
            details: Some(format!("{}", e)),
        }).unwrap_or(());
        return Err(e);
    }

    // 将 Map<String, Value> 转换为 HashMap<String, Value>
    let config_hashmap: HashMap<String, Value> = config_data
        .as_object()
        .ok_or_else(|| {
            let err = AppError::from("配置数据不是对象类型");
            Logger::write_log(LogEntry {
                level: "error".to_string(),
                message: "转换配置数据到HashMap失败".to_string(),
                timestamp: String::new(),
                details: Some(format!("{}", err)),
            }).unwrap_or(());
            err
        })?
        .clone()
        .into_iter()
        .collect();

    utils_set_config("plugin", config_hashmap).map_err(|e| {
        let err = AppError::from(e);
        Logger::write_log(LogEntry {
            level: "error".to_string(),
            message: "保存插件配置失败".to_string(),
            timestamp: String::new(),
            details: Some(format!("{}", err)),
        }).unwrap_or(());
        err
    })?;

    Logger::write_log(LogEntry {
        level: "info".to_string(),
        message: format!("成功设置插件配置，键: {:?}", keys),
        timestamp: String::new(),
        details: None,
    }).map_err(|e| AppError::from(e))?;

    Ok(())
}

/// 删除插件配置数据
/// 
/// # Arguments
/// 
/// * `keys` - 要删除的配置键路径，空数组表示删除所有配置
/// 
/// # Returns
/// 
/// * `AppResult<()>` - 操作成功返回 Ok(()), 失败返回错误信息
#[permission_macro::permission("main","pluginMarket")]
#[tauri::command]
pub fn delete_plugin_config(keys: Vec<String>) -> AppResult<()> {
    Logger::write_log(LogEntry {
        level: "info".to_string(),
        message: format!("删除插件配置，键: {:?}", keys),
        timestamp: String::new(),
        details: None,
    }).map_err(|e| AppError::from(e))?;

    let mut data = utils_get_config("plugin", vec![])
        .map_err(|e| {
            let err = AppError::from(e);
            Logger::write_log(LogEntry {
                level: "error".to_string(),
                message: "获取现有插件配置失败".to_string(),
                timestamp: String::new(),
                details: Some(format!("{}", err)),
            }).unwrap_or(());
            err
        })?
        .unwrap_or_default();

    // 如果传入的 keys 为空，删除所有配置
    if keys.is_empty() {
        match data {
            Value::Object(ref mut map) => {
                map.clear();
                Logger::write_log(LogEntry {
                    level: "info".to_string(),
                    message: "清除所有插件配置".to_string(),
                    timestamp: String::new(),
                    details: None,
                }).map_err(|e| AppError::from(e))?;
            }
            _ => {
                let err = AppError::from("无法从非对象类型的配置数据中删除所有键");
                Logger::write_log(LogEntry {
                    level: "error".to_string(),
                    message: "清除所有插件配置失败".to_string(),
                    timestamp: String::new(),
                    details: Some(format!("{}", err)),
                }).unwrap_or(());
                return Err(err);
            }
        }
    } else {
        // 使用递归函数删除嵌套字段
        fn delete_nested_key(data: &mut Value, keys: &[String]) -> AppResult<()> {
            if keys.is_empty() {
                return Err(AppError::from("缺少要删除的键"));
            }

            let key = keys[0].clone();

            if keys.len() == 1 {
                // 到达最后一个键，删除值
                match data {
                    Value::Object(map) => {
                        if map.remove(&key).is_none() {
                            return Err(AppError::from(format!("配置中不存在键: {}", key)));
                        }
                    }
                    _ => {
                        return Err(AppError::from("无法从非对象类型的配置数据中删除键"));
                    }
                }
            } else {
                // 递归删除嵌套字段
                match data.get_mut(&key) {
                    Some(nested_data) => {
                        delete_nested_key(nested_data, &keys[1..])?;
                    }
                    None => {
                        return Err(AppError::from(format!("配置中不存在键: {}", key)));
                    }
                }
            }

            Ok(())
        }

        if let Err(e) = delete_nested_key(&mut data, &keys) {
            Logger::write_log(LogEntry {
                level: "error".to_string(),
                message: format!("删除嵌套键失败，键: {:?}", keys),
                timestamp: String::new(),
                details: Some(format!("{}", e)),
            }).unwrap_or(());
            return Err(e);
        }
    }

    // 将 Map<String, Value> 转换为 HashMap<String, Value>
    let config_hashmap: HashMap<String, Value> = data
        .as_object()
        .ok_or_else(|| {
            let err = AppError::from("配置数据不是对象类型");
            Logger::write_log(LogEntry {
                level: "error".to_string(),
                message: "删除后转换配置数据到HashMap失败".to_string(),
                timestamp: String::new(),
                details: Some(format!("{}", err)),
            }).unwrap_or(());
            err
        })?
        .clone()
        .into_iter()
        .collect();

    utils_set_config("plugin", config_hashmap).map_err(|e| {
        let err = AppError::from(e);
        Logger::write_log(LogEntry {
            level: "error".to_string(),
            message: "删除后保存插件配置失败".to_string(),
            timestamp: String::new(),
            details: Some(format!("{}", err)),
        }).unwrap_or(());
        err
    })?;

    Logger::write_log(LogEntry {
        level: "info".to_string(),
        message: format!("成功删除插件配置，键: {:?}", keys),
        timestamp: String::new(),
        details: None,
    }).map_err(|e| AppError::from(e))?;

    Ok(())
}