use super::wait;
use crate::get_previous_window;
use crate::utils::error::{AppError, AppResult};
use rdev::{simulate, EventType, Key};
use x11::xlib::{self, XCloseDisplay, XOpenDisplay, XRaiseWindow, XSetInputFocus};

fn focus_previous_window() -> AppResult<()> {
    unsafe {
        let display = XOpenDisplay(std::ptr::null_mut());
        if display.is_null() {
            return Err(AppError::SystemError("Could not open display".to_string()));
        }
        
        let window = match get_previous_window() {
            Some(window) => window,
            None => return Err(AppError::WindowError("Could not get active window".to_string())),
        };

        XRaiseWindow(display, window);
        XSetInputFocus(display, window, xlib::RevertToNone, xlib::CurrentTime);
        XCloseDisplay(display);
    }
    Ok(())
}

#[tauri::command]
pub async fn paste() -> AppResult<()> {
    fn dispatch(event_type: &EventType) -> AppResult<()> {
        wait(20);
        simulate(event_type).map_err(|e| AppError::SystemError(format!("Failed to simulate key event: {}", e)))
    }

    focus_previous_window()?;

    wait(100);

    dispatch(&EventType::KeyPress(Key::ShiftLeft))?;
    dispatch(&EventType::KeyPress(Key::Insert))?;
    dispatch(&EventType::KeyRelease(Key::Insert))?;
    dispatch(&EventType::KeyRelease(Key::ShiftLeft))?;

    Ok(())
}
