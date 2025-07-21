use crate::utils::error::AppError;
use crate::utils::response::ApiResponse;
use parking_lot::RwLock;
use serde_json::Value;
use std::collections::HashMap;
use std::sync::Arc;
use tauri::State;

#[derive(Default)]
pub struct GlobalData {
    data: RwLock<HashMap<String, Value>>,
}

#[permission_macro::permission("main", "setting", "my", "pluginMarket")]
#[tauri::command]
pub async fn set_global_data(
    state: State<'_, Arc<GlobalData>>,
    key: String,
    value: Value,
) -> Result<ApiResponse<()>, AppError> {
    let mut data = state.data.write();
    data.insert(key, value);
    Ok(ApiResponse::success(()))
}

#[permission_macro::permission("main", "setting", "my", "pluginMarket")]
#[tauri::command]
pub async fn get_global_data(
    state: State<'_, Arc<GlobalData>>,
    key: Option<String>,
) -> Result<ApiResponse<Option<Value>>, AppError> {
    let data = state.data.read();
    match key {
        Some(k) => Ok(ApiResponse::success(data.get(&k).cloned())),
        None => Ok(ApiResponse::success(Some(serde_json::to_value(&*data).unwrap_or_default()))),
    }
}

#[permission_macro::permission("main", "setting", "my")]
#[tauri::command]
pub async fn delete_global_data(
    state: State<'_, Arc<GlobalData>>, 
    key: String
) -> Result<ApiResponse<()>, AppError> {
    let mut data = state.data.write();
    data.remove(&key);
    Ok(ApiResponse::success(()))
}
