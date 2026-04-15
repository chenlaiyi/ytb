/**
 * 分支机构相关工具函数
 */

/**
 * 从URL中获取分支机构代码
 * @returns {string|null} 分支机构代码
 */
export function getBranchCodeFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const branchCode = urlParams.get('branch') || urlParams.get('branch_code');
  
  if (branchCode) {
    console.log('从URL获取到分支机构代码:', branchCode);
    return branchCode.toUpperCase();
  }
  
  // 检查路径中是否包含分支机构代码
  const pathMatch = window.location.pathname.match(/\/branch\/([A-Z0-9]+)/i);
  if (pathMatch) {
    const codeFromPath = pathMatch[1].toUpperCase();
    console.log('从路径获取到分支机构代码:', codeFromPath);
    return codeFromPath;
  }
  
  return null;
}

/**
 * 获取当前分支机构代码
 * 优先级：URL参数 > localStorage > sessionStorage
 * @returns {string|null} 分支机构代码
 */
export function getCurrentBranchCode() {
  // 1. 优先从URL获取
  const urlBranchCode = getBranchCodeFromUrl();
  if (urlBranchCode) {
    // 保存到本地存储
    setBranchCode(urlBranchCode);
    return urlBranchCode;
  }
  
  // 2. 从localStorage获取
  const storedBranchCode = localStorage.getItem('branch_code');
  if (storedBranchCode) {
    console.log('从localStorage获取到分支机构代码:', storedBranchCode);
    return storedBranchCode.toUpperCase();
  }
  
  // 3. 从sessionStorage获取
  const sessionBranchCode = sessionStorage.getItem('branch_code');
  if (sessionBranchCode) {
    console.log('从sessionStorage获取到分支机构代码:', sessionBranchCode);
    return sessionBranchCode.toUpperCase();
  }
  
  console.log('未找到分支机构代码，使用默认配置');
  return null;
}

/**
 * 设置分支机构代码
 * @param {string} branchCode 分支机构代码
 */
export function setBranchCode(branchCode) {
  if (!branchCode) {
    console.warn('分支机构代码为空，无法设置');
    return;
  }
  
  const upperBranchCode = branchCode.toUpperCase();
  console.log('设置分支机构代码:', upperBranchCode);
  
  // 同时保存到localStorage和sessionStorage
  localStorage.setItem('branch_code', upperBranchCode);
  sessionStorage.setItem('branch_code', upperBranchCode);
  
  // 触发自定义事件，通知其他组件分支机构代码已更新
  window.dispatchEvent(new CustomEvent('branchCodeChanged', {
    detail: { branchCode: upperBranchCode }
  }));
}

/**
 * 清除分支机构代码
 */
export function clearBranchCode() {
  console.log('清除分支机构代码');
  localStorage.removeItem('branch_code');
  sessionStorage.removeItem('branch_code');
  
  // 触发自定义事件
  window.dispatchEvent(new CustomEvent('branchCodeChanged', {
    detail: { branchCode: null }
  }));
}

/**
 * 检查是否为分支机构环境
 * @returns {boolean} 是否为分支机构环境
 */
export function isBranchEnvironment() {
  return getCurrentBranchCode() !== null;
}

/**
 * 获取分支机构信息
 * @param {string} branchCode 分支机构代码
 * @returns {Promise<Object|null>} 分支机构信息
 */
export async function getBranchInfo(branchCode) {
  if (!branchCode) {
    return null;
  }
  
  try {
    const response = await fetch(`/api/branch/info?code=${encodeURIComponent(branchCode)}`);
    const result = await response.json();
    
    if (result.code === 0 && result.data) {
      console.log('获取分支机构信息成功:', result.data);
      return result.data;
    } else {
      console.error('获取分支机构信息失败:', result.message);
      return null;
    }
  } catch (error) {
    console.error('获取分支机构信息异常:', error);
    return null;
  }
}

/**
 * 初始化分支机构环境
 * 在应用启动时调用
 */
export function initBranchEnvironment() {
  console.log('初始化分支机构环境');
  
  // 检查URL中是否有分支机构代码
  const branchCode = getCurrentBranchCode();
  
  if (branchCode) {
    console.log('检测到分支机构环境:', branchCode);
    
    // 获取分支机构信息并缓存
    getBranchInfo(branchCode).then(branchInfo => {
      if (branchInfo) {
        localStorage.setItem('branch_info', JSON.stringify(branchInfo));
        console.log('分支机构信息已缓存:', branchInfo);
      }
    });
  } else {
    console.log('非分支机构环境，使用默认配置');
    // 清除可能存在的分支机构信息缓存
    localStorage.removeItem('branch_info');
  }
}

/**
 * 获取缓存的分支机构信息
 * @returns {Object|null} 分支机构信息
 */
export function getCachedBranchInfo() {
  try {
    const cachedInfo = localStorage.getItem('branch_info');
    if (cachedInfo) {
      return JSON.parse(cachedInfo);
    }
  } catch (error) {
    console.error('解析缓存的分支机构信息失败:', error);
  }
  return null;
}

/**
 * 监听分支机构代码变化
 * @param {Function} callback 回调函数
 * @returns {Function} 取消监听的函数
 */
export function onBranchCodeChange(callback) {
  const handler = (event) => {
    callback(event.detail.branchCode);
  };
  
  window.addEventListener('branchCodeChanged', handler);
  
  // 返回取消监听的函数
  return () => {
    window.removeEventListener('branchCodeChanged', handler);
  };
} 