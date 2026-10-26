/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Implements Nextcloud Issue #62278:
 * Do not delete current folder when using delete hotkey in files and no files are selected.
 */

export class DeleteGuard {
    constructor() {
        this.init();
    }

    init() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' || e.key === 'Del') {
                const target = e.target;
                if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
                    return;
                }

                // Check how many files are currently selected
                const selectedRows = document.querySelectorAll('tr.selected, [data-entry-id].selected, input.selectCheckBox:checked');
                
                if (selectedRows.length === 0) {
                    // Prevent Nextcloud from bubbling delete action to current directory!
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    console.info('[DeleteGuard] Zablokowano przypadkowe usunięcie bieżącego folderu (Issue #62278).');
                    
                    if (window.OC && window.OC.Notification) {
                        window.OC.Notification.showTemporary('🛡️ Ochrona: Zaznacz konkretne pliki na liście przed naciśnięciem Delete.');
                    }
                }
            }
        }, true); // Use capture phase so we intercept before Nextcloud default handlers
    }
}
