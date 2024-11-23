use crate::utils::error::{AppError, AppResult};
use std::sync::Mutex;
use x11::xlib::{
    self, Atom, Display, XDefaultRootWindow, XFree, XGetInputFocus, XGetWindowProperty,
    XInternAtom, XNextEvent, XOpenDisplay, XSelectInput,
};

static PREVIOUS_WINDOW: Mutex<Option<u64>> = Mutex::new(None);

/// 获取窗口标题
fn get_net_wm_name(display: *mut Display, window: u64) -> AppResult<String> {
    let mut actual_type: Atom = 0;
    let mut actual_format: i32 = 0;
    let mut nitems: u64 = 0;
    let mut bytes_after: u64 = 0;
    let mut prop: *mut u8 = std::ptr::null_mut();
    let net_wm_name_atom =
        unsafe { XInternAtom(display, b"_NET_WM_NAME\0".as_ptr() as _, xlib::False) };
    let result = unsafe {
        XGetWindowProperty(
            display,
            window,
            net_wm_name_atom,
            0,
            1024,
            xlib::False,
            xlib::AnyPropertyType as _,
            &mut actual_type,
            &mut actual_format,
            &mut nitems,
            &mut bytes_after,
            &mut prop,
        )
    };
    if result == xlib::Success as i32 && !prop.is_null() {
        let name = unsafe {
            std::ffi::CStr::from_ptr(prop as *const std::ffi::c_char)
                .to_string_lossy()
                .into_owned()
        };
        unsafe { XFree(prop as *mut _) };
        Ok(name)
    } else {
        Err(AppError::Error(format!("{}", window)))
    }
}

/// 开始观察应用程序切换
pub fn observe_app() -> AppResult<()> {
    std::thread::spawn(|| unsafe {
        let display = XOpenDisplay(std::ptr::null_mut());
        if display.is_null() {
            return;
        }

        let root_window = XDefaultRootWindow(display);
        XSelectInput(
            display,
            root_window,
            xlib::FocusChangeMask | xlib::PropertyChangeMask,
        );

        loop {
            let mut event = std::mem::zeroed();
            XNextEvent(display, &mut event);

            let mut window: u64 = 0;
            let mut revert_to_return: i32 = 0;
            XGetInputFocus(display, &mut window, &mut revert_to_return);

            if window == 1 {
                continue;
            }

            let wm_name = get_net_wm_name(display, window).unwrap_or_default();

            if wm_name.is_empty() || wm_name.eq("myhelper") {
                continue;
            }

            let mut previous_window = PREVIOUS_WINDOW.lock().unwrap();
            let _ = previous_window.insert(window);
        }
    });
    Ok(())
}

/// 获取前一个窗口的ID
pub fn get_previous_window() -> Option<u64> {
    PREVIOUS_WINDOW.lock()
        .map_err(|_| AppError::Error("Failed to acquire lock".to_string()))
        .ok()?
        .clone()
}
