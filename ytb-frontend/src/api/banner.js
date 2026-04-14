import request from '@/utils/request'

// 获取Banner列表
export function getBannerList(params) {
  return request({
    url: '/api/admin/v1/app-management/diandian/banners',
    method: 'get',
    params
  })
}

// 创建Banner
export function createBanner(data) {
  return request({
    url: '/api/admin/v1/app-management/diandian/banners',
    method: 'post',
    data
  })
}

// 获取Banner详情
export function getBannerDetail(id) {
  return request({
    url: `/api/admin/v1/app-management/diandian/banners/${id}`,
    method: 'get'
  })
}

// 更新Banner
export function updateBanner(id, data) {
  return request({
    url: `/api/admin/v1/app-management/diandian/banners/${id}`,
    method: 'put',
    data
  })
}

// 删除Banner
export function deleteBanner(id) {
  return request({
    url: `/api/admin/v1/app-management/diandian/banners/${id}`,
    method: 'delete'
  })
}

// 获取Banner位置列表
export function getBannerPositions() {
  return request({
    url: '/api/admin/v1/app-management/diandian/banners/positions',
    method: 'get'
  })
}

// 更新Banner排序
export function updateBannerSort(data) {
  return request({
    url: '/api/admin/v1/app-management/diandian/banners/sort',
    method: 'post',
    data
  })
}
