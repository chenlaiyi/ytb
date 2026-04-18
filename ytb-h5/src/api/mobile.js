import request from '@/utils/request'

const YTB_HOST_KEYWORD = 'ytb.ddg.org.cn'

const isYtbHost = () => {
  if (typeof window === 'undefined') return false
  return (window.location?.host || '').includes(YTB_HOST_KEYWORD)
}

const buildWechatRedirectUri = () => {
  if (typeof window === 'undefined') {
    return 'https://ytb.ddg.org.cn/app/#/wechat-callback'
  }

  const protocol = window.location?.protocol || 'https:'
  const host = window.location?.host || 'ytb.ddg.org.cn'
  return `${protocol}//${host}/app/#/wechat-callback`
}

// 微信授权相关API
export const wechatAuthApi = {
  // 生成微信授权URL
  getAuthUrl: (params = {}) => {
    if (isYtbHost()) {
      const state = params.state || params.redirect_url || '/user'
      return request({
        url: '/api/mobile/v1/auth/wechat-url',
        method: 'get',
        params: {
          ...params,
          redirect_uri: buildWechatRedirectUri(),
          state,
          _t: Date.now()
        },
        timeout: 10000,
        skipCache: true,
        skipAuth: true,
        skipAuthError: true,
        skipAuthErrorToast: true
      })
    }

    return request({
      url: '/api/mobile/v1/wechat/login-url',
      method: 'get',
      params,
      timeout: 10000,
      skipCache: true
    })
  },

  // 微信登录回调
  wechatLoginCallback: (data) => {
    if (isYtbHost()) {
      return request({
        url: '/api/mobile/v1/auth/wechat-callback',
        method: 'post',
        data,
        timeout: 15000,
        skipAuth: true,
        skipAuthError: true,
        skipAuthErrorToast: true
      })
    }

    return request({
      url: '/api/mobile/v1/auth/wechat-callback',
      method: 'post',
      data
    })
  },

  // 获取微信用户信息
  getUserInfo: (data) => {
    return request({
      url: '/api/mobile/v1/wechat/user-info',
      method: 'post',
      data
    })
  },

  // 通过openid查找用户信息
  getUserByOpenid: (data) => {
    return request({
      url: '/api/mobile/v1/wechat/user-by-openid',
      method: 'post',
      data
    })
  },

  // 通过手机号查找用户信息
  getUserByPhone: (data) => {
    return request({
      url: '/api/mobile/v1/user/by-phone',
      method: 'post',
      data
    })
  },

  // 清除微信用户信息缓存
  clearUserInfo: (data) => {
    return request({
      url: '/api/mobile/v1/wechat/clear-user-info',
      method: 'post',
      data
    })
  }
}

// 取水相关API
export const checkInApi = {
  // 普通取水
  checkIn: (data) => {
    return request({
      url: '/api/mobile/v1/check-in',
      method: 'post',
      data
    })
  },

  // 微信扫码取水
  wechatCheckIn: (data) => {
    return request({
      url: '/api/mobile/v1/check-in/wechat',
      method: 'post',
      data
    })
  },

  // 获取用户取水记录
  getUserCheckIns: (params) => {
    return request({
      url: '/api/mobile/v1/check-in/records',
      method: 'get',
      params
    })
  },

  // 检查用户今日取水状态
  checkTodayStatus: (params) => {
    return request({
      url: '/api/mobile/v1/check-in/today-status',
      method: 'get',
      params
    })
  },

  // 获取取水点信息
  getWaterPointInfo: (waterPointId) => {
    return request({
      url: `/api/mobile/v1/water-points/${waterPointId}`,
      method: 'get'
    })
  },

  // 获取取水点二维码信息
  getWaterPointQR: (waterPointId) => {
    return request({
      url: `/api/mobile/v1/check-in/water-point/${waterPointId}/qr`,
      method: 'get'
    })
  }
}

// 取水点相关API
export const waterPointApi = {
  // 获取取水点列表
  getList: (params) => {
    return request({
      url: '/api/mobile/v1/water-points',
      method: 'get',
      params
    })
  },

  // 获取取水点详情
  getDetail: (id) => {
    return request({
      url: `/api/mobile/v1/water-points/${id}`,
      method: 'get'
    })
  },

  // 搜索附近取水点
  searchNearby: (params) => {
    return request({
      url: '/api/mobile/v1/water-points/nearby/search',
      method: 'get',
      params
    })
  }
}

// 用户相关API
export const userApi = {
  // 获取用户信息
  getUserInfo: () => {
    return request({
      url: '/api/mobile/v1/user/info',
      method: 'get'
    })
  },

  // 更新用户信息
  updateUserInfo: (data) => {
    return request({
      url: '/api/mobile/v1/user/info',
      method: 'put',
      data
    })
  },

  // 绑定手机号
  bindPhone: (data) => {
    return request({
      url: '/api/mobile/v1/user/bind-phone',
      method: 'post',
      data
    })
  },

  // 搜索推荐人
  searchReferrers: (params) => {
    return request({
      url: '/api/mobile/v1/user/search-referrers',
      method: 'get',
      params
    })
  }
}

// 积分相关API
export const pointsApi = {
  // 获取积分信息
  getPointsInfo: () => {
    return request({
      url: '/api/mobile/v1/points/info',
      method: 'get'
    })
  },

  // 获取积分记录
  getPointsRecords: (params) => {
    return request({
      url: '/api/mobile/v1/points/records',
      method: 'get',
      params
    })
  },

  // 兑换积分
  exchangePoints: (data) => {
    return request({
      url: '/api/mobile/v1/points/exchange',
      method: 'post',
      data
    })
  }
}

export default {
  wechatAuthApi,
  checkInApi,
  waterPointApi,
  userApi,
  pointsApi
}

// 为兼容性单独导出微信登录回调函数
export const wechatLoginCallback = wechatAuthApi.wechatLoginCallback 
