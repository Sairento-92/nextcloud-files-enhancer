/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Implements Nextcloud Issue #56420:
 * Open files directly from [Recent] and [Favorites] views without losing context.
 */

export class DirectOpenRecent {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('click', (e) => {
            const currentView = window.location.hash || window.location.pathname;
            const isRecentOrFavorites = currentView.includes('recent') || currentView.includes('favorites') || currentView.includes('sharing');
            if (!isRecentOrFavorites) return;

            const nameLink = e.target.closest('tr[data-file] .nametext a, [data-entry-id] .file-name a');
            if (!nameLink) return;

            const row = nameLink.closest('tr, [data-entry-id]');
            const isDir = row?.getAttribute('data-type') === 'dir';
            if (isDir) return;

            // Trigger Spacebar / QuickLook directly instead of hard navigation
            const spaceEvent = new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true });
            row.classList.add('selected');
            document.dispatchEvent(spaceEvent);
            e.preventDefault();
            e.stopPropagation();
        }, true);
    }
}
