import request from '@/utils/request'

// 获取工程师工作台数据
export function getWorkspaceData() {
  return request({
    url: '/api/mobile/v1/engineer/workspace',
    method: 'get'
  })
}

// 获取工单列表
export function getWorkOrders(params) {
  return request({
    url: '/api/mobile/v1/engineer/work-orders',
    method: 'get',
    params
  })
}

// 获取工单详情 (使用YTB API)
export function getWorkOrderDetail(id) {
  return request({
    url: `/api/ytb/install/orders/${id}`, // 共用详情接口
    method: 'get'
  })
}

// 接受工单 (使用YTB API)
export function acceptWorkOrder(id) {
  return request({
    url: `/api/ytb/engineer/orders/${id}/accept`,
    method: 'post'
  })
}

// 领机扫码 (新增YTB API)
export function pickWorkOrder(id, data) {
  return request({
    url: `/api/ytb/engineer/orders/${id}/pick`,
    method: 'post',
    data
  })
}

// 开始工作/记录配件费 (新增YTB API)
export function submitAccessories(id, data) {
  return request({
    url: `/api/ytb/engineer/orders/${id}/accessories`,
    method: 'post',
    data
  })
}

// 提交水质检测/完成工单 (使用YTB API)
export function completeWorkOrder(id, data) {
  return request({
    url: `/api/ytb/engineer/orders/${id}/water-test`,
    method: 'post',
    data
  })
}



// 获取日程安排
export function getSchedule(params) {
  return request({
    url: '/api/mobile/v1/engineer/schedule',
    method: 'get',
    params
  })
}

// 更新位置
export function updateLocation(data) {
  return request({
    url: '/api/mobile/v1/engineer/location',
    method: 'post',
    data
  })
}

// 获取便签
export function getNote() {
  return request({
    url: '/api/mobile/v1/engineer/note',
    method: 'get'
  })
}

// 保存便签
export function saveNote(data) {
  return request({
    url: '/api/mobile/v1/engineer/note',
    method: 'post',
    data
  })
}

// 以下为保持兼容性的旧API接口，暂时保留
// 获取库存信息
export function getInventory() {
  return request({
    url: '/api/engineer/inventory',
    method: 'get'
  })
}

// 更新库存
export function updateInventory(data) {
  return request({
    url: '/api/engineer/inventory',
    method: 'post',
    data
  })
}

// 获取消息列表
export function getMessages(params) {
  return request({
    url: '/api/engineer/messages',
    method: 'get',
    params
  })
}

// 标记消息已读
export function markMessageRead(id) {
  return request({
    url: `/api/engineer/messages/${id}/read`,
    method: 'post'
  })
}

// 获取维修指南
export function getRepairGuides(params) {
  return request({
    url: '/api/engineer/repair-guides',
    method: 'get',
    params
  })
}

// 获取维修指南详情
export function getRepairGuideDetail(id) {
  return request({
    url: `/api/engineer/repair-guides/${id}`,
    method: 'get'
  })
}

// 上传工单照片
export function uploadWorkOrderPhoto(data) {
  return request({
    url: '/api/engineer/upload-photo',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 获取工程师个人信息
export function getEngineerProfile() {
  return request({
    url: '/api/engineer/profile',
    method: 'get'
  })
}

// 更新工程师个人信息
export function updateEngineerProfile(data) {
  return request({
    url: '/api/engineer/profile',
    method: 'post',
    data
  })
}

// 获取工作记录
export function getWorkRecords(params) {
  return request({
    url: '/api/engineer/work-records',
    method: 'get',
    params
  })
}

// 添加工作记录
export function addWorkRecord(data) {
  return request({
    url: '/api/engineer/work-records',
    method: 'post',
    data
  })
}

// 获取设备信息
export function getDeviceInfo(deviceId) {
  return request({
    url: `/api/engineer/devices/${deviceId}`,
    method: 'get'
  })
}

// 更新设备状态
export function updateDeviceStatus(deviceId, data) {
  return request({
    url: `/api/engineer/devices/${deviceId}/status`,
    method: 'post',
    data
  })
}

// 获取客户信息
export function getCustomerInfo(customerId) {
  return request({
    url: `/api/engineer/customers/${customerId}`,
    method: 'get'
  })
}

// 获取工程师评价
export function getEngineerRatings(params) {
  return request({
    url: '/api/engineer/ratings',
    method: 'get',
    params
  })
}

// 获取工程师排行榜
export function getEngineerRanking(params) {
  return request({
    url: '/api/engineer/ranking',
    method: 'get',
    params
  })
}

// 获取培训资料
export function getTrainingMaterials(params) {
  return request({
    url: '/api/engineer/training',
    method: 'get',
    params
  })
}

// 获取培训资料详情
export function getTrainingMaterialDetail(id) {
  return request({
    url: `/api/engineer/training/${id}`,
    method: 'get'
  })
}

// 提交培训测试
export function submitTrainingTest(data) {
  return request({
    url: '/api/engineer/training/test',
    method: 'post',
    data
  })
}

// 获取考勤记录
export function getAttendanceRecords(params) {
  return request({
    url: '/api/engineer/attendance',
    method: 'get',
    params
  })
}

// 打卡签到
export function clockIn(data) {
  return request({
    url: '/api/engineer/attendance/clock-in',
    method: 'post',
    data
  })
}

// 打卡签退
export function clockOut(data) {
  return request({
    url: '/api/engineer/attendance/clock-out',
    method: 'post',
    data
  })
}

// 申请请假
export function applyLeave(data) {
  return request({
    url: '/api/engineer/leave/apply',
    method: 'post',
    data
  })
}

// 获取请假记录
export function getLeaveRecords(params) {
  return request({
    url: '/api/engineer/leave/records',
    method: 'get',
    params
  })
}

/**
 * 滤芯预警统计
 */
export function getFilterAlertStats(params) {
  return request({
    url: '/api/mobile/v1/engineer/filter-alert-stats',
    method: 'get',
    params
  })
}

// 获取全部滤芯预警工单列表
export function getAllFilterAlerts(params) {
  return request({
    url: '/api/mobile/v1/engineer/all-filter-alerts',
    method: 'get',
    params
  })
}
