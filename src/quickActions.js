/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Implements Nextcloud Issue #59665:
 * Move "delete" and "download" buttons from submenu to main file actions bar.
 */

export class QuickActions {
    constructor() {
        this.init();
    }

    init() {
        this.observeRows();
    }

    observeRows() {
        const observer = new MutationObserver(() => {
            this.injectHoverButtons();
        });

        observer.observe(document.body, { childList: true, subtree: true });
        this.injectHoverButtons();
    }

    injectHoverButtons() {
        const rows = document.querySelectorAll('tr[data-file], [data-entry-id]');
        rows.forEach(row => {
            if (row.querySelector('.fe-quick-actions-bar')) {
                return;
            }

            const fileName = row.getAttribute('data-file') || row.querySelector('.innernametext, .file-name')?.textContent?.trim();
            const isDir = row.getAttribute('data-type') === 'dir';
            if (!fileName) return;

            const actionsCell = row.querySelector('.fileactions, td:last-child, .actions, .action-menu');
            if (!actionsCell) return;

            const bar = document.createElement('div');
            bar.className = 'fe-quick-actions-bar';

            // 1. Direct Download Button
            const dlBtn = document.createElement('a');
            dlBtn.className = 'fe-row-btn fe-row-btn-download';
            dlBtn.title = 'Pobierz plik bezpośrednio';
            dlBtn.href = this.getDownloadUrl(fileName, isDir);
            dlBtn.innerHTML = '⬇️';
            dlBtn.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            // 2. Direct Delete Button
            const delBtn = document.createElement('button');
            delBtn.className = 'fe-row-btn fe-row-btn-delete';
            delBtn.title = 'Przenieś do kosza';
            delBtn.innerHTML = '🗑️';
            delBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.deleteFile(fileName, row);
            });

            bar.appendChild(dlBtn);
            bar.appendChild(delBtn);

            actionsCell.prepend(bar);
        });
    }

    getDownloadUrl(fileName, isDir) {
        if (window.OCA && window.OCA.Files && window.OCA.Files.App && window.OCA.Files.App.fileList) {
            return window.OCA.Files.App.fileList.getDownloadUrl(fileName);
        }
        const currentDir = (window.OCA && window.OCA.Files && window.OCA.Files.App && window.OCA.Files.App.fileList)
            ? window.OCA.Files.App.fileList.getCurrentDirectory()
            : '/';
        const path = (currentDir === '/' ? '' : currentDir) + '/' + fileName;
        return OC.generateUrl('/remote.php/webdav' + encodeURI(path));
    }

    deleteFile(fileName, row) {
        if (!confirm(`Czy na pewno chcesz przenieść „${fileName}” do kosza?`)) {
            return;
        }

        const currentDir = (window.OCA && window.OCA.Files && window.OCA.Files.App && window.OCA.Files.App.fileList)
            ? window.OCA.Files.App.fileList.getCurrentDirectory()
            : '/';
        const path = (currentDir === '/' ? '' : currentDir) + '/' + fileName;

        fetch(OC.generateUrl('/remote.php/webdav' + encodeURI(path)), {
            method: 'DELETE',
            headers: {
                'requesttoken': OC.requestToken
            }
        })
        .then(res => {
            if (res.ok || res.status === 204) {
                row.style.opacity = '0.3';
                setTimeout(() => {
                    row.remove();
                    if (window.OCA && window.OCA.Files && window.OCA.Files.App && window.OCA.Files.App.fileList) {
                        window.OCA.Files.App.fileList.reload();
                    }
                }, 300);
                if (window.OC && window.OC.Notification) {
                    window.OC.Notification.showTemporary('✓ Przeniesiono do kosza: ' + fileName);
                }
            } else {
                alert('Błąd podczas usuwania: ' + res.statusText);
            }
        })
        .catch(err => {
            alert('Błąd połączenia: ' + err.message);
        });
    }
}
