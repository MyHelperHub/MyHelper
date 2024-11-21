use image::codecs::png::PngEncoder;
use image::ImageEncoder;
use reqwest::blocking::Client;
use reqwest::header::USER_AGENT;
use scraper::{Html, Selector};
use std::fs::{self, File};
use std::io::BufWriter;
use std::time::Duration;
use url::Url;

use crate::utils::path::get_myhelper_path;
use crate::utils::error::{AppError, AppResult};

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
    let mut url = Url::parse(&url).map_err(|e| AppError::SystemError(format!("Invalid URL: {}", e)))?;
    let domain = url
        .host_str()
        .ok_or_else(|| AppError::SystemError("Invalid URL: no host found".to_string()))?
        .replace(".", "_");

    // 获取用户目录
    let myhelper_path = get_myhelper_path()
        .map(|path| path.join("Image").join("WebIcon"))
        .map_err(|e| AppError::SystemError(e))?;
    if !myhelper_path.exists() {
        fs::create_dir_all(&myhelper_path).map_err(|e| AppError::SystemError(e.to_string()))?;
    }

    let output_path = myhelper_path.join(format!("{}.png", domain));

    // 创建 HTTP 客户端并设置超时时间为 3 秒
    let client = Client::builder()
        .timeout(Duration::from_secs(3))
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()
        .map_err(|e| AppError::SystemError(format!("Failed to create HTTP client: {}", e)))?;

    // 优先尝试从 /favicon.ico 获取图标
    let favicon_url = url
        .join("/favicon.ico")
        .map_err(|e| AppError::SystemError(format!("Failed to join URL: {}", e)))?;
    let mut response = client.get(favicon_url.as_str()).send().map_err(|e| {
        if e.is_timeout() {
            AppError::SystemError("Request timeout".to_string())
        } else {
            AppError::SystemError(format!("Request failed: {}", e))
        }
    })?;

    if response.status().is_client_error() {
        // 如果返回的状态码是4xx，尝试从meta标签中获取图标
        url = response.url().clone();
        let user_agent = match std::env::consts::OS {
            "windows" => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "macos" => "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "linux" => "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            _ => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        };
        // 获取网页内容
        let html = client
            .get(url.as_str())
            .header(USER_AGENT, user_agent)
            .send()
            .map_err(|e| AppError::SystemError(format!("Failed to fetch webpage: {}", e)))?
            .text()
            .map_err(|e| AppError::SystemError(format!("Failed to read response: {}", e)))?;

        let document = Html::parse_document(&html);

        // 依次尝试获取 apple-touch-icon, og:image, icon, shortcut icon
        let selectors = [
            "link[rel='apple-touch-icon']",
            "meta[property='og:image']",
            "link[rel='icon']",
            "link[rel='shortcut icon']",
        ];

        let mut img_url = None;
        for selector_str in &selectors {
            let selector = Selector::parse(selector_str)
                .map_err(|e| AppError::SystemError(format!("Invalid selector: {}", e)))?;
            if let Some(element) = document.select(&selector).next() {
                let href = element
                    .value()
                    .attr("href")
                    .or_else(|| element.value().attr("content"))
                    .ok_or_else(|| AppError::SystemError("Icon URL not found".to_string()))?;
                img_url = Some(if href.starts_with("http") {
                    href.to_string()
                } else {
                    url.join(href)
                        .map_err(|e| AppError::SystemError(format!("Failed to join URL: {}", e)))?
                        .to_string()
                });
                break;
            }
        }

        if let Some(url) = img_url {
            response = client
                .get(&url)
                .send()
                .map_err(|e| AppError::SystemError(format!("Failed to fetch icon: {}", e)))?;
        } else {
            return Err(AppError::SystemError("No icon found".to_string()));
        }
    }

    let favicon_data = response
        .bytes()
        .map_err(|e| AppError::SystemError(format!("Failed to read icon data: {}", e)))?;

    // 如果数据为空，返回错误
    if favicon_data.is_empty() {
        return Err(AppError::SystemError("Icon data is empty".to_string()));
    }

    let img = image::load_from_memory(&favicon_data)
        .map_err(|e| AppError::SystemError(format!("Failed to load image: {}", e)))?;

    // 将图标保存为 32x32 PNG 图片
    let resized_img = img.resize_exact(32, 32, image::imageops::FilterType::Lanczos3);
    let output_file = File::create(&output_path)
        .map_err(|e| AppError::SystemError(format!("Failed to create output file: {}", e)))?;
    let mut writer = BufWriter::new(output_file);

    let encoder = PngEncoder::new(&mut writer);
    encoder
        .write_image(
            resized_img.as_bytes(),
            resized_img.width(),
            resized_img.height(),
            resized_img.color().into(),
        )
        .map_err(|e| AppError::SystemError(format!("Failed to encode image: {}", e)))?;

    Ok(output_path.display().to_string())
}
