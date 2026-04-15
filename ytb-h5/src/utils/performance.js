/**
 * VIP页面性能监控工具
 * 用于跟踪和分析页面性能指标
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: {},
      apiCalls: {},
      userInteractions: {},
      cacheHits: 0,
      cacheMisses: 0
    }
    this.startTime = Date.now()
  }

  // 记录页面加载时间
  recordPageLoad(pageName, startTime, endTime) {
    const duration = endTime - startTime
    this.metrics.pageLoad[pageName] = {
      duration,
      timestamp: Date.now()
    }
    console.log(`📊 [性能] ${pageName} 加载时间: ${duration}ms`)
  }

  // 记录API调用性能
  recordApiCall(apiName, startTime, endTime, success = true) {
    const duration = endTime - startTime
    if (!this.metrics.apiCalls[apiName]) {
      this.metrics.apiCalls[apiName] = {
        calls: 0,
        totalDuration: 0,
        successCount: 0,
        errorCount: 0
      }
    }
    
    const api = this.metrics.apiCalls[apiName]
    api.calls++
    api.totalDuration += duration
    
    if (success) {
      api.successCount++
    } else {
      api.errorCount++
    }
    
    const avgDuration = api.totalDuration / api.calls
    console.log(`📊 [API性能] ${apiName}: ${duration}ms (平均: ${avgDuration.toFixed(2)}ms)`)
  }

  // 记录用户交互性能
  recordUserInteraction(action, startTime, endTime) {
    const duration = endTime - startTime
    if (!this.metrics.userInteractions[action]) {
      this.metrics.userInteractions[action] = {
        count: 0,
        totalDuration: 0,
        maxDuration: 0,
        minDuration: Infinity
      }
    }
    
    const interaction = this.metrics.userInteractions[action]
    interaction.count++
    interaction.totalDuration += duration
    interaction.maxDuration = Math.max(interaction.maxDuration, duration)
    interaction.minDuration = Math.min(interaction.minDuration, duration)
    
    const avgDuration = interaction.totalDuration / interaction.count
    console.log(`📊 [交互性能] ${action}: ${duration}ms (平均: ${avgDuration.toFixed(2)}ms)`)
  }

  // 记录缓存命中
  recordCacheHit() {
    this.metrics.cacheHits++
    console.log(`📊 [缓存] 命中 +1 (总计: ${this.metrics.cacheHits})`)
  }

  // 记录缓存未命中
  recordCacheMiss() {
    this.metrics.cacheMisses++
    console.log(`📊 [缓存] 未命中 +1 (总计: ${this.metrics.cacheMisses})`)
  }

  // 获取缓存命中率
  getCacheHitRate() {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses
    if (total === 0) return 0
    return (this.metrics.cacheHits / total * 100).toFixed(2)
  }

  // 生成性能报告
  generateReport() {
    const report = {
      sessionDuration: Date.now() - this.startTime,
      cacheHitRate: this.getCacheHitRate(),
      apiPerformance: {},
      interactionPerformance: {},
      recommendations: []
    }

    // 分析API性能
    Object.keys(this.metrics.apiCalls).forEach(apiName => {
      const api = this.metrics.apiCalls[apiName]
      const avgDuration = api.totalDuration / api.calls
      const successRate = (api.successCount / api.calls * 100).toFixed(2)
      
      report.apiPerformance[apiName] = {
        averageDuration: avgDuration.toFixed(2),
        successRate: successRate,
        totalCalls: api.calls
      }

      // 性能建议
      if (avgDuration > 2000) {
        report.recommendations.push(`${apiName} API响应时间较慢 (${avgDuration.toFixed(2)}ms)，建议优化`)
      }
      if (successRate < 95) {
        report.recommendations.push(`${apiName} API成功率较低 (${successRate}%)，建议检查`)
      }
    })

    // 分析交互性能
    Object.keys(this.metrics.userInteractions).forEach(action => {
      const interaction = this.metrics.userInteractions[action]
      const avgDuration = interaction.totalDuration / interaction.count
      
      report.interactionPerformance[action] = {
        averageDuration: avgDuration.toFixed(2),
        maxDuration: interaction.maxDuration,
        minDuration: interaction.minDuration === Infinity ? 0 : interaction.minDuration,
        totalCount: interaction.count
      }

      // 交互性能建议
      if (avgDuration > 500) {
        report.recommendations.push(`${action} 交互响应时间较慢 (${avgDuration.toFixed(2)}ms)，建议优化`)
      }
    })

    // 缓存性能建议
    const cacheHitRate = parseFloat(this.getCacheHitRate())
    if (cacheHitRate < 50) {
      report.recommendations.push(`缓存命中率较低 (${cacheHitRate}%)，建议优化缓存策略`)
    }

    return report
  }

  // 打印性能报告
  printReport() {
    const report = this.generateReport()
    
    console.group('📊 VIP页面性能报告')
    console.log('会话时长:', (report.sessionDuration / 1000).toFixed(2), '秒')
    console.log('缓存命中率:', report.cacheHitRate + '%')
    
    console.group('API性能')
    Object.keys(report.apiPerformance).forEach(api => {
      const perf = report.apiPerformance[api]
      console.log(`${api}: 平均${perf.averageDuration}ms, 成功率${perf.successRate}%, 调用${perf.totalCalls}次`)
    })
    console.groupEnd()
    
    console.group('交互性能')
    Object.keys(report.interactionPerformance).forEach(action => {
      const perf = report.interactionPerformance[action]
      console.log(`${action}: 平均${perf.averageDuration}ms, 最大${perf.maxDuration}ms, 最小${perf.minDuration}ms`)
    })
    console.groupEnd()
    
    if (report.recommendations.length > 0) {
      console.group('优化建议')
      report.recommendations.forEach(rec => console.log('⚠️', rec))
      console.groupEnd()
    }
    
    console.groupEnd()
    
    return report
  }

  // 导出性能数据
  exportData() {
    return {
      timestamp: Date.now(),
      metrics: this.metrics,
      report: this.generateReport()
    }
  }
}

// 创建全局性能监控实例
const performanceMonitor = new PerformanceMonitor()

// 导出工具函数
export const perf = {
  // 开始计时
  start: (label) => {
    const startTime = Date.now()
    return {
      end: () => Date.now() - startTime,
      startTime
    }
  },

  // 记录页面加载
  recordPageLoad: (pageName, duration) => {
    performanceMonitor.recordPageLoad(pageName, Date.now() - duration, Date.now())
  },

  // 记录API调用
  recordApiCall: (apiName, duration, success = true) => {
    performanceMonitor.recordApiCall(apiName, Date.now() - duration, Date.now(), success)
  },

  // 记录用户交互
  recordInteraction: (action, duration) => {
    performanceMonitor.recordUserInteraction(action, Date.now() - duration, Date.now())
  },

  // 记录缓存
  cacheHit: () => performanceMonitor.recordCacheHit(),
  cacheMiss: () => performanceMonitor.recordCacheMiss(),

  // 获取报告
  getReport: () => performanceMonitor.generateReport(),
  printReport: () => performanceMonitor.printReport(),
  
  // 导出数据
  export: () => performanceMonitor.exportData(),

  // 监控实例
  monitor: performanceMonitor
}

export default perf 