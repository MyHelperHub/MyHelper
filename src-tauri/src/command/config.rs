use serde_json::Value;
use std::collections::HashMap;
use crate::utils::config;

#[tauri::command]
pub fn get_config(keys: Vec<String>) -> Result<Option<Value>, String> {
    let keys: Vec<&str> = keys.iter().map(|s| s.as_str()).collect();
    config::get_config(&keys)
}

#[tauri::command]
pub fn set_config(data: HashMap<String, Value>) -> Result<(), String> {
    config::set_config(data)
}

#[tauri::command]
pub fn remove_config(keys: Vec<String>) -> Result<(), String> {
    let keys: Vec<&str> = keys.iter().map(|s| s.as_str()).collect();
    
    // Get the current configuration
    let mut data = match config::get_config(&keys) {
        Ok(Some(mut value)) => value.as_object_mut().ok_or("Invalid configuration format")?.clone(),
        Ok(None) => return Err("Configuration not found".into()),
        Err(e) => return Err(e),
    };

    // Navigate to the parent map
    let mut parent_map = &mut data;
    for key in &keys[..keys.len() - 1] {
        match parent_map.get_mut(*key) {
            Some(Value::Object(map)) => parent_map = map,
            _ => return Err("Invalid path for removal".into()),
        }
    }

    // Remove the last key
    let last_key = keys.last().ok_or("No keys provided")?;
    parent_map.remove(*last_key);

    // Save the modified configuration
    let config_data = serde_json::to_value(data).map_err(|e| e.to_string())?;
    let mut data_map = HashMap::new();
    data_map.insert("root".to_string(), config_data);
    config::set_config(data_map)
}
