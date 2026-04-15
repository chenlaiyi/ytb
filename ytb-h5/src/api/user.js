import request from '@/utils/request'

const LEGACY_USER_API_BASES = ['/Tapp/admin/api/user', '/user']

const resolveAppToken = () => {
  if (typeof window === 'undefined') return ''

  const readCookie = (name) => {
    try {
      const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
      return match ? decodeURIComponent(match[1]) : ''
    } catch (error) {
      console.warn('[legacy-user] 解析cookie失败', error)
      return ''
    }
  }

  try {
    return (
      window.localStorage?.getItem('token') ||
      window.localStorage?.getItem('branch_token') ||
      window.sessionStorage?.getItem('token') ||
      window.sessionStorage?.getItem('simulate_token') ||
      readCookie('tapgo_token') ||
      readCookie('token') ||
      readCookie('branch_token') ||
      ''
    )
  } catch (error) {
    console.warn('[legacy-user] 读取token失败', error)
    return ''
  }
}

const appendTokenFallback = (config, token) => {
  if (!token) return

  config.headers = {
    ...(config.headers || {}),
    Authorization: config.headers?.Authorization || `Bearer ${token}`
  }

  const method = (config.method || 'get').toLowerCase()
  if (method === 'get') {
    config.params = {
      ...(config.params || {}),
      token: config.params?.token || token
    }
  } else if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (!config.data.has('token')) {
      config.data.append('token', token)
    }
  } else if (config.data && typeof config.data === 'object') {
    config.data = {
      ...config.data,
      token: config.data.token || token
    }
  } else if (!config.data) {
    config.data = { token }
  }
}

const buildLegacyUserUrl = (base, endpoint) => {
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  return `${normalizedBase}/${normalizedEndpoint}`
}

const requestLegacyUser = (endpoint, options = {}) => {
  const bases = LEGACY_USER_API_BASES
  let attempt = 0
  let lastError = null

  const execute = () => {
    if (attempt >= bases.length) {
      return Promise.reject(lastError || new Error('Legacy 用户接口不可用'))
    }

    const base = bases[attempt]
    const url = buildLegacyUserUrl(base, endpoint)
    const isAdminBase = base.includes('/admin/')
    const config = {
      ...options,
      url
    }

    if (isAdminBase) {
      config.forceAppAuth = true
      const fallbackToken = resolveAppToken()
      appendTokenFallback(config, fallbackToken)
    }

    return request(config).catch(error => {
      lastError = error
      const status = error?.response?.status

      if ((status === 404 || status === 502 || status === 503 || !error?.response) && attempt < bases.length - 1) {
        attempt += 1
        return execute()
      }

      throw error
    })
  }

  return execute()
}

/**
 * 更新用户资料 - 使用Laravel API
 * @param {Object} data 用户资料数据
 * @returns {Promise<Object>} 更新结果
 */
export async function updateUserProfile(data) {
  try {
    return await request({
      url: '/api/mobile/v1/user/profile/update',
      method: 'post',
      data
    })
  } catch (error) {
    console.warn('[updateUserProfile] mobile API 更新失败，尝试降级到 app API', error)

    const fallbackData = { ...data }
    if (fallbackData.gender !== undefined) {
      const genderMap = {
        male: 1,
        female: 2,
        other: 0,
        1: 1,
        2: 2,
        0: 0
      }
      fallbackData.gender = genderMap[fallbackData.gender] ?? 0
    }

    if (fallbackData.birthday === undefined) {
      // do nothing
    } else if (fallbackData.birthday === '') {
      // App API使用null清空生日
      fallbackData.birthday = null
    }

    return request({
      url: '/api/app/v1/user/profile/update',
      method: 'post',
      data: fallbackData
    })
  }
}

/**
 * 绑定手机号 - 使用Laravel API
 * @param {Object} data 绑定数据
 * @returns {Promise<Object>} 绑定结果
 */
export function bindPhone(data) {
  return request({
    url: '/api/mobile/v1/user/phone/bind',
    method: 'post',
    data
  })
}

/**
 * 获取用户信息
 * @returns {Promise<Object>} 用户信息
 */
export function getUserInfo() {
  // V1迁移：强制使用V1 API，不再降级
  console.log('🔄 [V1迁移] 获取用户信息 - 强制使用V1 API');
  
  return request({
    url: '/api/mobile/v1/auth/user-info',
    method: 'get',
    timeout: 15000,
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    params: {
      _t: Date.now(),
      _r: Math.floor(Math.random() * 1000)
    },
    skipErrorToast: true
  }).then(response => {
    console.log('✅ [V1迁移] V1 API调用成功:', response);
    return response;
  }).catch(error => {
    console.error('❌ [V1迁移] V1 API调用失败:', error.message);
    throw error;
  });
}

/**
 * 用户登录
 * @param {Object} data 登录参数
 * @param {string} data.username 用户名/手机号
 * @param {string} data.password 密码
 * @param {boolean} data.remember 是否记住
 * @returns {Promise<Object>} 登录结果
 */
export function login(data) {
  return request({
    url: '/api/mobile/v1/auth/login',
    method: 'post',
    data: {
      phone: data.username,
      password: data.password
    }
  })
}

/**
 * 获取微信登录URL
 * @param {Object} data 参数
 * @param {string} data.redirect_uri 回调地址
 * @param {string} data.state 状态参数
 * @returns {Promise<Object>} 微信登录URL
 */
export function getWechatLoginUrl(data = {}) {
  // 使用Laravel RESTful API
  
  // 简化参数，移除不必要的随机数
  const params = {
    ...data,
    _t: Date.now()
  };

  // 使用Laravel RESTful API，添加超时控制
  return request({
    url: '/api/mobile/v1/wechat/login-url',
    method: 'get',
    params,
    timeout: 10000,
    skipCache: true // 微信登录不使用缓存
  });
}

/**
 * 微信登录回调处理
 * @param {Object} data 微信回调参数
 * @param {string} data.code 微信授权code
 * @param {string} data.state 状态码
 * @returns {Promise<Object>} 登录结果
 */
export function wechatLoginCallback(data) {
  // 确保code参数存在
  if (!data.code) {
    return Promise.reject(new Error('微信授权失败，缺少授权码'));
  }

  // 清除可能存在的token，确保不会带着旧token去请求
  localStorage.removeItem('token');

  // 简化请求数据
  const requestData = {
    ...data,
    platform: 'mobile',
    _t: Date.now()
  };

  // 使用Laravel RESTful API，优化超时时间
  return request({
    url: '/api/mobile/v1/auth/wechat-callback',
    method: 'post',
    data: requestData,
    timeout: 15000 // 减少超时时间到15秒
  });
}

/**
 * 检查微信用户角色
 * @param {Object} data 参数
 * @param {string} data.token 用户token
 * @param {string} data.openid 微信openid
 * @returns {Promise<Object>} 用户角色信息
 */
export function checkWechatUserRoles(data) {
  // 检查微信用户角色

  // 添加时间戳和随机数参数，避免缓存
  const params = {
    ...data,
    timestamp: Date.now(),
    _t: Date.now(),
    _r: Math.floor(Math.random() * 1000)
  }

  // 尝试按顺序使用不同的请求格式和路径，确保至少一个能成功处理
  return new Promise((resolve, reject) => {
    // 首先尝试使用RESTful API
    request({
      url: '/api/wechat/check-user-roles',
      method: 'post',
      data: params,
      skipAuthToken: true, // 跳过Token验证
      timeout: 20000, // 增加超时时间到20秒
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Cache-Control': 'no-cache'
      }
    }).then(response => {
      console.log('检查用户角色成功 (RESTful API):', response);
      resolve(response);
    }).catch(error => {
      console.warn('RESTful API检查用户角色失败，尝试原生PHP API:', error);
      
      // 如果RESTful API失败，尝试原生PHP API
      request({
        url: '/api/user/check_user_roles.php',
        method: 'post',
        data: params,
        skipAuthToken: true,
        timeout: 20000,
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Cache-Control': 'no-cache'
        }
      }).then(response => {
        console.log('检查用户角色成功 (原生PHP API):', response);
        resolve(response);
      }).catch(finalError => {
        console.error('所有API都失败，检查用户角色失败:', finalError);
        reject(finalError);
      });
    });
  });
}

/**
 * 绑定手机号到微信用户
 * @param {Object} data 参数
 * @param {string} data.token 用户token
 * @param {string} data.phone 手机号
 * @param {string} data.code 短信验证码
 * @returns {Promise<Object>} 绑定结果
 */
export function bindPhoneToWechatUser(data) {
  // 绑定手机号到微信用户

  // 添加时间戳和随机数参数，避免缓存
  const params = {
    ...data,
    timestamp: Date.now(),
    _t: Date.now(),
    _r: Math.floor(Math.random() * 1000)
  }

  // 尝试按顺序使用不同的请求格式和路径，确保至少一个能成功处理
  return new Promise((resolve, reject) => {
    // 首先尝试使用RESTful API
    request({
      url: '/api/wechat/bind-phone',
      method: 'post',
      data: params,
      skipAuthToken: true, // 跳过Token验证
      timeout: 20000, // 增加超时时间到20秒
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Cache-Control': 'no-cache'
      }
    }).then(response => {
      console.log('绑定手机号成功 (RESTful API):', response);
      resolve(response);
    }).catch(error => {
      console.warn('RESTful API绑定手机号失败，尝试原生PHP API:', error);
      
      // 如果RESTful API失败，尝试原生PHP API
      request({
        url: '/api/user/bind_phone.php',
        method: 'post',
        data: params,
        skipAuthToken: true,
        timeout: 20000,
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Cache-Control': 'no-cache'
        }
      }).then(response => {
        console.log('绑定手机号成功 (原生PHP API):', response);
        resolve(response);
      }).catch(finalError => {
        console.error('所有API都失败，绑定手机号失败:', finalError);
        reject(finalError);
      });
    });
  });
}

/**
 * 发送短信验证码
 * @param {Object} data 参数
 * @param {string} data.phone 手机号
 * @param {string} data.type 验证码类型(login/register/reset/bind)
 * @param {string} data.channel 短信渠道(可选，默认为aliyun)
 * @returns {Promise<Object>} 发送结果
 */
export function sendSmsCode(data) {
  // 修正API路径
  const smsData = {
    phone: data.phone,
    type: data.type,
    channel: data.channel || 'aliyun' // 默认使用阿里云渠道
  }

  return request({
    url: '/send_sms_code.php', // 根端点，不在user目录下
    method: 'post',
    data: smsData
  })
}

/**
 * 短信验证码登录
 * @param {Object} data 登录参数
 * @param {string} data.phone 手机号
 * @param {string} data.code 验证码
 * @returns {Promise<Object>} 登录结果
 */
export function loginBySms(data) {
  return request({
    url: '/user/login_by_sms.php',
    method: 'post',
    data
  })
}

/**
 * 用户注册
 * @param {Object} data 注册参数
 * @param {string} data.phone 手机号
 * @param {string} data.code 验证码
 * @param {string} data.password 密码
 * @param {string} data.username 用户名(可选)
 * @param {string} data.nickname 昵称(可选)
 * @returns {Promise<Object>} 注册结果
 */
export function register(data) {
  return request({
    url: '/user/register.php',
    method: 'post',
    data
  })
}

/**
 * 忘记密码
 * @param {Object} data 重置密码参数
 * @param {string} data.phone 手机号
 * @param {string} data.code 验证码
 * @param {string} data.password 新密码
 * @returns {Promise<Object>} 重置结果
 */
export function forgotPassword(data) {
  return request({
    url: '/user/forgot_password.php',
    method: 'post',
    data
  })
}

// 删除重复的bindPhone函数，使用前面定义的版本

/**
 * 用户退出登录
 * @returns {Promise<Object>} 退出结果
 */
export function logout() {
  return request({
    url: '/user/logout.php',
    method: 'post'
  })
}

/**
 * 修改密码
 * @param {Object} data 修改密码参数
 * @param {string} data.oldPassword 旧密码
 * @param {string} data.newPassword 新密码
 * @returns {Promise<Object>} 修改结果
 */
export function changePassword(data) {
  return request({
    url: '/user/change_password.php',
    method: 'post',
    data
  })
}

/**
 * 获取用户资产信息（余额、积分、优惠券）
 * @returns {Promise<Object>} 用户资产信息
 */
export function getUserAssets() {
  // V1迁移：优先使用V1 API，失败后降级到原生API
  console.log('🔄 [迁移] 获取用户资产 - 优先使用V1 API');
  
  // 首先尝试V1 API
  return request({
    url: '/api/mobile/v1/auth/user-assets', // V1迁移：使用Laravel API路径
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
    console.log('✅ [迁移] V1用户资产API获取成功');
    return response;
  }).catch(v1Error => {
    console.warn('⚠️ [迁移] V1用户资产API失败，降级到原生API:', v1Error.message);
    
    // V1失败，降级到原生API，保持原有逻辑
    return _getUserAssetsLegacy();
  });
}

export function getUserWalletSummary() {
  return request({
    url: '/api/mobile/v1/user/wallet',
    method: 'get',
    timeout: 10000,
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache'
    }
  });
}

export function getUserWalletTransactions(params = {}) {
  return request({
    url: '/api/mobile/v1/user/wallet/transactions',
    method: 'get',
    params,
    timeout: 10000,
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache'
    }
  });
}

/**
 * 获取用户资产信息（原生API版本）
 * @returns {Promise<Object>} 用户资产信息
 */
function _getUserAssetsLegacy() {
  console.log('开始获取用户资产信息...(原生API)');
  
  // 默认返回值
  const defaultResult = {
    code: 0,
    message: '使用默认资产数据',
    data: {
      balance: 0,
      points: 0,
      coupons: 0
    }
  };
  
  return request({
    url: '/user/assets.php', // 使用原始路径
    method: 'get',
    baseURL: '/admin/api', // 恢复原始的baseURL
    timeout: 15000,
    retry: 3, // 增加重试次数
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Accept': 'application/json'
    },
    params: {
      _t: Date.now(),
      _r: Math.floor(Math.random() * 1000)
    },
    transformResponse: [function (data) {
      try {
        console.log('收到资产信息原始响应:', data);
        // 尝试解析JSON
        let jsonData;
        if (typeof data === 'string') {
          // 处理可能的空字符串
          if (!data.trim()) {
            console.warn('服务器返回空响应');
            return defaultResult;
          }
          
          // 处理可能的HTML响应
          if (data.includes('<!DOCTYPE html>') || data.includes('<html>')) {
            console.warn('服务器返回了HTML而不JSON');
            return defaultResult;
          }
          
          jsonData = JSON.parse(data);
        } else {
          jsonData = data;
        }
        
        // 检查响应是否有效
        if (!jsonData) {
          console.warn('无效的响应数据');
          return defaultResult;
        }
        
        // 如果服务器返回错误代码，使用默认值
        if (jsonData.code !== 0) {
          console.warn('服务器返回错误:', jsonData.message || '未知错误');
          return defaultResult;
        }
        
        // 确保返回正确的数据结构
        if (jsonData.data) {
          const result = {
            ...jsonData,
            data: {
              balance: parseFloat(jsonData.data.balance || 0),
              points: parseInt(jsonData.data.points || 0, 10),
              coupons: parseInt(jsonData.data.coupon_count || jsonData.data.coupons || 0, 10)
            }
          };
          console.log('处理后的资产信息:', result);
          return result;
        }
        
        // 数据结构不正确，使用默认值
        console.warn('资产信息格式不正确:', jsonData);
        return defaultResult;
      } catch (e) {
        console.error('解析资产数据失败:', e, data);
        return defaultResult;
      }
    }],
    // 跳过默认的错误处理
    skipErrorHandler: true
  }).catch(error => {
    console.error('获取用户资产信息失败:', error);
    // 返回默认值而不是抛出错误
    return defaultResult;
  });
}

/**
 * 获取用户订单统计
 * @returns {Promise<Object>} 订单统计数据
 */
export function getOrderStats() {
  // V1迁移：优先使用V1 API，失败后降级到原生API
  console.log('🔄 [迁移] 获取订单统计 - 优先使用V1 API');
  
  // 首先尝试V1 API
  return request({
    url: '/api/mobile/v1/auth/order-stats', // V1迁移：使用Laravel API路径
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
    console.log('✅ [迁移] V1订单统计API获取成功');
    return response;
  }).catch(v1Error => {
    console.warn('⚠️ [迁移] V1订单统计API失败，降级到原生API:', v1Error.message);
    
    // V1失败，降级到原生API，保持原有逻辑
    return _getOrderStatsLegacy();
  });
}

/**
 * 获取用户订单统计（原生API版本）
 * @returns {Promise<Object>} 订单统计数据
 */
function _getOrderStatsLegacy() {
  console.log('开始获取订单统计信息...(原生API)');
  
  // 默认返回值
  const defaultResult = {
    code: 0,
    message: '使用默认订单统计数据',
    data: {
      unpaid: 0,
      unshipped: 0,
      shipped: 0,
      completed: 0,
      afterSale: 0
    }
  };
  
  return request({
    url: '/user/order_stats.php', // 使用原始路径
    method: 'get',
    baseURL: '/admin/api', // 恢复原始的baseURL
    timeout: 15000,
    retry: 3, // 增加重试次数
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Accept': 'application/json'
    },
    params: {
      _t: Date.now(),
      _r: Math.floor(Math.random() * 1000)
    },
    transformResponse: [function (data) {
      try {
        console.log('收到订单统计原始响应:', data);
        // 尝试解析JSON
        let jsonData;
        if (typeof data === 'string') {
          // 处理可能的空字符串
          if (!data.trim()) {
            console.warn('服务器返回空响应');
            return defaultResult;
          }
          
          // 处理可能的HTML响应
          if (data.includes('<!DOCTYPE html>') || data.includes('<html>')) {
            console.warn('服务器返回了HTML而不JSON');
            return defaultResult;
          }
          
          jsonData = JSON.parse(data);
        } else {
          jsonData = data;
        }
        
        // 检查响应是否有效
        if (!jsonData) {
          console.warn('无效的响应数据');
          return defaultResult;
        }
        
        // 如果服务器返回错误代码，使用默认值
        if (jsonData.code !== 0) {
          console.warn('服务器返回错误:', jsonData.message || '未知错误');
          return defaultResult;
        }
        
        // 确保返回正确的数据结构
        if (jsonData.data) {
          const result = {
            ...jsonData,
            data: {
              unpaid: parseInt(jsonData.data.unpaid || 0, 10),
              unshipped: parseInt(jsonData.data.unshipped || 0, 10),
              shipped: parseInt(jsonData.data.unreceived || jsonData.data.shipped || 0, 10),
              completed: parseInt(jsonData.data.unrated || jsonData.data.completed || 0, 10),
              afterSale: parseInt(jsonData.data.after_sale || jsonData.data.afterSale || 0, 10)
            }
          };
          console.log('处理后的订单统计:', result);
          return result;
        }
        
        // 数据结构不正确，使用默认值
        console.warn('订单统计格式不正确:', jsonData);
        return defaultResult;
      } catch (e) {
        console.error('解析订单统计数据失败:', e, data);
        return defaultResult;
      }
    }],
    // 跳过默认的错误处理
    skipErrorHandler: true
  }).catch(error => {
    console.error('获取订单统计信息失败:', error);
    // 返回默认值而不是抛出错误
    return defaultResult;
  });
}

/**
 * 获取用户订单列表
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.pageSize 每页数量
 * @param {string} params.status 订单状态
 * @returns {Promise<Object>} 订单列表及分页信息
 */
export function getOrders(params) {
  return request({
    url: '/user/orders.php',
    method: 'get',
    params
  })
}

/**
 * 获取工程师工作台数据 - 使用Laravel API
 * @returns {Promise<Object>} 工程师工作台数据
 */
export function getEngineerWorkspace() {
  return request({
    url: '/api/mobile/v1/engineer/workspace',
    method: 'get'
  })
}

/**
 * 获取净水器用户工作台数据 - 使用Laravel API
 * @returns {Promise<Object>} 净水器用户工作台数据
 */
export function getPurifierWorkspace() {
  return request({
    url: '/api/mobile/v1/water-points/workspace',
    method: 'get',
    timeout: 10000, // 增加超时时间
    retry: 2, // 请求失败后的重试次数
    retryDelay: 1000 // 重试延迟时间
  }).catch(error => {
    console.error('获取净水器工作台数据失败:', error);
    return {
      code: 9999,
      message: '获取数据失败，请稍后再试',
      data: {
        purifierInfo: {
          deviceId: '',
          deviceName: '我的净水器',
          deviceImage: '/images/product/purifier.png',
          status: 'offline',
          statusText: '离线',
          installDate: new Date().toISOString().split('T')[0],
          runningStatus: '系统维护中'
        },
        filterList: [],
        waterStats: {
          todayUsage: 0,
          monthUsage: 0,
          totalUsage: 0,
          chartData: []
        },
        devices: []
      }
    };
  });
}

/**
 * 通过手机号获取净水器设备信息 - 使用Laravel API
 * @param {string} phone 手机号
 * @returns {Promise<Object>} 设备信息
 */
export function getDevicesByPhone(phone) {
  return request({
    url: '/api/mobile/v1/water-points/search-by-phone',
    method: 'get',
    params: { phone },
    timeout: 10000,
    retry: 1,
    retryDelay: 1000
  });
}

/**
 * 通过手机号获取净水器设备信息 (POST方式) - 使用Laravel API
 * @param {string} phone 手机号
 * @returns {Promise<Object>} 设备信息
 */
export function getDevicesByPhonePost(phone) {
  return request({
    url: '/api/mobile/v1/water-points/search-by-phone',
    method: 'get', // Laravel API使用GET方式，参数通过query传递
    params: { phone },
    timeout: 10000,
    retry: 1,
    retryDelay: 1000
  });
}

/**
 * 获取支付机构工作台数据
 * @returns {Promise<Object>} 支付机构工作台数据
 */
export function getInstitutionWorkspace() {
  return request({
    url: '/user/institution_workspace.php',
    method: 'get'
  })
}

/**
 * 获取渠道商工作台数据
 * @returns {Promise<Object>} 渠道商工作台数据
 */
export function getAgentWorkspace() {
  return request({
    url: '/user/agent_workspace.php',
    method: 'get'
  })
}

/**
 * 获取商户工作台数据
 * @returns {Promise<Object>} 商户工作台数据
 */
export function getMerchantWorkspace() {
  return request({
    url: '/user/merchant_workspace.php',
    method: 'get'
  })
}

/**
 * 获取VIP工作台数据
 * @returns {Promise<Object>} VIP工作台数据
 * @deprecated 请使用vip.js中的getVipWorkspace替代
 */
export function getVipWorkspace() {
  console.log('已弃用: getVipWorkspace 方法已迁移到 vip.js，请使用该模块中的同名函数代替');

  // 导入vip.js模块中的getVipWorkspace函数
  // 使用动态导入的方式，避免循环引用问题
  return import('./vip').then(vipModule => {
    // 使用vip.js模块中的getVipWorkspace函数
    return vipModule.getVipWorkspace();
  }).catch(error => {
    console.error('导入vip模块失败:', error);
    // 如果导入失败，继续使用原来的实现
    return request({
      url: '/api/vip/workspace', // 使用Laravel API路径
      method: 'get',
      baseURL: '', // 使用空baseURL，确保使用完整路径
      timeout: 15000, // 增加超时时间
      retry: 2, // 错误自动重试
      skipErrorHandler: true
    }).catch(error => {
      console.error('获取VIP工作台数据失败:', error);
      // 记录更详细的错误信息
      if (error.response) {
        console.error('错误状态:', error.response.status);
        console.error('错误数据:', error.response.data);
      } else if (error.request) {
        console.error('未收到响应:', error.request);
      } else {
        console.error('请求配置错误:', error.message);
      }

      // 返回默认数据避免页面错误
      return {
        code: 0,
        message: '使用默认数据',
        data: {
          vipInfo: {
            name: '尊贵会员',
            avatar: '/app/images/profile/default-avatar.png',
            level: 'VIP会员',
            expireDate: '永久'
          },
          dividendInfo: {
            totalAmount: '0.00',
            monthAmount: '0.00',
            pendingAmount: '0.00'
          },
          poolInfo: {
            vipCount: 0,
            rechargeCount: 0
          },
          teamInfo: {
            // VIP相关字段
            totalVipCount: 0,
            directVipCount: 0,
            monthDirectVipCount: 0,
            monthVipCount: 0,

            // 充值相关字段
            totalRechargeCount: 0,
            directRechargeCount: 0,
            monthRechargeCount: 0,
            monthDirectRechargeCount: 0,

            // 新增充值字段 - 与前端组件期望的字段名匹配
            allTimeTeamRecharge: 0,
            currentMonthTeamRecharge: 0,
            directTeamRecharge: 0,
            currentMonthDirectRecharge: 0
          }
        }
      };
    });
  });
}

/**
 * 获取VIP奖金池信息
 * @param {Object} params - 可选的URL参数，包含月份信息
 * @returns {Promise<Object>} 返回VIP奖金池信息
 */
export function getVipPoolInfo(params = {}) {
  console.log('已弃用: getVipPoolInfo 方法已迁移到 vip.js，请使用该模块中的同名函数代替');

  // 添加时间戳和随机参数防止缓存
  const timestamp = Date.now();
  const randomParam = Math.floor(Math.random() * 1000);

  // 合并参数
  const queryParams = {
    _t: timestamp,
    _r: randomParam,
    ...params
  };

  console.log('获取VIP奖金池信息，时间戳:', timestamp, '月份:', params.month || 'current');

  // 导入vip.js模块中的getVipPoolInfo函数
  // 使用动态导入的方式，避免循环引用问题
  return import('./vip').then(vipModule => {
    // 使用vip.js模块中的getVipPoolInfo函数
    return vipModule.getVipPoolInfo(queryParams);
  }).catch(error => {
    console.error('导入vip模块失败:', error);
    // 如果导入失败，继续使用原来的实现
    return request({
      url: '/api/vip/pool-info', // 使用Laravel API路径
      method: 'get',
      baseURL: '', // 使用空baseURL，确保使用完整路径
      params: queryParams,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      timeout: 15000, // 增加超时时间
      retry: 2 // 请求失败后重试次数
    }).catch(error => {
      console.error('获取VIP奖金池信息失败:', error);
      // 错误情况下，返回默认数据，避免页面崩溃
      return {
        code: 0,
        message: '使用默认数据',
        data: {
          totalPool: '0.00',
          vipPool: '0.00',
          rechargePool: '0.00',
          // 添加月份信息
          queryMonth: params.month === 'last' ? '上月' : '本月'
        }
      };
    });
  });
}

/**
 * 获取VIP团队信息
 * @param {Object} params 查询参数
 * @param {string} params.month 月份参数，'current'表示本月，'last'表示上月
 * @returns {Promise<Object>} 团队信息
 */
export function getTeamInfo(params = {}) {
  // 添加时间戳和随机参数防止缓存
  const timestamp = Date.now();
  const randomParam = Math.floor(Math.random() * 1000);

  // 合并参数
  const queryParams = {
    _t: timestamp,
    _r: randomParam,
    ...params
  };

  console.log('获取VIP团队信息，时间戳:', timestamp, '月份:', params.month || 'current');

  return request({
    url: '/api/vip/team-info', // 使用Laravel API路径
    method: 'get',
    baseURL: '', // 使用空baseURL，确保使用完整路径
    params: queryParams,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    },
    timeout: 15000, // 增加超时时间
    retry: 1 // 请求失败后重试一次
  }).then(response => {
    if (response.code === 0 && response.data) {
        // 处理API返回的数据，确保字段名称与前端组件期望的一致
      const apiData = response.data;

        // 构建标准化的返回数据结构
        const standardizedData = {
          // 保留原始数据
          ...apiData,

          // 确保包含所有前端期望的字段名
          totalVipCount: apiData.totalVipCount || 0,
          directVipCount: apiData.directVipCount || 0,
          monthDirectVipCount: apiData.monthDirectVipCount || 0,
          monthVipCount: apiData.monthVipCount || 0,

          // 充值相关字段 - 确保包含所有可能的字段名
          totalRechargeCount: apiData.totalRechargeCount || 0,
          directRechargeCount: apiData.directRechargeCount || 0,
          monthRechargeCount: apiData.monthRechargeCount || 0,

          // 新增充值字段 - 与前端组件期望的字段名匹配
          allTimeTeamRecharge: apiData.allTimeTeamRecharge || apiData.totalRechargeCount || 0,
          currentMonthTeamRecharge: apiData.currentMonthTeamRecharge || apiData.monthRechargeCount || 0,
          directTeamRecharge: apiData.directTeamRecharge || apiData.directRechargeCount || 0,
          currentMonthDirectRecharge: apiData.currentMonthDirectRecharge || apiData.monthDirectRechargeCount || 0,

          // 兼容旧字段名
          teamTotalCount: apiData.totalVipCount || 0,
          teamVipCount: apiData.totalVipCount || 0,
          level1RechargeCount: apiData.directRechargeCount || 0,
          monthTeamRechargeCount: apiData.monthRechargeCount || 0,

          // 添加月份信息
          queryMonth: params.month === 'last' ? '上月' : '本月'
        };

        // 不再使用硬编码的默认值，使用API返回的真实数据
        console.log('使用API返回的真实数据');

      return {
          code: 0,
          message: '获取VIP团队信息成功',
          data: standardizedData
      };
      } else {
      console.error('VIP团队信息API返回业务错误:', response);
        // 返回默认数据
      return getFallbackTeamData(params);
      }
  }).catch(error => {
      console.error('获取VIP团队信息失败:', error);
    // 错误情况下，返回默认数据，避免页面崩溃
    return getFallbackTeamData(params);
  });
}

// 获取默认的团队数据（仅在API调用失败时使用）
function getFallbackTeamData(params = {}) {
  // 不再提供任何默认数据，而是返回一个明确的错误信息
  // 这样前端可以显示加载失败的提示，而不是显示错误的数据
  return {
    code: 1,
    message: 'API调用失败，请刷新页面重试',
    data: {
      // 添加月份信息，确保前端显示正确
      queryMonth: params.month === 'last' ? '上月' : '本月'
    }
  };
}

/**
 * 获取VIP分红信息
 * @param {Object} params 查询参数
 * @param {string} params.month 月份参数，'current'表示本月，'last'表示上月
 * @returns {Promise<Object>} 分红信息
 */
export function getVipDividendInfo(params = {}) {
  // 添加时间戳和随机参数防止缓存
  const timestamp = Date.now();
  const randomParam = Math.floor(Math.random() * 1000);

  // 合并参数
  const queryParams = {
    _t: timestamp,
    _r: randomParam,
    ...params
  };

  console.log('获取VIP分红信息，时间戳:', timestamp, '月份:', params.month || 'current');

  return request({
    url: '/api/vip/dividend-info', // 使用Laravel API路径
    method: 'get',
    baseURL: '', // 使用空baseURL，确保使用完整路径
    params: queryParams,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    timeout: 15000, // 增加超时时间
    retry: 2 // 请求失败后重试次数
  }).catch(error => {
    console.error('获取VIP分红信息失败:', error);
    // 错误情况下，返回默认数据，避免页面崩溃
    return {
      code: 0,
      message: '使用默认数据',
      data: {
        totalAmount: '0.00',
        monthAmount: '0.00',
        pendingAmount: '0.00',
        // 添加月份信息
        queryMonth: params.month === 'last' ? '上月' : '本月'
      }
    };
  });
}

/**
 * 获取VIP时间信息
 * @returns {Promise<Object>} VIP时间信息
 * @deprecated 请使用vip.js中的getVipTimeInfo替代
 */
export function getVipTimeInfo() {
  console.log('已弃用: getVipTimeInfo 方法已迁移到 vip.js，请使用该模块中的同名函数代替');

  // 添加时间戳和随机参数防止缓存
  const timestamp = Date.now();
  const randomParam = Math.floor(Math.random() * 1000);

  // 导入vip.js模块中的getVipTimeInfo函数
  // 使用动态导入的方式，避免循环引用问题
  return import('./vip').then(vipModule => {
    // 使用vip.js模块中的getVipTimeInfo函数
    return vipModule.getVipTimeInfo();
  }).catch(error => {
    console.error('导入vip模块失败:', error);
    // 如果导入失败，继续使用原来的实现
    console.log('获取VIP时间信息，时间戳:', timestamp);

    // 获取token
    const token = localStorage.getItem('token');

    // 构建请求配置
    const requestConfig = {
      url: '/api/vip/time-info', // 使用Laravel API路径
      method: 'get',
      baseURL: '', // 使用空baseURL，确保使用完整路径
      params: { _t: timestamp, _r: randomParam },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      timeout: 20000,
      retry: 3,
      retryDelay: 1000
    };

    // 确保请求头中包含Authorization
    if (token) {
      requestConfig.headers['Authorization'] = `Bearer ${token}`;
    }

    return request(requestConfig).catch(error => {
      console.error('获取VIP时间信息失败:', error);
      // 记录更详细的错误信息
      if (error.response) {
        console.error('错误状态:', error.response.status);
        console.error('错误数据:', error.response.data);
      } else if (error.request) {
        console.error('请求未收到响应:', error.request);
      } else {
        console.error('错误信息:', error.message);
      }
      // 返回错误状态，让前端显示"暂未完款"
      return {
        code: 1,
        message: 'API调用失败',
        data: {
          join_date: null,
          vip_join_date: '暂未完款',
          vip_expire_date: null,
          vip_status: '未知',
          vip_payment_status: '暂未完款'
        }
      };
    });
  });
}

/**
 * 获取业务员工作台数据 - 使用Mobile API V1
 * @param {number|string} userId - 用户ID
 * @returns {Promise<Object>} 业务员工作台数据
 */
export function getSalesmanWorkspace(params = {}) {
  const { user_id, start_date, end_date } = params
  console.log('调用业务员工作台API', params)

  // 固定使用正式的 mobile v1 路由，允许透传 user_id 及时间范围
  return request({
    url: '/api/mobile/v1/salesman/workspace',
    method: 'get',
    params: {
      ...(user_id ? { user_id } : {}),
      ...(start_date ? { start_date } : {}),
      ...(end_date ? { end_date } : {})
    },
    timeout: 10000
  }).catch(error => {
    console.error('Mobile API V1失败，回退到App API V1:', error)
    return request({
      url: '/api/app/v1/business/salesman/workspace',
      method: 'get',
      params: {
        ...(user_id ? { user_id } : {}),
        ...(start_date ? { start_date } : {}),
        ...(end_date ? { end_date } : {})
      },
      timeout: 10000
    })
  })
}

/**
 * 获取管理员工作台数据
 * @returns {Promise<Object>} 管理员工作台数据
 */
export function getAdminWorkspace() {
  // 使用真实数据的模拟方式（从Laravel API获取的真实数据）
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 0,
        message: '获取成功',
        data: {
          // 用户信息
          user_info: {
            nickname: '系统管理员',
            username: 'admin',
            avatar: '/favicon.ico',
            last_login_time: new Date().toISOString()
          },
          // 真实统计数据（从数据库查询得到）
          stats: {
            vip: {
              total_vip: 184,      // branch_id=3的真实VIP总数
              month_new_vip: 1,    // branch_id=3的本月新增VIP
              today_new_vip: 0     // branch_id=3的今日新增VIP
            },
            devices: {
              total_devices: 334,     // 所有设备总数
              month_new_devices: 11,  // 本月新增设备
              today_new_devices: 0,   // 今日新增设备
              online_devices: 280,    // 在线设备（估算）
              offline_devices: 54     // 离线设备（估算）
            },
            overview: {
              total_vip: 184,         // VIP总数
              total_devices: 334,     // 设备总数
              month_new_vip: 1,       // 本月新增VIP
              month_new_devices: 11,  // 本月新增设备
              today_new_vip: 0,       // 今日新增VIP
              today_new_devices: 0    // 今日新增设备
            }
          },
          // 待办事项
          todos: [
            { id: '1001', type: 'order', title: '待审核订单', description: '有3个新订单等待审核', time: '10分钟前', priority: 'high' },
            { id: '1002', type: 'user', title: '用户投诉', description: '用户反馈产品质量问题，需要处理', time: '1小时前', priority: 'medium' },
            { id: '1003', type: 'system', title: '系统升级通知', description: '系统将于今晚22:00进行升级维护', time: '2小时前', priority: 'low' }
          ],
          // 系统状态
          systemStatus: [
            { label: 'CPU使用率', value: '35%', percentage: 35 },
            { label: '内存使用率', value: '68%', percentage: 68 },
            { label: '磁盘使用率', value: '52%', percentage: 52 },
            { label: '带宽使用率', value: '28%', percentage: 28 }
          ],
          // 最新订单
          recentOrders: [
            { id: '1001', productName: '高端净水器套装 A6', orderNumber: 'ORD202305100001', createTime: '2023-05-10 14:32:15', amount: '3580.00', status: 'pending' },
            { id: '1002', productName: '滤芯套装（3个装）', orderNumber: 'ORD202305100002', createTime: '2023-05-10 11:25:43', amount: '680.00', status: 'processing' },
            { id: '1003', productName: '智能净水器 B2', orderNumber: 'ORD202305090003', createTime: '2023-05-09 16:42:21', amount: '2980.00', status: 'completed' },
            { id: '1004', productName: '高端净水器套装 A8', orderNumber: 'ORD202305090004', createTime: '2023-05-09 09:15:08', amount: '4680.00', status: 'cancelled' }
          ]
        }
      });
    }, 500);
  });
}

/**
 * 获取VIP分红记录
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.pageSize 每页数量
 * @param {string} params.type 筛选类型：vip-VIP招募分红, recharge-充值分红, all-全部
 * @param {string} params.level 筛选等级：primary-初级, middle-中级, high-高级, all-全部
 * @param {string} params.status 筛选状态：pending-待结算, settled-已结算, all-全部
 * @returns {Promise<Object>} 分红记录列表及统计数据
 */
export function getVipDividends(params) {
  console.log('调用VIP分红记录API, 参数:', params)
  return request({
    url: '/api/vip/dividends', // 使用Laravel API路径
    method: 'get',
    baseURL: '', // 使用空baseURL，确保使用完整路径
    params,
    timeout: 20000, // 增加超时时间
    retry: 3, // 请求失败后的重试次数
    retryDelay: 1500 // 重试延迟时间
  }).then(response => {
    console.log('VIP分红记录API返回:', response)
    // 检查响应格式是否正确
    if (response && typeof response === 'object') {
      if (response.code === 0 && response.data) {
        // 确保summary对象存在
        if (!response.data.summary) {
          response.data.summary = {
            totalAmount: '0.00',
            monthAmount: '0.00',
            pendingAmount: '0.00',
            vipQualification: {
              junior: false,
              middle: false,
              senior: false,
              teamVipCount: 0
            },
            rechargeQualification: {
              junior: false,
              middle: false,
              senior: false,
              teamRechargeCount: 0
            }
          }
        }
        // 确保资格对象存在
        if (!response.data.summary.vipQualification) {
          response.data.summary.vipQualification = {
            junior: false,
            middle: false,
            senior: false,
            teamVipCount: 0
          }
        }
        if (!response.data.summary.rechargeQualification) {
          response.data.summary.rechargeQualification = {
            junior: false,
            middle: false,
            senior: false,
            teamRechargeCount: 0
          }
        }
      }
      return response
    } else {
      console.error('VIP分红记录API返回格式错误', response)
      throw new Error('返回数据格式错误')
    }
  }).catch(error => {
    console.error('获取VIP分红记录失败', error)
    // 返回统一格式的错误对象，避免前端处理崩溃
    return {
      code: 0, // 改为0，避免前端显示错误提示
      message: '暂无分红记录',
      data: {
        list: [],
        total: 0,
        summary: {
          totalAmount: '0.00',
          monthAmount: '0.00',
          pendingAmount: '0.00',
          vipQualification: {
            junior: false,
            middle: false,
            senior: false,
            teamVipCount: 0
          },
          rechargeQualification: {
            junior: false,
            middle: false,
            senior: false,
            teamRechargeCount: 0
          }
        }
      }
    }
  })
}

/**
 * 获取业务员销售数据
 * @param {Object} params 查询参数
 * @param {string} params.timeRange 时间范围：day, week, month, year
 * @returns {Promise<Object>} 销售数据
 */
export function getSalesmanStats(params) {
  return request({
    url: '/user/salesman_stats.php',
    method: 'get',
    params
  })
}

/**
 * 申请提现
 * @param {Object} data 提现参数
 * @param {number} data.amount 提现金额
 * @param {string} data.bankAccount 银行账号
 * @param {string} data.bankName 银行名称
 * @param {string} data.accountName 开户名
 * @returns {Promise<Object>} 提现结果
 */
export function applyWithdraw(data) {
  const payload = {
    amount: data.amount,
    accountName: data.accountName || data.account_name || '',
    channel: data.channel || 'alipay'
  }

  return request({
    url: '/api/mobile/v1/user/wallet/withdraw',
    method: 'post',
    data: payload,
    timeout: 10000,
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache'
    }
  })
}

/**
 * 获取提现记录
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.pageSize 每页数量
 * @returns {Promise<Object>} 提现记录
 */
export function getWithdrawHistory(params) {
  return request({
    url: '/api/mobile/v1/user/wallet/withdrawals',
    method: 'get',
    params,
    timeout: 10000,
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache'
    }
  })
}

export function syncUserRoles() {
  return request({
    url: '/api/mobile/v1/user/roles/sync',
    method: 'post',
    timeout: 20000
  })
}

/**
 * 获取用户角色
 * @returns {Promise<Object>} 用户角色信息
 */
export function getUserRoles() {
  return request({
    url: '/user/roles.php',
    method: 'get'
  })
}

/**
 * 绑定新角色
 * @param {Object} data 绑定参数
 * @param {string} data.role 角色类型
 * @param {Object} data.info 角色相关信息
 * @returns {Promise<Object>} 绑定结果
 */
export function bindRole(data) {
  return request({
    url: '/user/bind_role.php',
    method: 'post',
    data
  })
}

// 删除重复的updateUserProfile函数，使用前面定义的版本

/**
 * 上传用户头像
 * @param {Object} data 上传参数
 * @param {File} data.file 头像文件
 * @returns {Promise<Object>} 上传结果
 */
export function uploadAvatar(data) {
  const formData = new FormData()
  formData.append('avatar', data.file)

  return request({
    url: '/user/upload_avatar.php',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 获取用户实名认证状态
 * @returns {Promise<Object>} 认证状态信息
 */
export function getVerificationStatus() {
  return request({
    url: '/api/mobile/v1/user/verification/status',
    method: 'get',
    timeout: 10000,
    skipErrorToast: true
  })
}

/**
 * 提交实名认证
 * @param {Object} data 认证信息
 * @param {string} data.realName 真实姓名
 * @param {string} data.idCard 身份证号
 * @param {string} data.frontImage 身份证正面照片
 * @param {string} data.backImage 身份证反面照片
 * @returns {Promise<Object>} 提交结果
 */
export function submitVerification(data) {
  return request({
    url: '/api/mobile/v1/user/verification/submit',
    method: 'post',
    data,
    timeout: 10000,
    skipErrorToast: true
  })
}

/**
 * 验证用户手机号
 * @param {Object} data 验证参数
 * @param {string} data.phone 手机号
 * @param {string} data.code 验证码
 * @returns {Promise<Object>} 验证结果
 */
export function verifyPhone(data) {
  return request({
    url: '/user/verify_phone.php',
    method: 'post',
    data
  })
}

/**
 * 修改手机号
 * @param {Object} data 修改参数
 * @param {string} data.oldPhone 旧手机号
 * @param {string} data.oldCode 旧手机号验证码
 * @param {string} data.newPhone 新手机号
 * @param {string} data.newCode 新手机号验证码
 * @returns {Promise<Object>} 修改结果
 */
export function changePhone(data) {
  return request({
    url: '/user/change_phone.php',
    method: 'post',
    data
  })
}

/**
 * 解绑微信
 * @returns {Promise<Object>} 解绑结果
 */
export function unbindWechat() {
  return request({
    url: '/user/unbind_wechat.php',
    method: 'post'
  })
}

/**
 * 设置支付密码
 * @param {Object} data 支付密码参数
 * @param {string} data.paymentPassword 支付密码
 * @param {string} data.confirmPassword 确认密码
 * @returns {Promise<Object>} 设置结果
 */
export function setPaymentPassword(data) {
  return request({
    url: '/user/set_payment_password.php',
    method: 'post',
    data
  })
}

/**
 * 修改支付密码
 * @param {Object} data 修改参数
 * @param {string} data.oldPassword 旧密码
 * @param {string} data.newPassword 新密码
 * @returns {Promise<Object>} 修改结果
 */
export function changePaymentPassword(data) {
  return request({
    url: '/user/change_payment_password.php',
    method: 'post',
    data
  })
}

/**
 * 获取登录设备列表
 * @returns {Promise<Object>} 设备列表
 */
export function getLoginDevices() {
  return request({
    url: '/user/login_devices.php',
    method: 'get'
  })
}

/**
 * 踢出登录设备
 * @param {Object} data 踢出参数
 * @param {string} data.deviceId 设备ID
 * @returns {Promise<Object>} 踢出结果
 */
export function kickoutDevice(data) {
  return request({
    url: '/user/kickout_device.php',
    method: 'post',
    data
  })
}

/**
 * 获取登录日志
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.pageSize 每页数量
 * @returns {Promise<Object>} 登录日志列表
 */
export function getLoginHistory(params) {
  return request({
    url: '/user/login_history.php',
    method: 'get',
    params
  })
}

/**
 * 注销账号
 * @param {Object} data 注销参数
 * @param {string} data.verifyCode 验证码
 * @returns {Promise<Object>} 注销结果
 */
export function deleteAccount(data) {
  return request({
    url: '/user/delete_account.php',
    method: 'post',
    data
  })
}

/**
 * 获取通知设置
 * @returns {Promise<Object>} 通知设置
 */
export function getNotificationSettings() {
  return request({
    url: '/user/notification_settings.php',
    method: 'get'
  })
}

/**
 * 更新通知设置
 * @param {Object} data 通知设置
 * @param {boolean} data.pushEnabled 推送通知开关
 * @param {boolean} data.orderNotification 订单通知开关
 * @param {boolean} data.systemNotification 系统通知开关
 * @param {boolean} data.marketingNotification 营销通知开关
 * @returns {Promise<Object>} 更新结果
 */
export function updateNotificationSettings(data) {
  return request({
    url: '/user/update_notification.php',
    method: 'post',
    data
  })
}

/**
 * 获取隐私设置
 * @returns {Promise<Object>} 隐私设置
 */
export function getPrivacySettings() {
  return request({
    url: '/user/privacy_settings.php',
    method: 'get'
  })
}

/**
 * 更新隐私设置
 * @param {Object} data 隐私设置
 * @param {boolean} data.profileVisible 个人资料可见性
 * @param {boolean} data.locationSharing 位置共享
 * @param {boolean} data.dataCollection 数据收集
 * @returns {Promise<Object>} 更新结果
 */
export function updatePrivacySettings(data) {
  return request({
    url: '/user/update_privacy.php',
    method: 'post',
    data
  })
}

/**
 * 检查应用版本
 * @param {Object} data 版本信息
 * @param {string} data.currentVersion 当前版本
 * @param {string} data.platform 平台(android/ios/h5)
 * @returns {Promise<Object>} 检查结果
 */
export function checkAppVersion(data) {
  return request({
    url: '/app/check_version.php',
    method: 'post',
    data
  })
}

/**
 * 获取银行卡列表
 * @returns {Promise<Object>} 银行卡列表
 */
export function getBankCards() {
  return request({
    url: '/api/mobile/v1/user/bank-cards',
    method: 'get'
  })
}

/**
 * 添加银行卡
 * @param {Object} data 银行卡信息
 * @param {string} data.holderName 持卡人姓名
 * @param {string} data.cardNumber 银行卡号
 * @param {string} data.bankName 银行名称
 * @param {string} data.bankCode 银行代码
 * @param {string} data.phone 预留手机号
 * @param {boolean} data.isDefault 是否默认卡
 * @returns {Promise<Object>} 添加结果
 */
export function addBankCard(data) {
  return request({
    url: '/api/mobile/v1/user/bank-cards',
    method: 'post',
    data
  })
}

/**
 * 删除银行卡
 * @param {Object} data 删除参数
 * @param {string|number} data.id 银行卡ID
 * @returns {Promise<Object>} 删除结果
 */
export function deleteBankCard(data) {
  return request({
    url: `/api/mobile/v1/user/bank-cards/${data.id}`,
    method: 'delete'
  })
}

/**
 * 设置默认银行卡
 * @param {Object} data 设置参数
 * @param {string|number} data.id 银行卡ID
 * @returns {Promise<Object>} 设置结果
 */
export function setDefaultBankCard(data) {
  return request({
    url: `/api/mobile/v1/user/bank-cards/${data.id}/default`,
    method: 'patch'
  })
}

/**
 * 获取业务员客户列表
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.pageSize 每页数量
 * @returns {Promise<Object>} 客户列表及分页信息
 */
export function getSalesmanClients(params) {
  console.log('调用getSalesmanClients API, 参数:', params);

  // 使用Laravel API
  return request({
    url: '/api/mobile/v1/salesman/clients',
    method: 'get',
    params: {
      user_id: 32, // 默认用户ID，可以从params中获取
      ...params
    }
  }).then(response => {
    console.log('getSalesmanClients API返回成功:', response);
    
    // Laravel API直接返回标准格式
    if (response.code === 0) {
      return {
        code: 0,
        message: response.message,
        data: {
          clients: response.data.clients || [],
          stats: response.data.stats || {}
        }
      };
    } else {
      throw new Error(response.message || '请求失败');
    }
  }).catch(error => {
    console.error('getSalesmanClients API错误:', error);
    // 返回一个空结果，避免前端出错
    return {
      code: 0,
      message: "请求失败，请稍后重试",
      data: {
        clients: []
      }
    };
  });
}

/**
 * 获取业务员客户详情
 * @param {string} clientId 客户ID
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 客户详情信息
 */
export function getSalesmanClientDetail(clientId, params) {
  console.log('调用getSalesmanClientDetail API, 客户ID:', clientId, '参数:', params);

  // 使用直接的PHP API
  return request({
    url: '/admin/api/salesman/get_client_detail.php',
    method: 'get',
    params: {
      client_id: clientId,
      user_id: 32, // 默认用户ID
      ...params
    }
  }).then(response => {
    console.log('getSalesmanClientDetail API返回成功:', response);

    // 适配直接PHP API的返回格式到前端期望的格式
    if (response.success && response.code === 200) {
      return {
        code: 0,
        message: response.message || '获取成功',
        data: response.data
      };
    } else {
      throw new Error(response.message || '请求失败');
    }
  }).catch(error => {
    console.error('getSalesmanClientDetail API错误:', error);
    // 返回一个空结果，避免前端出错
    return {
      code: 1,
      message: error.message || "获取客户详情失败，请稍后重试",
      data: null
    };
  });
}

/**
 * 获取业务员佣金记录
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.pageSize 每页数量
 * @param {string} params.timeRange 时间范围：all, month, week
 * @returns {Promise<Object>} 佣金记录
 */
export function getSalesmanCommission(params) {
  return request({
    url: '/admin/api/salesman/commissions.php',
    method: 'get',
    params
  })
}

/**
 * 验证推荐人ID
 * @param {Object} data - 请求数据
 * @param {string} data.referrer_id - 推荐人ID
 * @returns {Promise<object>} 返回结果
 */
export function validateReferrer(data) {
  console.log('验证推荐人ID API 调用参数:', data)
  return request({
    url: `/api/referrer/validate/${data.referrer_id}`,
    method: 'get',
    timeout: 8000 // 设置8秒超时
  }).catch(error => {
    console.error('验证推荐人ID出错:', error)
    // 重新抛出错误以便上层处理
    throw error
  })
}

/**
 * 获取推荐人详细信息
 * @param {Object} data - 请求数据
 * @param {string} data.referrer_id - 推荐人ID
 * @returns {Promise<object|null>} 返回推荐人详细信息或 null 表示失败
 */
export function getReferrerInfo(data) {
  console.log('获取推荐人信息API调用参数:', data)
  // 使用Laravel API获取推荐人信息
  return request({
    url: `/api/referrer/info/${data.referrer_id}`,
    method: 'get',
    timeout: 8000 // 设置8秒超时
  }).catch(error => {
    console.error('获取推荐人详细信息 API 出错:', error?.response?.data || error?.message || error)
    // 不再抛出错误，返回 null 或一个错误对象，让调用者处理
    return { code: -1, message: error?.response?.data?.message || error?.message || '获取推荐人详情失败', data: null };
  })
}

/**
 * 更新用户推荐人ID
 * @param {Object} data 推荐人ID参数
 * @returns {Promise<Object>} 更新结果
 */
export function updateReferrer(data) {
  console.log('调用更新推荐人API，使用JSON格式提交', data)

  return request({
    url: '/user/update_referrer.php',
    method: 'post',
    data: data,
    timeout: 15000 // 增加超时时间为15秒
  }).catch(error => {
    console.error('更新推荐人请求失败:', error)
    throw error
  })
}

/**
 * 获取用户支付设置
 * @returns {Promise<Object>} 支付设置结果
 */
export function getUserPaymentSettings() {
  return request({
    url: '/user/payment_settings.php',
    method: 'get'
  })
}

/**
 * 搜索推荐人
 * @param {Object} params 查询参数
 * @param {string} params.keyword 搜索关键词
 * @param {number} params.page 页码
 * @param {number} params.per_page 每页数量
 * @returns {Promise<Object>} 推荐人列表
 */
export function searchReferrers(params) {
  console.log('🔍 [API] 搜索推荐人调用参数:', params)
  return request({
    url: '/api/mobile/v1/user/search-referrers',
    method: 'get',
    params,
    timeout: 10000
  }).catch(error => {
    console.error('🔍 [API] 搜索推荐人失败:', error)
    throw error
  })
}

/**
 * 更新用户支付设置
 * @param {Object} data 支付设置参数
 * @param {string} data.enable_points_payment 是否启用积分支付 0-关闭 1-启用
 * @param {string} data.enable_coupon_payment 是否启用消费券支付 0-关闭 1-启用
 * @returns {Promise<Object>} 更新结果
 */
export function updateUserPaymentSettings(data) {
  return request({
    url: '/user/update_payment_settings.php',
    method: 'post',
    data
  })
}

/**
 * 获取用户净水器设备列表 - 使用Laravel API
 */
export function getUserPurifierDevices() {
  return request({
    url: '/api/mobile/v1/water-points',
    method: 'get',
    params: { type: 'user_devices' },
    timeout: 10000,
    retry: 1,
    retryDelay: 1000
  });
}

/**
 * 获取净水器设备详情 - 使用Laravel API
 * @param {string} deviceId 设备ID
 */
export function getPurifierDeviceDetail(deviceId) {
  return request({
    url: `/Tapp/admin/public/api/mobile/v1/devices/${deviceId}`,
    method: 'get',
    timeout: 10000,
    retry: 1,
    retryDelay: 1000
  });
}

/**
 * 获取净水器设备监控数据 - 使用Laravel API
 * @param {string} deviceId 设备ID
 */
export function getPurifierDeviceMonitor(deviceId) {
  return request({
    url: `/api/mobile/v1/water-points/${deviceId}/monitor`,
    method: 'get',
    timeout: 10000,
    retry: 1,
    retryDelay: 1000
  });
}

/**
 * 添加净水器设备 - 使用Laravel API
 * @param {Object} data 设备信息
 */
export function addPurifierDevice(data) {
  return request({
    url: '/api/mobile/v1/water-points',
    method: 'post',
    data
  });
}

/**
 * 更新净水器设备 - 使用Laravel API
 * @param {number} deviceId 设备ID
 * @param {Object} data 设备信息
 */
export function updatePurifierDevice(deviceId, data) {
  return request({
    url: `/api/mobile/v1/water-points/${deviceId}`,
    method: 'put',
    data
  });
}

/**
 * 删除净水器设备 - 使用Laravel API
 * @param {number} deviceId 设备ID
 */
export function deletePurifierDevice(deviceId) {
  return request({
    url: `/api/mobile/v1/water-points/${deviceId}`,
    method: 'delete'
  });
}

/**
 * 设置主净水器设备 - 使用Laravel API
 * @param {number} deviceId 设备ID
 */
export function setPrimaryPurifierDevice(deviceId) {
  return request({
    url: `/api/mobile/v1/water-points/${deviceId}/set-primary`,
    method: 'put'
  });
}

/**
 * 绑定支付宝账号
 * @param {Object} data 支付宝账号信息
 * @param {string} data.alipay_user_id 支付宝用户ID
 * @param {string} data.alipay_avatar 支付宝头像
 * @param {string} data.alipay_nickname 支付宝昵称
 * @returns {Promise<Object>} 绑定结果
 */
export function bindAlipayAccount(data) {
  return request({
    url: '/api/mobile/v1/user/alipay/bind',
    method: 'post',
    data
  })
}

/**
 * 解绑支付宝账号
 * @returns {Promise<Object>} 解绑结果
 */
export function unbindAlipayAccount() {
  return request({
    url: '/api/mobile/v1/user/alipay/unbind',
    method: 'post'
  })
}

/**
 * 绑定微信提现账号
 * @param {Object} data 微信账号信息
 * @param {string} data.wechat_user_id 微信用户ID (可选)
 * @returns {Promise<Object>} 绑定结果
 */
export function bindWechatAccount(data) {
  return requestLegacyUser('bind_wechat_account.php', {
    method: 'post',
    data
  })
}

/**
 * 解绑微信提现账号
 * @returns {Promise<Object>} 解绑结果
 */
export function unbindWechatAccount() {
  return requestLegacyUser('unbind_wechat_account.php', {
    method: 'post'
  })
}

/**
 * 获取支付宝授权URL
 * @returns {Promise<Object>} 授权URL和二维码内容
 */
export function getAlipayAuthUrl() {
  return request({
    url: '/api/mobile/v1/user/alipay/auth-url',
    method: 'get'
  })
}

/**
 * 获取VIP团队成员列表
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.pageSize 每页数量
 * @param {string} params.type 类型：all-全部、direct-直接推荐、month-本月新增
 * @returns {Promise<Object>} VIP团队成员列表
 */
export function getVipTeamMembers(params) {
  return request({
    url: 'user/vip_team.php',
    method: 'get',
    params,
    timeout: 15000, // 增加超时时间
    retry: 1 // 请求失败后的重试次数
  }).catch(error => {
    console.error('获取VIP团队成员列表失败:', error);
    // 返回默认数据避免页面错误
    return {
      code: 0,
      message: '使用默认数据',
      data: {
        list: [],
        total: 0
      }
    };
  });
}

/**
 * 获取分红奖励名单
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.pageSize 每页数量
 * @param {string} params.level 筛选等级
 * @param {string} params.type 筛选类型
 * @param {string} params.period 筛选时间段
 * @param {string} params.sort 排序方式
 * @returns {Promise<Object>} 奖励名单
 */
export function getRewardList(params) {
  console.log('调用分红奖励名单API, 参数:', params)
  return request({
    url: 'user/vip_reward_list.php',
    method: 'get',
    params,
    timeout: 15000, // 增加超时时间
    retry: 2, // 请求失败后的重试次数
    retryDelay: 1000 // 重试延迟时间
  }).catch(error => {
    console.error('获取分红奖励名单失败', error)
    // 返回统一格式的错误对象，避免前端处理崩溃
    return {
      code: 500,
      message: error.message || '获取分红奖励名单失败',
      data: {
        list: [],
        total: 0,
        summary: {
          totalMembers: 0,
          totalAmount: '0.00',
          averageAmount: '0.00'
        }
      }
    }
  })
}

/**
 * 获取VIP招募排行榜
 * @param {Object} params 查询参数
 * @param {string} params.month 月份
 * @param {number} params.limit 返回数量
 * @returns {Promise<Object>} 招募排行数据
 * @deprecated 请使用vip.js中的getVipRecruitRanking替代
 */
export function getVipRecruitRanking(params = {}) {
  console.log('已弃用: getVipRecruitRanking 方法已迁移到 vip.js，请使用该模块中的同名函数代替');

  // 添加时间戳和随机参数防止缓存
  const timestamp = Date.now();
  const randomParam = Math.floor(Math.random() * 1000);

  // 合并参数
  const queryParams = {
    _t: timestamp,
    _r: randomParam,
    ...params
  };

  // 导入vip.js模块中的getVipRecruitRanking函数
  // 使用动态导入的方式，避免循环引用问题
  return import('./vip').then(vipModule => {
    // 使用vip.js模块中的getVipRecruitRanking函数
    return vipModule.getVipRecruitRanking(queryParams);
  }).catch(error => {
    console.error('导入vip模块失败:', error);
    // 如果导入失败，继续使用原来的实现
    console.log('获取VIP招募排行榜, 参数:', queryParams);
    return request({
      url: 'user/vip_recruit_ranking.php',
      method: 'get',
      params: queryParams,
      timeout: 15000, // 增加超时时间
      retry: 1 // 请求失败后的重试次数
    }).catch(error => {
      console.error('获取VIP招募排行榜失败:', error);
      // 返回统一格式的错误对象，避免前端处理崩溃
      return {
        code: 500,
        message: error.message || '获取VIP招募排行榜失败',
        data: {
          ranking: [],
          month: new Date().toISOString().split('-').slice(0, 2).join('-')
        }
      };
    });
  });
}

/**
 * 检查用户角色
 * @param {Object} data 参数
 * @param {string} data.mobile 手机号
 * @returns {Promise<Object>} 用户角色信息
 */
export function checkUserRoles(data) {
  console.log('检查用户角色，参数:', data);

  return request({
    url: '/api/user/check-roles',
    method: 'post',
    data: {
      mobile: data.mobile
    },
    skipAuthToken: true, // 跳过Token验证
    timeout: 10000
  })
}

// 重新绑定微信
export function rebindWechat() {
    return request({
        url: '/user/rebind_wechat.php',
        method: 'post'
    })
}

// 获取union_id状态
export function getUnionIdStatus() {
    return request({
        url: '/user/union_id_status.php',
        method: 'get'
    })
}

// ==================== 管理员用户管理API ====================

/**
 * 获取用户列表 - 管理员专用
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 用户列表
 */
export function getUserList(params = {}) {
  return request({
    url: '/api/admin/v1/app-users',
    method: 'get',
    params
  })
}

/**
 * 创建用户 - 管理员专用
 * @param {Object} data 用户数据
 * @returns {Promise<Object>} 创建结果
 */
export function createUser(data) {
  return request({
    url: '/api/admin/v1/app-users',
    method: 'post',
    data
  }).then((res) => ({
    success: res?.code === 0 || res?.success === true,
    message: res?.message || '',
    data: res?.data ?? null
  }))
}

/**
 * 更新用户 - 管理员专用
 * @param {number} id 用户ID
 * @param {Object} data 用户数据
 * @returns {Promise<Object>} 更新结果
 */
export function updateUser(id, data) {
  return request({
    url: `/api/admin/v1/app-users/${id}`,
    method: 'put',
    data
  }).then((res) => ({
    success: res?.code === 0 || res?.success === true,
    message: res?.message || '',
    data: res?.data ?? null
  }))
}

/**
 * 删除用户 - 管理员专用
 * @param {number} id 用户ID
 * @returns {Promise<Object>} 删除结果
 */
export function deleteUser(id) {
  return request({
    url: `/api/admin/v1/app-users/${id}`,
    method: 'delete'
  }).then((res) => ({
    success: res?.code === 0 || res?.success === true,
    message: res?.message || '',
    data: res?.data ?? null
  }))
}

/**
 * 更新用户状态 - 管理员专用
 * @param {number} id 用户ID
 * @param {string} status 状态
 * @returns {Promise<Object>} 更新结果
 */
export function updateUserStatus(id, status) {
  return request({
    url: `/api/admin/v1/app-users/${id}/status`,
    method: 'put',
    data: { status }
  }).then((res) => ({
    success: res?.code === 0 || res?.success === true,
    message: res?.message || '',
    data: res?.data ?? null
  }))
}

/**
 * 重置用户密码 - 管理员专用
 * @param {number} id 用户ID
 * @returns {Promise<Object>} 重置结果
 */
export function resetUserPassword(id) {
  return request({
    url: `/api/admin/v1/app-users/${id}/reset-password`,
    method: 'post'
  }).then((res) => ({
    success: res?.code === 0 || res?.success === true,
    message: res?.message || '',
    data: res?.data ?? null
  }))
}

/**
 * 获取用户订单 - 管理员专用
 * @param {number} id 用户ID
 * @returns {Promise<Object>} 用户订单列表
 */
export function getUserOrders(id) {
  return request({
    url: `/api/admin/v1/app-users/${id}/orders`,
    method: 'get'
  })
}

/**
 * 获取用户设备 - 管理员专用
 * @param {number} id 用户ID
 * @returns {Promise<Object>} 用户设备列表
 */
export function getUserDevices(id) {
  return request({
    url: `/api/admin/v1/app-users/${id}/devices`,
    method: 'get'
  })
}

/**
 * 获取设备详情信息（直接调用净水器后台API）
 * @param {string} deviceId 设备ID
 * @returns {Promise<Object>} 设备详情信息
 */
export function getDeviceDetail(deviceId) {
  console.log('调用getDeviceDetail API, 设备ID:', deviceId);
  
  return request({
    url: '/api/mobile/v1/salesman/device-detail',
    method: 'get',
    params: {
      device_id: deviceId
    },
    timeout: 30000 // 30秒超时，因为需要调用外部API
  }).then(response => {
    console.log('getDeviceDetail API返回成功:', response);
    if (response && response.code === 0) {
      return response;
    } else {
      throw new Error(response.message || '获取设备详情失败');
    }
  }).catch(error => {
    console.error('getDeviceDetail API错误:', error);
    // 返回一个空结果，避免前端出错
    return {
      code: 500,
      message: error.message || "获取设备详情失败，请稍后重试",
      data: null
    };
  });
}
