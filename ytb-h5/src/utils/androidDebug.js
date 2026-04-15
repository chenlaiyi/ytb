/**
 * 安卓设备调试工具
 * 专门用于排查安卓设备微信登录"无效令牌或已过期"问题
 */

// 检测是否为安卓设备
export const isAndroidDevice = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera
  return /android/i.test(userAgent)
}

// 检测是否在微信环境
export const isWechatBrowser = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  return userAgent.includes('micromessenger')
}

// 获取设备信息
export const getDeviceInfo = () => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    vendor: navigator.vendor,
    isAndroid: isAndroidDevice(),
    isWechat: isWechatBrowser(),
    timestamp: new Date().toISOString(),
    screenSize: `${screen.width}x${screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    localStorage: {
      token: localStorage.getItem('token') ? 'exists' : 'missing',
      userInfo: localStorage.getItem('userInfo') ? 'exists' : 'missing',
      branchCode: localStorage.getItem('branch_code') || 'missing',
      isBranch: localStorage.getItem('isBranch') || 'missing'
    }
  }
}

// 记录调试日志
export const logDebugInfo = (action, data = {}) => {
  const debugInfo = {
    action,
    deviceInfo: getDeviceInfo(),
    data,
    timestamp: new Date().toISOString()
  }
  
  console.log(`[安卓调试] ${action}:`, debugInfo)
  
  // 如果是安卓设备，发送调试信息到服务器
  if (isAndroidDevice()) {
    try {
      // 使用fetch发送调试信息，避免使用axios造成循环调用
      fetch('/Tapp/admin/api/debug/android_log.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(debugInfo)
      }).catch(err => {
        console.warn('[安卓调试] 发送调试信息失败:', err)
      })
    } catch (error) {
      console.warn('[安卓调试] 发送调试信息异常:', error)
    }
  }
  
  return debugInfo
}

// 监控token相关操作
export const monitorTokenOperations = () => {
  if (!isAndroidDevice()) return
  
  console.log('[安卓调试] 开始监控token操作')
  
  // 监控localStorage的token变化
  const originalSetItem = localStorage.setItem
  localStorage.setItem = function(key, value) {
    if (key === 'token' || key === 'auth_token') {
      logDebugInfo('localStorage.setItem', { key, hasValue: !!value })
    }
    return originalSetItem.apply(this, arguments)
  }
  
  const originalRemoveItem = localStorage.removeItem
  localStorage.removeItem = function(key) {
    if (key === 'token' || key === 'auth_token') {
      logDebugInfo('localStorage.removeItem', { key })
    }
    return originalRemoveItem.apply(this, arguments)
  }
  
  // 监控页面可见性变化
  document.addEventListener('visibilitychange', () => {
    logDebugInfo('visibilityChange', { 
      hidden: document.hidden,
      visibilityState: document.visibilityState 
    })
  })
  
  // 监控页面焦点变化
  window.addEventListener('focus', () => {
    logDebugInfo('windowFocus')
  })
  
  window.addEventListener('blur', () => {
    logDebugInfo('windowBlur')
  })
}

// 验证token有效性
export const validateToken = async () => {
  const token = localStorage.getItem('token')
  
  if (!token) {
    logDebugInfo('validateToken', { status: 'no_token' })
    return { valid: false, reason: 'no_token' }
  }
  
  try {
    // 尝试解析JWT token
    const parts = token.split('.')
    if (parts.length !== 3) {
      logDebugInfo('validateToken', { status: 'invalid_format', partsCount: parts.length })
      return { valid: false, reason: 'invalid_format' }
    }
    
    // 解析payload
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    const now = Math.floor(Date.now() / 1000)
    const isExpired = payload.exp && payload.exp < now
    
    logDebugInfo('validateToken', { 
      status: 'parsed',
      exp: payload.exp,
      now,
      isExpired,
      userId: payload.user_id
    })
    
    return { 
      valid: !isExpired, 
      reason: isExpired ? 'expired' : 'valid',
      payload 
    }
    
  } catch (error) {
    logDebugInfo('validateToken', { 
      status: 'parse_error', 
      error: error.message 
    })
    return { valid: false, reason: 'parse_error', error: error.message }
  }
}

// 初始化安卓调试
export const initAndroidDebug = () => {
  if (!isAndroidDevice()) return
  
  logDebugInfo('initAndroidDebug', { message: '安卓设备调试初始化' })
  
  // 启动token操作监控
  monitorTokenOperations()
  
  // 定期验证token
  setInterval(() => {
    validateToken()
  }, 30000) // 每30秒验证一次
  
  // 监控网络状态
  window.addEventListener('online', () => {
    logDebugInfo('networkOnline')
  })
  
  window.addEventListener('offline', () => {
    logDebugInfo('networkOffline')
  })
}

// 导出默认对象
export default {
  isAndroidDevice,
  isWechatBrowser,
  getDeviceInfo,
  logDebugInfo,
  monitorTokenOperations,
  validateToken,
  initAndroidDebug
} 