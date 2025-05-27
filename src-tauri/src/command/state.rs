use crate::utils::error::AppResult;
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
) -> AppResult<()> {
    let mut data = state.data.write();
    data.insert(key, value);
    Ok(())
}

#[permission_macro::permission("main", "setting", "my", "pluginMarket")]
#[tauri::command]
pub async fn get_global_data(
    state: State<'_, Arc<GlobalData>>,
    key: Option<String>,
) -> AppResult<Option<Value>> {
    let data = state.data.read();
    match key {
        Some(k) => Ok(data.get(&k).cloned()),
        None => Ok(Some(serde_json::to_value(&*data).unwrap_or_default())),
    }
}

#[permission_macro::permission("main", "setting", "my")]
#[tauri::command]
pub async fn delete_global_data(state: State<'_, Arc<GlobalData>>, key: String) -> AppResult<()> {
    let mut data = state.data.write();
    data.remove(&key);
    Ok(())
}
