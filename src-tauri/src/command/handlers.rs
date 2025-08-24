// 应用处理器宏，按功能模块分组
#[macro_export]
macro_rules! generate_app_handlers {
    () => {
        tauri::generate_handler![
            // 窗口管理
            set_window_size,
            create_new_window,
            window_control,
            open_devtools,
            // 图标管理  
            get_app_icon,
            get_web_icon,
            set_local_icon,
            set_logo,
            delete_icon,
            // 配置管理
            get_config,
            set_config,
            delete_config,
            get_config_value,
            get_config_values_batch,
            set_config_value,
            delete_config_value,
            set_plugin_config_value,
            get_plugin_config_value,
            delete_plugin_config_value,
            // 宠物配置管理
            set_pet_config,
            get_pet_config,
            delete_pet_config,
            // 剪贴板和快捷输入
            start_clipboard_listener,
            stop_clipboard_listener,
            write_clipboard,
            paste,
            // 插件管理
            mh_plugin_install,
            mh_plugin_install_local,
            mh_plugin_uninstall,
            mh_plugin_analyze_package,
            mh_get_self_config,
            mh_set_self_config,
            mh_delete_self_config,
            // 状态和数据
            set_global_data,
            get_global_data,
            delete_global_data,
            // 通用功能
            file_exists,
            open_web_or_app,
            write_log,
            set_hotkey_enabled,
        ]
    };
}

