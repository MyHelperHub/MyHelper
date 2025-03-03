use super::wait;
use crate::get_previous_window;
use crate::utils::error::{AppError, AppResult};
use enigo::{
    Direction::{Click, Press, Release},
    Enigo, Key, Keyboard, Settings,
};
use winapi::{shared::windef::HWND, um::winuser::SetForegroundWindow};

fn focus_previous_window() -> AppResult<()> {
    unsafe {
        let hwnd = match get_previous_window() {
            Some(hwnd) => hwnd as HWND,
            None => return Err(AppError::Error("No previous window found".to_string())),
        };

        if hwnd.is_null() {
            return Err(AppError::Error("Invalid window handle".to_string()));
        }

        SetForegroundWindow(hwnd);
    }
    Ok(())
}

#[tauri::command]
pub async fn paste() -> AppResult<()> {
    let mut enigo = Enigo::new(&Settings::default())
        .map_err(|e| AppError::Error(format!("Failed to initialize Enigo: {}", e)))?;

    focus_previous_window()?;

    wait(100);

    enigo
        .key(Key::Shift, Press)
        .map_err(|e| AppError::Error(format!("Failed to press Shift key: {}", e)))?;
    enigo
        .key(Key::Other(0x2D), Click)
        .map_err(|e| AppError::Error(format!("Failed to press Insert key: {}", e)))?;
    enigo
        .key(Key::Shift, Release)
        .map_err(|e| AppError::Error(format!("Failed to release Shift key: {}", e)))?;

    Ok(())
}
