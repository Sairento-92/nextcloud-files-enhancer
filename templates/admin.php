<?php
/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/** @var array $_ */
?>
<div id="files-enhancer-admin" class="section">
    <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px;">
        <div style="background: linear-gradient(135deg, #0082c9 0%, #1cafff 100%); width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0, 130, 201, 0.3);">
            <span class="icon-folder" style="filter: brightness(0) invert(1); font-size: 24px;">📁</span>
        </div>
        <div>
            <h2 class="app-name" style="margin: 0; font-size: 20px; font-weight: 700;">Files Enhancer (by Sairento)</h2>
            <p class="text-muted" style="margin: 4px 0 0 0; font-size: 13px;">Ulepszenia Nextcloud Files: QuickLook (podgląd spacją), rozpakowywanie zip na serwerze, hurtowa zmiana nazw, kolorowe etykiety i narzędzia OCC</p>
        </div>
    </div>

    <!-- Storage Overview Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div style="background: var(--color-main-background-translucent, rgba(0,0,0,0.03)); border: 1px solid var(--color-border); border-radius: 10px; padding: 16px;">
            <div style="font-size: 12px; color: var(--color-text-maxcontrast); text-transform: uppercase; font-weight: 600;">Pliki w chmurze</div>
            <div style="font-size: 24px; font-weight: bold; margin-top: 6px;"><?= number_format($_['stats']['totalFiles'] ?? 0) ?></div>
        </div>
        <div style="background: var(--color-main-background-translucent, rgba(0,0,0,0.03)); border: 1px solid var(--color-border); border-radius: 10px; padding: 16px;">
            <div style="font-size: 12px; color: var(--color-text-maxcontrast); text-transform: uppercase; font-weight: 600;">Katalogi</div>
            <div style="font-size: 24px; font-weight: bold; margin-top: 6px;"><?= number_format($_['stats']['totalFolders'] ?? 0) ?></div>
        </div>
        <div style="background: var(--color-main-background-translucent, rgba(0,0,0,0.03)); border: 1px solid var(--color-border); border-radius: 10px; padding: 16px;">
            <div style="font-size: 12px; color: var(--color-text-maxcontrast); text-transform: uppercase; font-weight: 600;">Zajęta przestrzeń</div>
            <div style="font-size: 24px; font-weight: bold; margin-top: 6px;">
                <?php
                    $bytes = (float)($_['stats']['totalBytes'] ?? 0);
                    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
                    for ($i = 0; $bytes >= 1024 && $i < 4; $i++) $bytes /= 1024;
                    echo round($bytes, 2) . ' ' . $units[$i];
                ?>
            </div>
        </div>
    </div>

    <!-- Active Modules Configuration -->
    <div style="background: var(--color-main-background); border: 1px solid var(--color-border); border-radius: 10px; padding: 20px; margin-bottom: 24px;">
        <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 16px; font-weight: 600;">Aktywne moduły rozszerzenia</h3>
        
        <div style="display: flex; flex-direction: column; gap: 14px;">
            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" id="fe-opt-quicklook" <?= ($_['enableQuicklook'] ?? true) ? 'checked' : '' ?> />
                <div>
                    <span style="font-weight: 600;">⚡ QuickLook (Podgląd Spacją)</span>
                    <div style="font-size: 12px; color: var(--color-text-maxcontrast);">Naciśnięcie spacji na zaznaczonym pliku otwiera błyskawiczny podgląd (obrazy, filmy, audio, PDF, kod z kolorowaniem).</div>
                </div>
            </label>

            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" id="fe-opt-archives" <?= ($_['enableArchiveOps'] ?? true) ? 'checked' : '' ?> />
                <div>
                    <span style="font-weight: 600;">📦 Server-side Archive Manager (Rozpakuj / Spakuj ZIP)</span>
                    <div style="font-size: 12px; color: var(--color-text-maxcontrast);">Umożliwia rozpakowywanie plików ZIP/TAR.GZ oraz tworzenie archiwów ZIP bezpośrednio na serwerze.</div>
                </div>
            </label>

            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" id="fe-opt-tags" <?= ($_['enableColorTags'] ?? true) ? 'checked' : '' ?> />
                <div>
                    <span style="font-weight: 600;">🏷️ Kolorowe etykiety (Color Tags jak w macOS Finder)</span>
                    <div style="font-size: 12px; color: var(--color-text-maxcontrast);">Oznaczanie plików i folderów kolorowymi punktami dla szybkiej kategoryzacji wizualnej.</div>
                </div>
            </label>

            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" id="fe-opt-rename" <?= ($_['enableBatchRename'] ?? true) ? 'checked' : '' ?> />
                <div>
                    <span style="font-weight: 600;">🔤 Hurtowa zmiana nazw (Batch Renamer)</span>
                    <div style="font-size: 12px; color: var(--color-text-maxcontrast);">Masowa zmiana nazw wielu zaznaczonych plików jednocześnie (prefiks, sufiks, zamiana tekstu, numeracja).</div>
                </div>
            </label>

            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" id="fe-opt-hashes" <?= ($_['enableChecksums'] ?? true) ? 'checked' : '' ?> />
                <div>
                    <span style="font-weight: 600;">🔍 Kalkulator Sum Kontrolnych (MD5, SHA-1, SHA-256)</span>
                    <div style="font-size: 12px; color: var(--color-text-maxcontrast);">Generowanie i porównywanie sum kontrolnych w menu kontekstowym pliku.</div>
                </div>
            </label>

            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" id="fe-opt-sizes" <?= ($_['enableFolderSizes'] ?? true) ? 'checked' : '' ?> />
                <div>
                    <span style="font-weight: 600;">📐 Kalkulator rozmiaru folderów w locie</span>
                    <div style="font-size: 12px; color: var(--color-text-maxcontrast);">Szybkie obliczanie łącznego rozmiaru folderu i liczby zagnieżdżonych plików z menu akcji.</div>
                </div>
            </label>
        </div>

        <div style="margin-top: 20px;">
            <button id="fe-save-btn" class="button primary" style="padding: 8px 18px; font-weight: 600;">Zapisz ustawienia</button>
            <span id="fe-save-status" style="margin-left: 12px; font-size: 13px; color: var(--color-success); display: none;">✓ Ustawienia zostały pomyślnie zapisane</span>
        </div>
    </div>

    <!-- OCC Console Commands Reference -->
    <div style="background: var(--color-main-background); border: 1px solid var(--color-border); border-radius: 10px; padding: 20px;">
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 16px; font-weight: 600;">Dostępne polecenia konsoli OCC</h3>
        <p class="text-muted" style="font-size: 13px; margin-bottom: 14px;">Administratorzy mogą uruchamiać poniższe komendy przez CLI (np. przez SSH lub harmonogram cron):</p>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
                <tr style="border-bottom: 1px solid var(--color-border); text-align: left;">
                    <th style="padding: 8px;">Polecenie OCC</th>
                    <th style="padding: 8px;">Opis działania</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom: 1px solid var(--color-border-maxcontrast, rgba(0,0,0,0.05));">
                    <td style="padding: 8px;"><code>php occ files:enhancer:duplicates</code></td>
                    <td style="padding: 8px;">Wykrywa zduplikowane pliki w całej chmurze na podstawie rozmiarów i hashy.</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--color-border-maxcontrast, rgba(0,0,0,0.05));">
                    <td style="padding: 8px;"><code>php occ files:enhancer:scan-deep</code></td>
                    <td style="padding: 8px;">Głębokie skanowanie naprawiające uszkodzone wpisy w cache i magazynie.</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--color-border-maxcontrast, rgba(0,0,0,0.05));">
                    <td style="padding: 8px;"><code>php occ files:enhancer:stats</code></td>
                    <td style="padding: 8px;">Zestawienie analityczne magazynu z podziałem na typy multimediów.</td>
                </tr>
                <tr>
                    <td style="padding: 8px;"><code>php occ files:enhancer:cleanup-trash</code></td>
                    <td style="padding: 8px;">Czyści kosz i stare wersje starsze niż określona liczba dni.</td>
                </tr>
            </tbody>
        </table>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    var saveBtn = document.getElementById('fe-save-btn');
    if (!saveBtn) return;

    saveBtn.addEventListener('click', function() {
        var settings = {
            enable_quicklook: document.getElementById('fe-opt-quicklook').checked ? 'yes' : 'no',
            enable_archive_ops: document.getElementById('fe-opt-archives').checked ? 'yes' : 'no',
            enable_color_tags: document.getElementById('fe-opt-tags').checked ? 'yes' : 'no',
            enable_batch_rename: document.getElementById('fe-opt-rename').checked ? 'yes' : 'no',
            enable_checksums: document.getElementById('fe-opt-hashes').checked ? 'yes' : 'no',
            enable_folder_sizes: document.getElementById('fe-opt-sizes').checked ? 'yes' : 'no'
        };

        saveBtn.disabled = true;
        saveBtn.innerText = 'Zapisywanie...';

        fetch(OC.generateUrl('/apps/files_enhancer/api/v1/admin/settings'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'requesttoken': OC.requestToken
            },
            body: JSON.stringify(settings)
        })
        .then(function(res) { return res.json(); })
        .then(function() {
            saveBtn.disabled = false;
            saveBtn.innerText = 'Zapisz ustawienia';
            var status = document.getElementById('fe-save-status');
            status.style.display = 'inline';
            setTimeout(function() { status.style.display = 'none'; }, 4000);
        })
        .catch(function(err) {
            saveBtn.disabled = false;
            saveBtn.innerText = 'Zapisz ustawienia';
            alert('Błąd podczas zapisywania ustawień: ' + err);
        });
    });
});
</script>
