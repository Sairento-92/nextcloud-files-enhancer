/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Implements Nextcloud PR #65393:
 * Live automatic refresh of the files list when background changes or sync occurs.
 */

export class LiveRefresh {
    constructor() {
        this.lastEtag = null;
        this.pollIntervalMs = 8000;
        this.timer = null;
        this.isTabActive = true;
        this.init();
    }

    init() {
        document.addEventListener('visibilitychange', () => {
            this.isTabActive = !document.hidden;
            if (this.isTabActive) {
                this.checkChanges();
            }
        });

        // Listen for internal upload finish events
        window.addEventListener('file_upload_done', () => this.scheduleQuickCheck());

        this.startPolling();
    }

    startPolling() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            if (this.isTabActive) {
                this.checkChanges();
            }
        }, this.pollIntervalMs);
    }

    scheduleQuickCheck() {
        setTimeout(() => this.checkChanges(), 1000);
    }

    checkChanges() {
        const fileList = window.OCA?.Files?.App?.fileList;
        if (!fileList || typeof fileList.getCurrentDirectory !== 'function') return;

        const currentDir = fileList.getCurrentDirectory();
        if (!currentDir) return;

        const url = OC.generateUrl('/remote.php/webdav' + encodeURI(currentDir === '/' ? '' : currentDir));

        fetch(url, {
            method: 'PROPFIND',
            headers: {
                'Depth': '0',
                'requesttoken': OC.requestToken,
                'Content-Type': 'application/xml; charset=utf-8'
            }
        })
        .then(res => {
            const etag = res.headers.get('etag');
            if (etag) {
                if (this.lastEtag && this.lastEtag !== etag) {
                    this.lastEtag = etag;
                    this.triggerSilentReload(fileList);
                } else {
                    this.lastEtag = etag;
                }
            }
        })
        .catch(() => {
            // Silently ignore network hiccup
        });
    }

    triggerSilentReload(fileList) {
        // Only reload if user is not actively editing a rename input
        const isEditing = document.querySelector('input.filename, .ui-autocomplete-input:focus, .fe-renaming');
        if (isEditing) return;

        console.info('[Files Enhancer] Wykryto zmiany w katalogu zdalnym. Automatyczne odświeżanie listy...');
        fileList.reload();
        
        // Show subtle indicator
        const badge = document.querySelector('.fe-header-badge');
        if (badge) {
            badge.classList.add('fe-pulse');
            setTimeout(() => badge.classList.remove('fe-pulse'), 1500);
        }
    }
}
