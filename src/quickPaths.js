/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export class QuickPaths {
    constructor() {
        this.init();
    }

    init() {
        if (!window.OCA || !window.OCA.Files || !window.OCA.Files.fileActions) return;

        // Copy internal path
        window.OCA.Files.fileActions.registerAction({
            name: 'FilesEnhancerCopyPath',
            displayName: '📋 Kopiuj ścieżkę wewnętrzną',
            mime: 'all',
            permissions: OC.PERMISSION_READ,
            iconClass: 'icon-clippy',
            actionHandler: (fileName) => {
                const currentDir = this.getCurrentDir();
                const path = (currentDir === '/' ? '' : currentDir) + '/' + fileName;
                navigator.clipboard.writeText(path);
                OC.Notification.showTemporary('✓ Skopiowano ścieżkę: ' + path);
            }
        });

        // Copy WebDAV URL
        window.OCA.Files.fileActions.registerAction({
            name: 'FilesEnhancerCopyWebDav',
            displayName: '🌐 Kopiuj link WebDAV',
            mime: 'all',
            permissions: OC.PERMISSION_READ,
            iconClass: 'icon-public',
            actionHandler: (fileName) => {
                const currentDir = this.getCurrentDir();
                const path = (currentDir === '/' ? '' : currentDir) + '/' + fileName;
                const webdavUrl = window.location.origin + OC.generateUrl('/remote.php/webdav' + encodeURI(path));
                navigator.clipboard.writeText(webdavUrl);
                OC.Notification.showTemporary('✓ Skopiowano bezpośredni link WebDAV');
            }
        });
    }

    getCurrentDir() {
        if (window.OCA && window.OCA.Files && window.OCA.Files.App && window.OCA.Files.App.fileList) {
            return window.OCA.Files.App.fileList.getCurrentDirectory() || '/';
        }
        return '/';
    }
}
