use std::fs::{self, File};
use std::io::BufWriter;
use std::path::PathBuf;

use image::codecs::png::PngEncoder;
use image::ImageEncoder;
use scraper::{Html, Selector};
use url::Url;

use crate::utils::error::{AppError, AppResult};
use crate::utils::path::get_myhelper_path;
use crate::utils::reqwest::create_web_client;

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

const ICON_SIZE: u32 = 32;

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
    let document = Html::parse_document(html);
    let mut urls = Vec::new();

    for (selector_str, attr) in ICON_SELECTORS {
        if let Ok(selector) = Selector::parse(selector_str) {
            if let Some(element) = document.select(&selector).next() {
                if let Some(href) = element.value().attr(attr) {
                    urls.push(href.to_string());
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
pub async fn get_web_icon(url: String) -> AppResult<String> {
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
                return save_icon(img, &output_path).map_err(AppError::from);
            }
        }
    }

    // 尝试从 HTML 中查找图标
    let html = match client.get(url.as_str()).send().await {
        Ok(response) if response.status().is_success() => match response.text().await {
            Ok(text) => text,
            Err(e) => {
                println!("Failed to get HTML content: {}", e);
                return Err(
                    IconError::NetworkError("Failed to get HTML content".to_string()).into(),
                );
            }
        },
        Ok(_) => return Err(IconError::NetworkError("Failed to get webpage".to_string()).into()),
        Err(e) if e.is_timeout() => {
            return Err(IconError::NetworkError("Request timeout".to_string()).into());
        }
        Err(e) => {
            return Err(IconError::NetworkError(e.to_string()).into());
        }
    };

    // 在同步代码中提取所有可能图标URL
    let icon_urls = extract_icon_urls(&html);

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
                return save_icon(img, &output_path).map_err(AppError::from);
            }
        }
    }

    Err(IconError::NotFound.into())
}
