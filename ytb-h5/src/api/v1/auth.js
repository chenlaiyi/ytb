import request from '@/utils/request'

/**
 * V1版本认证API - Laravel RESTful风格
 * 逐步替代原生PHP API
 */

/**
 * 获取微信登录URL
 * @param {Object} params 参数
 * @param {string} params.redirect_uri 回调地址(可选)
 * @param {string} params.state 状态参数(可选)
 * @returns {Promise<Object>} 微信登录URL
 */
export function getWechatLoginUrlV1(params = {}) {
  console.log('🔧 [V1] 调用微信登录URL API:', params);
  
  // 添加时间戳和随机数，避免缓存问题
  const requestParams = {
    ...params,
    _t: Date.now(),
    _r: Math.floor(Math.random() * 1000)
  };
  
  return request({
    url: '/api/mobile/v1/wechat/login-url', // V1迁移：使用Laravel API路径
    method: 'get',
    params: requestParams,
    timeout: 20000,
    silence: true,
    _showError: true,
    _retry: true
  }).then(response => {
    console.log('✅ [V1] 微信登录URL获取成功:', response);
    return response;
  }).catch(error => {
    console.error('❌ [V1] 微信登录URL获取失败:', error);
    throw error;
  });
}

/**
 * 微信登录回调处理
 * @param {Object} data 微信回调数据
 * @param {string} data.code 微信授权码
 * @param {string} data.state 状态参数
 * @returns {Promise<Object>} 登录结果
 */
export function wechatLoginCallbackV1(data) {
  console.log('🔧 [V1] 调用微信登录回调API:', { 
    code: data.code ? data.code.substring(0, 10) + '...' : 'null',
    state: data.state 
  });
  
  if (!data.code) {
    throw new Error('微信授权失败，缺少授权码');
  }
  
  // 清除可能存在的token，确保不会带着旧token去请求
  localStorage.removeItem('token');
  
  const requestData = {
    code: data.code,
    state: data.state,
    platform: 'mobile',
    _t: Date.now(),
    _r: Math.floor(Math.random() * 1000)
  };
  
  // 生成请求ID用于追踪
  const requestId = Math.random().toString(36).substring(2, 15);
  
  return request({
    url: '/api/mobile/v1/auth/wechat-callback', // V1迁移：使用Laravel API路径
    method: 'post',
    data: requestData,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Request-ID': requestId
    }
  }).then(response => {
    console.log('✅ [V1] 微信登录成功:', response);
    
    // 处理登录成功后的token存储
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      if (response.data.user) {
        localStorage.setItem('userInfo', JSON.stringify(response.data.user));
      }
    }
    
    return response;
  }).catch(error => {
    console.error('❌ [V1] 微信登录失败:', error);
    throw error;
  });
}

/**
 * 获取微信登录URL - 带向后兼容性
 * 自动尝试V1 API，失败后降级到原生API
 * @param {Object} params 参数
 * @returns {Promise<Object>} 微信登录URL
 */
export function getWechatLoginUrlCompat(params = {}) {
  console.log('🔄 [兼容] 尝试获取微信登录URL，统一使用V1 API');
  return getWechatLoginUrlV1(params);
}

/**
 * 微信登录回调处理 - 带向后兼容性
 * 自动尝试V1 API，失败后降级到原生API
 * @param {Object} data 微信回调数据
 * @returns {Promise<Object>} 登录结果
 */
export function wechatLoginCallbackCompat(data) {
  console.log('🔄 [兼容] 尝试微信登录回调，统一使用V1 API');
  return wechatLoginCallbackV1(data);
}

/**
 * 发送短信验证码 - V1版本
 * @param {Object} data 
 * @param {string} data.phone 手机号
 * @param {string} data.type 验证码类型
 * @returns {Promise<Object>}
 */
export function sendSmsV1(data) {
  console.log('🔧 [V1] 发送短信验证码:', { phone: data.phone, type: data.type });
  
  return request({
    url: '/api/mobile/v1/auth/send-sms',
    method: 'post',
    data,
    timeout: 15000
  }).then(response => {
    console.log('✅ [V1] 短信发送成功');
    return response;
  }).catch(error => {
    console.error('❌ [V1] 短信发送失败:', error);
    throw error;
  });
}

/**
 * 短信验证码登录 - V1版本
 * @param {Object} data
 * @param {string} data.phone 手机号
 * @param {string} data.code 验证码
 * @returns {Promise<Object>}
 */
export function smsLoginV1(data) {
  console.log('🔧 [V1] 短信验证码登录:', { phone: data.phone });
  
  return request({
    url: '/api/mobile/v1/auth/login-sms',
    method: 'post',
    data,
    timeout: 15000
  }).then(response => {
    console.log('✅ [V1] 短信登录成功');
    
    // 处理登录成功后的token存储
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      if (response.data.user) {
        localStorage.setItem('userInfo', JSON.stringify(response.data.user));
      }
    }
    
    return response;
  }).catch(error => {
    console.error('❌ [V1] 短信登录失败:', error);
    throw error;
  });
}

/**
 * 获取用户信息 - V1版本
 * @returns {Promise<Object>}
 */
export function getUserInfoV1() {
  console.log('🔧 [V1] 获取用户信息');
  
  return request({
    url: '/api/mobile/v1/auth/user-info',
    method: 'get',
    timeout: 10000
  }).then(response => {
    console.log('✅ [V1] 获取用户信息成功');
    return response;
  }).catch(error => {
    console.error('❌ [V1] 获取用户信息失败:', error);
    throw error;
  });
}

/**
 * 刷新Token - V1版本
 * @returns {Promise<Object>}
 */
export function refreshTokenV1() {
  console.log('🔧 [V1] 刷新Token');
  
  return request({
    url: '/api/mobile/v1/auth/refresh-token',
    method: 'post',
    timeout: 10000
  }).then(response => {
    console.log('✅ [V1] Token刷新成功');
    
    // 更新本地token
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response;
  }).catch(error => {
    console.error('❌ [V1] Token刷新失败:', error);
    throw error;
  });
}

/**
 * 用户登出 - V1版本
 * @returns {Promise<Object>}
 */
export function logoutV1() {
  console.log('🔧 [V1] 用户登出');
  
  return request({
    url: '/api/mobile/v1/auth/logout',
    method: 'post',
    timeout: 10000
  }).then(response => {
    console.log('✅ [V1] 登出成功');
    
    // 清除本地存储
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    
    return response;
  }).catch(error => {
    console.error('❌ [V1] 登出失败:', error);
    
    // 即使登出失败，也清除本地存储
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    
    throw error;
  });
}

/**
 * 获取用户资产信息 - V1版本
 * @returns {Promise<Object>}
 */
export function getUserAssetsV1() {
  console.log('💰 [V1] 获取用户资产信息');
  
  return request({
    url: '/api/mobile/v1/auth/user-assets',
    method: 'get',
    timeout: 10000,
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    params: {
      _t: Date.now(),
      _r: Math.floor(Math.random() * 1000)
    }
  }).then(response => {
    console.log('✅ [V1] 用户资产信息获取成功');
    return response;
  });
}

/**
 * 获取用户订单统计 - V1版本
 * @returns {Promise<Object>}
 */
export function getOrderStatsV1() {
  console.log('📊 [V1] 获取用户订单统计');
  
  return request({
    url: '/api/mobile/v1/auth/order-stats',
    method: 'get',
    timeout: 10000,
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    params: {
      _t: Date.now(),
      _r: Math.floor(Math.random() * 1000)
    }
  }).then(response => {
    console.log('✅ [V1] 用户订单统计获取成功');
    return response;
  });
}

/**
 * 获取用户资产信息 - 兼容版本（V1优先，降级到原生API）
 * @returns {Promise<Object>}
 */
export function getUserAssetsCompat() {
  console.log('🔄 [迁移] 获取用户资产 - 优先使用V1 API');
  
  return getUserAssetsV1().catch(v1Error => {
    console.warn('⚠️ [迁移] V1资产API失败，降级到原生API:', v1Error.message);
    
    // V1失败，降级到原生API
    return request({
      url: '/user/assets.php',
      baseURL: '/admin/api',
      method: 'get',
      timeout: 10000,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'X-Requested-With': 'XMLHttpRequest'
      },
      params: {
        _t: Date.now(),
        _r: Math.floor(Math.random() * 1000)
      }
    });
  });
}

/**
 * 获取用户订单统计 - 兼容版本（V1优先，降级到原生API）
 * @returns {Promise<Object>}
 */
export function getOrderStatsCompat() {
  console.log('🔄 [迁移] 获取订单统计 - 优先使用V1 API');
  
  return getOrderStatsV1().catch(v1Error => {
    console.warn('⚠️ [迁移] V1订单统计API失败，降级到原生API:', v1Error.message);
    
    // V1失败，降级到原生API
    return request({
      url: '/user/order_stats.php',
      baseURL: '/admin/api',
      method: 'get',
      timeout: 10000,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'X-Requested-With': 'XMLHttpRequest'
      },
      params: {
        _t: Date.now(),
        _r: Math.floor(Math.random() * 1000)
      }
    });
  });
}
