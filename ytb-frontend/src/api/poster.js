import request from '@/utils/request'

/**
 * 海报管理API
 */
export const posterApi = {
  /**
   * 获取海报列表
   * @param {Object} params - 查询参数
   */
  getList(params = {}) {
    return request.get('/api/admin/api/v1/posters', { params })
  },

  /**
   * 获取海报详情
   * @param {Number} id - 海报ID
   */
  getDetail(id) {
    return request.get(`/api/admin/api/v1/posters/${id}`)
  },

  /**
   * 创建海报
   * @param {Object} data - 海报数据
   */
  create(data) {
    return request.post('/api/admin/api/v1/posters', data)
  },

  /**
   * 更新海报
   * @param {Number} id - 海报ID
   * @param {Object} data - 海报数据
   */
  update(id, data) {
    return request.put(`/api/admin/api/v1/posters/${id}`, data)
  },

  /**
   * 删除海报
   * @param {Number} id - 海报ID
   */
  delete(id) {
    return request.delete(`/api/admin/api/v1/posters/${id}`)
  },

  /**
   * 更新海报状态
   * @param {Number} id - 海报ID
   * @param {Number} status - 状态
   */
  updateStatus(id, status) {
    return request.patch(`/api/admin/api/v1/posters/${id}/status`, { status })
  },

  /**
   * 批量更新状态
   * @param {Array} ids - 海报ID数组
   * @param {Number} status - 状态
   */
  batchUpdateStatus(ids, status) {
    return request.patch('/api/admin/api/v1/posters/batch/status', { ids, status })
  },

  /**
   * 批量删除
   * @param {Array} ids - 海报ID数组
   */
  batchDelete(ids) {
    return request.delete('/api/admin/api/v1/posters/batch', { data: { ids } })
  },

  /**
   * 复制海报
   * @param {Number} id - 海报ID
   */
  copy(id) {
    return request.post(`/api/admin/api/v1/posters/${id}/copy`)
  },

  /**
   * 生成海报
   * @param {Number} id - 海报ID
   * @param {Object} config - 生成配置
   */
  generatePoster(id, config = {}) {
    return request.post(`/api/admin/api/v1/posters/${id}/generate`, config)
  },

  /**
   * 预览海报
   * @param {Object} data - 海报数据
   */
  previewPoster(data) {
    return request.post('/api/admin/api/v1/posters/preview', data)
  },

  /**
   * 获取海报统计
   * @param {Number} id - 海报ID
   */
  getStatistics(id) {
    return request.get(`/api/admin/api/v1/posters/${id}/statistics`)
  },

  /**
   * 获取海报模板
   */
  getTemplates() {
    return request.get('/api/admin/api/v1/posters/templates')
  },

  /**
   * 获取表单字段模板
   */
  getFormFieldTemplates() {
    return request.get('/api/admin/api/v1/posters/form-field-templates')
  },

  /**
   * 上传图片
   * @param {FormData} formData - 图片数据
   */
  uploadImage(formData) {
    return request.post('/api/admin/api/v1/posters/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  /**
   * 导出数据
   * @param {Number} id - 海报ID
   */
  exportData(id) {
    return request.get(`/api/admin/api/v1/posters/${id}/export`, {
      responseType: 'blob'
    })
  },

  /**
   * 获取报名记录
   * @param {Number} id - 海报ID
   * @param {Object} params - 查询参数
   */
  getRegistrations(id, params = {}) {
    return request.get(`/api/admin/api/v1/posters/${id}/registrations`, { params })
  },

  /**
   * 导出报名记录
   * @param {Number} id - 海报ID
   */
  exportRegistrations(id) {
    return request.get(`/api/admin/api/v1/posters/${id}/registrations/export`, {
      responseType: 'blob'
    })
  },

  /**
   * 获取报名统计
   * @param {Number} id - 海报ID
   */
  getRegistrationStatistics(id) {
    return request.get(`/api/admin/api/v1/posters/${id}/registrations/statistics`)
  },

  /**
   * 删除报名记录
   * @param {Number} id - 报名记录ID
   */
  deleteRegistration(id) {
    return request.delete(`/api/admin/api/v1/poster-registrations/${id}`)
  },

  /**
   * 报名记录签到
   * @param {Number} id - 报名记录ID
   */
  checkInRegistration(id) {
    return request.post(`/api/admin/api/v1/poster-registrations/${id}/check-in`)
  },

  /**
   * 批量更新报名记录状态
   * @param {Array} ids - 报名记录ID数组
   * @param {Number} status - 状态
   */
  batchUpdateRegistrationStatus(ids, status) {
    return request.patch('/api/admin/api/v1/poster-registrations/batch/status', { ids, status })
  },

  /**
   * 批量签到
   * @param {Array} ids - 报名记录ID数组
   */
  batchCheckInRegistrations(ids) {
    return request.post('/api/admin/api/v1/poster-registrations/batch/check-in', { ids })
  }
}

export default posterApi 
