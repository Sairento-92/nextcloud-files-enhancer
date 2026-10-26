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
import { DeleteGuard } from './deleteGuard.js';
import { QuickActions } from './quickActions.js';
import { DotfilesToggle } from './dotfilesToggle.js';
import { FolderSorting } from './folderSorting.js';
import { ExactTimestamps } from './exactTimestamps.js';
import { PinnedFolders } from './pinnedFolders.js';
import { BatchShare } from './batchShare.js';
import { ImageConverter } from './imageConverter.js';
import { ConflictGuard } from './conflictGuard.js';
import { FolderTreeDrop } from './folderTreeDrop.js';
import { RichWorkspace } from './richWorkspace.js';
import { SecureVault } from './secureVault.js';
import { DirectOpenRecent } from './directOpenRecent.js';
import { TrashGuard } from './trashGuard.js';
import { LiveRefresh } from './liveRefresh.js';
import { DirectDeleteRecent } from './directDeleteRecent.js';
import { FolderActionBar } from './folderActionBar.js';
import { ModernNewMenu } from './modernNewMenu.js';
import { SearchBreadcrumb } from './searchBreadcrumb.js';
import { ViewerFolderPager } from './viewerFolderPager.js';
import { DuplicateManager } from './duplicateManager.js';
import { PdfTools } from './pdfTools.js';
import { DiffViewer } from './diffViewer.js';

class FilesEnhancerApp {
    constructor() {
        this.initialized = false;
        this.init();
    }

    init() {
        console.info('[Files Enhancer] Inicjalizacja pakietu rozszerzeń dla Nextcloud Files v1.5.0 (by Sairento)...');

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
            
            // Community PRs & Issues enhancements
            new DeleteGuard();        // Issue #62278
            new QuickActions();       // Issue #59665
            new DotfilesToggle();     // Issue #39027
            new FolderSorting();      // Issue #65101
            new ExactTimestamps();    // Issue #22278 & #54784
            new PinnedFolders();      // PR #61825
            new BatchShare();         // Issue #3902 & #26248
            new ImageConverter();     // Media conversion (WebP, PNG, JPG)
            new ConflictGuard();      // Issue #33719
            new FolderTreeDrop();     // Issue #65764
            new RichWorkspace();      // Issue #62413
            new SecureVault();        // Issue #56519
            new DirectOpenRecent();   // Issue #56420
            new TrashGuard();         // Issue #58407
            new LiveRefresh();        // PR #65393
            new DirectDeleteRecent(); // PR #65811 / Issue #65281
            new FolderActionBar();    // Issue #57752
            new ModernNewMenu();      // Issue #56523
            new SearchBreadcrumb();   // Issue #56546
            new ViewerFolderPager();  // PR #65058
            new DuplicateManager();   // Graficzny menedżer duplikatów
            new PdfTools();           // Narzędzia PDF (Merge, Split, Rotate)
            new DiffViewer();         // Wizualna porównywarka diff dla plików

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
            pill.title = 'Files Enhancer aktywny (QuickLook, Delete Guard, ZIP/TAR, Color Tags, Hashe, Batch Rename, Pinned Folders)';
            pill.innerHTML = `<span>⚡ Files+</span>`;
            header.appendChild(pill);
        }
    }
}

new FilesEnhancerApp();
