import request from '@/utils/axios'

// 获取安装预约列表
export function getInstallationBookingList(params) {
  return request({
    url: '/api/admin/v1/installation/bookings',
    method: 'get',
    params
  })
}

// 获取安装预约详情
export function getInstallationBookingDetail(id) {
  return request({
    url: `/api/admin/v1/installation/bookings/${id}`,
    method: 'get'
  })
}

// 获取安装预约详情（别名）
export function getInstallationBooking(id) {
  return getInstallationBookingDetail(id);
}

// 创建安装预约
export function createInstallationBooking(data) {
  return request({
    url: '/api/admin/v1/installation/bookings',
    method: 'post',
    data
  })
}

// 更新安装预约
export function updateInstallationBooking(id, data) {
  return request({
    url: `/api/admin/v1/installation/bookings/${id}`,
    method: 'put',
    data
  })
}

// 删除安装预约
export function deleteInstallationBooking(id) {
  return request({
    url: `/api/admin/v1/installation/bookings/${id}`,
    method: 'delete'
  })
}

// 更新预约状态
export function updateBookingStatus(id, status) {
  return request({
    url: `/api/admin/v1/installation/bookings/${id}/status`,
    method: 'put',
    data: { status }
  })
}

// 分配工程师
export function assignEngineer(id, engineerId) {
  return request({
    url: `/api/admin/v1/installation/bookings/${id}/assign-engineer`,
    method: 'put',
    data: { engineer_id: engineerId }
  })
}

// 获取可用工程师列表
export function getAvailableEngineers(params) {
  return request({
    url: '/api/admin/v1/installation/engineers/available',
    method: 'get',
    params
  })
}

// 获取工程师列表
export function getEngineerList(params) {
  return request({
    url: '/api/admin/v1/installation/engineers',
    method: 'get',
    params
  })
}

// 创建工程师
export function createEngineer(data) {
  return request({
    url: '/api/admin/v1/installation/engineers',
    method: 'post',
    data
  })
}

// 更新工程师
export function updateEngineer(id, data) {
  return request({
    url: `/api/admin/v1/installation/engineers/${id}`,
    method: 'put',
    data
  })
}

// 删除工程师
export function deleteEngineer(id) {
  return request({
    url: `/api/admin/v1/installation/engineers/${id}`,
    method: 'delete'
  })
}

// 获取安装统计数据
export function getInstallationStatistics(params) {
  return request({
    url: '/api/admin/v1/installation/statistics',
    method: 'get',
    params
  })
}

// 上传安装照片
export function uploadInstallationPhoto(bookingId, file) {
  const formData = new FormData()
  formData.append('photo', file)
  
  return request({
    url: `/api/admin/v1/installation/bookings/${bookingId}/upload-photo`,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
} 