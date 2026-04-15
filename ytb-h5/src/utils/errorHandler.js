/**
 * VIP招募流程错误处理系统
 */

import { Toast, Dialog } from 'vant'

// 错误类型定义
export const ERROR_TYPES = {
  NETWORK: 'network',
  API: 'api',
  VALIDATION: 'validation',
  PERMISSION: 'permission',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown'
}

// 错误码映射
export const ERROR_CODES = {
  // 通用错误
  0: { type: 'success', message: '操作成功' },
  400: { type: ERROR_TYPES.VALIDATION, message: '请求参数错误' },
  401: { type: ERROR_TYPES.PERMISSION, message: '用户未登录' },
  403: { type: ERROR_TYPES.PERMISSION, message: '无权限访问' },
  404: { type: ERROR_TYPES.API, message: '资源不存在' },
  429: { type: ERROR_TYPES.API, message: '请求过于频繁' },
  500: { type: ERROR_TYPES.API, message: '服务器内部错误' },
  
  // VIP相关错误
  1001: { type: ERROR_TYPES.VALIDATION, message: '推荐人ID无效' },
  1002: { type: ERROR_TYPES.PERMISSION, message: '不能邀请自己' },
  1003: { type: ERROR_TYPES.API, message: '推荐人不存在' },
  1004: { type: ERROR_TYPES.VALIDATION, message: '用户已绑定其他推荐人' },
  1005: { type: ERROR_TYPES.API, message: '用户已是VIP会员' },
  1006: { type: ERROR_TYPES.API, message: '创建订单失败' },
  1007: { type: ERROR_TYPES.API, message: '支付失败' },
  
  // 微信相关错误
  2001: { type: ERROR_TYPES.PERMISSION, message: '微信授权失败' },
  2002: { type: ERROR_TYPES.API, message: '获取微信用户信息失败' },
  2003: { type: ERROR_TYPES.API, message: '微信支付初始化失败' },
}

/**
 * 错误处理器类
 */
export class ErrorHandler {
  constructor() {
    this.errorLog = []
    this.maxLogSize = 100
    this.enableLogging = true
  }

  /**
   * 处理错误
   */
  handle(error, context = {}) {
    const errorInfo = this.parseError(error)
    
    // 记录错误
    if (this.enableLogging) {
      this.logError(errorInfo, context)
    }
    
    // 显示用户友好的错误信息
    this.showUserFriendlyError(errorInfo, context)
    
    // 发送错误报告（可选）
    this.reportError(errorInfo, context)
    
    return errorInfo
  }

  /**
   * 解析错误信息
   */
  parseError(error) {
    let errorInfo = {
      type: ERROR_TYPES.UNKNOWN,
      code: 'UNKNOWN',
      message: '未知错误',
      originalError: error,
      timestamp: new Date().toISOString()
    }

    if (typeof error === 'string') {
      errorInfo.message = error
      errorInfo.type = ERROR_TYPES.UNKNOWN
    } else if (error?.response) {
      // Axios 错误
      const { status, data } = error.response
      errorInfo.code = status
      errorInfo.message = data?.message || ERROR_CODES[status]?.message || '网络请求失败'
      errorInfo.type = ERROR_CODES[status]?.type || ERROR_TYPES.NETWORK
    } else if (error?.code !== undefined) {
      // API 响应错误
      const { code, message } = error
      errorInfo.code = code
      errorInfo.message = message || ERROR_CODES[code]?.message || '操作失败'
      errorInfo.type = ERROR_CODES[code]?.type || ERROR_TYPES.API
    } else if (error instanceof TypeError && error.message.includes('fetch')) {
      // 网络错误
      errorInfo.type = ERROR_TYPES.NETWORK
      errorInfo.message = '网络连接失败，请检查网络设置'
    } else if (error instanceof Error) {
      // 普通 JavaScript 错误
      errorInfo.message = error.message
      errorInfo.type = ERROR_TYPES.UNKNOWN
    }

    return errorInfo
  }

  /**
   * 显示用户友好的错误信息
   */
  showUserFriendlyError(errorInfo, context) {
    const { type, message, code } = errorInfo
    
    switch (type) {
      case ERROR_TYPES.NETWORK:
        this.showNetworkError(message, context)
        break
      case ERROR_TYPES.PERMISSION:
        this.showPermissionError(message, context)
        break
      case ERROR_TYPES.VALIDATION:
        this.showValidationError(message, context)
        break
      case ERROR_TYPES.API:
        this.showApiError(message, context)
        break
      default:
        this.showGenericError(message, context)
    }
  }

  /**
   * 显示网络错误
   */
  showNetworkError(message, context) {
    Dialog.confirm({
      title: '网络连接异常',
      message: `${message}\n\n是否重试？`,
      confirmButtonText: '重试',
      cancelButtonText: '取消'
    }).then(() => {
      // 执行重试逻辑
      if (context.retry && typeof context.retry === 'function') {
        context.retry()
      }
    }).catch(() => {
      // 用户取消
    })
  }

  /**
   * 显示权限错误
   */
  showPermissionError(message, context) {
    if (context.code === 401 || context.code === 2001) {
      Dialog.confirm({
        title: '需要登录',
        message: `${message}\n\n是否立即登录？`,
        confirmButtonText: '立即登录',
        cancelButtonText: '取消'
      }).then(() => {
        // 跳转到登录页面
        if (context.router) {
          const currentPath = encodeURIComponent(context.router.currentRoute.value.fullPath)
          context.router.push(`/wechat-login?state=${currentPath}`)
        }
      }).catch(() => {
        // 用户取消
      })
    } else {
      Toast({ type: 'fail', message: message })
    }
  }

  /**
   * 显示验证错误
   */
  showValidationError(message, context) {
    Toast({ type: 'fail', message: message })
  }

  /**
   * 显示API错误
   */
  showApiError(message, context) {
    if (context.showRetry) {
      Dialog.confirm({
        title: '操作失败',
        message: `${message}\n\n是否重试？`,
        confirmButtonText: '重试',
        cancelButtonText: '取消'
      }).then(() => {
        if (context.retry && typeof context.retry === 'function') {
          context.retry()
        }
      }).catch(() => {
        // 用户取消
      })
    } else {
      Toast({ type: 'fail', message: message })
    }
  }

  /**
   * 显示通用错误
   */
  showGenericError(message, context) {
    Toast({ type: 'fail', message: message || '操作失败，请重试' })
  }

  /**
   * 记录错误
   */
  logError(errorInfo, context) {
    const logEntry = {
      ...errorInfo,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: context.userId || 'anonymous'
    }

    this.errorLog.unshift(logEntry)
    
    // 限制日志大小
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize)
    }

    // 输出到控制台
    console.error('VIP招募错误:', logEntry)
  }

  /**
   * 发送错误报告
   */
  async reportError(errorInfo, context) {
    // 只报告重要错误
    if (this.shouldReport(errorInfo)) {
      try {
        await fetch('/admin/api/analytics/error_report.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            error: errorInfo,
            context,
            timestamp: Date.now(),
            page: 'vip_recruit_landing'
          })
        })
      } catch (reportError) {
        console.warn('错误报告发送失败:', reportError)
      }
    }
  }

  /**
   * 判断是否应该报告错误
   */
  shouldReport(errorInfo) {
    const { type, code } = errorInfo
    
    // 不报告用户主动取消的操作
    if (code === 'user_cancel') {
      return false
    }
    
    // 不报告验证错误
    if (type === ERROR_TYPES.VALIDATION) {
      return false
    }
    
    // 报告网络错误和API错误
    return [ERROR_TYPES.NETWORK, ERROR_TYPES.API, ERROR_TYPES.UNKNOWN].includes(type)
  }

  /**
   * 获取错误日志
   */
  getErrorLog() {
    return [...this.errorLog]
  }

  /**
   * 清空错误日志
   */
  clearErrorLog() {
    this.errorLog = []
  }

  /**
   * 设置日志开关
   */
  setLogging(enabled) {
    this.enableLogging = enabled
  }
}

/**
 * 自动恢复机制
 */
export class AutoRecovery {
  constructor(errorHandler) {
    this.errorHandler = errorHandler
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000
    }
  }

  /**
   * 带重试的异步操作
   */
  async withRetry(operation, options = {}) {
    const config = { ...this.retryConfig, ...options }
    let lastError = null
    
    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        const result = await operation()
        
        // 如果前面有失败，记录恢复成功
        if (attempt > 1) {
          console.log(`操作在第${attempt}次尝试后成功恢复`)
          Toast.success('连接已恢复')
        }
        
        return result
      } catch (error) {
        lastError = error
        
        if (attempt === config.maxRetries) {
          // 最后一次尝试失败
          break
        }
        
        // 计算延迟时间（指数退避）
        const delay = Math.min(
          config.baseDelay * Math.pow(2, attempt - 1),
          config.maxDelay
        )
        
        console.log(`第${attempt}次尝试失败，${delay}ms后重试:`, error)
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    // 所有重试都失败，抛出最后的错误
    throw lastError
  }

  /**
   * 网络状态检测和恢复
   */
  setupNetworkRecovery() {
    let isOnline = navigator.onLine
    
    window.addEventListener('online', () => {
      if (!isOnline) {
        isOnline = true
        Toast.success('网络连接已恢复')
        // 可以在这里触发重试机制
        this.onNetworkRestore?.()
      }
    })
    
    window.addEventListener('offline', () => {
      if (isOnline) {
        isOnline = false
        Toast({ type: 'fail', message: '网络连接已断开' })
      }
    })
  }

  /**
   * 设置网络恢复回调
   */
  onNetworkRestore(callback) {
    this.onNetworkRestore = callback
  }
}

/**
 * 用户反馈收集器
 */
export class FeedbackCollector {
  constructor() {
    this.feedbackQueue = []
  }

  /**
   * 收集用户反馈
   */
  async collectFeedback(error, context) {
    try {
      const feedback = await Dialog.confirm({
        title: '帮助我们改进',
        message: '遇到问题了吗？您的反馈对我们很重要',
        confirmButtonText: '发送反馈',
        cancelButtonText: '跳过'
      })
      
      // 显示反馈表单
      this.showFeedbackForm(error, context)
    } catch {
      // 用户选择跳过
    }
  }

  /**
   * 显示反馈表单
   */
  showFeedbackForm(error, context) {
    // 这里可以弹出一个详细的反馈表单
    // 或者跳转到反馈页面
    const feedbackData = {
      error: error,
      context: context,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    // 暂存反馈数据，等待用户填写
    this.feedbackQueue.push(feedbackData)
    
    Toast('反馈页面开发中...')
  }

  /**
   * 发送反馈
   */
  async sendFeedback(feedbackData) {
    try {
      await fetch('/admin/api/analytics/user_feedback.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedbackData)
      })
      
      Toast.success('反馈发送成功，感谢您的建议！')
    } catch (error) {
      Toast({ type: 'fail', message: '反馈发送失败，请稍后重试' })
    }
  }
}

// 创建全局实例
export const errorHandler = new ErrorHandler()
export const autoRecovery = new AutoRecovery(errorHandler)
export const feedbackCollector = new FeedbackCollector()

// 设置网络恢复
autoRecovery.setupNetworkRecovery()

// 全局错误捕获
window.addEventListener('error', (event) => {
  errorHandler.handle(event.error, {
    type: 'global_error',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  })
})

window.addEventListener('unhandledrejection', (event) => {
  errorHandler.handle(event.reason, {
    type: 'unhandled_promise_rejection'
  })
})

export default errorHandler 