import request from '@/utils/axios'

// 获取短信日志列表
export function getSmsLogs(params) {
  return request({
    url: '/api/admin/v1/sms/logs',
    method: 'get',
    params
  })
}

// 获取短信统计数据
export function getSmsStats(params) {
  return request({
    url: '/api/admin/v1/sms/statistics',
    method: 'get',
    params
  })
}

// 获取短信统计数据（别名）
export function getSmsStatistics(params) {
  return request({
    url: '/api/admin/v1/sms/statistics',
    method: 'get',
    params
  })
}

// 获取验证码列表
export function getSmsCodes(params) {
  return request({
    url: '/api/admin/v1/sms/codes',
    method: 'get',
    params
  })
}

// 获取验证码统计数据
export function getSmsCodesStats(params) {
  return request({
    url: '/api/admin/v1/sms/codes/stats',
    method: 'get',
    params
  })
}

// 发送短信
export function sendSms(data) {
  return request({
    url: '/api/admin/v1/sms/send',
    method: 'post',
    data
  })
}

// 批量发送短信
export function batchSendSms(data) {
  return request({
    url: '/api/admin/v1/sms/batch-send',
    method: 'post',
    data
  })
}

// 删除短信记录
export function deleteSmsLog(id) {
  return request({
    url: `/api/admin/v1/sms/logs/${id}`,
    method: 'delete'
  })
}

// 重发短信
export function resendSms(id) {
  return request({
    url: `/api/admin/v1/sms/logs/${id}/resend`,
    method: 'post'
  })
}

// 获取短信模板列表
export function getSmsTemplates() {
  return request({
    url: '/api/admin/v1/sms/templates',
    method: 'get'
  })
}

// 创建短信模板
export function createSmsTemplate(data) {
  return request({
    url: '/api/admin/v1/sms/templates',
    method: 'post',
    data
  })
}

// 更新短信模板
export function updateSmsTemplate(id, data) {
  return request({
    url: `/api/admin/v1/sms/templates/${id}`,
    method: 'put',
    data
  })
}

// 删除短信模板
export function deleteSmsTemplate(id) {
  return request({
    url: `/api/admin/v1/sms/templates/${id}`,
    method: 'delete'
  })
}

// 默认导出所有API函数
export default {
  getSmsLogs,
  getSmsStats,
  getSmsStatistics,
  getSmsCodes,
  getSmsCodesStats,
  sendSms,
  batchSendSms,
  deleteSmsLog,
  resendSms,
  getSmsTemplates,
  createSmsTemplate,
  updateSmsTemplate,
  deleteSmsTemplate
}
