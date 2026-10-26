/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Implements Nextcloud Issue #58407:
 * Password / PIN-protected Trash Bin deletion and emptying.
 */

export class TrashGuard {
    constructor() {
        this.storageKey = 'fe_trash_guard_pin';
        this.unlockedSession = false;
        this.init();
    }

    init() {
        this.interceptEmptyTrash();
        this.interceptTrashRowDelete();
        this.injectTrashGuardBadge();
    }

    getPin() {
        return localStorage.getItem(this.storageKey) || '';
    }

    setPin(newPin) {
        if (!newPin || newPin.trim() === '') {
            localStorage.removeItem(this.storageKey);
        } else {
            localStorage.setItem(this.storageKey, btoa(newPin));
        }
    }

    isProtected() {
        return !!this.getPin();
    }

    verifyPin(promptText) {
        if (!this.isProtected()) return true;
        if (this.unlockedSession) return true;

        const entered = prompt(promptText || '🔒 Kosz jest chroniony hasłem.\nPodaj PIN/hasło dostępu do kosza:');
        if (!entered) return false;

        if (btoa(entered) === this.getPin()) {
            this.unlockedSession = true;
            // Re-lock after 10 minutes
            setTimeout(() => { this.unlockedSession = false; }, 600000);
            return true;
        }

        alert('❌ Błędny PIN/hasło! Operacja usunięcia z kosza została zablokowana.');
        return false;
    }

    interceptEmptyTrash() {
        document.addEventListener('click', (e) => {
            const emptyBtn = e.target.closest('#emptycontent button, .emptycontent button, [data-action="empty-trash"], .trash-bin-empty-btn, button[class*="empty"]');
            if (!emptyBtn) return;

            const isTrashView = window.location.href.includes('trash') || window.location.hash.includes('trash');
            if (!isTrashView) return;

            if (this.isProtected()) {
                if (!this.verifyPin('⚠️ OSTRZEŻENIE: Trwałe opróżnianie kosza!\nPodaj PIN autoryzacyjny, aby trwale usunąć pliki:')) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
            }
        }, true);
    }

    interceptTrashRowDelete() {
        document.addEventListener('click', (e) => {
            const isTrashView = window.location.href.includes('trash') || window.location.hash.includes('trash');
            if (!isTrashView) return;

            const deleteAction = e.target.closest('[data-action="delete"], .action-delete, .fe-quick-delete');
            if (!deleteAction) return;

            if (this.isProtected() && !this.unlockedSession) {
                if (!this.verifyPin('🔒 Potwierdź trwałe usunięcie wybranego elementu z kosza:')) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
            }
        }, true);
    }

    injectTrashGuardBadge() {
        const checkView = () => {
            const isTrashView = window.location.href.includes('trash') || window.location.hash.includes('trash');
            const navTrash = document.querySelector('#app-navigation a[href*="trashbin"], a[key="trashbin"]');
            
            if (navTrash && !document.getElementById('fe-trash-pin-btn')) {
                const btn = document.createElement('button');
                btn.id = 'fe-trash-pin-btn';
                btn.className = 'fe-trash-pin-toggle';
                btn.title = this.isProtected() ? 'Kosz chroniony hasłem (kliknij, aby zmienić/zdjąć)' : 'Ustaw hasło/PIN ochrony kosza';
                btn.textContent = this.isProtected() ? '🔒 Kosz [PIN]' : '🔓 Zabezpiecz kosz';
                btn.addEventListener('click', (ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    this.managePinDialog();
                });
                navTrash.parentNode.insertBefore(btn, navTrash.nextSibling);
            }
        };

        setInterval(checkView, 1000);
    }

    managePinDialog() {
        if (this.isProtected()) {
            const current = prompt('Podaj obecny PIN/hasło ochrony kosza:');
            if (btoa(current) !== this.getPin()) {
                alert('Niepoprawny PIN!');
                return;
            }
            const action = confirm('Kosz jest obecnie zabezpieczony.\nKliknij OK, aby USUNĄĆ PIN, lub Anuluj, aby zmienić PIN.');
            if (action) {
                this.setPin('');
                OC.Notification.showTemporary('🔓 Usunięto blokadę PIN dla kosza.');
            } else {
                const newPin = prompt('Podaj nowy PIN/hasło ochrony kosza:');
                if (newPin && newPin.trim()) {
                    this.setPin(newPin);
                    OC.Notification.showTemporary('🔒 Zaktualizowano PIN ochrony kosza.');
                }
            }
        } else {
            const newPin = prompt('Podaj nowy PIN/hasło do ochrony operacji w koszu (opróżnianie i trwałe usuwanie):');
            if (newPin && newPin.trim()) {
                this.setPin(newPin);
                OC.Notification.showTemporary('🔒 Kosz został zabezpieczony kodem PIN.');
            }
        }
    }
}
