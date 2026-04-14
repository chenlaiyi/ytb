/**
 * SMS路径修复工具函数
 */

/**
 * 自动修复SMS路径
 * @param {Object} router 路由器实例
 * @returns {boolean} 是否进行了修复
 */
export function autoFixSmsPath(router) {
  const currentPath = window.location.pathname;
  const hash = window.location.hash;
  
  // 检查是否需要修复SMS路径
  if (isSmsPath(currentPath) || isSmsPath(hash)) {
    const fixedPath = fixSmsPath(currentPath + hash);
    if (fixedPath !== currentPath + hash) {
      try {
        router.replace(fixedPath);
        return true;
      } catch (e) {
        console.error('SMS路径修复失败:', e);
        window.location.href = fixedPath;
        return true;
      }
    }
  }
  
  return false;
}

/**
 * 检查是否为SMS相关路径
 * @param {string} path 路径
 * @returns {boolean} 是否为SMS路径
 */
export function isSmsPath(path) {
  if (!path || typeof path !== 'string') {
    return false;
  }
  
  const smsPatterns = [
    '/sms',
    '/sms/',
    '/sms-',
    '/system/sms',
    '/system/sms-',
    '#/sms',
    '#/system/sms'
  ];
  
  return smsPatterns.some(pattern => path.includes(pattern));
}

/**
 * 修复SMS路径
 * @param {string} path 原始路径
 * @returns {string} 修复后的路径
 */
export function fixSmsPath(path) {
  if (!path || typeof path !== 'string') {
    return '/dashboard';
  }
  
  let fixedPath = path;
  
  // 修复错误的SMS路由格式（反向修复：从错误的sms/logs回到正确的sms-logs）
  const smsRouteMap = {
    '/system/sms/logs': '/system/sms-logs',
    '/system/sms/statistics': '/system/sms-statistics', 
    '/system/sms/codes': '/system/sms-codes',
    '/system/sms/templates': '/system/sms-templates',
    '/system/sms/config': '/system/sms-config',
    '#/system/sms/logs': '#/system/sms-logs',
    '#/system/sms/statistics': '#/system/sms-statistics',
    '#/system/sms/codes': '#/system/sms-codes',
    '#/system/sms/templates': '#/system/sms-templates',
    '#/system/sms/config': '#/system/sms-config'
  };
  
  // 应用路由映射
  for (const [oldRoute, newRoute] of Object.entries(smsRouteMap)) {
    if (fixedPath.includes(oldRoute)) {
      fixedPath = fixedPath.replace(oldRoute, newRoute);
      break;
    }
  }
  
  // 处理重复的路径前缀
  if (fixedPath.includes('/Tapp/admin/public')) {
    fixedPath = fixedPath.replace('/Tapp/admin/public', '/admin');
  }
  
  // 处理重复的admin前缀
  if (fixedPath.includes('/admin/admin')) {
    fixedPath = fixedPath.replace('/admin/admin', '/admin');
  }
  
  return fixedPath;
}

/**
 * 获取SMS子路径
 * @param {string} path 完整路径
 * @returns {string} SMS子路径
 */
export function getSmsSubPath(path) {
  if (!path || typeof path !== 'string') {
    return '';
  }
  
  // 提取SMS相关的子路径
  const smsMatch = path.match(/\/sms\/([^\/\?#]+)/);
  if (smsMatch) {
    return smsMatch[1];
  }
  
  // 处理旧格式的SMS路径
  const oldSmsMatch = path.match(/\/sms-([^\/\?#]+)/);
  if (oldSmsMatch) {
    return oldSmsMatch[1];
  }
  
  return '';
}

/**
 * 验证SMS路径是否有效
 * @param {string} path 路径
 * @returns {boolean} 是否有效
 */
export function isValidSmsPath(path) {
  if (!isSmsPath(path)) {
    return false;
  }
  
  const validSmsSubPaths = [
    'logs',
    'statistics', 
    'codes',
    'templates',
    'config'
  ];
  
  const subPath = getSmsSubPath(path);
  return validSmsSubPaths.includes(subPath);
}

/**
 * 标准化SMS路径
 * @param {string} path 原始路径
 * @returns {string} 标准化后的路径
 */
export function normalizeSmsPath(path) {
  if (!path) return '/system/sms/logs';
  
  const subPath = getSmsSubPath(path);
  if (!subPath) {
    return '/system/sms/logs'; // 默认到日志页面
  }
  
  return `/system/sms/${subPath}`;
}

/**
 * 获取SMS路径的面包屑导航
 * @param {string} path 路径
 * @returns {Array} 面包屑数组
 */
export function getSmsPathBreadcrumb(path) {
  const subPath = getSmsSubPath(path);
  const breadcrumbs = [
    { name: '系统管理', path: '/system' },
    { name: '短信管理', path: '/system/sms' }
  ];
  
  const subPathMap = {
    'logs': '短信日志',
    'statistics': '发送统计',
    'codes': '验证码管理',
    'templates': '短信模板',
    'config': '短信配置'
  };
  
  if (subPath && subPathMap[subPath]) {
    breadcrumbs.push({
      name: subPathMap[subPath],
      path: `/system/sms/${subPath}`
    });
  }
  
  return breadcrumbs;
}

export default {
  autoFixSmsPath,
  isSmsPath,
  fixSmsPath,
  getSmsSubPath,
  isValidSmsPath,
  normalizeSmsPath,
  getSmsPathBreadcrumb
};
