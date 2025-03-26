use base64::{engine::general_purpose::STANDARD, Engine as _};
use image::codecs::png::PngEncoder;
use image::DynamicImage;
use image::ImageEncoder;
use rand::{rng, Rng};
use std::fs;
use std::fs::File;
use std::io::BufWriter;

use crate::utils::error::{AppError, AppResult};
use crate::utils::path::get_myhelper_path;

/**
 * 设置本地图标
 * @param image_path 图片路径
 * @param app_type 应用类型，0为网页图标，1为应用图标
 */
#[tauri::command]
pub fn set_local_icon(image_path: &str, app_type: u32) -> AppResult<String> {
    let myhelper_path = get_myhelper_path().map_err(|e| AppError::Error(e))?;
    let icon_path = myhelper_path.join("Image");

    // 加载图片
    let img = image::open(image_path).map_err(|e| AppError::Error(e.to_string()))?;

    // 调整图片大小为 32x32
    let resized_img = img.resize_exact(32, 32, image::imageops::FilterType::Lanczos3);

    let output_path = match app_type {
        0 => {
            // 网页图标路径和文件名前缀
            let sub_path = icon_path.join("WebIcon");
            let random_file_name: String = (0..8)
                .map(|_| rng().sample(rand::distr::Alphanumeric) as char)
                .collect();
            let file_name = format!("{}{}.png", "web_image_", random_file_name);
            sub_path.join(file_name)
        }
        1 => {
            // 应用图标路径和文件名前缀
            let sub_path = icon_path.join("AppIcon");
            let random_file_name: String = (0..8)
                .map(|_| rng().sample(rand::distr::Alphanumeric) as char)
                .collect();
            let file_name = format!("{}{}.png", "app_image_", random_file_name);
            sub_path.join(file_name)
        }
        _ => return Err(AppError::Error("Invalid app type".to_string())),
    };

    // 确保目录存在
    if let Some(parent) = output_path.parent() {
        fs::create_dir_all(parent).map_err(|e| AppError::Error(e.to_string()))?;
    }

    // 创建文件并保存图片
    let file = File::create(&output_path).map_err(|e| AppError::Error(e.to_string()))?;
    let writer = BufWriter::new(file);
    let encoder = PngEncoder::new(writer);

    encoder
        .write_image(
            resized_img.as_bytes(),
            resized_img.width(),
            resized_img.height(),
            resized_img.color().into(),
        )
        .map_err(|e| AppError::Error(e.to_string()))?;

    // 返回文件路径
    Ok(output_path.to_string_lossy().to_string())
}

/**
 * 设置 logo 图标
 * @param image_base64 图片的 base64 编码
 */
#[tauri::command]
pub fn set_logo(image_base64: &str) -> Result<String, AppError> {
    let myhelper_path = get_myhelper_path().map_err(|e| AppError::Error(e))?;
    let icon_path = myhelper_path.join("Image");

    let img = load_image_from_base64(image_base64)?;
    let resized_img = img.resize_exact(200, 200, image::imageops::FilterType::Lanczos3);

    let output_path = icon_path.join("logo.png");

    // 确保目录存在
    if let Some(parent) = output_path.parent() {
        fs::create_dir_all(parent).map_err(|e| AppError::Error(e.to_string()))?;
    }

    // 创建文件并保存图片
    let file = File::create(&output_path).map_err(|e| AppError::Error(e.to_string()))?;
    let writer = BufWriter::new(file);
    let encoder = PngEncoder::new(writer);

    encoder
        .write_image(
            resized_img.as_bytes(),
            resized_img.width(),
            resized_img.height(),
            resized_img.color().into(),
        )
        .map_err(|e| AppError::Error(e.to_string()))?;

    Ok(output_path.to_string_lossy().to_string())
}

fn load_image_from_base64(base64_str: &str) -> Result<DynamicImage, AppError> {
    let base64_data = if base64_str.starts_with("data:image") {
        // 处理可能包含的data URI前缀
        let parts: Vec<&str> = base64_str.split(',').collect();
        if parts.len() < 2 {
            return Err(AppError::Error("Invalid base64 format".to_string()));
        }
        parts[1]
    } else {
        base64_str
    };

    let decoded = STANDARD
        .decode(base64_data)
        .map_err(|e| AppError::Error(format!("Failed to decode base64: {}", e)))?;

    let img = image::load_from_memory(&decoded)
        .map_err(|e| AppError::Error(format!("Failed to load image: {}", e)))?;

    Ok(img)
}
