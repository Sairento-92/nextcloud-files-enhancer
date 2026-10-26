/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Implements Nextcloud PR #61825:
 * Pinning folders / files to the top of the file list (Sticky Folders).
 */

export class PinnedFolders {
    constructor() {
        this.storageKey = 'fe_pinned_folders';
        this.init();
    }

    init() {
        this.registerAction();
        this.observeDOM();
    }

    getPinned() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        } catch {
            return [];
        }
    }

    togglePin(filePath) {
        let pinned = this.getPinned();
        if (pinned.includes(filePath)) {
            pinned = pinned.filter(p => p !== filePath);
            if (window.OC && window.OC.Notification) {
                window.OC.Notification.showTemporary('Odepchnięto z góry: ' + filePath);
            }
        } else {
            pinned.push(filePath);
            if (window.OC && window.OC.Notification) {
                window.OC.Notification.showTemporary('📌 Przypięto na samej górze: ' + filePath);
            }
        }
        localStorage.setItem(this.storageKey, JSON.stringify(pinned));
        this.applyPins();
    }

    registerAction() {
        if (!window.OCA || !window.OCA.Files || !window.OCA.Files.fileActions) return;

        window.OCA.Files.fileActions.registerAction({
            name: 'FilesEnhancerTogglePin',
            displayName: '📌 Przypnij / Odepnij z góry',
            mime: 'dir',
            permissions: OC.PERMISSION_READ,
            iconClass: 'icon-starred',
            actionHandler: (folderName) => {
                const currentDir = (window.OCA && window.OCA.Files && window.OCA.Files.App && window.OCA.Files.App.fileList)
                    ? window.OCA.Files.App.fileList.getCurrentDirectory()
                    : '/';
                const path = (currentDir === '/' ? '' : currentDir) + '/' + folderName;
                this.togglePin(path);
            }
        });
    }

    applyPins() {
        const pinned = this.getPinned();
        if (pinned.length === 0) return;

        const currentDir = (window.OCA && window.OCA.Files && window.OCA.Files.App && window.OCA.Files.App.fileList)
            ? window.OCA.Files.App.fileList.getCurrentDirectory()
            : '/';

        const tbody = document.querySelector('#fileList, .files-list tbody');
        if (!tbody) return;

        const rows = Array.from(tbody.querySelectorAll('tr[data-file], [data-entry-id]'));
        
        // Find pinned rows
        rows.forEach(row => {
            const fileName = row.getAttribute('data-file') || row.querySelector('.innernametext, .file-name')?.textContent?.trim();
            const fullPath = (currentDir === '/' ? '' : currentDir) + '/' + fileName;
            const isPinned = pinned.includes(fullPath);

            let pinBadge = row.querySelector('.fe-pin-badge');
            if (isPinned) {
                row.classList.add('fe-pinned-row');
                if (!pinBadge) {
                    pinBadge = document.createElement('span');
                    pinBadge.className = 'fe-pin-badge';
                    pinBadge.title = 'Folder przypięty na samej górze';
                    pinBadge.textContent = '📌';
                    const nameContainer = row.querySelector('.nametext, .innernametext, .file-name');
                    if (nameContainer) nameContainer.prepend(pinBadge);
                }
                // Move pinned row to top of tbody
                tbody.prepend(row);
            } else if (pinBadge) {
                row.classList.remove('fe-pinned-row');
                pinBadge.remove();
            }
        });
    }

    observeDOM() {
        const observer = new MutationObserver(() => {
            this.applyPins();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
}
