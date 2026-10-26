/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export class QuickLook {
    constructor() {
        this.activeModal = null;
        this.currentFileIndex = -1;
        this.fileListItems = [];
        this.initKeybindings();
    }

    initKeybindings() {
        document.addEventListener('keydown', (e) => {
            // Spacebar pressed
            if (e.code === 'Space' || e.key === ' ') {
                const target = e.target;
                if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
                    return;
                }

                // If QuickLook is already open, Spacebar closes it (like in macOS)
                if (this.activeModal) {
                    e.preventDefault();
                    this.close();
                    return;
                }

                const selected = this.getSelectedFile();
                if (selected) {
                    e.preventDefault();
                    this.open(selected);
                }
            } else if (e.key === 'Escape' && this.activeModal) {
                e.preventDefault();
                this.close();
            } else if ((e.key === 'ArrowRight' || e.key === 'ArrowDown') && this.activeModal) {
                e.preventDefault();
                this.navigate(1);
            } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowUp') && this.activeModal) {
                e.preventDefault();
                this.navigate(-1);
            }
        });
    }

    getSelectedFile() {
        // Collect current directory files
        this.fileListItems = this.getAllVisibleFiles();
        if (this.fileListItems.length === 0) return null;

        // Check if any row has selected/checked state
        const selectedRow = document.querySelector('tr.selected, [data-entry-id].selected, tr[data-file]:focus-within');
        if (selectedRow) {
            const fileName = selectedRow.getAttribute('data-file') || selectedRow.querySelector('.innernametext, .file-name')?.textContent?.trim();
            const idx = this.fileListItems.findIndex(f => f.name === fileName);
            if (idx !== -1) {
                this.currentFileIndex = idx;
                return this.fileListItems[idx];
            }
        }

        // Fallback to first selected checkbox
        const checkedBox = document.querySelector('input.selectCheckBox:checked, [data-entry-id] input[type="checkbox"]:checked');
        if (checkedBox) {
            const row = checkedBox.closest('tr, [data-entry-id]');
            const fileName = row?.getAttribute('data-file') || row?.querySelector('.innernametext, .file-name')?.textContent?.trim();
            const idx = this.fileListItems.findIndex(f => f.name === fileName);
            if (idx !== -1) {
                this.currentFileIndex = idx;
                return this.fileListItems[idx];
            }
        }

        // If nothing explicitly selected, use hovered or first visible
        return null;
    }

    getAllVisibleFiles() {
        const items = [];
        const rows = document.querySelectorAll('tr[data-file], [data-entry-id]');
        rows.forEach(row => {
            const name = row.getAttribute('data-file') || row.querySelector('.innernametext, .file-name')?.textContent?.trim();
            const mime = row.getAttribute('data-mime') || '';
            const type = row.getAttribute('data-type') || '';
            const size = row.getAttribute('data-size') || '';
            const id = row.getAttribute('data-id') || row.getAttribute('data-entry-id') || '';

            if (name && type !== 'dir') {
                items.push({
                    id,
                    name,
                    mime,
                    size,
                    row
                });
            }
        });
        return items;
    }

    navigate(direction) {
        if (this.fileListItems.length <= 1) return;
        this.currentFileIndex = (this.currentFileIndex + direction + this.fileListItems.length) % this.fileListItems.length;
        const targetFile = this.fileListItems[this.currentFileIndex];
        if (targetFile) {
            this.renderContent(targetFile);
        }
    }

    open(file) {
        if (this.activeModal) {
            this.close();
        }

        const modal = document.createElement('div');
        modal.id = 'files-enhancer-quicklook';
        modal.className = 'fe-quicklook-overlay';
        modal.innerHTML = `
            <div class="fe-quicklook-container">
                <div class="fe-quicklook-header">
                    <div class="fe-quicklook-title">
                        <span class="fe-quicklook-filename">${this.escapeHtml(file.name)}</span>
                        <span class="fe-quicklook-counter">(${this.currentFileIndex + 1} / ${this.fileListItems.length})</span>
                    </div>
                    <div class="fe-quicklook-actions">
                        <button class="fe-ql-btn fe-ql-prev" title="Poprzedni plik (Strzałka w lewo)">◀</button>
                        <button class="fe-ql-btn fe-ql-next" title="Następny plik (Strzałka w prawo)">▶</button>
                        <button class="fe-ql-btn fe-ql-close" title="Zamknij (Esc)">✕</button>
                    </div>
                </div>
                <div class="fe-quicklook-body">
                    <div class="fe-quicklook-loader">Wczytywanie podglądu...</div>
                </div>
                <div class="fe-quicklook-footer">
                    <span>Nawiguj: <b>← / →</b> | Zamknij: <b>Spacja / Esc</b></span>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.activeModal = modal;

        modal.querySelector('.fe-ql-close').addEventListener('click', () => this.close());
        modal.querySelector('.fe-ql-prev').addEventListener('click', () => this.navigate(-1));
        modal.querySelector('.fe-ql-next').addEventListener('click', () => this.navigate(1));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.close();
        });

        this.renderContent(file);
    }

    renderContent(file) {
        if (!this.activeModal) return;

        const body = this.activeModal.querySelector('.fe-quicklook-body');
        const filename = this.activeModal.querySelector('.fe-quicklook-filename');
        const counter = this.activeModal.querySelector('.fe-quicklook-counter');

        filename.textContent = file.name;
        counter.textContent = `(${this.currentFileIndex + 1} / ${this.fileListItems.length})`;
        body.innerHTML = '<div class="fe-quicklook-loader">Wczytywanie...</div>';

        const downloadUrl = this.getFileDownloadUrl(file);
        const ext = file.name.split('.').pop().toLowerCase();

        // Image Preview
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'avif'].includes(ext)) {
            const img = document.createElement('img');
            img.className = 'fe-ql-img';
            img.src = downloadUrl;
            img.onload = () => {
                body.innerHTML = '';
                body.appendChild(img);
            };
            img.onerror = () => {
                body.innerHTML = '<div class="fe-ql-error">Nie udało się załadować obrazu.</div>';
            };
        }
        // Video Preview
        else if (['mp4', 'webm', 'ogg', 'mov', 'mkv'].includes(ext)) {
            body.innerHTML = `
                <video class="fe-ql-video" controls autoplay>
                    <source src="${downloadUrl}">
                    Twoja przeglądarka nie obsługuje odtwarzania tego formatu wideo.
                </video>
            `;
        }
        // Audio Preview
        else if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(ext)) {
            body.innerHTML = `
                <div class="fe-ql-audio-container">
                    <div class="fe-ql-audio-icon">🎵</div>
                    <div style="font-weight: 600; margin-bottom: 12px;">${this.escapeHtml(file.name)}</div>
                    <audio class="fe-ql-audio" controls autoplay>
                        <source src="${downloadUrl}">
                    </audio>
                </div>
            `;
        }
        // PDF Preview
        else if (ext === 'pdf') {
            body.innerHTML = `
                <iframe class="fe-ql-iframe" src="${downloadUrl}"></iframe>
            `;
        }
        // Text & Code Preview
        else if (['txt', 'md', 'json', 'yaml', 'yml', 'xml', 'csv', 'sql', 'py', 'js', 'ts', 'php', 'html', 'css', 'sh', 'log', 'env', 'conf', 'ini'].includes(ext)) {
            fetch(downloadUrl)
                .then(res => res.text())
                .then(text => {
                    const truncated = text.length > 50000 ? text.substring(0, 50000) + '\n\n... [Podgląd przycięty do pierwszych 50 KB]' : text;
                    body.innerHTML = `
                        <pre class="fe-ql-code"><code>${this.escapeHtml(truncated)}</code></pre>
                    `;
                })
                .catch(err => {
                    body.innerHTML = '<div class="fe-ql-error">Błąd pobierania zawartości pliku: ' + err.message + '</div>';
                });
        }
        // Generic File Card
        else {
            body.innerHTML = `
                <div class="fe-ql-generic">
                    <div class="fe-ql-generic-icon">📄</div>
                    <div class="fe-ql-generic-title">${this.escapeHtml(file.name)}</div>
                    <div class="fe-ql-generic-meta">Rozszerzenie: .${ext.toUpperCase()}</div>
                    <a href="${downloadUrl}" download="${this.escapeHtml(file.name)}" class="button primary fe-ql-download-btn">Pobierz plik</a>
                </div>
            `;
        }
    }

    getFileDownloadUrl(file) {
        if (window.OCA && window.OCA.Files && window.OCA.Files.App && window.OCA.Files.App.fileList) {
            return window.OCA.Files.App.fileList.getDownloadUrl(file.name);
        }
        const currentDir = (window.OCA && window.OCA.Files && window.OCA.Files.App && window.OCA.Files.App.fileList) 
            ? window.OCA.Files.App.fileList.getCurrentDirectory() 
            : '/';
        const path = (currentDir === '/' ? '' : currentDir) + '/' + file.name;
        return OC.generateUrl('/remote.php/webdav' + encodeURI(path));
    }

    close() {
        if (this.activeModal) {
            this.activeModal.remove();
            this.activeModal = null;
        }
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }
}
