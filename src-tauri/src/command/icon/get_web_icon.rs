use std::fs::{self, File};
use std::io::BufWriter;
use std::path::PathBuf;

use image::codecs::png::PngEncoder;
use image::ImageEncoder;
use url::Url;

use crate::services::logger::{LogEntry, Logger};
use crate::utils::error::AppError;
use crate::utils::path::get_myhelper_path;
use crate::utils::reqwest::create_web_client;
use crate::utils::response::{ApiResponse, ApiStatusCode};
use tl::ParserOptions;

const ICON_SIZE: u32 = 32;

const ICON_SELECTORS: &[(&str, &str)] = &[
    (
        "link[rel='apple-touch-icon-precomposed'][sizes='180x180']",
        "href",
    ),
    (
        "link[rel='apple-touch-icon-precomposed'][sizes='192x192']",
        "href",
    ),
    ("link[rel='apple-touch-icon-precomposed']", "href"),
    ("link[rel='apple-touch-icon'][sizes='180x180']", "href"),
    ("link[rel='apple-touch-icon'][sizes='192x192']", "href"),
    ("link[rel='apple-touch-icon']", "href"),
    (
        "link[rel='icon'][type='image/png'][sizes='192x192']",
        "href",
    ),
    (
        "link[rel='icon'][type='image/png'][sizes='128x128']",
        "href",
    ),
    ("link[rel='icon'][type='image/png']", "href"),
    ("link[rel='icon']", "href"),
    ("link[rel='icon'][type='image/x-icon']", "href"),
    ("link[rel='shortcut icon']", "href"),
    ("meta[property='og:image']", "content"),
    ("meta[name='msapplication-TileImage']", "content"),
];

#[derive(Debug)]
enum IconError {
    NetworkError(String),
    ParseError(String),
    IoError(String),
}

impl From<IconError> for AppError {
    fn from(err: IconError) -> Self {
        match err {
            IconError::NetworkError(msg) => AppError::Error(format!("Network error: {}", msg)),
            IconError::ParseError(msg) => AppError::Error(format!("Parse error: {}", msg)),
            IconError::IoError(msg) => AppError::Error(format!("IO error: {}", msg)),
        }
    }
}

async fn try_load_icon(client: &reqwest::Client, url: &str) -> Result<Option<Vec<u8>>, IconError> {
    match client.get(url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.bytes().await {
                    Ok(data) if !data.is_empty() => Ok(Some(data.to_vec())),
                    _ => Ok(None),
                }
            } else {
                Ok(None)
            }
        }
        Err(_) => Ok(None),
    }
}

fn save_icon(img: image::DynamicImage, output_path: &PathBuf) -> Result<String, IconError> {
    let resized_img = img.resize_exact(ICON_SIZE, ICON_SIZE, image::imageops::FilterType::Lanczos3);
    let output_file = File::create(output_path).map_err(|e| IconError::IoError(e.to_string()))?;
    let writer = BufWriter::new(output_file);

    let encoder = PngEncoder::new(writer);
    encoder
        .write_image(
            resized_img.as_bytes(),
            resized_img.width(),
            resized_img.height(),
            resized_img.color().into(),
        )
        .map_err(|e| IconError::IoError(e.to_string()))?;

    Ok(output_path.display().to_string())
}

fn extract_icon_urls(html: &str) -> Vec<String> {
    let mut urls = Vec::new();

    // 解析HTML
    let dom = match tl::parse(html, ParserOptions::default()) {
        Ok(dom) => dom,
        Err(_) => return urls,
    };

    let parser = dom.parser();

    for &(selector, attr) in ICON_SELECTORS {
        // 使用CSS选择器查找元素
        if let Some(mut selector_iter) = dom.query_selector(selector) {
            for node_handle in selector_iter.by_ref() {
                if let Some(node) = node_handle.get(parser) {
                    if let Some(tag) = node.as_tag() {
                        // 获取指定属性的值
                        if let Some(attr_value) = tag.attributes().get(attr) {
                            if let Some(url_str) = attr_value {
                                let url_str = url_str.as_utf8_str().to_string();
                                if !url_str.is_empty() && !urls.contains(&url_str) {
                                    urls.push(url_str);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    urls
}

/// 获取网站图标
///
/// # Arguments
///
/// * `url` - 网站URL
///
/// # Returns
///
/// * `AppResult<String>` - 成功返回保存的图标文件路径
#[tauri::command]
pub async fn get_web_icon(url: String) -> Result<ApiResponse<String>, AppError> {
    // 检查并补全 URL
    let url = if !url.starts_with("http://") && !url.starts_with("https://") {
        format!("https://{}", url)
    } else {
        url
    };

    // 解析网站 URL
    let url = Url::parse(&url).map_err(|e| IconError::ParseError(format!("Invalid URL: {}", e)))?;
    let domain = url
        .host_str()
        .ok_or_else(|| IconError::ParseError("Invalid URL: no host found".to_string()))?
        .replace(".", "_");

    // 获取用户目录
    let myhelper_path = get_myhelper_path()
        .map(|path| path.join("Image").join("WebIcon"))
        .map_err(IconError::IoError)?;
    if !myhelper_path.exists() {
        fs::create_dir_all(&myhelper_path).map_err(|e| IconError::IoError(e.to_string()))?;
    }

    let output_path = myhelper_path.join(format!("{}.png", domain));
    let client = create_web_client().map_err(|e| IconError::NetworkError(e.to_string()))?;

    // 优先尝试从 /favicon.ico 获取图标
    if let Ok(favicon_url) = url.join("/favicon.ico") {
        if let Ok(Some(data)) = try_load_icon(&client, favicon_url.as_str()).await {
            if let Ok(img) = image::load_from_memory(&data) {
                let _ = Logger::write_log(LogEntry {
                    level: "info".to_string(),
                    message: format!("获取网站图标成功: {} (方案: favicon.ico)", domain),
                    timestamp: String::new(),
                    details: Some(favicon_url.to_string()),
                });
                return Ok(ApiResponse::success(
                    save_icon(img, &output_path).map_err(AppError::from)?,
                ));
            }
        }
    }

    // 尝试从 HTML 中查找图标
    let html_result = client.get(url.as_str()).send().await;

    if let Ok(response) = html_result {
        if response.status().is_success() {
            if let Ok(text) = response.text().await {
                // 使用 tl 解析HTML并提取图标 URL
                let icon_urls = extract_icon_urls(&text);

                // 异步尝试获取每个图标
                for href in icon_urls {
                    let icon_url = if href.starts_with("http") {
                        href
                    } else {
                        match url.join(&href) {
                            Ok(u) => u.to_string(),
                            Err(_) => continue,
                        }
                    };

                    if let Ok(Some(data)) = try_load_icon(&client, &icon_url).await {
                        if let Ok(img) = image::load_from_memory(&data) {
                            let _ = Logger::write_log(LogEntry {
                                level: "info".to_string(),
                                message: format!("获取网站图标成功: {} (方案: HTML解析)", domain),
                                timestamp: String::new(),
                                details: Some(icon_url),
                            });
                            return Ok(ApiResponse::success(
                                save_icon(img, &output_path).map_err(AppError::from)?,
                            ));
                        }
                    }
                }
            }
        }
    }

    // 备选方案1：使用 Favicon.im 服务
    let domain = url.host_str().unwrap_or("");
    let favicon_im_url = format!("https://favicon.im/{}?larger=true", domain);

    if let Ok(Some(data)) = try_load_icon(&client, &favicon_im_url).await {
        if let Ok(img) = image::load_from_memory(&data) {
            let _ = Logger::write_log(LogEntry {
                level: "info".to_string(),
                message: format!("获取网站图标成功: {} (方案: Favicon.im)", domain),
                timestamp: String::new(),
                details: Some(favicon_im_url),
            });
            return Ok(ApiResponse::success(
                save_icon(img, &output_path).map_err(AppError::from)?,
            ));
        }
    }

    // 备选方案2：使用 Google Favicon 服务
    let google_favicon_url = format!("https://www.google.com/s2/favicons?domain={}&sz=64", domain);

    if let Ok(Some(data)) = try_load_icon(&client, &google_favicon_url).await {
        if let Ok(img) = image::load_from_memory(&data) {
            let _ = Logger::write_log(LogEntry {
                level: "info".to_string(),
                message: format!("获取网站图标成功: {} (方案: Google服务)", domain),
                timestamp: String::new(),
                details: Some(google_favicon_url),
            });
            return Ok(ApiResponse::success(
                save_icon(img, &output_path).map_err(AppError::from)?,
            ));
        }
    }

    let _ = Logger::write_log(LogEntry {
        level: "warn".to_string(),
        message: format!("获取网站图标失败: {} (所有方案都失败)", domain),
        timestamp: String::new(),
        details: Some(url.to_string()),
    });

    Ok(ApiResponse::error(
        ApiStatusCode::ErrFileNotFound,
        "No icon found".to_string(),
    ))
}
