import request from '@/utils/request'

/**
 * 获取分支机构统计数据
 * @param {number} branchId 分支机构ID
 * @returns {Promise}
 */
export function getBranchStatistics(branchId) {
  return request({
    url: `/api/admin/v1/branch-organizations/${branchId}/statistics`,
    method: 'get'
  })
}

/**
 * 获取分支机构动态
 * @param {number} branchId 分支机构ID
 * @param {object} params 查询参数
 * @returns {Promise}
 */
export function getBranchActivities(branchId, params = {}) {
  return request({
    url: `/api/admin/v1/branch-organizations/${branchId}/activities`,
    method: 'get',
    params
  })
}

/**
 * 获取分支机构成员列表
 * @param {number} branchId 分支机构ID
 * @param {object} params 查询参数
 * @returns {Promise}
 */
export function getBranchMembers(branchId, params = {}) {
  return request({
    url: `/admin/api/branch/members.php`,
    method: 'get',
    params: { branch_id: branchId, ...params }
  })
}

/**
 * 获取分支机构VIP分红数据
 * @param {number} branchId 分支机构ID
 * @param {object} params 查询参数
 * @returns {Promise}
 */
export function getBranchVipDividends(branchId, params = {}) {
  return request({
    url: `/admin/api/branch/vip-dividends.php`,
    method: 'get',
    params: { branch_id: branchId, ...params }
  })
}

/**
 * 获取用户所属分支机构信息
 * @returns {Promise}
 */
export function getUserBranchInfo() {
  return request({
    url: `/admin/api/user/branch-info.php`,
    method: 'get'
  })
}

/**
 * 申请更换分支机构
 * @param {object} data 申请数据
 * @returns {Promise}
 */
export function applyBranchTransfer(data) {
  return request({
    url: `/admin/api/branch/transfer-apply.php`,
    method: 'post',
    data
  })
} 