use crate::utils::error::AppResult;
use cocoa::base::{id, nil};
use cocoa::foundation::{NSData, NSString};
use image::codecs::png::PngEncoder;
use image::{DynamicImage, ImageBuffer, Rgba};
use objc::{msg_send, sel, sel_impl};
use rand::distributions::Alphanumeric;
use rand::{thread_rng, Rng};
use std::fs::{self, File};
use std::io::BufWriter;

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
    let myhelper_path = match get_myhelper_path()
        .map(|path| path.join("Image").join("AppIcon"))
    {
        Ok(path) => path,
        Err(_) => return Ok(String::new()),
    };

    if !myhelper_path.exists() {
        if let Err(_) = fs::create_dir_all(&myhelper_path) {
            return Ok(String::new());
        }
    }

    // 生成随机文件名
    let random_chars: String = thread_rng()
        .sample_iter(&Alphanumeric)
        .take(6)
        .map(char::from)
        .collect();
    let output_path = myhelper_path.join(format!("app_image_{}.png", random_chars));

    unsafe {
        let workspace: id = msg_send![class!(NSWorkspace), sharedWorkspace];
        let ns_string = NSString::alloc(nil).init_str(exe_path);
        let icon: id = msg_send![workspace, iconForFile:ns_string];
        
        if icon == nil {
            return Ok(String::new());
        }

        let size: NSSize = NSSize::new(128.0, 128.0);
        let _: () = msg_send![icon, setSize:size];

        let tiff_data: id = msg_send![icon, TIFFRepresentation];
        if tiff_data == nil {
            return Ok(String::new());
        }

        let bitmap_rep: id = msg_send![class!(NSBitmapImageRep), imageRepWithData:tiff_data];
        if bitmap_rep == nil {
            return Ok(String::new());
        }

        let png_data: id = msg_send![bitmap_rep, representationUsingType:4 properties:nil];
        if png_data == nil {
            return Ok(String::new());
        }

        let bytes: *const u8 = msg_send![png_data, bytes];
        let length: usize = msg_send![png_data, length];

        let data = std::slice::from_raw_parts(bytes, length);
        let img = match image::load_from_memory(data) {
            Ok(img) => img,
            Err(_) => return Ok(String::new()),
        };

        // 创建输出文件
        let output_file = match File::create(&output_path) {
            Ok(file) => file,
            Err(_) => return Ok(String::new()),
        };
        let writer = BufWriter::new(output_file);

        // 创建 PngEncoder
        let encoder = PngEncoder::new(writer);

        // 编码并写入
        if let Err(_) = encoder.encode(
            img.as_bytes(),
            img.width(),
            img.height(),
            img.color().into(),
        ) {
            return Ok(String::new());
        }
    }

    Ok(output_path.display().to_string())
}
