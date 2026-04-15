// Patch axios fetch adapter stub
const fs = require('fs');
const path = require('path');

const polyfillsDir = path.join(__dirname, '../src/polyfills');
if (!fs.existsSync(polyfillsDir)) {
  fs.mkdirSync(polyfillsDir, { recursive: true });
}

// Create axios-fetch-stub.js if it doesn't exist
const stubPath = path.join(polyfillsDir, 'axios-fetch-stub.js');
if (!fs.existsSync(stubPath)) {
  const stub = `
// Stub for axios fetch adapter
export default null;
`;
  fs.writeFileSync(stubPath, stub);
  console.log('Created axios-fetch-stub.js');
}