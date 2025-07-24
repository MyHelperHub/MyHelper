use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub enum AnimationTechnology {
    #[serde(rename = "live2d")]
    Live2D,
    #[serde(rename = "spine")]
    Spine,
    #[serde(rename = "lottie")]
    Lottie,
    #[serde(rename = "unknown")]
    Unknown,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnimationModel {
    pub id: String,
    pub name: String,
    pub technology: AnimationTechnology,
    pub path: String,
    pub preview: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DetectionResult {
    pub technology: AnimationTechnology,
    pub is_valid: bool,
    pub error: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Live2DMotion {
    pub group: String,
    pub file: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Live2DMetadata {
    pub model_file: String,
    pub textures: Vec<String>,
    pub motions: Vec<Live2DMotion>,
    pub has_physics: bool,
    pub has_display_info: bool,
}