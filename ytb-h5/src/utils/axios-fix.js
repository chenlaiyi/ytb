/**
 * Axios兼容性修复
 * 解决旧版微信WebView中fetch/Request对象的问题
 */

// 确保全局对象存在
if (typeof globalThis === 'undefined') {
  window.globalThis = window
}

// 修复axios在旧版浏览器中的问题
if (typeof window !== 'undefined') {
  // 确保Request对象存在（即使是空对象）
  if (typeof window.Request === 'undefined') {
    window.Request = function() {}
    window.Request.prototype = {}
  }
  
  // 确保Response对象存在
  if (typeof window.Response === 'undefined') {
    window.Response = function() {}
    window.Response.prototype = {}
  }
  
  // 确保Headers对象存在
  if (typeof window.Headers === 'undefined') {
    window.Headers = function() {}
    window.Headers.prototype = {}
  }
}

export default {
  init: () => {
    // 初始化函数，在应用启动时调用
    console.log('Axios兼容性修复已加载')
  }
}