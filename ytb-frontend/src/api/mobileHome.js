import request from '@/utils/axios'

export function fetchMobileHomeConfig() {
  return request({
    url: '/api/admin/v1/mobile-home',
    method: 'get'
  })
}

export function saveMobileHomeConfig(config) {
  return request({
    url: '/api/admin/v1/mobile-home',
    method: 'post',
    data: {
      config
    }
  })
}
