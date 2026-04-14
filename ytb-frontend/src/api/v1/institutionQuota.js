import request from '@/utils/request'

/**
 * 获取机构额度权益包
 */
export function fetchQuotaPackages() {
  return request({
    url: '/api/admin/v1/institutions/quota/packages',
    method: 'get'
  })
}

/**
 * 获取机构额度概览
 * @param {number} institutionId
 */
export function fetchInstitutionQuotaSummary(institutionId) {
  return request({
    url: `/api/admin/v1/institutions/${institutionId}/quota/summary`,
    method: 'get'
  })
}

/**
 * 获取额度购买记录
 * @param {object} params
 */
export function fetchQuotaPurchases(params = {}) {
  return request({
    url: '/api/admin/v1/institutions/quota/purchases',
    method: 'get',
    params
  })
}

/**
 * 新增额度购买记录
 * @param {object} data
 */
export function createQuotaPurchase(data) {
  return request({
    url: '/api/admin/v1/institutions/quota/purchases',
    method: 'post',
    data
  })
}

/**
 * 删除额度购买记录
 * @param {number} id
 */
export function deleteQuotaPurchase(id) {
  return request({
    url: `/api/admin/v1/institutions/quota/purchases/${id}`,
    method: 'delete'
  })
}

/**
 * 获取机构邀请码
 * @param {number} institutionId
 * @param {object} params
 */
export function fetchQuotaInvites(institutionId, params = {}) {
  return request({
    url: `/api/admin/v1/institutions/${institutionId}/quota/invites`,
    method: 'get',
    params
  })
}
