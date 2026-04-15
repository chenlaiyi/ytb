/**
 * A/B测试框架
 */

// A/B测试配置
const AB_TEST_CONFIG = {
  // VIP招募页面测试
  vip_recruit_landing: {
    id: 'vip_recruit_landing',
    name: 'VIP招募落地页优化',
    enabled: true,
    traffic_percentage: 100, // 参与测试的流量百分比
    variants: [
      {
        id: 'control',
        name: '对照组（原版）',
        weight: 50,
        config: {
          theme: 'original',
          layout: 'standard',
          cta_text: '立即加入VIP',
          show_countdown: true,
          show_testimonials: false
        }
      },
      {
        id: 'variant_a',
        name: '变体A（优化版）',
        weight: 50,
        config: {
          theme: 'premium',
          layout: 'enhanced',
          cta_text: '立即升级VIP会员',
          show_countdown: true,
          show_testimonials: true,
          urgent_messaging: true
        }
      }
    ]
  },
  
  // 价格展示测试
  pricing_display: {
    id: 'pricing_display',
    name: '价格展示方式测试',
    enabled: true,
    traffic_percentage: 50,
    variants: [
      {
        id: 'control',
        name: '标准价格展示',
        weight: 50,
        config: {
          show_original_price: true,
          highlight_discount: false,
          payment_terms: 'standard'
        }
      },
      {
        id: 'variant_b',
        name: '强调优惠价格',
        weight: 50,
        config: {
          show_original_price: true,
          highlight_discount: true,
          payment_terms: 'emphasized',
          discount_badge: true
        }
      }
    ]
  }
}

/**
 * A/B测试管理器
 */
export class ABTestManager {
  constructor() {
    this.userId = null
    this.sessionId = this.generateSessionId()
    this.assignments = new Map()
    this.events = []
    this.initialized = false
  }

  /**
   * 初始化A/B测试
   */
  async initialize(userId = null) {
    this.userId = userId || 'anonymous_' + this.sessionId
    
    try {
      // 获取服务端的测试分组
      await this.fetchAssignments()
      this.initialized = true
      
      // 记录初始化事件
      this.trackEvent('ab_test_initialized', {
        user_id: this.userId,
        session_id: this.sessionId
      })
      
    } catch (error) {
      console.warn('A/B测试初始化失败，使用本地分组:', error)
      this.fallbackToLocalAssignment()
      this.initialized = true
    }
  }

  /**
   * 获取测试分组
   */
  getVariant(testId) {
    if (!this.initialized) {
      console.warn('A/B测试未初始化，返回默认分组')
      return this.getDefaultVariant(testId)
    }

    const assignment = this.assignments.get(testId)
    if (assignment) {
      return assignment
    }

    // 如果没有分组，进行本地分组
    const variant = this.assignVariant(testId)
    this.assignments.set(testId, variant)
    
    // 记录分组事件
    this.trackEvent('ab_test_assigned', {
      test_id: testId,
      variant_id: variant.id,
      user_id: this.userId
    })

    return variant
  }

  /**
   * 分配测试变体
   */
  assignVariant(testId) {
    const testConfig = AB_TEST_CONFIG[testId]
    if (!testConfig || !testConfig.enabled) {
      return this.getDefaultVariant(testId)
    }

    // 检查用户是否应该参与测试
    if (!this.shouldParticipate(testConfig.traffic_percentage)) {
      return this.getDefaultVariant(testId)
    }

    // 基于用户ID的稳定分组
    const hash = this.hashUserId(this.userId + testId)
    const variants = testConfig.variants
    
    let totalWeight = variants.reduce((sum, variant) => sum + variant.weight, 0)
    let randomValue = hash % totalWeight
    
    for (const variant of variants) {
      randomValue -= variant.weight
      if (randomValue < 0) {
        return variant
      }
    }
    
    // 降级到默认变体
    return variants[0] || this.getDefaultVariant(testId)
  }

  /**
   * 判断用户是否应该参与测试
   */
  shouldParticipate(trafficPercentage) {
    const hash = this.hashUserId(this.userId)
    return (hash % 100) < trafficPercentage
  }

  /**
   * 生成用户ID的哈希值
   */
  hashUserId(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return Math.abs(hash)
  }

  /**
   * 获取默认变体
   */
  getDefaultVariant(testId) {
    const testConfig = AB_TEST_CONFIG[testId]
    if (testConfig && testConfig.variants.length > 0) {
      return testConfig.variants[0]
    }
    
    return {
      id: 'control',
      name: '对照组',
      weight: 100,
      config: {}
    }
  }

  /**
   * 从服务端获取分组
   */
  async fetchAssignments() {
    const response = await fetch('/admin/api/analytics/ab_test_assignment.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: this.userId,
        session_id: this.sessionId,
        tests: Object.keys(AB_TEST_CONFIG)
      })
    })

    if (!response.ok) {
      throw new Error('获取A/B测试分组失败')
    }

    const data = await response.json()
    if (data.code === 0 && data.data.assignments) {
      data.data.assignments.forEach(assignment => {
        this.assignments.set(assignment.test_id, {
          id: assignment.variant_id,
          name: assignment.variant_name,
          config: assignment.config
        })
      })
    }
  }

  /**
   * 降级到本地分组
   */
  fallbackToLocalAssignment() {
    Object.keys(AB_TEST_CONFIG).forEach(testId => {
      const variant = this.assignVariant(testId)
      this.assignments.set(testId, variant)
    })
  }

  /**
   * 记录转化事件
   */
  trackConversion(testId, eventType, eventData = {}) {
    const variant = this.assignments.get(testId)
    if (!variant) {
      return
    }

    this.trackEvent('ab_test_conversion', {
      test_id: testId,
      variant_id: variant.id,
      event_type: eventType,
      event_data: eventData,
      user_id: this.userId,
      timestamp: Date.now()
    })
  }

  /**
   * 记录事件
   */
  trackEvent(eventType, eventData) {
    const event = {
      type: eventType,
      data: eventData,
      timestamp: Date.now(),
      url: window.location.href,
      user_agent: navigator.userAgent
    }

    this.events.push(event)
    
    // 异步发送事件
    this.sendEvents([event])
  }

  /**
   * 发送事件到服务端
   */
  async sendEvents(events) {
    try {
      await fetch('/admin/api/analytics/ab_test_events.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          events,
          session_id: this.sessionId
        })
      })
    } catch (error) {
      console.warn('A/B测试事件发送失败:', error)
    }
  }

  /**
   * 生成会话ID
   */
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  /**
   * 获取所有分组信息
   */
  getAllAssignments() {
    return Object.fromEntries(this.assignments)
  }

  /**
   * 获取测试配置
   */
  getTestConfig(testId) {
    return AB_TEST_CONFIG[testId]
  }

  /**
   * 批量发送积累的事件
   */
  flushEvents() {
    if (this.events.length > 0) {
      this.sendEvents([...this.events])
      this.events = []
    }
  }
}

/**
 * A/B测试辅助函数
 */
export class ABTestHelper {
  constructor(manager) {
    this.manager = manager
  }

  /**
   * 获取VIP招募页面的配置
   */
  getVipRecruitConfig() {
    const variant = this.manager.getVariant('vip_recruit_landing')
    return variant.config
  }

  /**
   * 获取价格显示配置
   */
  getPricingConfig() {
    const variant = this.manager.getVariant('pricing_display')
    return variant.config
  }

  /**
   * 应用主题配置
   */
  applyThemeConfig(config) {
    const theme = config.theme || 'original'
    document.documentElement.setAttribute('data-ab-theme', theme)
    
    if (config.urgent_messaging) {
      document.documentElement.setAttribute('data-urgent-mode', 'true')
    }
  }

  /**
   * 记录页面浏览
   */
  trackPageView(page) {
    Object.keys(AB_TEST_CONFIG).forEach(testId => {
      this.manager.trackConversion(testId, 'page_view', { page })
    })
  }

  /**
   * 记录按钮点击
   */
  trackButtonClick(buttonType, testId = null) {
    if (testId) {
      this.manager.trackConversion(testId, 'button_click', { button_type: buttonType })
    } else {
      // 记录到所有相关测试
      Object.keys(AB_TEST_CONFIG).forEach(testId => {
        this.manager.trackConversion(testId, 'button_click', { button_type: buttonType })
      })
    }
  }

  /**
   * 记录VIP升级
   */
  trackVipUpgrade() {
    Object.keys(AB_TEST_CONFIG).forEach(testId => {
      this.manager.trackConversion(testId, 'vip_upgrade', {
        success: true,
        conversion_time: Date.now()
      })
    })
  }

  /**
   * 记录支付完成
   */
  trackPaymentComplete(amount) {
    Object.keys(AB_TEST_CONFIG).forEach(testId => {
      this.manager.trackConversion(testId, 'payment_complete', {
        amount,
        success: true
      })
    })
  }
}

// 创建全局实例
export const abTestManager = new ABTestManager()
export const abTestHelper = new ABTestHelper(abTestManager)

// 页面卸载时发送事件
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    abTestManager.flushEvents()
  })
  
  // 定期发送事件
  setInterval(() => {
    abTestManager.flushEvents()
  }, 30000) // 每30秒发送一次
}

export default abTestManager 