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

// SVG Icons
const icons = {
    app: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
    url: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
    file: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`,
    folder: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
    script: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    shell: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`,
    empty: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>`,
    drag: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>`,
    edit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
    delete: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
};

// Type labels
const typeLabels = {
    app: 'Application',
    url: 'URL',
    file: 'File',
    folder: 'Folder',
    script: 'Script',
    shell: 'Shell',
};

whenReady(() => {
    const { invoke } = window.__TAURI__.core;

    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`tab-${targetTab}`).classList.add('active');
        });
    });

    // Auto-start toggle
    const autostartToggle = document.getElementById('autostart-toggle');

    async function loadAutostartState() {
        try {
            const enabled = await invoke('get_autostart');
            autostartToggle.checked = enabled;
        } catch (e) {
            console.error('Failed to get autostart state', e);
        }
    }

    autostartToggle.addEventListener('change', async () => {
        try {
            await invoke('set_autostart', { enabled: autostartToggle.checked });
        } catch (e) {
            console.error('Failed to set autostart', e);
            // Revert toggle on error
            autostartToggle.checked = !autostartToggle.checked;
        }
    });

    // Load autostart state on init
    loadAutostartState();

    let shortcuts = [];
    let editingIndex = -1;

    // DOM elements
    const list = document.getElementById('shortcut-list');
    const addBtn = document.getElementById('add-btn');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalClose = document.getElementById('modal-close');
    const form = document.getElementById('shortcut-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const deleteBtn = document.getElementById('delete-btn');

    // Form fields
    const typeSelect = document.getElementById('type');
    const commandGroup = document.getElementById('command-group');
    const commandLabel = document.getElementById('command-label');
    const commandInput = document.getElementById('command');
    const scriptGroup = document.getElementById('script-group');
    const argsGroup = document.getElementById('args-group');
    const workingDirGroup = document.getElementById('working-dir-group');
    const shellGroup = document.getElementById('shell-group');
    const hiddenGroup = document.getElementById('hidden-group');
    const browseBtn = document.getElementById('browse-btn');
    const browseDirBtn = document.getElementById('browse-dir-btn');

    // Load shortcuts
    async function loadShortcuts() {
        try {
            shortcuts = await invoke('get_shortcuts');
            renderList();
        } catch (e) {
            console.error('Failed to load shortcuts', e);
        }
    }

    // Render the list
    function renderList() {
        list.innerHTML = '';

        if (shortcuts.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    ${icons.empty}
                    <p>No shortcuts yet.<br>Click "Add Shortcut" to create one.</p>
                </div>
            `;
            return;
        }

        shortcuts.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'shortcut-item';
            li.dataset.index = index;

            const shortcutType = item.type || 'app';

            li.innerHTML = `
                <div class="drag-handle">${icons.drag}</div>
                <div class="shortcut-icon type-${shortcutType}">${icons[shortcutType] || icons.app}</div>
                <div class="shortcut-info">
                    <div class="shortcut-name">
                        ${escapeHtml(item.name)}
                        ${item.admin ? '<span class="admin-badge">Admin</span>' : ''}
                    </div>
                    <div class="shortcut-meta">
                        <span class="shortcut-type">${typeLabels[shortcutType] || shortcutType}</span>
                        <span>${escapeHtml(item.description || item.command || item.script?.substring(0, 40) || '')}</span>
                    </div>
                </div>
                <div class="shortcut-actions">
                    <button class="btn-icon edit-btn" title="Edit">${icons.edit}</button>
                    <button class="btn-icon delete-btn" title="Delete">${icons.delete}</button>
                </div>
            `;

            // Mouse-based drag and drop on the handle
            const handle = li.querySelector('.drag-handle');
            handle.addEventListener('mousedown', (e) => startDrag(e, li, index));

            // Click to edit (but not on drag handle or action buttons)
            li.addEventListener('click', (e) => {
                if (!e.target.closest('.drag-handle') && !e.target.closest('.shortcut-actions')) {
                    openEditModal(index);
                }
            });

            // Event handlers for action buttons
            li.querySelector('.edit-btn').onclick = (e) => {
                e.stopPropagation();
                openEditModal(index);
            };

            li.querySelector('.delete-btn').onclick = (e) => {
                e.stopPropagation();
                deleteShortcut(index);
            };

            list.appendChild(li);
        });
    }

    // Mouse-based drag and drop implementation
    let dragState = null;

    function startDrag(e, element, index) {
        e.preventDefault();

        const rect = element.getBoundingClientRect();
        const listRect = list.getBoundingClientRect();

        // Create a clone for visual feedback
        const clone = element.cloneNode(true);
        clone.classList.add('drag-clone');
        clone.style.width = rect.width + 'px';
        clone.style.position = 'fixed';
        clone.style.top = '0';
        clone.style.left = '0';
        clone.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
        clone.style.zIndex = '1000';
        clone.style.pointerEvents = 'none';
        clone.style.willChange = 'transform';
        document.body.appendChild(clone);

        element.classList.add('dragging');
        document.body.classList.add('dragging');

        dragState = {
            element,
            clone,
            index,
            startX: rect.left,
            startY: rect.top,
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
            listTop: listRect.top,
            listBottom: listRect.bottom
        };

        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
    }

    function onDragMove(e) {
        if (!dragState) return;

        const { clone, index, offsetX, offsetY } = dragState;

        // Move the clone using transform (GPU accelerated)
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        clone.style.transform = `translate(${x}px, ${y}px)`;

        // Find which item we're hovering over
        const items = list.querySelectorAll('.shortcut-item');
        items.forEach((item, i) => {
            item.classList.remove('drag-over-top', 'drag-over-bottom');

            if (i === index) return;

            const rect = item.getBoundingClientRect();
            if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
                const midpoint = rect.top + rect.height / 2;
                if (e.clientY < midpoint) {
                    item.classList.add('drag-over-top');
                } else {
                    item.classList.add('drag-over-bottom');
                }
            }
        });
    }

    async function onDragEnd(e) {
        if (!dragState) return;

        const { element, clone, index } = dragState;

        // Remove clone and classes
        clone.remove();
        element.classList.remove('dragging');
        document.body.classList.remove('dragging');

        document.querySelectorAll('.shortcut-item').forEach(item => {
            item.classList.remove('drag-over-top', 'drag-over-bottom');
        });

        // Find drop target
        const items = list.querySelectorAll('.shortcut-item');
        let newIndex = index;

        for (let i = 0; i < items.length; i++) {
            if (i === index) continue;

            const rect = items[i].getBoundingClientRect();
            if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
                const midpoint = rect.top + rect.height / 2;
                if (e.clientY < midpoint) {
                    newIndex = i;
                } else {
                    newIndex = i + 1;
                }
                // Adjust for removal
                if (index < newIndex) {
                    newIndex--;
                }
                break;
            }
        }

        document.removeEventListener('mousemove', onDragMove);
        document.removeEventListener('mouseup', onDragEnd);

        if (newIndex !== index) {
            try {
                await invoke('reorder_shortcut', { fromIndex: index, toIndex: newIndex });
                await loadShortcuts();
            } catch (err) {
                console.error('Failed to reorder:', err);
            }
        }

        dragState = null;
    }

    // Update form visibility based on type
    function updateFormForType(type) {
        // Reset visibility
        commandGroup.classList.remove('hidden');
        scriptGroup.classList.add('hidden');
        argsGroup.classList.remove('hidden');
        workingDirGroup.classList.remove('hidden');
        shellGroup.classList.add('hidden');
        hiddenGroup.classList.remove('hidden');
        browseBtn.classList.remove('hidden');

        switch (type) {
            case 'app':
                commandLabel.textContent = 'Executable Path';
                break;
            case 'url':
                commandLabel.textContent = 'URL';
                commandInput.placeholder = 'https://example.com';
                argsGroup.classList.add('hidden');
                workingDirGroup.classList.add('hidden');
                hiddenGroup.classList.add('hidden');
                browseBtn.classList.add('hidden');
                break;
            case 'file':
                commandLabel.textContent = 'File Path';
                argsGroup.classList.add('hidden');
                workingDirGroup.classList.add('hidden');
                hiddenGroup.classList.add('hidden');
                break;
            case 'folder':
                commandLabel.textContent = 'Folder Path';
                argsGroup.classList.add('hidden');
                workingDirGroup.classList.add('hidden');
                hiddenGroup.classList.add('hidden');
                break;
            case 'script':
                commandLabel.textContent = 'Script File Path';
                commandInput.placeholder = 'C:\\Scripts\\myscript.ps1';
                break;
            case 'shell':
                commandGroup.classList.add('hidden');
                scriptGroup.classList.remove('hidden');
                argsGroup.classList.add('hidden');
                shellGroup.classList.remove('hidden');
                break;
        }
    }

    // Open modal for adding
    function openAddModal() {
        editingIndex = -1;
        modalTitle.textContent = 'Add Shortcut';
        deleteBtn.classList.add('hidden');
        form.reset();
        updateFormForType('app');
        modal.classList.remove('hidden');
    }

    // Open modal for editing
    function openEditModal(index) {
        editingIndex = index;
        const item = shortcuts[index];
        modalTitle.textContent = 'Edit Shortcut';
        deleteBtn.classList.remove('hidden');

        // Populate form
        document.getElementById('name').value = item.name || '';
        const shortcutType = item.shortcut_type || item.type || 'app';
        typeSelect.value = shortcutType;
        document.getElementById('command').value = item.command || '';
        document.getElementById('script').value = item.script || '';
        document.getElementById('args').value = item.args || '';
        document.getElementById('working_dir').value = item.working_dir || '';
        document.getElementById('description').value = item.description || '';
        document.getElementById('shell').value = item.shell || 'cmd';
        document.getElementById('hidden').checked = item.hidden || false;
        document.getElementById('admin').checked = item.admin || false;

        updateFormForType(shortcutType);
        modal.classList.remove('hidden');
    }

    // Close modal
    function closeModal() {
        modal.classList.add('hidden');
        form.reset();
        editingIndex = -1;
    }

    // Save shortcut
    async function saveShortcut(e) {
        e.preventDefault();

        const formData = new FormData(form);
        const type = formData.get('type');

        const shortcut = {
            name: formData.get('name'),
            type: type,
            command: formData.get('command') || '',
            script: type === 'shell' ? formData.get('script') : null,
            args: formData.get('args') || null,
            working_dir: formData.get('working_dir') || null,
            description: formData.get('description') || null,
            shell: type === 'shell' ? formData.get('shell') : null,
            hidden: formData.get('hidden') === 'on',
            admin: formData.get('admin') === 'on',
        };

        // Clean up null/empty optional fields
        if (!shortcut.args) shortcut.args = null;
        if (!shortcut.working_dir) shortcut.working_dir = null;
        if (!shortcut.description) shortcut.description = null;

        try {
            if (editingIndex >= 0) {
                await invoke('update_shortcut', { index: editingIndex, shortcut });
            } else {
                await invoke('add_shortcut', { shortcut });
            }
            closeModal();
            await loadShortcuts();
        } catch (e) {
            console.error('Failed to save shortcut', e);
            alert('Failed to save shortcut: ' + e);
        }
    }

    // Delete shortcut
    async function deleteShortcut(index) {
        if (!confirm('Are you sure you want to delete this shortcut?')) {
            return;
        }

        try {
            await invoke('delete_shortcut', { index });
            closeModal();
            await loadShortcuts();
        } catch (e) {
            console.error('Failed to delete shortcut', e);
        }
    }

    // Browse for file
    async function browseFile() {
        try {
            const { open } = window.__TAURI__.dialog;
            const type = typeSelect.value;

            let filters = [];
            if (type === 'app') {
                filters = [{ name: 'Executables', extensions: ['exe', 'bat', 'cmd', 'ps1', 'lnk'] }];
            } else if (type === 'script') {
                filters = [{ name: 'Scripts', extensions: ['bat', 'cmd', 'ps1', 'vbs', 'js'] }];
            }

            const selected = await open({
                multiple: false,
                filters: filters.length > 0 ? filters : undefined,
            });

            if (selected) {
                commandInput.value = selected;
            }
        } catch (e) {
            console.error('Failed to open file dialog', e);
        }
    }

    // Browse for folder
    async function browseFolder() {
        try {
            const { open } = window.__TAURI__.dialog;
            const selected = await open({
                directory: true,
                multiple: false,
            });

            if (selected) {
                if (typeSelect.value === 'folder') {
                    commandInput.value = selected;
                } else {
                    document.getElementById('working_dir').value = selected;
                }
            }
        } catch (e) {
            console.error('Failed to open folder dialog', e);
        }
    }

    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Event listeners
    addBtn.onclick = openAddModal;
    modalClose.onclick = closeModal;
    cancelBtn.onclick = closeModal;
    form.onsubmit = saveShortcut;
    deleteBtn.onclick = () => deleteShortcut(editingIndex);
    typeSelect.onchange = () => updateFormForType(typeSelect.value);
    browseBtn.onclick = browseFile;
    browseDirBtn.onclick = browseFolder;

    // Close on backdrop click
    modal.querySelector('.modal-backdrop').onclick = closeModal;

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });

    // Initial load
    loadShortcuts();
});
