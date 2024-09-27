// src/set_local_icon.rs
use image::ImageOutputFormat;
use rand::distributions::Alphanumeric;
use rand::{thread_rng, Rng};
use std::fs::File;
use std::io::BufWriter;
use std::path::Path;
use std::{env, fs};

// 定义错误类型
#[derive(Debug, serde::Serialize)]
pub enum IconError {
    InvalidAppType,
    IoError(String),
}

/**
 * 设置本地图标
 * @param image_path 图片路径
 * @param app_type 应用类型，0为网页图标，1为应用图标
 */
#[tauri::command]
pub fn set_local_icon(image_path: &str, app_type: u32) -> Result<String, IconError> {
    // 加载图片
    let img = image::open(image_path).map_err(|e| IconError::IoError(e.to_string()))?;

    // 调整图片大小为 32x32
    let resized_img = img.resize_exact(32, 32, image::imageops::FilterType::Lanczos3);

    // 获取用户目录
    let home_dir = env::var("APPDATA").map_err(|e| IconError::IoError(e.to_string()))?;
    let mut icon_path = Path::new(&home_dir).join("MyHelper").join("Image");

    // 根据 app_type 选择存储路径
    let file_name_prefix = if app_type == 0 {
        icon_path = icon_path.join("WebIcon");
        "web_image_"
    } else if app_type == 1 {
        icon_path = icon_path.join("AppIcon");
        "app_image_"
    } else {
        return Err(IconError::InvalidAppType);
    };

    // 创建目录（如果不存在）
    if !icon_path.exists() {
        fs::create_dir_all(&icon_path).map_err(|e| IconError::IoError(e.to_string()))?;
    }

    // 生成随机六位字符
    let random_chars: String = thread_rng()
        .sample_iter(&Alphanumeric)
        .take(6)
        .map(char::from)
        .collect();

    // 拼接文件名
    let file_name = format!("{}{}.png", file_name_prefix, random_chars);
    let output_path = icon_path.join(file_name);

    // 保存图片
    let output_file = File::create(&output_path).map_err(|e| IconError::IoError(e.to_string()))?;
    let mut writer = BufWriter::new(output_file);
    resized_img
        .write_to(&mut writer, ImageOutputFormat::Png)
        .map_err(|e| IconError::IoError(e.to_string()))?;

    Ok(output_path.display().to_string())
}