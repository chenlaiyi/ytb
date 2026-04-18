/**
 * Fix Vant's browser detection issue at build time
 * Patches the Vant utils/basic module to handle undefined navigator
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const vantUtilsPath = resolve('node_modules/vant/es/utils/basic.mjs');
const vantUtilsCjsPath = resolve('node_modules/vant/lib/utils/basic.js');

function patchFile(filePath, fileType) {
    if (!existsSync(filePath)) {
        console.log(`[fix-vant-browser] ${fileType} not found:`, filePath);
        return;
    }

    let content = readFileSync(filePath, 'utf8');

    // Check if already patched
    if (content.includes('// PATCHED: navigator safety check')) {
        console.log(`[fix-vant-browser] ${fileType} already patched`);
        return;
    }

    // Fix the navigator access issue
    // Original: const ua = navigator.userAgent.toLowerCase();
    // With safety: const ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent.toLowerCase() : '';

    content = content.replace(
        /const\s+ua\s*=\s*navigator\.userAgent\.toLowerCase\(\);?/g,
        "// PATCHED: navigator safety check\nconst ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent.toLowerCase() : '';"
    );

    // Also fix any direct navigator.userAgent access
    content = content.replace(
        /navigator\.userAgent/g,
        "((typeof navigator !== 'undefined' && navigator) ? navigator.userAgent : '')"
    );

    writeFileSync(filePath, content, 'utf8');
    console.log(`[fix-vant-browser] patched ${fileType}:`, filePath);
}

// Patch both ESM and CJS versions
patchFile(vantUtilsPath, 'ESM');
patchFile(vantUtilsCjsPath, 'CJS');

console.log('[fix-vant-browser] Done!');
