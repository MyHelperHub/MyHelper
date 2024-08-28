use std::fs::File;
use std::io::BufWriter;
use std::path::Path;
use std::ptr::null_mut;
use tauri::ipc::InvokeError;
use winapi::ctypes::c_void;
use winapi::shared::windef::{HBITMAP, HICON};
// use winapi::um::libloaderapi::GetModuleHandleW; // 移除这一行
use winapi::um::shellapi::{SHGetFileInfoW, SHFILEINFOW, SHGFI_ICON};
use winapi::um::wingdi::{
    CreateCompatibleDC, DeleteDC, DeleteObject, GetDIBits, GetObjectW, BITMAP, BITMAPINFO,
    BITMAPINFOHEADER, RGBQUAD,
};
use winapi::um::winuser::{DestroyIcon, GetIconInfo, ICONINFO};

use image::{DynamicImage, ImageBuffer, ImageOutputFormat, Rgba};

#[tauri::command]
pub fn extract_icon_from_exe(exe_path: String, output_path: String) -> Result<String, InvokeError> {
    // 修改这里
    let exe_path_w: Vec<u16> = exe_path.encode_utf16().chain(Some(0)).collect();
    let mut shinfo: SHFILEINFOW = unsafe { std::mem::zeroed() };

    // 获取图标句柄
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
        return Err(InvokeError::from("Failed to get icon".to_string()));
    }

    let mut icon_info: ICONINFO = unsafe { std::mem::zeroed() };
    unsafe {
        if GetIconInfo(hicon, &mut icon_info) == 0 {
            DestroyIcon(hicon);
            return Err(InvokeError::from("Failed to get icon info".to_string()));
        }
    }

    let mut bmp: BITMAP = unsafe { std::mem::zeroed() };
    unsafe {
        GetObjectW(
            icon_info.hbmColor as *mut _ as *mut c_void, // 这里修改为 *mut c_void
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
        return Err(InvokeError::from(
            "Failed to create compatible DC".to_string(),
        ));
    }

    let mut pixels = vec![0u8; (bmp.bmWidth * bmp.bmHeight * 4) as usize];
    let success = unsafe {
        GetDIBits(
            hdc,
            icon_info.hbmColor as HBITMAP,
            0,
            bmp.bmHeight as u32,
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
        return Err(InvokeError::from("Failed to get DIB bits".to_string()));
    }

    let img_buffer =
        ImageBuffer::<Rgba<u8>, _>::from_raw(bmp.bmWidth as u32, bmp.bmHeight as u32, pixels)
            .ok_or("Failed to create image buffer")?;

    let img = DynamicImage::ImageRgba8(img_buffer);
    let output_file =
        File::create(Path::new(&output_path)).map_err(|e| InvokeError::from(e.to_string()))?; // 这里修改为 InvokeError
    let mut writer = BufWriter::new(output_file);
    img.write_to(&mut writer, ImageOutputFormat::Png)
        .map_err(|e| InvokeError::from(e.to_string()))?; // 这里修改为 InvokeError

    unsafe {
        DeleteDC(hdc);
        DeleteObject(icon_info.hbmColor as *mut _ as *mut c_void);
        DeleteObject(icon_info.hbmMask as *mut _ as *mut c_void);
        DestroyIcon(hicon);
    }

    println!("图标已保存到 {}", output_path); // 打印保存路径
    Ok(output_path.to_string()) // 返回保存路径
}
