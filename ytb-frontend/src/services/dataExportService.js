/**
 * 数据导出服务
 * 提供各种格式的数据导出功能
 */

import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

class DataExportService {
  constructor() {
    this.exportFormats = ['xlsx', 'csv', 'json', 'pdf']
    this.maxExportRows = 10000 // 最大导出行数限制
  }

  /**
   * 导出用户数据
   */
  async exportUsers(users, options = {}) {
    const {
      format = 'xlsx',
      filename = '用户数据',
      columns = null,
      filters = {}
    } = options

    try {
      // 数据预处理
      const processedData = this.processUserData(users, columns, filters)
      
      // 根据格式导出
      switch (format) {
        case 'xlsx':
          return await this.exportToExcel(processedData, filename, '用户列表')
        case 'csv':
          return await this.exportToCSV(processedData, filename)
        case 'json':
          return await this.exportToJSON(processedData, filename)
        case 'pdf':
          return await this.exportToPDF(processedData, filename, '用户数据报表')
        default:
          throw new Error(`不支持的导出格式: ${format}`)
      }
    } catch (error) {
      console.error('导出用户数据失败:', error)
      throw error
    }
  }

  /**
   * 导出统计报表
   */
  async exportStatistics(statsData, options = {}) {
    const {
      format = 'xlsx',
      filename = '统计报表',
      dateRange = null,
      includeCharts = false
    } = options

    try {
      const processedData = this.processStatisticsData(statsData, dateRange)
      
      if (format === 'xlsx' && includeCharts) {
        return await this.exportStatisticsWithCharts(processedData, filename)
      } else {
        return await this.exportToExcel(processedData, filename, '统计数据')
      }
    } catch (error) {
      console.error('导出统计报表失败:', error)
      throw error
    }
  }

  /**
   * 导出反馈数据
   */
  async exportFeedback(feedbackList, options = {}) {
    const {
      format = 'xlsx',
      filename = '用户反馈',
      includeImages = false,
      statusFilter = null
    } = options

    try {
      const processedData = this.processFeedbackData(feedbackList, statusFilter, includeImages)
      
      switch (format) {
        case 'xlsx':
          return await this.exportToExcel(processedData, filename, '反馈列表')
        case 'csv':
          return await this.exportToCSV(processedData, filename)
        default:
          throw new Error(`反馈导出不支持格式: ${format}`)
      }
    } catch (error) {
      console.error('导出反馈数据失败:', error)
      throw error
    }
  }

  /**
   * 导出通知数据
   */
  async exportNotifications(notifications, options = {}) {
    const {
      format = 'xlsx',
      filename = '通知记录',
      includeStats = true
    } = options

    try {
      const processedData = this.processNotificationData(notifications, includeStats)
      return await this.exportToExcel(processedData, filename, '通知记录')
    } catch (error) {
      console.error('导出通知数据失败:', error)
      throw error
    }
  }

  /**
   * 处理用户数据
   */
  processUserData(users, columns, filters) {
    let filteredUsers = users

    // 应用过滤器
    if (filters.status) {
      filteredUsers = filteredUsers.filter(user => user.status === filters.status)
    }
    if (filters.role) {
      filteredUsers = filteredUsers.filter(user => user.role === filters.role)
    }
    if (filters.dateRange) {
      const [startDate, endDate] = filters.dateRange
      filteredUsers = filteredUsers.filter(user => {
        const userDate = new Date(user.created_at)
        return userDate >= startDate && userDate <= endDate
      })
    }

    // 数据量限制检查
    if (filteredUsers.length > this.maxExportRows) {
      throw new Error(`导出数据量过大，最多支持 ${this.maxExportRows} 条记录`)
    }

    // 选择列
    const defaultColumns = [
      { key: 'id', title: 'ID' },
      { key: 'name', title: '姓名' },
      { key: 'phone', title: '手机号' },
      { key: 'email', title: '邮箱' },
      { key: 'role', title: '角色' },
      { key: 'status', title: '状态' },
      { key: 'created_at', title: '注册时间' },
      { key: 'last_login_at', title: '最后登录' }
    ]

    const selectedColumns = columns || defaultColumns

    return filteredUsers.map(user => {
      const row = {}
      selectedColumns.forEach(col => {
        let value = user[col.key]
        
        // 数据格式化
        if (col.key.includes('_at') && value) {
          value = this.formatDateTime(value)
        } else if (col.key === 'status') {
          value = this.formatStatus(value)
        } else if (col.key === 'role') {
          value = this.formatRole(value)
        }
        
        row[col.title] = value || ''
      })
      return row
    })
  }

  /**
   * 处理统计数据
   */
  processStatisticsData(statsData, dateRange) {
    const sheets = {}

    // 用户统计
    if (statsData.userStats) {
      sheets['用户统计'] = this.formatUserStats(statsData.userStats)
    }

    // 收入统计
    if (statsData.revenueStats) {
      sheets['收入统计'] = this.formatRevenueStats(statsData.revenueStats)
    }

    // 平台分布
    if (statsData.platformStats) {
      sheets['平台分布'] = this.formatPlatformStats(statsData.platformStats)
    }

    // 版本分布
    if (statsData.versionStats) {
      sheets['版本分布'] = this.formatVersionStats(statsData.versionStats)
    }

    return sheets
  }

  /**
   * 处理反馈数据
   */
  processFeedbackData(feedbackList, statusFilter, includeImages) {
    let filteredFeedback = feedbackList

    if (statusFilter) {
      filteredFeedback = filteredFeedback.filter(item => item.status === statusFilter)
    }

    return filteredFeedback.map(item => ({
      'ID': item.id,
      '用户': item.user_name || item.user_id,
      '反馈类型': this.formatFeedbackType(item.type),
      '标题': item.title,
      '内容': item.content,
      '优先级': this.formatPriority(item.priority),
      '状态': this.formatFeedbackStatus(item.status),
      '满意度': item.satisfaction ? `${item.satisfaction}分` : '',
      '提交时间': this.formatDateTime(item.created_at),
      '处理时间': item.handled_at ? this.formatDateTime(item.handled_at) : '',
      '图片数量': includeImages ? (item.images?.length || 0) : ''
    }))
  }

  /**
   * 处理通知数据
   */
  processNotificationData(notifications, includeStats) {
    const data = notifications.map(item => ({
      'ID': item.id,
      '通知类型': this.formatNotificationType(item.type),
      '标题': item.title,
      '内容': item.content.substring(0, 100) + (item.content.length > 100 ? '...' : ''),
      '目标用户': this.formatTargetUsers(item.target_users),
      '发送状态': this.formatSendStatus(item.status),
      '阅读率': item.read_rate ? `${(item.read_rate * 100).toFixed(1)}%` : '',
      '发送时间': this.formatDateTime(item.sent_at),
      '创建时间': this.formatDateTime(item.created_at)
    }))

    if (includeStats) {
      // 添加统计信息
      const stats = this.calculateNotificationStats(notifications)
      return {
        '通知记录': data,
        '统计汇总': stats
      }
    }

    return data
  }

  /**
   * 导出到Excel
   */
  async exportToExcel(data, filename, sheetName = 'Sheet1') {
    try {
      const wb = XLSX.utils.book_new()

      if (typeof data === 'object' && !Array.isArray(data)) {
        // 多个工作表
        Object.keys(data).forEach(key => {
          const ws = XLSX.utils.json_to_sheet(data[key])
          this.autoFitColumns(ws, data[key])
          XLSX.utils.book_append_sheet(wb, ws, key)
        })
      } else {
        // 单个工作表
        const ws = XLSX.utils.json_to_sheet(data)
        this.autoFitColumns(ws, data)
        XLSX.utils.book_append_sheet(wb, ws, sheetName)
      }

      // 生成文件
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/octet-stream' })
      
      saveAs(blob, `${filename}_${this.formatDate(new Date())}.xlsx`)
      
      return {
        success: true,
        filename: `${filename}_${this.formatDate(new Date())}.xlsx`,
        rows: Array.isArray(data) ? data.length : Object.values(data).reduce((sum, arr) => sum + arr.length, 0)
      }
    } catch (error) {
      console.error('Excel导出失败:', error)
      throw error
    }
  }

  /**
   * 导出到CSV
   */
  async exportToCSV(data, filename) {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('CSV导出需要数组格式的数据')
      }

      const headers = Object.keys(data[0])
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            let value = row[header] || ''
            // 处理包含逗号、引号或换行符的值
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              value = `"${value.replace(/"/g, '""')}"`
            }
            return value
          }).join(',')
        )
      ].join('\n')

      // 添加BOM以支持中文
      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })
      
      saveAs(blob, `${filename}_${this.formatDate(new Date())}.csv`)
      
      return {
        success: true,
        filename: `${filename}_${this.formatDate(new Date())}.csv`,
        rows: data.length
      }
    } catch (error) {
      console.error('CSV导出失败:', error)
      throw error
    }
  }

  /**
   * 导出到JSON
   */
  async exportToJSON(data, filename) {
    try {
      const jsonContent = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })
      
      saveAs(blob, `${filename}_${this.formatDate(new Date())}.json`)
      
      return {
        success: true,
        filename: `${filename}_${this.formatDate(new Date())}.json`,
        rows: Array.isArray(data) ? data.length : Object.keys(data).length
      }
    } catch (error) {
      console.error('JSON导出失败:', error)
      throw error
    }
  }

  /**
   * 自动调整列宽
   */
  autoFitColumns(worksheet, data) {
    if (!data || data.length === 0) return

    const colWidths = {}
    const headers = Object.keys(data[0])

    // 计算每列的最大宽度
    headers.forEach(header => {
      colWidths[header] = header.length
    })

    data.forEach(row => {
      headers.forEach(header => {
        const value = String(row[header] || '')
        colWidths[header] = Math.max(colWidths[header], value.length)
      })
    })

    // 设置列宽（限制最大宽度）
    worksheet['!cols'] = headers.map(header => ({
      wch: Math.min(colWidths[header] + 2, 50)
    }))
  }

  /**
   * 格式化日期时间
   */
  formatDateTime(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  /**
   * 格式化日期
   */
  formatDate(date) {
    return date.toISOString().split('T')[0].replace(/-/g, '')
  }

  /**
   * 格式化状态
   */
  formatStatus(status) {
    const statusMap = {
      'active': '正常',
      'inactive': '禁用',
      'pending': '待审核',
      'banned': '已封禁'
    }
    return statusMap[status] || status
  }

  /**
   * 格式化角色
   */
  formatRole(role) {
    const roleMap = {
      'admin': '管理员',
      'user': '普通用户',
      'vip': 'VIP用户',
      'agent': '业务员',
      'merchant': '商户'
    }
    return roleMap[role] || role
  }

  /**
   * 格式化反馈类型
   */
  formatFeedbackType(type) {
    const typeMap = {
      'bug': '问题反馈',
      'suggestion': '功能建议',
      'complaint': '投诉',
      'praise': '表扬',
      'other': '其他'
    }
    return typeMap[type] || type
  }

  /**
   * 格式化优先级
   */
  formatPriority(priority) {
    const priorityMap = {
      'high': '高',
      'medium': '中',
      'low': '低'
    }
    return priorityMap[priority] || priority
  }

  /**
   * 计算通知统计
   */
  calculateNotificationStats(notifications) {
    const total = notifications.length
    const sent = notifications.filter(n => n.status === 'sent').length
    const pending = notifications.filter(n => n.status === 'pending').length
    const failed = notifications.filter(n => n.status === 'failed').length
    
    const avgReadRate = notifications
      .filter(n => n.read_rate !== null)
      .reduce((sum, n) => sum + n.read_rate, 0) / notifications.filter(n => n.read_rate !== null).length

    return [
      { '指标': '通知总数', '数值': total },
      { '指标': '已发送', '数值': sent },
      { '指标': '待发送', '数值': pending },
      { '指标': '发送失败', '数值': failed },
      { '指标': '平均阅读率', '数值': avgReadRate ? `${(avgReadRate * 100).toFixed(1)}%` : '0%' }
    ]
  }

  /**
   * 获取支持的导出格式
   */
  getSupportedFormats() {
    return this.exportFormats.map(format => ({
      value: format,
      label: format.toUpperCase()
    }))
  }

  /**
   * 验证导出参数
   */
  validateExportParams(data, options) {
    if (!data || (Array.isArray(data) && data.length === 0)) {
      throw new Error('没有可导出的数据')
    }

    if (Array.isArray(data) && data.length > this.maxExportRows) {
      throw new Error(`数据量过大，最多支持导出 ${this.maxExportRows} 条记录`)
    }

    if (options.format && !this.exportFormats.includes(options.format)) {
      throw new Error(`不支持的导出格式: ${options.format}`)
    }

    return true
  }
}

// 创建单例实例
const dataExportService = new DataExportService()

export default dataExportService
