/**
 * 移动端和微信浏览器优化工具
 */

import { Toast } from 'vant'

/**
 * 移动端优化器
 */
export class MobileOptimizer {
  constructor() {
    this.isWeChat = this.detectWeChat()
    this.isIOS = this.detectIOS()
    this.isAndroid = this.detectAndroid()
    this.screenInfo = this.getScreenInfo()
    this.networkInfo = this.getNetworkInfo()
    
    this.initializeOptimizations()
  }

  /**
   * 检测微信环境
   */
  detectWeChat() {
    return /MicroMessenger/i.test(navigator.userAgent)
  }

  /**
   * 检测iOS设备
   */
  detectIOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent)
  }

  /**
   * 检测Android设备
   */
  detectAndroid() {
    return /Android/i.test(navigator.userAgent)
  }

  /**
   * 获取屏幕信息
   */
  getScreenInfo() {
    return {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      orientation: this.getOrientation()
    }
  }

  /**
   * 获取屏幕方向
   */
  getOrientation() {
    if (screen.orientation) {
      return screen.orientation.angle
    }
    return window.orientation || 0
  }

  /**
   * 获取网络信息
   */
  getNetworkInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    if (connection) {
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      }
    }
    return null
  }

  /**
   * 初始化优化措施
   */
  initializeOptimizations() {
    this.setupViewportFix()
    this.setupTouchOptimizations()
    this.setupWeChatOptimizations()
    this.setupScrollOptimizations()
    this.setupPerformanceOptimizations()
  }

  /**
   * 设置视口修复
   */
  setupViewportFix() {
    // 防止iOS Safari双击缩放
    if (this.isIOS) {
      let lastTouchEnd = 0
      document.addEventListener('touchend', (event) => {
        const now = Date.now()
        if (now - lastTouchEnd <= 300) {
          event.preventDefault()
        }
        lastTouchEnd = now
      })
    }

    // 处理Android软键盘问题
    if (this.isAndroid) {
      let originalHeight = window.innerHeight
      
      window.addEventListener('resize', () => {
        const currentHeight = window.innerHeight
        const heightDiff = originalHeight - currentHeight
        
        // 检测软键盘是否弹出
        if (heightDiff > 150) {
          document.body.classList.add('keyboard-open')
          this.handleKeyboardOpen(heightDiff)
        } else {
          document.body.classList.remove('keyboard-open')
          this.handleKeyboardClose()
        }
      })
    }
  }

  /**
   * 设置触摸优化
   */
  setupTouchOptimizations() {
    // 优化点击延迟
    let touchStartTime = 0
    let touchStartTarget = null

    document.addEventListener('touchstart', (event) => {
      touchStartTime = Date.now()
      touchStartTarget = event.target
    }, { passive: true })

    document.addEventListener('touchend', (event) => {
      const touchEndTime = Date.now()
      const touchDuration = touchEndTime - touchStartTime
      
      // 快速点击处理
      if (touchDuration < 150 && event.target === touchStartTarget) {
        // 触发快速点击事件
        this.handleFastTap(event.target)
      }
    }, { passive: true })

    // 防止页面滚动时的误触
    let isScrolling = false
    let scrollTimeout

    document.addEventListener('touchmove', () => {
      isScrolling = true
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        isScrolling = false
      }, 150)
    }, { passive: true })

    // 优化滚动性能
    document.addEventListener('scroll', this.throttle(() => {
      this.optimizeScrollPerformance()
    }, 16), { passive: true })
  }

  /**
   * 设置微信优化
   */
  setupWeChatOptimizations() {
    if (!this.isWeChat) return

    // 监听微信JS-SDK加载
    this.waitForWeChatSDK(() => {
      this.configureWeChatSDK()
    })

    // 优化微信分享
    this.setupWeChatShare()

    // 处理微信支付
    this.setupWeChatPay()

    // 微信内网页性能优化
    this.optimizeWeChatPerformance()
  }

  /**
   * 等待微信SDK加载
   */
  waitForWeChatSDK(callback, timeout = 5000) {
    const startTime = Date.now()
    
    const check = () => {
      if (typeof wx !== 'undefined' && wx.config) {
        callback()
      } else if (Date.now() - startTime < timeout) {
        setTimeout(check, 100)
      } else {
        console.warn('微信SDK加载超时')
      }
    }
    
    check()
  }

  /**
   * 配置微信SDK
   */
  async configureWeChatSDK() {
    try {
      // 获取微信配置
      const config = await this.getWeChatConfig()
      
      wx.config({
        debug: false,
        appId: config.appId,
        timestamp: config.timestamp,
        nonceStr: config.nonceStr,
        signature: config.signature,
        jsApiList: [
          'chooseWXPay',
          'updateAppMessageShareData',
          'updateTimelineShareData',
          'getLocation',
          'scanQRCode'
        ]
      })

      wx.ready(() => {
        console.log('微信SDK配置成功')
        this.isWeChatSDKReady = true
      })

      wx.error((res) => {
        console.error('微信SDK配置失败:', res)
      })
    } catch (error) {
      console.error('获取微信配置失败:', error)
    }
  }

  /**
   * 获取微信配置
   */
  async getWeChatConfig() {
    const response = await fetch('/admin/api/wechat/get_js_config.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: window.location.href.split('#')[0]
      })
    })

    const data = await response.json()
    if (data.code === 0) {
      return data.data
    }
    throw new Error(data.message || '获取微信配置失败')
  }

  /**
   * 设置微信分享
   */
  setupWeChatShare() {
    const shareData = {
      title: 'VIP会员邀请 - 点点够',
      desc: '邀请您加入VIP会员，享受专属权益和分红收益',
      link: window.location.href,
      imgUrl: 'https://pay.itapgo.com/app/images/vip/share-logo.jpg'
    }

    // 等待SDK准备完成
    this.waitForWeChatSDK(() => {
      wx.ready(() => {
        // 朋友圈分享
        wx.updateTimelineShareData(shareData)
        
        // 好友分享
        wx.updateAppMessageShareData(shareData)
      })
    })
  }

  /**
   * 设置微信支付
   */
  setupWeChatPay() {
    this.wechatPay = {
      /**
       * 调起微信支付
       */
      pay: (paymentParams) => {
        return new Promise((resolve, reject) => {
          if (!this.isWeChat) {
            reject(new Error('请在微信中打开'))
            return
          }

          if (!this.isWeChatSDKReady) {
            reject(new Error('微信SDK未准备就绪'))
            return
          }

          wx.chooseWXPay({
            ...paymentParams,
            success: (res) => {
              resolve(res)
            },
            fail: (res) => {
              reject(new Error(res.errMsg || '支付失败'))
            }
          })
        })
      }
    }
  }

  /**
   * 优化微信内网页性能
   */
  optimizeWeChatPerformance() {
    // 预连接微信域名
    this.preconnectDomains([
      'https://res.wx.qq.com',
      'https://mmbiz.qpic.cn'
    ])

    // 优化图片加载
    this.optimizeImageLoading()

    // 减少重绘重排
    this.reduceReflows()
  }

  /**
   * 设置滚动优化
   */
  setupScrollOptimizations() {
    // 使用CSS containment
    const scrollContainers = document.querySelectorAll('.scroll-container')
    scrollContainers.forEach(container => {
      container.style.contain = 'layout style paint'
    })

    // 虚拟滚动支持
    this.setupVirtualScroll()

    // 滚动监听优化
    this.setupScrollSpy()
  }

  /**
   * 设置性能优化
   */
  setupPerformanceOptimizations() {
    // 图片懒加载
    this.setupLazyLoading()

    // 预加载关键资源
    this.preloadCriticalResources()

    // 内存优化
    this.setupMemoryOptimization()

    // 帧率优化
    this.setupFrameRateOptimization()
  }

  /**
   * 处理软键盘弹出
   */
  handleKeyboardOpen(heightDiff) {
    const activeElement = document.activeElement
    if (activeElement && activeElement.tagName === 'INPUT') {
      // 滚动到输入框
      setTimeout(() => {
        activeElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        })
      }, 100)
    }
  }

  /**
   * 处理软键盘关闭
   */
  handleKeyboardClose() {
    // 恢复页面布局
    window.scrollTo(0, 0)
  }

  /**
   * 处理快速点击
   */
  handleFastTap(target) {
    // 添加快速点击反馈
    target.classList.add('fast-tap')
    setTimeout(() => {
      target.classList.remove('fast-tap')
    }, 150)
  }

  /**
   * 优化滚动性能
   */
  optimizeScrollPerformance() {
    // 虚拟化长列表
    const longLists = document.querySelectorAll('.long-list')
    longLists.forEach(list => {
      this.virtualizeList(list)
    })
  }

  /**
   * 设置虚拟滚动
   */
  setupVirtualScroll() {
    // 实现虚拟滚动逻辑
  }

  /**
   * 设置滚动监听
   */
  setupScrollSpy() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.handleElementVisible(entry.target)
        }
      })
    }, {
      threshold: 0.1
    })

    // 观察需要滚动监听的元素
    document.querySelectorAll('[data-scroll-spy]').forEach(el => {
      observer.observe(el)
    })
  }

  /**
   * 设置懒加载
   */
  setupLazyLoading() {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target
          const src = img.dataset.src
          if (src) {
            img.src = src
            img.removeAttribute('data-src')
            imageObserver.unobserve(img)
          }
        }
      })
    })

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img)
    })
  }

  /**
   * 预加载关键资源
   */
  preloadCriticalResources() {
    const criticalImages = [
      '/app/images/vip/crown.png',
      '/app/images/vip/diamond.png'
    ]

    criticalImages.forEach(src => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = src
      document.head.appendChild(link)
    })
  }

  /**
   * 预连接域名
   */
  preconnectDomains(domains) {
    domains.forEach(domain => {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = domain
      document.head.appendChild(link)
    })
  }

  /**
   * 优化图片加载
   */
  optimizeImageLoading() {
    // 根据网络状况调整图片质量
    if (this.networkInfo && this.networkInfo.effectiveType) {
      const quality = this.getImageQuality()
      document.documentElement.setAttribute('data-image-quality', quality)
    }
  }

  /**
   * 获取图片质量设置
   */
  getImageQuality() {
    if (!this.networkInfo) return 'auto'
    
    const { effectiveType, saveData } = this.networkInfo
    
    if (saveData) return 'low'
    
    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'low'
      case '3g':
        return 'medium'
      case '4g':
      default:
        return 'high'
    }
  }

  /**
   * 减少重绘重排
   */
  reduceReflows() {
    // 批量DOM操作
    this.batchDOMUpdates = []
    this.scheduledUpdate = false

    this.batchUpdate = (callback) => {
      this.batchDOMUpdates.push(callback)
      
      if (!this.scheduledUpdate) {
        this.scheduledUpdate = true
        requestAnimationFrame(() => {
          this.batchDOMUpdates.forEach(update => update())
          this.batchDOMUpdates = []
          this.scheduledUpdate = false
        })
      }
    }
  }

  /**
   * 设置内存优化
   */
  setupMemoryOptimization() {
    // 清理未使用的事件监听器
    this.cleanupEventListeners()

    // 定期清理缓存
    setInterval(() => {
      this.cleanupCache()
    }, 300000) // 5分钟清理一次
  }

  /**
   * 设置帧率优化
   */
  setupFrameRateOptimization() {
    let lastFrameTime = performance.now()
    let frameCount = 0
    let fps = 60

    const measureFPS = (currentTime) => {
      frameCount++
      
      if (currentTime - lastFrameTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastFrameTime))
        frameCount = 0
        lastFrameTime = currentTime
        
        // 根据帧率调整性能策略
        this.adjustPerformanceStrategy(fps)
      }
      
      requestAnimationFrame(measureFPS)
    }
    
    requestAnimationFrame(measureFPS)
  }

  /**
   * 根据帧率调整性能策略
   */
  adjustPerformanceStrategy(fps) {
    if (fps < 30) {
      // 低帧率，启用性能模式
      document.body.classList.add('performance-mode')
      this.reduceAnimations()
    } else if (fps > 50) {
      // 高帧率，可以启用更多特效
      document.body.classList.remove('performance-mode')
    }
  }

  /**
   * 减少动画
   */
  reduceAnimations() {
    const animations = document.getAnimations()
    animations.forEach(animation => {
      animation.playbackRate = 0.5 // 减慢动画速度
    })
  }

  /**
   * 清理事件监听器
   */
  cleanupEventListeners() {
    // 实现事件监听器清理逻辑
  }

  /**
   * 清理缓存
   */
  cleanupCache() {
    // 清理过期的缓存数据
    const now = Date.now()
    const expiredKeys = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('cache_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key))
          if (data.expiry && data.expiry < now) {
            expiredKeys.push(key)
          }
        } catch (e) {
          expiredKeys.push(key)
        }
      }
    }
    
    expiredKeys.forEach(key => localStorage.removeItem(key))
  }

  /**
   * 处理元素可见
   */
  handleElementVisible(element) {
    // 触发元素可见事件
    element.classList.add('visible')
    
    // 如果是图片，触发加载
    if (element.tagName === 'IMG' && element.dataset.src) {
      element.src = element.dataset.src
    }
  }

  /**
   * 虚拟化列表
   */
  virtualizeList(listElement) {
    // 实现列表虚拟化逻辑
  }

  /**
   * 节流函数
   */
  throttle(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  /**
   * 防抖函数
   */
  debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  /**
   * 获取设备信息
   */
  getDeviceInfo() {
    return {
      isWeChat: this.isWeChat,
      isIOS: this.isIOS,
      isAndroid: this.isAndroid,
      screenInfo: this.screenInfo,
      networkInfo: this.networkInfo,
      performance: {
        memory: performance.memory ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        } : null
      }
    }
  }
}

// 创建全局实例
export const mobileOptimizer = new MobileOptimizer()

// 自动初始化
if (typeof window !== 'undefined') {
  // 等待DOM加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      mobileOptimizer.initializeOptimizations()
    })
  } else {
    mobileOptimizer.initializeOptimizations()
  }
}

export default mobileOptimizer 