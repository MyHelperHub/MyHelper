use crate::utils::logger::{LogEntry, Logger};

#[tauri::command]
pub async fn write_log(entry: LogEntry) -> Result<(), String> {
    Logger::write_log(entry)
}
