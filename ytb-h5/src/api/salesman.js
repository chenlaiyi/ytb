import request from '@/utils/request'

// 业务员客户详情相关API
export const clientDetailApi = {
  // 获取客户详情信息 - 使用Laravel RESTful API
  getClientDetail(clientId) {
    return request({
      url: `/mobile/v1/salesman/client-detail/${clientId}`,
      method: 'get'
    })
  }
}

// 设备控制相关API
export const deviceControlApi = {
  // 设备控制 - 使用Laravel RESTful API
  controlDevice(deviceId, action, params = {}) {
    return request({
      url: `/mobile/v1/device/control`,
      method: 'post',
      data: {
        device_id: deviceId,
        action: action,
        params: params
      }
    })
  },
  
  // 批量设备控制
  batchControlDevices(deviceIds, action, params = {}) {
    return request({
      url: `/mobile/v1/device/batch-control`,
      method: 'post',
      data: {
        device_ids: deviceIds,
        action: action,
        params: params
      }
    })
  }
}

// 实时数据相关API
export const realtimeDataApi = {
  // 获取设备实时数据 - 使用Laravel RESTful API
  getRealtimeData(deviceId) {
    return request({
      url: `/mobile/v1/device/${deviceId}/realtime-data`,
      method: 'get'
    })
  },
  
  // 批量获取设备实时数据
  getBatchRealtimeData(deviceIds) {
    return request({
      url: `/mobile/v1/device/batch-realtime-data`,
      method: 'post',
      data: {
        device_ids: deviceIds
      }
    })
  },
  
  // 获取设备历史数据
  getHistoryData(deviceId, params = {}) {
    return request({
      url: `/mobile/v1/device/${deviceId}/history-data`,
      method: 'get',
      params: params
    })
  }
}

// 导出所有API
export default {
  clientDetailApi,
  deviceControlApi,
  realtimeDataApi
}