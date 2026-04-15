// Fix for Vant browser detection and @antv/infographic issues
const fs = require('fs');
const path = require('path');

const vantBrowserPath = path.join(__dirname, '../node_modules/vant/es/utils/dom/browser.js');

if (fs.existsSync(vantBrowserPath)) {
  let content = fs.readFileSync(vantBrowserPath, 'utf-8');
  // Fix potential browser detection issues in Vant
  const fixed = content.replace(/globalThis\.navigator/g, 'window.navigator');
  if (content !== fixed) {
    fs.writeFileSync(vantBrowserPath, fixed);
    console.log('Fixed vant browser detection');
  }
}

// Fix @antv/infographic globalThis.js symlink
const antvDir = path.join(__dirname, '../node_modules/@antv/infographic/esm/jsx');
const antvTarget = path.join(antvDir, 'global.js');
const antvLink = path.join(antvDir, 'globalThis.js');

if (fs.existsSync(antvTarget) && !fs.existsSync(antvLink)) {
  fs.symlinkSync(antvTarget, antvLink);
  console.log('Created symlink: @antv/infographic globalThis.js -> global.js');
} else if (fs.existsSync(antvLink)) {
  console.log('Symlink already exists: @antv/infographic globalThis.js');
}
