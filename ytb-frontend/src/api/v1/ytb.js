/**
 * 亿拓宝(YTB)后台管理 API
 */
import service from '@/utils/axios'

const BASE_URL = '/api/admin/v1'

// ==================== 用户管理 ====================

/**
 * 获取用户列表
 */
export function getUsers(params) {
  return service({
    url: `${BASE_URL}/users`,
    method: 'get',
    params
  })
}

/**
 * 获取用户详情
 */
export function getUserDetail(id) {
  return service({
    url: `${BASE_URL}/users/${id}`,
    method: 'get'
  })
}

/**
 * 获取用户统计
 */
export function getUserStatistics() {
  return service({
    url: `${BASE_URL}/users/statistics`,
    method: 'get'
  })
}

/**
 * 更新用户角色
 */
export function updateUserRole(id, role) {
  return service({
    url: `${BASE_URL}/users/${id}/role`,
    method: 'put',
    data: { role }
  })
}

/**
 * 更新用户状态
 */
export function updateUserStatus(id, status) {
  return service({
    url: `${BASE_URL}/users/${id}/status`,
    method: 'put',
    data: { status }
  })
}

/**
 * 获取用户团队成员
 */
export function getUserTeam(id, params) {
  return service({
    url: `${BASE_URL}/users/${id}/team`,
    method: 'get',
    params
  })
}

// ==================== 升级申请管理 ====================

/**
 * 获取升级申请列表
 */
export function getUpgrades(params) {
  return service({
    url: `${BASE_URL}/ytb/upgrades`,
    method: 'get',
    params
  })
}

/**
 * 获取升级申请详情
 */
export function getUpgradeDetail(id) {
  return service({
    url: `${BASE_URL}/ytb/upgrades/${id}`,
    method: 'get'
  })
}

/**
 * 获取升级申请统计
 */
export function getUpgradeStatistics() {
  return service({
    url: `${BASE_URL}/ytb/upgrades/statistics`,
    method: 'get'
  })
}

/**
 * 审批通过
 */
export function approveUpgrade(id, remark = '') {
  return service({
    url: `${BASE_URL}/ytb/upgrades/${id}/approve`,
    method: 'post',
    data: { remark }
  })
}

/**
 * 审批拒绝
 */
export function rejectUpgrade(id, remark) {
  return service({
    url: `${BASE_URL}/ytb/upgrades/${id}/reject`,
    method: 'post',
    data: { remark }
  })
}

/**
 * 确认线下支付
 */
export function confirmPayment(id, transactionId = '') {
  return service({
    url: `${BASE_URL}/ytb/upgrades/${id}/confirm-payment`,
    method: 'post',
    data: { transaction_id: transactionId }
  })
}

// ==================== 分佣管理 ====================

/**
 * 获取分佣记录列表
 */
export function getCommissions(params) {
  return service({
    url: `${BASE_URL}/ytb/commissions`,
    method: 'get',
    params
  })
}

/**
 * 获取分佣详情
 */
export function getCommissionDetail(id) {
  return service({
    url: `${BASE_URL}/ytb/commissions/${id}`,
    method: 'get'
  })
}

/**
 * 获取分佣统计
 */
export function getCommissionStatistics() {
  return service({
    url: `${BASE_URL}/ytb/commissions/statistics`,
    method: 'get'
  })
}

/**
 * 获取分佣排行榜
 */
export function getCommissionRanking(params) {
  return service({
    url: `${BASE_URL}/ytb/commissions/ranking`,
    method: 'get',
    params
  })
}

/**
 * 结算分佣
 */
export function settleCommission(id, remark = '') {
  return service({
    url: `${BASE_URL}/ytb/commissions/${id}/settle`,
    method: 'post',
    data: { remark }
  })
}

/**
 * 取消分佣
 */
export function cancelCommission(id, remark = '') {
  return service({
    url: `${BASE_URL}/ytb/commissions/${id}/cancel`,
    method: 'post',
    data: { remark }
  })
}

/**
 * 批量结算分佣
 */
export function batchSettleCommissions(ids) {
  return service({
    url: `${BASE_URL}/ytb/commissions/batch-settle`,
    method: 'post',
    data: { ids }
  })
}

// ==================== 统计与配置 ====================

/**
 * 获取综合统计数据
 */
export function getStatistics() {
  return service({
    url: `${BASE_URL}/ytb/statistics`,
    method: 'get'
  })
}

/**
 * 获取用户增长趋势
 */
export function getUserTrend(days = 30) {
  return service({
    url: `${BASE_URL}/ytb/statistics/user-trend`,
    method: 'get',
    params: { days }
  })
}

/**
 * 获取收入趋势
 */
export function getRevenueTrend(days = 30) {
  return service({
    url: `${BASE_URL}/ytb/statistics/revenue-trend`,
    method: 'get',
    params: { days }
  })
}

/**
 * 获取升级申请趋势
 */
export function getUpgradeTrend(days = 30) {
  return service({
    url: `${BASE_URL}/ytb/statistics/upgrade-trend`,
    method: 'get',
    params: { days }
  })
}

/**
 * 获取TeamCP排行榜
 */
export function getTeamCpRanking(limit = 10) {
  return service({
    url: `${BASE_URL}/ytb/statistics/team-cp-ranking`,
    method: 'get',
    params: { limit }
  })
}

/**
 * 获取SCP排行榜
 */
export function getScpRanking(limit = 10) {
  return service({
    url: `${BASE_URL}/ytb/statistics/scp-ranking`,
    method: 'get',
    params: { limit }
  })
}

/**
 * 获取配置
 */
export function getConfigs() {
  return service({
    url: `${BASE_URL}/ytb/configs`,
    method: 'get'
  })
}

/**
 * 更新配置
 */
export function updateConfigs(data) {
  return service({
    url: `${BASE_URL}/configs`,
    method: 'put',
    data
  })
}

// ==================== BossCP 投资管理 ====================

/**
 * 获取BossCP投资列表
 */
export function getInvestments(params) {
  return service({
    url: `${BASE_URL}/ytb/investments`,
    method: 'get',
    params
  })
}

/**
 * 获取投资详情
 */
export function getInvestmentDetail(id) {
  return service({
    url: `${BASE_URL}/ytb/investments/${id}`,
    method: 'get'
  })
}

/**
 * 获取投资统计
 */
export function getInvestmentStatistics() {
  return service({
    url: `${BASE_URL}/ytb/investments/statistics`,
    method: 'get'
  })
}

/**
 * 确认投资支付
 */
export function confirmInvestmentPayment(id, transactionId = '') {
  return service({
    url: `${BASE_URL}/ytb/investments/${id}/confirm-payment`,
    method: 'post',
    data: { transaction_id: transactionId }
  })
}

/**
 * 取消投资
 */
export function cancelInvestment(id, remark = '') {
  return service({
    url: `${BASE_URL}/ytb/investments/${id}/cancel`,
    method: 'post',
    data: { remark }
  })
}

// ==================== 提现管理 ====================

/**
 * 获取提现记录列表
 */
export function getWithdrawals(params) {
  return service({
    url: `${BASE_URL}/withdrawals`,
    method: 'get',
    params
  })
}

/**
 * 获取提现详情
 */
export function getWithdrawalDetail(id) {
  return service({
    url: `${BASE_URL}/withdrawals/${id}`,
    method: 'get'
  })
}

/**
 * 获取提现统计
 */
export function getWithdrawalStatistics() {
  return service({
    url: `${BASE_URL}/withdrawals/statistics`,
    method: 'get'
  })
}

/**
 * 开始处理提现
 */
export function processWithdrawal(id) {
  return service({
    url: `${BASE_URL}/withdrawals/${id}/process`,
    method: 'post'
  })
}

/**
 * 完成提现
 */
export function completeWithdrawal(id, data = {}) {
  return service({
    url: `${BASE_URL}/withdrawals/${id}/complete`,
    method: 'post',
    data
  })
}

/**
 * 拒绝提现
 */
export function rejectWithdrawal(id, remark) {
  return service({
    url: `${BASE_URL}/withdrawals/${id}/reject`,
    method: 'post',
    data: { remark }
  })
}

/**
 * 批量完成提现
 */
export function batchCompleteWithdrawals(ids) {
  return service({
    url: `${BASE_URL}/withdrawals/batch-complete`,
    method: 'post',
    data: { ids }
  })
}

/**
 * 导出提现记录
 */
export function exportWithdrawals(params) {
  return service({
    url: `${BASE_URL}/withdrawals/export`,
    method: 'get',
    params
  })
}

// ==================== 设备心跳管理 ====================

/**
 * 获取设备心跳列表
 */
export function getDeviceHeartbeats(params) {
  return service({
    url: `${BASE_URL}/ytb/devices/heartbeats`,
    method: 'get',
    params
  })
}

// ==================== 净水器安装记录管理 ====================

/**
 * 获取安装记录列表
 */
export function getInstallations(params) {
  return service({
    url: `${BASE_URL}/installations`,
    method: 'get',
    params
  })
}

/**
 * 获取安装记录详情
 */
export function getInstallationDetail(id) {
  return service({
    url: `${BASE_URL}/installations/${id}`,
    method: 'get'
  })
}

/**
 * 获取安装统计
 */
export function getInstallationStatistics() {
  return service({
    url: `${BASE_URL}/installations/statistics`,
    method: 'get'
  })
}

/**
 * 结算安装分佣
 */
export function settleInstallation(id) {
  return service({
    url: `${BASE_URL}/installations/${id}/settle`,
    method: 'post'
  })
}

/**
 * 批量结算安装分佣
 */
export function batchSettleInstallations(ids) {
  return service({
    url: `${BASE_URL}/installations/batch-settle`,
    method: 'post',
    data: { ids }
  })
}

// ==================== 海报管理 ====================

/**
 * 获取推广海报列表
 */
export function getPosters(params) {
  return service({
    url: `${BASE_URL}/posters`,
    method: 'get',
    params
  })
}

/**
 * 创建推广海报
 */
export function createPoster(data) {
  return service({
    url: `${BASE_URL}/posters`,
    method: 'post',
    data
  })
}

/**
 * 更新推广海报
 */
export function updatePoster(id, data) {
  return service({
    url: `${BASE_URL}/posters/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除推广海报
 */
export function deletePoster(id) {
  return service({
    url: `${BASE_URL}/posters/${id}`,
    method: 'delete'
  })
}

/**
 * 更新推广海报状态
 */
export function updatePosterStatus(id, status) {
  return service({
    url: `${BASE_URL}/posters/${id}/status`,
    method: 'put',
    data: { status }
  })
}

export default {
  // 用户管理
  getUsers,
  getUserDetail,
  getUserStatistics,
  updateUserRole,
  updateUserStatus,
  getUserTeam,
  // 升级申请
  getUpgrades,
  getUpgradeDetail,
  getUpgradeStatistics,
  approveUpgrade,
  rejectUpgrade,
  confirmPayment,
  // 分佣管理
  getCommissions,
  getCommissionDetail,
  getCommissionStatistics,
  getCommissionRanking,
  settleCommission,
  cancelCommission,
  batchSettleCommissions,
  // 提现管理
  getWithdrawals,
  getWithdrawalDetail,
  getWithdrawalStatistics,
  processWithdrawal,
  completeWithdrawal,
  rejectWithdrawal,
  batchCompleteWithdrawals,
  exportWithdrawals,
  // 统计与配置
  getStatistics,
  getUserTrend,
  getRevenueTrend,
  getUpgradeTrend,
  getTeamCpRanking,
  getScpRanking,
  getConfigs,
  updateConfigs,
  // BossCP 投资管理
  getInvestments,
  getInvestmentDetail,
  getInvestmentStatistics,
  confirmInvestmentPayment,
  cancelInvestment,
  // 安装记录管理
  getInstallations,
  getInstallationDetail,
  // 设备心跳管理
  getDeviceHeartbeats,
  getInstallationStatistics,
  settleInstallation,
  batchSettleInstallations,
  // 海报管理
  getPosters,
  createPoster,
  updatePoster,
  deletePoster,
  updatePosterStatus
}
