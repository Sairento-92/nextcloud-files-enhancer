/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Implements Nextcloud Issue #56519:
 * Secure Vault Folder with separate PIN / Password protection.
 */

export class SecureVault {
    constructor() {
        this.vaultKey = 'fe_secure_vaults';
        this.unlockedVaults = new Set();
        this.init();
    }

    init() {
        this.registerAction();
        this.observeNavigation();
    }

    getVaults() {
        try {
            return JSON.parse(localStorage.getItem(this.vaultKey) || '{}');
        } catch {
            return {};
        }
    }

    saveVault(path, hash) {
        const vaults = this.getVaults();
        vaults[path] = hash;
        localStorage.setItem(this.vaultKey, JSON.stringify(vaults));
    }

    removeVault(path) {
        const vaults = this.getVaults();
        delete vaults[path];
        localStorage.setItem(this.vaultKey, JSON.stringify(vaults));
    }

    registerAction() {
        if (!window.OCA || !window.OCA.Files || !window.OCA.Files.fileActions) return;

        window.OCA.Files.fileActions.registerAction({
            name: 'FilesEnhancerSecureVault',
            displayName: '🔒 Zabezpiecz hasłem (Sejf)',
            mime: 'dir',
            permissions: OC.PERMISSION_READ,
            iconClass: 'icon-password',
            actionHandler: (folderName) => {
                const currentDir = (window.OCA && window.OCA.Files && window.OCA.Files.App && window.OCA.Files.App.fileList)
                    ? window.OCA.Files.App.fileList.getCurrentDirectory()
                    : '/';
                const path = (currentDir === '/' ? '' : currentDir) + '/' + folderName;
                this.setupVaultDialog(path, folderName);
            }
        });
    }

    setupVaultDialog(path, folderName) {
        const vaults = this.getVaults();
        const isLocked = !!vaults[path];

        if (isLocked) {
            const pass = prompt(`Folder „${folderName}” jest już zabezpieczony sejfem.\nPodaj obecne hasło, aby zdjąć blokadę:`);
            if (pass && btoa(pass) === vaults[path]) {
                this.removeVault(path);
                this.unlockedVaults.delete(path);
                OC.Notification.showTemporary('✓ Usunięto zabezpieczenie sejfu dla folderu ' + folderName);
            } else if (pass) {
                alert('Niepoprawne hasło!');
            }
            return;
        }

        const newPass = prompt(`Ustaw hasło dostępu / PIN do sejfu dla folderu „${folderName}”:`);
        if (!newPass || newPass.trim() === '') return;

        this.saveVault(path, btoa(newPass));
        this.unlockedVaults.add(path);
        OC.Notification.showTemporary('🔒 Folder został zabezpieczony jako prywatny sejf.');
    }

    observeNavigation() {
        setInterval(() => {
            const currentDir = (window.OCA && window.OCA.Files && window.OCA.Files.App && window.OCA.Files.App.fileList)
                ? window.OCA.Files.App.fileList.getCurrentDirectory()
                : '/';

            const vaults = this.getVaults();
            if (vaults[currentDir] && !this.unlockedVaults.has(currentDir)) {
                this.lockView(currentDir, vaults[currentDir]);
            }
        }, 300);
    }

    lockView(dirPath, expectedHash) {
        const targetView = document.querySelector('#filestable, .files-list-view');
        if (!targetView || targetView.classList.contains('fe-vault-locked')) return;

        targetView.classList.add('fe-vault-locked');
        targetView.style.filter = 'blur(12px)';
        targetView.style.pointerEvents = 'none';

        const pass = prompt(`🔒 Ten folder jest prywatnym sejfem.\nWprowadź hasło, aby odblokować zawartość:`);
        if (pass && btoa(pass) === expectedHash) {
            this.unlockedVaults.add(dirPath);
            targetView.classList.remove('fe-vault-locked');
            targetView.style.filter = '';
            targetView.style.pointerEvents = '';
            OC.Notification.showTemporary('✓ Sejf odblokowany');
        } else {
            alert('Niepoprawne hasło! Następuje powrót do folderu nadrzędnego.');
            history.back();
        }
    }
}
