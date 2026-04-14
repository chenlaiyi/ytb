import request from '@/utils/request'

export default {
  getDashboard() {
    return request({
      url: '/api/admin/v1/merchant/dashboard',
      method: 'get'
    })
  },

  getList(params) {
    return request({
      url: '/api/admin/v1/merchant/list',
      method: 'get',
      params
    })
  },

  getDetail(id, params = {}) {
    return request({
      url: `/api/admin/v1/merchant/${id}`,
      method: 'get',
      params
    })
  },

  getOnboardingStats() {
    return request({
      url: '/api/admin/v1/merchant/onboarding/stats',
      method: 'get'
    })
  },

  getStatsTrend(params) {
    return request({
      url: '/api/admin/v1/merchant/stats/trend',
      method: 'get',
      params
    })
  },

  auditOnboarding(id, data) {
    return request({
      url: `/api/admin/v1/merchant/onboarding/${id}/audit`,
      method: 'put',
      data
    })
  }
}
