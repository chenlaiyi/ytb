import request from '@/utils/request'

/**
 * 获取分支机构工程师工作台数据
 * @returns {Promise<Object>} 工作台数据
 */
export function getBranchEngineerWorkspace() {
  return request({
    url: '/engineer/workspace.php',
    method: 'get'
  })
}

/**
 * 获取分支机构工程师信息
 * @returns {Promise<Object>} 工程师信息
 */
export function getBranchEngineerInfo() {
  return request({
    url: '/engineer/info.php',
    method: 'get'
  })
}

/**
 * 更新分支机构工程师信息
 * @param {Object} data 工程师信息
 * @returns {Promise<Object>} 更新结果
 */
export function updateBranchEngineerInfo(data) {
  return request({
    url: '/engineer/update_info.php',
    method: 'post',
    data
  })
}

/**
 * 获取分支机构工单统计
 * @returns {Promise<Object>} 工单统计
 */
export function getBranchWorkOrderStats() {
  return request({
    url: '/engineer/work_order_stats.php',
    method: 'get'
  })
}

/**
 * 获取分支机构工单列表
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 工单列表
 */
export function getBranchWorkOrders(params) {
  return request({
    url: '/engineer/work_orders.php',
    method: 'get',
    params
  })
}

/**
 * 获取分支机构工单详情
 * @param {string} orderId 工单ID
 * @returns {Promise<Object>} 工单详情
 */
export function getBranchWorkOrderDetail(orderId) {
  return request({
    url: `/engineer/work_order_detail.php?order_id=${orderId}`,
    method: 'get'
  })
}

/**
 * 接受分支机构工单
 * @param {string} orderId 工单ID
 * @returns {Promise<Object>} 接受结果
 */
export function acceptBranchWorkOrder(orderId) {
  return request({
    url: `/engineer/accept_work_order.php?order_id=${orderId}`,
    method: 'post'
  })
}

/**
 * 完成分支机构工单
 * @param {string} orderId 工单ID
 * @param {Object} data 完成信息
 * @returns {Promise<Object>} 完成结果
 */
export function completeBranchWorkOrder(orderId, data) {
  return request({
    url: `/engineer/complete_work_order.php?order_id=${orderId}`,
    method: 'post',
    data
  })
}

/**
 * 获取分支机构维修记录
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 维修记录列表
 */
export function getBranchMaintenanceHistory(params) {
  return request({
    url: '/engineer/maintenance_history.php',
    method: 'get',
    params
  })
}

/**
 * 获取分支机构维修记录详情
 * @param {string} recordId 记录ID
 * @returns {Promise<Object>} 维修记录详情
 */
export function getBranchMaintenanceDetail(recordId) {
  return request({
    url: `/engineer/maintenance_detail.php?record_id=${recordId}`,
    method: 'get'
  })
}

/**
 * 创建分支机构维修记录
 * @param {Object} data 维修记录信息
 * @returns {Promise<Object>} 创建结果
 */
export function createBranchMaintenanceRecord(data) {
  return request({
    url: '/engineer/create_maintenance_record.php',
    method: 'post',
    data
  })
}

/**
 * 获取分支机构库存列表
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 库存列表
 */
export function getBranchInventory(params) {
  return request({
    url: '/engineer/inventory.php',
    method: 'get',
    params
  })
}

/**
 * 申请分支机构库存补货
 * @param {Object} data 补货申请信息
 * @returns {Promise<Object>} 申请结果
 */
export function applyBranchInventoryReplenishment(data) {
  return request({
    url: '/engineer/apply_replenishment.php',
    method: 'post',
    data
  })
}

/**
 * 获取分支机构维修指南
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 维修指南列表
 */
export function getBranchRepairGuides(params) {
  return request({
    url: '/engineer/repair_guides.php',
    method: 'get',
    params
  })
}

/**
 * 获取分支机构维修指南详情
 * @param {string} guideId 指南ID
 * @returns {Promise<Object>} 指南详情
 */
export function getBranchRepairGuideDetail(guideId) {
  return request({
    url: `/engineer/repair_guide_detail.php?guide_id=${guideId}`,
    method: 'get'
  })
}

/**
 * 保存分支机构工程师便签
 * @param {Object} data 便签内容
 * @returns {Promise<Object>} 保存结果
 */
export function saveBranchEngineerNote(data) {
  return request({
    url: '/engineer/save_note.php',
    method: 'post',
    data
  })
}

/**
 * 获取分支机构工程师便签
 * @returns {Promise<Object>} 便签内容
 */
export function getBranchEngineerNote() {
  return request({
    url: '/engineer/get_note.php',
    method: 'get'
  })
}

/**
 * 更新分支机构工程师在线状态
 * @param {boolean} isOnline 是否在线
 * @returns {Promise<Object>} 更新结果
 */
export function updateBranchEngineerOnlineStatus(isOnline) {
  return request({
    url: '/engineer/update_online_status.php',
    method: 'post',
    data: { is_online: isOnline }
  })
}

/**
 * 获取分支机构工单分配规则
 * @returns {Promise<Object>} 分配规则
 */
export function getBranchWorkOrderAssignRules() {
  return request({
    url: '/engineer/assign_rules.php',
    method: 'get'
  })
}

/**
 * 上传分支机构维修照片
 * @param {FormData} formData 包含照片的表单数据
 * @returns {Promise<Object>} 上传结果
 */
export function uploadBranchMaintenancePhoto(formData) {
  return request({
    url: '/engineer/upload_photo.php',
    method: 'post',
    data: formData
  })
}

/**
 * 获取分支机构工程师考核数据
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 考核数据
 */
export function getBranchEngineerPerformance(params) {
  return request({
    url: '/engineer/performance.php',
    method: 'get',
    params
  })
}

/**
 * 获取分支机构工程师排班信息
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 排班信息
 */
export function getBranchEngineerSchedule(params) {
  return request({
    url: '/engineer/schedule.php',
    method: 'get',
    params
  })
}

/**
 * 申请分支机构工程师调班
 * @param {Object} data 调班申请信息
 * @returns {Promise<Object>} 申请结果
 */
export function applyBranchScheduleChange(data) {
  return request({
    url: '/engineer/apply_schedule_change.php',
    method: 'post',
    data
  })
}

/**
 * 获取分支机构工程师培训资料
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 培训资料列表
 */
export function getBranchTrainingMaterials(params) {
  return request({
    url: '/engineer/training_materials.php',
    method: 'get',
    params
  })
}

/**
 * 提交分支机构工程师反馈
 * @param {Object} data 反馈信息
 * @returns {Promise<Object>} 提交结果
 */
export function submitBranchEngineerFeedback(data) {
  return request({
    url: '/engineer/submit_feedback.php',
    method: 'post',
    data
  })
} 