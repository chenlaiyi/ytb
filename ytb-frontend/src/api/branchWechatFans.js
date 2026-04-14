import request from '@/utils/request'

/**
 * 分支机构微信粉丝管理API
 */

// 获取粉丝统计数据
export function getFansStats(branchId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fans/stats`,
    method: 'get'
  })
}

// 获取粉丝列表
export function getFansList(branchId, params = {}) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fans`,
    method: 'get',
    params
  })
}

// 获取粉丝详情
export function getFansDetail(branchId, openid) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fans/${openid}`,
    method: 'get'
  })
}

// 更新粉丝信息
export function updateFan(branchId, openid, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fans/${openid}`,
    method: 'put',
    data
  })
}

// 删除粉丝
export function deleteFan(branchId, openid) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fans/${openid}`,
    method: 'delete'
  })
}

// 批量删除粉丝
export function batchDeleteFans(branchId, openids) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fans/batch-delete`,
    method: 'post',
    data: { openids }
  })
}

// 批量移动粉丝到分组
export function batchMoveFansToGroup(branchId, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fans/batch-move-group`,
    method: 'post',
    data
  })
}

// 批量添加标签
export function batchAddTags(branchId, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fans/batch-add-tags`,
    method: 'post',
    data
  })
}

// 批量移除标签
export function batchRemoveTags(branchId, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fans/batch-remove-tags`,
    method: 'post',
    data
  })
}

// 获取分组统计
export function getGroupStats(branchId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fans/group-stats`,
    method: 'get'
  })
}

// 获取标签统计
export function getTagStats(branchId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fans/tag-stats`,
    method: 'get'
  })
}

// 获取增长趋势
export function getGrowthTrend(branchId, params = {}) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fans/growth-trend`,
    method: 'get',
    params
  })
}

// 同步粉丝数据
export function syncFansData(branchId, params = {}) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fans/sync`,
    method: 'post',
    data: params
  })
}

// 获取同步历史
export function getSyncHistory(branchId, params = {}) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fans/sync-history`,
    method: 'get',
    params
  })
}

// 导出粉丝数据
export function exportFans(branchId, params = {}) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fans/export`,
    method: 'post',
    data: params
  })
}

// 模拟同步数据（开发用）
export function mockSyncData(branchId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fans/mock-sync`,
    method: 'post'
  })
}

// ============ 粉丝分组管理 ============

// 获取粉丝分组列表
export function getFansGroups(branchId, params = {}) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fan-groups`,
    method: 'get',
    params
  })
}

// 创建粉丝分组
export function createFansGroup(branchId, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fan-groups`,
    method: 'post',
    data
  })
}

// 获取粉丝分组详情
export function getFansGroupDetail(branchId, groupId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fan-groups/${groupId}`,
    method: 'get'
  })
}

// 更新粉丝分组
export function updateFansGroup(branchId, groupId, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fan-groups/${groupId}`,
    method: 'put',
    data
  })
}

// 删除粉丝分组
export function deleteFansGroup(branchId, groupId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fan-groups/${groupId}`,
    method: 'delete'
  })
}

// 批量删除粉丝分组
export function batchDeleteFansGroups(branchId, groupIds) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fan-groups/batch-delete`,
    method: 'post',
    data: { group_ids: groupIds }
  })
}

// 更新分组状态
export function updateGroupStatus(branchId, groupId, status) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fan-groups/${groupId}/status`,
    method: 'put',
    data: { status }
  })
}

// 获取分组选项
export function getGroupOptions(branchId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fan-groups/options`,
    method: 'get'
  })
}

// 更新分组粉丝数量
export function updateGroupCount(branchId, groupId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fan-groups/${groupId}/update-count`,
    method: 'post'
  })
}

// ============ 粉丝标签管理 ============

// 获取粉丝标签列表
export function getFansTags(branchId, params = {}) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fan-tags`,
    method: 'get',
    params
  })
}

// 创建粉丝标签
export function createFansTag(branchId, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fan-tags`,
    method: 'post',
    data
  })
}

// 获取粉丝标签详情
export function getFansTagDetail(branchId, tagId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fan-tags/${tagId}`,
    method: 'get'
  })
}

// 更新粉丝标签
export function updateFansTag(branchId, tagId, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fan-tags/${tagId}`,
    method: 'put',
    data
  })
}

// 删除粉丝标签
export function deleteFansTag(branchId, tagId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fan-tags/${tagId}`,
    method: 'delete'
  })
}

// 批量删除粉丝标签
export function batchDeleteFansTags(branchId, tagIds) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fan-tags/batch-delete`,
    method: 'post',
    data: { tag_ids: tagIds }
  })
}

// 更新标签状态
export function updateTagStatus(branchId, tagId, status) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fan-tags/${tagId}/status`,
    method: 'put',
    data: { status }
  })
}

// 获取标签选项
export function getTagOptions(branchId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fan-tags/options`,
    method: 'get'
  })
}

// 获取预设颜色
export function getPresetColors() {
  return request({
    url: `/api/admin/v1/branches/0/wechat/fan-tags/preset-colors`,
    method: 'get'
  })
}

// 更新标签使用次数
export function updateTagUsageCount(branchId, tagId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fan-tags/${tagId}/update-usage`,
    method: 'post'
  })
}

// ============ 兼容性方法 ============

// 更新粉丝备注（兼容旧版本）
export function updateFansRemark(branchId, openid, remark) {
  return updateFan(branchId, openid, { remark })
}

// 移动粉丝到分组（兼容旧版本）
export function moveFansToGroup(branchId, openid, groupId) {
  if (Array.isArray(openid)) {
    return batchMoveFansToGroup(branchId, { openids: openid, group_id: groupId })
  }
  return updateFan(branchId, openid, { group_id: groupId })
} 