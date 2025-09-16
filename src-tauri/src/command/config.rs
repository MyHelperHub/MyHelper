use crate::services::config::{utils_get_config, utils_set_config};
use crate::utils::error::AppError;
use crate::utils::response::{ApiResponse, ApiStatusCode};
use serde_json::{Map, Value};
use std::collections::HashMap;

/// 获取配置数据
#[permission_macro::permission("main", "setting", "my", "label")]
#[tauri::command]
pub fn get_config(keys: Vec<String>) -> Result<ApiResponse<Option<Value>>, AppError> {
    match utils_get_config("config", keys) {
        Ok(value) => Ok(ApiResponse::success(value)),
        Err(e) => Ok(ApiResponse::error(ApiStatusCode::ErrConfig, e)),
    }
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
/// * `ApiResponse<()>` - 操作成功返回成功响应，失败返回错误响应

#[permission_macro::permission("main", "setting", "my", "label")]
#[tauri::command]
pub fn set_config(keys: Vec<String>, value: Value) -> Result<ApiResponse<()>, AppError> {
    let mut config_data = match utils_get_config("config", vec![]) {
        Ok(value) => value.unwrap_or_default(),
        Err(e) => return Ok(ApiResponse::error(ApiStatusCode::ErrConfig, e)),
    };

    // 使用递归函数更新嵌套字段
    fn update_nested_value(data: &mut Value, keys: &[String], value: Value) -> Result<(), String> {
        if keys.is_empty() {
            return Err("缺少要设置的键".to_string());
        }

        if keys.len() == 1 {
            // 到达最后一个键，更新值
            match data {
                Value::Object(map) => {
                    map.insert(keys[0].to_string(), value);
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
                    .ok_or_else(|| "配置数据不是对象类型".to_string())?;
                map.entry(keys[0].to_string())
                    .or_insert_with(|| Value::Object(Map::new()))
            };

            if let Value::Object(_) = nested_data {
                update_nested_value(nested_data, &keys[1..], value)?;
            } else {
                return Err(format!("配置中键 {} 的类型不是对象", &keys[0]));
            }
        }

        Ok(())
    }

    if let Err(e) = update_nested_value(&mut config_data, &keys, value) {
        return Ok(ApiResponse::error(ApiStatusCode::ErrConfig, e));
    }

    // 将 Map<String, Value> 转换为 HashMap<String, Value>
    let config_hashmap: HashMap<String, Value> = match config_data.as_object() {
        Some(obj) => obj.clone().into_iter().collect(),
        None => return Ok(ApiResponse::error(ApiStatusCode::ErrConfig, "配置数据不是对象类型")),
    };

    match utils_set_config("config", config_hashmap) {
        Ok(_) => Ok(ApiResponse::success(())),
        Err(e) => Ok(ApiResponse::error(ApiStatusCode::ErrConfig, e)),
    }
}

/// 删除配置数据
///
/// # Arguments
///
/// * `keys` - 要删除的配置键路径，空数组表示删除所有配置
///
/// # Returns
///
/// * `ApiResponse<()>` - 操作成功返回成功响应，失败返回错误响应

#[permission_macro::permission("main", "setting", "my", "label")]
#[tauri::command]
pub fn delete_config(keys: Vec<String>) -> Result<ApiResponse<()>, AppError> {
    let mut data = match utils_get_config("config", vec![]) {
        Ok(value) => value.unwrap_or_default(),
        Err(e) => return Ok(ApiResponse::error(ApiStatusCode::ErrConfig, e)),
    };

    // 如果传入的 keys 为空，删除所有配置
    if keys.is_empty() {
        match data {
            Value::Object(ref mut map) => {
                map.clear();
            }
            _ => {
                return Ok(ApiResponse::error(
                    ApiStatusCode::ErrConfig,
                    "无法从非对象类型的配置数据中删除所有键",
                ));
            }
        }
    } else {
        // 使用递归函数删除嵌套字段
        fn delete_nested_key(data: &mut Value, keys: &[String]) -> Result<(), String> {
            if keys.is_empty() {
                return Err("缺少要删除的键".to_string());
            }

            if keys.len() == 1 {
                match data {
                    Value::Object(map) => {
                        map.remove(&keys[0]);
                    }
                    _ => {
                        return Err("无法从非对象类型的配置数据中删除键".to_string());
                    }
                }
            } else {
                // 递归删除嵌套字段
                match data.get_mut(&keys[0]) {
                    Some(nested_data) => {
                        delete_nested_key(nested_data, &keys[1..])?;
                    }
                    None => {
                        return Err(format!("配置中不存在键: {}", &keys[0]));
                    }
                }
            }

            Ok(())
        }

        if let Err(e) = delete_nested_key(&mut data, &keys) {
            return Ok(ApiResponse::error(ApiStatusCode::ErrConfig, e));
        }
    }

    // 将 Map<String, Value> 转换为 HashMap<String, Value>
    let config_hashmap: HashMap<String, Value> = match data.as_object() {
        Some(obj) => obj.clone().into_iter().collect(),
        None => return Ok(ApiResponse::error(ApiStatusCode::ErrConfig, "配置数据不是对象类型")),
    };

    match utils_set_config("config", config_hashmap) {
        Ok(_) => Ok(ApiResponse::success(())),
        Err(e) => Ok(ApiResponse::error(ApiStatusCode::ErrConfig, e)),
    }
}
