use crate::services::database::get_db_pool;
use crate::utils::error::AppError;
use crate::utils::response::{ApiResponse, ApiStatusCode};
use serde_json::Value;

#[permission_macro::permission("main", "setting","my")]
#[tauri::command]
pub fn set_pet_config(config_type: &str, config_data: Value) -> Result<ApiResponse<()>, AppError> {
    let pool = get_db_pool();

    let json_value = match serde_json::to_string(&config_data) {
        Ok(v) => v,
        Err(e) => {
            return Ok(ApiResponse::error(
                ApiStatusCode::ErrDatabase,
                format!("序列化宠物配置失败: {}", e),
            ))
        }
    };

    let conn = pool.get().map_err(|e| AppError::Error(format!("获取数据库连接失败: {}", e)))?;
    match conn.execute(
        "INSERT OR REPLACE INTO pet_config (config_type, config_data, updated_at) VALUES (?1, ?2, CURRENT_TIMESTAMP)",
        [config_type, &json_value],
    ) {
        Ok(_) => Ok(ApiResponse::success(())),
        Err(e) => Ok(ApiResponse::error(
            ApiStatusCode::ErrDatabase,
            format!("保存宠物配置失败: {}", e),
        )),
    }
}

#[permission_macro::permission("main", "setting","my")]
#[tauri::command]
pub fn get_pet_config(config_type: &str) -> Result<ApiResponse<Option<Value>>, AppError> {
    let pool = get_db_pool();
    let conn = pool.get().map_err(|e| AppError::Error(format!("获取数据库连接失败: {}", e)))?;

    let mut stmt = match conn.prepare("SELECT config_data FROM pet_config WHERE config_type = ?1") {
        Ok(s) => s,
        Err(e) => {
            return Ok(ApiResponse::error(
                ApiStatusCode::ErrDatabase,
                format!("准备查询语句失败: {}", e),
            ))
        }
    };

    let mut rows = match stmt.query([config_type]) {
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
                    format!("获取宠物配置失败: {}", e),
                ))
            }
        };

        // 直接使用serde_json解析，对于小数据不需要simd优化
        match serde_json::from_str::<Value>(&json_str) {
            Ok(v) => Ok(ApiResponse::success(Some(v))),
            Err(e) => Ok(ApiResponse::error(
                ApiStatusCode::ErrDatabase,
                format!("解析宠物配置失败: {}", e),
            ))
        }
    } else {
        Ok(ApiResponse::success(None))
    }
}

#[permission_macro::permission("main", "setting","my")]
#[tauri::command]
pub fn delete_pet_config(config_type: &str) -> Result<ApiResponse<()>, AppError> {
    let pool = get_db_pool();
    let conn = pool.get().map_err(|e| AppError::Error(format!("获取数据库连接失败: {}", e)))?;

    match conn.execute("DELETE FROM pet_config WHERE config_type = ?1", [config_type]) {
        Ok(_) => Ok(ApiResponse::success(())),
        Err(e) => Ok(ApiResponse::error(
            ApiStatusCode::ErrDatabase,
            format!("删除宠物配置失败: {}", e),
        )),
    }
}