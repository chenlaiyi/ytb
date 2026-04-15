import request from '@/utils/request'

/**
 * 分支机构签到相关API
 */
export const branchCheckInApi = {
  /**
   * 分支机构用户签到
   * @param {Object} data 签到数据
   * @param {number} data.water_point_id 取水点ID
   * @param {string} data.phone 用户手机号
   * @param {string} data.name 用户姓名（可选）
   * @param {string} data.check_in_method 签到方式
   * @param {number} data.latitude 纬度（可选）
   * @param {number} data.longitude 经度（可选）
   * @param {string} data.location_address 位置地址（可选）
   * @param {string} data.branch_code 分支机构代码（可选）
   */
  checkIn(data) {
    return request({
      url: '/admin/api/branch/check_in.php',
      method: 'post',
      data,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  },

  /**
   * 获取用户签到记录
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
      url: '/admin/api/branch/check_in_records.php',
      method: 'get',
      params
    })
  },

  /**
   * 检查用户今日签到状态
   * @param {Object} params 查询参数
   * @param {string} params.phone 用户手机号
   * @param {number} params.water_point_id 取水点ID
   */
  checkTodayStatus(params) {
    return request({
      url: '/admin/api/branch/check_in_status.php',
      method: 'get',
      params
    })
  },

  /**
   * 微信用户扫码签到（分支机构）
   * @param {Object} data 签到数据
   * @param {number} data.water_point_id 取水点ID
   * @param {number} data.manager_id 负责人ID（可选）
   * @param {string} data.openid 微信OpenID
   * @param {string} data.nickname 微信昵称
   * @param {string} data.avatar 微信头像
   * @param {string} data.phone 用户手机号
   * @param {string} data.name 用户姓名（可选）
   * @param {string} data.check_in_method 签到方式
   * @param {number} data.latitude 纬度（可选）
   * @param {number} data.longitude 经度（可选）
   * @param {string} data.location_address 位置地址（可选）
   * @param {string} data.branch_code 分支机构代码（可选）
   */
  wechatCheckIn(data) {
    return request({
      url: '/admin/api/branch/wechat_check_in.php',
      method: 'post',
      data,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  },

  /**
   * 获取用户剩余取水天数（分支机构）
   * @param {Object} params 查询参数
   * @param {number} params.user_id 用户ID（可选）
   * @param {string} params.phone 用户手机号（可选）
   * @param {string} params.openid 微信OpenID（可选）
   */
  getUserWaterDays(params) {
    return request({
      url: '/admin/api/branch/get_user_days.php',
      method: 'get',
      params
    })
  }
}

export default branchCheckInApi 