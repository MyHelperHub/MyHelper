use crate::get_previous_window;
use crate::utils::error::AppError;
use crate::utils::response::{ApiResponse, ApiStatusCode};
use cocoa::{
    appkit::{NSApplicationActivationOptions, NSRunningApplication},
    base::nil,
};

fn focus_previous_window() -> Result<(), String> {
    let process_id = match get_previous_window() {
        Some(process_id) => process_id,
        None => return Err("No previous window found".to_string()),
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
pub async fn paste() -> Result<ApiResponse<()>, AppError> {
    if let Err(e) = focus_previous_window() {
        return Ok(ApiResponse::error(ApiStatusCode::ErrSystem, e));
    }

    let script =
        r#"osascript -e 'tell application "System Events" to keystroke "v" using command down'"#;

    match std::process::Command::new("sh")
        .arg("-c")
        .arg(script)
        .output()
    {
        Ok(_) => Ok(ApiResponse::success(())),
        Err(e) => Ok(ApiResponse::error(ApiStatusCode::ErrSystem, format!("Failed to execute paste command: {}", e))),
    }
}
