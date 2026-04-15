import request from '@/utils/request'

export function getOpenDataCockpit(params) {
  return request({
    url: '/api/open/v1/data-cockpit',
    method: 'get',
    params,
    skipAuthErrorToast: true,
  })
}

