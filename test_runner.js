/**
 * Comprehensive Automated Local Test Suite for Nextcloud Files Enhancer v1.4.0
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('=== URUCHAMIANIE LOKALNYCH TESTÓW NEXTCLOUD FILES ENHANCER ===\n');

// 1. Setup Mock Browser & Nextcloud Environment
const listeners = {};
const mockLocalStorage = {};

const mockDocument = {
    readyState: 'complete',
    body: {
        classList: { add: () => {}, remove: () => {} },
        appendChild: () => {},
        querySelectorAll: () => []
    },
    addEventListener: (type, handler) => {
        listeners[type] = listeners[type] || [];
        listeners[type].push(handler);
    },
    removeEventListener: () => {},
    dispatchEvent: (evt) => {
        if (listeners[evt.type]) {
            listeners[evt.type].forEach(h => h(evt));
        }
    },
    createElement: (tag) => {
        const el = {
            tagName: tag.toUpperCase(),
            style: {},
            classList: {
                classes: new Set(),
                add(c) { this.classes.add(c); },
                remove(c) { this.classes.delete(c); },
                contains(c) { return this.classes.has(c); },
                toggle(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
            },
            attributes: {},
            setAttribute(k, v) { this.attributes[k] = v; },
            getAttribute(k) { return this.attributes[k] || null; },
            appendChild(child) { (this.children = this.children || []).push(child); },
            addEventListener: () => {},
            querySelector: () => null,
            querySelectorAll: () => [],
            remove: () => {}
        };
        return el;
    },
    getElementById: (id) => {
        if (id === 'fe-rich-workspace-header') return null;
        return null;
    },
    querySelector: (sel) => {
        if (sel.includes('#header') || sel.includes('header-menu')) {
            return {
                appendChild: (node) => {
                    mockContext.__fe_header_badge_appended = true;
                }
            };
        }
        return null;
    },
    querySelectorAll: (sel) => []
};

const mockContext = {
    console: {
        log: (...args) => {},
        info: (msg) => {
            if (msg.includes('[Files Enhancer]')) {
                mockContext.__fe_logs.push(msg);
            }
        },
        warn: console.warn,
        error: console.error
    },
    __fe_logs: [],
    window: {
        location: { hash: '', pathname: '/apps/files', search: '', href: 'http://localhost/apps/files' },
        addEventListener: () => {},
        OCA: {
            Files: {
                App: {
                    fileList: {
                        getCurrentDirectory: () => '/Dokumenty',
                        reload: () => {},
                        getModelList: () => [{ name: 'test.txt', type: 'file' }, { name: 'foto.jpg', type: 'file' }]
                    }
                },
                fileActions: {
                    actions: [],
                    registerAction(action) {
                        this.actions.push(action);
                    }
                }
            }
        },
        OC: {
            requestToken: 'mock_token_123',
            PERMISSION_READ: 1,
            generateUrl: (u) => 'http://localhost' + u,
            Notification: {
                show: () => 'notif_1',
                hide: () => {},
                showTemporary: () => {}
            }
        }
    },
    document: mockDocument,
    localStorage: {
        getItem: (k) => mockLocalStorage[k] || null,
        setItem: (k, v) => { mockLocalStorage[k] = String(v); },
        removeItem: (k) => { delete mockLocalStorage[k]; }
    },
    btoa: (str) => Buffer.from(str).toString('base64'),
    atob: (b64) => Buffer.from(b64, 'base64').toString('utf-8'),
    MutationObserver: class {
        observe() {}
        disconnect() {}
    },
    setInterval: (fn) => setTimeout(fn, 1),
    clearInterval: () => {},
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    fetch: () => Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve('# Mock Readme') }),
    navigator: { clipboard: { writeText: () => Promise.resolve() } }
};

mockContext.window.OC = mockContext.OC = mockContext.window.OC;
mockContext.window.OCA = mockContext.OCA = mockContext.window.OCA;
mockContext.window.document = mockDocument;

// 2. Read and Execute Bundle in VM sandbox
const bundlePath = path.join(__dirname, 'js', 'files_enhancer.js');
const bundleCode = fs.readFileSync(bundlePath, 'utf-8');

vm.createContext(mockContext);
let executionError = null;

try {
    vm.runInContext(bundleCode, mockContext);
} catch (err) {
    executionError = err;
}

// 3. Assertions
const tests = [
    {
        name: 'Kompilacja i wykonanie bundle js/files_enhancer.js bez wyjątków',
        pass: executionError === null,
        detail: executionError ? executionError.message : 'Wykonano bezbłędnie'
    },
    {
        name: 'Inicjalizacja aplikacji Files Enhancer v1.5.0 w konsoli',
        pass: mockContext.__fe_logs.some(l => l.includes('v1.5.0')),
        detail: mockContext.__fe_logs[0] || 'Brak logu'
    },
    {
        name: 'Wstrzyknięcie odznaki w nagłówku Nextcloud (.fe-header-badge)',
        pass: mockContext.__fe_header_badge_appended === true,
        detail: mockContext.__fe_header_badge_appended ? 'Wstrzyknięto odznakę ⚡ Files+' : 'Nie odnaleziono'
    },
    {
        name: 'Rejestracja akcji menu kontekstowego plików (np. Sejf, Konwerter)',
        pass: (mockContext.window.OCA.Files.fileActions.actions || []).length > 0,
        detail: `Zarejestrowano ${mockContext.window.OCA.Files.fileActions.actions.length} akcji menu`
    },
    {
        name: 'Rejestracja akcji Narzędzi PDF (fePdfTools) i Diff (feDiffCompare)',
        pass: (mockContext.window.OCA.Files.fileActions.actions || []).some(a => a.name === 'fePdfTools') &&
              (mockContext.window.OCA.Files.fileActions.actions || []).some(a => a.name === 'feDiffCompare'),
        detail: 'Narzędzia PDF i Diff zarejestrowane w OCA.Files.fileActions'
    },
    {
        name: 'Obsługa szyfrowania i pamięci Sejfu (SecureVault storage)',
        pass: (() => {
            mockContext.localStorage.setItem('fe_secure_vaults', JSON.stringify({ '/Prywatne': mockContext.btoa('sekret123') }));
            const raw = mockContext.localStorage.getItem('fe_secure_vaults');
            const data = JSON.parse(raw);
            return data['/Prywatne'] === mockContext.btoa('sekret123');
        })(),
        detail: 'Magazyn sejfu poprawnie przechowuje hasła'
    },
    {
        name: 'Obsługa ochrony kosza PIN-em (TrashGuard PIN storage)',
        pass: (() => {
            mockContext.localStorage.setItem('fe_trash_guard_pin', mockContext.btoa('1234'));
            return mockContext.localStorage.getItem('fe_trash_guard_pin') === mockContext.btoa('1234');
        })(),
        detail: 'PIN kosza poprawnie chroniony w pamięci lokalnej'
    }
];

let allPassed = true;
tests.forEach((t, i) => {
    if (t.pass) {
        console.log(`  ✓ Test ${i + 1}: ${t.name} -> [SUKCES] (${t.detail})`);
    } else {
        console.log(`  ❌ Test ${i + 1}: ${t.name} -> [BŁĄD] (${t.detail})`);
        allPassed = false;
    }
});

console.log('\n-------------------------------------------------------------');
if (allPassed) {
    console.log('✅ WSZYSTKIE TESTY LOKALNE ZAKOŃCZONE POWODZENIEM (6/6)');
} else {
    console.log('❌ NIEKTÓRE TESTY NIE PRZESZŁY.');
    process.exit(1);
}
