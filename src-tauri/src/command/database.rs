use crate::services::database::get_db_pool;
use crate::utils::error::AppError;
use crate::utils::response::{ApiResponse, ApiStatusCode};
use serde_json::{json, Value};
use simd_json;

#[permission_macro::permission("main", "setting", "my", "label")]
#[tauri::command]
pub fn set_config_value(key: &str, value: Value) -> Result<ApiResponse<()>, AppError> {
    let pool = get_db_pool();

    let json_value = match serde_json::to_string(&value) {
        Ok(v) => v,
        Err(e) => {
            return Ok(ApiResponse::error(
                ApiStatusCode::ErrDatabase,
                format!("序列化配置值失败: {}", e),
            ))
        }
    };

    let conn = pool.get().map_err(|e| AppError::Error(format!("获取数据库连接失败: {}", e)))?;
    match conn.execute(
        "INSERT OR REPLACE INTO config (key, value) VALUES (?1, ?2)",
        [key, &json_value],
    ) {
        Ok(_) => Ok(ApiResponse::success(())),
        Err(e) => Ok(ApiResponse::error(
            ApiStatusCode::ErrDatabase,
            format!("保存配置值失败: {}", e),
        )),
    }
}

#[permission_macro::permission("main", "setting", "my", "pluginMarket", "label")]
#[tauri::command]
pub fn get_config_value(key: &str) -> Result<ApiResponse<Option<Value>>, AppError> {
    let pool = get_db_pool();
    let conn = pool.get().map_err(|e| AppError::Error(format!("获取数据库连接失败: {}", e)))?;

    let mut stmt = match conn.prepare("SELECT value FROM config WHERE key = ?1") {
        Ok(s) => s,
        Err(e) => {
            return Ok(ApiResponse::error(
                ApiStatusCode::ErrDatabase,
                format!("准备查询语句失败: {}", e),
            ))
        }
    };

    let mut rows = match stmt.query([key]) {
        Ok(r) => r,
        Err(e) => {
            return Ok(ApiResponse::error(
                ApiStatusCode::ErrDatabase,
                format!("执行查询失败: {}", e),
            ))
        }
    };

    if let Some(row) = match rows.next() {
        Ok(r) => r,
        Err(e) => {
            return Ok(ApiResponse::error(
                ApiStatusCode::ErrDatabase,
                format!("获取查询结果失败: {}", e),
            ))
        }
    } {
        let json_str: String = match row.get(0) {
            Ok(s) => s,
            Err(e) => {
                return Ok(ApiResponse::error(
                    ApiStatusCode::ErrDatabase,
                    format!("获取配置值失败: {}", e),
                ))
            }
        };

        // 使用simd-json加速解析
        let mut json_bytes = json_str.into_bytes();
        let value = match simd_json::serde::from_slice::<Value>(&mut json_bytes) {
            Ok(v) => v,
            Err(_) => {
                // 回退到标准serde_json
                match serde_json::from_slice(&json_bytes) {
                    Ok(v) => v,
                    Err(e) => {
                        return Ok(ApiResponse::error(
                            ApiStatusCode::ErrDatabase,
                            format!("解析配置值失败: {}", e),
                        ))
                    }
                }
            }
        };

        Ok(ApiResponse::success(Some(value)))
    } else {
        Ok(ApiResponse::success(None))
    }
}

#[permission_macro::permission("main", "setting", "my", "pluginMarket", "label")]
#[tauri::command]
pub fn get_config_values_batch(keys: Vec<&str>) -> Result<ApiResponse<std::collections::HashMap<String, Option<Value>>>, AppError> {
    let pool = get_db_pool();
    let conn = pool.get().map_err(|e| AppError::Error(format!("获取数据库连接失败: {}", e)))?;

    let mut result = std::collections::HashMap::new();
    
    // 构建批量查询的SQL，使用IN查询提高效率
    if keys.is_empty() {
        return Ok(ApiResponse::success(result));
    }

    let placeholders = (0..keys.len()).map(|_| "?").collect::<Vec<_>>().join(",");
    let sql = format!("SELECT key, value FROM config WHERE key IN ({})", placeholders);
    
    let mut stmt = match conn.prepare(&sql) {
        Ok(s) => s,
        Err(e) => {
            return Ok(ApiResponse::error(
                ApiStatusCode::ErrDatabase,
                format!("准备批量查询语句失败: {}", e),
            ))
        }
    };

    // 将keys转换为动态参数
    let params: Vec<&dyn rusqlite::ToSql> = keys.iter().map(|k| k as &dyn rusqlite::ToSql).collect();
    
    let mut rows = match stmt.query(&*params) {
        Ok(r) => r,
        Err(e) => {
            return Ok(ApiResponse::error(
                ApiStatusCode::ErrDatabase,
                format!("执行批量查询失败: {}", e),
            ))
        }
    };

    // 收集查询结果
    let mut found_keys = std::collections::HashSet::new();
    while let Some(row) = match rows.next() {
        Ok(r) => r,
        Err(e) => {
            return Ok(ApiResponse::error(
                ApiStatusCode::ErrDatabase,
                format!("获取批量查询结果失败: {}", e),
            ))
        }
    } {
        let key: String = match row.get(0) {
            Ok(k) => k,
            Err(e) => {
                return Ok(ApiResponse::error(
                    ApiStatusCode::ErrDatabase,
                    format!("获取配置键失败: {}", e),
                ))
            }
        };
        
        let json_str: String = match row.get(1) {
            Ok(s) => s,
            Err(e) => {
                return Ok(ApiResponse::error(
                    ApiStatusCode::ErrDatabase,
                    format!("获取配置值失败: {}", e),
                ))
            }
        };

        // 使用simd-json加速解析
        let mut json_bytes = json_str.into_bytes();
        let value = match simd_json::serde::from_slice::<Value>(&mut json_bytes) {
            Ok(v) => v,
            Err(_) => {
                // 回退到标准serde_json
                match serde_json::from_slice(&json_bytes) {
                    Ok(v) => v,
                    Err(e) => {
                        return Ok(ApiResponse::error(
                            ApiStatusCode::ErrDatabase,
                            format!("解析配置值失败: {}", e),
                        ))
                    }
                }
            }
        };

        found_keys.insert(key.clone());
        result.insert(key, Some(value));
    }

    // 为未找到的键添加None值
    for key in keys {
        if !found_keys.contains(key) {
            result.insert(key.to_string(), None);
        }
    }

    Ok(ApiResponse::success(result))
}

#[permission_macro::permission("main", "setting", "my", "label")]
#[tauri::command]
pub fn delete_config_value(key: &str) -> Result<ApiResponse<()>, AppError> {
    let pool = get_db_pool();
    let conn = pool.get().map_err(|e| AppError::Error(format!("获取数据库连接失败: {}", e)))?;

    if key.is_empty() {
        match conn.execute("DELETE FROM config", []) {
            Ok(_) => Ok(ApiResponse::success(())),
            Err(e) => Ok(ApiResponse::error(
                ApiStatusCode::ErrDatabase,
                format!("删除所有配置失败: {}", e),
            )),
        }
    } else {
        match conn.execute("DELETE FROM config WHERE key = ?1", [key]) {
            Ok(_) => Ok(ApiResponse::success(())),
            Err(e) => Ok(ApiResponse::error(
                ApiStatusCode::ErrDatabase,
                format!("删除配置值失败: {}", e),
            )),
        }
    }
}

#[permission_macro::permission("main", "pluginMarket")]
#[tauri::command]
pub fn set_plugin_config_value(
    window_id: &str,
    info: Value,
    config: Value,
    data: Value,
) -> Result<ApiResponse<()>, AppError> {
    let pool = get_db_pool();
    let conn = pool.get().map_err(|e| AppError::Error(format!("获取数据库连接失败: {}", e)))?;

    let info_str = serde_json::to_string(&info)
        .map_err(|e| AppError::Error(format!("序列化info失败: {}", e)))?;
    let config_str = serde_json::to_string(&config)
        .map_err(|e| AppError::Error(format!("序列化config失败: {}", e)))?;
    let data_str = serde_json::to_string(&data)
        .map_err(|e| AppError::Error(format!("序列化data失败: {}", e)))?;

    conn.execute(
        "INSERT OR REPLACE INTO plugin_config (window_id, info, config, data) VALUES (?1, ?2, ?3, ?4)",
        [window_id, &info_str, &config_str, &data_str],
    )
    .map_err(|e| AppError::Error(format!("保存插件配置失败: {}", e)))?;

    Ok(ApiResponse::success(()))
}

#[permission_macro::permission("main", "pluginMarket")]
#[tauri::command]
pub fn get_plugin_config_value(
    window_id: Option<&str>,
) -> Result<ApiResponse<Vec<Value>>, AppError> {
    let pool = get_db_pool();
    let conn = pool.get().map_err(|e| AppError::Error(format!("获取数据库连接失败: {}", e)))?;

    let mut stmt = if let Some(_id) = window_id {
        conn.prepare("SELECT window_id, info, config, data FROM plugin_config WHERE window_id = ?1")
            .map_err(|e| AppError::Error(format!("准备查询语句失败: {}", e)))?
    } else {
        conn.prepare("SELECT window_id, info, config, data FROM plugin_config")
            .map_err(|e| AppError::Error(format!("准备查询语句失败: {}", e)))?
    };

    let mut rows = if let Some(_id) = window_id {
        stmt.query([_id])
            .map_err(|e| AppError::Error(format!("执行查询失败: {}", e)))?
    } else {
        stmt.query([])
            .map_err(|e| AppError::Error(format!("执行查询失败: {}", e)))?
    };

    let mut result = Vec::new();
    while let Some(row) = rows
        .next()
        .map_err(|e| AppError::Error(format!("获取查询结果失败: {}", e)))?
    {
        let window_id: String = row
            .get(0)
            .map_err(|e| AppError::Error(format!("获取window_id失败: {}", e)))?;
        let info: String = row
            .get(1)
            .map_err(|e| AppError::Error(format!("获取info失败: {}", e)))?;
        let config: String = row
            .get(2)
            .map_err(|e| AppError::Error(format!("获取config失败: {}", e)))?;
        let data: String = row
            .get(3)
            .map_err(|e| AppError::Error(format!("获取data失败: {}", e)))?;

        // 使用simd-json加速解析
        let mut info_bytes = info.into_bytes();
        let info_value: Value = match simd_json::serde::from_slice(&mut info_bytes) {
            Ok(v) => v,
            Err(_) => serde_json::from_slice(&info_bytes)
                .map_err(|e| AppError::Error(format!("解析info失败: {}", e)))?,
        };

        let mut config_bytes = config.into_bytes();
        let config_value: Value = match simd_json::serde::from_slice(&mut config_bytes) {
            Ok(v) => v,
            Err(_) => serde_json::from_slice(&config_bytes)
                .map_err(|e| AppError::Error(format!("解析config失败: {}", e)))?,
        };

        let mut data_bytes = data.into_bytes();
        let data_value: Value = match simd_json::serde::from_slice(&mut data_bytes) {
            Ok(v) => v,
            Err(_) => serde_json::from_slice(&data_bytes)
                .map_err(|e| AppError::Error(format!("解析data失败: {}", e)))?,
        };

        result.push(json!({
            "windowId": window_id,
            "info": info_value,
            "config": config_value,
            "data": data_value
        }));
    }

    Ok(ApiResponse::success(result))
}

#[permission_macro::permission("main", "pluginMarket")]
#[tauri::command]
pub fn delete_plugin_config_value(window_id: Option<&str>) -> Result<ApiResponse<()>, AppError> {
    let pool = get_db_pool();
    let conn = pool.get().map_err(|e| AppError::Error(format!("获取数据库连接失败: {}", e)))?;

    if let Some(id) = window_id {
        conn.execute("DELETE FROM plugin_config WHERE window_id = ?1", [id])
            .map_err(|e| AppError::Error(format!("删除插件配置失败: {}", e)))?;
    } else {
        conn.execute("DELETE FROM plugin_config", [])
            .map_err(|e| AppError::Error(format!("删除所有插件配置失败: {}", e)))?;
    }

    Ok(ApiResponse::success(()))
}
