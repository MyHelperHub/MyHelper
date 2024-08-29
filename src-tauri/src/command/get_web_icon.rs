use image::ImageOutputFormat;
use reqwest::blocking::Client;
use reqwest::header::USER_AGENT;
use scraper::{Html, Selector};
use std::env;
use std::fs::{self, File};
use std::io::BufWriter;
use std::path::Path;
use std::time::Duration;
use url::Url;

#[tauri::command]
pub fn get_web_icon(url: &str) -> Result<String, String> {
    // 解析网站 URL
    let mut url = Url::parse(url).map_err(|e| e.to_string())?;
    let domain = url.host_str().ok_or("Invalid URL")?.replace(".", "_");

    // 获取用户目录
    let home_dir = env::var("APPDATA").map_err(|e| e.to_string())?;
    let myhelper_path = Path::new(&home_dir)
        .join("MyHelper")
        .join("Image")
        .join("WebIcon");

    // 创建目录（如果不存在）
    if !myhelper_path.exists() {
        fs::create_dir_all(&myhelper_path).map_err(|e| e.to_string())?;
    }

    let output_path = myhelper_path.join(format!("{}.png", domain));

    // 创建 HTTP 客户端并设置超时时间为 5 秒
    let client = Client::builder()
        .timeout(Duration::from_secs(5))
        .redirect(reqwest::redirect::Policy::limited(10)) // 处理重定向
        .build()
        .map_err(|e| e.to_string())?;

    // 优先尝试从 /favicon.ico 获取图标
    let favicon_url = url.join("/favicon.ico").map_err(|e| e.to_string())?;
    let mut response = client.get(favicon_url.as_str()).send();

    // 如果/favicon.ico请求失败或者获取不到数据，则尝试从meta标签或者link标签中获取图标
    if response.is_err() || response.as_ref().unwrap().status().is_client_error() {
        // 处理可能的重定向
        url = response.unwrap().url().clone();

        // 获取网页内容
        let html = client
            .get(url.as_str())
            .header(
                USER_AGENT,
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            )
            .send()
            .map_err(|e| e.to_string())?
            .text()
            .map_err(|e| e.to_string())?;

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
            let selector = Selector::parse(selector_str).map_err(|e| e.to_string())?;
            if let Some(element) = document.select(&selector).next() {
                let href = element
                    .value()
                    .attr("href")
                    .or_else(|| element.value().attr("content"))
                    .ok_or("No icon found")?;
                img_url = Some(if href.starts_with("http") {
                    href.to_string()
                } else {
                    url.join(href).map_err(|e| e.to_string())?.to_string()
                });
                break;
            }
        }

        if let Some(url) = img_url {
            response = client.get(&url).send();
        } else {
            return Err("No icon found".to_string());
        }
    }

    let favicon_data = response
        .map_err(|e| e.to_string())?
        .bytes()
        .map_err(|e| e.to_string())?;

    // 如果数据为空，返回错误
    if favicon_data.is_empty() {
        return Err("Failed to download the icon".to_string());
    }

    let img = image::load_from_memory(&favicon_data).map_err(|e| e.to_string())?;

    // 将图标保存为 32x32 PNG 图片
    let resized_img = img.resize_exact(32, 32, image::imageops::FilterType::Lanczos3);
    let output_file = File::create(&output_path).map_err(|e| e.to_string())?;
    let mut writer = BufWriter::new(output_file);
    resized_img
        .write_to(&mut writer, ImageOutputFormat::Png)
        .map_err(|e| e.to_string())?;

    Ok(output_path.display().to_string())
}
