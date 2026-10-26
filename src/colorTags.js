/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export class ColorTags {
    constructor() {
        this.tags = {}; // fileId -> colorHex
        this.colors = [
            { name: 'Czerwony', hex: '#eb4d4b' },
            { name: 'Pomarańczowy', hex: '#f0932b' },
            { name: 'Żółty', hex: '#f6e58d' },
            { name: 'Zielony', hex: '#6ab04c' },
            { name: 'Niebieski', hex: '#22a6b3' },
            { name: 'Fioletowy', hex: '#be2edd' },
            { name: 'Brak', hex: 'none' }
        ];
        this.init();
    }

    init() {
        this.loadTags();
        this.registerAction();
        this.observeDOM();
    }

    loadTags() {
        fetch(OC.generateUrl('/apps/files_enhancer/api/v1/tags'), {
            headers: { 'requesttoken': OC.requestToken }
        })
        .then(res => res.json())
        .then(data => {
            if (data.tags) {
                this.tags = data.tags;
                this.applyTagsToDOM();
            }
        })
        .catch(() => {});
    }

    registerAction() {
        if (!window.OCA || !window.OCA.Files || !window.OCA.Files.fileActions) return;

        window.OCA.Files.fileActions.registerAction({
            name: 'FilesEnhancerColorTag',
            displayName: '🏷️ Etykieta koloru',
            mime: 'all',
            permissions: OC.PERMISSION_READ,
            iconClass: 'icon-tag',
            actionHandler: (fileName, context) => {
                const fileId = context?.$file?.attr('data-id') || context?.fileInfoModel?.get('id');
                if (fileId) {
                    this.showTagPicker(fileId, fileName, context?.$file?.[0] || context?.target);
                }
            }
        });
    }

    showTagPicker(fileId, fileName, targetElement) {
        // Remove existing popups
        document.querySelectorAll('.fe-tag-picker-popup').forEach(p => p.remove());

        const popup = document.createElement('div');
        popup.className = 'fe-tag-picker-popup';
        popup.innerHTML = `
            <div class="fe-tag-picker-title">Wybierz kolor etykiety dla: <b>${this.escapeHtml(fileName)}</b></div>
            <div class="fe-tag-picker-colors">
                ${this.colors.map(c => `
                    <button class="fe-tag-btn" data-color="${c.hex}" title="${c.name}" style="background-color: ${c.hex === 'none' ? 'transparent' : c.hex};">
                        ${c.hex === 'none' ? '✕' : ''}
                    </button>
                `).join('')}
            </div>
        `;

        document.body.appendChild(popup);

        // Position popup near target or center
        if (targetElement) {
            const rect = targetElement.getBoundingClientRect();
            popup.style.top = Math.min(window.innerHeight - 150, rect.bottom + window.scrollY + 8) + 'px';
            popup.style.left = Math.min(window.innerWidth - 260, rect.left + window.scrollX) + 'px';
        } else {
            popup.style.top = '30%';
            popup.style.left = '50%';
            popup.style.transform = 'translate(-50%, -50%)';
        }

        popup.querySelectorAll('.fe-tag-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const color = btn.getAttribute('data-color');
                this.setTag(fileId, color);
                popup.remove();
            });
        });

        const closeHandler = (e) => {
            if (!popup.contains(e.target)) {
                popup.remove();
                document.removeEventListener('click', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 10);
    }

    setTag(fileId, color) {
        if (color === 'none') {
            delete this.tags[fileId];
        } else {
            this.tags[fileId] = color;
        }
        this.applyTagsToDOM();

        fetch(OC.generateUrl('/apps/files_enhancer/api/v1/tags'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'requesttoken': OC.requestToken
            },
            body: JSON.stringify({ fileId, color })
        }).catch(() => {});
    }

    applyTagsToDOM() {
        const rows = document.querySelectorAll('tr[data-id], [data-entry-id]');
        rows.forEach(row => {
            const fileId = row.getAttribute('data-id') || row.getAttribute('data-entry-id');
            const color = this.tags[fileId];
            let dot = row.querySelector('.fe-color-tag-dot');

            if (color && color !== 'none') {
                if (!dot) {
                    dot = document.createElement('span');
                    dot.className = 'fe-color-tag-dot';
                    const nameContainer = row.querySelector('.nametext, .innernametext, .file-name');
                    if (nameContainer) {
                        nameContainer.prepend(dot);
                    }
                }
                dot.style.backgroundColor = color;
                dot.title = 'Etykieta koloru';
            } else if (dot) {
                dot.remove();
            }
        });
    }

    observeDOM() {
        const observer = new MutationObserver(() => {
            this.applyTagsToDOM();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }
}
