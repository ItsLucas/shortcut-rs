# Shortcut-RS

A Windows system tray shortcut launcher built with Tauri 2 and vanilla JavaScript.

## Quick Start

```bash
# Development
cargo run --manifest-path src-tauri/Cargo.toml

# Build release
cargo build --release --manifest-path src-tauri/Cargo.toml
```

## Architecture

```
shortcut-rs/
├── src/                    # Frontend (vanilla HTML/CSS/JS)
│   ├── index.html          # Main popup window
│   ├── styles.css          # Main popup styles (dark/light theme)
│   ├── main.js             # Main popup logic
│   ├── settings.html       # Settings window
│   ├── settings.css        # Settings styles (dark/light theme)
│   └── settings.js         # Settings logic (CRUD, drag-drop reorder)
│
├── src-tauri/              # Backend (Rust + Tauri)
│   ├── src/
│   │   ├── main.rs         # App entry, tray setup, Tauri commands
│   │   └── config.rs       # Config structs, load/save, env var expansion
│   ├── capabilities/
│   │   └── default.json    # Tauri 2 permissions (dialog plugin)
│   ├── icons/              # App icons
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
```

## Key Components

### Tauri Commands (src-tauri/src/main.rs)

| Command | Description |
|---------|-------------|
| `get_shortcuts` | Returns all shortcuts from config |
| `add_shortcut` | Adds a new shortcut |
| `update_shortcut` | Updates shortcut at index |
| `delete_shortcut` | Deletes shortcut at index |
| `reorder_shortcut` | Moves shortcut from one index to another |
| `launch_shortcut` | Executes a shortcut based on type |
| `hide_window` | Hides the main popup |

### Shortcut Types (src-tauri/src/config.rs)

| Type | Description | Key Fields |
|------|-------------|------------|
| `app` | Launch executable | `command`, `args`, `working_dir` |
| `url` | Open in browser | `command` (the URL) |
| `file` | Open with default app | `command` (file path) |
| `folder` | Open in Explorer | `command` (folder path) |
| `script` | Run .bat/.ps1/.cmd | `command` (script path), `args`, `hidden` |
| `shell` | Inline script | `script` (content), `shell` (cmd/powershell/pwsh), `hidden` |

### Config Location

```
%APPDATA%\shortcuts\config.json
```

### Config Schema

```json
{
  "shortcuts": [
    {
      "name": "Display Name",
      "type": "app|url|file|folder|script|shell",
      "command": "path or URL",
      "script": "inline script content (shell type only)",
      "args": "optional arguments",
      "working_dir": "optional working directory",
      "description": "optional description",
      "shell": "cmd|powershell|pwsh (shell type only)",
      "hidden": false,
      "admin": false
    }
  ]
}
```

## Features

- **System Tray**: Left-click opens popup, right-click opens menu
- **Settings Window**: Right-click tray → Settings
- **Drag Reorder**: Mouse-based drag-drop in settings (grip handle)
- **Theme**: Auto-follows Windows light/dark mode via `prefers-color-scheme`
- **Environment Variables**: Supports `%VAR%` expansion in paths
- **Admin Elevation**: `admin: true` triggers UAC prompt

## Dependencies

### Rust (Cargo.toml)
- `tauri` v2 - Framework
- `tauri-plugin-dialog` v2 - File picker dialogs
- `serde` / `serde_json` - Config serialization
- `regex` - Environment variable expansion

### Frontend
- Vanilla JS (no framework)
- `window.__TAURI__` API via `withGlobalTauri: true`

## Windows-Specific

- Uses `CREATE_NO_WINDOW` / `CREATE_NEW_CONSOLE` flags for process creation
- PowerShell elevation via `Start-Process -Verb RunAs`
- Temp scripts created in `%TEMP%` for shell type shortcuts

## Adding New Shortcut Types

1. Add variant to `ShortcutType` enum in `config.rs`
2. Add match arm in `launch_shortcut` in `main.rs`
3. Add icon SVG and color in `main.js` and `settings.js`
4. Update form logic in `settings.js` `updateFormForType()`
