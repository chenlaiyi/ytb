import request from '@/utils/request'

const CONFIG_PREFIX = '/api/admin/v1/mall/config'

export function getMallConfigOverview() {
  return request({
    url: `${CONFIG_PREFIX}/overview`,
    method: 'get'
  })
}

export function getMallBasicSettings() {
  return request({
    url: `${CONFIG_PREFIX}/settings`,
    method: 'get'
  })
}

export function updateMallBasicSettings(data) {
  return request({
    url: `${CONFIG_PREFIX}/settings`,
    method: 'put',
    data
  })
}

export function getMallPaymentSettings() {
  return request({
    url: `${CONFIG_PREFIX}/payment`,
    method: 'get'
  })
}

export function updateMallPaymentSettings(data) {
  return request({
    url: `${CONFIG_PREFIX}/payment`,
    method: 'put',
    data
  })
}
