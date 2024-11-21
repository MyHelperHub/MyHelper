use crate::get_previous_window;
use crate::utils::error::{AppError, AppResult};
use cocoa::{
    appkit::{NSApplicationActivationOptions, NSRunningApplication},
    base::nil,
};

fn focus_previous_window() -> AppResult<()> {
    let process_id = match get_previous_window() {
        Some(process_id) => process_id,
        None => return Err(AppError::WindowError("No previous window found".to_string())),
    };

    unsafe {
        let app = NSRunningApplication::runningApplicationWithProcessIdentifier(nil, process_id);
        app.activateWithOptions_(
            NSApplicationActivationOptions::NSApplicationActivateIgnoringOtherApps,
        );
    }
    Ok(())
}

#[tauri::command]
pub async fn paste() -> AppResult<()> {
    focus_previous_window()?;

    let script = r#"osascript -e 'tell application "System Events" to keystroke "v" using command down'"#;

    std::process::Command::new("sh")
        .arg("-c")
        .arg(script)
        .output()
        .map_err(|e| AppError::SystemError(format!("Failed to execute paste command: {}", e)))?;

    Ok(())
}
