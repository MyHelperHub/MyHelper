use ignore::WalkBuilder;
use once_cell::sync::Lazy;
use parking_lot::RwLock;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::sync::mpsc;
use std::sync::Arc;

/// 全局正则表达式缓存（性能优化）
static REGEX_CACHE: Lazy<RwLock<HashMap<String, Regex>>> =
    Lazy::new(|| RwLock::new(HashMap::new()));

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchOptions {
    /// 搜索路径（支持多个路径）
    pub paths: Vec<String>,
    /// 搜索模式（正则表达式或 glob）
    pub pattern: Option<String>,
    /// 是否为 glob 语法（true 则转换为 regex）
    pub is_glob: Option<bool>,
    /// 是否包含隐藏文件
    #[serde(default)]
    pub hidden: bool,
    /// 是否忽略 .gitignore 规则
    #[serde(default)]
    pub no_ignore: bool,
    /// 文件类型过滤 (file, directory, symlink, executable)
    pub file_type: Option<String>,
    /// 文件扩展名过滤
    pub extension: Option<Vec<String>>,
    /// 最大搜索深度
    pub max_depth: Option<usize>,
    /// 排除模式
    pub exclude: Option<Vec<String>>,
    /// 大小写敏感
    #[serde(default)]
    pub case_sensitive: bool,
}

impl Default for SearchOptions {
    fn default() -> Self {
        Self {
            paths: vec![".".to_string()],
            pattern: None,
            is_glob: Some(false),
            hidden: false,
            no_ignore: false,
            file_type: None,
            extension: None,
            max_depth: None,
            exclude: None,
            case_sensitive: false,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchResult {
    /// 文件路径
    pub path: String,
    /// 文件类型
    pub file_type: String,
    /// 文件大小（字节）
    pub size: Option<u64>,
    /// 文件名
    pub name: String,
    /// 是否为隐藏文件
    pub is_hidden: bool,
}

pub struct FdSearch;

impl FdSearch {
    /// 执行文件搜索
    pub fn search(options: SearchOptions) -> Result<Vec<SearchResult>, String> {
        if options.paths.is_empty() {
            return Err("至少需要一个搜索路径".to_string());
        }

        let pattern = if let Some(p) = &options.pattern {
            let pattern_str = if options.is_glob.unwrap_or(false) {
                Self::glob_to_regex(p)
            } else {
                p.clone()
            };

            let pattern_str = if !options.case_sensitive {
                format!("(?i){}", pattern_str)
            } else {
                pattern_str
            };

            Some(Arc::new(Self::get_cached_regex(&pattern_str)?))
        } else {
            None
        };

        let exclude_patterns: Option<Vec<Arc<Regex>>> = if let Some(excludes) = &options.exclude {
            let patterns: Result<Vec<_>, _> = excludes
                .iter()
                .map(|e| {
                    Regex::new(e)
                        .map(Arc::new)
                        .map_err(|err| format!("Invalid exclude pattern: {}", err))
                })
                .collect();
            Some(patterns?)
        } else {
            None
        };

        let mut builder = WalkBuilder::new(&options.paths[0]);

        for path in &options.paths[1..] {
            builder.add(path);
        }

        builder
            .hidden(!options.hidden)
            .ignore(!options.no_ignore)
            .max_depth(options.max_depth)
            .threads(Self::get_optimal_threads());

        let (tx, rx) = mpsc::channel();

        std::thread::scope(|scope| {
            scope.spawn(|| {
                builder.build_parallel().run(|| {
                    let tx = tx.clone();
                    let pattern = pattern.clone();
                    let exclude_patterns = exclude_patterns.clone();
                    let options = options.clone();

                    Box::new(move |entry| {
                        if let Ok(entry) = entry {
                            let path = entry.path();

                            if !Self::matches_pattern(path, &pattern) {
                                return ignore::WalkState::Continue;
                            }

                            if Self::matches_exclude(path, &exclude_patterns) {
                                return ignore::WalkState::Continue;
                            }

                            if let Some(ref ft) = options.file_type {
                                if !Self::check_file_type(&entry, ft) {
                                    return ignore::WalkState::Continue;
                                }
                            }

                            if let Some(ref exts) = options.extension {
                                if !Self::check_extension(path, exts) {
                                    return ignore::WalkState::Continue;
                                }
                            }

                            if let Some(result) = Self::create_result(entry) {
                                let _ = tx.send(result);
                            }
                        }

                        ignore::WalkState::Continue
                    })
                });
            });
        });

        drop(tx);

        let final_results: Vec<SearchResult> = rx.iter().collect();

        Ok(final_results)
    }

    /// 获取缓存的正则表达式
    fn get_cached_regex(pattern: &str) -> Result<Regex, String> {
        {
            let cache = REGEX_CACHE.read();
            if let Some(regex) = cache.get(pattern) {
                return Ok(regex.clone());
            }
        }

        let regex = Regex::new(pattern).map_err(|e| format!("Invalid regex: {}", e))?;

        {
            let mut cache = REGEX_CACHE.write();
            cache.insert(pattern.to_string(), regex.clone());
        }

        Ok(regex)
    }

    /// 将 glob 模式转换为正则表达式（完整匹配文件名）
    fn glob_to_regex(pattern: &str) -> String {
        let mut regex = String::with_capacity(pattern.len() * 2);
        regex.push('^');

        for ch in pattern.chars() {
            match ch {
                '.' => regex.push_str("\\."),
                '*' => regex.push_str(".*"),
                '?' => regex.push('.'),
                '[' | ']' | '(' | ')' | '{' | '}' | '+' | '^' | '$' | '|' | '\\' => {
                    regex.push('\\');
                    regex.push(ch);
                }
                _ => regex.push(ch),
            }
        }

        regex.push('$');
        regex
    }

    /// 检查路径是否匹配指定模式（只匹配文件名）
    #[inline]
    fn matches_pattern(path: &Path, pattern: &Option<Arc<Regex>>) -> bool {
        if let Some(re) = pattern {
            path.file_name()
                .and_then(|name| name.to_str())
                .map(|s| re.is_match(s))
                .unwrap_or(false)
        } else {
            true
        }
    }

    /// 检查路径是否匹配排除模式
    #[inline]
    fn matches_exclude(path: &Path, patterns: &Option<Vec<Arc<Regex>>>) -> bool {
        if let Some(excludes) = patterns {
            if let Some(path_str) = path.to_str() {
                return excludes.iter().any(|re| re.is_match(path_str));
            }
        }
        false
    }

    /// 检查文件类型是否匹配
    #[inline]
    fn check_file_type(entry: &ignore::DirEntry, type_filter: &str) -> bool {
        // 使用 DirEntry 的 file_type()
        if let Some(ft) = entry.file_type() {
            match type_filter {
                "file" => ft.is_file(),
                "directory" => ft.is_dir(),
                "symlink" => ft.is_symlink(),
                "executable" => {
                    #[cfg(unix)]
                    {
                        if ft.is_file() {
                            use std::os::unix::fs::PermissionsExt;
                            return entry
                                .metadata()
                                .ok()
                                .map(|m| m.permissions().mode() & 0o111 != 0)
                                .unwrap_or(false);
                        }
                        false
                    }
                    #[cfg(not(unix))]
                    {
                        if ft.is_file() {
                            return entry
                                .path()
                                .extension()
                                .and_then(|e| e.to_str())
                                .map(|e| matches!(e.to_lowercase().as_str(), "exe" | "bat" | "cmd"))
                                .unwrap_or(false);
                        }
                        false
                    }
                }
                _ => true,
            }
        } else {
            // 如果无法获取 file_type，回退到使用 path
            let path = entry.path();
            match type_filter {
                "file" => path.is_file(),
                "directory" => path.is_dir(),
                "symlink" => path.is_symlink(),
                "executable" => {
                    #[cfg(unix)]
                    {
                        use std::os::unix::fs::PermissionsExt;
                        path.metadata()
                            .map(|m| m.permissions().mode() & 0o111 != 0)
                            .unwrap_or(false)
                    }
                    #[cfg(not(unix))]
                    {
                        path.extension()
                            .and_then(|e| e.to_str())
                            .map(|e| matches!(e.to_lowercase().as_str(), "exe" | "bat" | "cmd"))
                            .unwrap_or(false)
                    }
                }
                _ => true,
            }
        }
    }

    /// 检查文件扩展名是否匹配
    #[inline]
    fn check_extension(path: &Path, extensions: &[String]) -> bool {
        path.extension()
            .and_then(|e| e.to_str())
            .map(|ext| extensions.iter().any(|e| e.eq_ignore_ascii_case(ext)))
            .unwrap_or(false)
    }

    /// 创建搜索结果
    #[inline]
    fn create_result(entry: ignore::DirEntry) -> Option<SearchResult> {
        let path = entry.path();
        let file_name = entry.file_name().to_string_lossy().to_string();

        // 只获取一次 metadata
        let metadata = entry.metadata().ok()?;

        let file_type = if metadata.is_dir() {
            "directory"
        } else if metadata.is_symlink() {
            "symlink"
        } else {
            "file"
        };

        let size = if metadata.is_file() {
            Some(metadata.len())
        } else {
            None
        };

        Some(SearchResult {
            path: path.to_string_lossy().to_string(),
            file_type: file_type.to_string(),
            size,
            name: file_name.clone(),
            is_hidden: file_name.starts_with('.'),
        })
    }

    /// 获取最佳线程数
    fn get_optimal_threads() -> usize {
        std::thread::available_parallelism()
            .map(|n| n.get())
            .unwrap_or(4)
            .max(2)
    }
}
