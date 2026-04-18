import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

const targetPath = resolve('node_modules/@antv/infographic/esm/jsx/globalThis.js');

const dir = dirname(targetPath);
mkdirSync(dir, { recursive: true });
const content = `export default typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};`;
writeFileSync(targetPath, content, 'utf8');
console.log('[fix-antv-globalThis] shim written to', targetPath);
