use serde_json::{Map, Value};
use std::collections::HashMap;
use std::env;
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};

// 获取配置文件的路径并确保目录存在
fn get_config_path() -> Result<PathBuf, String> {
    let home_dir = env::var("APPDATA").map_err(|e| e.to_string())?;
    let myhelper_path = Path::new(&home_dir).join("MyHelper");

    if !myhelper_path.exists() {
        fs::create_dir_all(&myhelper_path).map_err(|e| e.to_string())?;
    }

    Ok(myhelper_path.join("config.json"))
}

// 读取配置文件
fn read_config(config_path: &Path) -> Result<HashMap<String, Value>, String> {
    if config_path.exists() {
        let mut file = File::open(config_path).map_err(|e| e.to_string())?;
        let mut contents = String::new();
        file.read_to_string(&mut contents)
            .map_err(|e| e.to_string())?;
        serde_json::from_str(&contents).map_err(|e| e.to_string())
    } else {
        Ok(HashMap::new())
    }
}

// 保存配置数据
pub fn utils_set_config(data: HashMap<String, Value>) -> Result<(), String> {
    let config_path = get_config_path()?;

    let config_data = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    let mut file = File::create(config_path).map_err(|e| e.to_string())?;
    file.write_all(config_data.as_bytes())
        .map_err(|e| e.to_string())?;

    Ok(())
}

// 获取配置数据，支持嵌套字段访问
pub fn utils_get_config(keys: Vec<String>) -> Result<Option<Value>, String> {
    let config_path = get_config_path()?;
    let data = read_config(&config_path)?;

    let mut current_value = Value::Object(data.into_iter().collect::<Map<_, _>>());

    for key in keys {
        match current_value.get(&key) {
            Some(value) => current_value = value.clone(),
            None => return Ok(None),
        }
    }

    Ok(Some(current_value))
}
