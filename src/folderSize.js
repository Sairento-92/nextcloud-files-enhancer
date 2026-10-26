/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export class FolderSizeCalculator {
    constructor() {
        this.init();
    }

    init() {
        if (!window.OCA || !window.OCA.Files || !window.OCA.Files.fileActions) return;

        window.OCA.Files.fileActions.registerAction({
            name: 'FilesEnhancerFolderSize',
            displayName: '📐 Oblicz rozmiar folderu',
            mime: 'dir',
            permissions: OC.PERMISSION_READ,
            iconClass: 'icon-info',
            actionHandler: (folderName, context) => {
                this.calculateSize(folderName, context);
            }
        });
    }

    calculateSize(folderName, context) {
        const currentDir = this.getCurrentDir();
        const fullPath = (currentDir === '/' ? '' : currentDir) + '/' + folderName;

        const notifyId = OC.Notification.show('Obliczanie rozmiaru folderu ' + folderName + '...');

        fetch(OC.generateUrl('/apps/files_enhancer/api/v1/folder/size'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'requesttoken': OC.requestToken
            },
            body: JSON.stringify({ path: fullPath })
        })
        .then(res => res.json())
        .then(data => {
            OC.Notification.hide(notifyId);
            if (data.error) {
                OC.Notification.showTemporary('Błąd: ' + data.error);
            } else {
                const formatted = this.formatBytes(data.size);
                OC.dialogs.info(
                    `Folder: <b>${this.escapeHtml(data.name)}</b><br><br>` +
                    `Rozmiar: <b>${formatted}</b> (${data.size.toLocaleString()} bajtów)<br>` +
                    `Liczba plików: <b>${data.files.toLocaleString()}</b><br>` +
                    `Podfolderów: <b>${data.folders.toLocaleString()}</b>`,
                    'Rozmiar folderu',
                    null,
                    true
                );
            }
        })
        .catch(err => {
            OC.Notification.hide(notifyId);
            OC.Notification.showTemporary('Błąd połączenia: ' + err.message);
        });
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
