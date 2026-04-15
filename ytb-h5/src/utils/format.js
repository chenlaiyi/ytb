/**
 * 格式化日期
 * @param {Date|string|number} date 日期对象、日期字符串或时间戳
 * @param {string} format 格式化模式，例如：'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return ''
  
  // 将日期统一转换为Date对象
  let dateObj
  if (date instanceof Date) {
    dateObj = date
  } else if (typeof date === 'string') {
    dateObj = new Date(date.replace(/-/g, '/')) // 兼容iOS
  } else if (typeof date === 'number') {
    dateObj = new Date(date)
  } else {
    return ''
  }
  
  // 处理无效日期
  if (isNaN(dateObj.getTime())) {
    return ''
  }
  
  const year = dateObj.getFullYear()
  const month = dateObj.getMonth() + 1
  const day = dateObj.getDate()
  const hours = dateObj.getHours()
  const minutes = dateObj.getMinutes()
  const seconds = dateObj.getSeconds()
  
  // 补零函数
  const padZero = (num) => String(num).padStart(2, '0')
  
  const formatMap = {
    YYYY: String(year),
    YY: String(year).slice(2),
    MM: padZero(month),
    M: String(month),
    DD: padZero(day),
    D: String(day),
    HH: padZero(hours),
    H: String(hours),
    mm: padZero(minutes),
    m: String(minutes),
    ss: padZero(seconds),
    s: String(seconds)
  }
  
  return format.replace(/YYYY|YY|MM|M|DD|D|HH|H|mm|m|ss|s/g, (match) => formatMap[match])
}

/**
 * 格式化金额，保留两位小数
 * @param {number|string} amount 金额
 * @param {number} decimal 小数位数，默认2位
 * @param {string} prefix 前缀，例如：'¥'
 * @returns {string} 格式化后的金额字符串
 */
export function formatAmount(amount, decimal = 2, prefix = '¥') {
  if (amount === null || amount === undefined || amount === '') {
    return `${prefix}0.00`
  }
  
  // 转换为数字
  const num = parseFloat(amount)
  if (isNaN(num)) {
    return `${prefix}0.00`
  }
  
  // 格式化金额
  return `${prefix}${num.toFixed(decimal)}`
}

/**
 * 数字千分位格式化
 * @param {number|string} num 需要格式化的数字
 * @returns {string} 格式化后的字符串
 */
export function formatThousands(num) {
  if (num === null || num === undefined || num === '') {
    return '0'
  }
  
  // 转换为数字
  const numValue = parseFloat(num)
  if (isNaN(numValue)) {
    return '0'
  }
  
  // 格式化带千分位的数字
  return numValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 格式化手机号码，如：138****8888
 * @param {string} phone 手机号码
 * @returns {string} 格式化后的手机号码
 */
export function formatPhone(phone) {
  if (!phone || phone.length !== 11) {
    return phone
  }
  
  return phone.slice(0, 3) + '****' + phone.slice(7)
}

/**
 * 格式化文件大小
 * @param {number} size 文件大小(字节)
 * @param {number} decimal 小数位数，默认2位
 * @returns {string} 格式化后的文件大小，如：1.25MB
 */
export function formatFileSize(size, decimal = 2) {
  if (!size || size < 0) {
    return '0B'
  }
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  let index = 0
  let fileSize = size
  
  while (fileSize >= 1024 && index < units.length - 1) {
    fileSize /= 1024
    index++
  }
  
  return fileSize.toFixed(decimal) + units[index]
}

/**
 * 格式化银行卡号，如：6226 **** **** 8888
 * @param {string} cardNo 银行卡号
 * @returns {string} 格式化后的银行卡号
 */
export function formatBankCard(cardNo) {
  if (!cardNo || cardNo.length < 8) {
    return cardNo
  }
  
  // 保留前四位和后四位，中间用星号代替
  const firstPart = cardNo.slice(0, 4)
  const lastPart = cardNo.slice(-4)
  const maskLength = cardNo.length - 8
  
  return `${firstPart} ${'*'.repeat(4)} ${'*'.repeat(4)} ${lastPart}`
}

/**
 * 格式化时间为相对时间，如：刚刚、5分钟前、1小时前、昨天、前天等
 * @param {Date|string|number} time 时间对象、时间字符串或时间戳
 * @returns {string} 格式化后的相对时间
 */
export function formatRelativeTime(time) {
  if (!time) return ''
  
  // 将时间统一转换为Date对象
  let dateObj
  if (time instanceof Date) {
    dateObj = time
  } else if (typeof time === 'string') {
    dateObj = new Date(time.replace(/-/g, '/')) // 兼容iOS
  } else if (typeof time === 'number') {
    dateObj = new Date(time)
  } else {
    return ''
  }
  
  // 处理无效日期
  if (isNaN(dateObj.getTime())) {
    return ''
  }
  
  const now = new Date()
  const diff = now.getTime() - dateObj.getTime() // 时间差(毫秒)
  
  // 小于1分钟，显示"刚刚"
  if (diff < 60 * 1000) {
    return '刚刚'
  }
  
  // 小于1小时，显示"x分钟前"
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`
  }
  
  // 小于24小时，显示"x小时前"
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  }
  
  // 小于48小时，显示"昨天 HH:mm"
  if (diff < 48 * 60 * 60 * 1000) {
    return `昨天 ${padZero(dateObj.getHours())}:${padZero(dateObj.getMinutes())}`
  }
  
  // 小于72小时，显示"前天 HH:mm"
  if (diff < 72 * 60 * 60 * 1000) {
    return `前天 ${padZero(dateObj.getHours())}:${padZero(dateObj.getMinutes())}`
  }
  
  // 小于一年，显示"MM-DD HH:mm"
  if (diff < 365 * 24 * 60 * 60 * 1000) {
    return `${padZero(dateObj.getMonth() + 1)}-${padZero(dateObj.getDate())} ${padZero(dateObj.getHours())}:${padZero(dateObj.getMinutes())}`
  }
  
  // 大于一年，显示"YYYY-MM-DD HH:mm"
  return `${dateObj.getFullYear()}-${padZero(dateObj.getMonth() + 1)}-${padZero(dateObj.getDate())} ${padZero(dateObj.getHours())}:${padZero(dateObj.getMinutes())}`
}

// 补零函数
function padZero(num) {
  return String(num).padStart(2, '0')
} 