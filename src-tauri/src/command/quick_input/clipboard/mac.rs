use crate::utils::error::AppResult;
use cocoa::base::{id, nil};
use cocoa::foundation::{NSAutoreleasePool, NSString};
use objc::declare::ClassDecl;
use objc::runtime::{Class, Object, Sel};
use objc::{msg_send, sel, sel_impl};
use once_cell::sync::OnceCell;
use parking_lot::Mutex;
use std::ffi::CStr;
use std::thread;

static PREVIOUS_WINDOW: OnceCell<Mutex<Option<i32>>> = OnceCell::new();

fn get_previous_window_mutex() -> &'static Mutex<Option<i32>> {
    PREVIOUS_WINDOW.get_or_init(|| Mutex::new(None))
}

/// 应用程序激活回调
extern "C" fn application_did_activate(_self: &Object, _cmd: Sel, notification: id) {
    unsafe {
        let ns_app_key = NSString::alloc(nil).init_str("NSWorkspaceApplicationKey");

        let user_info: id = msg_send![notification, userInfo];
        if user_info == nil {
            return;
        }

        let app: id = msg_send![user_info, objectForKey: ns_app_key];
        if app == nil {
            return;
        }

        let localized_name: id = msg_send![app, localizedName];
        let name_str: *const i8 = msg_send![localized_name, UTF8String];
        let name_cstr = CStr::from_ptr(name_str);
        let name = name_cstr.to_str().unwrap_or("Unknown").to_string();

        if name == "myhelper" {
            return;
        }

        let process_id: i32 = msg_send![app, processIdentifier];

        let mut previous_window = get_previous_window_mutex().lock();
        let _ = previous_window.insert(process_id);
    }
}

/// 开始观察应用程序切换
pub fn observe_app() -> AppResult<()> {
    thread::spawn(|| unsafe {
        let _pool = NSAutoreleasePool::new(nil);

        let superclass = Class::get("NSObject").unwrap();
        let mut decl = ClassDecl::new("AppObserver", superclass).unwrap();
        decl.add_method(
            sel!(applicationDidActivate:),
            application_did_activate as extern "C" fn(&Object, Sel, id),
        );
        let observer_class = decl.register();
        let observer: id = msg_send![observer_class, new];

        let workspace: id = msg_send![Class::get("NSWorkspace").unwrap(), sharedWorkspace];
        let notification_center: id = msg_send![workspace, notificationCenter];
        let ns_notification_name =
            NSString::alloc(nil).init_str("NSWorkspaceDidActivateApplicationNotification");

        let _: id = msg_send![notification_center,
            addObserver: observer
            selector: sel!(applicationDidActivate:)
            name: ns_notification_name
            object: nil
        ];

        let run_loop: id = msg_send![Class::get("NSRunLoop").unwrap(), currentRunLoop];
        let _: () = msg_send![run_loop, run];
    });
    Ok(())
}

/// 获取前一个窗口的进程ID
pub fn get_previous_window() -> Option<i32> {
    get_previous_window_mutex().lock().clone()
}
