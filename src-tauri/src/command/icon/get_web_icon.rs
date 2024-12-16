use std::fs::{self, File};
use std::io::BufWriter;
use std::path::PathBuf;
use std::time::Duration;

use image::codecs::png::PngEncoder;
use image::ImageEncoder;
use reqwest::blocking::Client;
use reqwest::header::{HeaderMap, HeaderValue, USER_AGENT};
use scraper::{Html, Selector};
use url::Url;

use crate::utils::path::get_myhelper_path;
use crate::utils::error::{AppError, AppResult};

const ICON_SELECTORS: &[(&str, &str)] = &[
    ("link[rel='apple-touch-icon-precomposed'][sizes='180x180']", "href"),
    ("link[rel='apple-touch-icon-precomposed'][sizes='192x192']", "href"),
    ("link[rel='apple-touch-icon-precomposed']", "href"),
    ("link[rel='apple-touch-icon'][sizes='180x180']", "href"),
    ("link[rel='apple-touch-icon'][sizes='192x192']", "href"),
    ("link[rel='apple-touch-icon']", "href"),
    ("link[rel='icon'][type='image/png'][sizes='192x192']", "href"),
    ("link[rel='icon'][type='image/png'][sizes='128x128']", "href"),
    ("link[rel='icon'][type='image/png']", "href"),
    ("link[rel='icon'][type='image/x-icon']", "href"),
    ("link[rel='shortcut icon']", "href"),
    ("meta[property='og:image']", "content"),
    ("meta[name='msapplication-TileImage']", "content"),
];

const ICON_SIZE: u32 = 32;
const REQUEST_TIMEOUT: Duration = Duration::from_secs(3);

#[derive(Debug)]
enum IconError {
    NetworkError(String),
    ParseError(String),
    IoError(String),
    NotFound,
}

impl From<IconError> for AppError {
    fn from(err: IconError) -> Self {
        match err {
            IconError::NetworkError(msg) => AppError::Error(format!("Network error: {}", msg)),
            IconError::ParseError(msg) => AppError::Error(format!("Parse error: {}", msg)),
            IconError::IoError(msg) => AppError::Error(format!("IO error: {}", msg)),
            IconError::NotFound => AppError::Error("No icon found".to_string()),
        }
    }
}

fn setup_client() -> Result<Client, IconError> {
    let mut headers = HeaderMap::new();
    let user_agent = match std::env::consts::OS {
        "windows" => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "macos" => "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "linux" => "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        _ => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    };
    headers.insert(USER_AGENT, HeaderValue::from_static(user_agent));

    Client::builder()
        .timeout(REQUEST_TIMEOUT)
        .redirect(reqwest::redirect::Policy::limited(10))
        .default_headers(headers)
        .build()
        .map_err(|e| IconError::NetworkError(e.to_string()))
}

fn try_load_icon(client: &Client, url: &str) -> Result<Option<Vec<u8>>, IconError> {
    match client.get(url).send() {
        Ok(response) if response.status().is_success() => {
            let data = response.bytes()
                .map_err(|e| IconError::NetworkError(e.to_string()))?;
            if !data.is_empty() {
                Ok(Some(data.to_vec()))
            } else {
                Ok(None)
            }
        }
        Ok(_) => Ok(None),
        Err(e) if e.is_timeout() => Err(IconError::NetworkError("Request timeout".to_string())),
        Err(e) => Err(IconError::NetworkError(e.to_string())),
    }
}

fn save_icon(img: image::DynamicImage, output_path: &PathBuf) -> Result<String, IconError> {
    let resized_img = img.resize_exact(ICON_SIZE, ICON_SIZE, image::imageops::FilterType::Lanczos3);
    let output_file = File::create(output_path)
        .map_err(|e| IconError::IoError(e.to_string()))?;
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
pub fn get_web_icon(url: &str) -> AppResult<String> {
    // 检查并补全 URL
    let url = if !url.starts_with("http://") && !url.starts_with("https://") {
        format!("https://{}", url)
    } else {
        url.to_string()
    };

    // 解析网站 URL
    let url = Url::parse(&url)
        .map_err(|e| IconError::ParseError(format!("Invalid URL: {}", e)))?;
    let domain = url
        .host_str()
        .ok_or_else(|| IconError::ParseError("Invalid URL: no host found".to_string()))?
        .replace(".", "_");

    // 获取用户目录
    let myhelper_path = get_myhelper_path()
        .map(|path| path.join("Image").join("WebIcon"))
        .map_err(IconError::IoError)?;
    if !myhelper_path.exists() {
        fs::create_dir_all(&myhelper_path)
            .map_err(|e| IconError::IoError(e.to_string()))?;
    }

    let output_path = myhelper_path.join(format!("{}.png", domain));
    let client = setup_client()?;

    // 优先尝试从 /favicon.ico 获取图标
    if let Ok(favicon_url) = url.join("/favicon.ico") {
        if let Ok(Some(data)) = try_load_icon(&client, favicon_url.as_str()) {
            if let Ok(img) = image::load_from_memory(&data) {
                return save_icon(img, &output_path).map_err(AppError::from);
            }
        }
    }

    // 如果没有找到 favicon.ico，尝试从 HTML 中查找
    let html = client.get(url.as_str())
        .send()
        .map_err(|e| IconError::NetworkError(e.to_string()))?
        .text()
        .map_err(|e| IconError::NetworkError(e.to_string()))?;

    let document = Html::parse_document(&html);
    
    for (selector_str, attr) in ICON_SELECTORS {
        if let Ok(selector) = Selector::parse(selector_str) {
            if let Some(element) = document.select(&selector).next() {
                if let Some(href) = element.value().attr(attr) {
                    let icon_url = if href.starts_with("http") {
                        href.to_string()
                    } else {
                        match url.join(href) {
                            Ok(u) => u.to_string(),
                            Err(_) => continue,
                        }
                    };

                    if let Ok(Some(data)) = try_load_icon(&client, &icon_url) {
                        if let Ok(img) = image::load_from_memory(&data) {
                            return save_icon(img, &output_path).map_err(AppError::from);
                        }
                    }
                }
            }
        }
    }

    Err(IconError::NotFound.into())
}
