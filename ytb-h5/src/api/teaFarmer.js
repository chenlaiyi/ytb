import request from '@/utils/request'

const teaFarmerRequest = (config) => request({
  preserveAuthOnAuthError: true,
  skipAuthErrorToast: true,
  ...config
})

function resolveUserId() {
  try {
    const cachedUser = localStorage.getItem('userInfo') || sessionStorage.getItem('simulate_user_info')
    if (!cachedUser) {
      return null
    }

    const userInfo = JSON.parse(cachedUser)
    return userInfo?.userId || userInfo?.id || null
  } catch (error) {
    console.warn('[teaFarmer] 解析用户信息失败，已忽略 user_id 注入:', error)
    return null
  }
}

/**
 * 保存茶农基本信息
 * @param {Object} data 茶农信息
 * @param {Number} userId 用户ID
 * @returns {Promise}
 */
export function saveTeaFarmerInfo(data, userId = null) {
  if (userId === null) {
    userId = resolveUserId()
  }
  
  // 确保userId被添加到请求数据中
  if (userId !== null) {
    data.user_id = userId
  }
  
  return teaFarmerRequest({
    url: '/api/tea-farmer/info',
    method: 'post',
    data,
    // 确保可以处理cookie
    withCredentials: true
  })
}

/**
 * 获取茶农基本信息
 * @param {Number} userId 用户ID
 * @returns {Promise}
 */
export function getTeaFarmerInfo(userId = null) {
  if (userId === null) {
    userId = resolveUserId()
  }
  
  const params = {};
  if (userId !== null) {
    params.user_id = userId;
  }
  return teaFarmerRequest({
    url: '/api/tea-farmer/info',
    method: 'get',
    params
  })
}

/**
 * 添加茶品
 * @param {Object} data 茶品信息
 * @param {Number} userId 用户ID
 * @returns {Promise}
 */
export function addTeaProduct(data, userId = null) {
  if (userId === null) {
    userId = resolveUserId()
  }
  
  // 确保userId被添加到请求数据中
  if (userId !== null) {
    data.user_id = userId;
  }
  return teaFarmerRequest({
    url: '/api/tea-farmer/product',
    method: 'post',
    data
  })
}

export function updateTeaProduct(id, data, userId = null) {
  if (userId === null) {
    userId = resolveUserId()
  }

  if (userId !== null) {
    data.user_id = userId
  }

  return teaFarmerRequest({
    url: `/api/tea-farmer/product/${id}`,
    method: 'put',
    data
  })
}

/**
 * 获取茶品列表
 * @param {Number} userId 用户ID
 * @returns {Promise}
 */
export function getTeaProducts(userId = null) {
  if (userId === null) {
    userId = resolveUserId()
  }
  
  const params = {};
  if (userId !== null) {
    params.user_id = userId;
  }
  return teaFarmerRequest({
    url: '/api/tea-farmer/products',
    method: 'get',
    params
  })
}

/**
 * 调整库存
 * @param {Object} data 调整信息
 * @param {Number} userId 用户ID
 * @returns {Promise}
 */
export function adjustTeaStock(data, userId = null) {
  if (userId === null) {
    userId = resolveUserId()
  }
  
  // 确保userId被添加到请求数据中
  if (userId !== null) {
    data.user_id = userId;
  }
  return teaFarmerRequest({
    url: '/api/tea-farmer/stock/adjust',
    method: 'post',
    data
  })
}

/**
 * 获取库存操作记录
 * @param {Number} userId 用户ID
 * @returns {Promise}
 */
export function getTeaStockRecords(userId = null) {
  if (userId === null) {
    userId = resolveUserId()
  }
  
  const params = {};
  if (userId !== null) {
    params.user_id = userId;
  }
  return teaFarmerRequest({
    url: '/api/tea-farmer/stock/records',
    method: 'get',
    params
  })
}

/**
 * 获取茶农市场公开数据
 * @returns {Promise}
 */
export function fetchTeaMarketOverview() {
  return teaFarmerRequest({
    url: '/api/tea-farmer/market/overview',
    method: 'get',
    skipAuthErrorToast: true
  })
}
