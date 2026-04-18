// Patch axios to disable fetch adapter (causes issues in older WeChat browsers)
const fs = require('fs');
const path = require('path');

const axiosAdaptersPath = path.join(__dirname, '../node_modules/axios/lib/adapters/adapters.js');
const axiosFetchPath = path.join(__dirname, '../node_modules/axios/lib/adapters/fetch.js');

if (fs.existsSync(axiosAdaptersPath)) {
  let adaptersContent = fs.readFileSync(axiosAdaptersPath, 'utf8');
  
  // Check if already patched
  if (!adaptersContent.includes('// PATCHED: fetch adapter disabled')) {
    // Remove the fetch adapter import and reference
    adaptersContent = adaptersContent
      .replace(/import \* as fetchAdapter from ['"]\.\/fetch\.js['"];?\n?/, '')
      .replace(/fetch:\s*\{\s*get:\s*fetchAdapter\.getFetch,\s*\},?\n?/, '')
      .replace(/fetch:\s*\{\s*get:\s*fetchAdapter\.getFetch,\s*\},?/, '')
      .replace(/,\s*\}\n\s*\};/, ',\n};\n');
    
    // Add comment to mark as patched
    adaptersContent = '// PATCHED: fetch adapter disabled\n' + adaptersContent;
    
    fs.writeFileSync(axiosAdaptersPath, adaptersContent);
    console.log('Patched axios adapters.js - fetch adapter disabled');
  } else {
    console.log('axios adapters.js already patched');
  }
}

if (fs.existsSync(axiosFetchPath)) {
  let fetchContent = fs.readFileSync(axiosFetchPath, 'utf8');
  
  // Check if already patched
  if (!fetchContent.includes('// PATCHED: getFetch returns false')) {
    // Replace the module to always return false for getFetch
    const patchedFetch = `// PATCHED: getFetch returns false - fetch adapter disabled to avoid issues in legacy WebViews
// The original fetch adapter caused crashes in older WeChat browsers because it tries to 
// destructure Request/Response from utils.global at module load time, which fails in those environments.

export function getFetch() {
  return false;
}

export default {
  get: () => false,
  getFetch: () => false
};
`;
    fs.writeFileSync(axiosFetchPath, patchedFetch);
    console.log('Patched axios fetch.js - getFetch returns false');
  } else {
    console.log('axios fetch.js already patched');
  }
}
