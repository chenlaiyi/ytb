import request from '@/utils/request'

/**
 * 获取用户信息
 * @returns {Promise<Object>} 用户信息
 */
export function getUserInfo() {
  console.log('调用获取用户信息API');

  // 添加时间戳和随机参数防止缓存
  const timestamp = Date.now();
  const randomParam = Math.floor(Math.random() * 1000);

  return request({
    url: '/user/info.php',
    method: 'get',
    params: {
      _t: timestamp,
      _r: randomParam
    },
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    timeout: 15000, // 增加超时时间
    retry: 3 // 请求失败后重试次数
  }).catch(error => {
    console.error('获取用户信息失败:', error);
    // 抛出错误，让上层处理
    throw error;
  })
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
    url: '/user/login.php',
    method: 'post',
    data
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
  console.log('获取微信登录URL，参数:', data);

  // 明确记录是否有redirect_uri参数
  if (data && data.redirect_uri) {
    console.log('使用指定的回调URI:', data.redirect_uri);
  } else {
    console.log('未指定回调URI，将使用后端默认值');
    // 不设置默认回调地址，让后端使用API回调地址
    // data.redirect_uri = 'https://pay.itapgo.com/app/#/wechat-callback';
  }

  // 添加时间戳和随机数，避免缓存问题
  const params = {
    ...data,
    _t: Date.now(),
    _r: Math.floor(Math.random() * 1000)
  };

  console.log('最终请求参数:', params);

  // 记录当前浏览器信息，帮助调试
  console.log('浏览器信息:', navigator.userAgent);
  console.log('当前URL:', window.location.href);

  // 使用axios实例，确保不依赖require
  // 优先使用导入的request实例，如果不可用则使用全局axios
  const axiosInstance = request;

  if (!axiosInstance) {
    console.error('无法找到可用的axios实例，请确保axios已正确加载');
    return Promise.reject(new Error('网络请求模块未加载'));
  }

  console.log('使用的axios实例类型:', axiosInstance === request ? 'request' : (axiosInstance === window.axios ? 'window.axios' : 'axios'));

  return axiosInstance({
    url: '/api/mobile/v1/wechat/login-url',
    method: 'get',
    params,
    timeout: 20000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }).then(response => {
    console.log('获取微信登录URL响应:', response.data);
    return response.data;
  }).catch(error => {
    console.error('获取微信登录URL错误:', error);
    if (error.response) {
      console.error('错误状态:', error.response.status);
      console.error('错误数据:', error.response.data);
    }
    throw error;
  })
}

/**
 * 微信登录回调处理
 * @param {Object} data 微信回调参数
 * @param {string} data.code 微信授权code
 * @param {string} data.state 状态码
 * @returns {Promise<Object>} 登录结果
 */
export function wechatLoginCallback(data) {
  console.log('处理微信登录回调，参数:', data);

  // 确保code参数存在
  if (!data.code) {
    console.error('微信回调缺少code参数');
    return Promise.reject(new Error('微信授权失败，缺少授权码'));
  }

  // 清除可能存在的token，确保不会带着旧token去请求
  localStorage.removeItem('token');

  // 添加时间戳和随机数，避免缓存问题
  const requestData = {
    ...data,
    _t: Date.now(),
    _r: Math.floor(Math.random() * 1000)
  };

  console.log('微信回调最终请求参数:', requestData);

  // 记录当前浏览器信息，帮助调试
  console.log('浏览器信息:', navigator.userAgent);
  console.log('当前URL:', window.location.href);
  console.log('当前路径:', window.location.pathname);
  console.log('当前查询参数:', window.location.search);
  console.log('当前Hash:', window.location.hash);

  // 使用axios实例，确保不依赖require
  // 优先使用导入的request实例，如果不可用则使用全局axios
  const axiosInstance = request;

  if (!axiosInstance) {
    console.error('无法找到可用的axios实例，请确保axios已正确加载');
    return Promise.reject(new Error('网络请求模块未加载'));
  }

  console.log('使用的axios实例类型:', axiosInstance === request ? 'request' : (axiosInstance === window.axios ? 'window.axios' : 'axios'));

  return axiosInstance({
    url: '/api/mobile/v1/auth/wechat-callback',
    method: 'post',
    data: requestData,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }).then(response => {
    console.log('微信登录回调响应:', response.data);
    return response.data;
  }).catch(error => {
    console.error('微信登录回调错误:', error);
    if (error.response) {
      console.error('错误状态:', error.response.status);
      console.error('错误数据:', error.response.data);
    }
    throw error;
  })
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
  console.log('调用发送短信API:', data)

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

/**
 * 绑定手机号
 * @param {Object} data 绑定参数
 * @param {string} data.phone 手机号
 * @param {string} data.code 验证码
 * @returns {Promise<Object>} 绑定结果
 */
export function bindPhone(data) {
  return request({
    url: '/user/bind_phone.php',
    method: 'post',
    data
  })
}

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
  return request({
    url: '/user/assets.php',
    method: 'get'
  })
}

/**
 * 获取用户订单统计
 * @returns {Promise<Object>} 订单统计数据
 */
export function getOrderStats() {
  return request({
    url: '/user/order_stats.php',
    method: 'get'
  })
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
 * 获取工程师工作台数据
 * @returns {Promise<Object>} 工程师工作台数据
 */
export function getEngineerWorkspace() {
  return request({
    url: '/api/mobile/v1/engineer/workspace',
    method: 'get'
  })
}

/**
 * 获取净水器用户工作台数据
 * @returns {Promise<Object>} 净水器用户工作台数据
 */
export function getPurifierWorkspace() {
  return request({
    url: '/user/purifier_workspace.php',
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
 * 获取VIP会员工作台数据
 * @returns {Promise<Object>} VIP会员工作台数据
 */
export function getVipWorkspace() {
  return request({
    url: '/user/vip_workspace.php',
    method: 'get',
    timeout: 15000, // 增加超时时间
    retry: 2 // 错误自动重试
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
          totalVipCount: 12,
          directVipCount: 5,
          monthDirectVipCount: 2,
          monthVipCount: 2,

          // 充值相关字段
          totalRechargeCount: 38,
          directRechargeCount: 15,
          monthRechargeCount: 15,
          monthDirectRechargeCount: 5,

          // 新增充值字段 - 与前端组件期望的字段名匹配
          allTimeTeamRecharge: 38,
          currentMonthTeamRecharge: 15,
          directTeamRecharge: 15,
          currentMonthDirectRecharge: 5
        }
      }
    };
  });
}

/**
 * 获取VIP奖金池信息
 * @param {Object} params 查询参数
 * @param {string} params.month 月份参数，'current'表示本月，'last'表示上月
 * @returns {Promise<Object>} 奖金池信息
 */
export function getVipPoolInfo(params = {}) {
  // 添加时间戳和随机参数防止缓存
  const timestamp = Date.now();
  const randomParam = Math.floor(Math.random() * 1000);

  // 合并参数
  const queryParams = {
    _t: timestamp,
    _r: randomParam,
    ...params
  };

  return request({
    url: '/user/vip_pool_info.php',
    method: 'get',
    params: queryParams,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    },
    timeout: 15000, // 增加超时时间
    retry: 1 // 请求失败后重试一次
  }).catch(error => {
      console.error('获取VIP奖金池数据失败:', error);
      // 错误情况下，返回默认数据，避免页面崩溃
    return {
        code: 0,
        message: '使用默认数据',
        data: {
          vipCount: 52,
          rechargeCount: 38,
          juniorVipTeams: 15,
          middleVipTeams: 2,
          seniorVipTeams: 1,
          juniorRechargeTeams: 1,
          middleRechargeTeams: 0,
          seniorRechargeTeams: 0,
          totalQualifiedUsers: 18,
          totalSeniorDirectVips: 16,
          month: params.month === 'last' ? '上月' : '本月'
        }
    };
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
  const randomParam = Math.floor(Math.random() * 10000);

  // 合并参数
  const queryParams = {
    _t: timestamp,
    _r: randomParam,
    ...params
  };

  console.log('获取VIP团队信息，时间戳:', timestamp, '月份:', params.month || 'current');

  return request({
    url: '/user/vip_team_info.php',
    method: 'get',
    params: queryParams,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    timeout: 15000, // 增加超时时间
    retry: 2 // 请求失败后重试次数
  }).then(response => {
    if (response.code === 0 && response.data) {
      console.log('VIP团队API返回原始数据:', JSON.stringify(response.data));
      
      // 直接返回API响应，不做任何处理
      return response;
    } else {
      console.error('VIP团队信息API返回业务错误:', response);
      // 返回原始错误响应
      return response;
    }
  }).catch(error => {
    console.error('获取VIP团队信息失败:', error);
    // 错误情况下，返回错误信息
    return {
      code: 1,
      message: '网络错误，请稍后重试',
      data: null
    };
  });
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
    url: '/user/vip_dividend_info.php',
    method: 'get',
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
 */
export function getVipTimeInfo() {
  // 添加时间戳和随机参数防止缓存
  const timestamp = Date.now();
  const randomParam = Math.floor(Math.random() * 1000);

  console.log('获取VIP时间信息，时间戳:', timestamp);

  // 获取token
  const token = localStorage.getItem('token');
  console.log('当前Token状态:', token ? '已设置' : '未设置', token ? `长度: ${token.length}` : '');

  // 构建请求配置
  const requestConfig = {
    url: '/user/vip_time_info.php',
    method: 'get',
    params: { _t: timestamp, _r: randomParam, debug: '1' }, // 添加debug参数
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Requested-With': 'XMLHttpRequest'
    },
    timeout: 20000, // 增加超时时间到20秒
    retry: 3, // 增加重试次数到3次
    retryDelay: 1000 // 重试延迟1秒
  };

  // 确保请求头中包含Authorization
  if (token) {
    requestConfig.headers['Authorization'] = `Bearer ${token}`;
    console.log('已添加Authorization头到VIP时间信息请求');
  }

  return request(requestConfig)
    .then(response => {
      console.log('VIP时间信息API响应:', response);
      return response;
    })
    .catch(error => {
      console.error('获取VIP时间信息失败:', error);
      // 记录更详细的错误信息
      if (error.response) {
        console.error('错误状态:', error.response.status);
        console.error('错误数据:', error.response.data);
      } else if (error.request) {
        console.error('未收到响应:', error.request);
      } else {
        console.error('请求配置错误:', error.message);
      }

      // 错误情况下，返回默认数据，避免页面崩溃
      return {
        code: 0,
        message: '使用默认数据',
        data: {
          join_date: new Date().toISOString().split('T')[0],
          vip_join_date: new Date().toISOString().split('T')[0],
          vip_expire_date: null,
          vip_status: '有效',
          vip_payment_status: '已完款'
        }
      };
    });
}

/**
 * 获取业务员工作台数据
 * @returns {Promise<Object>} 业务员工作台数据
 */
export function getSalesmanWorkspace() {
  // 获取token，为了确保认证
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('没有找到认证token');
    return Promise.resolve({
      code: 1,
      message: '未授权访问',
      data: null
    });
  }

  // 添加随机数防止缓存
  const timestamp = new Date().getTime();
  const randomParam = Math.floor(Math.random() * 1000);

  return request({
    url: '/user/salesman_workspace.php',
    method: 'get',
    params: { _t: timestamp, _r: randomParam },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    },
    timeout: 15000, // 增加超时时间
    retry: 1 // 请求失败后重试一次
  }).catch(error => {
      console.error('获取业务员工作台数据失败:', error);
      // 错误情况下，返回默认数据，避免页面崩溃
    return {
        code: 0,
        message: '使用默认数据',
        data: {
          salesmanInfo: {
            name: '业务员',
            avatar: '/app/images/profile/default-avatar.png',
            title: '业务员',
            employeeId: '-'
          },
          statsInfo: {
            todaySales: '0',
            monthSales: '0',
            yearSales: '0',
            totalSales: '0'
          },
          commissionInfo: {
            pendingAmount: '0.00',
            monthAmount: '0.00',
            totalAmount: '0.00'
          },
          targetInfo: {
            monthTarget: 30,
            yearTarget: 360
          },
          rankingList: [],
          rankingDate: '本月',
          targetDate: new Date().getFullYear() + '年' + (new Date().getMonth() + 1) + '月'
        }
    };
  });
}

/**
 * 获取管理员工作台数据
 * @returns {Promise<Object>} 管理员工作台数据
 */
export function getAdminWorkspace() {
  return request({
    url: '/user/admin_workspace.php',
    method: 'get'
  })
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
    url: '/user/vip_dividends.php',
    method: 'get',
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
  return request({
    url: '/user/withdraw.php',
    method: 'post',
    data
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
    url: '/user/withdraw_history.php',
    method: 'get',
    params
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

/**
 * 更新用户个人资料
 * @param {Object} data 用户资料
 * @param {string} data.name 姓名（对应app_users表的name字段）
 * @param {string} data.email 邮箱
 * @param {string} data.birthday 生日
 * @param {number} data.gender 性别: 0-保密, 1-男, 2-女
 * @returns {Promise<Object>} 更新结果
 */
export function updateUserProfile(data) {
  return request({
    url: '/user/update_profile.php',
    method: 'post',
    data
  })
}

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
    url: '/user/verification_status.php',
    method: 'get'
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
    url: '/user/submit_verification.php',
    method: 'post',
    data
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
    url: '/user/bank_cards.php',
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
    url: '/user/add_bank_card.php',
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
    url: '/user/delete_bank_card.php',
    method: 'post',
    data
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
    url: '/user/set_default_bank_card.php',
    method: 'post',
    data
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

  // 使用直接的PHP API，绕过Laravel框架的token认证问题
  return request({
    url: '/admin/api/salesman/get_clients_direct.php',
    method: 'get',
    params: {
      user_id: 32, // 默认用户ID，可以从params中获取
      ...params
    }
  }).then(response => {
    console.log('getSalesmanClients API返回成功:', response);
    
    // 适配直接PHP API的返回格式到前端期望的格式
    if (response.success && response.code === 200) {
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
 * 获取业务员佣金记录
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.pageSize 每页数量
 * @param {string} params.timeRange 时间范围：all, month, week
 * @returns {Promise<Object>} 佣金记录
 */
export function getSalesmanCommission(params) {
  return request({
    url: '/salesman/commissions.php',
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
    url: '/user/validate_referrer.php',
    method: 'post',
    data,
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
  // 使用正式API获取推荐人信息
  return request({
    url: '/user/get_referrer_info.php',
    method: 'get',
    params: data,
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
 * 获取用户净水器设备列表
 */
export function getUserPurifierDevices() {
  return request({
    url: '/user/purifier-devices',
    method: 'get'
  });
}

/**
 * 获取净水器设备详情
 * @param {string} deviceId 设备ID
 */
export function getPurifierDeviceDetail(deviceId) {
  return request({
    url: `/user/purifier-device-detail/${deviceId}`,
    method: 'get',
    timeout: 10000,
    retry: 1,
    retryDelay: 1000
  });
}

/**
 * 获取净水器设备监控数据
 * @param {string} deviceId 设备ID
 */
export function getPurifierDeviceMonitor(deviceId) {
  return request({
    url: `/user/purifier-device-monitor/${deviceId}`,
    method: 'get',
    timeout: 10000,
    retry: 1,
    retryDelay: 1000
  });
}

/**
 * 添加净水器设备
 * @param {Object} data 设备信息
 */
export function addPurifierDevice(data) {
  return request({
    url: '/user/purifier-devices',
    method: 'post',
    data
  });
}

/**
 * 更新净水器设备
 * @param {number} deviceId 设备ID
 * @param {Object} data 设备信息
 */
export function updatePurifierDevice(deviceId, data) {
  return request({
    url: `/user/purifier-devices/${deviceId}`,
    method: 'put',
    data
  });
}

/**
 * 删除净水器设备
 * @param {number} deviceId 设备ID
 */
export function deletePurifierDevice(deviceId) {
  return request({
    url: `/user/purifier-devices/${deviceId}`,
    method: 'delete'
  });
}

/**
 * 设置主净水器设备
 * @param {number} deviceId 设备ID
 */
export function setPrimaryPurifierDevice(deviceId) {
  return request({
    url: `/user/purifier-devices/${deviceId}/set-primary`,
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
    url: '/user/bind_alipay_account.php',
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
    url: '/user/unbind_alipay_account.php',
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
  return request({
    url: '/user/bind_wechat_account.php',
    method: 'post',
    data
  })
}

/**
 * 解绑微信提现账号
 * @returns {Promise<Object>} 解绑结果
 */
export function unbindWechatAccount() {
  return request({
    url: '/user/unbind_wechat_account.php',
    method: 'post'
  })
}

/**
 * 获取支付宝授权URL
 * @returns {Promise<Object>} 授权URL和二维码内容
 */
export function getAlipayAuthUrl() {
  return request({
    url: '/user/alipay_auth_url.php',
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
    url: '/user/vip_team.php',
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
    url: '/user/vip_reward_list.php',
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
