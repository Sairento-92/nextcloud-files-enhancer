/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Implements Nextcloud Issue #65101:
 * Allow different persistent sorting settings for each folder.
 */

export class FolderSorting {
    constructor() {
        this.currentDir = '/';
        this.sortStorageKey = 'fe_folder_sorts';
        this.init();
    }

    init() {
        this.observeNavigation();
        this.attachHeaderListeners();
    }

    getSavedSorts() {
        try {
            return JSON.parse(localStorage.getItem(this.sortStorageKey) || '{}');
        } catch {
            return {};
        }
    }

    saveSortForDir(dir, sortField, sortDirection) {
        const sorts = this.getSavedSorts();
        sorts[dir] = { field: sortField, dir: sortDirection };
        localStorage.setItem(this.sortStorageKey, JSON.stringify(sorts));
    }

    attachHeaderListeners() {
        document.addEventListener('click', (e) => {
            const th = e.target.closest('#filestable thead th[data-sort], .files-list-header [data-sort]');
            if (!th) return;

            const sortField = th.getAttribute('data-sort');
            const currentDir = this.getCurrentDir();
            setTimeout(() => {
                const isDesc = th.classList.contains('desc') || th.getAttribute('aria-sort') === 'descending';
                this.saveSortForDir(currentDir, sortField, isDesc ? 'desc' : 'asc');
            }, 100);
        });
    }

    observeNavigation() {
        setInterval(() => {
            const dir = this.getCurrentDir();
            if (dir !== this.currentDir) {
                this.currentDir = dir;
                this.applySavedSort(dir);
            }
        }, 500);
    }

    applySavedSort(dir) {
        const sorts = this.getSavedSorts();
        const saved = sorts[dir];
        if (!saved) return;

        if (window.OCA && window.OCA.Files && window.OCA.Files.App && window.OCA.Files.App.fileList) {
            const fileList = window.OCA.Files.App.fileList;
            if (typeof fileList.sort === 'function') {
                fileList.sort(saved.field, saved.dir === 'desc');
            }
        }
    }

    getCurrentDir() {
        if (window.OCA && window.OCA.Files && window.OCA.Files.App && window.OCA.Files.App.fileList) {
            return window.OCA.Files.App.fileList.getCurrentDirectory() || '/';
        }
        return '/';
    }
}
