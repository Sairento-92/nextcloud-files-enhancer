/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Implements Nextcloud Issue #3902 & #26248:
 * Allow sharing a batch of selected files with someone / multi-file sharing.
 */

export class BatchShare {
    constructor() {
        this.init();
    }

    init() {
        this.observeSelectionMenu();
    }

    observeSelectionMenu() {
        const observer = new MutationObserver(() => {
            const actionsContainer = document.querySelector('.selection-actions, #filestable thead .selectedActions, .files-selection-summary');
            if (actionsContainer && !actionsContainer.querySelector('.fe-batch-share-btn')) {
                const btn = document.createElement('a');
                btn.className = 'button btn fe-batch-share-btn';
                btn.href = '#';
                btn.innerHTML = '<span class="icon-shared"></span> Udostępnij zaznaczone';
                btn.style.marginLeft = '8px';
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const selected = this.getSelectedFileNames();
                    if (selected.length > 0) {
                        this.executeBatchShare(selected);
                    }
                });
                actionsContainer.appendChild(btn);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    getSelectedFileNames() {
        const selected = [];
        const checked = document.querySelectorAll('tr.selected, [data-entry-id].selected, input.selectCheckBox:checked');
        checked.forEach(el => {
            const row = el.closest('tr, [data-entry-id]');
            const name = row?.getAttribute('data-file') || row?.querySelector('.innernametext, .file-name')?.textContent?.trim();
            if (name && !selected.includes(name)) {
                selected.push(name);
            }
        });
        return selected;
    }

    executeBatchShare(fileNames) {
        const currentDir = (window.OCA && window.OCA.Files && window.OCA.Files.App && window.OCA.Files.App.fileList)
            ? window.OCA.Files.App.fileList.getCurrentDirectory()
            : '/';

        const fullPaths = fileNames.map(f => (currentDir === '/' ? '' : currentDir) + '/' + f);
        const notifyId = OC.Notification.show('Generowanie linków publicznych dla ' + fileNames.length + ' elementów...');

        fetch(OC.generateUrl('/apps/files_enhancer/api/v1/share/batch'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'requesttoken': OC.requestToken
            },
            body: JSON.stringify({ paths: fullPaths })
        })
        .then(res => res.json())
        .then(data => {
            OC.Notification.hide(notifyId);
            if (data.error) {
                OC.Notification.showTemporary('Błąd współdzielenia: ' + data.error);
            } else {
                this.showBatchShareModal(data.shares || []);
            }
        })
        .catch(err => {
            OC.Notification.hide(notifyId);
            OC.Notification.showTemporary('Błąd połączenia: ' + err.message);
        });
    }

    showBatchShareModal(shares) {
        document.querySelectorAll('.fe-batch-share-modal').forEach(m => m.remove());

        const modal = document.createElement('div');
        modal.className = 'fe-batch-share-modal';
        modal.innerHTML = `
            <div class="fe-batch-share-box">
                <div class="fe-modal-header">
                    <h3>🔗 Linki udostępniania (${shares.length} plików)</h3>
                    <button class="fe-modal-close">✕</button>
                </div>
                <div class="fe-modal-body">
                    <p style="font-size: 13px; color: var(--color-text-maxcontrast); margin-top: 0;">
                        Poniżej znajdują się bezpośrednie linki do udostępnionych plików:
                    </p>
                    <div class="fe-shares-list">
                        ${shares.map((s, idx) => `
                            <div class="fe-share-item">
                                <div class="fe-share-item-name">${this.escapeHtml(s.name || s.path)}</div>
                                <div class="fe-share-item-url-wrap">
                                    <input type="text" readonly value="${s.url || s.error}" id="fe-share-url-${idx}" />
                                    <button class="fe-copy-btn" data-target="fe-share-url-${idx}">Kopiuj</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="fe-modal-footer">
                    <button class="button" id="fe-copy-all-shares-btn">Kopiuj wszystkie linki</button>
                    <button class="button primary fe-modal-close">Gotowe</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Copy individual
        modal.querySelectorAll('.fe-copy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                const val = modal.querySelector('#' + targetId).value;
                navigator.clipboard.writeText(val);
                btn.textContent = 'Skopiowano!';
                setTimeout(() => btn.textContent = 'Kopiuj', 2000);
            });
        });

        // Copy all
        modal.querySelector('#fe-copy-all-shares-btn').addEventListener('click', (e) => {
            const allUrls = shares.map(s => `${s.name}: ${s.url}`).join('\n');
            navigator.clipboard.writeText(allUrls);
            e.target.textContent = 'Skopiowano wszystkie!';
            setTimeout(() => e.target.textContent = 'Kopiuj wszystkie linki', 2500);
        });

        modal.querySelectorAll('.fe-modal-close').forEach(b => b.addEventListener('click', () => modal.remove()));
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }
}
