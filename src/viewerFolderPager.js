/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Implements Nextcloud PR #65058:
 * Page through the folder of a file opened alone or directly from share links.
 */

export class ViewerFolderPager {
    constructor() {
        this.siblingFiles = [];
        this.currentIndex = -1;
        this.init();
    }

    init() {
        this.observeViewer();
    }

    observeViewer() {
        const observer = new MutationObserver(() => {
            const viewer = document.querySelector('#viewer, .viewer, .modal-container');
            if (viewer && !viewer.classList.contains('fe-pager-attached')) {
                viewer.classList.add('fe-pager-attached');
                this.attachNavigation(viewer);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    attachNavigation(viewer) {
        // Collect files from current fileList if available
        const fileList = window.OCA?.Files?.App?.fileList;
        if (fileList && typeof fileList.getModelList === 'function') {
            const models = fileList.getModelList();
            this.siblingFiles = models.filter(m => m.type !== 'dir').map(m => m.name);
        }

        if (this.siblingFiles.length <= 1) return;

        // Inject navigation arrows if not present
        if (!viewer.querySelector('.fe-viewer-nav-btn')) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'fe-viewer-nav-btn fe-viewer-prev';
            prevBtn.innerHTML = '‹';
            prevBtn.title = 'Poprzedni plik w folderze (←)';

            const nextBtn = document.createElement('button');
            nextBtn.className = 'fe-viewer-nav-btn fe-viewer-next';
            nextBtn.innerHTML = '›';
            nextBtn.title = 'Następny plik w folderze (→)';

            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.navigateSibling(-1);
            });

            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.navigateSibling(1);
            });

            viewer.appendChild(prevBtn);
            viewer.appendChild(nextBtn);
        }
    }

    navigateSibling(direction) {
        if (!this.siblingFiles || this.siblingFiles.length === 0) return;

        const currentActive = document.querySelector('tr.selected, [data-entry-id].selected');
        const activeName = currentActive?.getAttribute('data-file');
        let idx = this.siblingFiles.indexOf(activeName);

        if (idx === -1) idx = 0;
        let newIdx = idx + direction;

        if (newIdx < 0) newIdx = this.siblingFiles.length - 1;
        if (newIdx >= this.siblingFiles.length) newIdx = 0;

        const targetFileName = this.siblingFiles[newIdx];
        const targetRow = document.querySelector(`tr[data-file="${CSS.escape(targetFileName)}"], [data-entry-id="${CSS.escape(targetFileName)}"]`);

        if (targetRow) {
            document.querySelectorAll('tr.selected').forEach(r => r.classList.remove('selected'));
            targetRow.classList.add('selected');
            targetRow.scrollIntoView({ block: 'nearest' });
            
            // Trigger spacebar to refresh viewer with new file
            const spaceEvent = new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true });
            document.dispatchEvent(spaceEvent);
        }
    }
}
