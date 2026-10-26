/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export class ArchiveManager {
    constructor() {
        this.init();
    }

    init() {
        this.registerFileActions();
        this.registerBatchActions();
    }

    registerFileActions() {
        if (!window.OCA || !window.OCA.Files || !window.OCA.Files.fileActions) {
            return;
        }

        const archiveMimes = [
            'application/zip',
            'application/x-zip-compressed',
            'application/x-tar',
            'application/gzip',
            'application/x-gzip'
        ];

        // Action: Rozpakuj na serwerze
        archiveMimes.forEach(mime => {
            window.OCA.Files.fileActions.registerAction({
                name: 'FilesEnhancerExtract',
                displayName: '📦 Rozpakuj na serwerze',
                mime: mime,
                permissions: OC.PERMISSION_READ | OC.PERMISSION_CREATE,
                iconClass: 'icon-folder',
                actionHandler: (fileName, context) => {
                    this.extractArchive(fileName, context);
                }
            });
        });

        // Action: Spakuj do ZIP dla pojedynczego folderu lub pliku
        window.OCA.Files.fileActions.registerAction({
            name: 'FilesEnhancerCompressSingle',
            displayName: '🗜️ Spakuj do ZIP',
            mime: 'all',
            permissions: OC.PERMISSION_READ | OC.PERMISSION_CREATE,
            iconClass: 'icon-shared',
            actionHandler: (fileName, context) => {
                this.compressItems([fileName], context);
            }
        });
    }

    registerBatchActions() {
        // Multi-select batch action: Spakuj zaznaczone do ZIP
        document.addEventListener('DOMContentLoaded', () => {
            this.observeSelectionMenu();
        });
    }

    observeSelectionMenu() {
        const observer = new MutationObserver(() => {
            const actionsContainer = document.querySelector('.selection-actions, #filestable thead .selectedActions, .files-selection-summary');
            if (actionsContainer && !actionsContainer.querySelector('.fe-batch-zip-btn')) {
                const btn = document.createElement('a');
                btn.className = 'button btn fe-batch-zip-btn';
                btn.href = '#';
                btn.innerHTML = '<span class="icon-shared"></span> Spakuj do ZIP';
                btn.style.marginLeft = '8px';
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const selected = this.getSelectedFileNames();
                    if (selected.length > 0) {
                        this.compressItems(selected);
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

    extractArchive(fileName, context) {
        const currentDir = this.getCurrentDir();
        const filePath = (currentDir === '/' ? '' : currentDir) + '/' + fileName;

        const notifyId = OC.Notification.show('Rozpakowywanie archiwum na serwerze...');

        fetch(OC.generateUrl('/apps/files_enhancer/api/v1/archive/extract'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'requesttoken': OC.requestToken
            },
            body: JSON.stringify({
                path: filePath,
                destination: currentDir
            })
        })
        .then(res => res.json())
        .then(data => {
            OC.Notification.hide(notifyId);
            if (data.error) {
                OC.Notification.showTemporary('Błąd rozpakowywania: ' + data.error);
            } else {
                OC.Notification.showTemporary('✓ Pomyślnie rozpakowano ' + data.extractedCount + ' elementów.');
                this.reloadFileList();
            }
        })
        .catch(err => {
            OC.Notification.hide(notifyId);
            OC.Notification.showTemporary('Błąd połączenia: ' + err.message);
        });
    }

    compressItems(fileNames, context) {
        const defaultZipName = (fileNames.length === 1 ? fileNames[0].replace(/\.[^/.]+$/, '') : 'Archiwum') + '.zip';
        const zipName = prompt('Podaj nazwę tworzonego archiwum ZIP:', defaultZipName);
        if (!zipName) return;

        const currentDir = this.getCurrentDir();
        const fullPaths = fileNames.map(name => (currentDir === '/' ? '' : currentDir) + '/' + name);

        const notifyId = OC.Notification.show('Tworzenie archiwum ZIP na serwerze...');

        fetch(OC.generateUrl('/apps/files_enhancer/api/v1/archive/compress'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'requesttoken': OC.requestToken
            },
            body: JSON.stringify({
                paths: fullPaths,
                zipName: zipName,
                targetFolder: currentDir
            })
        })
        .then(res => res.json())
        .then(data => {
            OC.Notification.hide(notifyId);
            if (data.error) {
                OC.Notification.showTemporary('Błąd kompresji: ' + data.error);
            } else {
                OC.Notification.showTemporary('✓ Pomyślnie utworzono archiwum ' + data.zipName);
                this.reloadFileList();
            }
        })
        .catch(err => {
            OC.Notification.hide(notifyId);
            OC.Notification.showTemporary('Błąd połączenia: ' + err.message);
        });
    }

    getCurrentDir() {
        if (window.OCA && window.OCA.Files && window.OCA.Files.App && window.OCA.Files.App.fileList) {
            return window.OCA.Files.App.fileList.getCurrentDirectory() || '/';
        }
        return '/';
    }

    reloadFileList() {
        if (window.OCA && window.OCA.Files && window.OCA.Files.App && window.OCA.Files.App.fileList) {
            window.OCA.Files.App.fileList.reload();
        }
    }
}
