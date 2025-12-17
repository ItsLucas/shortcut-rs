#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod config;

use config::{ShortcutType, expand_env_vars, Shortcut, load_config, save_config};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent, MouseButtonState, MouseButton},
    Manager, Emitter, PhysicalPosition,
};
use std::process::Command;
use std::os::windows::process::CommandExt;
use std::io::Write;

// Windows constants for CreateProcess
const CREATE_NO_WINDOW: u32 = 0x08000000;
const CREATE_NEW_CONSOLE: u32 = 0x00000010;

#[tauri::command]
fn get_shortcuts() -> Vec<config::Shortcut> {
    let cfg = load_config();
    cfg.shortcuts
}

#[tauri::command]
fn add_shortcut(shortcut: Shortcut, app: tauri::AppHandle) -> Result<(), String> {
    let mut cfg = load_config();
    cfg.shortcuts.push(shortcut);
    save_config(&cfg)?;
    // Emit reload event to main window
    let _ = app.emit("reload-shortcuts", ());
    Ok(())
}

#[tauri::command]
fn update_shortcut(index: usize, shortcut: Shortcut, app: tauri::AppHandle) -> Result<(), String> {
    let mut cfg = load_config();
    if index >= cfg.shortcuts.len() {
        return Err("Index out of bounds".to_string());
    }
    cfg.shortcuts[index] = shortcut;
    save_config(&cfg)?;
    let _ = app.emit("reload-shortcuts", ());
    Ok(())
}

#[tauri::command]
fn delete_shortcut(index: usize, app: tauri::AppHandle) -> Result<(), String> {
    let mut cfg = load_config();
    if index >= cfg.shortcuts.len() {
        return Err("Index out of bounds".to_string());
    }
    cfg.shortcuts.remove(index);
    save_config(&cfg)?;
    let _ = app.emit("reload-shortcuts", ());
    Ok(())
}

#[tauri::command]
fn reorder_shortcut(from_index: usize, to_index: usize, app: tauri::AppHandle) -> Result<(), String> {
    let mut cfg = load_config();
    if from_index >= cfg.shortcuts.len() || to_index >= cfg.shortcuts.len() {
        return Err("Index out of bounds".to_string());
    }
    let item = cfg.shortcuts.remove(from_index);
    cfg.shortcuts.insert(to_index, item);
    save_config(&cfg)?;
    let _ = app.emit("reload-shortcuts", ());
    Ok(())
}

#[tauri::command]
fn launch_shortcut(
    shortcut_type: Option<String>,
    command: String,
    script: Option<String>,
    args: Option<String>,
    working_dir: Option<String>,
    hidden: Option<bool>,
    shell: Option<String>,
    admin: Option<bool>,
) {
    let stype = shortcut_type
        .as_deref()
        .map(|s| match s.to_lowercase().as_str() {
            "url" => ShortcutType::Url,
            "file" => ShortcutType::File,
            "folder" => ShortcutType::Folder,
            "script" => ShortcutType::Script,
            "shell" => ShortcutType::Shell,
            _ => ShortcutType::App,
        })
        .unwrap_or(ShortcutType::App);

    let expanded_command = expand_env_vars(&command);
    let expanded_working_dir = working_dir.as_ref().map(|d| expand_env_vars(d));
    let is_hidden = hidden.unwrap_or(false);
    let is_admin = admin.unwrap_or(false);

    match stype {
        ShortcutType::App => {
            launch_app(&expanded_command, args.as_deref(), expanded_working_dir.as_deref(), is_admin);
        }
        ShortcutType::Url => {
            open_url(&expanded_command);
        }
        ShortcutType::File => {
            open_file(&expanded_command, is_admin);
        }
        ShortcutType::Folder => {
            open_folder(&expanded_command);
        }
        ShortcutType::Script => {
            run_script_file(&expanded_command, args.as_deref(), expanded_working_dir.as_deref(), is_hidden, is_admin);
        }
        ShortcutType::Shell => {
            if let Some(script_content) = script {
                run_shell_script(&script_content, shell.as_deref(), expanded_working_dir.as_deref(), is_hidden);
            }
        }
    }
}

/// Launch an application
fn launch_app(command: &str, args: Option<&str>, working_dir: Option<&str>, admin: bool) {
    if admin {
        // Use ShellExecute with runas for admin
        let mut cmd = Command::new("powershell");
        cmd.args(["-Command", &format!("Start-Process '{}' -Verb RunAs", command)]);
        cmd.creation_flags(CREATE_NO_WINDOW);
        let _ = cmd.spawn();
    } else {
        let mut cmd = Command::new(command);
        if let Some(arg_str) = args {
            // Better argument parsing - handle quoted strings
            for arg in parse_args(arg_str) {
                cmd.arg(arg);
            }
        }
        if let Some(dir) = working_dir {
            cmd.current_dir(dir);
        }
        let _ = cmd.spawn();
    }
}

/// Open URL in default browser
fn open_url(url: &str) {
    let _ = Command::new("cmd")
        .args(["/C", "start", "", url])
        .creation_flags(CREATE_NO_WINDOW)
        .spawn();
}

/// Open file with default application
fn open_file(path: &str, admin: bool) {
    if admin {
        let mut cmd = Command::new("powershell");
        cmd.args(["-Command", &format!("Start-Process '{}' -Verb RunAs", path)]);
        cmd.creation_flags(CREATE_NO_WINDOW);
        let _ = cmd.spawn();
    } else {
        let _ = Command::new("cmd")
            .args(["/C", "start", "", path])
            .creation_flags(CREATE_NO_WINDOW)
            .spawn();
    }
}

/// Open folder in explorer
fn open_folder(path: &str) {
    let _ = Command::new("explorer")
        .arg(path)
        .spawn();
}

/// Run a script file (.bat, .ps1, .cmd, etc.)
fn run_script_file(path: &str, args: Option<&str>, working_dir: Option<&str>, hidden: bool, admin: bool) {
    let extension = std::path::Path::new(path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    match extension.as_str() {
        "ps1" => {
            // PowerShell script
            let mut cmd = Command::new("powershell");
            cmd.args(["-ExecutionPolicy", "Bypass", "-File", path]);
            if let Some(arg_str) = args {
                for arg in parse_args(arg_str) {
                    cmd.arg(arg);
                }
            }
            if let Some(dir) = working_dir {
                cmd.current_dir(dir);
            }
            if hidden {
                cmd.creation_flags(CREATE_NO_WINDOW);
            }
            if admin {
                // Re-launch with elevation
                let script_args = args.unwrap_or("");
                let ps_cmd = format!(
                    "Start-Process powershell -Verb RunAs -ArgumentList '-ExecutionPolicy Bypass -File \"{}\" {}'",
                    path, script_args
                );
                let mut admin_cmd = Command::new("powershell");
                admin_cmd.args(["-Command", &ps_cmd]);
                admin_cmd.creation_flags(CREATE_NO_WINDOW);
                let _ = admin_cmd.spawn();
            } else {
                let _ = cmd.spawn();
            }
        }
        "bat" | "cmd" => {
            // Batch script
            let mut cmd = Command::new("cmd");
            cmd.args(["/C", path]);
            if let Some(arg_str) = args {
                for arg in parse_args(arg_str) {
                    cmd.arg(arg);
                }
            }
            if let Some(dir) = working_dir {
                cmd.current_dir(dir);
            }
            if hidden {
                cmd.creation_flags(CREATE_NO_WINDOW);
            } else {
                cmd.creation_flags(CREATE_NEW_CONSOLE);
            }
            if admin {
                let script_args = args.unwrap_or("");
                let ps_cmd = format!(
                    "Start-Process cmd -Verb RunAs -ArgumentList '/C \"{}\" {}'",
                    path, script_args
                );
                let mut admin_cmd = Command::new("powershell");
                admin_cmd.args(["-Command", &ps_cmd]);
                admin_cmd.creation_flags(CREATE_NO_WINDOW);
                let _ = admin_cmd.spawn();
            } else {
                let _ = cmd.spawn();
            }
        }
        _ => {
            // Unknown script type - try to run directly
            let mut cmd = Command::new(path);
            if let Some(arg_str) = args {
                for arg in parse_args(arg_str) {
                    cmd.arg(arg);
                }
            }
            if let Some(dir) = working_dir {
                cmd.current_dir(dir);
            }
            let _ = cmd.spawn();
        }
    }
}

/// Run inline shell script content
fn run_shell_script(script_content: &str, shell: Option<&str>, working_dir: Option<&str>, hidden: bool) {
    let shell_type = shell.unwrap_or("cmd").to_lowercase();

    match shell_type.as_str() {
        "powershell" | "pwsh" => {
            // Create temp ps1 file
            let temp_dir = std::env::temp_dir();
            let temp_file = temp_dir.join(format!("shortcut_script_{}.ps1", std::process::id()));

            if let Ok(mut file) = std::fs::File::create(&temp_file) {
                let _ = file.write_all(script_content.as_bytes());

                let shell_exe = if shell_type == "pwsh" { "pwsh" } else { "powershell" };
                let mut cmd = Command::new(shell_exe);
                cmd.args(["-ExecutionPolicy", "Bypass", "-File", temp_file.to_str().unwrap()]);

                if let Some(dir) = working_dir {
                    cmd.current_dir(dir);
                }
                if hidden {
                    cmd.creation_flags(CREATE_NO_WINDOW);
                }
                let _ = cmd.spawn();
            }
        }
        "cmd" | _ => {
            // Create temp bat file
            let temp_dir = std::env::temp_dir();
            let temp_file = temp_dir.join(format!("shortcut_script_{}.bat", std::process::id()));

            if let Ok(mut file) = std::fs::File::create(&temp_file) {
                // Add @echo off and cleanup command
                let batch_content = format!("@echo off\r\n{}\r\n", script_content.replace('\n', "\r\n"));
                let _ = file.write_all(batch_content.as_bytes());

                let mut cmd = Command::new("cmd");
                cmd.args(["/C", temp_file.to_str().unwrap()]);

                if let Some(dir) = working_dir {
                    cmd.current_dir(dir);
                }
                if hidden {
                    cmd.creation_flags(CREATE_NO_WINDOW);
                } else {
                    cmd.creation_flags(CREATE_NEW_CONSOLE);
                }
                let _ = cmd.spawn();
            }
        }
    }
}

/// Parse arguments respecting quoted strings
fn parse_args(arg_str: &str) -> Vec<String> {
    let mut args = Vec::new();
    let mut current = String::new();
    let mut in_quotes = false;
    let mut quote_char = ' ';

    for c in arg_str.chars() {
        match c {
            '"' | '\'' if !in_quotes => {
                in_quotes = true;
                quote_char = c;
            }
            c if c == quote_char && in_quotes => {
                in_quotes = false;
            }
            ' ' if !in_quotes => {
                if !current.is_empty() {
                    args.push(current.clone());
                    current.clear();
                }
            }
            _ => {
                current.push(c);
            }
        }
    }

    if !current.is_empty() {
        args.push(current);
    }

    args
}

#[tauri::command]
fn hide_window(window: tauri::Window) {
    let _ = window.hide();
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Setup Tray
            let quit_i = MenuItem::with_id(app, "quit", "Exit", true, None::<&str>).unwrap();
            let reload_i = MenuItem::with_id(app, "reload", "Reload Config", true, None::<&str>).unwrap();
            let settings_i = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>).unwrap();

            let menu = Menu::with_items(app, &[&settings_i, &reload_i, &quit_i]).unwrap();

            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .icon(app.default_window_icon().unwrap().clone())
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "quit" => {
                            app.exit(0);
                        }
                        "reload" => {
                             // Reload logic: emit event to frontend to refresh
                             app.emit("reload-shortcuts", ()).unwrap();
                        }
                        "settings" => {
                            // Open settings window
                            if let Some(window) = app.get_webview_window("settings") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, rect, .. } = event {
                         let app = tray.app_handle();
                         if let Some(window) = app.get_webview_window("main") {
                             // Get window size
                             let win_size = window.outer_size().unwrap_or(tauri::PhysicalSize { width: 300, height: 400 });

                             // Position window above the tray icon
                             // Extract physical position from the rect
                             let (tray_x, tray_y) = match rect.position {
                                 tauri::Position::Physical(pos) => (pos.x, pos.y),
                                 tauri::Position::Logical(pos) => (pos.x as i32, pos.y as i32),
                             };
                             let tray_width = match rect.size {
                                 tauri::Size::Physical(size) => size.width as i32,
                                 tauri::Size::Logical(size) => size.width as i32,
                             };

                             let x = tray_x - (win_size.width as i32 / 2) + (tray_width / 2);
                             let y = tray_y - win_size.height as i32;

                             let _ = window.set_position(PhysicalPosition::new(x, y));
                             let _ = window.show();
                             let _ = window.set_focus();
                         }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_shortcuts, add_shortcut, update_shortcut, delete_shortcut, reorder_shortcut, launch_shortcut, hide_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
