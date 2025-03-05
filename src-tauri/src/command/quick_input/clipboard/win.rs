use crate::utils::error::{AppError, AppResult};
use std::ffi::OsString;
use std::os::windows::ffi::OsStringExt;
use std::ptr;
use parking_lot::Mutex;
use once_cell::sync::OnceCell;
use winapi::shared::minwindef::DWORD;
use winapi::shared::windef::{HWINEVENTHOOK, HWND};
use winapi::um::winuser::{
    GetWindowTextLengthW, GetWindowTextW, SetWinEventHook, EVENT_SYSTEM_FOREGROUND,
    WINEVENT_OUTOFCONTEXT,
};

// 使用OnceCell初始化静态Mutex，提高性能和内存安全性
static PREVIOUS_WINDOW: OnceCell<Mutex<Option<isize>>> = OnceCell::new();

fn get_previous_window_mutex() -> &'static Mutex<Option<isize>> {
    PREVIOUS_WINDOW.get_or_init(|| Mutex::new(None))
}

unsafe fn get_window_title(hwnd: HWND) -> String {
    let length = GetWindowTextLengthW(hwnd);

    if length == 0 {
        return String::new();
    }

    let mut buffer: Vec<u16> = vec![0; (length + 1) as usize];

    GetWindowTextW(hwnd, buffer.as_mut_ptr(), length + 1);

    OsString::from_wide(&buffer[..length as usize])
        .to_string_lossy()
        .into_owned()
}

// 定义事件钩子回调函数
unsafe extern "system" fn event_hook_callback(
    _h_win_event_hook: HWINEVENTHOOK,
    event: DWORD,
    hwnd: HWND,
    _id_object: i32,
    _id_child: i32,
    _dw_event_thread: DWORD,
    _dwms_event_time: DWORD,
) {
    if event == EVENT_SYSTEM_FOREGROUND {
        let window_title = get_window_title(hwnd);

        if window_title == "myhelper" {
            return;
        }

        let mut previous_window = get_previous_window_mutex().lock();
        let _ = previous_window.insert(hwnd as isize);
    }
}

pub fn observe_app() -> AppResult<()> {
    unsafe {
        let hook = SetWinEventHook(
            EVENT_SYSTEM_FOREGROUND,
            EVENT_SYSTEM_FOREGROUND,
            ptr::null_mut(),
            Some(event_hook_callback),
            0,
            0,
            WINEVENT_OUTOFCONTEXT,
        );

        if hook.is_null() {
            return Err(AppError::Error("Failed to set event hook".to_string()));
        }
    }
    Ok(())
}

pub fn get_previous_window() -> Option<isize> {
    get_previous_window_mutex().lock().clone()
}
