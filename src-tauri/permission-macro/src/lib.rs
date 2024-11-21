use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, LitStr, parse::Parse, parse::ParseStream, Token, FnArg, Pat};
use syn::punctuated::Punctuated;

// 定义一个解析多个字符串的结构
struct PermissionInput {
    windows: Punctuated<LitStr, Token![,]>,
}

impl Parse for PermissionInput {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        Ok(PermissionInput {
            windows: Punctuated::parse_terminated(input)?,
        })
    }
}

/// 窗口权限检查宏
/// 
/// # 示例
/// ```rust
/// #[permission("main", "label")]  // 允许 main 和 label 窗口调用
/// #[tauri::command]
/// pub fn get_plugin_config(keys: Vec<String>) -> AppResult<Option<Value>> {
///     // 函数实现
/// }
/// ```
#[proc_macro_attribute]
pub fn permission(attr: TokenStream, item: TokenStream) -> TokenStream {
    // 解析属性中的窗口标识列表
    let input = parse_macro_input!(attr as PermissionInput);
    let window_labels: Vec<String> = input.windows
        .iter()
        .map(|lit| lit.value())
        .collect();
    
    let input_fn = parse_macro_input!(item as syn::ItemFn);
    
    // 检查函数参数中是否已经有 window 参数
    let has_window_param = input_fn.sig.inputs.iter().any(|arg| {
        if let FnArg::Typed(pat_type) = arg {
            if let Pat::Ident(pat_ident) = &*pat_type.pat {
                return pat_ident.ident == "window";
            }
        }
        false
    });

    // 获取函数信息
    let fn_name = &input_fn.sig.ident;
    let fn_args = &input_fn.sig.inputs;
    let fn_return = &input_fn.sig.output;
    let fn_body = &input_fn.block;
    let attrs = &input_fn.attrs;

    let expanded = if has_window_param {
        // 如果函数已经有 window 参数，只添加权限检查
        quote! {
            #(#attrs)*
            pub fn #fn_name(#fn_args) #fn_return {
                // 检查窗口权限
                let window_label = window.label();
                if ![#(#window_labels),*].contains(&window_label) {
                    return Err(crate::utils::error::AppError::Error(
                        format!("该窗口没有权限执行此操作")
                    ));
                }
                
                // 执行原始函数体
                #fn_body
            }
        }
    } else {
        // 如果函数没有 window 参数，注入 window 参数并添加权限检查
        quote! {
            #(#attrs)*
            pub fn #fn_name(window: tauri::Window, #fn_args) #fn_return {
                // 检查窗口权限
                let window_label = window.label();
                if ![#(#window_labels),*].contains(&window_label) {
                    return Err(crate::utils::error::AppError::Error(
                        format!("该窗口没有权限执行此操作")
                    ));
                }
                
                // 执行原始函数体
                #fn_body
            }
        }
    };

    expanded.into()
}