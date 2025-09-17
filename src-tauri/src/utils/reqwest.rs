use reqwest::header::{HeaderMap, HeaderValue, USER_AGENT};
use reqwest::{Client, Proxy};
use std::env;
use std::time::Duration;

use crate::utils::error::AppError;
use crate::services::logger::{LogEntry, Logger};

const CONNECT_TIMEOUT: Duration = Duration::from_secs(5);
const REQUEST_TIMEOUT: Duration = Duration::from_secs(10);

/// 创建一个配置好的 HTTP/HTTPS 客户端
///
/// 此客户端包含以下配置：
/// - 支持 HTTP 和 HTTPS 协议
/// - 用户代理（User-Agent）设置
/// - 超时设置：
///   - 连接超时：5秒
///   - 请求超时：10秒
/// - 代理设置（如果环境变量中有配置）：
///   - HTTP 代理：从 HTTP_PROXY 或 http_proxy 环境变量读取
///   - HTTPS 代理：从 HTTPS_PROXY 或 https_proxy 环境变量读取
/// - 连接池配置：
///   - 空闲超时：15秒
///   - 每个主机最大空闲连接数：1
/// - 自动重定向限制：最多10次
///
/// # Returns
///
/// * `Result<Client, AppError>` - 成功返回配置好的客户端，失败返回错误
///
/// # Example
///
/// ```rust
/// use crate::utils::http::create_web_client;
///
/// async fn fetch_data() -> Result<(), AppError> {
///     let client = create_web_client()?;
///     let response = client.get("https://example.com").send().await?;
///     Ok(())
/// }
/// ```
pub fn create_web_client() -> Result<Client, AppError> {
    let mut headers = HeaderMap::new();
    let user_agent = match std::env::consts::OS {
        "windows" => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "macos" => "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "linux" => "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        _ => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    };
    headers.insert(USER_AGENT, HeaderValue::from_static(user_agent));

    let mut client_builder = Client::builder()
        .timeout(REQUEST_TIMEOUT)
        .connect_timeout(CONNECT_TIMEOUT)
        .pool_idle_timeout(Duration::from_secs(15))
        .pool_max_idle_per_host(1)
        .redirect(reqwest::redirect::Policy::limited(10))
        .default_headers(headers);

    // 尝试从环境变量获取代理设置
    if let Ok(proxy) = env::var("HTTP_PROXY").or_else(|_| env::var("http_proxy")) {
        let _ = Logger::write_log(LogEntry {
            level: "info".to_string(),
            message: "使用HTTP代理".to_string(),
            timestamp: String::new(),
            details: Some(proxy.clone()),
        });
        if let Ok(proxy) = Proxy::http(&proxy) {
            client_builder = client_builder.proxy(proxy);
        }
    }
    if let Ok(proxy) = env::var("HTTPS_PROXY").or_else(|_| env::var("https_proxy")) {
        let _ = Logger::write_log(LogEntry {
            level: "info".to_string(),
            message: "使用HTTPS代理".to_string(),
            timestamp: String::new(),
            details: Some(proxy.clone()),
        });
        if let Ok(proxy) = Proxy::https(&proxy) {
            client_builder = client_builder.proxy(proxy);
        }
    }

    client_builder
        .build()
        .map_err(|e| AppError::Error(format!("Failed to create HTTP client: {}", e)))
}
