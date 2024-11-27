use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::State;

#[derive(Default)]
#[allow(dead_code)]
pub struct GlobalData {
    data: Mutex<HashMap<String, String>>,
}

#[tauri::command]
pub async fn set_global_data(
    state: State<'_, Arc<GlobalData>>,
    key: String,
    value: String,
) -> Result<(), ()> {
    let mut data = state.data.lock().await;
    data.insert(key, value);
    Ok(())
}

#[tauri::command]
pub async fn get_global_data(
    state: State<'_, Arc<GlobalData>>,
    key: Option<String>,
) -> Result<Option<String>, ()> {
    let data = state.data.lock().await;
    match key {
        Some(k) => Ok(data.get(&k).cloned()),
        None => Ok(Some(serde_json::to_string(&*data).unwrap_or_default())),
    }
}

#[tauri::command]
pub async fn delete_global_data(
    state: State<'_, Arc<GlobalData>>,
    key: String,
) -> Result<(), ()> {
    let mut data = state.data.lock().await;
    data.remove(&key);
    Ok(())
}
