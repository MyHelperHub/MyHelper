use once_cell::sync::OnceCell;
use tauri::AppHandle;

// 全局 AppHandle 管理器
pub struct AppHandleManager;

impl AppHandleManager {
    // 设置全局 AppHandle
    pub fn set(app_handle: AppHandle) {
        let _ = APP_HANDLE.set(app_handle);
    }

    // 获取全局 AppHandle 的引用
    pub fn get() -> Option<&'static AppHandle> {
        APP_HANDLE.get()
    }
    
    // 获取全局 AppHandle 的克隆，仅在必要时使用
    pub fn clone() -> Option<AppHandle> {
        APP_HANDLE.get().map(|app_handle| app_handle.clone())
    }
}

// 全局静态变量存储 AppHandle
static APP_HANDLE: OnceCell<AppHandle> = OnceCell::new(); 