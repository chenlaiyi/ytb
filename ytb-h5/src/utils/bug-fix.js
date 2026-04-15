/**
 * 手机端Bug修复工具
 * 用于处理常见的前端异常和错误
 */

// 全局错误处理器
export const setupGlobalErrorHandler = () => {
  // 捕获未处理的Promise错误
  window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise错误:', event.reason);
    
    // 检查是否是网络错误
    if (event.reason && event.reason.message) {
      const message = event.reason.message.toLowerCase();
      if (message.includes('network') || message.includes('fetch')) {
        console.warn('网络错误已被全局处理器捕获');
        event.preventDefault(); // 阻止默认的错误处理
        return;
      }
    }
    
    // 记录错误到控制台但不显示给用户
    console.error('全局Promise错误:', event.reason);
    event.preventDefault();
  });

  // 捕获JavaScript运行时错误
  window.addEventListener('error', (event) => {
    console.error('JavaScript运行时错误:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
    
    // 对于某些非关键错误，不显示给用户
    const message = event.message.toLowerCase();
    if (message.includes('script error') || 
        message.includes('non-error promise rejection')) {
      return true; // 阻止默认错误处理
    }
  });
};

// 安全的JSON解析
export const safeJsonParse = (jsonString, defaultValue = null) => {
  try {
    if (!jsonString || typeof jsonString !== 'string') {
      return defaultValue;
    }
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('JSON解析失败:', error.message, jsonString);
    return defaultValue;
  }
};

// 安全的localStorage操作
export const safeLocalStorage = {
  getItem: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      
      // 尝试解析JSON
      try {
        return JSON.parse(item);
      } catch {
        // 如果不是JSON，直接返回字符串
        return item;
      }
    } catch (error) {
      console.warn('localStorage读取失败:', error.message);
      return defaultValue;
    }
  },
  
  setItem: (key, value) => {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, stringValue);
      return true;
    } catch (error) {
      console.warn('localStorage写入失败:', error.message);
      return false;
    }
  },
  
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('localStorage删除失败:', error.message);
      return false;
    }
  }
};

// 安全的对象属性访问
export const safeGet = (obj, path, defaultValue = undefined) => {
  try {
    if (!obj || typeof obj !== 'object') {
      return defaultValue;
    }
    
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === null || result === undefined || typeof result !== 'object') {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result === undefined ? defaultValue : result;
  } catch (error) {
    console.warn('安全属性访问失败:', error.message);
    return defaultValue;
  }
};

// 防抖函数
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

// 节流函数
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// 安全的异步函数执行
export const safeAsync = async (asyncFunc, fallbackValue = null, errorHandler = null) => {
  try {
    const result = await asyncFunc();
    return result;
  } catch (error) {
    console.error('异步函数执行失败:', error);
    
    if (errorHandler && typeof errorHandler === 'function') {
      try {
        return await errorHandler(error);
      } catch (handlerError) {
        console.error('错误处理器执行失败:', handlerError);
      }
    }
    
    return fallbackValue;
  }
};

// 检查网络连接状态
export const checkNetworkStatus = () => {
  return {
    online: navigator.onLine,
    connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection,
    effectiveType: navigator.connection?.effectiveType || 'unknown'
  };
};

// 重试机制
export const retry = async (func, maxAttempts = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await func();
    } catch (error) {
      lastError = error;
      console.warn(`第${attempt}次尝试失败:`, error.message);
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError;
};

// 清理无效的缓存数据
export const cleanupInvalidCache = () => {
  try {
    const keysToCheck = [
      'userInfo',
      'tempUserInfo',
      'wechatUserBackup',
      'token',
      'vipWorkspaceData',
      'teamStats'
    ];
    
    keysToCheck.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          const parsed = JSON.parse(value);
          // 检查是否包含无效数据
          if (parsed && typeof parsed === 'object') {
            const stringified = JSON.stringify(parsed);
            if (stringified.includes('undefined') || 
                stringified.includes('null') || 
                stringified.includes('[object Object]')) {
              console.warn(`清理无效缓存: ${key}`);
              localStorage.removeItem(key);
            }
          }
        } catch (e) {
          // 如果解析失败，可能是损坏的数据
          console.warn(`清理损坏的缓存: ${key}`);
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error('清理缓存时出错:', error);
  }
};

// 修复常见的Vue响应式数据问题
export const fixReactiveData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  try {
    // 深度克隆对象，移除Vue的响应式代理
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.warn('修复响应式数据失败:', error);
    return data;
  }
};

// 安全的Toast显示
export const safeToast = {
  show: (message, type = 'info') => {
    try {
      // 确保message是字符串
      const safeMessage = message ? String(message) : '系统提示';
      
      // 动态导入Toast，避免循环依赖
      import('vant').then(({ showToast, showFailToast, showSuccessToast }) => {
        switch (type) {
          case 'success':
            showSuccessToast(safeMessage);
            break;
          case 'error':
          case 'fail':
            showFailToast(safeMessage);
            break;
          default:
            showToast(safeMessage);
        }
      }).catch(error => {
        console.error('Toast显示失败:', error);
        // 降级到原生alert
        alert(safeMessage);
      });
    } catch (error) {
      console.error('Toast显示异常:', error);
    }
  }
};

// 检查并修复常见的数据类型问题
export const validateAndFixData = (data, schema = {}) => {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const fixed = { ...data };
  
  Object.keys(schema).forEach(key => {
    const expectedType = schema[key];
    const value = fixed[key];
    
    try {
      switch (expectedType) {
        case 'string':
          if (value !== undefined && value !== null) {
            fixed[key] = String(value);
          }
          break;
        case 'number':
          if (value !== undefined && value !== null) {
            const num = Number(value);
            fixed[key] = isNaN(num) ? 0 : num;
          }
          break;
        case 'boolean':
          if (value !== undefined && value !== null) {
            fixed[key] = Boolean(value);
          }
          break;
        case 'array':
          if (!Array.isArray(value)) {
            fixed[key] = [];
          }
          break;
        case 'object':
          if (!value || typeof value !== 'object') {
            fixed[key] = {};
          }
          break;
      }
    } catch (error) {
      console.warn(`修复数据字段${key}失败:`, error);
    }
  });
  
  return fixed;
};

// 初始化bug修复工具
export const initBugFix = () => {
  console.log('初始化手机端Bug修复工具');
  
  // 设置全局错误处理
  setupGlobalErrorHandler();
  
  // 清理无效缓存
  cleanupInvalidCache();
  
  // 检查网络状态
  const networkStatus = checkNetworkStatus();
  console.log('网络状态:', networkStatus);
  
  // 监听网络状态变化
  window.addEventListener('online', () => {
    console.log('网络已连接');
  });
  
  window.addEventListener('offline', () => {
    console.log('网络已断开');
  });
};

export default {
  setupGlobalErrorHandler,
  safeJsonParse,
  safeLocalStorage,
  safeGet,
  debounce,
  throttle,
  safeAsync,
  checkNetworkStatus,
  retry,
  cleanupInvalidCache,
  fixReactiveData,
  safeToast,
  validateAndFixData,
  initBugFix
}; 