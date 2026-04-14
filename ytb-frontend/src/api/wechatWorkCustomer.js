import request from '@/utils/request'

export const wechatWorkCustomerApi = {
  /**
   * 获取客户列表
   */
  getList(params) {
    return request({
      url: '/api/admin/v1/wechat-work-customers',
      method: 'get',
      params
    })
  },

  /**
   * 获取统计数据
   */
  getStats() {
    return request({
      url: '/api/admin/v1/wechat-work-customers/stats',
      method: 'get'
    })
  },

  /**
   * 获取同步摘要
   */
  getSyncSummary() {
    return request({
      url: '/api/admin/v1/wechat-work-customers/sync/summary',
      method: 'get'
    })
  },

  /**
   * 获取员工列表
   */
  getEmployees() {
    return request({
      url: '/api/admin/v1/wechat-work-customers/employees',
      method: 'get'
    })
  },

  /**
   * 全量同步客户数据
   */
  fullSync() {
    return request({
      url: '/api/admin/v1/wechat-work-customers/full-sync',
      method: 'post'
    })
  },

  /**
   * 清理临时客户数据
   */
  cleanTempCustomers(data) {
    return request({
      url: '/api/admin/v1/wechat-work-customers/clean-temp-customers',
      method: 'post',
      data
    })
  },

  /**
   * 清理重复 / 孤立数据
   */
  cleanDuplicates(data) {
    return request({
      url: '/api/admin/v1/wechat-work-customers/clean-duplicates',
      method: 'post',
      data
    })
  },

  /**
   * 清理长期未联系的客户（90天以上未联系）
   */
  cleanInactiveCustomers(data) {
    return request({
      url: '/api/admin/v1/wechat-work-customers/clean-inactive-customers',
      method: 'post',
      data
    })
  },

  /**
   * 删除客户
   * @param {number} id 客户ID
   * @param {boolean} deleteFromWechat 是否同时从企业微信删除，默认true
   */
  deleteCustomer(id, deleteFromWechat = true) {
    return request({
      url: `/api/admin/v1/wechat-work-customers/${id}`,
      method: 'delete',
      data: {
        delete_from_wechat: deleteFromWechat
      }
    })
  },

  /**
   * 批量删除客户
   * @param {object} data 包含 ids 数组和 delete_from_wechat 参数
   */
  batchDelete(data) {
    return request({
      url: '/api/admin/v1/wechat-work-customers/batch-delete',
      method: 'post',
      data: {
        ...data,
        delete_from_wechat: data.delete_from_wechat !== false // 默认true
      }
    })
  },

  /**
   * 查询全量同步任务状态
   */
  getFullSyncStatus(taskId) {
    return request({
      url: '/api/admin/v1/wechat-work-customers/full-sync/status',
      method: 'get',
      params: {
        task_id: taskId
      }
    })
  }
} 
