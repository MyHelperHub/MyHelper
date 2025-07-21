use super::wait;
use crate::get_previous_window;
use crate::utils::error::AppError;
use crate::utils::response::{ApiResponse, ApiStatusCode};
use rdev::{simulate, EventType, Key};
use x11::xlib::{self, XCloseDisplay, XOpenDisplay, XRaiseWindow, XSetInputFocus};

fn focus_previous_window() -> Result<(), String> {
    unsafe {
        let display = XOpenDisplay(std::ptr::null_mut());
        if display.is_null() {
            return Err("Could not open display".to_string());
        }

        let window = match get_previous_window() {
            Some(window) => window,
            None => return Err("Could not get active window".to_string()),
        };

        XRaiseWindow(display, window);
        XSetInputFocus(display, window, xlib::RevertToNone, xlib::CurrentTime);
        XCloseDisplay(display);
    }
    Ok(())
}

#[tauri::command]
pub async fn paste() -> Result<ApiResponse<()>, AppError> {
    fn dispatch(event_type: &EventType) -> Result<(), String> {
        wait(20);
        simulate(event_type)
            .map_err(|e| format!("Failed to simulate key event: {}", e))
    }

    if let Err(e) = focus_previous_window() {
        return Ok(ApiResponse::error(ApiStatusCode::ErrSystem, e));
    }

    wait(100);

    if let Err(e) = dispatch(&EventType::KeyPress(Key::ShiftLeft)) {
        return Ok(ApiResponse::error(ApiStatusCode::ErrSystem, e));
    }
    if let Err(e) = dispatch(&EventType::KeyPress(Key::Insert)) {
        return Ok(ApiResponse::error(ApiStatusCode::ErrSystem, e));
    }
    if let Err(e) = dispatch(&EventType::KeyRelease(Key::Insert)) {
        return Ok(ApiResponse::error(ApiStatusCode::ErrSystem, e));
    }
    if let Err(e) = dispatch(&EventType::KeyRelease(Key::ShiftLeft)) {
        return Ok(ApiResponse::error(ApiStatusCode::ErrSystem, e));
    }

    Ok(ApiResponse::success(()))
}
