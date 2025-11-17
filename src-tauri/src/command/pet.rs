use crate::services::database::get_db_pool;
use crate::utils::error::{AppError, AppResult};
use crate::utils::path::get_myhelper_path;
use crate::utils::response::{ApiResponse, ApiStatusCode};
use chrono::Utc;
use serde_json::Value;
use std::fs::{self, File};
use std::io;
use std::path::{Path, PathBuf};
use tauri::AppHandle;
use zip::read::ZipArchive;

// 常量定义
const MAX_ZIP_SIZE: usize = 15 * 1024 * 1024; // 15MB
const MODEL_EXTENSIONS: [&str; 3] = [".model.json", ".model3.json", ".model4.json"];
const ASSET_EXTENSIONS: [&str; 13] = [
    ".png",
    ".jpg",
    ".jpeg",
    ".moc",
    ".moc3",
    ".moc4",
    ".physics.json",
    ".pose.json",
    ".motion3.json",
    ".motion4.json",
    ".exp.json",
    ".exp3.json",
    ".exp4.json",
];

// 辅助函数
fn validate_model_name(model_name: &str) -> AppResult<()> {
    if model_name.is_empty()
        || model_name.contains("..")
        || model_name.contains("/")
        || model_name.contains("\\")
    {
        Err(AppError::Error("无效的模型名称".into()))
    } else {
        Ok(())
    }
}

fn get_user_models_dir(_app: &AppHandle) -> AppResult<PathBuf> {
    get_myhelper_path()
        .map(|path| path.join("Models").join("Live2D"))
        .map_err(|e| AppError::Error(format!("获取MyHelper路径失败: {}", e)))
}

fn ensure_directory_exists(path: &Path) -> AppResult<()> {
    fs::create_dir_all(path).map_err(|e| AppError::Error(format!("创建目录失败: {}", e)))
}

fn should_extract_file(file_name: &str) -> bool {
    MODEL_EXTENSIONS.iter().any(|ext| file_name.ends_with(ext))
        || ASSET_EXTENSIONS
            .iter()
            .any(|ext| file_name.to_lowercase().ends_with(ext))
}

fn is_model_file(file_name: &str) -> bool {
    MODEL_EXTENSIONS.iter().any(|ext| file_name.ends_with(ext))
}

fn should_skip_file(file_name: &str) -> bool {
    file_name.ends_with('/') || file_name.starts_with('.') || file_name.contains("__MACOSX")
}

fn is_zip_file(file_path: &Path) -> bool {
    file_path
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.to_lowercase() == "zip")
        .unwrap_or(false)
}

#[permission_macro::permission("main", "setting", "my")]
#[tauri::command]
pub fn set_pet_config(config_type: &str, config_data: Value) -> Result<ApiResponse<()>, AppError> {
    let pool = get_db_pool();

    let json_value = match serde_json::to_string(&config_data) {
        Ok(v) => v,
        Err(e) => {
            return Ok(ApiResponse::error(
                ApiStatusCode::ErrDatabase,
                format!("序列化宠物配置失败: {}", e),
            ))
        }
    };

    let conn = pool
        .get()
        .map_err(|e| AppError::Error(format!("获取数据库连接失败: {}", e)))?;
    match conn.execute(
        "INSERT OR REPLACE INTO pet_config (config_type, config_data, updated_at) VALUES (?1, ?2, CURRENT_TIMESTAMP)",
        [config_type, &json_value],
    ) {
        Ok(_) => Ok(ApiResponse::success(())),
        Err(e) => Ok(ApiResponse::error(
            ApiStatusCode::ErrDatabase,
            format!("保存宠物配置失败: {}", e),
        )),
    }
}

#[permission_macro::permission("main", "setting", "my")]
#[tauri::command]
pub fn get_pet_config(config_type: &str) -> Result<ApiResponse<Option<Value>>, AppError> {
    let pool = get_db_pool();
    let conn = pool
        .get()
        .map_err(|e| AppError::Error(format!("获取数据库连接失败: {}", e)))?;

    let mut stmt = match conn.prepare("SELECT config_data FROM pet_config WHERE config_type = ?1") {
        Ok(s) => s,
        Err(e) => {
            return Ok(ApiResponse::error(
                ApiStatusCode::ErrDatabase,
                format!("准备查询语句失败: {}", e),
            ))
        }
    };

    let mut rows = match stmt.query([config_type]) {
        Ok(r) => r,
        Err(e) => {
            return Ok(ApiResponse::error(
                ApiStatusCode::ErrDatabase,
                format!("执行查询失败: {}", e),
            ))
        }
    };

    if let Some(row) = match rows.next() {
        Ok(r) => r,
        Err(e) => {
            return Ok(ApiResponse::error(
                ApiStatusCode::ErrDatabase,
                format!("获取查询结果失败: {}", e),
            ))
        }
    } {
        let json_str: String = match row.get(0) {
            Ok(s) => s,
            Err(e) => {
                return Ok(ApiResponse::error(
                    ApiStatusCode::ErrDatabase,
                    format!("获取宠物配置失败: {}", e),
                ))
            }
        };

        // 直接使用serde_json解析，对于小数据不需要simd优化
        match serde_json::from_str::<Value>(&json_str) {
            Ok(v) => Ok(ApiResponse::success(Some(v))),
            Err(e) => Ok(ApiResponse::error(
                ApiStatusCode::ErrDatabase,
                format!("解析宠物配置失败: {}", e),
            )),
        }
    } else {
        Ok(ApiResponse::success(None))
    }
}

#[permission_macro::permission("main", "setting", "my")]
#[tauri::command]
pub fn delete_pet_config(config_type: &str) -> Result<ApiResponse<()>, AppError> {
    let pool = get_db_pool();
    let conn = pool
        .get()
        .map_err(|e| AppError::Error(format!("获取数据库连接失败: {}", e)))?;

    match conn.execute(
        "DELETE FROM pet_config WHERE config_type = ?1",
        [config_type],
    ) {
        Ok(_) => Ok(ApiResponse::success(())),
        Err(e) => Ok(ApiResponse::error(
            ApiStatusCode::ErrDatabase,
            format!("删除宠物配置失败: {}", e),
        )),
    }
}

/// 导入 Live2D 模型
#[permission_macro::permission("main", "setting")]
#[tauri::command]
pub async fn import_live2d_model(
    app: AppHandle,
    file_path: &str,
    _model_name: Option<&str>,
) -> Result<ApiResponse<String>, AppError> {
    let file_path = Path::new(file_path);
    if !file_path.exists() || !file_path.is_file() {
        return Ok(ApiResponse::error(
            ApiStatusCode::ErrParams,
            "指定的文件不存在或不是文件",
        ));
    }

    let models_dir = match get_user_models_dir(&app) {
        Ok(dir) => dir,
        Err(e) => {
            return Ok(ApiResponse::error(
                ApiStatusCode::ErrSystem,
                format!("获取模型目录失败: {}", e),
            ));
        }
    };

    if let Err(e) = ensure_directory_exists(&models_dir) {
        return Ok(ApiResponse::error(
            ApiStatusCode::ErrSystem,
            format!("创建模型目录失败: {}", e),
        ));
    }

    if is_zip_file(file_path) {
        // 直接解压到 Models/Live2D/ 目录，让ZIP内部结构决定最终路径
        if let Err(e) = extract_live2d_model_from_zip(file_path, &models_dir) {
            return Ok(ApiResponse::error(
                ApiStatusCode::ErrSystem,
                format!("解压模型文件失败: {}", e),
            ));
        }

        // 尝试从解压结果中找到模型名称
        let extracted_model_name = match find_extracted_model_name(&models_dir) {
            Ok(name) => name,
            Err(e) => {
                return Ok(ApiResponse::error(
                    ApiStatusCode::ErrSystem,
                    format!("找不到有效的模型目录: {}", e),
                ));
            }
        };

        let model_dir = models_dir.join(&extracted_model_name);
        if let Err(e) = validate_extracted_model_dir(&model_dir) {
            let _ = fs::remove_dir_all(&model_dir);
            return Ok(ApiResponse::error(
                ApiStatusCode::ErrParams,
                format!("模型文件结构不完整: {}", e),
            ));
        }

        Ok(ApiResponse::success(extracted_model_name))
    } else {
        return Ok(ApiResponse::error(
            ApiStatusCode::ErrParams,
            "仅支持 .zip 格式的模型包导入，请打包模型文件后重试",
        ));
    }
}

/// 删除用户导入的模型
#[permission_macro::permission("main", "setting")]
#[tauri::command]
pub async fn delete_user_live2d_model(
    app: AppHandle,
    model_name: &str,
) -> Result<ApiResponse<()>, AppError> {
    if let Err(e) = validate_model_name(model_name) {
        return Ok(ApiResponse::error(
            ApiStatusCode::ErrParams,
            format!("无效的模型名称: {}", e),
        ));
    }

    let models_dir = match get_user_models_dir(&app) {
        Ok(dir) => dir,
        Err(e) => {
            return Ok(ApiResponse::error(
                ApiStatusCode::ErrSystem,
                format!("获取模型目录失败: {}", e),
            ));
        }
    };

    let model_dir = models_dir.join(model_name);

    if !model_dir.exists() {
        return Ok(ApiResponse::error(ApiStatusCode::ErrParams, "模型不存在"));
    }

    if let Err(e) = fs::remove_dir_all(&model_dir) {
        return Ok(ApiResponse::error(
            ApiStatusCode::ErrSystem,
            format!("删除模型目录失败: {}", e),
        ));
    }

    Ok(ApiResponse::success(()))
}

// 旧的单文件导入复制函数，已不再使用

/// 获取所有 Live2D 模型（预置+用户导入）
#[permission_macro::permission("main", "setting")]
#[tauri::command]
pub async fn get_all_live2d_models(
    app: AppHandle,
) -> Result<ApiResponse<Vec<serde_json::Value>>, AppError> {
    let mut models = Vec::new();

    if let Ok(builtin_models) = get_builtin_models().await {
        models.extend(builtin_models);
    }

    if let Ok(user_models) = get_user_models(&app).await {
        models.extend(user_models);
    }

    Ok(ApiResponse::success(models))
}

/// 从ZIP文件中解压Live2D模型
fn extract_live2d_model_from_zip(zip_path: &Path, target_dir: &Path) -> AppResult<()> {
    let file_size = fs::metadata(zip_path)
        .map_err(|e| AppError::Error(format!("获取文件大小失败: {}", e)))?
        .len() as usize;
    if file_size > MAX_ZIP_SIZE {
        return Err(AppError::Error(format!("文件太大: {} bytes", file_size)));
    }

    let file =
        File::open(zip_path).map_err(|e| AppError::Error(format!("打开ZIP文件失败: {}", e)))?;

    let mut archive =
        ZipArchive::new(file).map_err(|e| AppError::Error(format!("无效的ZIP文件: {}", e)))?;

    let mut has_model_file = false;

    // 解压文件，保持原有目录结构
    for i in 0..archive.len() {
        let mut file = archive
            .by_index(i)
            .map_err(|e| AppError::Error(format!("读取ZIP文件失败: {}", e)))?;

        let file_name = file.name().to_string();

        if should_skip_file(&file_name) {
            continue;
        }

        if is_model_file(&file_name) {
            has_model_file = true;
        }

        // 只解压Live2D相关的文件
        if should_extract_file(&file_name) || file.is_dir() {
            extract_file_from_zip(&mut file, target_dir)?;
        }
    }

    if !has_model_file {
        return Err(AppError::Error(
            "ZIP文件中未找到有效的Live2D模型文件".into(),
        ));
    }

    Ok(())
}

fn extract_file_from_zip<R: io::Read>(
    file: &mut zip::read::ZipFile<'_, R>,
    target_dir: &Path,
) -> AppResult<()> {
    let out_path = target_dir.join(file.mangled_name());

    // 确保输出路径在目标目录内（安全检查）
    if !out_path.starts_with(target_dir) {
        return Err(AppError::Error("ZIP文件包含非法路径".into()));
    }

    // 如果是目录，创建目录并返回
    if file.is_dir() {
        fs::create_dir_all(&out_path)
            .map_err(|e| AppError::Error(format!("创建目录失败: {}", e)))?;
        return Ok(());
    }

    // 创建父目录
    if let Some(parent) = out_path.parent() {
        // 如果父目录路径存在且是一个文件，先删除它
        if parent.exists() && parent.is_file() {
            fs::remove_file(parent)
                .map_err(|e| AppError::Error(format!("删除已存在的文件失败: {}", e)))?;
        }
        // 创建父目录
        fs::create_dir_all(parent).map_err(|e| AppError::Error(format!("创建目录失败: {}", e)))?;
    }

    // 如果文件已存在，先删除
    if out_path.exists() {
        if out_path.is_file() {
            fs::remove_file(&out_path)
                .map_err(|e| AppError::Error(format!("删除已存在的文件失败: {}", e)))?;
        } else {
            fs::remove_dir_all(&out_path)
                .map_err(|e| AppError::Error(format!("删除已存在的目录失败: {}", e)))?;
        }
    }

    // 创建并写入文件
    let mut target_file =
        File::create(&out_path).map_err(|e| AppError::Error(format!("创建文件失败: {}", e)))?;
    io::copy(file, &mut target_file)
        .map_err(|e| AppError::Error(format!("写入文件失败: {}", e)))?;

    Ok(())
}

/// 获取预置模型列表
async fn get_builtin_models() -> AppResult<Vec<serde_json::Value>> {
    // 这里复制现有的 PetGlobalManager::refreshModelCache 中的预置模型扫描逻辑
    // 返回 source: 0 的模型列表
    Ok(vec![]) // 暂时返回空，等待与现有逻辑整合
}

/// 获取用户模型列表
async fn get_user_models(app: &AppHandle) -> AppResult<Vec<serde_json::Value>> {
    let models_dir = get_user_models_dir(app)?;
    let mut models = Vec::new();

    if !models_dir.exists() || !models_dir.is_dir() {
        return Ok(models);
    }

    let entries = fs::read_dir(&models_dir)
        .map_err(|e| AppError::Error(format!("读取模型目录失败: {}", e)))?;

    for entry in entries {
        let entry = entry.map_err(|e| AppError::Error(format!("读取目录项失败: {}", e)))?;
        let path = entry.path();

        if path.is_dir() {
            if let Some(name) = path.file_name().and_then(|s| s.to_str()) {
                if has_model_files_recursive(&path) {
                    match create_user_model_json(app, name) {
                        Ok(model_json) => models.push(model_json),
                        Err(_) => {
                            // 如果创建详细信息失败，创建基础信息
                            models.push(serde_json::json!({
                                "name": name,
                                "path": format!("Models/Live2D/{}", name),
                                "source": 1
                            }));
                        }
                    }
                }
            }
        }
    }

    Ok(models)
}

fn find_extracted_model_name(models_dir: &Path) -> AppResult<String> {
    let entries = fs::read_dir(models_dir)
        .map_err(|e| AppError::Error(format!("读取模型目录失败: {}", e)))?;

    for entry in entries {
        let entry = entry.map_err(|e| AppError::Error(format!("读取目录项失败: {}", e)))?;
        let path = entry.path();

        if path.is_dir() {
            if let Some(name) = path.file_name().and_then(|s| s.to_str()) {
                if has_model_files_recursive(&path) {
                    return Ok(name.to_string());
                }
            }
        }
    }

    Err(AppError::Error("未找到有效的模型目录".into()))
}

fn has_model_files_recursive(dir_path: &Path) -> bool {
    // 先检查当前目录
    if has_model_files(dir_path) {
        return true;
    }

    // 递归检查子目录
    if let Ok(entries) = fs::read_dir(dir_path) {
        for entry in entries.filter_map(Result::ok) {
            let path = entry.path();
            if path.is_dir() {
                if has_model_files_recursive(&path) {
                    return true;
                }
            }
        }
    }

    false
}

fn has_model_files(dir_path: &Path) -> bool {
    fs::read_dir(dir_path)
        .map(|entries| {
            entries.filter_map(Result::ok).any(|entry| {
                if let Some(file_name) = entry.file_name().to_str() {
                    is_model_file(file_name)
                } else {
                    false
                }
            })
        })
        .unwrap_or(false)
}

fn detect_model_version(file_name: &str) -> &'static str {
    if file_name.contains(".model4.json") {
        "4.x"
    } else if file_name.contains(".model3.json") {
        "3.x"
    } else if file_name.contains(".model.json") {
        "2.1"
    } else {
        "unknown"
    }
}

fn get_directory_size(dir: &Path) -> u64 {
    let mut size = 0;
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.filter_map(Result::ok) {
            let path = entry.path();
            if path.is_file() {
                if let Ok(metadata) = fs::metadata(&path) {
                    size += metadata.len();
                }
            } else if path.is_dir() {
                size += get_directory_size(&path);
            }
        }
    }
    size
}

fn create_user_model_json(app: &AppHandle, model_name: &str) -> AppResult<serde_json::Value> {
    let models_dir = get_user_models_dir(app)?;
    let model_path = models_dir.join(model_name);

    let mut model_json = serde_json::json!({
        "name": model_name,
        "path": format!("Models/Live2D/{}", model_name),
        "source": 1,
        "importTime": Utc::now().format("%Y-%m-%d %H:%M:%S").to_string(),
    });

    // 获取文件夹大小
    let size = get_directory_size(&model_path);
    if size > 0 {
        model_json["size"] = serde_json::Value::Number(serde_json::Number::from(size));
    }

    // 检测模型版本
    if let Ok(entries) = fs::read_dir(&model_path) {
        for entry in entries.filter_map(Result::ok) {
            let file_name = entry.file_name();
            if let Some(name_str) = file_name.to_str() {
                if is_model_file(name_str) {
                    let version = detect_model_version(name_str);
                    if version != "unknown" {
                        model_json["version"] = serde_json::Value::String(version.to_string());
                        break;
                    }
                }
            }
        }
    }

    Ok(model_json)
}

/// 校验解压后的模型目录中文件结构是否完整
fn validate_extracted_model_dir(model_root: &Path) -> AppResult<()> {
    fn collect_model_configs(dir: &Path, list: &mut Vec<PathBuf>) {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.filter_map(Result::ok) {
                let path = entry.path();
                if path.is_file() {
                    if let Some(name) = path.file_name().and_then(|s| s.to_str()) {
                        if is_model_file(name) {
                            list.push(path.clone());
                        }
                    }
                } else if path.is_dir() {
                    collect_model_configs(&path, list);
                }
            }
        }
    }

    let mut configs = Vec::new();
    collect_model_configs(model_root, &mut configs);
    if configs.is_empty() {
        return Err(AppError::Error("未找到模型配置文件".into()));
    }

    for config_path in configs {
        let base_dir = config_path.parent().unwrap_or(model_root);
        let json_str = fs::read_to_string(&config_path)
            .map_err(|e| AppError::Error(format!("读取模型配置失败: {}", e)))?;
        let v: Value = serde_json::from_str(&json_str)
            .map_err(|e| AppError::Error(format!("解析模型配置失败: {}", e)))?;

        let mut missing: Vec<String> = Vec::new();

        if let Some(refs) = v.get("FileReferences") {
            // 只校验必需的文件：Moc 文件（至少一个版本）和 Textures
            let mut has_moc = false;
            for key in ["Moc", "Moc3", "Moc4"] {
                if let Some(val) = refs.get(key).and_then(|x| x.as_str()) {
                    let p = base_dir.join(val);
                    if p.exists() {
                        has_moc = true;
                    } else {
                        missing.push(val.to_string());
                    }
                }
            }

            if !has_moc {
                return Err(AppError::Error(format!(
                    "模型 moc 文件缺失: {}",
                    missing
                        .get(0)
                        .cloned()
                        .unwrap_or_else(|| "未找到 moc 文件".to_string())
                )));
            }

            // 校验纹理文件（必需）
            if let Some(textures) = refs.get("Textures").and_then(|x| x.as_array()) {
                if textures.is_empty() {
                    return Err(AppError::Error("模型缺少纹理文件".into()));
                }
                for t in textures.iter().filter_map(|x| x.as_str()) {
                    let p = base_dir.join(t);
                    if !p.exists() {
                        return Err(AppError::Error(format!("纹理文件缺失: {}", t)));
                    }
                }
            } else {
                return Err(AppError::Error("模型配置缺少 Textures 字段".into()));
            }
        }
    }

    Ok(())
}
