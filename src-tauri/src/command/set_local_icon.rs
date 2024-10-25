use image::ImageOutputFormat;
use rand::distributions::Alphanumeric;
use rand::{thread_rng, Rng};
use std::fs::File;
use std::io::BufWriter;
use std::fs;

use crate::utils::path::get_myhelper_path;


#[derive(Debug, serde::Serialize)]
pub enum IconError {
    HomeDirError(String),
    ImageError(String),
    IoError(String),
    InvalidAppType,
}


#[tauri::command]
pub fn set_local_icon(image_path: &str, app_type: u32) -> Result<String, IconError> {
    let myhelper_path = get_myhelper_path().map_err(|e| IconError::HomeDirError(e))?;

    // 加载图片
    let img = image::open(image_path).map_err(|e| IconError::ImageError(e.to_string()))?;

    // 调整图片大小为 32x32
    let resized_img = img.resize_exact(32, 32, image::imageops::FilterType::Lanczos3);

    let icon_path = myhelper_path.join("Image");


    let (icon_sub_path, file_name_prefix) = if app_type == 0 {
        (icon_path.join("WebIcon"), "web_image_")
    } else if app_type == 1 {
        (icon_path.join("AppIcon"), "app_image_")
    } else {
        return Err(IconError::InvalidAppType);
    };

    // 确保目录存在
    if !icon_sub_path.exists() {
        fs::create_dir_all(&icon_sub_path).map_err(|e| IconError::IoError(e.to_string()))?;
    }

    let random_chars: String = thread_rng()
        .sample_iter(&Alphanumeric)
        .take(6)
        .map(char::from)
        .collect();

    let file_name = format!("{}{}.png", file_name_prefix, random_chars);
    let output_path = icon_sub_path.join(file_name);

    let mut writer = BufWriter::new(
        File::create(&output_path).map_err(|e| IconError::IoError(e.to_string()))?,
    );

    resized_img
        .write_to(&mut writer, ImageOutputFormat::Png)
        .map_err(|e| IconError::ImageError(e.to_string()))?;

    Ok(output_path.display().to_string())
}