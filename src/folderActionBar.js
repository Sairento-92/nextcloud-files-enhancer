/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Implements Nextcloud Issue #57752:
 * Expose direct folder actions (Share, Download as ZIP, Vault, Rename) when inside the folder.
 */

export class FolderActionBar {
    constructor() {
        this.currentDir = null;
        this.init();
    }

    init() {
        const observer = new MutationObserver(() => this.updateToolbar());
        observer.observe(document.body, { childList: true, subtree: true });
        this.updateToolbar();
    }

    updateToolbar() {
        const fileList = window.OCA?.Files?.App?.fileList;
        if (!fileList || typeof fileList.getCurrentDirectory !== 'function') return;

        const dir = fileList.getCurrentDirectory();
        if (!dir || dir === '/') {
            const existing = document.getElementById('fe-folder-action-bar');
            if (existing) existing.remove();
            this.currentDir = null;
            return;
        }

        if (this.currentDir === dir && document.getElementById('fe-folder-action-bar')) {
            return;
        }

        this.currentDir = dir;
        this.renderBar(dir, fileList);
    }

    renderBar(dirPath, fileList) {
        let bar = document.getElementById('fe-folder-action-bar');
        const controls = document.querySelector('#controls, .controls-vue, .files-controls');
        if (!controls) return;

        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'fe-folder-action-bar';
            bar.className = 'fe-folder-actions-container';
            controls.appendChild(bar);
        }

        const folderName = dirPath.split('/').filter(Boolean).pop() || 'Folder';

        bar.innerHTML = `
            <div class="fe-fab-group">
                <span class="fe-fab-label" title="${dirPath}">📁 <strong>${this.escapeHtml(folderName)}</strong>:</span>
                <button class="fe-fab-btn" id="fe-fab-share" title="Udostępnij bieżący folder">🔗 Udostępnij</button>
                <button class="fe-fab-btn" id="fe-fab-zip" title="Pobierz ten folder jako archiwum ZIP">📦 Pobierz ZIP</button>
                <button class="fe-fab-btn" id="fe-fab-vault" title="Zabezpiecz ten folder hasłem (Sejf)">🔒 Sejf</button>
                <button class="fe-fab-btn" id="fe-fab-path" title="Kopiuj ścieżkę do schowka">📋 Kopiuj ścieżkę</button>
            </div>
        `;

        // Attach event handlers
        bar.querySelector('#fe-fab-share').addEventListener('click', () => {
            if (window.OCA?.Files_Sharing) {
                const sidebar = window.OCA.Files?.Sidebar;
                if (sidebar) sidebar.open(dirPath);
            } else {
                OC.Notification.showTemporary('Otwieranie panelu udostępniania...');
            }
        });

        bar.querySelector('#fe-fab-zip').addEventListener('click', () => {
            const url = OC.generateUrl('/apps/files/ajax/download.php?dir=' + encodeURIComponent(dirPath));
            window.location.href = url;
        });

        bar.querySelector('#fe-fab-vault').addEventListener('click', () => {
            const vaults = JSON.parse(localStorage.getItem('fe_secure_vaults') || '{}');
            if (vaults[dirPath]) {
                const pass = prompt(`Folder jest chroniony sejfem.\nPodaj hasło, aby zdjąć blokadę:`);
                if (pass && btoa(pass) === vaults[dirPath]) {
                    delete vaults[dirPath];
                    localStorage.setItem('fe_secure_vaults', JSON.stringify(vaults));
                    OC.Notification.showTemporary('🔓 Blokada sejfu została zdjęta.');
                }
            } else {
                const pass = prompt(`Ustaw hasło / PIN dostępu do tego folderu:`);
                if (pass && pass.trim()) {
                    vaults[dirPath] = btoa(pass);
                    localStorage.setItem('fe_secure_vaults', JSON.stringify(vaults));
                    OC.Notification.showTemporary('🔒 Folder został zabezpieczony jako sejf.');
                }
            }
        });

        bar.querySelector('#fe-fab-path').addEventListener('click', () => {
            navigator.clipboard.writeText(dirPath).then(() => {
                OC.Notification.showTemporary(`✓ Skopiowano: ${dirPath}`);
            });
        });
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }
}
