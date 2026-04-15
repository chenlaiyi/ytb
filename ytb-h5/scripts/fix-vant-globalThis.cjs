// Fix for Vant globalThis issue - create symlink
const fs = require('fs');
const path = require('path');

const vantDir = path.join(__dirname, '../node_modules/vant/es/composables');
const targetFile = path.join(vantDir, 'use-global-z-index.mjs');
const linkFile = path.join(vantDir, 'use-globalThis-z-index.mjs');

if (fs.existsSync(targetFile) && !fs.existsSync(linkFile)) {
  fs.symlinkSync(targetFile, linkFile);
  console.log('Created symlink: use-globalThis-z-index.mjs -> use-global-z-index.mjs');
} else if (fs.existsSync(linkFile)) {
  console.log('Symlink already exists: use-globalThis-z-index.mjs');
}
