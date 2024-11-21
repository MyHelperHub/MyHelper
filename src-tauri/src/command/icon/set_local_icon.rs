use base64::{engine::general_purpose::STANDARD, Engine as _};
use image::codecs::png::PngEncoder;
use image::DynamicImage;
use image::ImageEncoder;
use rand::distributions::Alphanumeric;
use rand::{thread_rng, Rng};
use std::fs;
use std::fs::File;
use std::io::BufWriter;

use crate::utils::path::get_myhelper_path;
use crate::utils::error::{AppError, AppResult};

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
            let prefix = "web_image_";
            let file_name = format!("{}{}.png", prefix, generate_random_string(6));
            sub_path.join(file_name)
        }
        1 => {
            // 应用图标路径和文件名前缀
            let sub_path = icon_path.join("AppIcon");
            let prefix = "app_image_";
            let file_name = format!("{}{}.png", prefix, generate_random_string(6));
            sub_path.join(file_name)
        }
        _ => return Err(AppError::Error("Invalid app type".to_string())),
    };

    // 确保目录存在
    if let Some(parent) = output_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| AppError::Error(e.to_string()))?;
        }
    }

    // 写入图片到指定路径
    let mut writer =
        BufWriter::new(File::create(&output_path).map_err(|e| AppError::Error(e.to_string()))?);
    let encoder = PngEncoder::new(&mut writer);
    encoder
        .write_image(
            resized_img.as_bytes(),
            resized_img.width(),
            resized_img.height(),
            resized_img.color().into(),
        )
        .map_err(|e| AppError::Error(e.to_string()))?;

    Ok(output_path.display().to_string())
}

/**
 * 设置 logo 图标
 * @param image_base64 图片的 base64 编码
 */
#[tauri::command]
pub fn set_logo(image_base64: &str) -> Result<String, AppError> {
    let myhelper_path = get_myhelper_path().map_err(|e| AppError::Error(e))?;
    let logo_path = myhelper_path.join("Image").join("logo.png");

    // 从 base64 字符串加载图片
    let img = load_image_from_base64(image_base64)?;

    // 确保目录存在
    if let Some(parent) = logo_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| AppError::Error(e.to_string()))?;
        }
    }

    // 写入原始图片到指定路径
    let mut writer =
        BufWriter::new(File::create(&logo_path).map_err(|e| AppError::Error(e.to_string()))?);
    let encoder = PngEncoder::new(&mut writer);
    encoder
        .write_image(
            img.as_bytes(),
            img.width(),
            img.height(),
            img.color().into(),
        )
        .map_err(|e| AppError::Error(e.to_string()))?;

    Ok(logo_path.display().to_string())
}

// 从 base64 字符串加载图片
fn load_image_from_base64(base64_str: &str) -> Result<DynamicImage, AppError> {
    let decoded_data = STANDARD
        .decode(base64_str)
        .map_err(|e| AppError::Error(e.to_string()))?;
    let img =
        image::load_from_memory(&decoded_data).map_err(|e| AppError::Error(e.to_string()))?;
    Ok(img)
}

// 生成指定长度的随机字符串
fn generate_random_string(len: usize) -> String {
    thread_rng()
        .sample_iter(&Alphanumeric)
        .take(len)
        .map(char::from)
        .collect()
}
