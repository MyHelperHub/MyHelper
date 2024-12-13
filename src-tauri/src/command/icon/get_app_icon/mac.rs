use std::path::Path;
use std::fs::{self, File};
use std::io::BufWriter;

use objc2::ClassType;
use objc2_app_kit::{
    NSBitmapImageRep, NSCompositingOperation, NSGraphicsContext, NSWorkspace,
};
use objc2_foundation::{CGPoint, CGRect, CGSize, NSString};
use image::codecs::png::PngEncoder;
use image::ImageEncoder;
use rand::{thread_rng, Rng};
use rand::distributions::Alphanumeric;

use crate::utils::path::get_myhelper_path;
use crate::utils::error::AppResult;

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
    // 检查路径是否存在
    if !Path::new(exe_path).exists() {
        return Ok(String::new());
    }

    // 获取用户目录
    let myhelper_path = get_myhelper_path()
        .map(|path| path.join("Image").join("AppIcon"))
        .map_err(|e| e.to_string())?;

    if !myhelper_path.exists() {
        fs::create_dir_all(&myhelper_path)
            .map_err(|e| e.to_string())?;
    }

    // 生成随机文件名
    let random_chars: String = thread_rng()
        .sample_iter(&Alphanumeric)
        .take(6)
        .map(char::from)
        .collect();
    let output_path = myhelper_path.join(format!("app_image_{}.png", random_chars));

    // 获取规范化路径
    let path = match Path::new(exe_path).canonicalize() {
        Ok(p) => p,
        Err(_) => return Ok(String::new()),
    };
    
    let file_path = match path.to_str() {
        Some(p) => NSString::from_str(p),
        None => return Ok(String::new()),
    };

    // 获取工作区和图标
    let shared_workspace = unsafe { NSWorkspace::sharedWorkspace() };
    let icon = unsafe { shared_workspace.iconForFile(&file_path) };

    // 设置图标大小
    let desired_size = CGSize {
        width: 128.0,
        height: 128.0,
    };
    unsafe { icon.setSize(desired_size) };

    // 创建位图表示
    let color_space_name = NSString::from_str("NSDeviceRGBColorSpace");
    let bitmap_rep = match unsafe {
        NSBitmapImageRep::initWithBitmapDataPlanes_pixelsWide_pixelsHigh_bitsPerSample_samplesPerPixel_hasAlpha_isPlanar_colorSpaceName_bytesPerRow_bitsPerPixel(
            NSBitmapImageRep::alloc(),
            std::ptr::null_mut(),
            128,
            128,
            8,
            4,
            true,
            false,
            &color_space_name,
            128 * 4,
            32,
        )
    } {
        Some(rep) => rep,
        None => return Ok(String::new()),
    };

    // 创建图形上下文
    let context = match unsafe {
        NSGraphicsContext::graphicsContextWithBitmapImageRep(&bitmap_rep)
    } {
        Some(ctx) => ctx,
        None => return Ok(String::new()),
    };

    unsafe {
        // 保存图形状态
        context.saveGraphicsState();
        NSGraphicsContext::setCurrentContext(Some(&context));

        // 绘制图标
        icon.drawAtPoint_fromRect_operation_fraction(
            CGPoint::ZERO,
            CGRect::new(CGPoint::ZERO, desired_size),
            NSCompositingOperation::Copy,
            1.0,
        );

        // 刷新并恢复状态
        context.flushGraphics();
        context.restoreGraphicsState();

        // 获取像素数据
        let pixels = std::slice::from_raw_parts(
            bitmap_rep.bitmapData(),
            bitmap_rep.bytesPerPlane() as usize,
        );

        // 保存为 PNG
        let output_file = match File::create(&output_path) {
            Ok(file) => file,
            Err(_) => return Ok(String::new()),
        };
        let writer = BufWriter::new(output_file);
        let encoder = PngEncoder::new(writer);

        if let Err(_) = encoder.write_image(
            pixels,
            128,
            128,
            image::ColorType::Rgba8.into(),
        ) {
            return Ok(String::new());
        }
    }

    Ok(output_path.display().to_string())
}
