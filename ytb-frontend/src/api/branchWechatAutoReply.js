import request from '@/utils/request'

/**
 * 分支机构微信自动回复管理API
 */

// 获取自动回复列表
export function getAutoReplyList(branchId, params = {}) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/auto-reply`,
    method: 'get',
    params
  })
}

// 获取自动回复详情
export function getAutoReplyDetail(branchId, id) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/auto-reply/${id}`,
    method: 'get'
  })
}

// 创建自动回复
export function createAutoReply(branchId, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/auto-reply`,
    method: 'post',
    data
  })
}

// 更新自动回复
export function updateAutoReply(branchId, id, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/auto-reply/${id}`,
    method: 'put',
    data
  })
}

// 删除自动回复
export function deleteAutoReply(branchId, id) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/auto-reply/${id}`,
    method: 'delete'
  })
}

// 切换自动回复状态
export function toggleAutoReplyStatus(branchId, id) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/auto-reply/${id}/status`,
    method: 'put'
  })
}

// 测试自动回复
export function testAutoReply(branchId, id) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/auto-reply/${id}/test`,
    method: 'post'
  })
}

// 获取关键字回复列表
export function getKeywordReplies(branchId, params = {}) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/auto-reply`,
    method: 'get',
    params
  })
}

// 创建关键字回复
export function createKeywordReply(branchId, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/auto-reply`,
    method: 'post',
    data
  })
}

// 更新关键字回复
export function updateKeywordReply(branchId, id, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/auto-reply/${id}`,
    method: 'put',
    data
  })
}

// 删除关键字回复
export function deleteKeywordReply(branchId, id) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/auto-reply/${id}`,
    method: 'delete'
  })
}

// 更新关注回复
export function updateSubscribeReply(branchId, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/auto-reply/subscribe`,
    method: 'put',
    data
  })
}

// 更新默认回复
export function updateDefaultReply(branchId, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/auto-reply/default`,
    method: 'put',
    data
  })
} 