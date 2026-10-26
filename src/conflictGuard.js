/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Implements Nextcloud Issue #33719:
 * File conflict guard & duplicate name warning on upload / move.
 */

export class ConflictGuard {
    constructor() {
        this.init();
    }

    init() {
        this.interceptUploadInputs();
    }

    interceptUploadInputs() {
        document.addEventListener('change', (e) => {
            const input = e.target;
            if (input && input.type === 'file' && input.files && input.files.length > 0) {
                this.checkCollisions(input.files);
            }
        }, true);
    }

    checkCollisions(files) {
        const existingNames = [];
        document.querySelectorAll('tr[data-file], [data-entry-id]').forEach(row => {
            const name = row.getAttribute('data-file') || row.querySelector('.innernametext, .file-name')?.textContent?.trim();
            if (name) existingNames.push(name.toLowerCase());
        });

        const conflicting = [];
        for (let i = 0; i < files.length; i++) {
            if (existingNames.includes(files[i].name.toLowerCase())) {
                conflicting.push(files[i].name);
            }
        }

        if (conflicting.length > 0) {
            console.warn('[ConflictGuard] Wykryto pliki o takich samych nazwach:', conflicting);
            if (window.OC && window.OC.Notification) {
                window.OC.Notification.showTemporary(`⚠️ Uwaga: ${conflicting.length} przesyłanych plików już istnieje w tym folderze.`);
            }
        }
    }
}
