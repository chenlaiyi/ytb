import request from '@/utils/request'

// 分支机构微信菜单相关API
export const branchApi = {
  // 获取分支机构信息
  getBranchInfo(branchId) {
    return request({
      url: `/admin/api/admin/v1/branches/${branchId}`,
      method: 'get'
    })
  },

  // 获取微信菜单
  getWechatMenu(branchId) {
    return request({
      url: `/admin/api/admin/v1/branches/${branchId}/wechat/menu`,
      method: 'get'
    })
  },

  // 从微信同步菜单
  syncWechatMenu(branchId) {
    return request({
      url: `/admin/api/admin/v1/branches/${branchId}/wechat/menu/sync`,
      method: 'post'
    })
  },

  // 保存微信菜单配置
  saveWechatMenu(branchId, data) {
    return request({
      url: `/admin/api/admin/v1/branches/${branchId}/wechat/menu`,
      method: 'post',
      data
    })
  },

  // 发布菜单到微信
  publishWechatMenu(branchId, data) {
    return request({
      url: `/admin/api/admin/v1/branches/${branchId}/wechat/menu/publish`,
      method: 'post',
      data
    })
  }
}

// ========== 微信自动回复相关API ==========

// 获取自动回复规则列表
export function getAutoReplies(branchId, params = {}) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/auto-reply`,
    method: 'get',
    params
  })
}

// 创建自动回复规则
export function createAutoReply(branchId, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/auto-reply`,
    method: 'post',
    data
  })
}

// 获取自动回复规则详情
export function getAutoReply(branchId, ruleId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/auto-reply/${ruleId}`,
    method: 'get'
  })
}

// 更新自动回复规则
export function updateAutoReply(branchId, ruleId, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/auto-reply/${ruleId}`,
    method: 'put',
    data
  })
}

// 删除自动回复规则
export function deleteAutoReply(branchId, ruleId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/auto-reply/${ruleId}`,
    method: 'delete'
  })
}

// 批量删除自动回复规则
export function batchDeleteAutoReplies(branchId, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/auto-reply/batch-delete`,
    method: 'post',
    data
  })
}

// 更新自动回复规则状态
export function updateAutoReplyStatus(branchId, ruleId, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/auto-reply/${ruleId}/status`,
    method: 'patch',
    data
  })
}

// 检查关键字是否重复
export function checkKeyword(branchId, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/auto-reply/check-keyword`,
    method: 'post',
    data
  })
}

// 获取特殊消息回复设置
export function getSpecialReplies(branchId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/auto-reply/special`,
    method: 'get'
  })
}

// 更新特殊消息回复设置
export function updateSpecialReply(branchId, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/auto-reply/special`,
    method: 'post',
    data
  })
}

export default branchApi 