/**
 * 路由帮助工具函数
 */

/**
 * 修复路由组件
 * @param {Array} routes 路由数组
 * @returns {Array} 修复后的路由数组
 */
export function fixRouteComponents(routes) { 
  return routes; 
}

/**
 * 修复路由路径
 * @param {string} path 原始路径
 * @returns {string} 修复后的路径
 */
export function fixRoutePath(path) {
  if (!path) return '/dashboard';
  
  // 移除重复的前缀
  let fixedPath = path;
  
  // 处理重复的 /admin 前缀
  if (fixedPath.includes('/admin/admin')) {
    fixedPath = fixedPath.replace('/admin/admin', '/admin');
  }
  
  // 处理重复的 /Tapp/admin/public 前缀
  if (fixedPath.includes('/Tapp/admin/public/Tapp/admin/public')) {
    fixedPath = fixedPath.replace('/Tapp/admin/public/Tapp/admin/public', '/admin');
  }
  
  // 处理旧版路径前缀
  if (fixedPath.includes('/Tapp/admin/public')) {
    fixedPath = fixedPath.replace('/Tapp/admin/public', '/admin');
  }
  
  // 确保路径以 / 开头
  if (!fixedPath.startsWith('/')) {
    fixedPath = '/' + fixedPath;
  }
  
  return fixedPath;
}

/**
 * 检查路由路径是否有问题
 * @param {string} path 路径
 * @returns {Object|null} 检查结果
 */
export function checkRoutePath(path) {
  if (!path) {
    return {
      message: '路径为空',
      suggestion: '建议重定向到首页'
    };
  }
  
  // 检查是否有重复前缀
  if (path.includes('/admin/admin')) {
    return {
      message: '检测到重复的 /admin 前缀',
      suggestion: '建议移除重复前缀'
    };
  }
  
  // 检查是否有旧版路径前缀
  if (path.includes('/Tapp/admin/public')) {
    return {
      message: '检测到旧版路径前缀',
      suggestion: '建议更新为新版路径格式'
    };
  }
  
  // 检查是否为404页面
  if (path === '/404' || path.includes('404')) {
    return {
      message: '当前为404页面',
      suggestion: '建议检查路由配置'
    };
  }
  
  return null;
}

/**
 * 处理路由错误
 * @param {Error} error 错误对象
 * @param {Object} router 路由器实例
 * @returns {boolean} 是否成功处理
 */
export function handleRouteError(error, router) {
  
  try {
    // 处理导航重复错误
    if (error.message && error.message.includes('NavigationDuplicated')) {
      return true;
    }
    
    // 处理路由不存在错误
    if (error.message && (error.message.includes('route') || error.message.includes('navigation'))) {
      router.push('/dashboard');
      return true;
    }
    
    // 处理其他路由相关错误
    if (error.message && error.message.includes('fullPath')) {
      window.location.href = '/admin/#/dashboard';
      return true;
    }
    
    return false;
  } catch (e) {
    console.error('路由错误处理失败:', e);
    return false;
  }
}

/**
 * 安全获取路由属性
 * @param {Object} route 路由对象
 * @param {string} prop 属性名
 * @param {*} defaultValue 默认值
 * @returns {*} 属性值
 */
export function safeGetRouteProp(route, prop, defaultValue = null) {
  try {
    if (!route || typeof route !== 'object') {
      return defaultValue;
    }
    
    return route[prop] !== undefined ? route[prop] : defaultValue;
  } catch (e) {
    console.warn('获取路由属性失败:', prop, e);
    return defaultValue;
  }
}

/**
 * 验证路由路径格式
 * @param {string} path 路径
 * @returns {boolean} 是否有效
 */
export function isValidRoutePath(path) {
  if (!path || typeof path !== 'string') {
    return false;
  }
  
  // 基本格式检查
  if (!path.startsWith('/')) {
    return false;
  }
  
  // 检查是否包含非法字符
  const invalidChars = ['<', '>', '"', '|', '?', '*'];
  for (const char of invalidChars) {
    if (path.includes(char)) {
      return false;
    }
  }
  
  return true;
}

/**
 * 标准化路由路径
 * @param {string} path 原始路径
 * @returns {string} 标准化后的路径
 */
export function normalizePath(path) {
  if (!path) return '/';
  
  // 移除多余的斜杠
  let normalized = path.replace(/\/+/g, '/');
  
  // 确保以 / 开头
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }
  
  // 移除末尾的斜杠（除非是根路径）
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  
  return normalized;
}
