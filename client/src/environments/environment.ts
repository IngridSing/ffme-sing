// ========================================
// CONFIGURATION DÉVELOPPEMENT
// ========================================
// Détection automatique au RUNTIME: localhost/127.0.0.1 → dev API (même origine), sinon → prod API

function getHostname(): string {
    if (typeof window === 'undefined') return '';
    return window.location.hostname;
}

function isLocal(): boolean {
    const hostname = getHostname();
    return hostname === 'localhost' || hostname === '127.0.0.1';
}

export const environment = {
    get production() {
        return !isLocal();
    },
    get serverUrl() {
        const hostname = getHostname();
        if (hostname === 'localhost') return 'http://localhost:3000/api';
        if (hostname === '127.0.0.1') return 'http://127.0.0.1:3000/api';
        return 'https://api.fondationfrancoismeye.ga/api';
    },
    domains: {
        get api() {
            const hostname = getHostname();
            if (hostname === 'localhost') return 'localhost';
            if (hostname === '127.0.0.1') return '127.0.0.1';
            return 'api.fondationfrancoismeye.ga';
        },
        get frontend() {
            const hostname = getHostname();
            if (hostname === 'localhost') return 'localhost';
            if (hostname === '127.0.0.1') return '127.0.0.1';
            return 'fondationfrancoismeye.ga';
        },
    },
};
