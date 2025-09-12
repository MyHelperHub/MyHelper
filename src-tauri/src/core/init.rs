use crate::command::quick_input::clipboard::observe_app;
use crate::mh_plugin::sync::sync_plugins;
use crate::services::database::init_database;
use crate::utils::error::{AppError, AppResult};

/// 初始化应用
pub fn init_app() -> AppResult<()> {
    // 初始化数据库
    init_database().map_err(|e| AppError::Error(format!("初始化数据库失败: {}", e)))?;

    // 同步插件配置
    tauri::async_runtime::spawn(async {
        if let Err(e) = sync_plugins().await {
            eprintln!("同步插件失败: {}", e);
        }
    });

    // 初始化应用观察者
    observe_app().map_err(|e| AppError::Error(format!("初始化应用观察者失败: {}", e)))?;

    Ok(())
}
