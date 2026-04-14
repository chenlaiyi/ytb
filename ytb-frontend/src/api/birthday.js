import request from '@/utils/request'

// 获取生日列表
export function getBirthdayList(params) {
  return request({
    url: '/api/admin/v1/birthday',
    method: 'get',
    params
  })
}

// 发送生日祝福短信
export function sendBirthdaySms(data) {
  return request({
    url: '/api/admin/v1/birthday/send-sms',
    method: 'post',
    data
  })
}

// 批量发送生日祝福短信
export function batchSendBirthdaySms(data) {
  return request({
    url: '/api/admin/v1/birthday/batch-send-sms',
    method: 'post',
    data
  })
}

// 获取短信发送记录
export function getSmsLogs(params) {
  return request({
    url: '/api/admin/v1/birthday/sms-logs',
    method: 'get',
    params
  })
} 

// 获取生日祝福统计数据
export function getBirthdayStatistics() {
  return request({
    url: '/api/admin/v1/birthday/statistics',
    method: 'get'
  })
}

// 获取分析数据
export const getAnalyticsData = (params) => {
  return request({
    url: '/api/admin/v1/birthday/analytics',
    method: 'get',
    params
  })
}

// 导出发送记录
export function exportSmsLogs(params) {
  return request({
    url: '/api/admin/v1/birthday/export-logs',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 获取生日提醒设置
export function getReminderSettings() {
  return request({
    url: '/api/admin/v1/birthday/reminder-settings',
    method: 'get'
  })
}

// 更新生日提醒设置
export function updateReminderSettings(data) {
  return request({
    url: '/api/admin/v1/birthday/reminder-settings',
    method: 'post',
    data
  })
}

// 获取发送历史统计
export function getSendHistory(params) {
  return request({
    url: '/api/admin/v1/birthday/send-history',
    method: 'get',
    params
  })
}

// 获取即将生日的用户
export function getUpcomingBirthdays(params) {
  return request({
    url: '/api/admin/v1/birthday/upcoming-birthdays',
    method: 'get',
    params
  })
}

// 测试短信发送
export function testSms(data) {
  return request({
    url: '/api/admin/v1/birthday/test-sms',
    method: 'post',
    data
  })
} 