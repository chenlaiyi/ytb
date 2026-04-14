/**
 * 实时数据服务
 * 提供WebSocket连接和实时数据推送功能
 */

class RealTimeDataService {
  constructor() {
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectInterval = 3000
    this.listeners = new Map()
    this.isConnected = false
    this.heartbeatInterval = null
    this.heartbeatTimeout = 30000 // 30秒心跳超时
  }

  /**
   * 连接WebSocket
   */
  connect() {
    try {
      // 构建WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      const wsUrl = `${protocol}//${host}/ws/app-management`

      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('WebSocket连接已建立')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.startHeartbeat()
        this.emit('connected')
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (error) {
          console.error('解析WebSocket消息失败:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('WebSocket连接已关闭')
        this.isConnected = false
        this.stopHeartbeat()
        this.emit('disconnected')
        this.attemptReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket连接错误:', error)
        this.emit('error', error)
      }

    } catch (error) {
      console.error('创建WebSocket连接失败:', error)
      this.attemptReconnect()
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.stopHeartbeat()
    this.isConnected = false
  }

  /**
   * 尝试重连
   */
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        this.connect()
      }, this.reconnectInterval)
    } else {
      console.error('WebSocket重连失败，已达到最大重试次数')
      this.emit('reconnectFailed')
    }
  }

  /**
   * 开始心跳检测
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: 'ping',
          timestamp: Date.now()
        })
      }
    }, this.heartbeatTimeout)
  }

  /**
   * 停止心跳检测
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * 发送消息
   */
  send(data) {
    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket未连接，无法发送消息')
    }
  }

  /**
   * 处理接收到的消息
   */
  handleMessage(data) {
    const { type, payload } = data

    switch (type) {
      case 'pong':
        // 心跳响应
        break
      case 'stats_update':
        this.emit('statsUpdate', payload)
        break
      case 'user_activity':
        this.emit('userActivity', payload)
        break
      case 'notification_sent':
        this.emit('notificationSent', payload)
        break
      case 'feedback_received':
        this.emit('feedbackReceived', payload)
        break
      case 'version_released':
        this.emit('versionReleased', payload)
        break
      default:
        console.log('收到未知类型消息:', type, payload)
    }
  }

  /**
   * 订阅统计数据更新
   */
  subscribeToStats() {
    this.send({
      type: 'subscribe',
      channel: 'app_stats'
    })
  }

  /**
   * 订阅用户活动
   */
  subscribeToUserActivity() {
    this.send({
      type: 'subscribe',
      channel: 'user_activity'
    })
  }

  /**
   * 订阅通知状态
   */
  subscribeToNotifications() {
    this.send({
      type: 'subscribe',
      channel: 'notifications'
    })
  }

  /**
   * 事件监听器
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  /**
   * 移除事件监听器
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * 触发事件
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`事件监听器执行失败 (${event}):`, error)
        }
      })
    }
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      readyState: this.ws ? this.ws.readyState : WebSocket.CLOSED
    }
  }
}

// 创建单例实例
const realTimeDataService = new RealTimeDataService()

export default realTimeDataService
