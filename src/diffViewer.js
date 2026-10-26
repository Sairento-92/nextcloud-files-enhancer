/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Diff Viewer - Wizualna porównywarka plików tekstowych i kodu (Side-by-Side & Unified Diff)
 */

export class DiffViewer {
    constructor() {
        this.modalId = 'fe-diff-viewer-modal';
        this.firstSelectedFile = null;
        this.init();
    }

    init() {
        this.registerFileActions();
        this.injectBatchDiffAction();
        this.observeDOM();
    }

    observeDOM() {
        const observer = new MutationObserver(() => {
            this.injectBatchDiffAction();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    registerFileActions() {
        if (!window.OCA || !window.OCA.Files || !window.OCA.Files.fileActions) return;

        window.OCA.Files.fileActions.registerAction({
            name: 'feDiffCompare',
            displayName: 'Porównaj (Diff)',
            mime: 'text',
            permissions: 31,
            iconClass: 'icon-history',
            action: (filename, context) => {
                const dir = context.dir || (window.OCA?.Files?.App?.fileList?.getCurrentDirectory() || '');
                if (!this.firstSelectedFile) {
                    this.firstSelectedFile = { filename, dir };
                    alert(`Zaznaczono plik '${filename}' jako pierwszy do porównania. Teraz kliknij 'Porównaj (Diff)' na drugim pliku.`);
                } else {
                    const fileA = this.firstSelectedFile;
                    const fileB = { filename, dir };
                    this.firstSelectedFile = null;
                    this.compareFiles(fileA, fileB);
                }
            }
        });
    }

    injectBatchDiffAction() {
        const batchBar = document.querySelector('.selection-summary, #filestable thead .actions, .files-controls');
        if (!batchBar || document.querySelector('.fe-diff-batch-btn')) return;

        const diffBtn = document.createElement('button');
        diffBtn.className = 'fe-diff-batch-btn';
        diffBtn.style.cssText = 'padding:4px 10px;margin-left:8px;border-radius:6px;background:var(--color-primary,#0082c9);color:#fff;border:none;cursor:pointer;font-size:12px;font-weight:600;display:none;align-items:center;gap:6px;';
        diffBtn.innerHTML = '<span>⚡ Porównaj 2 pliki (Diff)</span>';

        diffBtn.addEventListener('click', () => {
            const fileList = window.OCA?.Files?.App?.fileList;
            if (!fileList) return;
            const selected = fileList.getSelectedFiles();
            if (selected.length === 2) {
                const dir = fileList.getCurrentDirectory() || '';
                this.compareFiles({ filename: selected[0].name, dir }, { filename: selected[1].name, dir });
            }
        });

        batchBar.appendChild(diffBtn);

        const checkSelection = () => {
            const fileList = window.OCA?.Files?.App?.fileList;
            if (!fileList) return;
            const selected = fileList.getSelectedFiles();
            if (selected.length === 2) {
                diffBtn.style.display = 'inline-flex';
            } else {
                diffBtn.style.display = 'none';
            }
        };

        document.addEventListener('change', (e) => {
            if (e.target.matches && e.target.matches('input[type="checkbox"]')) {
                setTimeout(checkSelection, 100);
            }
        });
    }

    async compareFiles(fileA, fileB) {
        const existing = document.getElementById(this.modalId);
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = this.modalId;
        modal.innerHTML = `
            <div class="fe-modal-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);z-index:100000;display:flex;align-items:center;justify-content:center;animation:feFadeIn 0.2s ease;">
                <div class="fe-modal-box" style="background:var(--color-main-background,#fff);color:var(--color-main-text,#111);width:95%;max-width:1100px;height:85vh;border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,0.3);display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--color-border,#e5e7eb);">
                    <!-- Header -->
                    <div style="padding:14px 20px;border-bottom:1px solid var(--color-border,#e5e7eb);display:flex;align-items:center;justify-content:space-between;background:var(--color-background-hover,#f9fafb);">
                        <div style="display:flex;align-items:center;gap:12px;">
                            <span style="font-size:22px;">⚡</span>
                            <div>
                                <h3 style="margin:0;font-size:16px;font-weight:700;">Wizualna Porównywarka Różnic (Diff)</h3>
                                <p style="margin:2px 0 0;font-size:12px;opacity:0.75;">
                                    <span style="color:#dc2626;font-weight:600;">(A) ${fileA.filename}</span> vs 
                                    <span style="color:#16a34a;font-weight:600;">(B) ${fileB.filename}</span>
                                </p>
                            </div>
                        </div>
                        <div style="display:flex;align-items:center;gap:10px;">
                            <div id="fe-diff-stats" style="font-size:12px;font-weight:600;"></div>
                            <button class="fe-modal-close" style="background:none;border:none;font-size:22px;cursor:pointer;color:inherit;opacity:0.6;">&times;</button>
                        </div>
                    </div>

                    <!-- Diff Container -->
                    <div id="fe-diff-content" style="flex:1;overflow:auto;padding:12px;background:#1e1e1e;color:#d4d4d4;font-family:Consolas, 'Courier New', monospace;font-size:12px;line-height:1.6;">
                        <div style="text-align:center;padding:50px;color:#888;">Pobieranie zawartości plików...</div>
                    </div>

                    <!-- Footer -->
                    <div style="padding:10px 20px;border-top:1px solid var(--color-border,#e5e7eb);display:flex;justify-content:flex-end;background:var(--color-background-hover,#f9fafb);">
                        <button class="fe-modal-close" style="padding:6px 16px;border-radius:6px;background:none;border:1px solid var(--color-border,#ccc);color:inherit;cursor:pointer;font-size:13px;">
                            Zamknij
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelectorAll('.fe-modal-close').forEach(b => {
            b.addEventListener('click', () => modal.remove());
        });

        try {
            const [textA, textB] = await Promise.all([
                this.fetchFileContent(fileA.dir, fileA.filename),
                this.fetchFileContent(fileB.dir, fileB.filename)
            ]);

            this.renderDiff(textA, textB, fileA.filename, fileB.filename);
        } catch (err) {
            const content = document.getElementById('fe-diff-content');
            if (content) {
                content.innerHTML = `<div style="text-align:center;padding:40px;color:#f87171;">Błąd pobierania plików: ${err.message}</div>`;
            }
        }
    }

    async fetchFileContent(dir, filename) {
        const user = window.OC?.currentUser || 'admin';
        const cleanDir = dir.replace(/^\/+|\/+$/g, '');
        const fullPath = cleanDir ? `${cleanDir}/${filename}` : filename;
        const url = `${window.location.origin}/remote.php/dav/files/${user}/${encodeURIComponent(fullPath).replace(/%2F/g, '/')}`;

        const resp = await fetch(url, {
            headers: { 'requesttoken': (window.OC && window.OC.requestToken) || '' }
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status} przy pliku ${filename}`);
        return await resp.text();
    }

    renderDiff(textA, textB, nameA, nameB) {
        const linesA = textA.split(/\r?\n/);
        const linesB = textB.split(/\r?\n/);

        const diffLines = this.computeLcsDiff(linesA, linesB);

        let added = 0;
        let removed = 0;
        let html = `
            <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
                <thead>
                    <tr style="border-bottom:1px solid #333;color:#888;">
                        <th style="width:50px;text-align:right;padding:4px 8px;">Linia</th>
                        <th style="width:50px;text-align:right;padding:4px 8px;">Linia</th>
                        <th style="width:30px;text-align:center;">+/-</th>
                        <th style="padding:4px 8px;text-align:left;">Zawartość</th>
                    </tr>
                </thead>
                <tbody>
        `;

        diffLines.forEach(item => {
            let bg = 'transparent';
            let prefix = ' ';
            let textColor = 'inherit';

            if (item.type === 'add') {
                added++;
                bg = 'rgba(46, 160, 67, 0.25)';
                textColor = '#7ee787';
                prefix = '+';
            } else if (item.type === 'del') {
                removed++;
                bg = 'rgba(248, 81, 73, 0.25)';
                textColor = '#ffa198';
                prefix = '-';
            }

            const escContent = this.escapeHtml(item.text);
            const lineANum = item.lineA !== null ? item.lineA : '';
            const lineBNum = item.lineB !== null ? item.lineB : '';

            html += `
                <tr style="background:${bg};color:${textColor};">
                    <td style="width:50px;text-align:right;padding:2px 8px;color:#6e7681;user-select:none;">${lineANum}</td>
                    <td style="width:50px;text-align:right;padding:2px 8px;color:#6e7681;user-select:none;">${lineBNum}</td>
                    <td style="width:30px;text-align:center;user-select:none;font-weight:700;">${prefix}</td>
                    <td style="padding:2px 8px;white-space:pre-wrap;word-break:break-all;">${escContent || '&nbsp;'}</td>
                </tr>
            `;
        });

        html += `</tbody></table>`;

        const content = document.getElementById('fe-diff-content');
        if (content) content.innerHTML = html;

        const stats = document.getElementById('fe-diff-stats');
        if (stats) {
            stats.innerHTML = `<span style="color:#7ee787;margin-right:8px;">+${added} dodanych</span> <span style="color:#ffa198;">-${removed} usuniętych</span>`;
        }
    }

    computeLcsDiff(a, b) {
        // Line-by-line diff implementation
        const result = [];
        let i = 0;
        let j = 0;

        while (i < a.length && j < b.length) {
            if (a[i] === b[j]) {
                result.push({ type: 'same', text: a[i], lineA: i + 1, lineB: j + 1 });
                i++;
                j++;
            } else {
                // Look ahead for matching line
                let nextMatchA = -1;
                let nextMatchB = -1;

                for (let k = 1; k < 10 && (i + k < a.length || j + k < b.length); k++) {
                    if (j + k < b.length && a[i] === b[j + k]) {
                        nextMatchB = j + k;
                        break;
                    }
                    if (i + k < a.length && a[i + k] === b[j]) {
                        nextMatchA = i + k;
                        break;
                    }
                }

                if (nextMatchB !== -1) {
                    while (j < nextMatchB) {
                        result.push({ type: 'add', text: b[j], lineA: null, lineB: j + 1 });
                        j++;
                    }
                } else if (nextMatchA !== -1) {
                    while (i < nextMatchA) {
                        result.push({ type: 'del', text: a[i], lineA: i + 1, lineB: null });
                        i++;
                    }
                } else {
                    result.push({ type: 'del', text: a[i], lineA: i + 1, lineB: null });
                    result.push({ type: 'add', text: b[j], lineA: null, lineB: j + 1 });
                    i++;
                    j++;
                }
            }
        }

        while (i < a.length) {
            result.push({ type: 'del', text: a[i], lineA: i + 1, lineB: null });
            i++;
        }

        while (j < b.length) {
            result.push({ type: 'add', text: b[j], lineA: null, lineB: j + 1 });
            j++;
        }

        return result;
    }

    escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}
