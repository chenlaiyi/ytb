/**
 * 手机端错误监控工具
 * 用于收集、分析和报告各种类型的错误
 */

// 错误类型枚举
export const ErrorType = {
  JAVASCRIPT: 'javascript',
  PROMISE: 'promise',
  NETWORK: 'network',
  API: 'api',
  WECHAT: 'wechat',
  VUE: 'vue',
  RESOURCE: 'resource'
}

// 错误级别枚举
export const ErrorLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
}

// 错误收集器
class ErrorCollector {
  constructor() {
    this.errors = []
    this.maxErrors = 100 // 最多保存100个错误
    this.reportUrl = '/admin/api/logs/error_report.php'
  }

  // 添加错误
  addError(error) {
    const formattedError = this.formatError(error)
    this.errors.unshift(formattedError)
    
    // 保持错误数量在限制内
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors)
    }
    
    // 自动报告高级别错误
    if (formattedError.level === ErrorLevel.HIGH || formattedError.level === ErrorLevel.CRITICAL) {
      this.reportError(formattedError)
    }
    
    // 保存到本地存储
    this.saveToLocalStorage()
    
    return formattedError
  }

  // 格式化错误信息
  formatError(error) {
    const timestamp = new Date().toISOString()
    const userAgent = navigator.userAgent
    const url = window.location.href
    const deviceInfo = this.getDeviceInfo()
    
    const errorInfo = {
      id: this.generateErrorId(),
      timestamp,
      userAgent,
      url,
      deviceInfo,
      type: error.type || ErrorType.JAVASCRIPT,
      level: error.level || ErrorLevel.MEDIUM,
      message: error.message || '未知错误',
      stack: error.stack || '',
      filename: error.filename || '',
      lineno: error.lineno || 0,
      colno: error.colno || 0,
      context: error.context || {},
      networkStatus: this.getNetworkStatus()
    }

    // 根据错误类型添加特定信息
    switch (error.type) {
      case ErrorType.API:
        errorInfo.apiUrl = error.apiUrl
        errorInfo.apiMethod = error.apiMethod
        errorInfo.apiStatus = error.apiStatus
        errorInfo.apiResponse = error.apiResponse
        break
      case ErrorType.NETWORK:
        errorInfo.networkType = error.networkType
        errorInfo.connectionSpeed = error.connectionSpeed
        break
      case ErrorType.WECHAT:
        errorInfo.wechatVersion = error.wechatVersion
        errorInfo.wechatFeature = error.wechatFeature
        break
    }

    return errorInfo
  }

  // 生成错误ID
  generateErrorId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // 获取设备信息
  getDeviceInfo() {
    const ua = navigator.userAgent
    return {
      isMobile: /Mobile|Android|iPhone|iPad/i.test(ua),
      isWeChat: /MicroMessenger/i.test(ua),
      isIOS: /iPhone|iPad|iPod/i.test(ua),
      isAndroid: /Android/i.test(ua),
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    }
  }

  // 获取网络状态
  getNetworkStatus() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    return {
      online: navigator.onLine,
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0
    }
  }

  // 报告错误到服务器
  async reportError(error) {
    try {
      const response = await fetch(this.reportUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error,
          timestamp: new Date().toISOString(),
          source: 'mobile_app'
        })
      })
      
      if (!response.ok) {
        console.warn('错误报告发送失败:', response.status)
      }
    } catch (reportError) {
      console.warn('错误报告发送异常:', reportError.message)
    }
  }

  // 保存到本地存储
  saveToLocalStorage() {
    try {
      const recentErrors = this.errors.slice(0, 20) // 只保存最近20个错误
      localStorage.setItem('app_error_logs', JSON.stringify(recentErrors))
    } catch (error) {
      console.warn('错误日志保存失败:', error.message)
    }
  }

  // 从本地存储加载
  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('app_error_logs')
      if (saved) {
        this.errors = JSON.parse(saved)
      }
    } catch (error) {
      console.warn('错误日志加载失败:', error.message)
    }
  }

  // 获取错误统计
  getErrorStats() {
    const stats = {
      total: this.errors.length,
      byType: {},
      byLevel: {},
      recent: this.errors.slice(0, 10)
    }

    this.errors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1
      stats.byLevel[error.level] = (stats.byLevel[error.level] || 0) + 1
    })

    return stats
  }

  // 清除错误记录
  clearErrors() {
    this.errors = []
    localStorage.removeItem('app_error_logs')
  }
}

// 错误监控器
class ErrorMonitor {
  constructor() {
    this.collector = new ErrorCollector()
    this.isInitialized = false
  }

  // 初始化监控
  init() {
    if (this.isInitialized) return

    // 加载历史错误
    this.collector.loadFromLocalStorage()

    // 监听JavaScript错误
    window.addEventListener('error', (event) => {
      this.collector.addError({
        type: ErrorType.JAVASCRIPT,
        level: this.getJavaScriptErrorLevel(event),
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        context: {
          javascript: true
        }
      })
    })

    // 监听Promise错误
    window.addEventListener('unhandledrejection', (event) => {
      this.collector.addError({
        type: ErrorType.PROMISE,
        level: this.getPromiseErrorLevel(event),
        message: event.reason?.message || '未处理的Promise错误',
        stack: event.reason?.stack,
        context: {
          promise: true,
          reason: event.reason
        }
      })
    })

    // 监听资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.collector.addError({
          type: ErrorType.RESOURCE,
          level: ErrorLevel.MEDIUM,
          message: `资源加载失败: ${event.target.src || event.target.href}`,
          context: {
            resource: true,
            tagName: event.target.tagName,
            src: event.target.src,
            href: event.target.href
          }
        })
      }
    }, true)

    this.isInitialized = true
    console.log('错误监控系统已初始化')
  }

  // 获取JavaScript错误级别
  getJavaScriptErrorLevel(event) {
    const message = event.message.toLowerCase()
    
    if (message.includes('script error') || message.includes('network')) {
      return ErrorLevel.LOW
    }
    
    if (message.includes('syntaxerror') || message.includes('referenceerror')) {
      return ErrorLevel.HIGH
    }
    
    return ErrorLevel.MEDIUM
  }

  // 获取Promise错误级别
  getPromiseErrorLevel(event) {
    const reason = event.reason
    
    if (reason && reason.message) {
      const message = reason.message.toLowerCase()
      
      if (message.includes('network') || message.includes('fetch')) {
        return ErrorLevel.LOW
      }
      
      if (message.includes('timeout') || message.includes('abort')) {
        return ErrorLevel.MEDIUM
      }
    }
    
    return ErrorLevel.HIGH
  }

  // 获取API错误级别
  getApiErrorLevel(error) {
    if (error.response) {
      const status = error.response.status
      
      if (status >= 500) {
        return ErrorLevel.HIGH
      } else if (status >= 400) {
        return ErrorLevel.MEDIUM
      }
    }
    
    return ErrorLevel.LOW
  }

  // 报告Vue错误
  reportVueError(error, vm, info) {
    this.collector.addError({
      type: ErrorType.VUE,
      level: ErrorLevel.HIGH,
      message: error.message,
      stack: error.stack,
      context: {
        vue: true,
        componentName: vm?.$options.name || 'Unknown',
        info
      }
    })
  }

  // 报告API错误
  reportApiError(error, apiUrl, method = 'GET') {
    this.collector.addError({
      type: ErrorType.API,
      level: this.getApiErrorLevel(error),
      message: `API请求失败: ${error.message || '未知错误'}`,
      apiUrl,
      apiMethod: method,
      apiStatus: error.response?.status,
      apiResponse: error.response?.data,
      stack: error.stack,
      context: {
        api: true
      }
    })
  }

  // 报告微信错误
  reportWechatError(error, feature) {
    this.collector.addError({
      type: ErrorType.WECHAT,
      level: ErrorLevel.MEDIUM,
      message: `微信功能错误: ${error.message || '未知错误'}`,
      wechatFeature: feature,
      stack: error.stack,
      context: {
        wechat: true
      }
    })
  }

  // 报告网络错误
  reportNetworkError(error) {
    this.collector.addError({
      type: ErrorType.NETWORK,
      level: ErrorLevel.MEDIUM,
      message: `网络错误: ${error.message || '未知错误'}`,
      stack: error.stack,
      context: {
        network: true
      }
    })
  }

  // 获取错误统计
  getStats() {
    return this.collector.getErrorStats()
  }

  // 获取所有错误
  getAllErrors() {
    return this.collector.errors
  }

  // 清除错误记录
  clearErrors() {
    this.collector.clearErrors()
  }
}

// 创建全局实例
const errorMonitor = new ErrorMonitor()

// 导出函数
export const initErrorMonitor = () => {
  errorMonitor.init()
}

export const reportVueError = (error, vm, info) => {
  errorMonitor.reportVueError(error, vm, info)
}

export const reportApiError = (error, apiUrl, method) => {
  errorMonitor.reportApiError(error, apiUrl, method)
}

export const reportWechatError = (error, feature) => {
  errorMonitor.reportWechatError(error, feature)
}

export const reportNetworkError = (error) => {
  errorMonitor.reportNetworkError(error)
}

export const getErrorStats = () => {
  return errorMonitor.getStats()
}

export const getAllErrors = () => {
  return errorMonitor.getAllErrors()
}

export const clearErrors = () => {
  errorMonitor.clearErrors()
}

export default errorMonitor 