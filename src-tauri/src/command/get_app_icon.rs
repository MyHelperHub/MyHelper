use image::{DynamicImage, ImageBuffer, ImageOutputFormat, Rgba};
use rand::distributions::Alphanumeric;
use rand::{thread_rng, Rng};
use std::env;
use std::fs::{self, File};
use std::io::BufWriter;
use std::path::Path;
use std::ptr::null_mut;
use winapi::ctypes::c_void;
use winapi::shared::windef::{HBITMAP, HICON};
use winapi::um::shellapi::{SHGetFileInfoW, SHFILEINFOW, SHGFI_ICON};
use winapi::um::wingdi::{
    CreateCompatibleDC, DeleteDC, DeleteObject, GetDIBits, GetObjectW, BITMAP, BITMAPINFO,
    BITMAPINFOHEADER, RGBQUAD,
};
use winapi::um::winuser::{DestroyIcon, GetIconInfo, ICONINFO};

#[tauri::command]
pub fn get_app_icon(exe_path: &str) -> Result<String, String> {
    // 获取用户目录
    let home_dir = env::var("APPDATA").map_err(|e| e.to_string())?;
    let myhelper_path = Path::new(&home_dir)
        .join("MyHelper")
        .join("Image")
        .join("AppIcon");

    // 创建目录（如果不存在）
    if !myhelper_path.exists() {
        fs::create_dir_all(&myhelper_path).map_err(|e| e.to_string())?;
    }

    // 生成随机六位字符
    let random_chars: String = thread_rng()
        .sample_iter(&Alphanumeric)
        .take(6)
        .map(char::from)
        .collect();

    // 使用"app_image_" + 随机字符作为文件名
    let file_name = format!("app_image_{}.png", random_chars);
    let output_path = myhelper_path.join(file_name);

    let exe_path_w: Vec<u16> = exe_path.encode_utf16().chain(Some(0)).collect();
    let mut shinfo: SHFILEINFOW = unsafe { std::mem::zeroed() };

    unsafe {
        SHGetFileInfoW(
            exe_path_w.as_ptr(),
            0,
            &mut shinfo,
            std::mem::size_of::<SHFILEINFOW>() as u32,
            SHGFI_ICON,
        );
    }

    let hicon: HICON = shinfo.hIcon;
    if hicon.is_null() {
        return Err("Failed to get icon".to_string());
    }

    let mut icon_info: ICONINFO = unsafe { std::mem::zeroed() };
    unsafe {
        if GetIconInfo(hicon, &mut icon_info) == 0 {
            DestroyIcon(hicon);
            return Err("Failed to get icon info".to_string());
        }
    }

    let mut bmp: BITMAP = unsafe { std::mem::zeroed() };
    unsafe {
        GetObjectW(
            icon_info.hbmColor as *mut _ as *mut c_void,
            std::mem::size_of::<BITMAP>() as i32,
            &mut bmp as *mut _ as *mut _,
        );
    }

    let bmp_info_header = BITMAPINFOHEADER {
        biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
        biWidth: bmp.bmWidth,
        biHeight: bmp.bmHeight,
        biPlanes: 1,
        biBitCount: 32,
        biCompression: 0,
        biSizeImage: 0,
        biXPelsPerMeter: 0,
        biYPelsPerMeter: 0,
        biClrUsed: 0,
        biClrImportant: 0,
    };

    let mut bmp_info = BITMAPINFO {
        bmiHeader: bmp_info_header,
        bmiColors: [RGBQUAD {
            rgbBlue: 0,
            rgbGreen: 0,
            rgbRed: 0,
            rgbReserved: 0,
        }; 1],
    };

    let hdc = unsafe { CreateCompatibleDC(null_mut()) };
    if hdc.is_null() {
        unsafe {
            DeleteObject(icon_info.hbmColor as *mut _ as *mut c_void);
            DeleteObject(icon_info.hbmMask as *mut _ as *mut c_void);
            DestroyIcon(hicon);
        }
        return Err("Failed to create compatible DC".to_string());
    }

    let width = bmp.bmWidth as usize;
    let height = bmp.bmHeight as usize;
    let row_size = width * 4;
    let mut pixels = vec![0u8; row_size * height];

    let success = unsafe {
        GetDIBits(
            hdc,
            icon_info.hbmColor as HBITMAP,
            0,
            height as u32,
            pixels.as_mut_ptr() as *mut _,
            &mut bmp_info as *mut _,
            0,
        )
    };

    if success == 0 {
        unsafe {
            DeleteDC(hdc);
            DeleteObject(icon_info.hbmColor as *mut _ as *mut c_void);
            DeleteObject(icon_info.hbmMask as *mut _ as *mut c_void);
            DestroyIcon(hicon);
        }
        return Err("Failed to get DIB bits".to_string());
    }

    // 将颜色通道从 BGRA 调整为 RGBA 并垂直翻转图像
    let mut pixels_rgba = vec![0u8; pixels.len()];
    for y in 0..height {
        let src_start = (height - y - 1) * row_size;
        let dst_start = y * row_size;
        let src_row = &pixels[src_start..src_start + row_size];
        let dst_row = &mut pixels_rgba[dst_start..dst_start + row_size];

        for (i, chunk) in src_row.chunks_exact(4).enumerate() {
            let (b, g, r, a) = (chunk[0], chunk[1], chunk[2], chunk[3]);
            dst_row[i * 4] = r;
            dst_row[i * 4 + 1] = g;
            dst_row[i * 4 + 2] = b;
            dst_row[i * 4 + 3] = a;
        }
    }

    let img_buffer = ImageBuffer::<Rgba<u8>, _>::from_raw(width as u32, height as u32, pixels_rgba)
        .ok_or("Failed to create image buffer")?;

    let img = DynamicImage::ImageRgba8(img_buffer);
    let output_file = File::create(&output_path).map_err(|e| e.to_string())?;
    let mut writer = BufWriter::new(output_file);
    img.write_to(&mut writer, ImageOutputFormat::Png)
        .map_err(|e| e.to_string())?;

    unsafe {
        DeleteDC(hdc);
        DeleteObject(icon_info.hbmColor as *mut _ as *mut c_void);
        DeleteObject(icon_info.hbmMask as *mut _ as *mut c_void);
        DestroyIcon(hicon);
    }

    Ok(output_path.display().to_string())
}
