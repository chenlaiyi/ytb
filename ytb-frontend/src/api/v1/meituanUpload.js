import request from '@/utils/request'

export function uploadMeituanData(formData) {
  return request({
    url: '/api/admin/v1/meituan/uploads',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function fetchMeituanUploadRecords(params = {}) {
  return request({
    url: '/api/admin/v1/meituan/uploads',
    method: 'get',
    params
  })
}
