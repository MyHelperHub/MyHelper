use crate::utils::database::get_connection;
use crate::utils::error::{AppError, AppResult};
use serde_json::{json, Value};

#[permission_macro::permission("main", "setting", "my")]
#[tauri::command]
pub fn set_config_value(key: &str, value: Value) -> AppResult<()> {
    let conn = get_connection();
    let conn = conn.lock().unwrap();

    let json_value = serde_json::to_string(&value)
        .map_err(|e| AppError::Error(format!("序列化配置值失败: {}", e)))?;

    conn.execute(
        "INSERT OR REPLACE INTO config (key, value) VALUES (?1, ?2)",
        [key, &json_value],
    )
    .map_err(|e| AppError::Error(format!("保存配置值失败: {}", e)))?;

    Ok(())
}

#[permission_macro::permission("main", "setting", "my", "pluginMarket")]
#[tauri::command]
pub fn get_config_value(key: &str) -> AppResult<Option<Value>> {
    let conn = get_connection();
    let conn = conn.lock().unwrap();

    let mut stmt = conn
        .prepare("SELECT value FROM config WHERE key = ?1")
        .map_err(|e| AppError::Error(format!("准备查询语句失败: {}", e)))?;

    let mut rows = stmt
        .query([key])
        .map_err(|e| AppError::Error(format!("执行查询失败: {}", e)))?;

    if let Some(row) = rows
        .next()
        .map_err(|e| AppError::Error(format!("获取查询结果失败: {}", e)))?
    {
        let json_str: String = row
            .get(0)
            .map_err(|e| AppError::Error(format!("获取配置值失败: {}", e)))?;
        let value = serde_json::from_str(&json_str)
            .map_err(|e| AppError::Error(format!("解析配置值失败: {}", e)))?;
        Ok(Some(value))
    } else {
        Ok(None)
    }
}

#[permission_macro::permission("main", "setting", "my")]
#[tauri::command]
pub fn delete_config_value(key: &str) -> AppResult<()> {
    let conn = get_connection();
    let conn = conn.lock().unwrap();

    if key.is_empty() {
        conn.execute("DELETE FROM config", [])
            .map_err(|e| AppError::Error(format!("删除所有配置失败: {}", e)))?;
    } else {
        conn.execute("DELETE FROM config WHERE key = ?1", [key])
            .map_err(|e| AppError::Error(format!("删除配置值失败: {}", e)))?;
    }

    Ok(())
}

#[permission_macro::permission("main", "pluginMarket")]
#[tauri::command]
pub fn set_plugin_config_value(
    window_id: &str,
    info: Value,
    config: Value,
    data: Value,
) -> AppResult<()> {
    let conn = get_connection();
    let conn = conn.lock().unwrap();

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

    Ok(())
}

#[permission_macro::permission("main", "pluginMarket")]
#[tauri::command]
pub fn get_plugin_config_value(window_id: Option<&str>) -> AppResult<Vec<Value>> {
    let conn = get_connection();
    let conn = conn.lock().unwrap();

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

        let info_value: Value = serde_json::from_str(&info)
            .map_err(|e| AppError::Error(format!("解析info失败: {}", e)))?;
        let config_value: Value = serde_json::from_str(&config)
            .map_err(|e| AppError::Error(format!("解析config失败: {}", e)))?;
        let data_value: Value = serde_json::from_str(&data)
            .map_err(|e| AppError::Error(format!("解析data失败: {}", e)))?;

        result.push(json!({
            "windowId": window_id,
            "info": info_value,
            "config": config_value,
            "data": data_value
        }));
    }

    Ok(result)
}

#[permission_macro::permission("main", "pluginMarket")]
#[tauri::command]
pub fn delete_plugin_config_value(window_id: Option<&str>) -> AppResult<()> {
    let conn = get_connection();
    let conn = conn.lock().unwrap();

    if let Some(id) = window_id {
        conn.execute("DELETE FROM plugin_config WHERE window_id = ?1", [id])
            .map_err(|e| AppError::Error(format!("删除插件配置失败: {}", e)))?;
    } else {
        conn.execute("DELETE FROM plugin_config", [])
            .map_err(|e| AppError::Error(format!("删除所有插件配置失败: {}", e)))?;
    }

    Ok(())
}
