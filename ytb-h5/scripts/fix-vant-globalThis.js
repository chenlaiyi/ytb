import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

const targetPath = resolve('node_modules/vant/es/composables/use-globalThis-z-index.mjs');
const sourceRelative = './use-global-z-index.mjs';

const dir = dirname(targetPath);
mkdirSync(dir, { recursive: true });
const content = `let globalZIndex = 2000;\n\nconst useGlobalZIndex = () => ++globalZIndex;\n\nconst setGlobalZIndex = (val) => {\n  globalZIndex = val;\n};\n\nexport { setGlobalZIndex, useGlobalZIndex };\nexport default setGlobalZIndex;\n`;
writeFileSync(targetPath, content, 'utf8');
console.log('[fix-vant-globalThis] shim written to', targetPath);
