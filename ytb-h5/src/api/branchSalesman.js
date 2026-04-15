import request from '@/utils/request'

/**
 * 分支机构业务员相关API
 */

// 获取分支机构业务员信息
export function getBranchSalesmanInfo(params = {}) {
  return request({
    url: '/api/branch/salesman/info',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构业务员统计数据
export function getBranchSalesmanStats(params = {}) {
  return request({
    url: '/api/branch/salesman/stats',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构业务员客户列表
export function getBranchSalesmanCustomers(params = {}) {
  return request({
    url: '/api/branch/salesman/customers',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构业务员佣金记录
export function getBranchSalesmanCommissions(params = {}) {
  return request({
    url: '/api/branch/salesman/commissions',
    method: 'get',
    params,
    skipAuthToken: false
  })
}

// 获取分支机构业务员佣金详情
export function getBranchSalesmanCommissionDetail(id) {
  return request({
    url: `/api/salesman/commission/${id}`,
    method: 'get',
    skipAuthToken: false
  })
}

// 获取分支机构业务员邀请安装记录
export function getBranchSalesmanInstallations(params = {}) {
  return request({
    url: '/api/salesman/installations',
    method: 'get',
    params,
    skipAuthToken: false
  })
}

// 邀请装机
export function inviteInstallation(params = {}) {
  return request({
    url: '/api/branch/salesman/invite_installation',
    method: 'post',
    data: params,
    skipAuthToken: false
  })
}

// 获取分支机构业务员产品列表
export function getBranchSalesmanProducts(params = {}) {
  return request({
    url: '/api/salesman/products',
    method: 'get',
    params,
    skipAuthToken: false
  })
}

// 获取分支机构业务员产品详情
export function getBranchSalesmanProductDetail(productId) {
  return request({
    url: `/api/salesman/product/${productId}`,
    method: 'get',
    skipAuthToken: false
  })
}

// 获取分支机构业务员目标设置
export function getBranchSalesmanTargets(params = {}) {
  return request({
    url: '/api/salesman/targets',
    method: 'get',
    params,
    skipAuthToken: false
  })
}

// 邀请取水
export function inviteWater(params = {}) {
  return request({
    url: '/api/branch/salesman/invite_water',
    method: 'post',
    data: params,
    skipAuthToken: false
  })
}

// 更新分支机构业务员目标
export function updateBranchSalesmanTarget(data) {
  return request({
    url: '/api/branch/salesman/target/update',
    method: 'post',
    data,
    skipAuthToken: false
  })
}

// 获取分支机构业务员排行榜
export function getBranchSalesmanRanking(params = {}) {
  return request({
    url: '/api/branch/salesman/ranking',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取业务员工作台数据
export function getBranchSalesmanWorkspace(params = {}) {
  return request({
    url: '/api/branch/salesman/workspace',
    method: 'get',
    params,
    skipAuthToken: false
  })
}

// 获取分支机构业务员培训资料
export function getBranchSalesmanTrainingMaterials(params = {}) {
  return request({
    url: '/api/branch/salesman/training/materials',
    method: 'get',
    params,
    skipAuthToken: false
  })
}

// 获取分支机构业务员客户详情
export function getBranchSalesmanCustomerDetail(customerId) {
  return request({
    url: `/api/branch/salesman/customer/${customerId}`,
    method: 'get',
    skipAuthToken: false
  })
}

// 添加分支机构业务员客户
export function addBranchSalesmanCustomer(data) {
  return request({
    url: '/api/branch/salesman/customer/add',
    method: 'post',
    data,
    skipAuthToken: false
  })
}

// 更新分支机构业务员客户信息
export function updateBranchSalesmanCustomer(data) {
  return request({
    url: '/api/branch/salesman/customer/update',
    method: 'post',
    data,
    skipAuthToken: false
  })
}

// 获取分支机构业务员月度业绩
export function getBranchSalesmanMonthlyPerformance(params = {}) {
  return request({
    url: '/api/branch/salesman/monthly-performance',
    method: 'get',
    params,
    skipAuthToken: false
  })
}

// 获取分支机构业务员收益明细
export function getBranchSalesmanEarnings(params = {}) {
  return request({
    url: '/api/branch/salesman/earnings',
    method: 'get',
    params,
    skipAuthToken: false
  })
}

// 申请分支机构业务员提现
export function applyBranchSalesmanWithdraw(data) {
  return request({
    url: '/api/branch/salesman/withdraw/apply',
    method: 'post',
    data,
    skipAuthToken: false
  })
}

// 获取分支机构业务员提现记录
export function getBranchSalesmanWithdrawRecords(params = {}) {
  return request({
    url: '/api/branch/salesman/withdraw/records',
    method: 'get',
    params,
    skipAuthToken: false
  })
}

// 获取分支机构业务员通知公告
export function getBranchSalesmanAnnouncements(params = {}) {
  return request({
    url: '/api/branch/salesman/announcements',
    method: 'get',
    params,
    skipAuthToken: false
  })
}

// 获取分支机构业务员工作日志
export function getBranchSalesmanWorkLogs(params = {}) {
  return request({
    url: '/api/branch/salesman/work-logs',
    method: 'get',
    params,
    skipAuthToken: false
  })
}

// 创建分支机构业务员工作日志
export function createBranchSalesmanWorkLog(data) {
  return request({
    url: '/api/branch/salesman/work-log/create',
    method: 'post',
    data,
    skipAuthToken: false
  })
}

// 获取分支机构业务员设置
export function getBranchSalesmanSettings(params = {}) {
  return request({
    url: '/api/branch/salesman/settings',
    method: 'get',
    params,
    skipAuthToken: false
  })
}

// 更新分支机构业务员设置
export function updateBranchSalesmanSettings(data) {
  return request({
    url: '/api/branch/salesman/settings/update',
    method: 'post',
    data,
    skipAuthToken: false
  })
}

// 获取分支机构业务员团队信息
export function getBranchSalesmanTeam(params = {}) {
  return request({
    url: '/api/branch/salesman/team',
    method: 'get',
    params,
    skipAuthToken: false
  })
}

// 邀请分支机构业务员团队成员
export function inviteBranchSalesmanTeamMember(data) {
  return request({
    url: '/api/branch/salesman/team/invite',
    method: 'post',
    data,
    skipAuthToken: false
  })
} 