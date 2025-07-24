use crate::utils::response::ApiResponse;
use crate::utils::error::AppError;
use super::models::*;
use std::path::{Path, PathBuf};
use std::fs;
use serde_json;

#[tauri::command]
pub async fn detect_animation_models() -> Result<ApiResponse<Vec<AnimationModel>>, AppError> {
    let models_path = get_models_directory()?;
    let mut all_models = Vec::new();

    // 扫描Live2D模型
    if let Ok(live2d_models) = scan_live2d_models(&models_path.join("live2d")).await {
        all_models.extend(live2d_models);
    }

    // 预留：扫描Spine模型
    // if let Ok(spine_models) = scan_spine_models(&models_path.join("spine")).await {
    //     all_models.extend(spine_models);
    // }

    // 预留：扫描Lottie模型
    // if let Ok(lottie_models) = scan_lottie_models(&models_path.join("lottie")).await {
    //     all_models.extend(lottie_models);
    // }

    Ok(ApiResponse::success(all_models))
}

#[tauri::command]
pub async fn detect_model_type(model_path: String) -> Result<ApiResponse<DetectionResult>, AppError> {
    let path = Path::new(&model_path);
    
    if !path.exists() {
        return Ok(ApiResponse::success(DetectionResult {
            technology: AnimationTechnology::Unknown,
            is_valid: false,
            error: Some("路径不存在".to_string()),
            metadata: None,
        }));
    }

    // 检测Live2D模型
    if let Ok(result) = detect_live2d_model(path).await {
        return Ok(ApiResponse::success(result));
    }

    // 预留：检测Spine模型
    // if let Ok(result) = detect_spine_model(path).await {
    //     return Ok(ApiResponse::success(result));
    // }

    // 预留：检测Lottie模型
    // if let Ok(result) = detect_lottie_model(path).await {
    //     return Ok(ApiResponse::success(result));
    // }

    Ok(ApiResponse::success(DetectionResult {
        technology: AnimationTechnology::Unknown,
        is_valid: false,
        error: Some("无法识别的模型类型".to_string()),
        metadata: None,
    }))
}

fn get_models_directory() -> Result<PathBuf, AppError> {
    let exe_path = std::env::current_exe()
        .map_err(|e| AppError::Error(format!("获取执行路径失败: {}", e)))?;
    
    let models_path = exe_path
        .parent()
        .ok_or_else(|| AppError::Error("获取执行目录失败".to_string()))?
        .join("assets")
        .join("models");

    Ok(models_path)
}

async fn scan_live2d_models(dir: &Path) -> Result<Vec<AnimationModel>, AppError> {
    if !dir.exists() {
        return Ok(Vec::new());
    }

    let mut models = Vec::new();
    let entries = fs::read_dir(dir)
        .map_err(|e| AppError::Error(format!("读取Live2D目录失败: {}", e)))?;

    for entry in entries {
        let entry = entry.map_err(|e| AppError::Error(format!("读取目录项失败: {}", e)))?;
        let path = entry.path();

        if path.is_dir() {
            if let Ok(model) = scan_live2d_model_directory(&path).await {
                models.push(model);
            }
        }
    }

    Ok(models)
}

async fn scan_live2d_model_directory(dir: &Path) -> Result<AnimationModel, AppError> {
    let runtime_dir = dir.join("runtime");
    let model_files = find_live2d_model_files(&runtime_dir)?;
    
    if model_files.is_empty() {
        return Err(AppError::Error("未找到Live2D模型文件".to_string()));
    }

    let model_name = dir.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Unknown")
        .to_string();

    let metadata = parse_live2d_metadata(&runtime_dir, &model_files[0])?;
    let preview_path = find_preview_image(dir);

    Ok(AnimationModel {
        id: format!("live2d_{}", model_name),
        name: model_name,
        technology: AnimationTechnology::Live2D,
        path: dir.to_string_lossy().to_string(),
        preview: preview_path,
        metadata: Some(serde_json::to_value(metadata).unwrap_or(serde_json::Value::Null)),
    })
}

async fn detect_live2d_model(path: &Path) -> Result<DetectionResult, AppError> {
    if path.is_dir() {
        let runtime_dir = path.join("runtime");
        let model_files = find_live2d_model_files(&runtime_dir)?;
        
        if !model_files.is_empty() {
            let metadata = parse_live2d_metadata(&runtime_dir, &model_files[0])?;
            return Ok(DetectionResult {
                technology: AnimationTechnology::Live2D,
                is_valid: true,
                error: None,
                metadata: Some(serde_json::to_value(metadata).unwrap_or(serde_json::Value::Null)),
            });
        }
    } else if path.extension().and_then(|e| e.to_str()) == Some("model3") {
        // 单个模型文件检测
        if let Ok(metadata) = parse_live2d_model_file(path) {
            return Ok(DetectionResult {
                technology: AnimationTechnology::Live2D,
                is_valid: true,
                error: None,
                metadata: Some(serde_json::to_value(metadata).unwrap_or(serde_json::Value::Null)),
            });
        }
    }

    Ok(DetectionResult {
        technology: AnimationTechnology::Unknown,
        is_valid: false,
        error: Some("不是有效的Live2D模型".to_string()),
        metadata: None,
    })
}

fn find_live2d_model_files(dir: &Path) -> Result<Vec<String>, AppError> {
    if !dir.exists() {
        return Ok(Vec::new());
    }

    let mut model_files = Vec::new();
    let entries = fs::read_dir(dir)
        .map_err(|e| AppError::Error(format!("读取runtime目录失败: {}", e)))?;

    for entry in entries {
        let entry = entry.map_err(|e| AppError::Error(format!("读取文件项失败: {}", e)))?;
        let path = entry.path();
        
        if let Some(extension) = path.extension() {
            if extension == "json" && path.file_name()
                .and_then(|n| n.to_str())
                .map(|s| s.contains("model3"))
                .unwrap_or(false) {
                if let Some(file_name) = path.file_name().and_then(|n| n.to_str()) {
                    model_files.push(file_name.to_string());
                }
            }
        }
    }

    Ok(model_files)
}

fn parse_live2d_metadata(runtime_dir: &Path, model_file: &str) -> Result<Live2DMetadata, AppError> {
    let model_path = runtime_dir.join(model_file);
    parse_live2d_model_file(&model_path)
}

fn parse_live2d_model_file(model_path: &Path) -> Result<Live2DMetadata, AppError> {
    let content = fs::read_to_string(model_path)
        .map_err(|e| AppError::Error(format!("读取模型文件失败: {}", e)))?;
    
    let json: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| AppError::Error(format!("解析模型JSON失败: {}", e)))?;

    let mut textures = Vec::new();
    if let Some(texture_names) = json.get("FileReferences").and_then(|f| f.get("Textures")).and_then(|t| t.as_array()) {
        for texture in texture_names {
            if let Some(texture_str) = texture.as_str() {
                textures.push(texture_str.to_string());
            }
        }
    }

    let mut motions = Vec::new();
    if let Some(groups) = json.get("FileReferences").and_then(|f| f.get("Motions")).and_then(|m| m.as_object()) {
        for (group_name, group_motions) in groups {
            if let Some(motion_array) = group_motions.as_array() {
                for motion in motion_array {
                    if let Some(motion_obj) = motion.as_object() {
                        if let Some(file) = motion_obj.get("File").and_then(|f| f.as_str()) {
                            motions.push(Live2DMotion {
                                group: group_name.clone(),
                                file: file.to_string(),
                            });
                        }
                    }
                }
            }
        }
    }

    let has_physics = json.get("FileReferences")
        .and_then(|f| f.get("Physics"))
        .is_some();

    let has_display_info = json.get("FileReferences")
        .and_then(|f| f.get("DisplayInfo"))
        .is_some();

    Ok(Live2DMetadata {
        model_file: model_path.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string(),
        textures,
        motions,
        has_physics,
        has_display_info,
    })
}

fn find_preview_image(dir: &Path) -> Option<String> {
    let preview_files = ["preview.png", "background.png", "thumb.png"];
    
    for preview_name in &preview_files {
        let preview_path = dir.join(preview_name);
        if preview_path.exists() {
            return preview_path.to_str().map(|s| s.to_string());
        }
    }
    
    None
}