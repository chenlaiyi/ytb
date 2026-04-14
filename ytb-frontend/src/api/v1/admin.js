import request from '@/utils/request'

/**
 * 获取管理员列表
 * @param {Object} params 查询参数
 * @returns {Promise} 管理员列表
 */
export function getAdminList(params) {
  return request({
    url: '/api/admin/v1/system/admins',
    method: 'get',
    params
  })
}

/**
 * 获取管理员详情
 * @param {number} id 管理员ID
 * @returns {Promise} 管理员详情
 */
export function getAdminDetail(id) {
  return request({
    url: `/api/admin/v1/system/admins/${id}`,
    method: 'get'
  })
}

/**
 * 创建管理员
 * @param {Object} data 管理员数据
 * @returns {Promise} 创建结果
 */
export function createAdmin(data) {
  return request({
    url: '/api/admin/v1/system/admins',
    method: 'post',
    data
  })
}

/**
 * 更新管理员
 * @param {number} id 管理员ID
 * @param {Object} data 管理员数据
 * @returns {Promise} 更新结果
 */
export function updateAdmin(id, data) {
  return request({
    url: `/api/admin/v1/system/admins/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除管理员
 * @param {number} id 管理员ID
 * @returns {Promise} 删除结果
 */
export function deleteAdmin(id) {
  return request({
    url: `/api/admin/v1/system/admins/${id}`,
    method: 'delete'
  })
}

/**
 * 更新管理员状态
 * @param {number} id 管理员ID
 * @param {string} status 状态
 * @returns {Promise} 更新结果
 */
export function updateAdminStatus(id, status) {
  return request({
    url: `/api/admin/v1/system/admins/${id}/status`,
    method: 'put',
    data: { status }
  })
}

/**
 * 重置管理员密码
 * @param {number} id 管理员ID
 * @param {string} password 新密码
 * @returns {Promise} 重置结果
 */
export function resetAdminPassword(id, password) {
  return request({
    url: `/api/admin/v1/system/admins/${id}/reset-password`,
    method: 'post',
    data: { password }
  })
}

/**
 * 获取角色列表
 * @returns {Promise} 角色列表
 */
export function getAdminRoles() {
  return request({
    url: '/api/admin/v1/system/admins/roles',
    method: 'get'
  })
}

/**
 * 获取管理员权限
 * @param {string} id 管理员ID
 * @returns {Promise} 权限列表
 */
export function getAdminPermissions(id) {
  return request({
    url: `/api/admin/v1/system/admins/${id}/permissions`,
    method: 'get'
  });
}

/**
 * 批量删除管理员
 * @param {Array} ids 管理员ID数组
 * @returns {Promise} 删除结果
 */
export function batchDeleteAdmins(ids) {
  return request({
    url: '/api/admin/v1/system/admins/batch-delete',
    method: 'post',
    data: { ids }
  });
}

/**
 * 导出管理员数据
 * @param {Object} params 导出参数
 * @returns {Promise} 导出结果
 */
export function exportAdmins(params) {
  return request({
    url: '/api/admin/v1/system/admins/export',
    method: 'get',
    params,
    responseType: 'blob'
  });
}

export default {
  getAdminList,
  getAdminDetail,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  updateAdminStatus,
  resetAdminPassword,
  getAdminRoles,
  getAdminPermissions,
  batchDeleteAdmins,
  exportAdmins
};
