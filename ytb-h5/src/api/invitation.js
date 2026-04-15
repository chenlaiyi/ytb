import request from '@/utils/request';

/**
 * 获取邀请函列表
 * @param {Object} params 查询参数
 * @param {string} params.keyword 搜索关键词
 * @param {string} params.status 状态筛选
 * @param {string} params.order_by 排序字段
 * @param {string} params.order_dir 排序方向
 * @param {number} params.per_page 每页数量
 * @param {number} params.page 页码
 * @returns {Promise<Object>} 邀请函列表数据
 */
export function getInvitations(params) {
  return request({
    url: '/api/admin/v1/invitations',
    method: 'get',
    params
  });
}

/**
 * 获取邀请函详情
 * @param {number} id 邀请函ID
 * @returns {Promise<Object>} 邀请函详情数据
 */
export function getInvitation(id) {
  return request({
    url: `/api/admin/v1/invitations/${id}`,
    method: 'get'
  });
}

/**
 * 创建邀请函
 * @param {Object} data 邀请函数据
 * @returns {Promise<Object>} 创建结果
 */
export function createInvitation(data) {
  return request({
    url: '/api/admin/v1/invitations',
    method: 'post',
    data
  });
}

/**
 * 更新邀请函
 * @param {number} id 邀请函ID
 * @param {Object} data 邀请函数据
 * @returns {Promise<Object>} 更新结果
 */
export function updateInvitation(id, data) {
  return request({
    url: `/api/admin/v1/invitations/${id}`,
    method: 'put',
    data
  });
}

/**
 * 删除邀请函
 * @param {number} id 邀请函ID
 * @returns {Promise<Object>} 删除结果
 */
export function deleteInvitation(id) {
  return request({
    url: `/api/admin/v1/invitations/${id}`,
    method: 'delete'
  });
}

/**
 * 更新邀请函状态
 * @param {number} id 邀请函ID
 * @param {number} status 状态值
 * @returns {Promise<Object>} 更新结果
 */
export function updateInvitationStatus(id, status) {
  return request({
    url: `/api/admin/v1/invitations/${id}/status`,
    method: 'put',
    data: { status }
  });
}

/**
 * 获取邀请函统计数据
 * @param {number} id 邀请函ID
 * @returns {Promise<Object>} 统计数据
 */
export function getInvitationStatistics(id) {
  return request({
    url: `/api/admin/v1/invitations/${id}/statistics`,
    method: 'get'
  });
}

/**
 * 获取邀请函报名记录列表
 * @param {Object} params 查询参数
 * @param {number} params.invitation_id 邀请函ID
 * @param {string} params.keyword 搜索关键词
 * @param {string} params.status 状态筛选
 * @param {string} params.start_date 开始日期
 * @param {string} params.end_date 结束日期
 * @param {string} params.order_by 排序字段
 * @param {string} params.order_dir 排序方向
 * @param {number} params.per_page 每页数量
 * @param {number} params.page 页码
 * @returns {Promise<Object>} 报名记录列表数据
 */
export function getRegistrations(params) {
  return request({
    url: '/api/admin/v1/invitation-registrations',
    method: 'get',
    params
  });
}

/**
 * 获取报名记录详情
 * @param {number} id 报名记录ID
 * @returns {Promise<Object>} 报名记录详情数据
 */
export function getRegistration(id) {
  return request({
    url: `/api/admin/v1/invitation-registrations/${id}`,
    method: 'get'
  });
}

/**
 * 创建报名记录
 * @param {Object} data 报名记录数据
 * @returns {Promise<Object>} 创建结果
 */
export function createRegistration(data) {
  return request({
    url: '/api/admin/v1/invitation-registrations',
    method: 'post',
    data
  });
}

/**
 * 更新报名记录
 * @param {number} id 报名记录ID
 * @param {Object} data 报名记录数据
 * @returns {Promise<Object>} 更新结果
 */
export function updateRegistration(id, data) {
  return request({
    url: `/api/admin/v1/invitation-registrations/${id}`,
    method: 'put',
    data
  });
}

/**
 * 删除报名记录
 * @param {number} id 报名记录ID
 * @returns {Promise<Object>} 删除结果
 */
export function deleteRegistration(id) {
  return request({
    url: `/api/admin/v1/invitation-registrations/${id}`,
    method: 'delete'
  });
}

/**
 * 更新报名记录状态
 * @param {number} id 报名记录ID
 * @param {number} status 状态值
 * @returns {Promise<Object>} 更新结果
 */
export function updateRegistrationStatus(id, status) {
  return request({
    url: `/api/admin/v1/invitation-registrations/${id}/status`,
    method: 'put',
    data: { status }
  });
}

/**
 * 签到
 * @param {number} id 报名记录ID
 * @returns {Promise<Object>} 签到结果
 */
export function checkIn(id) {
  return request({
    url: `/api/admin/v1/invitation-registrations/${id}/check-in`,
    method: 'post'
  });
}

/**
 * 导出报名记录
 * @param {number} invitationId 邀请函ID
 * @returns {Promise<Object>} 导出数据
 */
export function exportRegistrations(invitationId) {
  return request({
    url: '/api/admin/v1/invitation-registrations/export',
    method: 'post',
    data: { invitation_id: invitationId }
  });
}
