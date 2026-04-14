import request from '@/utils/request'

/**
 * 版本管理API
 */
export const versionApi = {
  // 获取版本列表
  getVersions(params = {}) {
    return request({
      url: '/api/admin/v1/app-management/diandian/versions',
      method: 'GET',
      params
    })
  },

  // 获取版本详情
  getVersion(id) {
    return request({
      url: `/api/admin/v1/app-management/diandian/versions/${id}`,
      method: 'GET'
    })
  },

  // 创建版本
  createVersion(data) {
    return request({
      url: '/api/admin/v1/app-management/diandian/versions',
      method: 'POST',
      data,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 更新版本
  updateVersion(id, data) {
    return request({
      url: `/api/admin/v1/app-management/diandian/versions/${id}`,
      method: 'PUT',
      data,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 删除版本
  deleteVersion(id) {
    return request({
      url: `/api/admin/v1/app-management/diandian/versions/${id}`,
      method: 'DELETE'
    })
  },

  // 发布版本
  publishVersion(id) {
    return request({
      url: `/api/admin/v1/app-management/diandian/versions/${id}/publish`,
      method: 'POST'
    })
  },

  // 取消发布
  unpublishVersion(id) {
    return request({
      url: `/api/admin/v1/app-management/diandian/versions/${id}/unpublish`,
      method: 'POST'
    })
  },

  // 获取平台统计
  getPlatformStats() {
    return request({
      url: '/api/admin/v1/app-management/diandian/versions/stats',
      method: 'GET'
    })
  },

  // 获取选项
  getOptions() {
    return request({
      url: '/api/admin/v1/app-management/diandian/versions/options',
      method: 'GET'
    })
  }
}

export default versionApi
