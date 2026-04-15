import request from '@/utils/request';

/**
 * 获取VIP会员列表
 * @param {Object} params - 请求参数
 * @param {number} params.page - 页码
 * @param {string} params.search - 搜索关键词
 * @returns {Promise<Object>} 返回VIP会员列表数据
 */
export function getVipUsers(params) {
  // 添加时间戳和随机参数，防止缓存
  const timestamp = Date.now();
  const randomParam = Math.floor(Math.random() * 1000);
  
  return request({
    url: '/admin/api/user/vip_users.php',
    method: 'get',
    params: {
      ...params,
      _t: timestamp,
      _r: randomParam
    },
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Accept': 'application/json'
    },
    timeout: 15000,
    retry: 3,
    retryDelay: 1000,
    skipErrorHandler: true
  }).catch(error => {
    console.error('获取VIP会员列表失败:', error);
    // 记录更详细的错误信息
    if (error.response) {
      console.error('错误状态:', error.response.status);
      console.error('错误数据:', error.response.data);
    } else if (error.request) {
      console.error('请求未收到响应:', error.request);
    } else {
      console.error('错误信息:', error.message);
    }
    // 返回默认数据
    return {
      code: 0,
      data: {
        users: [],
        total: 0,
        totalDividend: 0,
        pendingAmount: 0
      }
    };
  });
}

/**
 * 获取VIP工作台数据
 * @param {Object} params - 请求参数
 * @param {string} params.month - 月份参数，'current'表示本月，'last'表示上月
 * @returns {Promise<Object>} VIP工作台数据
 */
export function getVipWorkspace(params = {}) {
  // 添加时间戳和随机参数，防止缓存
  const timestamp = Date.now();
  const randomParam = Math.floor(Math.random() * 1000);

  return request({
    url: '/api/mobile/v1/vip/workspace',
    method: 'get',
    params: {
      ...params,
      _t: timestamp,
      _r: randomParam
    },
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Accept': 'application/json'
    },
    timeout: 30000, // 增加超时时间到30秒
    retry: 3, // 增加重试次数到3次
    retryDelay: 1500, // 重试延迟时间1.5秒
    // 跳过默认的错误处理
    skipErrorHandler: true
  }).catch(error => {
    console.error('获取VIP工作台数据失败，尝试使用简化版API:', error);
    
    // 如果主API失败，尝试使用简化版API
    return request({
      url: '/api/mobile/v1/vip/workspace-simple',
      method: 'get',
      params: {
        ...params,
        _t: timestamp,
        _r: randomParam
      },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Accept': 'application/json'
      },
      timeout: 15000,
      retry: 2,
      skipErrorHandler: true
    }).catch(fallbackError => {
      console.error('简化版API也失败，使用默认数据:', fallbackError);
      
      // 记录更详细的错误信息
      if (error.response) {
        console.error('主API错误状态:', error.response.status);
        console.error('主API错误数据:', error.response.data);
      } else if (error.request) {
        console.error('主API未收到响应:', error.request);
      } else {
        console.error('主API请求配置错误:', error.message);
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
  });
}

/**
 * 获取VIP会员详情
 * @param {string|number} userId - 用户ID
 * @returns {Promise<Object>} 返回VIP会员详情数据
 */
export function getVipUserDetail(userId) {
  return request({
    url: `/api/vip/users/${userId}`,
    method: 'get'
  });
}

/**
 * 获取VIP会员分红记录
 * @param {Object} params - 请求参数
 * @param {string|number} params.user_id - 用户ID
 * @param {number} params.page - 页码
 * @param {number} params.page_size - 每页数量
 * @returns {Promise<Object>} 返回分红记录列表
 */
export function getVipUserDividends(params) {
  return request({
    url: '/api/vip/user-dividends',
    method: 'get',
    params
  });
}

/**
 * 获取VIP会员团队成员
 * @param {Object} params - 请求参数
 * @param {string|number} params.user_id - 用户ID
 * @param {number} params.page - 页码
 * @param {number} params.page_size - 每页数量
 * @returns {Promise<Object>} 返回团队成员列表
 */
export function getVipUserTeam(params) {
  return request({
    url: '/api/vip/user-team',
    method: 'get',
    params
  });
}

/**
 * 导出VIP分红记录
 * @param {Object} data - 请求参数
 * @param {string} data.start_date - 开始日期
 * @param {string} data.end_date - 结束日期
 * @returns {Promise<Object>} 返回导出结果
 */
export function exportVipDividends(data) {
  return request({
    url: '/api/vip/export-dividends',
    method: 'post',
    data,
    responseType: 'blob'
  });
}

/**
 * 结算VIP分红
 * @param {Object} data - 请求参数
 * @param {string} data.date - 结算日期
 * @returns {Promise<Object>} 返回结算结果
 */
export function settleVipDividends(data) {
  return request({
    url: '/api/vip/settle-dividends',
    method: 'post',
    data
  });
}

/**
 * 获取VIP奖金池信息
 * @param {Object} params - 可选的URL参数，包含月份信息
 * @returns {Promise<Object>} 返回VIP奖金池信息
 */
export function getVipPoolInfo(params = {}) {
  // 添加时间戳和随机参数，防止缓存
  const timestamp = Date.now();
  const randomParam = Math.floor(Math.random() * 1000);
  
  // 提取silentError参数
  const { silentError, ...requestParams } = params;
  
  return request({
    url: '/api/mobile/v1/vip/pool-info', // 使用Mobile V1 API路径
    method: 'get',
    baseURL: '', // 使用空baseURL，确保使用完整路径
    params: {
      ...requestParams,
      _t: timestamp,
      _r: randomParam
    },
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Accept': 'application/json'
    },
    timeout: 15000,
    retry: 3,
    // 跳过默认的错误处理
    skipErrorHandler: true,
    // 传递silentError标志
    silentError: silentError
  }).catch(error => {
    console.error('获取VIP奖金池信息失败:', error);
    return {
      code: 0,
      message: '使用默认数据',
      data: {
        vipCount: 0,
        rechargeCount: 0,
        juniorVipTeams: 0,
        middleVipTeams: 0,
        seniorVipTeams: 0,
        juniorRechargeTeams: 0,
        middleRechargeTeams: 0,
        seniorRechargeTeams: 0
      }
    };
  });
}

/**
 * 获取VIP分红信息
 * @param {Object} params - 可选的URL参数，包含月份信息
 * @returns {Promise<Object>} 返回VIP分红信息
 */
export function getVipDividendInfo(params = {}) {
  // 添加时间戳和随机参数，防止缓存
  const timestamp = Date.now();
  const randomParam = Math.floor(Math.random() * 1000);
  
  // 提取silentError参数
  const { silentError, ...requestParams } = params;
  
  return request({
    url: '/api/mobile/v1/vip/dividend-info', // 使用Mobile V1 API路径
    method: 'get',
    baseURL: '', // 使用空baseURL，确保使用完整路径
    params: {
      ...requestParams,
      _t: timestamp,
      _r: randomParam
    },
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Accept': 'application/json'
    },
    timeout: 15000,
    retry: 3,
    // 跳过默认的错误处理
    skipErrorHandler: true,
    // 传递silentError标志
    silentError: silentError
  }).catch(error => {
    console.error('获取VIP分红信息失败:', error);
    return {
      code: 0,
      message: '使用默认数据',
      data: {
        totalAmount: '0.00',
        monthAmount: '0.00',
        pendingAmount: '0.00'
      }
    };
  });
}

/**
 * 获取VIP团队信息
 * @param {Object} params - 请求参数
 * @returns {Promise<Object>} 返回VIP团队信息
 */
export function getVipTeamInfo(params = {}) {
  // 添加时间戳和随机参数，防止缓存
  const timestamp = Date.now();
  const randomParam = Math.floor(Math.random() * 10000);
  
  // 提取silentError参数
  const { silentError, ...requestParams } = params;
  
  return request({
    url: '/Tapp/admin/public/index.php/api/mobile/v1/vip/team-info', // 使用完整的Laravel API路径
    method: 'get',
    baseURL: '', // 使用空baseURL，确保使用完整路径
    params: { 
      ...requestParams, 
      _t: timestamp,
      _r: randomParam 
    },
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Accept': 'application/json'
    },
    timeout: 15000, // 增加超时时间
    retry: 3, // 请求失败后增加重试次数
    retryDelay: 1000, // 重试延迟时间
    // 跳过默认的错误处理
    skipErrorHandler: true,
    // 传递silentError标志
    silentError: silentError
  }).catch(error => {
    console.error('获取VIP团队信息失败:', error);
    
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
        totalVipCount: 0, // 团队总VIP数
        directVipCount: 0, // 直推VIP数
        monthDirectVipCount: 0, // 本月直推VIP数
        monthVipCount: 0, // 本月团队新增VIP数
        teamMemberCount: 0 // 团队成员数（包括非VIP）
      }
    };
  });
}

/**
 * 获取VIP团队数据 - 手机端专用
 * 为VIP首页的"我的团队"卡片提供数据
 * @param {Object} params - 请求参数
 * @param {string} params.month - 月份参数 ('current' 或 'last')
 * @returns {Promise<Object>} 返回团队数据
 */
export function getVipTeamData(params = {}) {
  // 添加时间戳和随机参数，防止缓存
  const timestamp = Date.now();
  const randomParam = Math.floor(Math.random() * 10000);
  
  return request({
    url: '/admin/api/user/vip_team_data.php',
    method: 'get',
    params: { 
      ...params, 
      _t: timestamp,
      _r: randomParam 
    },
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Accept': 'application/json'
    },
    timeout: 15000,
    retry: 3,
    retryDelay: 1000,
    skipErrorHandler: true
  }).catch(error => {
    console.error('获取VIP团队数据失败:', error);
    
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
        // VIP相关数据
        totalVipCount: 0,
        directVipCount: 0,
        monthVipCount: 0,
        monthDirectVipCount: 0,
        selfIsNewThisMonth: 0,
        
        // 充值相关数据
        totalRechargeCount: 0,
        directRechargeCount: 0,
        monthTeamRechargeCount: 0,
        monthDirectRechargeCount: 0,
        
        // 兼容前端字段名
        currentMonthTeamRecharge: 0,
        currentMonthDirectRecharge: 0,
        allTimeTeamRecharge: 0,
        directTeamRecharge: 0,
        
        // 查询信息
        queryMonth: params.month === 'current' ? '本月' : '上月',
        queryMonthValue: '',
        userId: 0
      }
    };
  });
}

/**
 * 获取VIP团队成员
 * @param {Object} params - 请求参数
 * @returns {Promise<Object>} 返回团队成员列表
 */
export function getVipTeamMembers(params) {
  // 添加时间戳和随机参数，防止缓存
  const timestamp = Date.now();
  const randomParam = Math.floor(Math.random() * 10000);
  
  return request({
    url: '/admin/api/user/vip_team_members.php',
    method: 'get',
    params: {
      ...params,
      _t: timestamp,
      _r: randomParam
    },
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Accept': 'application/json'
    },
    timeout: 15000, // 增加超时时间
    retry: 3, // 增加重试次数
    retryDelay: 1000, // 重试延迟时间
    skipErrorHandler: true
  }).catch(error => {
    console.error('获取VIP团队成员失败:', error);
    
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
        list: [],
        total: 0
      }
    };
  });
}

/**
 * 获取VIP分红详情
 * @param {string|number} dividendId - 分红记录ID
 * @returns {Promise<Object>} 返回分红详情数据
 */
export function getVipDividendDetail(dividendId) {
  return request({
    url: `user/vip_dividend_detail.php`,
    method: 'get',
    params: {
      id: dividendId,
      _t: Date.now(),
      _r: Math.floor(Math.random() * 1000)
    },
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Accept': 'application/json'
    },
    timeout: 15000,
    retry: 3,
    retryDelay: 1000,
    skipErrorHandler: true
  }).catch(error => {
    console.error('获取分红详情失败:', error);
    return {
      code: -1,
      msg: '获取分红详情失败',
      data: null
    };
  });
}

/**
 * 获取VIP分红记录（个人）
 * @param {Object} params - 请求参数
 * @returns {Promise<Object>} 返回分红记录列表
 */
export function getVipDividends(params) {
  return request({
    url: '/api/mobile/v1/vip/dividends',
    method: 'get',
    params,
    timeout: 15000, // 增加超时时间
    retry: 1, // 请求失败后的重试次数
    retryDelay: 1000 // 重试延迟时间
  }).catch(error => {
    // 检查是否是401错误
    if (error.response && error.response.status === 401) {
      // 401错误完全静默处理，不显示任何日志，直接抛出简单错误
      throw new Error('无效的访问令牌');
    }
    
    // 检查错误消息是否包含401相关信息
    if (error.message && (error.message.includes('无效的访问令牌') || error.message.includes('401'))) {
      // 401相关错误完全静默处理
      throw new Error('无效的访问令牌');
    }
    
    // 其他错误记录详细信息
    console.error('获取VIP分红记录失败:', error);
    if (error.response) {
      console.error('错误状态:', error.response.status);
      console.error('错误数据:', error.response.data);
    } else if (error.request) {
      console.error('请求未收到响应:', error.request);
    } else {
      console.error('错误信息:', error.message);
    }
    
    // 抛出错误让前端页面统一处理
    throw error;
  });
}

/**
 * 获取VIP分红公开统计（平台数据）
 * @param {Object} params - 请求参数
 * @returns {Promise<Object>} 返回平台分红统计数据
 */
export function getVipDividendsPublic(params) {
  // 添加时间戳和随机参数，防止缓存
  const timestamp = Date.now();
  const randomParam = Math.floor(Math.random() * 1000);
  
  return request({
    url: '/api/mobile/v1/vip/dividends-public',
    method: 'get',
    params: {
      ...params,
      _t: timestamp,
      _r: randomParam
    },
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Accept': 'application/json'
    },
    timeout: 15000,
    retry: 2,
    retryDelay: 1000,
    skipErrorHandler: true
  }).catch(error => {
    console.error('获取VIP分红公开统计失败:', error);
    // 记录更详细的错误信息
    if (error.response) {
      console.error('错误状态:', error.response.status);
      console.error('错误数据:', error.response.data);
    } else if (error.request) {
      console.error('请求未收到响应:', error.request);
    } else {
      console.error('错误信息:', error.message);
    }
    
    // 返回默认数据避免页面错误
    return {
      code: 0,
      message: '使用默认数据',
      data: {
        month: new Date().toISOString().slice(0, 7),
        platform_stats: {
          total_vip_count: 0,
          month_new_vip_count: 0,
          total_device_count: 0,
          month_new_device_count: 0
        },
        pool_info: {
          vip_pool: 0,
          device_pool: 0,
          total_pool: 0,
          calculation: {
            vip_formula: "新增VIP(0) × 300元 × 3轮 = 0元",
            device_formula: "新增设备(0) × 15元 × 3轮 = 0元"
          }
        },
        qualification_stats: {
          vip: { junior: 0, middle: 0, senior: 0 },
          recharge: { junior: 0, middle: 0, senior: 0 }
        },
        dividend_distribution: {
          vip: {
            junior: { pool: 0, qualified_count: 0, per_person: 0 },
            middle: { pool: 0, qualified_count: 0, per_person: 0 },
            senior: { pool: 0, qualified_count: 0, per_person: '按直推占比分配' }
          },
          recharge: {
            junior: { pool: 0, qualified_count: 0, per_person: 0 },
            middle: { pool: 0, qualified_count: 0, per_person: 0 },
            senior: { pool: 0, qualified_count: 0, per_person: '按直推占比分配' }
          }
        },
        records: {
          list: [],
          total: 0,
          page: 1,
          page_size: 20
        }
      }
    };
  });
}

/**
 * 检查是否需要显示虚拟数据
 * 可用于前端判断是否为演示环境
 * @returns {Promise<Object>} 返回结果
 */
export function getVipDummy() {
  return request({
    url: '/api/vip/dummy',
    method: 'get'
  });
}

/**
 * 获取当前用户的团队成员关系
 * @returns {Promise<Object>} 返回当前用户的团队成员关系
 */
export function getCurrentUserTeamMembers() {
  return request({
    url: '/api/team-members',
    method: 'get',
    timeout: 15000, // 增加超时时间
    retry: 1 // 请求失败后的重试次数
  });
}

/**
 * 获取当前用户的团队统计信息
 * @returns {Promise<Object>} 返回当前用户的团队统计信息
 */
export function getCurrentUserTeamStats() {
  return request({
    url: '/api/team-members/statistics',
    method: 'get',
    timeout: 15000
  });
}

/**
 * 更新当前用户的团队成员关系
 * @param {Object} data - 请求参数
 * @returns {Promise<Object>} 返回更新结果
 */
export function updateCurrentUserTeamRelationship(data) {
  return request({
    url: '/api/team-members/update-relationship',
    method: 'post',
    data,
    timeout: 15000
  });
}

/**
 * 管理员获取指定用户的团队成员关系
 * @param {string|number} userId - 用户ID
 * @returns {Promise<Object>} 返回指定用户的团队成员关系
 */
export function getUserTeamMembers(userId) {
  return request({
    url: `/api/team-members/${userId}`,
    method: 'get',
    timeout: 15000
  });
}

/**
 * 管理员获取指定用户的团队统计信息
 * @param {string|number} userId - 用户ID
 * @returns {Promise<Object>} 返回指定用户的团队统计信息
 */
export function getUserTeamStats(userId) {
  return request({
    url: `/api/team-members/${userId}/statistics`,
    method: 'get',
    timeout: 15000
  });
}

/**
 * 管理员更新指定用户的团队成员关系
 * @param {string|number} userId - 用户ID
 * @param {Object} data - 请求参数
 * @returns {Promise<Object>} 返回更新结果
 */
export function updateUserTeamRelationship(userId, data) {
  return request({
    url: `/api/team-members/${userId}/update-relationship`,
    method: 'post',
    data,
    timeout: 15000
  });
}

/**
 * 管理员执行全量同步所有用户的团队成员关系
 * @returns {Promise<Object>} 返回同步结果
 */
export function syncAllUsersTeamRelationships() {
  return request({
    url: '/api/team-members/sync-all',
    method: 'post',
    timeout: 30000 // 增加超时时间，因为全量同步可能耗时较长
  });
}

/**
 * 获取VIP招募排行榜
 * @param {Object} params 查询参数
 * @param {string} params.month 月份
 * @param {number} params.limit 返回数量
 * @returns {Promise<Object>} 招募排行数据
 */
export function getVipRecruitRanking(params = {}) {
  // 直接使用原生PHP API（已恢复）
  return request({
    url: '/admin/api/user/vip_recruit_ranking.php',
    method: 'get',
    params: {
      ...params,
      _t: Date.now(),
      _r: Math.floor(Math.random() * 1000)
    },
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Accept': 'application/json'
    },
    timeout: 15000,
    retry: 2,
    retryDelay: 1000
  }).catch(error => {
    console.error('获取VIP招募排行榜失败:', error);
    // 返回统一格式的错误对象，避免前端处理崩溃
    return {
      code: 500,
      message: error.message || '获取VIP招募排行榜失败',
      data: {
        ranking: [],
        stats: {
          total_vip_count: 0,
          month_new_vip_count: 0,
          current_month: new Date().toISOString().split('-').slice(0, 2).join('-')
        }
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
  
  // 直接使用原生PHP API（已恢复）
  return request({
    url: '/admin/api/user/vip_reward_list.php',
    method: 'get',
    params,
    timeout: 15000,
    retry: 2,
    retryDelay: 1000
  }).catch(error => {
    console.error('获取分红奖励名单失败', error)
    // 返回统一格式的错误对象，避免前端处理崩溃
    return {
      code: 500,
      message: error.message || '获取分红奖励名单失败',
      data: {
        list: [],
        total: 0,
        page: 1,
        pageSize: 10
      }
    };
  });
}

/**
 * 获取VIP时间信息
 * @returns {Promise<Object>} 返回VIP时间信息
 */
export function getVipTimeInfo() {
  // 添加时间戳和随机参数，防止缓存
  const timestamp = Date.now();
  const randomParam = Math.floor(Math.random() * 1000);
  
  return request({
    url: '/api/mobile/v1/vip/time-info', // V1迁移：使用Laravel API路径
    method: 'get',
    params: {
      _t: timestamp,
      _r: randomParam
    },
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Accept': 'application/json'
    },
    timeout: 10000,
    retry: 3, // 增加重试次数到3次
    retryDelay: 1000, // 重试延迟1秒
    // 跳过默认的错误处理
    skipErrorHandler: true
  }).catch(error => {
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
}

/**
 * 获取VIP分红统计数据
 * @returns {Promise<Object>} 返回VIP分红统计数据
 */
export function getVipDividendStats() {
  // 添加时间戳和随机参数，防止缓存
  const timestamp = Date.now();
  const randomParam = Math.floor(Math.random() * 1000);
  
  return request({
    url: '/admin/api/user/vip_dividend_stats.php',
    method: 'get',
    params: {
      _t: timestamp,
      _r: randomParam
    },
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Accept': 'application/json'
    },
    timeout: 15000,
    retry: 3,
    retryDelay: 1000,
    skipErrorHandler: true
  }).catch(error => {
    console.error('获取VIP分红统计数据失败:', error);
    // 记录更详细的错误信息
    if (error.response) {
      console.error('错误状态:', error.response.status);
      console.error('错误数据:', error.response.data);
    } else if (error.request) {
      console.error('请求未收到响应:', error.request);
    } else {
      console.error('错误信息:', error.message);
    }
    // 返回默认数据
    return {
      code: 0,
      message: '使用默认数据',
      data: {
        vipCount: 0,
        totalPool: 0,
        levelCounts: {
          juniorCount: 0,
          middleCount: 0,
          seniorCount: 0
        },
        levelAmounts: {
          juniorAmount: 0,
          middleAmount: 0,
          seniorAmount: 0
        }
      }
    };
  });
}

/**
 * 获取团队销售净水器列表
 * @param {Object} params 查询参数
 * @param {string} params.type 查询类型，team: 团队销售, direct: 直推销售
 * @param {string} params.month 查询月份，current: 本月, last: 上月, all: 全部
 * @param {number} params.page 页码
 * @param {number} params.page_size 每页数量
 * @returns {Promise<Object>} 团队设备列表数据
 */
export function getTeamDevices(params = {}) {
  // 添加时间戳和随机参数，防止缓存
  const timestamp = Date.now();
  const randomParam = Math.floor(Math.random() * 1000);
  
  return request({
    url: '/admin/api/user/team_devices.php',
    method: 'get',
    params: {
      ...params,
      _t: timestamp,
      _r: randomParam
    },
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Accept': 'application/json'
    },
    timeout: 15000,
    retry: 3,
    retryDelay: 1000,
    skipErrorHandler: true
  }).catch(error => {
    console.error('获取团队设备列表失败:', error);
    // 记录更详细的错误信息
    if (error.response) {
      console.error('错误状态:', error.response.status);
      console.error('错误数据:', error.response.data);
    } else if (error.request) {
      console.error('请求未收到响应:', error.request);
    } else {
      console.error('错误信息:', error.message);
    }
    // 返回默认数据
    return {
      code: 0,
      message: '使用默认数据',
      data: {
        devices: [],
        total: 0,
        page: 1,
        page_size: 20,
        total_pages: 0,
        summary: {
          total_count: 0,
          total_amount: '0.00',
          query_month: '本月',
          query_type: '团队销售'
        }
      }
    };
  });
}

/**
 * 获取VIP分红准确统计数据（使用正确算法）
 * @param {Object} params 查询参数
 * @param {string} params.month 查询月份，格式：YYYY-MM
 * @returns {Promise<Object>} 返回准确的平台分红统计数据
 */
export function getVipDividendsAccurate(params) {
  console.log('调用VIP分红准确统计API, 参数:', params)

  return request({
    url: '/admin/api/user/vip_dividends_accurate.php',
    method: 'get',
    params,
    timeout: 60000, // 增加超时时间，因为需要计算
    retry: 1,
    retryDelay: 2000
  }).catch(error => {
    console.error('获取VIP分红准确统计失败', error)
    // 返回统一格式的错误对象，避免前端处理崩溃
    return {
      code: 500,
      message: error.message || '获取VIP分红准确统计失败',
      data: {
        month: params.month || new Date().toISOString().slice(0, 7),
        platform_stats: {
          total_vip_count: 0,
          month_new_vip_count: 0,
          total_device_count: 0,
          month_new_device_count: 0
        },
        pool_info: {
          vip_pool: 0,
          device_pool: 0,
          total_pool: 0,
          calculation: {
            vip_formula: '',
            device_formula: ''
          }
        },
        qualification_stats: {
          vip: { junior: 0, middle: 0, senior: 0 },
          recharge: { junior: 0, middle: 0, senior: 0 }
        },
        qualified_users: {
          vip: { junior: [], middle: [], senior: [] },
          device: { junior: [], middle: [], senior: [] }
        },
        dividend_distribution: {
          vip: {
            junior: { pool: 0, qualified_count: 0, per_person: 0 },
            middle: { pool: 0, qualified_count: 0, per_person: 0 },
            senior: { pool: 0, qualified_count: 0, per_person: '按直推占比分配' }
          },
          recharge: {
            junior: { pool: 0, qualified_count: 0, per_person: 0 },
            middle: { pool: 0, qualified_count: 0, per_person: 0 },
            senior: { pool: 0, qualified_count: 0, per_person: '按直推占比分配' }
          }
        }
      }
    };
  });
}

