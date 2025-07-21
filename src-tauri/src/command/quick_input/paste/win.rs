use super::wait;
use crate::get_previous_window;
use crate::utils::error::AppError;
use crate::utils::response::{ApiResponse, ApiStatusCode};
use enigo::{
    Direction::{Click, Press, Release},
    Enigo, Key, Keyboard, Settings,
};
use winapi::{shared::windef::HWND, um::winuser::SetForegroundWindow};

fn focus_previous_window() -> Result<(), String> {
    unsafe {
        let hwnd = match get_previous_window() {
            Some(hwnd) => hwnd as HWND,
            None => return Err("No previous window found".to_string()),
        };

        if hwnd.is_null() {
            return Err("Invalid window handle".to_string());
        }

        SetForegroundWindow(hwnd);
    }
    Ok(())
}

#[tauri::command]
pub async fn paste() -> Result<ApiResponse<()>, AppError> {
    let mut enigo = match Enigo::new(&Settings::default()) {
        Ok(e) => e,
        Err(e) => return Ok(ApiResponse::error(ApiStatusCode::ErrSystem, format!("Failed to initialize Enigo: {}", e))),
    };

    if let Err(e) = focus_previous_window() {
        return Ok(ApiResponse::error(ApiStatusCode::ErrSystem, e));
    }

    wait(100);

    if let Err(e) = enigo.key(Key::Shift, Press) {
        return Ok(ApiResponse::error(ApiStatusCode::ErrSystem, format!("Failed to press Shift key: {}", e)));
    }
    if let Err(e) = enigo.key(Key::Other(0x2D), Click) {
        return Ok(ApiResponse::error(ApiStatusCode::ErrSystem, format!("Failed to press Insert key: {}", e)));
    }
    if let Err(e) = enigo.key(Key::Shift, Release) {
        return Ok(ApiResponse::error(ApiStatusCode::ErrSystem, format!("Failed to release Shift key: {}", e)));
    }

    Ok(ApiResponse::success(()))
}
