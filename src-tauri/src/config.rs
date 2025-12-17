use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// Shortcut types supported by the application
#[derive(Serialize, Deserialize, Clone, Debug, Default, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ShortcutType {
    #[default]
    App,      // Launch an application
    Url,      // Open URL in default browser
    File,     // Open file with default application
    Folder,   // Open folder in explorer
    Script,   // Run a script file (bat, ps1, sh)
    Shell,    // Run shell command (can be multi-line)
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Shortcut {
    pub name: String,

    #[serde(default)]
    #[serde(rename = "type")]
    pub shortcut_type: ShortcutType,

    // For app/script: executable path; for url: the URL; for file/folder: path
    #[serde(default)]
    pub command: String,

    // For shell type: the actual script content (multi-line supported)
    pub script: Option<String>,

    // Command-line arguments
    pub args: Option<String>,

    // Working directory
    pub working_dir: Option<String>,

    // Optional description shown in UI
    pub description: Option<String>,

    // For shell/script: run hidden (no console window)
    #[serde(default)]
    pub hidden: bool,

    // For shell/script: shell to use (cmd, powershell, pwsh)
    pub shell: Option<String>,

    // Run as administrator
    #[serde(default)]
    pub admin: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AppConfig {
    pub shortcuts: Vec<Shortcut>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            shortcuts: vec![
                Shortcut {
                    name: "Notepad".to_string(),
                    shortcut_type: ShortcutType::App,
                    command: "notepad.exe".to_string(),
                    script: None,
                    args: None,
                    working_dir: None,
                    description: Some("Text editor".to_string()),
                    hidden: false,
                    shell: None,
                    admin: false,
                },
                Shortcut {
                    name: "Calculator".to_string(),
                    shortcut_type: ShortcutType::App,
                    command: "calc.exe".to_string(),
                    script: None,
                    args: None,
                    working_dir: None,
                    description: None,
                    hidden: false,
                    shell: None,
                    admin: false,
                },
                Shortcut {
                    name: "Google".to_string(),
                    shortcut_type: ShortcutType::Url,
                    command: "https://www.google.com".to_string(),
                    script: None,
                    args: None,
                    working_dir: None,
                    description: Some("Search engine".to_string()),
                    hidden: false,
                    shell: None,
                    admin: false,
                },
                Shortcut {
                    name: "Documents".to_string(),
                    shortcut_type: ShortcutType::Folder,
                    command: "%USERPROFILE%\\Documents".to_string(),
                    script: None,
                    args: None,
                    working_dir: None,
                    description: None,
                    hidden: false,
                    shell: None,
                    admin: false,
                },
                Shortcut {
                    name: "System Info".to_string(),
                    shortcut_type: ShortcutType::Shell,
                    command: String::new(),
                    script: Some("systeminfo | findstr /B /C:\"OS Name\" /C:\"OS Version\"\npause".to_string()),
                    args: None,
                    working_dir: None,
                    description: Some("Show OS info".to_string()),
                    hidden: false,
                    shell: Some("cmd".to_string()),
                    admin: false,
                },
            ],
        }
    }
}

pub fn get_config_path() -> PathBuf {
    let app_data = std::env::var("APPDATA").unwrap_or_else(|_| ".".to_string());
    let mut path = PathBuf::from(app_data);
    path.push("shortcuts");
    if !path.exists() {
        let _ = fs::create_dir_all(&path);
    }
    path.push("config.json");
    path
}

pub fn load_config() -> AppConfig {
    let path = get_config_path();
    if path.exists() {
        if let Ok(content) = fs::read_to_string(&path) {
            if let Ok(config) = serde_json::from_str(&content) {
                return config;
            }
        }
    }

    // Create default if missing or invalid
    let config = AppConfig::default();
    if let Ok(json) = serde_json::to_string_pretty(&config) {
        let _ = fs::write(&path, json);
    }
    config
}

pub fn save_config(config: &AppConfig) -> Result<(), String> {
    let path = get_config_path();
    let json = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    fs::write(&path, json)
        .map_err(|e| format!("Failed to write config: {}", e))?;
    Ok(())
}

/// Expand environment variables in a path (Windows style %VAR%)
pub fn expand_env_vars(input: &str) -> String {
    let mut result = input.to_string();
    let re = regex::Regex::new(r"%([^%]+)%").unwrap();

    for cap in re.captures_iter(input) {
        if let Some(var_name) = cap.get(1) {
            if let Ok(value) = std::env::var(var_name.as_str()) {
                result = result.replace(&cap[0], &value);
            }
        }
    }
    result
}
