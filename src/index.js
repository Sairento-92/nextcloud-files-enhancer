/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { QuickLook } from './quickLook.js';
import { ArchiveManager } from './archiveManager.js';
import { ColorTags } from './colorTags.js';
import { BatchRenamer } from './batchRenamer.js';
import { HashCalculator } from './hashCalculator.js';
import { FolderSizeCalculator } from './folderSize.js';
import { QuickPaths } from './quickPaths.js';

class FilesEnhancerApp {
    constructor() {
        this.initialized = false;
        this.init();
    }

    init() {
        console.info('[Files Enhancer] Inicjalizacja pakietu rozszerzeń dla Nextcloud Files (by Sairento)...');

        const bootstrap = () => {
            if (this.initialized) return;

            // Initialize all enhancement modules
            new QuickLook();
            new ArchiveManager();
            new ColorTags();
            new BatchRenamer();
            new HashCalculator();
            new FolderSizeCalculator();
            new QuickPaths();

            this.injectHeaderPill();
            this.initialized = true;
            console.info('[Files Enhancer] Wszystkie moduły załadowane pomyślnie.');
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', bootstrap);
        } else {
            bootstrap();
        }

        // Support Nextcloud Single Page App navigation
        window.addEventListener('popstate', () => {
            setTimeout(bootstrap, 300);
        });
    }

    injectHeaderPill() {
        const header = document.querySelector('#header .header-left, .header-menu, #header');
        if (header && !document.querySelector('.fe-header-badge')) {
            const pill = document.createElement('div');
            pill.className = 'fe-header-badge';
            pill.title = 'Files Enhancer aktywny (QuickLook, ZIP/TAR, Color Tags, Hashe, Batch Rename)';
            pill.innerHTML = `<span>⚡ Files+</span>`;
            header.appendChild(pill);
        }
    }
}

new FilesEnhancerApp();
