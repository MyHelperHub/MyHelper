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
/// * `String` - 成功返回保存的图标文件路径，失败返回空字符串
pub fn get_app_icon(exe_path: &str) -> String {
    // 获取用户目录
    let myhelper_path = match get_myhelper_path().map(|path| path.join("Image").join("AppIcon")) {
        Ok(path) => path,
        Err(_) => return String::new(),
    };

    if !myhelper_path.exists() {
        if let Err(_) = fs::create_dir_all(&myhelper_path) {
            return String::new();
        }
    }

    // 生成随机文件名
    let random_chars: String = thread_rng()
        .sample_iter(&Alphanumeric)
        .take(6)
        .map(char::from)
        .collect();
    let output_path = myhelper_path.join(format!("app_image_{}.png", random_chars));

    // 使用 GTK 的 icon-query 工具获取图标
    let output = match Command::new("gtk-query-immodules-3.0")
        .arg(exe_path)
        .output()
    {
        Ok(output) => output,
        Err(_) => return String::new(),
    };

    if !output.status.success() {
        return String::new();
    }

    // 解析输出获取图标路径
    let icon_theme = match Command::new("gtk-query-settings")
        .arg("gtk-icon-theme-name")
        .output()
    {
        Ok(output) => output,
        Err(_) => return String::new(),
    };

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
                        let img = match image::open(entry.path()) {
                            Ok(img) => img,
                            Err(_) => return String::new(),
                        };

                        // 创建输出文件
                        let output_file = match File::create(&output_path) {
                            Ok(file) => file,
                            Err(_) => return String::new(),
                        };
                        let writer = BufWriter::new(output_file);

                        // 创建 PngEncoder
                        let encoder = PngEncoder::new(writer);

                        // 编码并写入
                        if let Err(_) = encoder.write_image(
                            img.as_bytes(),
                            img.width(),
                            img.height(),
                            img.color().into(),
                        ) {
                            return String::new();
                        }

                        return output_path.display().to_string();
                    }
                }
            }
        }
    }

    // 如果没有找到图标，使用默认图标
    let default_icon = "/usr/share/icons/hicolor/128x128/apps/application-x-executable.png";

    // 打开默认图标
    let img = match image::open(default_icon) {
        Ok(img) => img,
        Err(_) => return String::new(),
    };

    // 创建输出文件
    let output_file = match File::create(&output_path) {
        Ok(file) => file,
        Err(_) => return String::new(),
    };
    let writer = BufWriter::new(output_file);

    // 创建 PngEncoder
    let encoder = PngEncoder::new(writer);

    // 编码并写入
    if let Err(_) = encoder.write_image(
        img.as_bytes(),
        img.width(),
        img.height(),
        img.color().into(),
    ) {
        return String::new();
    }

    output_path.display().to_string()
}
