import request from '@/utils/request'

/**
 * 分支机构微信素材管理API
 */

// 获取素材统计数据
export function getMaterialStats(branchId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/materials/stats`,
    method: 'get'
  })
}

// 获取素材列表（新版本，支持分页和筛选）
export function getMaterialList(branchId, params = {}) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/materials`,
    method: 'get',
    params
  })
}

// 获取素材列表（旧版本，按类型）
export function getMaterialsList(branchId, type = 'news', params = {}) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/materials/${type}`,
    method: 'get',
    params
  })
}

// 获取素材详情
export function getMaterialDetail(branchId, type, mediaId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/materials/${type}/${mediaId}`,
    method: 'get'
  })
}

// 下载素材
export function downloadMaterial(branchId, mediaId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/materials/${mediaId}/download`,
    method: 'get'
  })
}

// 上传素材
export function uploadMaterial(branchId, type, formData) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/materials/upload/${type}`,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 删除素材（新版本，只需要mediaId）
export function deleteMaterial(branchId, mediaId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/materials/${mediaId}`,
    method: 'delete'
  })
}

// 删除素材（旧版本，需要type和mediaId）
export function deleteMaterialByType(branchId, type, mediaId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/materials/${type}/${mediaId}`,
    method: 'delete'
  })
}

// 创建图文消息
export function createNews(branchId, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/materials/news`,
    method: 'post',
    data
  })
}

// 更新图文消息
export function updateNews(branchId, mediaId, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/materials/news/${mediaId}`,
    method: 'put',
    data
  })
}

// 同步素材数据
export function syncMaterials(branchId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/materials/sync`,
    method: 'post'
  })
} 