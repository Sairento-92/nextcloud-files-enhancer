/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export class HashCalculator {
    constructor() {
        this.init();
    }

    init() {
        if (!window.OCA || !window.OCA.Files || !window.OCA.Files.fileActions) return;

        window.OCA.Files.fileActions.registerAction({
            name: 'FilesEnhancerChecksums',
            displayName: '🔍 Sumy kontrolne (Hashe)',
            mime: 'all',
            permissions: OC.PERMISSION_READ,
            iconClass: 'icon-info',
            actionHandler: (fileName, context) => {
                this.calculateHashes(fileName, context);
            }
        });
    }

    calculateHashes(fileName, context) {
        const currentDir = this.getCurrentDir();
        const fullPath = (currentDir === '/' ? '' : currentDir) + '/' + fileName;

        const notifyId = OC.Notification.show('Obliczanie sum kontrolnych (MD5, SHA-1, SHA-256)...');

        fetch(OC.generateUrl('/apps/files_enhancer/api/v1/hash'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'requesttoken': OC.requestToken
            },
            body: JSON.stringify({ path: fullPath })
        })
        .then(res => res.json())
        .then(data => {
            OC.Notification.hide(notifyId);
            if (data.error) {
                OC.Notification.showTemporary('Błąd obliczania hasha: ' + data.error);
            } else {
                this.showHashModal(fileName, data);
            }
        })
        .catch(err => {
            OC.Notification.hide(notifyId);
            OC.Notification.showTemporary('Błąd połączenia: ' + err.message);
        });
    }

    showHashModal(fileName, data) {
        document.querySelectorAll('.fe-hash-modal').forEach(m => m.remove());

        const modal = document.createElement('div');
        modal.className = 'fe-hash-modal';
        modal.innerHTML = `
            <div class="fe-hash-box">
                <div class="fe-modal-header">
                    <h3>🔍 Sumy kontrolne pliku</h3>
                    <button class="fe-modal-close">✕</button>
                </div>
                <div class="fe-modal-body">
                    <div style="font-weight: 600; margin-bottom: 12px; font-size: 14px;">${this.escapeHtml(fileName)}</div>
                    
                    <div class="fe-hash-row">
                        <label>MD5:</label>
                        <div class="fe-hash-value-wrap">
                            <input type="text" readonly value="${data.md5}" id="fe-hash-md5" />
                            <button class="fe-copy-btn" data-target="fe-hash-md5">Kopiuj</button>
                        </div>
                    </div>

                    <div class="fe-hash-row">
                        <label>SHA-1:</label>
                        <div class="fe-hash-value-wrap">
                            <input type="text" readonly value="${data.sha1}" id="fe-hash-sha1" />
                            <button class="fe-copy-btn" data-target="fe-hash-sha1">Kopiuj</button>
                        </div>
                    </div>

                    <div class="fe-hash-row">
                        <label>SHA-256:</label>
                        <div class="fe-hash-value-wrap">
                            <input type="text" readonly value="${data.sha256}" id="fe-hash-sha256" />
                            <button class="fe-copy-btn" data-target="fe-hash-sha256">Kopiuj</button>
                        </div>
                    </div>

                    <div class="fe-hash-compare-section">
                        <label>Weryfikacja (wklej sumę od dostawcy):</label>
                        <input type="text" id="fe-hash-input-compare" placeholder="Wklej tutaj hash do porównania..." />
                        <div id="fe-compare-result" style="margin-top: 6px; font-weight: 600; font-size: 13px;"></div>
                    </div>
                </div>
                <div class="fe-modal-footer">
                    <button class="button primary fe-modal-close">Zamknij</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Copy buttons
        modal.querySelectorAll('.fe-copy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                const val = modal.querySelector('#' + targetId).value;
                navigator.clipboard.writeText(val);
                btn.textContent = 'Skopiowano!';
                setTimeout(() => btn.textContent = 'Kopiuj', 2000);
            });
        });

        // Hash verification
        const compareInput = modal.querySelector('#fe-hash-input-compare');
        const compareResult = modal.querySelector('#fe-compare-result');
        compareInput.addEventListener('input', () => {
            const query = compareInput.value.trim().toLowerCase();
            if (!query) {
                compareResult.textContent = '';
                return;
            }
            if (query === data.md5.toLowerCase()) {
                compareResult.innerHTML = '<span style="color: var(--color-success);">✓ Zgodny z MD5!</span>';
            } else if (query === data.sha1.toLowerCase()) {
                compareResult.innerHTML = '<span style="color: var(--color-success);">✓ Zgodny z SHA-1!</span>';
            } else if (query === data.sha256.toLowerCase()) {
                compareResult.innerHTML = '<span style="color: var(--color-success);">✓ Zgodny z SHA-256!</span>';
            } else {
                compareResult.innerHTML = '<span style="color: var(--color-error);">✕ Suma kontrolna NIE pasuje!</span>';
            }
        });

        modal.querySelectorAll('.fe-modal-close').forEach(b => b.addEventListener('click', () => modal.remove()));
    }

    getCurrentDir() {
        if (window.OCA && window.OCA.Files && window.OCA.Files.App && window.OCA.Files.App.fileList) {
            return window.OCA.Files.App.fileList.getCurrentDirectory() || '/';
        }
        return '/';
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }
}
