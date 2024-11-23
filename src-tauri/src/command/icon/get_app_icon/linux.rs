use crate::utils::error::{AppError, AppResult};
use image::codecs::png::PngEncoder;
use image::ImageEncoder;
use rand::distributions::Alphanumeric;
use rand::{thread_rng, Rng};
use std::fs::{self, File};
use std::io::BufWriter;
use std::process::Command;

use crate::utils::path::get_myhelper_path;

/// 获取应用程序图标
///
/// # Arguments
///
/// * `exe_path` - 应用程序可执行文件路径
///
/// # Returns
///
/// * `AppResult<String>` - 成功返回保存的图标文件路径
pub fn get_app_icon(exe_path: &str) -> AppResult<String> {
    // 获取用户目录
    let myhelper_path = get_myhelper_path()
        .map(|path| path.join("Image").join("AppIcon"))
        .map_err(|e| e.to_string())?;

    if !myhelper_path.exists() {
        fs::create_dir_all(&myhelper_path).map_err(|e| e.to_string())?;
    }

    // 生成随机文件名
    let random_chars: String = thread_rng()
        .sample_iter(&Alphanumeric)
        .take(6)
        .map(char::from)
        .collect();
    let output_path = myhelper_path.join(format!("app_image_{}.png", random_chars));

    // 使用 GTK 的 icon-query 工具获取图标
    let output = Command::new("gtk-query-immodules-3.0")
        .arg(exe_path)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(AppError::Error("Failed to query icon".to_string()));
    }

    // 解析输出获取图标路径
    let icon_theme = Command::new("gtk-query-settings")
        .arg("gtk-icon-theme-name")
        .output()
        .map_err(|e| e.to_string())?;

    // 尝试从多个标准位置查找图标
    let icon_paths = vec![
        "/usr/share/icons",
        "/usr/local/share/icons",
        "~/.local/share/icons",
    ];

    // 查找并复制第一个找到的图标
    for path in icon_paths {
        let icon_path = format!(
            "{}/{}/128x128/apps/",
            path,
            String::from_utf8_lossy(&icon_theme.stdout).trim()
        );
        if let Ok(entries) = fs::read_dir(icon_path) {
            for entry in entries {
                if let Ok(entry) = entry {
                    if entry.path().to_string_lossy().contains(exe_path) {
                        // 打开源文件
                        let img = image::open(entry.path()).map_err(|e| e.to_string())?;

                        // 创建输出文件
                        let output_file = File::create(&output_path).map_err(|e| e.to_string())?;
                        let writer = BufWriter::new(output_file);

                        // 创建 PngEncoder
                        let encoder = PngEncoder::new(writer);

                        // 编码并写入
                        encoder
                            .write_image(
                                img.as_bytes(),
                                img.width(),
                                img.height(),
                                img.color().into(),
                            )
                            .map_err(|e| e.to_string())?;

                        return Ok(output_path.display().to_string());
                    }
                }
            }
        }
    }

    // 如果没有找到图标，使用默认图标
    let default_icon = "/usr/share/icons/hicolor/128x128/apps/application-x-executable.png";

    // 打开默认图标
    let img = image::open(default_icon).map_err(|e| e.to_string())?;

    // 创建输出文件
    let output_file = File::create(&output_path).map_err(|e| e.to_string())?;
    let writer = BufWriter::new(output_file);

    // 创建 PngEncoder
    let encoder = PngEncoder::new(writer);

    // 编码并写入
    encoder
        .write_image(
            img.as_bytes(),
            img.width(),
            img.height(),
            img.color().into(),
        )
        .map_err(|e| e.to_string())?;

    Ok(output_path.display().to_string())
}
