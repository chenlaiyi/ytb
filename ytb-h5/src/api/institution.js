import request from '@/utils/request'

const permissionSafeRequest = (config) => request({
  preserveAuthOnAuthError: true,
  ...config
})

// 获取支付机构工作台数据
export function getInstitutionWorkspace() {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/workspace',
    method: 'get',
    skipAuthError: true,
    skipAuthErrorToast: true,
    skipErrorToast: true
  })
}

export function getInstitutionOnboardingStats(params) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/onboarding/stats',
    method: 'get',
    params
  })
}

export function getInstitutionOnboardingMerchants(params) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/onboarding/merchants',
    method: 'get',
    params
  })
}

export function getInstitutionOnboardingDetail(id, params = {}) {
  return permissionSafeRequest({
    url: `/api/mobile/v1/institution/onboarding/merchants/${id}`,
    method: 'get',
    params
  })
}

export function getInstitutionOnboardingTrend(params) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/onboarding/trend',
    method: 'get',
    params
  })
}

export function getInstitutionPerformanceTrend(params) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/performance/trend',
    method: 'get',
    params
  })
}

// 获取支付机构商户列表
export function getInstitutionMerchants(params) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/merchants',
    method: 'get',
    params
  })
}

export function getInstitutionMeituanMerchants(params) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/meituan/merchants',
    method: 'get',
    params
  })
}

export function getInstitutionMeituanTransactions(params) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/meituan/transactions',
    method: 'get',
    params
  })
}

// 获取支付机构交易记录
export function getInstitutionOrders(params) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/transactions',
    method: 'get',
    params
  })
}

// 获取支付机构分润明细
export function getInstitutionCommissions(params) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/commissions',
    method: 'get',
    params
  })
}

// 获取支付机构统计数据
export function getInstitutionStatistics(params) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/statistics',
    method: 'get',
    params
  })
}

export function getInstitutionMeituanDashboard(params) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/meituan/dashboard',
    method: 'get',
    params
  })
}

export function getInstitutionMeituanTrend(params) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/meituan/trend',
    method: 'get',
    params
  })
}

export function getInstitutionMeituanCommissions(params) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/meituan/commissions',
    method: 'get',
    params
  })
}

export function getInstitutionMeituanPartners(params) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/meituan/partners',
    method: 'get',
    params
  })
}

export function getInstitutionInviteOverview() {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/invites/overview',
    method: 'get'
  })
}

export function sendInstitutionEmailCode(data) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/contact-email/code',
    method: 'post',
    data
  })
}

export function bindInstitutionEmail(data) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/contact-email/bind',
    method: 'post',
    data
  })
}

export function getInstitutionInvites(params) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/invites',
    method: 'get',
    params
  })
}

// ===== 业务员（支付机构） =====
export function getInstitutionSalesmen(params) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/salesmen',
    method: 'get',
    params
  })
}

export function createInstitutionSalesman(data) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/salesmen',
    method: 'post',
    data
  })
}

export function updateInstitutionSalesman(id, data) {
  return permissionSafeRequest({
    url: `/api/mobile/v1/institution/salesmen/${id}`,
    method: 'put',
    data
  })
}

export function getInstitutionSalesmanWithdrawals(params) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/salesmen/withdrawals',
    method: 'get',
    params
  })
}

export function reviewInstitutionSalesmanWithdrawal(id, data) {
  return permissionSafeRequest({
    url: `/api/mobile/v1/institution/salesmen/withdrawals/${id}/review`,
    method: 'post',
    data
  })
}

export function getInstitutionSalesmanInviteCode() {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/salesmen/invite-code',
    method: 'get'
  })
}

export function lookupInstitutionInvite(params) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/invites/lookup',
    method: 'get',
    params,
    skipAuthError: true
  })
}

export function submitInstitutionInvite(data) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/invites/register',
    method: 'post',
    data,
    skipAuthError: true
  })
}

export function getInviteFollowStatus(params) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/invite-follow-status',
    method: 'get',
    params,
    skipAuthError: true
  })
}

export function sendInviteFollowMessage(data) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/invite/send-follow-message',
    method: 'post',
    data,
    skipAuthError: true
  })
}

export function analyzeBusinessLicenseOcr(data) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/onboarding/ocr/business-license',
    method: 'post',
    data,
    skipAuthErrorToast: true
  })
}

export function analyzeIdCardOcr(data) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/onboarding/ocr/id-card',
    method: 'post',
    data,
    skipAuthErrorToast: true
  })
}

export function analyzeBankCardOcr(data) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/onboarding/ocr/settlement-bank-card',
    method: 'post',
    data,
    skipAuthErrorToast: true
  })
}

export function analyzeAccountPermitOcr(data) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/onboarding/ocr/account-permit',
    method: 'post',
    data,
    skipAuthErrorToast: true
  })
}

export function getInviteWechatAuthorizeUrl(params) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/invite/wechat-url',
    method: 'get',
    params,
    skipAuthError: true
  })
}

export function fetchInviteWechatUser(params) {
  return permissionSafeRequest({
    url: '/api/mobile/v1/institution/invite/wechat-user',
    method: 'get',
    params,
    skipAuthError: true
  })
}

export function searchInstitutions(params) {
  return request({
    url: '/api/admin/v1/institutions',
    method: 'get',
    params
  })
}

export function createInstitution(data) {
  return request({
    url: '/api/admin/v1/institutions',
    method: 'post',
    data
  })
}

export function updateInstitution(id, data) {
  return request({
    url: `/api/admin/v1/institutions/${id}`,
    method: 'put',
    data
  })
}

export function toggleInstitutionSalesman(id, data) {
  return request({
    url: `/api/admin/v1/institutions/${id}/salesman-toggle`,
    method: 'post',
    data
  })
}

export function toggleInstitutionMeituan(id, data) {
  return request({
    url: `/api/admin/v1/institutions/${id}/meituan-toggle`,
    method: 'post',
    data
  })
}

export function getInstitutionProvinces(params) {
  return request({
    url: '/api/admin/v1/institutions/provinces',
    method: 'get',
    params
  })
}

export function getInstitutionCities(params) {
  return request({
    url: '/api/admin/v1/institutions/cities',
    method: 'get',
    params
  })
}

export function getInstitutionDistricts(params) {
  return request({
    url: '/api/admin/v1/institutions/districts',
    method: 'get',
    params
  })
}

// 管理后台 - 获取机构详情
export function getInstitutionDetail(id) {
  return request({
    url: `/api/admin/v1/institutions/${id}`,
    method: 'get'
  })
}

// 获取商户详情
export function getMerchantDetail(merchantId) {
  return request({
    url: `/admin/api/v1/institution/merchants/${merchantId}`,
    method: 'get'
  })
}

// 更新商户状态
export function updateMerchantStatus(merchantId, status) {
  return request({
    url: `/admin/api/v1/institution/merchants/${merchantId}/status`,
    method: 'put',
    data: { status }
  })
}

// 获取交易详情
export function getOrderDetail(orderId) {
  return request({
    url: `/admin/api/v1/institution/orders/${orderId}`,
    method: 'get'
  })
}

// 导出交易记录
export function exportOrders(params) {
  return request({
    url: '/admin/api/v1/institution/orders/export',
    method: 'post',
    data: params,
    responseType: 'blob'
  })
}

// 获取分润统计
export function getCommissionStats(params) {
  return request({
    url: '/admin/api/v1/institution/commissions/stats',
    method: 'get',
    params
  })
}

// 申请提现
export function applyWithdraw(data) {
  return request({
    url: '/admin/api/v1/institution/commissions/withdraw',
    method: 'post',
    data
  })
}
