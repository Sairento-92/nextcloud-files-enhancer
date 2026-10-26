/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Web UI Deduplicator - Graficzny menedżer wyszukiwania i czyszczenia duplikatów plików
 */

export class DuplicateManager {
    constructor() {
        this.modalId = 'fe-duplicate-manager-modal';
        this.init();
    }

    init() {
        this.injectSidebarEntry();
        this.observeDOM();
    }

    observeDOM() {
        const observer = new MutationObserver(() => {
            this.injectSidebarEntry();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    injectSidebarEntry() {
        const navList = document.querySelector('#app-navigation ul, .app-navigation__list');
        if (!navList || document.querySelector('.fe-nav-deduplicator')) return;

        const li = document.createElement('li');
        li.className = 'fe-nav-deduplicator app-navigation-entry';
        li.innerHTML = `
            <a href="javascript:void(0)" class="app-navigation-entry-link" style="display:flex;align-items:center;gap:10px;padding:8px 14px;color:var(--color-main-text,#222);text-decoration:none;border-radius:8px;font-size:13px;font-weight:500;">
                <span style="font-size:16px;">🔍</span>
                <span class="app-navigation-entry__title">Menedżer Duplikatów</span>
            </a>
        `;

        li.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            this.openModal();
        });

        navList.appendChild(li);
    }

    openModal() {
        const existing = document.getElementById(this.modalId);
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = this.modalId;
        modal.innerHTML = `
            <div class="fe-modal-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);z-index:100000;display:flex;align-items:center;justify-content:center;animation:feFadeIn 0.2s ease;">
                <div class="fe-modal-box" style="background:var(--color-main-background,#fff);color:var(--color-main-text,#111);width:90%;max-width:820px;max-height:85vh;border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,0.3);display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--color-border,#e5e7eb);">
                    <!-- Header -->
                    <div style="padding:18px 24px;border-bottom:1px solid var(--color-border,#e5e7eb);display:flex;align-items:center;justify-content:space-between;background:var(--color-background-hover,#f9fafb);">
                        <div style="display:flex;align-items:center;gap:12px;">
                            <span style="font-size:24px;">🔍</span>
                            <div>
                                <h3 style="margin:0;font-size:17px;font-weight:700;">Wyszukiwarka i Menedżer Duplikatów</h3>
                                <p style="margin:2px 0 0;font-size:12px;opacity:0.75;">Wykrywaj identyczne pliki o tym samym rozmiarze i sumie kontrolnej, aby odzyskać miejsce na dysku</p>
                            </div>
                        </div>
                        <button class="fe-modal-close" style="background:none;border:none;font-size:22px;cursor:pointer;color:inherit;opacity:0.6;line-height:1;">&times;</button>
                    </div>

                    <!-- Filter Controls -->
                    <div style="padding:14px 24px;border-bottom:1px solid var(--color-border,#e5e7eb);display:flex;gap:16px;align-items:center;flex-wrap:wrap;background:var(--color-main-background,#fff);">
                        <label style="font-size:13px;display:flex;align-items:center;gap:8px;">
                            <span>Min. rozmiar:</span>
                            <select id="fe-dup-size-select" style="padding:6px 10px;border-radius:6px;border:1px solid var(--color-border,#ccc);background:inherit;color:inherit;">
                                <option value="1">Od 1 MB</option>
                                <option value="5" selected>Od 5 MB</option>
                                <option value="20">Od 20 MB</option>
                                <option value="50">Od 50 MB</option>
                                <option value="100">Od 100 MB</option>
                            </select>
                        </label>
                        <button id="fe-dup-scan-btn" class="button-primary" style="padding:6px 16px;border-radius:6px;background:var(--color-primary,#0082c9);color:#fff;border:none;cursor:pointer;font-weight:600;font-size:13px;">
                            Rozpocznij skanowanie
                        </button>
                        <div id="fe-dup-stats-summary" style="margin-left:auto;font-size:13px;font-weight:600;color:var(--color-primary,#0082c9);"></div>
                    </div>

                    <!-- Content List -->
                    <div id="fe-dup-results" style="padding:16px 24px;overflow-y:auto;flex:1;min-height:260px;">
                        <div style="text-align:center;padding:40px 20px;opacity:0.6;font-size:14px;">
                            Kliknij <strong>Rozpocznij skanowanie</strong>, aby przeszukać magazyn plików pod kątem duplikatów.
                        </div>
                    </div>

                    <!-- Footer Actions -->
                    <div style="padding:14px 24px;border-top:1px solid var(--color-border,#e5e7eb);display:flex;align-items:center;justify-content:space-between;background:var(--color-background-hover,#f9fafb);">
                        <button id="fe-dup-select-redundant" style="padding:7px 14px;border-radius:6px;background:none;border:1px solid var(--color-border,#ccc);color:inherit;cursor:pointer;font-size:12px;font-weight:600;" disabled>
                            Zaznacz starsze kopie (zostaw 1 oryginał)
                        </button>
                        <div style="display:flex;gap:10px;">
                            <button id="fe-dup-delete-btn" style="padding:7px 16px;border-radius:6px;background:#e53935;color:#fff;border:none;cursor:pointer;font-weight:600;font-size:13px;display:none;">
                                🗑️ Usuń zaznaczone kopie
                            </button>
                            <button class="fe-modal-close" style="padding:7px 16px;border-radius:6px;background:none;border:1px solid var(--color-border,#ccc);color:inherit;cursor:pointer;font-size:13px;">
                                Zamknij
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelectorAll('.fe-modal-close').forEach(b => {
            b.addEventListener('click', () => modal.remove());
        });

        const scanBtn = modal.querySelector('#fe-dup-scan-btn');
        const sizeSelect = modal.querySelector('#fe-dup-size-select');
        scanBtn.addEventListener('click', () => this.runScan(parseInt(sizeSelect.value, 10)));

        // Automatically trigger initial scan
        this.runScan(parseInt(sizeSelect.value, 10));
    }

    async runScan(minSizeMb) {
        const resultsEl = document.getElementById('fe-dup-results');
        const summaryEl = document.getElementById('fe-dup-stats-summary');
        const selectBtn = document.getElementById('fe-dup-select-redundant');
        const deleteBtn = document.getElementById('fe-dup-delete-btn');
        if (!resultsEl) return;

        resultsEl.innerHTML = `
            <div style="text-align:center;padding:50px 20px;">
                <div class="fe-spinner" style="display:inline-block;width:32px;height:32px;border:3px solid rgba(0,130,201,0.2);border-top-color:var(--color-primary,#0082c9);border-radius:50%;animation:feSpin 0.8s linear infinite;"></div>
                <p style="margin-top:14px;font-size:13px;opacity:0.8;">Skanowanie bazy danych w poszukiwaniu duplikatów...</p>
            </div>
        `;

        try {
            const url = `/apps/files_enhancer/api/v1/duplicates?minSizeMb=${minSizeMb}&limit=50`;
            const resp = await fetch(url, {
                headers: { 'requesttoken': (window.OC && window.OC.requestToken) || '' }
            });

            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();

            if (!data.groups || data.groups.length === 0) {
                resultsEl.innerHTML = `
                    <div style="text-align:center;padding:40px 20px;">
                        <span style="font-size:36px;">🎉</span>
                        <h4 style="margin:10px 0 6px;">Brak duplikatów!</h4>
                        <p style="margin:0;font-size:13px;opacity:0.7;">Nie znaleziono identycznych plików o rozmiarze powyżej ${minSizeMb} MB.</p>
                    </div>
                `;
                summaryEl.textContent = 'Brak duplikatów';
                selectBtn.disabled = true;
                deleteBtn.style.display = 'none';
                return;
            }

            const formattedWaste = this.formatBytes(data.totalWastedBytes || 0);
            summaryEl.textContent = `Można odzyskać: ${formattedWaste} (${data.totalGroups} grup)`;
            selectBtn.disabled = false;

            let html = '';
            data.groups.forEach((group, gIdx) => {
                const groupSize = this.formatBytes(group.size);
                const wasted = this.formatBytes(group.wastedBytes);

                html += `
                    <div class="fe-dup-group" style="margin-bottom:16px;border:1px solid var(--color-border,#e5e7eb);border-radius:10px;overflow:hidden;background:var(--color-main-background,#fff);">
                        <div style="padding:10px 14px;background:var(--color-background-hover,#f3f4f6);display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:600;">
                            <div>
                                <span style="color:var(--color-primary,#0082c9);">Grupa #${gIdx + 1}</span> &bull; 
                                Rozmiar pliku: <strong>${groupSize}</strong> (${group.count} kopie)
                            </div>
                            <span style="color:#d9534f;">Marnowane miejsce: ${wasted}</span>
                        </div>
                        <div style="padding:6px 14px;">
                `;

                group.sampleFiles.forEach((file, fIdx) => {
                    const dateStr = new Date(file.modified * 1000).toLocaleString();
                    const isOriginal = fIdx === 0;

                    html += `
                        <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--color-border-subtle,#f0f0f0);font-size:12px;">
                            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;flex:1;overflow:hidden;">
                                <input type="checkbox" class="fe-dup-check" data-path="${file.path}" data-fileid="${file.fileid}" ${!isOriginal ? 'data-redundant="true"' : ''} style="margin:0;">
                                <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                                    <span style="font-weight:600;">${file.name}</span>
                                    <span style="opacity:0.6;font-size:11px;margin-left:8px;">${file.path}</span>
                                </div>
                            </label>
                            <div style="display:flex;align-items:center;gap:10px;white-space:nowrap;margin-left:12px;">
                                <span style="opacity:0.6;font-size:11px;">${dateStr}</span>
                                ${isOriginal ? '<span style="background:#e0f2fe;color:#0284c7;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;">ORYGINAŁ</span>' : '<span style="background:#fee2e2;color:#dc2626;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;">KOPIA</span>'}
                            </div>
                        </div>
                    `;
                });

                html += `</div></div>`;
            });

            resultsEl.innerHTML = html;

            // Checkbox change listener
            resultsEl.querySelectorAll('.fe-dup-check').forEach(cb => {
                cb.addEventListener('change', () => this.updateDeleteButton());
            });

            // Redundant selector
            selectBtn.onclick = () => {
                resultsEl.querySelectorAll('.fe-dup-check').forEach(cb => {
                    cb.checked = cb.getAttribute('data-redundant') === 'true';
                });
                this.updateDeleteButton();
            };

            // Delete action
            deleteBtn.onclick = () => this.deleteSelected();

        } catch (err) {
            console.error('[DuplicateManager]', err);
            resultsEl.innerHTML = `
                <div style="text-align:center;padding:40px 20px;color:#d9534f;">
                    <p style="margin:0 0 6px;font-weight:700;">Błąd pobierania duplikatów</p>
                    <p style="margin:0;font-size:12px;opacity:0.8;">${err.message}</p>
                </div>
            `;
        }
    }

    updateDeleteButton() {
        const deleteBtn = document.getElementById('fe-dup-delete-btn');
        if (!deleteBtn) return;
        const checkedCount = document.querySelectorAll('.fe-dup-check:checked').length;
        if (checkedCount > 0) {
            deleteBtn.style.display = 'inline-block';
            deleteBtn.textContent = `🗑️ Usuń zaznaczone (${checkedCount})`;
        } else {
            deleteBtn.style.display = 'none';
        }
    }

    async deleteSelected() {
        const checked = Array.from(document.querySelectorAll('.fe-dup-check:checked'));
        if (checked.length === 0) return;

        if (!confirm(`Czy na pewno chcesz usunąć ${checked.length} plików-duplikatów? Trafią one do kosza.`)) {
            return;
        }

        const deleteBtn = document.getElementById('fe-dup-delete-btn');
        deleteBtn.disabled = true;
        deleteBtn.textContent = 'Usuwanie...';

        let deletedCount = 0;
        for (const cb of checked) {
            const rawPath = cb.getAttribute('data-path');
            const cleanPath = rawPath.replace(/^files\//, '');
            try {
                const davUrl = `${window.location.origin}/remote.php/dav/files/${window.OC?.currentUser || 'admin'}/${encodeURIComponent(cleanPath).replace(/%2F/g, '/')}`;
                const resp = await fetch(davUrl, {
                    method: 'DELETE',
                    headers: { 'requesttoken': (window.OC && window.OC.requestToken) || '' }
                });
                if (resp.ok || resp.status === 204) {
                    deletedCount++;
                    cb.closest('div').style.opacity = '0.3';
                    cb.disabled = true;
                }
            } catch (e) {
                console.warn('[DuplicateManager] Failed to delete file:', rawPath, e);
            }
        }

        alert(`Usunięto pomyślnie ${deletedCount} z ${checked.length} plików.`);
        const sizeSelect = document.getElementById('fe-dup-size-select');
        this.runScan(parseInt(sizeSelect.value, 10));

        // Refresh Nextcloud file list if open
        if (window.OCA?.Files?.App?.fileList) {
            window.OCA.Files.App.fileList.reload();
        }
    }

    formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
