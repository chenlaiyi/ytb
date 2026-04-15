import request from '@/utils/request';

const merchantAppRequest = (config) => request({
  preserveAuthOnAuthError: true,
  ...config
});

/**
 * 获取商户工作台数据
 * @returns {Promise<Object>} 商户工作台数据
 */
export function getMerchantWorkspace(params = {}) {
  return merchantAppRequest({
    url: '/api/mobile/v1/business/merchant/workspace',
    method: 'get',
    params
  });
}

/**
 * 获取我的进件记录
 * @param {Object} params 查询参数
 * @param {string} params.date 过滤日期（可选，格式YYYY-MM-DD）
 * @returns {Promise<Object>} 进件记录数据
 */
export function getMerchantOnboardingRecords(params = {}) {
  return merchantAppRequest({
    url: '/api/mobile/v1/business/merchant/onboardings',
    method: 'get',
    params
  });
}

/**
 * 获取商户进件详情
 * @param {number|string} id 进件记录ID
 * @returns {Promise<Object>} 进件详情数据
 */
export function getMerchantOnboardingDetail(id) {
  return merchantAppRequest({
    url: `/api/mobile/v1/business/merchant/onboardings/${id}`,
    method: 'get'
  });
}

/**
 * 提交商户进件申请
 * @param {Object} data 进件表单数据
 * @returns {Promise<Object>} 提交结果
 */
export function submitMerchantOnboarding(data) {
  return merchantAppRequest({
    url: '/api/mobile/v1/business/merchant/onboardings',
    method: 'post',
    data
  });
}

/**
 * 进件图片审核
 * @param {{type: string, image_url: string}} data
 */
export function auditOnboardingAttachment(data) {
  return merchantAppRequest({
    url: '/api/mobile/v1/business/merchant/onboardings/attachments/audit',
    method: 'post',
    data
  });
}

/**
 * 校验业务员邀请码
 * @param {string} code 邀请码
 */
export function checkSalesmanInviteCode(code) {
  return merchantAppRequest({
    url: '/api/mobile/v1/business/merchant/invite-codes/check',
    method: 'get',
    params: { code }
  });
}

/**
 * 获取商户交易列表
 * @param {Object} params 查询参数
 * @param {string} params.merchant_id 商户ID（可选，如果不传则使用当前选择的商户）
 * @param {number} params.page 页码
 * @param {number} params.limit 每页数量
 * @param {string} params.status 交易状态（可选）
 * @param {string} params.trade_type 交易类型（可选）
 * @param {string} params.start_date 开始日期（可选）
 * @param {string} params.end_date 结束日期（可选）
 * @returns {Promise<Object>} 交易列表数据
 */
export function getMerchantTradeList(params) {
  return merchantAppRequest({
    url: '/api/mobile/v1/business/merchant/transactions',
    method: 'get',
    params
  });
}

/**
 * 获取商户交易详情
 * @param {string} tradeNo 交易单号
 * @returns {Promise<Object>} 交易详情数据
 */
export function getMerchantTradeDetail(tradeNo) {
  return merchantAppRequest({
    url: `/api/mobile/v1/business/merchant/transactions/${tradeNo}`,
    method: 'get'
  });
}

/**
 * 商户数据统计
 * @param {Object} params 查询参数
 * @param {string} params.merchant_id 商户ID（可选，如果不传则使用当前选择的商户）
 * @param {string} params.date_type 日期类型（day/week/month/year）
 * @param {string} params.start_date 开始日期（可选）
 * @param {string} params.end_date 结束日期（可选）
 * @returns {Promise<Object>} 统计数据
 */
export function getMerchantStats(params) {
  return merchantAppRequest({
    url: '/api/mobile/v1/business/merchant/stats',
    method: 'get',
    params
  });
}

/**
 * 获取商户信息
 * @returns {Promise<Object>} 商户信息
 */
export function getMerchantInfo() {
  return merchantAppRequest({
    url: '/user/merchant_info.php',
    method: 'get'
  });
}

// 管理员商户管理API

/**
 * 获取商户列表
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.limit 每页数量
 * @param {string} params.status 商户状态（可选）
 * @param {string} params.keyword 搜索关键词（可选）
 * @param {string} params.sort_field 排序字段（可选）
 * @param {string} params.sort_order 排序方向（可选）
 * @returns {Promise<Object>} 商户列表数据
 */
export function getAdminMerchants(params) {
  return request({
    url: '/admin/api/merchant/get_merchants.php',
    method: 'get',
    params
  });
}

/**
 * 获取商户详情
 * @param {number} id 商户ID
 * @returns {Promise<Object>} 商户详情数据
 */
export function getAdminMerchantDetails(id) {
  return request({
    url: '/admin/api/merchant/get_merchant_details.php',
    method: 'get',
    params: { id }
  });
}

/**
 * 创建商户
 * @param {Object} data 商户数据
 * @returns {Promise<Object>} 创建结果
 */
export function createMerchant(data) {
  return request({
    url: '/admin/api/merchant/create_merchant.php',
    method: 'post',
    data
  });
}

/**
 * 更新商户信息
 * @param {Object} data 商户数据
 * @returns {Promise<Object>} 更新结果
 */
export function updateMerchant(data) {
  return request({
    url: '/admin/api/merchant/update_merchant.php',
    method: 'post',
    data
  });
}

/**
 * 更新商户状态
 * @param {number} id 商户ID
 * @param {string} status 商户状态
 * @returns {Promise<Object>} 更新结果
 */
export function updateMerchantStatus(id, status) {
  return request({
    url: '/admin/api/merchant/update_merchant_status.php',
    method: 'post',
    data: { id, status }
  });
}

/**
 * 获取商户交易记录
 * @param {Object} params 查询参数
 * @param {number} params.merchant_id 商户ID
 * @param {number} params.page 页码
 * @param {number} params.limit 每页数量
 * @param {string} params.status 交易状态（可选）
 * @param {string} params.start_date 开始日期（可选）
 * @param {string} params.end_date 结束日期（可选）
 * @returns {Promise<Object>} 交易记录列表
 */
export function getAdminMerchantTrades(params) {
  return request({
    url: '/admin/api/merchant/get_merchant_trades.php',
    method: 'get',
    params
  });
}

/**
 * 获取商户结算记录
 * @param {Object} params 查询参数
 * @param {number} params.merchant_id 商户ID（可选）
 * @param {string} params.status 结算状态（可选）
 * @param {number} params.page 页码
 * @param {number} params.limit 每页数量
 * @param {string} params.start_date 开始日期（可选）
 * @param {string} params.end_date 结束日期（可选）
 * @returns {Promise<Object>} 结算记录列表
 */
export function getMerchantSettlements(params) {
  return request({
    url: '/admin/api/merchant/get_merchant_settlements.php',
    method: 'get',
    params
  });
}

/**
 * 创建商户结算记录
 * @param {Object} data 结算数据
 * @param {number} data.merchant_id 商户ID
 * @param {number} data.amount 结算金额
 * @param {string} data.bank_name 银行名称（可选）
 * @param {string} data.bank_branch 支行名称（可选）
 * @param {string} data.bank_account_name 开户名（可选）
 * @param {string} data.bank_account_no 银行账号（可选）
 * @param {string} data.remarks 备注（可选）
 * @returns {Promise<Object>} 创建结果
 */
export function createMerchantSettlement(data) {
  return request({
    url: '/admin/api/merchant/create_merchant_settlement.php',
    method: 'post',
    data
  });
}

// ===== 管理后台聚合商户（银联/盛付通/美团） =====

export function getAdminUnifiedMerchants(params) {
  return request({
    url: '/api/admin/v1/merchants',
    method: 'get',
    params
  });
}

export function getAdminUnifiedMerchantDetail(source, merchantId, params = {}) {
  return request({
    url: `/api/admin/v1/merchants/${source}/${merchantId}`,
    method: 'get',
    params,
    skipCache: true
  });
}
