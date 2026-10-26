/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Implements Nextcloud PR #65811 & Issue #65281:
 * Allow deleting files directly from Recent, Favorites, and Search views with base path resolution.
 */

export class DirectDeleteRecent {
    constructor() {
        this.init();
    }

    init() {
        this.attachDeleteHandler();
    }

    attachDeleteHandler() {
        document.addEventListener('click', (e) => {
            const deleteTrigger = e.target.closest('[data-action="Delete"], [data-action="delete"], .action-delete, .fe-quick-delete');
            if (!deleteTrigger) return;

            const currentView = window.location.hash || window.location.pathname;
            const isAggregatedView = currentView.includes('recent') || currentView.includes('search') || currentView.includes('favorites');
            if (!isAggregatedView) return;

            const row = deleteTrigger.closest('tr[data-file], [data-entry-id]');
            if (!row) return;

            const fileName = row.getAttribute('data-file') || row.querySelector('.innernametext, .file-name')?.textContent?.trim();
            const fullPath = row.getAttribute('data-path') || row.querySelector('a[href*="dir="]')?.getAttribute('href') || fileName;

            if (!fileName) return;

            e.preventDefault();
            e.stopPropagation();

            if (!confirm(`Czy na pewno chcesz przenieść plik „${fileName}” do kosza?`)) {
                return;
            }

            this.performDelete(row, fileName, fullPath);
        }, true);
    }

    performDelete(row, fileName, fullPath) {
        let davPath = fullPath;
        if (!davPath.startsWith('/')) {
            davPath = '/' + davPath;
        }

        const notifyId = OC.Notification.show(`Usuwanie pliku ${fileName}...`);

        fetch(OC.generateUrl('/remote.php/webdav' + encodeURI(davPath)), {
            method: 'DELETE',
            headers: {
                'requesttoken': OC.requestToken
            }
        })
        .then(res => {
            OC.Notification.hide(notifyId);
            if (res.ok || res.status === 204) {
                OC.Notification.showTemporary(`✓ Plik ${fileName} przeniesiono do kosza.`);
                row.style.transition = 'opacity 0.3s, transform 0.3s';
                row.style.opacity = '0';
                row.style.transform = 'translateX(-20px)';
                setTimeout(() => row.remove(), 300);
            } else {
                // Try fallback to standard fileList delete
                if (window.OCA?.Files?.App?.fileList) {
                    window.OCA.Files.App.fileList.delete(fileName);
                }
            }
        })
        .catch(() => {
            OC.Notification.hide(notifyId);
            OC.Notification.showTemporary('❌ Błąd podczas usuwania pliku.');
        });
    }
}
