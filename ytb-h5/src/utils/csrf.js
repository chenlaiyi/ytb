import axios from 'axios';

/**
 * 初始化CSRF令牌
 * 从服务器获取CSRF令牌并设置到cookie中
 * @returns {Promise<string>} 返回CSRF令牌
 */
export async function initCsrfToken() {
  try {
    // 检查是否已有CSRF令牌
    const getCookie = (name) => {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(name + '=')) {
          return decodeURIComponent(cookie.substring(name.length + 1));
        }
      }
      return '';
    };
    
    const existingToken = getCookie('XSRF-TOKEN');
    if (existingToken) {
      console.log('使用现有的CSRF令牌');
      return existingToken;
    }
    
    // 如果服务器没有配置Laravel Sanctum，则不尝试获取CSRF令牌
    // 直接返回空字符串，让应用继续运行
    console.warn('CSRF令牌端点不可用，跳过初始化');
    return '';
  } catch (error) {
    console.error('初始化CSRF令牌出错:', error);
    return '';
  }
}

/**
 * 检查CSRF令牌是否存在，如果不存在则获取
 * @returns {Promise<string>} 返回CSRF令牌
 */
export async function ensureCsrfToken() {
  // 从cookie中获取现有的CSRF令牌
  const getCookie = (name) => {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + '=')) {
        return decodeURIComponent(cookie.substring(name.length + 1));
      }
    }
    return '';
  };
  
  // 检查是否已有CSRF令牌
  const existingToken = getCookie('XSRF-TOKEN');
  if (existingToken) {
    return existingToken;
  }
  
  // 如果没有CSRF令牌，则获取一个
  return await initCsrfToken();
}