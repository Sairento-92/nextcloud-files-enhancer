/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Implements Nextcloud Issue #39027:
 * Allow to hide "hidden files" (.dotfiles like .git, .env, .DS_Store, Thumbs.db).
 */

export class DotfilesToggle {
    constructor() {
        this.hideDotfiles = localStorage.getItem('fe_hide_dotfiles') === 'true';
        this.init();
    }

    init() {
        this.applyFilter();
        this.injectToggleButton();
        this.observeRows();
    }

    injectToggleButton() {
        const targetContainer = document.querySelector('.controls, #controls, #filestable thead tr, .files-list-header');
        if (targetContainer && !document.querySelector('.fe-dotfiles-toggle-btn')) {
            const btn = document.createElement('button');
            btn.className = 'fe-dotfiles-toggle-btn';
            btn.title = 'Przełącz widoczność plików ukrytych (.dotfiles, .DS_Store, .git, .env)';
            btn.innerHTML = this.hideDotfiles ? '👁️ Pliki ukryte: <b>Ukryte</b>' : '👁️ Pliki ukryte: <b>Widoczne</b>';
            
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideDotfiles = !this.hideDotfiles;
                localStorage.setItem('fe_hide_dotfiles', String(this.hideDotfiles));
                btn.innerHTML = this.hideDotfiles ? '👁️ Pliki ukryte: <b>Ukryte</b>' : '👁️ Pliki ukryte: <b>Widoczne</b>';
                this.applyFilter();
            });

            targetContainer.appendChild(btn);
        }
    }

    applyFilter() {
        const rows = document.querySelectorAll('tr[data-file], [data-entry-id]');
        rows.forEach(row => {
            const fileName = (row.getAttribute('data-file') || row.querySelector('.innernametext, .file-name')?.textContent || '').trim();
            const isHidden = fileName.startsWith('.') || fileName === 'Thumbs.db' || fileName === 'desktop.ini';

            if (isHidden) {
                if (this.hideDotfiles) {
                    row.classList.add('fe-hidden-dotfile');
                } else {
                    row.classList.remove('fe-hidden-dotfile');
                }
            }
        });
    }

    observeRows() {
        const observer = new MutationObserver(() => {
            this.applyFilter();
            this.injectToggleButton();
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }
}
