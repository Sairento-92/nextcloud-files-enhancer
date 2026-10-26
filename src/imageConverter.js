/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export class ImageConverter {
    constructor() {
        this.init();
    }

    init() {
        if (!window.OCA || !window.OCA.Files || !window.OCA.Files.fileActions) return;

        const imageMimes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/bmp',
            'image/gif'
        ];

        imageMimes.forEach(mime => {
            window.OCA.Files.fileActions.registerAction({
                name: 'FilesEnhancerConvertImage',
                displayName: '🖼️ Konwertuj format (WebP / PNG / JPG)',
                mime: mime,
                permissions: OC.PERMISSION_READ | OC.PERMISSION_CREATE,
                iconClass: 'icon-picture',
                actionHandler: (fileName, context) => {
                    this.openConvertModal(fileName);
                }
            });
        });
    }

    openConvertModal(fileName) {
        document.querySelectorAll('.fe-convert-modal').forEach(m => m.remove());

        const modal = document.createElement('div');
        modal.className = 'fe-convert-modal';
        modal.innerHTML = `
            <div class="fe-convert-box">
                <div class="fe-modal-header">
                    <h3>🖼️ Konwertuj format obrazu</h3>
                    <button class="fe-modal-close">✕</button>
                </div>
                <div class="fe-modal-body">
                    <p style="font-size: 13px; margin-top: 0;">Plik źródłowy: <b>${this.escapeHtml(fileName)}</b></p>
                    <div class="fe-form-row">
                        <label>Wybierz docelowy format:</label>
                        <select id="fe-conv-format">
                            <option value="webp">WebP (Nowoczesny, o 30-50% mniejszy rozmiar)</option>
                            <option value="png">PNG (Bezstratna jakość i przezroczystość)</option>
                            <option value="jpg">JPG (Uniwersalna zgodność)</option>
                        </select>
                    </div>
                </div>
                <div class="fe-modal-footer">
                    <button class="button cancel fe-modal-close">Anuluj</button>
                    <button class="button primary" id="fe-conv-start-btn">Konwertuj</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('#fe-conv-start-btn').addEventListener('click', () => {
            const format = modal.querySelector('#fe-conv-format').value;
            this.executeConversion(fileName, format, modal);
        });

        modal.querySelectorAll('.fe-modal-close').forEach(b => b.addEventListener('click', () => modal.remove()));
    }

    executeConversion(fileName, format, modal) {
        modal.remove();

        const currentDir = (window.OCA && window.OCA.Files && window.OCA.Files.App && window.OCA.Files.App.fileList)
            ? window.OCA.Files.App.fileList.getCurrentDirectory()
            : '/';
        const fullPath = (currentDir === '/' ? '' : currentDir) + '/' + fileName;

        const notifyId = OC.Notification.show(`Konwertowanie ${fileName} do formatu ${format.toUpperCase()}...`);

        fetch(OC.generateUrl('/apps/files_enhancer/api/v1/media/convert'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'requesttoken': OC.requestToken
            },
            body: JSON.stringify({ path: fullPath, format: format })
        })
        .then(res => res.json())
        .then(data => {
            OC.Notification.hide(notifyId);
            if (data.error) {
                OC.Notification.showTemporary('Błąd konwersji: ' + data.error);
            } else {
                OC.Notification.showTemporary(`✓ Utworzono plik: ${data.converted}`);
                if (window.OCA && window.OCA.Files && window.OCA.Files.App && window.OCA.Files.App.fileList) {
                    window.OCA.Files.App.fileList.reload();
                }
            }
        })
        .catch(err => {
            OC.Notification.hide(notifyId);
            OC.Notification.showTemporary('Błąd połączenia: ' + err.message);
        });
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }
}
