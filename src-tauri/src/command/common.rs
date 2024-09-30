use tauri::{LogicalSize, Manager, WebviewUrl, WebviewWindowBuilder};

/** 设置窗口大小的命令 */
#[tauri::command]
pub async fn set_window_size(
    app_handle: tauri::AppHandle,
    width: f64,
    height: f64,
) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        window
            .set_size(tauri::Size::Logical(LogicalSize { width, height }))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/** 封装创建新窗口的异步函数 */
#[tauri::command]
pub async fn create_new_window(
    app_handle: tauri::AppHandle,
    window_id: String,
    title: String,
    url: String,
    size: Option<(f64, f64)>,
    position: Option<(f64, f64)>,
) -> Result<(), String> {
    // 克隆 app_handle
    let app_handle_clone = app_handle.clone();

    let mut builder =
        WebviewWindowBuilder::new(&app_handle_clone, &window_id, WebviewUrl::App(url.into()))
            .title(title)
            .decorations(false);

    // 设置窗口大小
    let (width, height) = match size {
        Some((w, h)) => (w, h),
        None => (400.0, 300.0), // 默认大小
    };
    builder = builder.inner_size(width, height);

    // 如果未指定位置，则计算窗口中心位置
    let (x, y) = if position.is_some() {
        position.unwrap()
    } else {
        // 获取主屏幕的大小
        let primary_monitor = app_handle.primary_monitor().map_err(|e| e.to_string())?;
        
        let monitor = primary_monitor.expect("未找到主监视器");
        let monitor_size = monitor.size(); 

        // 计算窗口的左上角位置，使窗口位于屏幕中央
        let x = (monitor_size.width as f64 - width) / 2.0;  
        let y = (monitor_size.height as f64 - height) / 2.0; 
        (x, y)
    };

    // 设置窗口位置
    builder = builder.position(x, y);

    // 创建并显示窗口
    let new_window = builder.build().map_err(|e| e.to_string())?;
    new_window.show().map_err(|e| e.to_string())?;

    Ok(())
}

/** 封装关闭窗口的异步函数 */
#[tauri::command]
pub async fn close_new_window(
    app_handle: tauri::AppHandle,
    window_id: String,
) -> Result<(), String> {
    // 通过 window_id 获取窗口实例
    if let Some(window) = app_handle.get_webview_window(&window_id) {
        // 关闭窗口
        window.close().map_err(|e| e.to_string())?;
    } else {
        println!("未找到窗口: {}", window_id);
    }
    Ok(())
}
