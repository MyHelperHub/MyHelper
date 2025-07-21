use std::fs::{self, File};
use std::io::BufWriter;
use std::path::Path;

use gio::{prelude::*, Cancellable, File as GioFile, FileQueryInfoFlags};
use gtk::{prelude::IconThemeExt, IconLookupFlags};
use image::codecs::png::PngEncoder;
use image::ImageEncoder;
use image::{DynamicImage, ImageBuffer, Rgba};
use rand::{rng, Rng};

use crate::utils::error::AppError;
use crate::utils::path::get_myhelper_path;
use crate::utils::response::{ApiResponse, ApiStatusCode};

/// 获取应用程序图标
///
/// # Arguments
///
/// * `exe_path` - 应用程序可执行文件路径
///
/// # Returns
///
/// * `Result<ApiResponse<String>, AppError>` - 成功返回保存的图标文件路径
pub fn get_app_icon(exe_path: &str) -> Result<ApiResponse<String>, AppError> {
    // 检查路径是否存在
    if !Path::new(exe_path).exists() {
        return Ok(ApiResponse::success(String::new()));
    }

    // 获取用户目录
    let myhelper_path = get_myhelper_path()
        .map(|path| path.join("Image").join("AppIcon"))
        .map_err(|e| e.to_string())?;

    if !myhelper_path.exists() {
        if let Err(e) = fs::create_dir_all(&myhelper_path) {
            return Ok(ApiResponse::error(ApiStatusCode::ErrFileWrite, format!("Failed to create directory: {}", e)));
        }
    }

    // 生成随机文件名
    let random_chars: String = (0..6)
        .map(|_| rng().sample(rand::distr::Alphanumeric) as char)
        .collect();
    let output_path = myhelper_path.join(format!("app_image_{}.png", random_chars));

    // 初始化 GTK
    if gtk::init().is_err() {
        return Ok(ApiResponse::error(ApiStatusCode::ErrSystem, "Failed to initialize GTK"));
    }

    // 获取文件信息
    let file = GioFile::for_path(exe_path);
    let file_info = match file.query_info("*", FileQueryInfoFlags::NONE, None::<&Cancellable>) {
        Ok(info) => info,
        Err(e) => return Ok(ApiResponse::error(ApiStatusCode::ErrFileRead, format!("Failed to query file info: {}", e))),
    };

    // 获取内容类型和图标
    let content_type = match file_info.content_type() {
        Some(ct) => ct,
        None => return Ok(ApiResponse::success(String::new())),
    };

    let icon = gio::functions::content_type_get_icon(&content_type);

    // 获取图标数据
    let pixbuf = if let Some(themed_icon) = icon.dynamic_cast_ref::<gio::ThemedIcon>() {
        let icon_theme = match gtk::IconTheme::default() {
            Some(theme) => theme,
            None => return Ok(ApiResponse::success(String::new())),
        };

        // 尝试从图标名称列表中获取图标
        let mut pb = None;
        for name in themed_icon.names() {
            if let Ok(Some(pixbuf)) = icon_theme.load_icon(&name, 128, IconLookupFlags::empty()) {
                pb = Some(pixbuf);
                break;
            }
        }

        // 如果没有找到图标，尝试使用通用可执行文件图标
        if pb.is_none() {
            pb = icon_theme
                .load_icon(
                    "application-x-executable",
                    128,
                    IconLookupFlags::GENERIC_FALLBACK,
                )
                .ok()
                .flatten();
        }

        match pb {
            Some(p) => p,
            None => return Ok(ApiResponse::success(String::new())),
        }
    } else {
        return Ok(ApiResponse::success(String::new()));
    };

    // 转换为 RGBA 格式
    let pixels = pixbuf.read_pixel_bytes().to_vec();
    let width = pixbuf.width() as u32;
    let height = pixbuf.height() as u32;

    let img_buffer = match ImageBuffer::<Rgba<u8>, _>::from_raw(width, height, pixels) {
        Some(buffer) => buffer,
        None => return Ok(ApiResponse::error(ApiStatusCode::ErrSystem, "Failed to create image buffer")),
    };

    let img = DynamicImage::ImageRgba8(img_buffer);

    // 保存为 PNG
    let output_file = match File::create(&output_path) {
        Ok(file) => file,
        Err(e) => return Ok(ApiResponse::error(ApiStatusCode::ErrFileWrite, format!("Failed to create output file: {}", e))),
    };
    let writer = BufWriter::new(output_file);
    let encoder = PngEncoder::new(writer);

    if let Err(e) = encoder.write_image(
        img.as_bytes(),
        img.width(),
        img.height(),
        img.color().into(),
    ) {
        return Ok(ApiResponse::error(ApiStatusCode::ErrFileWrite, format!("Failed to write PNG: {}", e)));
    }

    Ok(ApiResponse::success(output_path.display().to_string()))
}
