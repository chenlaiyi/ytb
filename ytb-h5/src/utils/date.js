/**
 * 日期格式化工具函数
 */

const normalizeDateInput = (value) => {
  if (value == null) return value

  if (value instanceof Date) {
    return new Date(value.getTime())
  }

  if (typeof value === 'number') {
    return new Date(value)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return trimmed

    // 处理常见的 "YYYY-MM-DD HH:mm:ss" / "YYYY-MM-DD HH:mm" 格式
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
      return trimmed.replace(/\s+/, 'T')
    }

    // 仅日期的情况，补全时间部分，避免 iOS 解析失败
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return `${trimmed}T00:00:00`
    }

    return trimmed
  }

  return value
}

const createSafeDate = (input) => {
  const normalized = normalizeDateInput(input)
  const date = normalized instanceof Date ? normalized : new Date(normalized)

  if (!Number.isNaN(date.getTime())) {
    return date
  }

  // 兼容部分 iOS 设备对连字符格式的不支持
  if (typeof normalized === 'string' && normalized.includes('-')) {
    const fallback = normalized.replace(/-/g, '/').replace('T', ' ')
    const retry = new Date(fallback)
    if (!Number.isNaN(retry.getTime())) {
      return retry
    }
  }

  return new Date(NaN)
}

/**
 * 格式化日期时间
 * @param {String|Date|Number} date - 日期
 * @param {String} format - 格式化字符串，默认'YYYY-MM-DD HH:mm'
 * @returns {String} 格式化后的日期字符串
 */
export function formatDateTime(date, format = 'YYYY-MM-DD HH:mm') {
  if (date === undefined || date === null || date === '') return ''

  const d = createSafeDate(date)
  if (Number.isNaN(d.getTime())) return ''
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化日期
 * @param {String|Date} date - 日期
 * @returns {String} 格式化后的日期字符串
 */
export function formatDate(date) {
  return formatDateTime(date, 'YYYY-MM-DD')
}

/**
 * 格式化时间
 * @param {String|Date} date - 日期
 * @returns {String} 格式化后的时间字符串
 */
export function formatTime(date) {
  return formatDateTime(date, 'HH:mm')
}

/**
 * 获取相对时间描述
 * @param {String|Date} date - 日期
 * @returns {String} 相对时间描述
 */
export function getRelativeTime(date) {
  if (!date) return ''
  
  const d = createSafeDate(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day
  const month = 30 * day
  const year = 365 * day
  
  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return Math.floor(diff / minute) + '分钟前'
  } else if (diff < day) {
    return Math.floor(diff / hour) + '小时前'
  } else if (diff < week) {
    return Math.floor(diff / day) + '天前'
  } else if (diff < month) {
    return Math.floor(diff / week) + '周前'
  } else if (diff < year) {
    return Math.floor(diff / month) + '个月前'
  } else {
    return Math.floor(diff / year) + '年前'
  }
}

/**
 * 检查日期是否为今天
 * @param {String|Date} date - 日期
 * @returns {Boolean} 是否为今天
 */
export function isToday(date) {
  if (!date) return false
  
  const d = createSafeDate(date)
  const today = new Date()
  
  return d.toDateString() === today.toDateString()
}

/**
 * 检查日期是否为昨天
 * @param {String|Date} date - 日期
 * @returns {Boolean} 是否为昨天
 */
export function isYesterday(date) {
  if (!date) return false
  
  const d = createSafeDate(date)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  
  return d.toDateString() === yesterday.toDateString()
}

/**
 * 获取友好的日期描述
 * @param {String|Date} date - 日期
 * @returns {String} 友好的日期描述
 */
export function getFriendlyDate(date) {
  if (!date) return ''
  
  if (isToday(date)) {
    return '今天 ' + formatTime(date)
  }
  
  if (isYesterday(date)) {
    return '昨天 ' + formatTime(date)
  }

  return formatDateTime(date, 'MM-DD HH:mm')
}

/**
 * 解析日期字符串
 * @param {String} dateStr - 日期字符串
 * @returns {Date|null} 解析后的Date对象，失败返回null
 */
export function parseDate(dateStr) {
  if (!dateStr) return null
  
  const date = createSafeDate(dateStr)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * 获取当前日期
 * @param {String} format - 格式化字符串，默认'YYYY-MM-DD'
 * @returns {String} 格式化后的当前日期
 */
export function getCurrentDate(format = 'YYYY-MM-DD') {
  return formatDateTime(new Date(), format)
}

/**
 * 获取相对日期
 * @param {Number} days - 相对天数（正数为未来，负数为过去）
 * @param {String} format - 格式化字符串，默认'YYYY-MM-DD'
 * @returns {String} 格式化后的相对日期
 */
export function getRelativeDate(days, format = 'YYYY-MM-DD') {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return formatDateTime(date, format)
}

export default {
  formatDateTime,
  formatDate,
  formatTime,
  getRelativeTime,
  isToday,
  isYesterday,
  getFriendlyDate
}
