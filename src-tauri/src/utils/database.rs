use crate::utils::error::{AppError, AppResult};
use crate::utils::path::get_myhelper_path;
use rusqlite::{params, Connection, Result};
use std::collections::HashSet;
use std::path::PathBuf;
use parking_lot::Mutex;
use once_cell::sync::OnceCell;

static DB_INSTANCE: OnceCell<Mutex<Connection>> = OnceCell::new();

pub fn init_database() -> Result<()> {
    let app_dir =
        get_myhelper_path().map_err(|e| rusqlite::Error::InvalidPath(PathBuf::from(e)))?;
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

pub fn get_connection() -> &'static Mutex<Connection> {
    DB_INSTANCE.get().expect("数据库未初始化")
}

/// 从数据库中查询所有插件的 window_id
pub fn query_plugin_ids() -> AppResult<HashSet<String>> {
    let conn = get_connection().lock();
    let mut stmt = conn
        .prepare_cached("SELECT window_id FROM plugin_config")
        .map_err(|e| AppError::Error(format!("准备查询语句失败: {}", e)))?;

    let window_ids = stmt
        .query_map([], |row| row.get(0))
        .map_err(|e| AppError::Error(format!("执行查询失败: {}", e)))?
        .filter_map(Result::ok)
        .collect();

    Ok(window_ids)
}

/// 批量插入插件配置
///
/// # Arguments
///
/// * `configs` - 插件配置数组，每项包含 (window_id, info, config, data)
///
/// # Returns
///
/// * `AppResult<()>` - 操作结果
pub fn batch_insert_plugin_configs(configs: &[(String, String, String, String)]) -> AppResult<()> {
    if configs.is_empty() {
        return Ok(());
    }

    let mut conn = get_connection().lock();
    let tx = conn
        .transaction()
        .map_err(|e| AppError::Error(format!("创建事务失败: {}", e)))?;

    {
        let mut stmt = tx
            .prepare_cached(
                "INSERT INTO plugin_config (window_id, info, config, data) VALUES (?1, ?2, ?3, ?4)",
            )
            .map_err(|e| AppError::Error(format!("准备语句失败: {}", e)))?;

        for (window_id, info, config, data) in configs {
            stmt.execute(params![window_id, info, config, data])
                .map_err(|e| AppError::Error(format!("插入插件配置失败: {}", e)))?;
        }
    }

    tx.commit()
        .map_err(|e| AppError::Error(format!("提交事务失败: {}", e)))?;
    Ok(())
}

/// 批量删除插件配置
///
/// # Arguments
///
/// * `window_ids` - 要删除的插件ID数组
///
/// # Returns
///
/// * `AppResult<()>` - 操作结果
pub fn batch_remove_plugin_configs(window_ids: &[String]) -> AppResult<()> {
    if window_ids.is_empty() {
        return Ok(());
    }

    let mut conn = get_connection().lock();
    let tx = conn
        .transaction()
        .map_err(|e| AppError::Error(format!("创建事务失败: {}", e)))?;

    for window_id in window_ids {
        tx.execute(
            "DELETE FROM plugin_config WHERE window_id = ?1",
            params![window_id],
        )
        .map_err(|e| AppError::Error(format!("删除插件配置失败: {}", e)))?;
    }

    tx.commit()
        .map_err(|e| AppError::Error(format!("提交事务失败: {}", e)))?;
    Ok(())
}
