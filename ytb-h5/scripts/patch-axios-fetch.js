import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const stubSource = resolve('src/polyfills/axios-fetch-stub.js');
const targetPath = resolve('node_modules/axios/lib/adapters/fetch.js');

const stubContent = readFileSync(stubSource, 'utf8');

writeFileSync(targetPath, stubContent, 'utf8');
console.log('[patch-axios-fetch] axios fetch adapter stub applied:', targetPath);
