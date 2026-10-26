/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Implements Nextcloud Issue #56523:
 * Make the "New" button more intuitive: categorized uploads vs. document creation.
 */

export class ModernNewMenu {
    constructor() {
        this.init();
    }

    init() {
        this.observeNewButton();
    }

    observeNewButton() {
        const observer = new MutationObserver(() => {
            const newMenu = document.querySelector('#newmenu, .new-file-menu, .newFileMenu');
            if (newMenu && !newMenu.classList.contains('fe-menu-processed')) {
                this.enhanceMenu(newMenu);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    enhanceMenu(menuElement) {
        menuElement.classList.add('fe-menu-processed');

        // Check if headers already exist
        if (menuElement.querySelector('.fe-menu-section-header')) return;

        const uploadItems = [];
        const createItems = [];

        const items = menuElement.querySelectorAll('li, a, button, .menuitem');
        items.forEach(item => {
            const text = (item.textContent || '').toLowerCase();
            if (text.includes('upload') || text.includes('wgraj') || text.includes('prześlij')) {
                uploadItems.push(item);
            } else {
                createItems.push(item);
            }
        });

        if (uploadItems.length > 0) {
            const uploadHeader = document.createElement('div');
            uploadHeader.className = 'fe-menu-section-header';
            uploadHeader.innerHTML = `<span>📤 WGRAJ Z DYSKU</span>`;
            uploadItems[0].parentNode.insertBefore(uploadHeader, uploadItems[0]);
        }

        if (createItems.length > 0) {
            const createHeader = document.createElement('div');
            createHeader.className = 'fe-menu-section-header';
            createHeader.innerHTML = `<span>✨ UTWÓRZ W CHMURZE</span>`;
            createItems[0].parentNode.insertBefore(createHeader, createItems[0]);
        }
    }
}
