import request from '@/utils/request'

// 控制面板相关API
export function getDashboardStats() {
  return request({
    url: '/api/admin/v1/shengfutong/dashboard/stats',
    method: 'get'
  })
}

export function getTrendData(params) {
  return request({
    url: '/api/admin/v1/shengfutong/dashboard/trend',
    method: 'get',
    params
  })
}

export function getPaymentStats() {
  return request({
    url: '/api/admin/v1/shengfutong/dashboard/payment-stats',
    method: 'get'
  })
}

export function getMerchantRanking(params) {
  return request({
    url: '/api/admin/v1/shengfutong/dashboard/merchant-ranking',
    method: 'get',
    params
  })
}

export function getChannelRanking(params) {
  return request({
    url: '/api/admin/v1/shengfutong/dashboard/channel-ranking',
    method: 'get',
    params
  })
}

export function getRealtimeTransactions(params) {
  return request({
    url: '/api/admin/v1/shengfutong/dashboard/realtime-transactions',
    method: 'get',
    params
  })
}

// 数据管理相关API
export function getDailyData(params) {
  return request({
    url: '/api/admin/v1/shengfutong/daily-data',
    method: 'get',
    params
  })
}

export function getMonthlyData(params) {
  return request({
    url: '/api/admin/v1/shengfutong/monthly-data',
    method: 'get',
    params
  })
}

// 数据上传相关API
export function uploadData(data) {
  return request({
    url: '/api/admin/v1/shengfutong/upload',
    method: 'post',
    data
    // 不设置Content-Type，让浏览器自动设置multipart/form-data边界
  })
}

// 数据导出相关API
export function exportDailyData(params) {
  return request({
    url: '/api/admin/v1/shengfutong/export/daily',
    method: 'post',
    data: params
  })
}

export function exportMonthlyData(params) {
  return request({
    url: '/api/admin/v1/shengfutong/export/monthly',
    method: 'post',
    data: params
  })
}

// 余额管理相关API
export function getBalanceData() {
  return request({
    url: '/api/admin/v1/shengfutong/balance/data',
    method: 'get'
  })
}

export function getBalanceFlow(params) {
  return request({
    url: '/api/admin/v1/shengfutong/balance/flow',
    method: 'get',
    params
  })
}

export function withdrawApply(data) {
  return request({
    url: '/api/admin/v1/shengfutong/balance/withdraw',
    method: 'post',
    data
  })
}

export function recharge(data) {
  return request({
    url: '/api/admin/v1/shengfutong/balance/recharge',
    method: 'post',
    data
  })
}

// 兼容旧版本的API函数名（保持向后兼容）
export function getShengfutongDashboardStats() {
  return getDashboardStats()
}

export function getShengfutongTrendData(timeRange = 'month') {
  return getTrendData({ range: timeRange })
}

export function getShengfutongMerchantRanking(limit = 10) {
  return getMerchantRanking({ limit })
}

export function getShengfutongChannelRanking(limit = 10) {
  return getChannelRanking({ limit })
}

export function getShengfutongRealtimeTransactions(limit = 100) {
  return getRealtimeTransactions({ limit })
}

export function getShengfutongDailyData(params) {
  return getDailyData(params)
}

export function getShengfutongMonthlyData(params) {
  return getMonthlyData(params)
}

export function uploadShengfutongData(data) {
  return uploadData(data)
}

// 兼容旧版本的导出函数名
export function exportShengfutongDailyData(params) {
  return exportDailyData(params)
}

export function exportShengfutongMonthlyData(params) {
  return exportMonthlyData(params)
}

// 机构汇总相关API（待实现）
export function getInstitutionSummary(params) {
  return request({
    url: '/api/admin/v1/shengfutong/institution/summary',
    method: 'get',
    params
  })
}

export function getInstitutionDetail(id) {
  return request({
    url: `/api/admin/v1/shengfutong/institution/${id}`,
    method: 'get'
  })
}

// 商户管理相关API（待实现）
export function getMerchantList(params) {
  return request({
    url: '/api/admin/v1/shengfutong/merchant/list',
    method: 'get',
    params
  })
}

export function getMerchantDetail(id) {
  return request({
    url: `/api/admin/v1/shengfutong/merchant/${id}`,
    method: 'get'
  })
}

export function getMerchantSummary(params) {
  return request({
    url: '/api/admin/v1/shengfutong/merchant/summary',
    method: 'get',
    params
  })
}

export function getMerchantSummaryStats(params) {
  return request({
    url: '/api/admin/v1/shengfutong/merchant/summary/stats',
    method: 'get',
    params
  })
}

export function updateMerchant(id, data) {
  return request({
    url: `/api/admin/v1/shengfutong/merchant/${id}`,
    method: 'put',
    data
  })
}

export function deleteMerchant(id) {
  return request({
    url: `/api/admin/v1/shengfutong/merchant/${id}`,
    method: 'delete'
  })
}

// 兼容旧版本的商户API函数名
export function getShengfutongMerchantList(params) {
  return getMerchantList(params)
}

export function getShengfutongMerchantDetail(id) {
  return getMerchantDetail(id)
}

export function getShengfutongMerchantSummary(params) {
  return getMerchantSummary(params)
}

export function updateShengfutongMerchant(id, data) {
  return updateMerchant(id, data)
}

// 文件上传相关API
export function uploadFile(formData) {
  return request({
    url: '/api/admin/v1/shengfutong/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function getUploadLogs(params) {
  return request({
    url: '/api/admin/v1/shengfutong/upload/logs',
    method: 'get',
    params
  })
}

export function deleteUploadLog(logId) {
  return request({
    url: `/api/admin/v1/shengfutong/upload/logs/${logId}`,
    method: 'delete'
  })
}

export function deleteShengfutongMerchant(id) {
  return request({
    url: `/api/admin/v1/shengfutong/merchant/${id}`,
    method: 'delete'
  })
}

// 提现管理相关API
export function getWithdrawalList(params) {
  return request({
    url: '/api/admin/v1/shengfutong/withdrawal/list',
    method: 'get',
    params
  })
}

export function getWithdrawalStatistics() {
  return request({
    url: '/api/admin/v1/shengfutong/withdrawal/statistics',
    method: 'get'
  })
}

export function auditWithdrawal(data) {
  return request({
    url: '/api/admin/v1/shengfutong/withdrawal/audit',
    method: 'post',
    data
  })
}

export function getAlipayBalance() {
  return request({
    url: '/api/admin/v1/shengfutong/withdrawal/alipay/balance',
    method: 'get'
  })
}

// 日数据管理相关API (V1 API)
export function getDailyList(params) {
  return request({
    url: '/api/admin/v1/shengfutong/daily-data/list',
    method: 'get',
    params
  })
}

export function calculateDaily(data) {
  return request({
    url: '/api/admin/v1/shengfutong/daily-data/calculate',
    method: 'post',
    data
  })
}

export function batchCalculateDaily(data) {
  return request({
    url: '/api/admin/v1/shengfutong/daily-data/batch-calculate',
    method: 'post',
    data
  })
}

export function checkData(data) {
  return request({
    url: '/api/admin/v1/shengfutong/daily-data/check-data',
    method: 'post',
    data
  })
}

// 月数据相关API
export function getMonthlyList(params) {
  return request({
    url: '/api/admin/v1/shengfutong/monthly-data/list',
    method: 'get',
    params
  })
}

export function calculateMonthly(data) {
  return request({
    url: '/api/admin/v1/shengfutong/monthly-data/calculate',
    method: 'post',
    data
  })
}

export function checkMonthlyData(data) {
  return request({
    url: '/api/admin/v1/shengfutong/monthly-data/check-data',
    method: 'post',
    data
  })
}

// 机构汇总相关API
export function getInstitutionSummaryList(params) {
  return request({
    url: '/api/admin/v1/shengfutong/institution-summary/list',
    method: 'get',
    params
  })
}

export function syncInstitutionData() {
  return request({
    url: '/api/admin/v1/shengfutong/institution-summary/sync',
    method: 'post',
    timeout: 300000  // 5分钟超时
  })
}

export function getInstitutionSyncStatus() {
  return request({
    url: '/api/admin/v1/shengfutong/institution-summary/sync-status',
    method: 'get',
    timeout: 10000  // 10秒超时
  })
} 
