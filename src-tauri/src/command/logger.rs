use crate::{
    services::logger::{LogEntry, Logger},
    utils::{error::AppError, response::ApiResponse},
};

#[tauri::command]
pub async fn write_log(entry: LogEntry) -> Result<ApiResponse<()>, AppError> {
    Logger::write_log(entry)
        .map(|_| ApiResponse::success(()))
        .map_err(AppError::from)
}
