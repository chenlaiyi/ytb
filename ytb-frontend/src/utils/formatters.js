// 日期格式化
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return '-'
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`
    case 'YYYY-MM-DD HH:mm':
      return `${year}-${month}-${day} ${hours}:${minutes}`
    case 'YYYY-MM-DD HH:mm:ss':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    case 'MM-DD':
      return `${month}-${day}`
    case 'HH:mm':
      return `${hours}:${minutes}`
    default:
      return `${year}-${month}-${day}`
  }
}

// 时间格式化
export function formatTime(date) {
  return formatDate(date, 'HH:mm')
}

// 日期时间格式化
export function formatDateTime(date) {
  return formatDate(date, 'YYYY-MM-DD HH:mm:ss')
}

// 金额格式化
export function formatMoney(amount, currency = '¥') {
  if (amount === null || amount === undefined) return '-'
  const num = parseFloat(amount)
  if (isNaN(num)) return '-'
  return `${currency}${num.toFixed(2)}`
}

// 数字格式化（千分位）
export function formatNumber(num) {
  if (num === null || num === undefined) return '-'
  const number = parseFloat(num)
  if (isNaN(number)) return '-'
  return number.toLocaleString()
}

// 文件大小格式化
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 状态格式化
export function formatStatus(status, statusMap = {}) {
  return statusMap[status] || status
}

// 手机号格式化（隐藏中间4位）
export function formatPhone(phone) {
  if (!phone) return '-'
  const phoneStr = String(phone)
  if (phoneStr.length === 11) {
    return phoneStr.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  }
  return phoneStr
}

// 身份证格式化（隐藏中间部分）
export function formatIdCard(idCard) {
  if (!idCard) return '-'
  const idStr = String(idCard)
  if (idStr.length === 18) {
    return idStr.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
  }
  return idStr
}

// 相对时间格式化
export function formatRelativeTime(date) {
  if (!date) return '-'
  
  const now = new Date()
  const target = new Date(date)
  const diff = now - target
  
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day
  const month = 30 * day
  const year = 365 * day
  
  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  } else if (diff < week) {
    return `${Math.floor(diff / day)}天前`
  } else if (diff < month) {
    return `${Math.floor(diff / week)}周前`
  } else if (diff < year) {
    return `${Math.floor(diff / month)}个月前`
  } else {
    return `${Math.floor(diff / year)}年前`
  }
}

// 获取状态类型（用于Element Plus的tag组件）
export function getStatusType(status) {
  const statusTypeMap = {
    // 通用状态
    'active': 'success',
    'inactive': 'info',
    'pending': 'warning',
    'disabled': 'danger',
    'success': 'success',
    'error': 'danger',
    'warning': 'warning',
    'info': 'info',
    
    // 订单状态
    'unpaid': 'warning',
    'paid': 'success',
    'shipped': 'primary',
    'delivered': 'success',
    'cancelled': 'danger',
    'refunded': 'info',
    
    // 用户状态
    'normal': 'success',
    'banned': 'danger',
    'frozen': 'warning',
    
    // 设备状态
    'online': 'success',
    'offline': 'danger',
    'maintenance': 'warning',
    
    // 安装状态
    'booked': 'warning',
    'assigned': 'primary',
    'installing': 'warning',
    'completed': 'success',
    'failed': 'danger',
    
    // 数字状态
    '0': 'danger',
    '1': 'success',
    '2': 'warning',
    '3': 'info'
  }
  
  return statusTypeMap[status] || 'info'
} 