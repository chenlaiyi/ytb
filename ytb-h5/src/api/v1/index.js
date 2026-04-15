/**
 * 统一V1 API调用配置
 * 
 * 说明：这是点点够系统唯一的前端API调用配置文件
 * 创建时间：2025年7月29日
 * 
 * 所有API调用必须使用此文件中定义的方法
 * 禁止直接调用原生PHP API或其他非标准API
 */

import request from '@/utils/request'

// ================================
// 管理后台API (/api/v1/admin/)
// ================================
export const adminApi = {
  // 认证相关
  auth: {
    login: (data) => request.post('/api/v1/admin/auth/login', data),
    logout: () => request.post('/api/v1/admin/auth/logout'),
    refresh: () => request.post('/api/v1/admin/auth/refresh'),
    me: () => request.get('/api/v1/admin/auth/me'),
  },

  // 用户管理
  users: {
    list: (params) => request.get('/api/v1/admin/users', { params }),
    create: (data) => request.post('/api/v1/admin/users', data),
    show: (id) => request.get(`/api/v1/admin/users/${id}`),
    update: (id, data) => request.put(`/api/v1/admin/users/${id}`, data),
    delete: (id) => request.delete(`/api/v1/admin/users/${id}`),
    getVipInfo: (id) => request.get(`/api/v1/admin/users/${id}/vip-info`),
    resetPassword: (id, data) => request.post(`/api/v1/admin/users/${id}/reset-password`, data),
  },

  // 系统管理
  system: {
    menus: {
      list: (params) => request.get('/api/v1/admin/menus', { params }),
      create: (data) => request.post('/api/v1/admin/menus', data),
      show: (id) => request.get(`/api/v1/admin/menus/${id}`),
      update: (id, data) => request.put(`/api/v1/admin/menus/${id}`, data),
      delete: (id) => request.delete(`/api/v1/admin/menus/${id}`),
    },
    roles: {
      list: (params) => request.get('/api/v1/admin/roles', { params }),
      create: (data) => request.post('/api/v1/admin/roles', data),
      show: (id) => request.get(`/api/v1/admin/roles/${id}`),
      update: (id, data) => request.put(`/api/v1/admin/roles/${id}`, data),
      delete: (id) => request.delete(`/api/v1/admin/roles/${id}`),
    },
    permissions: {
      list: (params) => request.get('/api/v1/admin/permissions', { params }),
      create: (data) => request.post('/api/v1/admin/permissions', data),
      show: (id) => request.get(`/api/v1/admin/permissions/${id}`),
      update: (id, data) => request.put(`/api/v1/admin/permissions/${id}`, data),
      delete: (id) => request.delete(`/api/v1/admin/permissions/${id}`),
    },
  },

  // 商城管理
  mall: {
    goods: {
      list: (params) => request.get('/api/v1/admin/goods', { params }),
      create: (data) => request.post('/api/v1/admin/goods', data),
      show: (id) => request.get(`/api/v1/admin/goods/${id}`),
      update: (id, data) => request.put(`/api/v1/admin/goods/${id}`, data),
      delete: (id) => request.delete(`/api/v1/admin/goods/${id}`),
    },
    categories: {
      list: (params) => request.get('/api/v1/admin/categories', { params }),
      create: (data) => request.post('/api/v1/admin/categories', data),
      show: (id) => request.get(`/api/v1/admin/categories/${id}`),
      update: (id, data) => request.put(`/api/v1/admin/categories/${id}`, data),
      delete: (id) => request.delete(`/api/v1/admin/categories/${id}`),
    },
    orders: {
      list: (params) => request.get('/api/v1/admin/orders', { params }),
      show: (id) => request.get(`/api/v1/admin/orders/${id}`),
      update: (id, data) => request.put(`/api/v1/admin/orders/${id}`, data),
    },
  },

  // 财务管理
  financial: {
    vip: {
      list: (params) => request.get('/api/v1/admin/financial/vip', { params }),
      stats: () => request.get('/api/v1/admin/financial/vip/stats'),
      approve: (id, data) => request.post(`/api/v1/admin/financial/vip/${id}/approve`, data),
    },
    dividends: {
      list: (params) => request.get('/api/v1/admin/financial/dividends', { params }),
    },
    transactions: {
      list: (params) => request.get('/api/v1/admin/financial/transactions', { params }),
    },
  },

  // 报表统计
  reports: {
    dashboard: () => request.get('/api/v1/admin/reports/dashboard'),
    users: (params) => request.get('/api/v1/admin/reports/users', { params }),
    sales: (params) => request.get('/api/v1/admin/reports/sales', { params }),
  },
}

// ================================
// H5公众号端API (/api/v1/mobile/)
// ================================
export const mobileApi = {
  // 认证相关
  auth: {
    getWechatUrl: (params) => request.get('/api/v1/mobile/auth/wechat-url', { params }),
    wechatLogin: (data) => request.post('/api/v1/mobile/auth/wechat-login', data),
    smsLogin: (data) => request.post('/api/v1/mobile/auth/sms-login', data),
    sendSms: (data) => request.post('/api/v1/mobile/auth/send-sms', data),
    refresh: () => request.post('/api/v1/mobile/auth/refresh'),
    logout: () => request.post('/api/v1/mobile/auth/logout'),
    me: () => request.get('/api/v1/mobile/auth/me'),
  },

  // 用户中心
  users: {
    profile: () => request.get('/api/v1/mobile/users/profile'),
    updateProfile: (data) => request.put('/api/v1/mobile/users/profile', data),
    assets: () => request.get('/api/v1/mobile/users/assets'),
    orders: (params) => request.get('/api/v1/mobile/users/orders', { params }),
  },

  // VIP功能
  vip: {
    getInfo: () => request.get('/api/mobile/v1/vip/'),
    getRecruitInfo: () => request.get('/api/mobile/v1/vip/recruit-info'),
    recruit: (data) => request.post('/api/mobile/v1/vip/recruit', data),
    team: () => request.get('/api/mobile/v1/vip/team'),
    getDividendInfo: () => request.get('/api/mobile/v1/vip/dividend-info'),
    getDividendsPublic: () => request.get('/api/mobile/v1/vip/dividends-public'),
    stats: () => request.get('/api/mobile/v1/vip/stats'),
  },

  // 商城功能
  mall: {
    goods: {
      list: (params) => request.get('/api/v1/mobile/mall/goods', { params }),
      show: (id) => request.get(`/api/v1/mobile/mall/goods/${id}`),
    },
    categories: {
      list: (params) => request.get('/api/v1/mobile/mall/categories', { params }),
    },
    orders: {
      list: (params) => request.get('/api/v1/mobile/mall/orders', { params }),
      create: (data) => request.post('/api/v1/mobile/mall/orders', data),
    },
  },

  // 支付功能
  payment: {
    create: (data) => request.post('/api/v1/mobile/payment/create', data),
    callback: (data) => request.post('/api/v1/mobile/payment/callback', data),
    status: (orderNo) => request.get(`/api/v1/mobile/payment/status/${orderNo}`),
  },

  // 通用功能
  common: {
    config: () => request.get('/api/v1/mobile/common/config'),
    banners: () => request.get('/api/v1/mobile/common/banners'),
    notices: () => request.get('/api/v1/mobile/common/notices'),
  },
}

// ================================
// 原生APP端API (/api/v1/app/)
// ================================
export const appApi = {
  // 认证相关
  auth: {
    login: (data) => request.post('/api/v1/app/auth/login', data),
    register: (data) => request.post('/api/v1/app/auth/register', data),
    refresh: () => request.post('/api/v1/app/auth/refresh'),
    logout: () => request.post('/api/v1/app/auth/logout'),
    me: () => request.get('/api/v1/app/auth/me'),
  },

  // 用户管理
  users: {
    profile: () => request.get('/api/v1/app/users/profile'),
    updateProfile: (data) => request.put('/api/v1/app/users/profile', data),
  },

  // 设备管理
  devices: {
    list: () => request.get('/api/v1/app/devices/'),
    bind: (data) => request.post('/api/v1/app/devices/bind', data),
    unbind: (data) => request.post('/api/v1/app/devices/unbind', data),
    sync: (data) => request.post('/api/v1/app/devices/sync', data),
    status: (id) => request.get(`/api/v1/app/devices/${id}/status`),
  },

  // 数据同步
  sync: {
    userData: (data) => request.post('/api/v1/app/sync/user-data', data),
    deviceData: (data) => request.post('/api/v1/app/sync/device-data', data),
    status: () => request.get('/api/v1/app/sync/status'),
  },
}

// ================================
// 通用API (/api/v1/common/)
// ================================
export const commonApi = {
  // 文件上传
  upload: {
    file: (file) => {
      const formData = new FormData()
      formData.append('file', file)
      return request.post('/api/v1/common/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    image: (file) => {
      const formData = new FormData()
      formData.append('file', file)
      return request.post('/api/v1/common/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
  },

  // 短信服务
  sms: {
    send: (data) => request.post('/api/v1/common/sms/send', data),
    verify: (data) => request.post('/api/v1/common/sms/verify', data),
  },

  // 配置管理
  config: {
    app: () => request.get('/api/v1/common/config/app'),
    system: () => request.get('/api/v1/common/config/system'),
    version: () => request.get('/api/v1/common/config/version'),
  },
}

// ================================
// 导出默认API对象
// ================================
export default {
  admin: adminApi,
  mobile: mobileApi,
  app: appApi,
  common: commonApi,
}

// ================================
// 兼容性导出（逐步废弃）
// ================================
// 为了保持向后兼容，暂时保留这些导出
// 后续版本将完全移除
export const vipApi = mobileApi.vip
export const userApi = mobileApi.users
export const authApi = mobileApi.auth
