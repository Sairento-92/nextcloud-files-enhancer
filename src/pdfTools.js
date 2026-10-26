/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * PDF Tools - Narzędzia manipulacji PDF (Łączenie, podział, obracanie stron)
 */

export class PdfTools {
    constructor() {
        this.modalId = 'fe-pdf-tools-modal';
        this.init();
    }

    init() {
        this.registerFileActions();
        this.injectBatchMergeAction();
        this.observeDOM();
    }

    observeDOM() {
        const observer = new MutationObserver(() => {
            this.injectBatchMergeAction();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    registerFileActions() {
        if (!window.OCA || !window.OCA.Files || !window.OCA.Files.fileActions) return;

        window.OCA.Files.fileActions.registerAction({
            name: 'fePdfTools',
            displayName: 'Narzędzia PDF',
            mime: 'application/pdf',
            permissions: 31, // ALL
            iconClass: 'icon-settings',
            action: (filename, context) => {
                const dir = context.dir || (window.OCA?.Files?.App?.fileList?.getCurrentDirectory() || '');
                this.openPdfModal(filename, dir);
            }
        });
    }

    injectBatchMergeAction() {
        const batchBar = document.querySelector('.selection-summary, #filestable thead .actions, .files-controls');
        if (!batchBar || document.querySelector('.fe-pdf-batch-merge-btn')) return;

        const mergeBtn = document.createElement('button');
        mergeBtn.className = 'fe-pdf-batch-merge-btn';
        mergeBtn.style.cssText = 'padding:4px 10px;margin-left:8px;border-radius:6px;background:var(--color-primary,#0082c9);color:#fff;border:none;cursor:pointer;font-size:12px;font-weight:600;display:none;align-items:center;gap:6px;';
        mergeBtn.innerHTML = '<span>📄➕ Połącz wybrane PDF-y</span>';

        mergeBtn.addEventListener('click', () => {
            this.handleBatchMerge();
        });

        batchBar.appendChild(mergeBtn);

        // Update visibility on selection change
        const checkSelection = () => {
            const fileList = window.OCA?.Files?.App?.fileList;
            if (!fileList) return;
            const selected = fileList.getSelectedFiles();
            const pdfs = selected.filter(f => f.name && f.name.toLowerCase().endsWith('.pdf') || f.mimetype === 'application/pdf');
            if (pdfs.length >= 2) {
                mergeBtn.style.display = 'inline-flex';
                mergeBtn.querySelector('span').textContent = `📄➕ Połącz ${pdfs.length} PDF-y`;
            } else {
                mergeBtn.style.display = 'none';
            }
        };

        document.addEventListener('change', (e) => {
            if (e.target.matches && e.target.matches('input[type="checkbox"]')) {
                setTimeout(checkSelection, 100);
            }
        });
    }

    openPdfModal(filename, dir) {
        const existing = document.getElementById(this.modalId);
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = this.modalId;
        modal.innerHTML = `
            <div class="fe-modal-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);z-index:100000;display:flex;align-items:center;justify-content:center;animation:feFadeIn 0.2s ease;">
                <div class="fe-modal-box" style="background:var(--color-main-background,#fff);color:var(--color-main-text,#111);width:90%;max-width:540px;border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,0.3);overflow:hidden;border:1px solid var(--color-border,#e5e7eb);">
                    <!-- Header -->
                    <div style="padding:16px 20px;border-bottom:1px solid var(--color-border,#e5e7eb);display:flex;align-items:center;justify-content:space-between;background:var(--color-background-hover,#f9fafb);">
                        <div style="display:flex;align-items:center;gap:10px;">
                            <span style="font-size:22px;">📄</span>
                            <div>
                                <h3 style="margin:0;font-size:16px;font-weight:700;">Narzędzia PDF</h3>
                                <p style="margin:2px 0 0;font-size:12px;opacity:0.75;overflow:hidden;text-overflow:ellipsis;max-width:380px;white-space:nowrap;">${filename}</p>
                            </div>
                        </div>
                        <button class="fe-modal-close" style="background:none;border:none;font-size:22px;cursor:pointer;color:inherit;opacity:0.6;">&times;</button>
                    </div>

                    <!-- Options -->
                    <div style="padding:20px;display:flex;flex-direction:column;gap:16px;">
                        <!-- Rotate Section -->
                        <div style="border:1px solid var(--color-border,#e5e7eb);border-radius:10px;padding:14px;">
                            <h4 style="margin:0 0 8px;font-size:14px;display:flex;align-items:center;gap:6px;">
                                <span>🔄</span> Obróć strony dokumentu
                            </h4>
                            <div style="display:flex;gap:10px;margin-top:10px;">
                                <button class="fe-pdf-action-btn" data-action="rotate" data-deg="90" style="flex:1;padding:8px;border-radius:6px;border:1px solid var(--color-border,#ccc);background:var(--color-main-background,#fff);color:inherit;cursor:pointer;font-size:12px;font-weight:600;">
                                    ↷ 90° w prawo
                                </button>
                                <button class="fe-pdf-action-btn" data-action="rotate" data-deg="180" style="flex:1;padding:8px;border-radius:6px;border:1px solid var(--color-border,#ccc);background:var(--color-main-background,#fff);color:inherit;cursor:pointer;font-size:12px;font-weight:600;">
                                    ↻ 180°
                                </button>
                                <button class="fe-pdf-action-btn" data-action="rotate" data-deg="270" style="flex:1;padding:8px;border-radius:6px;border:1px solid var(--color-border,#ccc);background:var(--color-main-background,#fff);color:inherit;cursor:pointer;font-size:12px;font-weight:600;">
                                    ↶ 90° w lewo
                                </button>
                            </div>
                        </div>

                        <!-- Split Section -->
                        <div style="border:1px solid var(--color-border,#e5e7eb);border-radius:10px;padding:14px;">
                            <h4 style="margin:0 0 8px;font-size:14px;display:flex;align-items:center;gap:6px;">
                                <span>✂️</span> Wyodrębnij / Podziel strony
                            </h4>
                            <div style="display:flex;gap:10px;align-items:center;margin-top:8px;">
                                <input type="text" id="fe-pdf-page-range" placeholder="np. 1-3, 5, 8-10" style="flex:1;padding:8px 12px;border-radius:6px;border:1px solid var(--color-border,#ccc);background:inherit;color:inherit;font-size:13px;">
                                <button class="fe-pdf-action-btn" data-action="split" style="padding:8px 16px;border-radius:6px;background:var(--color-primary,#0082c9);color:#fff;border:none;cursor:pointer;font-weight:600;font-size:12px;">
                                    Wyodrębnij
                                </button>
                            </div>
                            <span style="font-size:11px;opacity:0.65;display:block;margin-top:4px;">Zostanie utworzony nowy plik PDF z wybranymi stronami.</span>
                        </div>

                        <div id="fe-pdf-status-msg" style="display:none;padding:10px;border-radius:6px;font-size:12px;text-align:center;"></div>
                    </div>

                    <!-- Footer -->
                    <div style="padding:12px 20px;border-top:1px solid var(--color-border,#e5e7eb);display:flex;justify-content:flex-end;background:var(--color-background-hover,#f9fafb);">
                        <button class="fe-modal-close" style="padding:7px 16px;border-radius:6px;background:none;border:1px solid var(--color-border,#ccc);color:inherit;cursor:pointer;font-size:13px;">
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

        modal.querySelectorAll('.fe-pdf-action-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const action = btn.getAttribute('data-action');
                const deg = btn.getAttribute('data-deg');
                const range = modal.querySelector('#fe-pdf-page-range')?.value;
                await this.executePdfAction(action, { filename, dir, deg, range });
            });
        });
    }

    async executePdfAction(action, params) {
        const statusEl = document.getElementById('fe-pdf-status-msg');
        if (statusEl) {
            statusEl.style.display = 'block';
            statusEl.style.background = '#e0f2fe';
            statusEl.style.color = '#0369a1';
            statusEl.textContent = 'Przetwarzanie dokumentu PDF...';
        }

        try {
            const resp = await fetch('/apps/files_enhancer/api/v1/pdf/action', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'requesttoken': (window.OC && window.OC.requestToken) || ''
                },
                body: JSON.stringify({ action, ...params })
            });

            if (!resp.ok) {
                const errJson = await resp.json().catch(() => ({}));
                throw new Error(errJson.message || `HTTP ${resp.status}`);
            }

            const res = await resp.json();
            if (statusEl) {
                statusEl.style.background = '#dcfce7';
                statusEl.style.color = '#15803d';
                statusEl.textContent = res.message || 'Operacja PDF zakończona pomyślnie!';
            }

            setTimeout(() => {
                const modal = document.getElementById(this.modalId);
                if (modal) modal.remove();
                if (window.OCA?.Files?.App?.fileList) {
                    window.OCA.Files.App.fileList.reload();
                }
            }, 1200);

        } catch (err) {
            if (statusEl) {
                statusEl.style.background = '#fee2e2';
                statusEl.style.color = '#b91c1c';
                statusEl.textContent = `Błąd: ${err.message}`;
            }
        }
    }

    async handleBatchMerge() {
        const fileList = window.OCA?.Files?.App?.fileList;
        if (!fileList) return;

        const selected = fileList.getSelectedFiles();
        const pdfs = selected.filter(f => f.name && f.name.toLowerCase().endsWith('.pdf') || f.mimetype === 'application/pdf');
        if (pdfs.length < 2) return;

        const defaultName = `Polaczone_${new Date().toISOString().slice(0, 10)}.pdf`;
        const outputName = prompt(`Podaj nazwę dla połączonego pliku PDF:`, defaultName);
        if (!outputName) return;

        const dir = fileList.getCurrentDirectory() || '';
        const files = pdfs.map(f => f.name);

        try {
            const resp = await fetch('/apps/files_enhancer/api/v1/pdf/merge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'requesttoken': (window.OC && window.OC.requestToken) || ''
                },
                body: JSON.stringify({ dir, files, outputName })
            });

            if (!resp.ok) {
                const errJson = await resp.json().catch(() => ({}));
                throw new Error(errJson.message || `HTTP ${resp.status}`);
            }

            alert(`Połączono ${files.length} plików PDF do '${outputName}'!`);
            fileList.reload();
        } catch (err) {
            alert(`Błąd łączenia PDF: ${err.message}`);
        }
    }
}
