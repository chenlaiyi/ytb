import request from '@/utils/request'

/**
 * 星驿付服务商绑定管理 API
 */

// 获取支付机构用户列表（用于星驿付绑定管理）
export function getStarpayBindingList(params) {
  return request({
    url: '/api/admin/v1/starpay-bindings',
    method: 'get',
    params
  })
}

// 获取星驿付服务商列表（用于下拉选择）
export function getStarpayPartners(params) {
  return request({
    url: '/api/admin/v1/starpay-bindings/partners',
    method: 'get',
    params
  })
}

// 获取单个用户的星驿付绑定详情
export function getStarpayBindingDetail(userId) {
  return request({
    url: `/api/admin/v1/starpay-bindings/${userId}`,
    method: 'get'
  })
}

// 绑定星驿付服务商
export function bindStarpayPartner(userId, data) {
  return request({
    url: `/api/admin/v1/starpay-bindings/${userId}/bind`,
    method: 'post',
    data
  })
}

// 解除星驿付服务商绑定
export function unbindStarpayPartner(userId) {
  return request({
    url: `/api/admin/v1/starpay-bindings/${userId}/unbind`,
    method: 'post'
  })
}
