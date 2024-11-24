use crate::utils::error::{AppError, AppResult};
use image::codecs::png::PngEncoder;
use image::ImageEncoder;
use image::{DynamicImage, ImageBuffer, Rgba};
use rand::distributions::Alphanumeric;
use rand::{thread_rng, Rng};
use std::fs::{self, File};
use std::io::BufWriter;
use std::ptr::null_mut;
use winapi::ctypes::c_void;
use winapi::shared::windef::{HBITMAP, HICON};
use winapi::um::shellapi::{SHGetFileInfoW, SHFILEINFOW, SHGFI_ICON};
use winapi::um::wingdi::{
    CreateCompatibleDC, DeleteDC, DeleteObject, GetDIBits, GetObjectW, BITMAP, BITMAPINFO,
    BITMAPINFOHEADER, RGBQUAD,
};
use winapi::um::winuser::{DestroyIcon, GetIconInfo, ICONINFO};

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

    let exe_path_w: Vec<u16> = exe_path.encode_utf16().chain(Some(0)).collect();
    let mut shinfo: SHFILEINFOW = unsafe { std::mem::zeroed() };

    if unsafe {
        SHGetFileInfoW(
            exe_path_w.as_ptr(),
            0,
            &mut shinfo,
            std::mem::size_of::<SHFILEINFOW>() as u32,
            SHGFI_ICON,
        )
    } == 0
    {
        return Ok(String::new());
    }

    let hicon: HICON = shinfo.hIcon;
    if hicon.is_null() {
        return Ok(String::new());
    }

    let icon_info = get_icon_info(hicon)?;
    let bmp = get_bitmap(&icon_info)?;

    let (width, height) = (bmp.bmWidth as usize, bmp.bmHeight as usize);
    let pixels = match get_pixels(hicon, &icon_info, width, height) {
        Ok(p) => p,
        Err(_) => {
            unsafe { cleanup_resources(icon_info, hicon) };
            return Ok(String::new());
        }
    };

    // 创建图像缓冲区并保存
    let img_buffer = ImageBuffer::<Rgba<u8>, _>::from_raw(width as u32, height as u32, pixels)
        .ok_or(AppError::Error("Failed to create image buffer".to_string()))?;
    let img = DynamicImage::ImageRgba8(img_buffer);
    let output_file = File::create(&output_path).map_err(|e| e.to_string())?;
    let mut writer = BufWriter::new(output_file);
    let encoder = PngEncoder::new(&mut writer);
    encoder
        .write_image(
            img.as_bytes(),
            img.width(),
            img.height(),
            img.color().into(),
        )
        .map_err(|e| e.to_string())?;

    unsafe {
        cleanup_resources(icon_info, hicon);
    }

    Ok(output_path.display().to_string())
}

unsafe fn cleanup_resources(icon_info: ICONINFO, hicon: HICON) {
    DeleteObject(icon_info.hbmColor as *mut _ as *mut c_void);
    DeleteObject(icon_info.hbmMask as *mut _ as *mut c_void);
    DestroyIcon(hicon);
}

/// 获取图标信息
fn get_icon_info(hicon: HICON) -> AppResult<ICONINFO> {
    let mut icon_info: ICONINFO = unsafe { std::mem::zeroed() };
    if unsafe { GetIconInfo(hicon, &mut icon_info) == 0 } {
        return Err(AppError::Error("Failed to get icon info".to_string()));
    }
    Ok(icon_info)
}

/// 获取位图信息
fn get_bitmap(icon_info: &ICONINFO) -> AppResult<BITMAP> {
    let mut bmp: BITMAP = unsafe { std::mem::zeroed() };
    let result = unsafe {
        GetObjectW(
            icon_info.hbmColor as *mut _ as *mut c_void,
            std::mem::size_of::<BITMAP>() as i32,
            &mut bmp as *mut _ as *mut _,
        )
    };
    if result == 0 {
        return Err(AppError::Error("Failed to get bitmap".to_string()));
    }
    Ok(bmp)
}

/// 获取图标像素数据
fn get_pixels(
    hicon: HICON,
    icon_info: &ICONINFO,
    width: usize,
    height: usize,
) -> AppResult<Vec<u8>> {
    let _ = hicon;
    let hdc = unsafe { CreateCompatibleDC(null_mut()) };
    if hdc.is_null() {
        return Err(AppError::Error("Failed to create compatible DC".to_string()));
    }

    let mut pixels = vec![0u8; width * height * 4]; // 4 bytes per pixel (RGBA)

    let bmp_info = BITMAPINFO {
        bmiHeader: BITMAPINFOHEADER {
            biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
            biWidth: width as i32,
            biHeight: height as i32,
            biPlanes: 1,
            biBitCount: 32,
            biCompression: 0,
            biSizeImage: 0,
            biXPelsPerMeter: 0,
            biYPelsPerMeter: 0,
            biClrUsed: 0,
            biClrImportant: 0,
        },
        bmiColors: [RGBQUAD {
            rgbBlue: 0,
            rgbGreen: 0,
            rgbRed: 0,
            rgbReserved: 0,
        }; 1],
    };

    let success = unsafe {
        GetDIBits(
            hdc,
            icon_info.hbmColor as HBITMAP,
            0,
            height as u32,
            pixels.as_mut_ptr() as *mut _,
            &bmp_info as *const _ as *mut _,
            0,
        )
    };

    if success == 0 {
        return Err(AppError::Error("Failed to get DIB bits".to_string()));
    }

    // 将颜色通道从 BGRA 转换为 RGBA，并垂直翻转图像
    let mut pixels_rgba = vec![0u8; pixels.len()];
    for y in 0..height {
        let src_start = (height - y - 1) * width * 4; // BGRA 行
        let dst_start = y * width * 4; // RGBA 行

        for x in 0..width {
            let src_index = src_start + x * 4;
            let dst_index = dst_start + x * 4;
            let (b, g, r, a) = (
                pixels[src_index],
                pixels[src_index + 1],
                pixels[src_index + 2],
                pixels[src_index + 3],
            );
            pixels_rgba[dst_index] = r; // R
            pixels_rgba[dst_index + 1] = g; // G
            pixels_rgba[dst_index + 2] = b; // B
            pixels_rgba[dst_index + 3] = a; // A
        }
    }

    unsafe { DeleteDC(hdc) };
    Ok(pixels_rgba)
}
