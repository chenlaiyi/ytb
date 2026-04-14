import request from '@/utils/request'
import { getAdminToken } from '@/utils/admin-token-bridge'
import axios from 'axios'

// 创建专门用于长时间同步操作的请求实例
const syncRequest = axios.create({
  baseURL: '/',
  timeout: 600000, // 10分钟超时，适应大规模企微数据同步
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
})

// 为同步请求添加拦截器
syncRequest.interceptors.request.use(
  config => {
    const token = getAdminToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log('发送长时间同步请求:', config.method?.toUpperCase(), config.url)
    return config
  },
  error => {
    console.error('同步请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

syncRequest.interceptors.response.use(
  response => {
    const { data } = response
    console.log('同步请求响应成功:', {
      url: response.config?.url,
      status: response.status,
      code: data.code,
      message: data.message
    })
    
    // 对于同步请求，直接返回数据
    if (data.code === 200 || data.code === 0 || data.code === '0' || data.code === 20000 || data.success === true) {
      return data
    } else {
      return Promise.reject(new Error(data.message || '同步请求失败'))
    }
  },
  error => {
    console.error('同步请求响应错误:', error)
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('同步操作超时，请稍后重试'))
    }
    return Promise.reject(new Error(error.message || '同步请求失败'))
  }
)

// 获取企微客户列表
export function getWechatWorkCustomers(params) {
  return request({
    url: '/api/admin/v1/wechat-work-customers',
    method: 'get',
    params
  })
}

// 获取客户详情
export function getWechatWorkCustomer(id) {
  return request({
    url: `/api/admin/v1/wechat-work-customers/${id}`,
    method: 'get'
  })
}

// 更新客户备注
export function updateCustomerRemark(id, data) {
  return request({
    url: `/api/admin/v1/wechat-work-customers/${id}/remark`,
    method: 'put',
    data
  })
}

// 获取统计数据
export function getWechatWorkStats() {
  return request({
    url: '/api/admin/v1/wechat-work-customers/stats',
    method: 'get'
  })
}

export function getWechatWorkSyncSummary() {
  return request({
    url: '/api/admin/v1/wechat-work-customers/sync/summary',
    method: 'get'
  })
}

// 获取准确统计数据（手动触发）
export function getAccurateWechatWorkStats() {
  return syncRequest({
    url: '/api/admin/v1/wechat-work-customers/accurate-stats',
    method: 'get'
  })
}

// 同步企微数据 - 使用专门的长时间请求实例
export function syncWechatWorkData(data) {
  return syncRequest({
    url: '/api/admin/v1/wechat-work-customers/sync',
    method: 'post',
    data
  })
}

// 批量同步所有企微数据 - 一次性同步所有客户
export function batchSyncAllWechatWorkData() {
  return syncRequest({
    url: '/api/admin/v1/wechat-work-customers/batch-sync-all',
    method: 'post'
  })
}

// 全量同步企微数据
export function fullSyncWechatWorkData() {
  return syncRequest({
    url: '/api/admin/v1/wechat-work-customers/full-sync',
    method: 'post'
  })
}

// 同步客户详情（补充姓名和头像）
export function syncCustomerDetails() {
  return syncRequest({
    url: '/api/admin/v1/wechat-work-customers/sync-customer-details',
    method: 'post'
  })
}

// 删除单个客户
export function deleteWechatWorkCustomer(id, deleteFromWechat = true) {
  return request({
    url: `/api/admin/v1/wechat-work-customers/${id}`,
    method: 'delete',
    data: {
      delete_from_wechat: deleteFromWechat
    }
  })
}

// 批量删除客户
export function batchDeleteCustomers(customerIds, deleteFromWechat = true) {
  return request({
    url: '/api/admin/v1/wechat-work-customers/batch-delete',
    method: 'post',
    data: {
      customer_ids: customerIds,
      delete_from_wechat: deleteFromWechat
    }
  })
}

// 获取无效客户列表
export function getInvalidCustomers(params = {}) {
  return request({
    url: '/api/admin/v1/wechat-work-customers/invalid',
    method: 'get',
    params
  })
}

// 获取同步日志
export function getSyncLogs(params) {
  return request({
    url: '/api/admin/v1/wechat-work-customers/sync-logs',
    method: 'get',
    params
  })
}

// 清理重复数据
export function cleanDuplicateData(data) {
  return request({
    url: '/api/admin/v1/wechat-work-customers/clean-duplicate',
    method: 'post',
    data
  })
} 
