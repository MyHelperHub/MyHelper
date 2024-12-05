use crate::utils::path::get_myhelper_path;
use chrono::Local;
use serde::{Deserialize, Serialize};
use std::fs::{self, File, OpenOptions};
use std::io::{Read, Write};
use std::path::PathBuf;

const MAX_LOG_SIZE: u64 = 20 * 1024 * 1024; // 20MB

#[derive(Debug, Serialize, Deserialize)]
pub struct LogEntry {
    pub level: String,
    pub message: String,
    pub timestamp: String,
    pub details: Option<String>,
}

pub struct Logger;

impl Logger {
    fn get_log_file_path() -> Result<PathBuf, String> {
        let mut path = get_myhelper_path()?;
        path.push("log");

        fs::create_dir_all(&path).map_err(|e| format!("Failed to create log directory: {}", e))?;

        path.push("myhelper.log");
        Ok(path)
    }

    pub fn write_log(mut entry: LogEntry) -> Result<(), String> {
        // 使用 chrono 格式化时间
        entry.timestamp = Local::now().format("%Y-%m-%d %H:%M:%S%.3f").to_string();

        let path = Self::get_log_file_path()?;

        if let Ok(metadata) = fs::metadata(&path) {
            if metadata.len() > MAX_LOG_SIZE {
                Self::trim_log_file(&path)?;
            }
        }

        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(path)
            .map_err(|e| format!("Failed to open log file: {}", e))?;

        let log_line = format!(
            "[{}] [{}] {}{}\n",
            entry.timestamp,
            entry.level.to_uppercase(),
            entry.message,
            entry
                .details
                .map_or(String::new(), |d| format!("\nDetails: {}", d))
        );

        file.write_all(log_line.as_bytes())
            .map_err(|e| format!("Failed to write to log file: {}", e))?;

        Ok(())
    }

    fn trim_log_file(path: &PathBuf) -> Result<(), String> {
        // 读取整个文件
        let mut file =
            File::open(path).map_err(|e| format!("Failed to open log file for trimming: {}", e))?;

        let mut content = String::new();
        file.read_to_string(&mut content)
            .map_err(|e| format!("Failed to read log file: {}", e))?;

        // 只保留后半部分的日志
        let half_length = content.len() / 2;
        let new_content = content
            .split('\n')
            .skip_while(|line| content[..content.find(line).unwrap_or(0)].len() < half_length)
            .collect::<Vec<&str>>()
            .join("\n");

        // 重写文件
        let mut file =
            File::create(path).map_err(|e| format!("Failed to create new log file: {}", e))?;

        file.write_all(new_content.as_bytes())
            .map_err(|e| format!("Failed to write trimmed log file: {}", e))?;

        Ok(())
    }
}
