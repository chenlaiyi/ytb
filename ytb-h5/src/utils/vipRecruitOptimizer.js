/**
 * VIP招募流程性能优化工具
 */

// 状态缓存配置
const CACHE_CONFIG = {
  RECRUIT_STATUS: {
    key: 'vip_recruit_status',
    duration: 5 * 60 * 1000, // 5分钟
  },
  USER_INFO: {
    key: 'vip_user_info',
    duration: 10 * 60 * 1000, // 10分钟
  },
  REFERRER_INFO: {
    key: 'vip_referrer_info',
    duration: 30 * 60 * 1000, // 30分钟
  }
}

/**
 * 智能缓存管理器
 */
class SmartCacheManager {
  constructor() {
    this.storage = localStorage
    this.memory = new Map()
  }

  /**
   * 获取缓存数据
   */
  get(key, useMemory = true) {
    // 优先从内存获取
    if (useMemory && this.memory.has(key)) {
      const memData = this.memory.get(key)
      if (this.isValid(memData)) {
        return memData.data
      }
      this.memory.delete(key)
    }

    // 从localStorage获取
    try {
      const stored = this.storage.getItem(key)
      if (stored) {
        const data = JSON.parse(stored)
        if (this.isValid(data)) {
          // 同步到内存
          if (useMemory) {
            this.memory.set(key, data)
          }
          return data.data
        }
        this.storage.removeItem(key)
      }
    } catch (error) {
      console.warn('缓存读取失败:', error)
      this.storage.removeItem(key)
    }

    return null
  }

  /**
   * 设置缓存数据
   */
  set(key, data, duration = 5 * 60 * 1000) {
    const cacheData = {
      data,
      timestamp: Date.now(),
      duration,
      version: '1.0'
    }

    try {
      // 存储到localStorage
      this.storage.setItem(key, JSON.stringify(cacheData))
      
      // 存储到内存
      this.memory.set(key, cacheData)
      
      return true
    } catch (error) {
      console.warn('缓存设置失败:', error)
      return false
    }
  }

  /**
   * 删除缓存
   */
  remove(key) {
    this.memory.delete(key)
    this.storage.removeItem(key)
  }

  /**
   * 清空所有VIP相关缓存
   */
  clearVipCache() {
    const vipKeys = ['vip_recruit_status', 'vip_user_info', 'vip_referrer_info']
    vipKeys.forEach(key => this.remove(key))
  }

  /**
   * 检查缓存是否有效
   */
  isValid(cacheData) {
    if (!cacheData || !cacheData.timestamp || !cacheData.duration) {
      return false
    }
    
    return (Date.now() - cacheData.timestamp) < cacheData.duration
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    return {
      memorySize: this.memory.size,
      storageUsed: this.getStorageUsed(),
      memoryKeys: Array.from(this.memory.keys())
    }
  }

  getStorageUsed() {
    let total = 0
    for (let key in localStorage) {
      if (key.startsWith('vip_')) {
        total += localStorage[key].length
      }
    }
    return total
  }
}

/**
 * 请求去重管理器
 */
class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map()
  }

  /**
   * 执行去重请求
   */
  async dedupe(key, requestFn) {
    // 如果相同请求正在进行中，返回现有的Promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)
    }

    // 创建新请求
    const requestPromise = requestFn()
      .finally(() => {
        // 请求完成后清理
        this.pendingRequests.delete(key)
      })

    this.pendingRequests.set(key, requestPromise)
    return requestPromise
  }

  /**
   * 清理所有待处理请求
   */
  clear() {
    this.pendingRequests.clear()
  }
}

/**
 * 状态预加载器
 */
class StatusPreloader {
  constructor(cacheManager, deduplicator) {
    this.cache = cacheManager
    this.deduplicator = deduplicator
  }

  /**
   * 预加载用户状态
   */
  async preloadUserStatus(referrerId) {
    const cacheKey = `${CACHE_CONFIG.RECRUIT_STATUS.key}_${referrerId}`
    
    // 检查缓存
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    // 发起请求
    const requestKey = `recruit_status_${referrerId}`
    return this.deduplicator.dedupe(requestKey, async () => {
      try {
        const response = await fetch('/admin/api/user/check_recruit_status.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': this.generateRequestId()
          },
          body: JSON.stringify({ referrer_id: referrerId })
        })

        const data = await response.json()
        
        if (data.code === 0) {
          // 缓存成功结果
          this.cache.set(cacheKey, data.data, CACHE_CONFIG.RECRUIT_STATUS.duration)
          return data.data
        }
        
        throw new Error(data.message || '状态检查失败')
      } catch (error) {
        console.error('预加载状态失败:', error)
        throw error
      }
    })
  }

  /**
   * 预加载推荐人信息
   */
  async preloadReferrerInfo(referrerId) {
    const cacheKey = `${CACHE_CONFIG.REFERRER_INFO.key}_${referrerId}`
    
    // 检查缓存
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    // 发起请求
    const requestKey = `referrer_info_${referrerId}`
    return this.deduplicator.dedupe(requestKey, async () => {
      try {
        const response = await fetch('/admin/api/user/get_referrer_info.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ referrer_id: referrerId })
        })

        const data = await response.json()
        
        if (data.code === 0) {
          // 缓存成功结果
          this.cache.set(cacheKey, data.data, CACHE_CONFIG.REFERRER_INFO.duration)
          return data.data
        }
        
        throw new Error(data.message || '获取推荐人信息失败')
      } catch (error) {
        console.error('预加载推荐人信息失败:', error)
        throw error
      }
    })
  }

  generateRequestId() {
    return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }
}

/**
 * 性能监控器
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoadTime: 0,
      apiCallCount: 0,
      cacheHitRate: 0,
      errorCount: 0
    }
    this.startTime = Date.now()
  }

  /**
   * 记录页面加载完成
   */
  recordPageLoad() {
    this.metrics.pageLoadTime = Date.now() - this.startTime
  }

  /**
   * 记录API调用
   */
  recordApiCall(success = true) {
    this.metrics.apiCallCount++
    if (!success) {
      this.metrics.errorCount++
    }
  }

  /**
   * 记录缓存命中
   */
  recordCacheHit(hit = true) {
    // 这里可以实现缓存命中率统计
  }

  /**
   * 获取性能指标
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.startTime
    }
  }

  /**
   * 发送性能数据到后端
   */
  async sendMetrics() {
    try {
      await fetch('/admin/api/analytics/performance.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metrics: this.getMetrics(),
          page: 'vip_recruit_landing',
          timestamp: Date.now()
        })
      })
    } catch (error) {
      console.warn('发送性能数据失败:', error)
    }
  }
}

// 创建单例实例
const cacheManager = new SmartCacheManager()
const requestDeduplicator = new RequestDeduplicator()
const statusPreloader = new StatusPreloader(cacheManager, requestDeduplicator)
const performanceMonitor = new PerformanceMonitor()

/**
 * VIP招募优化器主类
 */
export class VipRecruitOptimizer {
  constructor() {
    this.cache = cacheManager
    this.deduplicator = requestDeduplicator
    this.preloader = statusPreloader
    this.monitor = performanceMonitor
  }

  /**
   * 优化后的状态检查
   */
  async checkRecruitStatus(referrerId, options = {}) {
    const { forceRefresh = false, background = false } = options
    
    try {
      this.monitor.recordApiCall()
      
      if (!forceRefresh) {
        // 尝试从缓存获取
        const cached = await this.preloader.preloadUserStatus(referrerId)
        if (cached) {
          this.monitor.recordCacheHit(true)
          return cached
        }
      }

      // 强制刷新或缓存未命中
      this.cache.remove(`${CACHE_CONFIG.RECRUIT_STATUS.key}_${referrerId}`)
      const fresh = await this.preloader.preloadUserStatus(referrerId)
      
      this.monitor.recordCacheHit(false)
      return fresh
    } catch (error) {
      this.monitor.recordApiCall(false)
      throw error
    }
  }

  /**
   * 获取推荐人信息（新增方法）
   */
  async getReferrerInfo(referrerId, options = {}) {
    const { forceRefresh = false } = options
    const cacheKey = `${CACHE_CONFIG.REFERRER_INFO.key}_${referrerId}`
    
    try {
      this.monitor.recordApiCall()
      
      if (!forceRefresh) {
        // 尝试从缓存获取
        const cached = this.cache.get(cacheKey)
        if (cached) {
          this.monitor.recordCacheHit(true)
          return { code: 0, data: cached, message: '获取推荐人信息成功' }
        }
      }

      // 发起API请求
      const requestKey = `referrer_info_${referrerId}`
      const result = await this.deduplicator.dedupe(requestKey, async () => {
        const response = await fetch('/admin/api/user/get_referrer_info.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ referrer_id: referrerId })
        })

        const data = await response.json()
        
        if (data.code === 0) {
          // 缓存成功结果
          this.cache.set(cacheKey, data.data, CACHE_CONFIG.REFERRER_INFO.duration)
          this.monitor.recordCacheHit(false)
          return data
        }
        
        throw new Error(data.message || '获取推荐人信息失败')
      })

      return result
    } catch (error) {
      this.monitor.recordApiCall(false)
      console.error('获取推荐人信息失败:', error)
      return { 
        code: -1, 
        message: error.message || '网络错误，请重试',
        data: null 
      }
    }
  }

  /**
   * 批量预加载
   */
  async batchPreload(referrerId) {
    const promises = [
      this.preloader.preloadUserStatus(referrerId),
      this.preloader.preloadReferrerInfo(referrerId)
    ]

    try {
      const results = await Promise.allSettled(promises)
      return {
        status: results[0].status === 'fulfilled' ? results[0].value : null,
        referrer: results[1].status === 'fulfilled' ? results[1].value : null
      }
    } catch (error) {
      console.error('批量预加载失败:', error)
      return { status: null, referrer: null }
    }
  }

  /**
   * 清理和重置
   */
  cleanup() {
    this.cache.clearVipCache()
    this.deduplicator.clear()
  }

  /**
   * 获取优化器统计信息
   */
  getStats() {
    return {
      cache: this.cache.getStats(),
      performance: this.monitor.getMetrics()
    }
  }
}

// 导出单例
export const vipOptimizer = new VipRecruitOptimizer()

// 页面卸载时清理
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    vipOptimizer.monitor.sendMetrics()
  })
} 