import request from '@/utils/axios'

// 获取安装预约列表
export function getInstallationBookings(params) {
  return request({
    url: '/api/admin/installation/booking',
    method: 'get',
    params
  })
}

// 获取安装预约列表（别名，用于兼容）
export function getBookingList(params) {
  return request({
    url: '/api/admin/installation/booking',
    method: 'get',
    params
  })
}

// 获取安装预约详情
export function getInstallationBookingDetail(id) {
  return request({
    url: `/api/admin/installation/booking/${id}`,
    method: 'get'
  })
}

// 创建安装预约
export function createInstallationBooking(data) {
  return request({
    url: '/api/admin/installation/booking',
    method: 'post',
    data
  })
}

// 更新安装预约
export function updateInstallationBooking(id, data) {
  return request({
    url: `/api/admin/installation/booking/${id}`,
    method: 'put',
    data
  })
}

// 删除安装预约
export function deleteInstallationBooking(id) {
  return request({
    url: `/api/admin/installation/booking/${id}`,
    method: 'delete'
  })
}

// 获取工程师列表
export function getEngineers(params) {
  return request({
    url: '/api/admin/installation/available-engineers',
    method: 'get',
    params
  })
}

// 获取可用工程师列表
export function getAvailableEngineers(params) {
  return request({
    url: '/api/admin/installation/available-engineers',
    method: 'get',
    params
  })
}

// 分配工程师
export function assignEngineer(bookingId, data) {
  return request({
    url: `/api/admin/installation/booking/${bookingId}/assign-engineer`,
    method: 'post',
    data
  })
}

// 更新预约状态
export function updateBookingStatus(id, data) {
  return updateInstallationBooking(id, data)
}

// 获取安装统计
export function getInstallationStatistics(params) {
  return request({
    url: '/api/admin/installation/statistics',
    method: 'get',
    params
  })
}

// 导出预约数据
export function exportBookingData(params) {
  return request({
    url: '/api/admin/installation/booking/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 默认导出所有API函数
export default {
  getInstallationBookings,
  getBookingList,
  getInstallationBookingDetail,
  createInstallationBooking,
  updateInstallationBooking,
  deleteInstallationBooking,
  getEngineers,
  getAvailableEngineers,
  assignEngineer,
  updateBookingStatus,
  getInstallationStatistics,
  exportBookingData
} 