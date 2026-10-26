/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Implements Nextcloud Issue #56546:
 * Files search results show clear breadcrumbs and location paths for files with identical names.
 */

export class SearchBreadcrumb {
    constructor() {
        this.init();
    }

    init() {
        const observer = new MutationObserver(() => this.injectPathChips());
        observer.observe(document.body, { childList: true, subtree: true });
        this.injectPathChips();
    }

    injectPathChips() {
        const hash = window.location.hash || '';
        const search = window.location.search || '';
        const isSearch = hash.includes('search') || search.includes('search') || !!document.querySelector('.search-results');
        if (!isSearch) return;

        const rows = document.querySelectorAll('tr[data-file], .unified-search__result, [data-entry-id]');
        rows.forEach(row => {
            if (row.getAttribute('data-fe-breadcrumb-injected') === '1') return;
            row.setAttribute('data-fe-breadcrumb-injected', '1');

            const path = row.getAttribute('data-path') || row.getAttribute('data-folder') || '';
            const link = row.querySelector('.nametext, .unified-search__result-title, .file-name');
            if (link && path && path !== '/') {
                const chip = document.createElement('span');
                chip.className = 'fe-search-path-chip';
                chip.title = `Lokalizacja: ${path}`;
                chip.innerHTML = `📁 ${this.escapeHtml(path)}`;
                link.appendChild(chip);
            }
        });
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }
}
