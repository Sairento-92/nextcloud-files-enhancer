/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export class BatchRenamer {
    constructor() {
        this.init();
    }

    init() {
        this.observeSelectionMenu();
    }

    observeSelectionMenu() {
        const observer = new MutationObserver(() => {
            const actionsContainer = document.querySelector('.selection-actions, #filestable thead .selectedActions, .files-selection-summary');
            if (actionsContainer && !actionsContainer.querySelector('.fe-batch-rename-btn')) {
                const btn = document.createElement('a');
                btn.className = 'button btn fe-batch-rename-btn';
                btn.href = '#';
                btn.innerHTML = '<span class="icon-rename"></span> Zmień nazwy zbiorczo';
                btn.style.marginLeft = '8px';
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const selected = this.getSelectedFileNames();
                    if (selected.length > 0) {
                        this.openDialog(selected);
                    }
                });
                actionsContainer.appendChild(btn);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    getSelectedFileNames() {
        const selected = [];
        const checked = document.querySelectorAll('tr.selected, [data-entry-id].selected, input.selectCheckBox:checked');
        checked.forEach(el => {
            const row = el.closest('tr, [data-entry-id]');
            const name = row?.getAttribute('data-file') || row?.querySelector('.innernametext, .file-name')?.textContent?.trim();
            if (name && !selected.includes(name)) {
                selected.push(name);
            }
        });
        return selected;
    }

    openDialog(fileNames) {
        document.querySelectorAll('.fe-batch-rename-modal').forEach(m => m.remove());

        const modal = document.createElement('div');
        modal.className = 'fe-batch-rename-modal';
        modal.innerHTML = `
            <div class="fe-batch-rename-box">
                <div class="fe-modal-header">
                    <h3>🔤 Hurtowa zmiana nazw (${fileNames.length} elementów)</h3>
                    <button class="fe-modal-close">✕</button>
                </div>
                <div class="fe-modal-body">
                    <div class="fe-form-row">
                        <label>Prefiks (dodaj na początku):</label>
                        <input type="text" id="fe-ren-prefix" placeholder="np. Zdjecia_" />
                    </div>
                    <div class="fe-form-row">
                        <label>Sufiks (dodaj przed rozszerzeniem):</label>
                        <input type="text" id="fe-ren-suffix" placeholder="np. _kopia" />
                    </div>
                    <div class="fe-form-row" style="display: flex; gap: 10px;">
                        <div style="flex: 1;">
                            <label>Znajdź tekst:</label>
                            <input type="text" id="fe-ren-find" placeholder="Tekst do zamiany" />
                        </div>
                        <div style="flex: 1;">
                            <label>Zastąp przez:</label>
                            <input type="text" id="fe-ren-replace" placeholder="Nowy tekst" />
                        </div>
                    </div>
                    <div class="fe-form-row">
                        <label>Numeracja sekwencyjna:</label>
                        <select id="fe-ren-num">
                            <option value="none">Brak numeracji</option>
                            <option value="1">1, 2, 3...</option>
                            <option value="01">01, 02, 03...</option>
                            <option value="001">001, 002, 003...</option>
                        </select>
                    </div>

                    <div class="fe-preview-header">Podgląd zmian (pierwsze 5 plików):</div>
                    <div class="fe-preview-list" id="fe-preview-container"></div>
                </div>
                <div class="fe-modal-footer">
                    <button class="button cancel fe-modal-close">Anuluj</button>
                    <button class="button primary" id="fe-ren-apply-btn">Zastosuj zmiany</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const updatePreview = () => {
            const prefix = modal.querySelector('#fe-ren-prefix').value;
            const suffix = modal.querySelector('#fe-ren-suffix').value;
            const find = modal.querySelector('#fe-ren-find').value;
            const replace = modal.querySelector('#fe-ren-replace').value;
            const numFormat = modal.querySelector('#fe-ren-num').value;

            const container = modal.querySelector('#fe-preview-container');
            container.innerHTML = '';

            const samples = fileNames.slice(0, 5);
            samples.forEach((orig, idx) => {
                const newName = this.calculateNewName(orig, idx + 1, prefix, suffix, find, replace, numFormat);
                const row = document.createElement('div');
                row.className = 'fe-preview-row';
                row.innerHTML = `<span class="fe-prev-orig">${this.escapeHtml(orig)}</span> ➔ <span class="fe-prev-new">${this.escapeHtml(newName)}</span>`;
                container.appendChild(row);
            });
        };

        modal.querySelectorAll('input, select').forEach(el => el.addEventListener('input', updatePreview));
        updatePreview();

        modal.querySelectorAll('.fe-modal-close').forEach(b => b.addEventListener('click', () => modal.remove()));

        modal.querySelector('#fe-ren-apply-btn').addEventListener('click', () => {
            this.executeRename(modal, fileNames);
        });
    }

    calculateNewName(fileName, index, prefix, suffix, find, replace, numFormat) {
        const lastDot = fileName.lastIndexOf('.');
        let base = lastDot !== -1 ? fileName.substring(0, lastDot) : fileName;
        const ext = lastDot !== -1 ? fileName.substring(lastDot) : '';

        if (find) {
            base = base.replaceAll(find, replace || '');
        }

        let numStr = '';
        if (numFormat === '1') numStr = `_${index}`;
        else if (numFormat === '01') numStr = `_${String(index).padStart(2, '0')}`;
        else if (numFormat === '001') numStr = `_${String(index).padStart(3, '0')}`;

        return `${prefix || ''}${base}${numStr}${suffix || ''}${ext}`;
    }

    async executeRename(modal, fileNames) {
        const prefix = modal.querySelector('#fe-ren-prefix').value;
        const suffix = modal.querySelector('#fe-ren-suffix').value;
        const find = modal.querySelector('#fe-ren-find').value;
        const replace = modal.querySelector('#fe-ren-replace').value;
        const numFormat = modal.querySelector('#fe-ren-num').value;

        const currentDir = this.getCurrentDir();
        modal.querySelector('.fe-modal-body').innerHTML = '<div class="fe-loading">Trwa zmienianie nazw plików...</div>';

        let successCount = 0;
        for (let i = 0; i < fileNames.length; i++) {
            const oldName = fileNames[i];
            const newName = this.calculateNewName(oldName, i + 1, prefix, suffix, find, replace, numFormat);
            if (oldName === newName) continue;

            const oldPath = (currentDir === '/' ? '' : currentDir) + '/' + oldName;
            const newPath = (currentDir === '/' ? '' : currentDir) + '/' + newName;

            try {
                const res = await fetch(OC.generateUrl('/remote.php/webdav' + encodeURI(oldPath)), {
                    method: 'MOVE',
                    headers: {
                        'Destination': OC.generateUrl('/remote.php/webdav' + encodeURI(newPath)),
                        'requesttoken': OC.requestToken
                    }
                });
                if (res.ok || res.status === 201 || res.status === 204) {
                    successCount++;
                }
            } catch (e) {
                console.error('Rename failed for', oldName, e);
            }
        }

        modal.remove();
        OC.Notification.showTemporary(`✓ Pomyślnie zmieniono nazwy ${successCount} plików.`);
        if (window.OCA && window.OCA.Files && window.OCA.Files.App && window.OCA.Files.App.fileList) {
            window.OCA.Files.App.fileList.reload();
        }
    }

    getCurrentDir() {
        if (window.OCA && window.OCA.Files && window.OCA.Files.App && window.OCA.Files.App.fileList) {
            return window.OCA.Files.App.fileList.getCurrentDirectory() || '/';
        }
        return '/';
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }
}
