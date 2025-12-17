# Shortcuts - Requirements

A minimal Windows system tray launcher application.

## Core Functionality

### System Tray
- Application runs as a tray-resident app (no main window on startup)
- Displays an icon in the Windows system tray notification area
- Left-click on tray icon toggles a popup menu of shortcuts
- Right-click on tray icon shows a context menu with:
  - Open Config (opens config file in default editor)
  - Reload Config (reloads shortcuts without restart)
  - Exit

### Popup Window
- Appears directly above the tray icon when activated
- Displays a list of user-configured shortcuts
- Each item shows the shortcut name
- Hover state: visual highlight on mouseover
- Click: launches the associated command and hides popup
- Auto-hide: popup closes when it loses focus (click elsewhere)
- Always on top of other windows
- No title bar or window decorations
- Modern appearance (dark theme, rounded corners, subtle shadows)

### Configuration
- JSON config file stored at `%APPDATA%\shortcuts\config.json`
- Auto-creates default config if missing
- Each shortcut entry contains:
  - `name`: Display text shown in popup
  - `command`: Executable path or shell command
  - `args`: (optional) Command-line arguments
  - `working_dir`: (optional) Working directory for the command

### Default Shortcuts (created on first run)
```json
{
  "shortcuts": [
    { "name": "Notepad", "command": "notepad.exe" },
    { "name": "Calculator", "command": "calc.exe" },
    { "name": "Explorer", "command": "explorer.exe" }
  ]
}
```

## Non-Functional Requirements

### Platform
- Windows 10/11 only

### Performance
- Instant popup display (<50ms)
- Minimal memory footprint
- No background CPU usage when idle

### UX
- Single instance only (prevent multiple copies running)
- Popup sized dynamically based on number of shortcuts
- DPI-aware (scales correctly on high-DPI displays)

## Nice-to-Have (Future)
- Keyboard navigation (arrow keys, Enter to launch)
- Global hotkey to show popup
- Icons next to shortcut names
- Shortcut categories/groups
- Search/filter shortcuts
