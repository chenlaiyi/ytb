import request from '@/utils/request'

/**
 * 分支机构微信群发消息管理API
 */

// 获取群发消息统计数据
export function getMassMessageStats(branchId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/mass-message/stats`,
    method: 'get'
  })
}

// 获取群发消息列表
export function getMassMessageList(branchId, params = {}) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/mass-message`,
    method: 'get',
    params
  })
}

// 获取群发消息详情
export function getMassMessageDetail(branchId, msgId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/mass-message/${msgId}`,
    method: 'get'
  })
}

// 创建群发消息
export function createMassMessage(branchId, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/mass-message`,
    method: 'post',
    data
  })
}

// 更新群发消息
export function updateMassMessage(branchId, msgId, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/mass-message/${msgId}`,
    method: 'put',
    data
  })
}

// 发送群发消息
export function sendMassMessage(branchId, msgId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/mass-message/${msgId}/send`,
    method: 'post'
  })
}

// 删除群发消息
export function deleteMassMessage(branchId, msgId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/mass-message/${msgId}`,
    method: 'delete'
  })
}

// 获取群发消息状态
export function getMassMessageStatus(branchId, msgId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/mass-message/${msgId}/status`,
    method: 'get'
  })
}

// 获取群发目标选项
export function getTargetOptions(branchId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/mass-message/target-options`,
    method: 'get'
  })
} 