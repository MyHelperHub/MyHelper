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

pub fn get_app_icon(exe_path: &str) -> Result<String, String> {
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

    unsafe {
        let workspace: id = msg_send![class!(NSWorkspace), sharedWorkspace];
        let ns_string = NSString::alloc(nil).init_str(exe_path);
        let icon: id = msg_send![workspace, iconForFile:ns_string];

        let size: NSSize = NSSize::new(128.0, 128.0);
        let _: () = msg_send![icon, setSize:size];

        let tiff_data: id = msg_send![icon, TIFFRepresentation];
        let bitmap_rep: id = msg_send![class!(NSBitmapImageRep), imageRepWithData:tiff_data];
        let png_data: id = msg_send![bitmap_rep, representationUsingType:4 properties:nil];

        let bytes: *const u8 = msg_send![png_data, bytes];
        let length: usize = msg_send![png_data, length];

        let data = std::slice::from_raw_parts(bytes, length);
        let img = image::load_from_memory(data).map_err(|e| e.to_string())?;

        // 创建输出文件
        let output_file = File::create(&output_path).map_err(|e| e.to_string())?;
        let writer = BufWriter::new(output_file);

        // 创建 PngEncoder
        let encoder = PngEncoder::new(writer);

        // 编码并写入
        encoder
            .encode(
                img.as_bytes(),
                img.width(),
                img.height(),
                img.color().into(),
            )
            .map_err(|e| e.to_string())?;
    }

    Ok(output_path.display().to_string())
}
