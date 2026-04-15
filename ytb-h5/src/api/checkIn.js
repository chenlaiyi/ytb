import request from '@/utils/request'

/**
 * 取水相关API
 */
export const checkInApi = {
  /**
   * 用户取水
   * @param {Object} data 取水数据
   * @param {number} data.water_point_id 取水点ID
   * @param {string} data.phone 用户手机号
   * @param {string} data.name 用户姓名（可选）
   * @param {string} data.check_in_method 取水方式
   * @param {number} data.latitude 纬度（可选）
   * @param {number} data.longitude 经度（可选）
   * @param {string} data.location_address 位置地址（可选）
   */
  checkIn(data) {
    return request({
      url: '/api/mobile/v1/check-in',
      method: 'post',
      data
    })
  },

  /**
   * 获取用户取水记录
   * @param {Object} params 查询参数
   * @param {string} params.phone 用户手机号
   * @param {number} params.page 页码
   * @param {number} params.page_size 每页数量
   * @param {number} params.water_point_id 取水点ID（可选）
   * @param {string} params.start_date 开始日期（可选）
   * @param {string} params.end_date 结束日期（可选）
   */
  getUserCheckIns(params) {
    return request({
      url: '/api/mobile/v1/check-in/records',
      method: 'get',
      params
    })
  },

  /**
   * 检查用户今日取水状态
   * @param {Object} params 查询参数
   * @param {string} params.phone 用户手机号
   * @param {number} params.water_point_id 取水点ID
   */
  checkTodayStatus(params) {
    return request({
      url: '/api/mobile/v1/check-in/today-status',
      method: 'get',
      params
    })
  },

  /**
   * 获取用户剩余取水天数
   * @param {number} userId 用户ID
   */
  getUserWaterAccess(userId) {
    return request({
      url: '/api/water-access/public/info',
      method: 'get',
      params: { user_id: userId }
    })
  },

  /**
   * 微信扫码取水
   * @param {Object} data 取水数据
   */
  wechatCheckIn(data) {
    return request({
      url: '/api/mobile/v1/wechat-check-in',
      method: 'post',
      data
    })
  }
}

/**
 * 获取取水点二维码信息
 * @param {number} id 取水点ID
 */
export const getWaterPointQRCode = (id) => {
  return request({
    url: `/api/mobile/v1/water-points/${id}/qr`,
    method: 'get'
  })
} 