use std::fs::{self, File};
use std::io::BufWriter;
use std::path::Path;
use std::ptr;

use image::codecs::png::PngEncoder;
use image::ImageEncoder;
use image::{DynamicImage, ImageBuffer, Rgba};
use rand::{rng, Rng};
use scopeguard::defer;
use windows::{
    core::HSTRING,
    Win32::{
        Foundation::SIZE,
        Graphics::{
            Gdi::{DeleteObject, HGDIOBJ, HPALETTE},
            Imaging::{
                CLSID_WICImagingFactory, GUID_WICPixelFormat32bppBGRA,
                GUID_WICPixelFormat32bppRGBA, IWICImagingFactory, WICBitmapUseAlpha, WICRect,
            },
        },
        System::Com::{CoCreateInstance, CoInitialize, CoUninitialize, CLSCTX_ALL},
        UI::Shell::{
            IShellItemImageFactory, SHCreateItemFromParsingName,
            SIIGBF_ICONONLY, SIIGBF_SCALEUP,
        },
    },
};

use crate::utils::error::AppResult;
use crate::utils::path::get_myhelper_path;

/// COM 初始化令牌，用于确保 COM 环境的正确初始化和清理
struct InitializationToken;

impl Drop for InitializationToken {
    fn drop(&mut self) {
        unsafe {
            CoUninitialize();
        }
    }
}

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
        fs::create_dir_all(&myhelper_path).map_err(|e| e.to_string())?;
    }

    // 生成随机文件名
    let random_chars: String = (0..6)
        .map(|_| rng().sample(rand::distr::Alphanumeric) as char)
        .collect();
    let output_path = myhelper_path.join(format!("app_image_{}.png", random_chars));

    // 初始化 COM
    let _token = if unsafe { CoInitialize(None) }.is_ok() {
        Some(InitializationToken)
    } else {
        return Ok(String::new());
    };

    // 获取图标
    let path = HSTRING::from(exe_path);
    let shell_item: IShellItemImageFactory =
        match unsafe { SHCreateItemFromParsingName(&path, None) } {
            Ok(factory) => factory,
            Err(_) => return Ok(String::new()),
        };

    let bitmap_size = SIZE { cx: 128, cy: 128 };

    let bitmap =
        match unsafe { shell_item.GetImage(bitmap_size, SIIGBF_ICONONLY | SIIGBF_SCALEUP) } {
            Ok(bmp) => bmp,
            Err(_) => return Ok(String::new()),
        };

    // 确保位图资源被正确释放
    defer! {
        unsafe {
            let _ = DeleteObject(HGDIOBJ(bitmap.0));
        }
    }

    // 创建 WIC 工厂
    let imaging_factory: IWICImagingFactory =
        match unsafe { CoCreateInstance(&CLSID_WICImagingFactory, None, CLSCTX_ALL) } {
            Ok(factory) => factory,
            Err(_) => return Ok(String::new()),
        };

    // 创建位图
    let wic_bitmap =
        match unsafe { imaging_factory.CreateBitmapFromHBITMAP(bitmap, HPALETTE(ptr::null_mut()), WICBitmapUseAlpha) } {
            Ok(bmp) => bmp,
            Err(_) => return Ok(String::new()),
        };

    let source_rect = WICRect {
        X: 0,
        Y: 0,
        Width: 128,
        Height: 128,
    };

    // 获取像素格式
    let pixel_format = match unsafe { wic_bitmap.GetPixelFormat() } {
        Ok(format) => format,
        Err(_) => return Ok(String::new()),
    };

    // 处理像素数据
    let pixels = if pixel_format == GUID_WICPixelFormat32bppBGRA
        || pixel_format == GUID_WICPixelFormat32bppRGBA
    {
        let mut pixels = vec![0u8; 128 * 128 * 4];
        if let Err(_) = unsafe { wic_bitmap.CopyPixels(&source_rect, 128 * 4, &mut pixels) } {
            return Ok(String::new());
        }

        // 如果是 BGRA 格式，转换为 RGBA
        if pixel_format == GUID_WICPixelFormat32bppBGRA {
            for chunk in pixels.chunks_exact_mut(4) {
                chunk.swap(0, 2);
            }
        }
        pixels
    } else {
        return Ok(String::new());
    };

    // 创建图像缓冲区
    let img_buffer = match ImageBuffer::<Rgba<u8>, _>::from_raw(128, 128, pixels) {
        Some(buffer) => buffer,
        None => return Ok(String::new()),
    };

    let img = DynamicImage::ImageRgba8(img_buffer);

    // 保存为 PNG
    let output_file = match File::create(&output_path) {
        Ok(file) => file,
        Err(_) => return Ok(String::new()),
    };
    let writer = BufWriter::new(output_file);
    let encoder = PngEncoder::new(writer);

    if let Err(_) = encoder.write_image(
        img.as_bytes(),
        img.width(),
        img.height(),
        img.color().into(),
    ) {
        return Ok(String::new());
    }

    Ok(output_path.display().to_string())
}
