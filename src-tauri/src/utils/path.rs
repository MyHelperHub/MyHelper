use std::{fs, path::PathBuf};
use directories::BaseDirs;

pub fn get_myhelper_path() -> Result<PathBuf, String> {
    let myhelper_path = BaseDirs::new()
        .ok_or("Could not determine home directory".to_string())?
        .data_dir()
        .join("myhelper");

    // 确保 myhelper 目录存在
    if !myhelper_path.exists() {
        fs::create_dir_all(&myhelper_path).map_err(|e| e.to_string())?;
    }

    Ok(myhelper_path)
}