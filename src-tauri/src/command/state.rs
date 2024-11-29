use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::State;
use crate::utils::error::AppResult;

#[derive(Default)]
#[allow(dead_code)]
pub struct GlobalData {
    data: Mutex<HashMap<String, String>>,
}

#[permission_macro::permission("main","setting","my")]
#[tauri::command]
pub async fn set_global_data(
    state: State<'_, Arc<GlobalData>>,
    key: String,
    value: String,
) -> AppResult<()> {
    let mut data = state.data.lock().await;
    data.insert(key, value);
    Ok(())
}

#[permission_macro::permission("main","setting","my")]
#[tauri::command]
pub async fn get_global_data(
    state: State<'_, Arc<GlobalData>>,
    key: Option<String>,
) -> AppResult<Option<String>> {
    let data = state.data.lock().await;
    match key {
        Some(k) => Ok(data.get(&k).cloned()),
        None => Ok(Some(serde_json::to_string(&*data).unwrap_or_default())),
    }
}

#[permission_macro::permission("main","setting","my")]
#[tauri::command]
pub async fn delete_global_data(
    state: State<'_, Arc<GlobalData>>,
    key: String,
) -> AppResult<()> {
    let mut data = state.data.lock().await;
    data.remove(&key);
    Ok(())
}
