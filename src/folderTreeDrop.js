/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Implements Nextcloud Issue #65764:
 * Drag and drop files directly onto left folder-tree navigation items.
 */

export class FolderTreeDrop {
    constructor() {
        this.init();
    }

    init() {
        this.observeTree();
    }

    observeTree() {
        const observer = new MutationObserver(() => {
            this.attachDropHandlers();
        });

        observer.observe(document.body, { childList: true, subtree: true });
        this.attachDropHandlers();
    }

    attachDropHandlers() {
        const treeItems = document.querySelectorAll('#app-navigation a[href*="dir="], .nav-icon, .tree-item, [data-folder-path]');
        treeItems.forEach(item => {
            if (item.getAttribute('data-fe-drop-attached') === '1') return;
            item.setAttribute('data-fe-drop-attached', '1');

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                item.classList.add('fe-tree-dragover');
            });

            item.addEventListener('dragleave', () => {
                item.classList.remove('fe-tree-dragover');
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('fe-tree-dragover');

                const targetDir = this.extractDirFromLink(item);
                if (!targetDir) return;

                // Determine dragged file name
                const draggedRow = document.querySelector('tr.ui-draggable-dragging, tr.selected, [data-entry-id].selected');
                const fileName = draggedRow?.getAttribute('data-file') || draggedRow?.querySelector('.innernametext, .file-name')?.textContent?.trim();

                if (fileName && targetDir) {
                    this.moveFile(fileName, targetDir);
                }
            });
        });
    }

    extractDirFromLink(linkElement) {
        const customPath = linkElement.getAttribute('data-folder-path');
        if (customPath) return customPath;

        const href = linkElement.getAttribute('href') || '';
        const match = href.match(/[?&]dir=([^&]+)/);
        if (match && match[1]) {
            return decodeURIComponent(match[1]);
        }
        return null;
    }

    moveFile(fileName, targetDir) {
        const currentDir = (window.OCA && window.OCA.Files && window.OCA.Files.App && window.OCA.Files.App.fileList)
            ? window.OCA.Files.App.fileList.getCurrentDirectory()
            : '/';

        if (currentDir === targetDir) {
            return;
        }

        const sourcePath = (currentDir === '/' ? '' : currentDir) + '/' + fileName;
        const destPath = (targetDir === '/' ? '' : targetDir) + '/' + fileName;

        const notifyId = OC.Notification.show(`Przenoszenie ${fileName} do ${targetDir}...`);

        fetch(OC.generateUrl('/remote.php/webdav' + encodeURI(sourcePath)), {
            method: 'MOVE',
            headers: {
                'Destination': OC.generateUrl('/remote.php/webdav' + encodeURI(destPath)),
                'requesttoken': OC.requestToken
            }
        })
        .then(res => {
            OC.Notification.hide(notifyId);
            if (res.ok || res.status === 201 || res.status === 204) {
                OC.Notification.showTemporary(`✓ Przeniesiono ${fileName} do ${targetDir}`);
                if (window.OCA && window.OCA.Files && window.OCA.Files.App && window.OCA.Files.App.fileList) {
                    window.OCA.Files.App.fileList.reload();
                }
            } else {
                OC.Notification.showTemporary('Błąd przenoszenia: ' + res.statusText);
            }
        })
        .catch(err => {
            OC.Notification.hide(notifyId);
            OC.Notification.showTemporary('Błąd połączenia: ' + err.message);
        });
    }
}
