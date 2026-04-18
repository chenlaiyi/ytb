const https = require('https');

async function testBranchLogin() {
  console.log('🧪 开始测试分支机构登录页面...\n');
  
  const testUrls = [
    'https://pay.itapgo.com/app/#/branch-login?branch_code=YXY02',
    'https://pay.itapgo.com/app/#/branch-login?branch_code=YXY01'
  ];
  
  for (const url of testUrls) {
    console.log(`📱 测试URL: ${url}`);
    
    try {
      // 模拟获取页面内容
      const pageContent = await fetchPage(url);
      
      // 检查页面大小
      console.log(`📊 页面大小: ${pageContent.length} 字节`);
      
      // 检查是否是正常的HTML页面
      const isValidHtml = pageContent.includes('<html') && pageContent.includes('</html>');
      console.log(`📄 HTML格式: ${isValidHtml ? '✅ 有效' : '❌ 无效'}`);
      
      // 检查是否包含Vue应用
      const hasVueApp = pageContent.includes('id="app"') || pageContent.includes('div id=app');
      console.log(`🎯 Vue应用: ${hasVueApp ? '✅ 已找到' : '❌ 未找到'}`);
      
      // 检查是否包含我们的修复代码特征
      const hasFixCode = pageContent.includes('分支机构') || 
                        pageContent.includes('branch-login') ||
                        pageContent.includes('auth-monitor');
      console.log(`🔧 修复代码: ${hasFixCode ? '✅ 已部署' : '⚠️  可能未部署'}`);
      
      // 检查JavaScript文件引用
      const jsFiles = pageContent.match(/src="[^"]*\.js[^"]*"/g) || [];
      console.log(`📦 JS文件数量: ${jsFiles.length}`);
      
    } catch (error) {
      console.log(`❌ 请求失败: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('📋 测试结果分析:');
  console.log('✅ 如果页面正常返回HTML且包含Vue应用，说明页面访问正常');
  console.log('🔧 如果包含修复代码特征，说明我们的修复已经部署');
  console.log('📱 最终测试需要在真实浏览器中验证JavaScript行为');
  console.log('');
  console.log('🎯 建议下一步:');
  console.log('1. 清除浏览器缓存和本地存储');
  console.log('2. 用手机浏览器访问分支机构登录页面');
  console.log('3. 观察是否还有"无效令牌或已过期"错误弹窗');
}

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

testBranchLogin().catch(console.error);
