use rusqlite::{Connection, Result};
use serde_json::Value;
use std::path::PathBuf;
use std::sync::Mutex;
use std::sync::OnceLock;
use crate::utils::path::get_myhelper_path;

static DB_INSTANCE: OnceLock<Mutex<Connection>> = OnceLock::new();

pub fn init_database() -> Result<()> {
    let app_dir = get_myhelper_path().map_err(|e| rusqlite::Error::InvalidPath(PathBuf::from(e)))?;
    let db_path = app_dir.join("myhelper.db");
    ensure_parent_dir_exists(&db_path);
    
    let conn = Connection::open(&db_path)?;
    
    // 创建配置表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )",
        [],
    )?;

    // 创建插件配置表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS plugin_config (
            window_id TEXT PRIMARY KEY,
            info TEXT NOT NULL,
            config TEXT NOT NULL,
            data TEXT NOT NULL
        )",
        [],
    )?;

    DB_INSTANCE.get_or_init(|| Mutex::new(conn));
    Ok(())
}

fn ensure_parent_dir_exists(path: &PathBuf) {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).expect("无法创建数据库目录");
    }
}

fn get_connection() -> &'static Mutex<Connection> {
    DB_INSTANCE.get().expect("数据库未初始化")
}

#[tauri::command]
pub fn set_config_value(key: &str, value: Value) -> Result<(), String> {
    let conn = get_connection();
    let conn = conn.lock().unwrap();
    
    let json_value = serde_json::to_string(&value).map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT OR REPLACE INTO config (key, value) VALUES (?1, ?2)",
        [key, &json_value],
    )
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub fn get_config_value(key: &str) -> Result<Option<Value>, String> {
    let conn = get_connection();
    let conn = conn.lock().unwrap();
    
    let mut stmt = conn
        .prepare("SELECT value FROM config WHERE key = ?1")
        .map_err(|e| e.to_string())?;
    
    let mut rows = stmt.query([key]).map_err(|e| e.to_string())?;
    
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let json_str: String = row.get(0).map_err(|e| e.to_string())?;
        let value = serde_json::from_str(&json_str).map_err(|e| e.to_string())?;
        Ok(Some(value))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn delete_config_value(key: &str) -> Result<(), String> {
    let conn = get_connection();
    let conn = conn.lock().unwrap();
    
    if key.is_empty() {
        // 删除所有配置
        conn.execute("DELETE FROM config", [])
            .map_err(|e| e.to_string())?;
    } else {
        // 删除指定配置
        conn.execute("DELETE FROM config WHERE key = ?1", [key])
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
} 