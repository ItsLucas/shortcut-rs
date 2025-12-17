// Wait for Tauri to be ready
function whenReady(callback) {
    if (window.__TAURI__) {
        callback();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            if (window.__TAURI__) {
                callback();
            } else {
                console.error('Tauri API not available');
            }
        });
    }
}

// SVG Icons for different shortcut types
const icons = {
    // Apps
    app: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,

    // URL / Web
    url: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,

    // File
    file: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`,

    // Folder
    folder: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,

    // Script file
    script: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,

    // Shell / Terminal
    shell: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`,

    // Arrow indicator
    arrow: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`,

    // Empty state
    empty: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>`,

    // Admin shield
    admin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`
};

// Icon color schemes for different types
const iconColors = {
    app: { from: '#6366f1', to: '#8b5cf6' },      // Indigo to purple
    url: { from: '#0ea5e9', to: '#06b6d4' },      // Sky to cyan
    file: { from: '#f59e0b', to: '#f97316' },     // Amber to orange
    folder: { from: '#eab308', to: '#facc15' },   // Yellow
    script: { from: '#22c55e', to: '#10b981' },   // Green to emerald
    shell: { from: '#a855f7', to: '#d946ef' },    // Purple to fuchsia
};

// Get icon based on shortcut type
function getIconForType(type) {
    const t = (type || 'app').toLowerCase();
    return icons[t] || icons.app;
}

// Get color scheme for type
function getColorsForType(type) {
    const t = (type || 'app').toLowerCase();
    return iconColors[t] || iconColors.app;
}

whenReady(() => {
    const { invoke } = window.__TAURI__.core;
    const { listen } = window.__TAURI__.event;

    async function loadShortcuts() {
        const list = document.getElementById('shortcut-list');
        if (!list) {
            console.error('shortcut-list element not found');
            return;
        }

        try {
            const shortcuts = await invoke('get_shortcuts');
            list.innerHTML = '';

            if (shortcuts.length === 0) {
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'empty-state';
                emptyDiv.innerHTML = `
                    ${icons.empty}
                    <p>No shortcuts configured.<br>Right-click tray icon to open config.</p>
                `;
                list.appendChild(emptyDiv);
                return;
            }

            shortcuts.forEach((item, index) => {
                const li = document.createElement('li');
                li.className = 'shortcut-item';
                li.tabIndex = 0;
                li.style.animationDelay = `${index * 0.02}s`;

                // Get type (handle both snake_case from Rust and the value)
                const shortcutType = item.shortcut_type || item.type || 'app';

                // Icon with type-specific gradient
                const iconDiv = document.createElement('div');
                iconDiv.className = 'shortcut-icon';
                const colors = getColorsForType(shortcutType);
                iconDiv.style.background = `linear-gradient(135deg, ${colors.from}, ${colors.to})`;
                iconDiv.innerHTML = getIconForType(shortcutType);

                // Content
                const contentDiv = document.createElement('div');
                contentDiv.className = 'shortcut-content';

                const nameSpan = document.createElement('span');
                nameSpan.className = 'shortcut-name';
                nameSpan.textContent = item.name;

                // Add admin badge if needed
                if (item.admin) {
                    const adminBadge = document.createElement('span');
                    adminBadge.className = 'admin-badge';
                    adminBadge.title = 'Runs as Administrator';
                    adminBadge.innerHTML = icons.admin;
                    nameSpan.appendChild(adminBadge);
                }

                contentDiv.appendChild(nameSpan);

                // Description or type indicator
                const descSpan = document.createElement('span');
                descSpan.className = 'shortcut-desc';
                if (item.description) {
                    descSpan.textContent = item.description;
                } else if (shortcutType === 'shell' && item.shell) {
                    descSpan.textContent = `${item.shell} script`;
                } else if (shortcutType === 'url') {
                    // Show domain for URLs
                    try {
                        const url = new URL(item.command);
                        descSpan.textContent = url.hostname;
                    } catch {
                        descSpan.textContent = item.command;
                    }
                } else if (item.working_dir) {
                    descSpan.textContent = item.working_dir;
                } else {
                    descSpan.textContent = shortcutType.charAt(0).toUpperCase() + shortcutType.slice(1);
                }
                contentDiv.appendChild(descSpan);

                // Arrow
                const arrowDiv = document.createElement('div');
                arrowDiv.className = 'shortcut-arrow';
                arrowDiv.innerHTML = icons.arrow;

                li.appendChild(iconDiv);
                li.appendChild(contentDiv);
                li.appendChild(arrowDiv);

                // Click handler
                const launchShortcut = async () => {
                    li.style.transform = 'scale(0.97)';
                    setTimeout(() => {
                        li.style.transform = '';
                    }, 100);

                    await invoke('launch_shortcut', {
                        shortcutType: shortcutType,
                        command: item.command || '',
                        script: item.script || null,
                        args: item.args || null,
                        workingDir: item.working_dir || null,
                        hidden: item.hidden || false,
                        shell: item.shell || null,
                        admin: item.admin || false
                    });
                    await invoke('hide_window');
                };

                li.onclick = launchShortcut;

                // Keyboard support
                li.onkeydown = (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        launchShortcut();
                    }
                };

                list.appendChild(li);
            });
        } catch (e) {
            console.error('Failed to load shortcuts', e);
            list.innerHTML = `
                <div class="empty-state">
                    ${icons.empty}
                    <p>Failed to load shortcuts.<br>Check config file format.</p>
                </div>
            `;
        }
    }

    // Hide on blur
    window.addEventListener('blur', () => {
        invoke('hide_window');
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            invoke('hide_window');
        }

        const items = document.querySelectorAll('.shortcut-item');
        if (items.length === 0) return;

        const focused = document.activeElement;
        const currentIndex = Array.from(items).indexOf(focused);

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            items[nextIndex].focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            items[prevIndex].focus();
        }
    });

    // Listen for reload event from backend
    listen('reload-shortcuts', () => {
        loadShortcuts();
    });

    // Initial load
    loadShortcuts();
});
