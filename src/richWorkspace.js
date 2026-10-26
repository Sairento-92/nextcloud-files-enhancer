/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Implements Nextcloud Issue #62413:
 * Show Rich Workspace (folder README/description) at the top of the file view.
 */

export class RichWorkspace {
    constructor() {
        this.currentLoadedReadme = null;
        this.init();
    }

    init() {
        this.observeDirectory();
    }

    observeDirectory() {
        const observer = new MutationObserver(() => {
            this.checkAndRenderReadme();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        this.checkAndRenderReadme();
    }

    checkAndRenderReadme() {
        const currentDir = (window.OCA && window.OCA.Files && window.OCA.Files.App && window.OCA.Files.App.fileList)
            ? window.OCA.Files.App.fileList.getCurrentDirectory()
            : '/';

        // Find README row in current view
        let readmeRow = null;
        let readmeName = null;
        const rows = document.querySelectorAll('tr[data-file], [data-entry-id]');
        rows.forEach(row => {
            const name = (row.getAttribute('data-file') || row.querySelector('.innernametext, .file-name')?.textContent || '').trim();
            if (['readme.md', 'README.md', 'Readme.md', 'README.txt', 'readme.txt'].includes(name)) {
                readmeRow = row;
                readmeName = name;
            }
        });

        const targetTable = document.querySelector('#filestable, .files-list-view, #emptycontent');
        if (!targetTable) return;

        const containerId = 'fe-rich-workspace-header';
        let container = document.getElementById(containerId);

        if (!readmeName) {
            if (container) container.remove();
            this.currentLoadedReadme = null;
            return;
        }

        const fullPath = (currentDir === '/' ? '' : currentDir) + '/' + readmeName;
        if (this.currentLoadedReadme === fullPath && container) {
            return;
        }

        this.currentLoadedReadme = fullPath;
        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            container.className = 'fe-rich-workspace-card';
            targetTable.parentNode.insertBefore(container, targetTable);
        }

        container.innerHTML = `
            <div class="fe-rw-header">
                <span class="fe-rw-icon">📖</span>
                <span class="fe-rw-title">Opis folderu (${this.escapeHtml(readmeName)})</span>
                <button class="fe-rw-toggle" title="Zwiń / Rozwiń opis">▼</button>
            </div>
            <div class="fe-rw-body"><div class="fe-loading">Wczytywanie opisu...</div></div>
        `;

        const body = container.querySelector('.fe-rw-body');
        const toggle = container.querySelector('.fe-rw-toggle');
        toggle.addEventListener('click', () => {
            body.classList.toggle('fe-collapsed');
            toggle.textContent = body.classList.contains('fe-collapsed') ? '▲' : '▼';
        });

        fetch(OC.generateUrl('/remote.php/webdav' + encodeURI(fullPath)))
            .then(res => res.text())
            .then(text => {
                const truncated = text.length > 10000 ? text.substring(0, 10000) + '\n\n...' : text;
                body.innerHTML = `<pre class="fe-rw-content">${this.escapeHtml(truncated)}</pre>`;
            })
            .catch(() => {
                body.innerHTML = '<span class="fe-error">Nie udało się załadować zawartości README.</span>';
            });
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }
}
