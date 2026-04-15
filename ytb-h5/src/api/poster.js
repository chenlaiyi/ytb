import request from '@/utils/request'

/**
 * 手机端海报API
 */
export const posterApi = {
  /**
   * 获取海报详情
   * @param {String} id - 海报ID
   */
  getDetail(id) {
    return request.get(`/admin/api/v1/posters/${id}`)
  },

  /**
   * 检查用户是否已报名
   * @param {String} posterId - 海报ID
   */
  checkRegistration(posterId) {
    return request.get(`/admin/api/v1/posters/${posterId}/check-registration`)
  },

  /**
   * 获取海报统计数据
   * @param {String} id - 海报ID
   */
  getStatistics(id) {
    return request.get(`/admin/api/v1/posters/${id}/statistics`)
  },

  /**
   * 分享海报
   * @param {String} id - 海报ID
   * @param {Object} data - 分享数据
   */
  share(id, data) {
    return request.post(`/admin/api/v1/posters/${id}/share`, data)
  }
}

/**
 * 手机端报名API
 */
export const posterRegistrationApi = {
  /**
   * 提交报名
   * @param {Object} data - 报名数据
   */
  create(data) {
    return request.post('/admin/api/v1/poster-registrations', data)
  },

  /**
   * 获取用户的报名记录
   * @param {String} posterId - 海报ID
   */
  getUserRegistration(posterId) {
    return request.get(`/admin/api/v1/posters/${posterId}/user-registration`)
  },

  /**
   * 更新报名信息
   * @param {String} id - 报名记录ID
   * @param {Object} data - 更新数据
   */
  update(id, data) {
    return request.put(`/admin/api/v1/poster-registrations/${id}`, data)
  },

  /**
   * 取消报名
   * @param {String} id - 报名记录ID
   */
  cancel(id) {
    return request.delete(`/admin/api/v1/poster-registrations/${id}`)
  },

  /**
   * 用户签到
   * @param {String} id - 报名记录ID
   */
  checkIn(id) {
    return request.post(`/admin/api/v1/poster-registrations/${id}/check-in`)
  }
}

export default posterApi 