/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Implements Nextcloud Issue #22278 & #54784:
 * Display absolute and detailed file date/time instead of relative ones.
 */

export class ExactTimestamps {
    constructor() {
        this.showExact = localStorage.getItem('fe_exact_timestamps') === 'true';
        this.init();
    }

    init() {
        this.observeDOM();
        this.formatTimestamps();
    }

    observeDOM() {
        const observer = new MutationObserver(() => {
            this.formatTimestamps();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    formatTimestamps() {
        const dateCells = document.querySelectorAll('td.date, .modified, [data-timestamp]');
        dateCells.forEach(cell => {
            if (cell.getAttribute('data-fe-enhanced') === '1') {
                return;
            }

            const rawTimestamp = cell.getAttribute('data-timestamp') || cell.getAttribute('data-mtime');
            if (!rawTimestamp) return;

            const ts = parseInt(rawTimestamp, 10);
            if (isNaN(ts) || ts <= 0) return;

            // Nextcloud timestamps can be in seconds or milliseconds
            const date = new Date(ts > 10000000000 ? ts : ts * 1000);
            const exactStr = date.toLocaleString('pl-PL', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            const origText = cell.textContent.trim();
            cell.setAttribute('title', `Dokładny czas: ${exactStr} (Kliknij, aby przełączyć format)`);
            cell.setAttribute('data-fe-enhanced', '1');
            cell.style.cursor = 'pointer';

            if (this.showExact) {
                cell.textContent = exactStr;
            }

            cell.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showExact = !this.showExact;
                localStorage.setItem('fe_exact_timestamps', String(this.showExact));
                document.querySelectorAll('td.date[data-fe-enhanced="1"]').forEach(c => {
                    c.removeAttribute('data-fe-enhanced');
                });
                this.formatTimestamps();
            });
        });
    }
}
