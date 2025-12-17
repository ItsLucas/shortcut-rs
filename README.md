# shortcut-rs

[![Build and Release](https://github.com/ItsLucas/shortcut-rs/actions/workflows/build.yml/badge.svg)](https://github.com/ItsLucas/shortcut-rs/actions/workflows/build.yml)

A lightweight Windows system tray shortcut launcher built with Tauri 2.

![Demo](https://img.shields.io/badge/platform-Windows-blue)

## Features

- **System Tray Integration** - Lives in your system tray, always accessible
- **Multiple Shortcut Types**:
  - **App** - Launch executables with arguments
  - **URL** - Open links in default browser
  - **File** - Open files with default application
  - **Folder** - Open folders in Explorer
  - **Script** - Run .bat, .ps1, .cmd scripts
  - **Shell** - Execute inline shell commands (cmd/powershell/pwsh)
- **Drag & Drop Reordering** - Organize shortcuts by dragging
- **Admin Elevation** - Run shortcuts as administrator (UAC prompt)
- **Hidden Execution** - Run scripts without console window
- **Environment Variables** - Supports `%VAR%` expansion in paths
- **Auto Theme** - Follows Windows light/dark mode

## Installation

Download the latest installer from [Releases](https://github.com/ItsLucas/shortcut-rs/releases):
- `.exe` - NSIS installer
- `.msi` - Windows Installer package

## Usage

1. After installation, the app runs in your system tray
2. **Left-click** the tray icon to open the shortcut popup
3. **Right-click** for the context menu:
   - **Settings** - Add, edit, delete, and reorder shortcuts
   - **Reload Config** - Reload configuration from disk
   - **Exit** - Close the application

## Configuration

Config file location: `%APPDATA%\shortcuts\config.json`

```json
{
  "shortcuts": [
    {
      "name": "Notepad",
      "type": "app",
      "command": "notepad.exe",
      "args": null,
      "working_dir": null,
      "description": "Text editor",
      "hidden": false,
      "admin": false
    },
    {
      "name": "Google",
      "type": "url",
      "command": "https://www.google.com"
    },
    {
      "name": "Documents",
      "type": "folder",
      "command": "%USERPROFILE%\\Documents"
    },
    {
      "name": "System Info",
      "type": "shell",
      "script": "systeminfo | findstr /B /C:\"OS Name\"\npause",
      "shell": "cmd",
      "hidden": false
    }
  ]
}
```

## Building from Source

### Prerequisites

- [Rust](https://rustup.rs/) (stable)
- Windows 10/11

### Build

```bash
# Development
cargo run --manifest-path src-tauri/Cargo.toml

# Release build
cargo install tauri-cli
cargo tauri build
```

Installers will be in `src-tauri/target/release/bundle/`

## License

MIT
