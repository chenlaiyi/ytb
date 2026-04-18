// Node v25 兼容性修复 - 解决 proxy trap 报错
if (global.localStorage && typeof global.localStorage.getItem !== 'function') {
  delete global.localStorage;
}

const ci = require('miniprogram-ci');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

console.log('--- 准备上传微信小程序 ---');

// 1. 读取并升级 manifest.json 中的版本号
const manifestPath = path.resolve(__dirname, 'src/manifest.json');
let manifestStr = fs.readFileSync(manifestPath, 'utf-8');

// 匹配 "versionName" : "1.0.0",
const versionRegex = /"versionName"\s*:\s*"(\d+)\.(\d+)\.(\d+)"/;
const codeRegex = /"versionCode"\s*:\s*"(\d+)"/;

const vMatch = manifestStr.match(versionRegex);
const cMatch = manifestStr.match(codeRegex);

if (!vMatch || !cMatch) {
  console.error('❌ 无法在 manifest.json 中找到版本号配置');
  process.exit(1);
}

const newVersionName = `${vMatch[1]}.${vMatch[2]}.${parseInt(vMatch[3]) + 1}`;
const newVersionCode = parseInt(cMatch[1]) + 1;

manifestStr = manifestStr.replace(versionRegex, `"versionName" : "${newVersionName}"`);
manifestStr = manifestStr.replace(codeRegex, `"versionCode" : "${newVersionCode}"`);

fs.writeFileSync(manifestPath, manifestStr, 'utf-8');
console.log(`✅ 版本号已自动升级到 v${newVersionName} (Code: ${newVersionCode})`);

// 2. 编译生产版本代码
console.log('⏳ 正在编译生产环境代码 (避免包体积超限)...');
try {
  execSync('npm run build:mp-weixin', { stdio: 'inherit' });
  console.log('✅ 编译成功');
} catch (e) {
  console.error('❌ 编译代码失败', e);
  process.exit(1);
}

// 3. 上传代码至微信公众平台
const projectPath = path.resolve(__dirname, 'dist/build/mp-weixin');
const privateKeyPath = path.resolve(__dirname, 'private.wx5643a45f1e914b29.key');

const project = new ci.Project({
  appid: 'wx5643a45f1e914b29',
  type: 'miniProgram',
  projectPath,
  privateKeyPath,
  ignores: ['node_modules/**/*'],
});

(async () => {
  try {
    console.log(`⏳ 开始上传体验版代码至微信服务器...`);
    const uploadResult = await ci.upload({
      project,
      version: newVersionName,
      desc: 'Antigravity Auto Deploy, Features Updates',
      setting: {
        es6: false,
        minify: false,
        autoPrefixWXSS: false,
      },
      robot: 1
    });
    console.log(`🎉 体验版 [${newVersionName}] 上传成功！`);
    console.log('👉 请扫码体验，或登录微信公众平台 (mp.weixin.qq.com) 提交审核。');
  } catch (err) {
    console.error('❌ 上传失败，请检查密钥是否正确或网络状态:', err);
  }
})();
