/**
 * Vant browser utils polyfill
 * Fixes Vant's browser detection that fails when navigator is undefined
 * This must be loaded before Vant is imported
 */

// Ensure navigator exists
if (typeof navigator === 'undefined') {
    globalThis.navigator = {
        userAgent: '',
        platform: '',
        language: 'zh-CN',
        languages: ['zh-CN'],
        onLine: true,
        cookieEnabled: true,
        vendor: '',
        appVersion: '',
        appName: '',
        product: '',
        productSub: '',
        hardwareConcurrency: 4,
    };
}

// Ensure window exists
if (typeof window === 'undefined') {
    globalThis.window = globalThis;
}

// Create browser detection helpers that Vant expects
if (!window._android) {
    window._android = false;
}

if (!window._ios) {
    window._ios = false;
}

// Detect actual platform
try {
    const ua = navigator.userAgent.toLowerCase();
    window._android = /android/.test(ua);
    window._ios = /iphone|ipad|ipod/.test(ua);
} catch (e) {
    // Fallback to false
    window._android = false;
    window._ios = false;
}

export default {
    isAndroid: window._android,
    isIOS: window._ios,
};
