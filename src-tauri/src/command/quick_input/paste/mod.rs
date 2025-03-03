#[cfg(target_os = "macos")]
mod mac;

#[cfg(target_os = "windows")]
mod win;

#[cfg(target_os = "linux")]
mod linux;

#[cfg(target_os = "macos")]
pub use mac::*;

#[cfg(target_os = "windows")]
pub use win::*;

#[cfg(target_os = "linux")]
pub use linux::*;

/// 等待指定的毫秒数
///
/// # Arguments
///
/// * `millis` - 等待时间（毫秒）
#[cfg(not(target_os = "macos"))]
pub fn wait(millis: u64) {
    use std::{thread, time};
    thread::sleep(time::Duration::from_millis(millis));
}
