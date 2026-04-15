import request from '@/utils/request'

/**
 * 分支机构VIP相关API
 */

// 获取分支机构VIP用户信息
export function getBranchVipInfo(params = {}) {
  return request({
    url: '/api/branch/vip/info',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构VIP统计数据
export function getBranchVipStats(params = {}) {
  return request({
    url: '/api/branch/vip/stats',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构VIP团队信息
export function getBranchVipTeam(params = {}) {
  return request({
    url: '/api/branch/vip/team',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构VIP分红记录
export function getBranchVipDividends(params = {}) {
  return request({
    url: '/api/branch/vip/dividends',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构VIP分红详情
export function getBranchVipDividendDetail(id, params = {}) {
  return request({
    url: `/branch-user/dividend_record_detail.php?id=${id}`,
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构VIP排行榜
export function getBranchVipRanking(params = {}) {
  return request({
    url: '/api/branch/vip/ranking',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构VIP奖励记录
export function getBranchVipRewards(params = {}) {
  return request({
    url: '/api/branch/vip/rewards',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构VIP名单
export function getBranchVipList(params = {}) {
  return request({
    url: '/api/branch/vip/list',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构VIP达标状态
export function getBranchVipQualificationStatus(params = {}) {
  return request({
    url: '/api/branch/vip/qualification-status',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构VIP充值分红达标状态
export function getBranchRechargeQualificationStatus(params = {}) {
  return request({
    url: '/api/branch/vip/recharge-qualification-status',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构VIP月度统计
export function getBranchVipMonthlyStats(params = {}) {
  return request({
    url: '/api/branch/vip/monthly-stats',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构VIP团队结构
export function getBranchVipTeamStructure(params = {}) {
  return request({
    url: '/api/branch/vip/team-structure',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构VIP推荐记录
export function getBranchVipReferrals(params = {}) {
  return request({
    url: '/api/branch/vip/referrals',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构VIP业绩统计
export function getBranchVipPerformance(params = {}) {
  return request({
    url: '/api/branch/vip/performance',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构VIP收益明细
export function getBranchVipEarnings(params = {}) {
  return request({
    url: '/api/branch/vip/earnings',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 申请分支机构VIP提现
export function applyBranchVipWithdraw(data) {
  return request({
    url: '/api/branch/vip/withdraw/apply',
    method: 'post',
    data,
    skipAuthToken: true
  })
}

// 获取分支机构VIP提现记录
export function getBranchVipWithdrawRecords(params = {}) {
  return request({
    url: '/api/branch/vip/withdraw/records',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构VIP设置
export function getBranchVipSettings(params = {}) {
  return request({
    url: '/api/branch/vip/settings',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 更新分支机构VIP设置
export function updateBranchVipSettings(data) {
  return request({
    url: '/api/branch/vip/settings/update',
    method: 'post',
    data,
    skipAuthToken: true
  })
}

// 获取分支机构VIP协议
export function getBranchVipAgreement(params = {}) {
  return request({
    url: '/api/branch/vip/agreement',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 签署分支机构VIP协议
export function signBranchVipAgreement(data) {
  return request({
    url: '/api/branch/vip/agreement/sign',
    method: 'post',
    data,
    skipAuthToken: true
  })
}

// 获取分支机构VIP升级记录
export function getBranchVipUpgradeRecords(params = {}) {
  return request({
    url: '/api/branch/vip/upgrade/records',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 申请分支机构VIP升级
export function applyBranchVipUpgrade(data) {
  return request({
    url: '/api/branch/vip/upgrade/apply',
    method: 'post',
    data,
    skipAuthToken: true
  })
}

// 获取分支机构VIP培训资料
export function getBranchVipTrainingMaterials(params = {}) {
  return request({
    url: '/api/branch/vip/training/materials',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构VIP通知公告
export function getBranchVipAnnouncements(params = {}) {
  return request({
    url: '/api/branch/vip/announcements',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

/**
 * 获取分支机构VIP工作台数据
 * @param {Object} params - 请求参数
 * @param {string} params.month - 月份参数，'current'表示本月，'last'表示上月
 * @returns {Promise<Object>} VIP工作台数据
 */
export function getBranchVipWorkspace(params = {}) {
  const timestamp = Date.now();
  const randomParam = Math.floor(Math.random() * 1000);
  
  // 获取用户ID和分支机构代码
  const userId = localStorage.getItem('user_id')
  const branchCode = localStorage.getItem('branch_code')

  return request({
    url: 'branch-user/vip_workspace.php',
    method: 'get',
    params: {
      user_id: userId,
      branch_code: branchCode,
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
    timeout: 30000,
    retry: 3,
    retryDelay: 1500,
    skipErrorHandler: true,
    skipAuthToken: true
  }).catch(error => {
    console.error('获取分支机构VIP工作台数据失败:', error);
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
        referrer: {
          id: 0,
          nickname: '分支机构',
          phone: ''
        },
        dividendInfo: {
          totalAmount: '0.00',
          monthAmount: '0.00',
          pendingAmount: '0.00'
        },
        poolInfo: {
          vipCount: 0,
          rechargeCount: 0,
          juniorVipTeams: 0,
          middleVipTeams: 0,
          seniorVipTeams: 0,
          juniorRechargeTeams: 0,
          middleRechargeTeams: 0,
          seniorRechargeTeams: 0
        },
        teamInfo: {
          totalVipCount: 0,
          directVipCount: 0,
          monthDirectVipCount: 0,
          monthVipCount: 0,
          totalRechargeCount: 0,
          directRechargeCount: 0,
          monthRechargeCount: 0,
          monthDirectRechargeCount: 0,
          allTimeTeamRecharge: 0,
          currentMonthTeamRecharge: 0,
          directTeamRecharge: 0,
          currentMonthDirectRecharge: 0
        }
      }
    };
  });
}

/**
 * 获取分支机构VIP会员列表
 * @param {Object} params - 请求参数
 * @param {number} params.page - 页码
 * @param {string} params.search - 搜索关键词
 * @returns {Promise<Object>} 返回VIP会员列表数据
 */
export function getBranchVipUsers(params) {
  const timestamp = Date.now();
  const randomParam = Math.floor(Math.random() * 1000);
  
  return request({
    url: '/api/mobile/v1/vip/branch-users',
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
    skipErrorHandler: true,
    skipAuthToken: true
  }).catch(error => {
    console.error('获取分支机构VIP会员列表失败:', error);
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
 * 获取分支机构VIP团队数据
 * @param {Object} params - 请求参数
 * @param {string} params.month - 月份参数
 * @returns {Promise<Object>} 团队数据
 */
export function getBranchVipTeamData(params = {}) {
  const timestamp = Date.now();
  const randomParam = Math.floor(Math.random() * 1000);

  return request({
    url: 'branch-user/vip_team_data.php',
    method: 'get',
    params: {
      ...params,
      _t: timestamp,
      _r: randomParam
    },
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    timeout: 20000,
    retry: 3,
    retryDelay: 1000,
    skipErrorHandler: true,
    skipAuthToken: true
  }).catch(error => {
    console.error('获取分支机构VIP团队数据失败:', error);
    return {
      code: 0,
      data: {
        totalVipCount: 0,
        directVipCount: 0,
        monthDirectVipCount: 0,
        monthVipCount: 0,
        totalRechargeCount: 0,
        directRechargeCount: 0,
        monthRechargeCount: 0,
        monthDirectRechargeCount: 0,
        queryMonth: '本月',
        queryMonthValue: ''
      }
    };
  });
}

/**
 * 获取分支机构VIP团队成员列表
 * @param {Object} params - 请求参数
 * @param {string} params.type - 类型：all, direct, month
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @returns {Promise<Object>} 团队成员列表
 */
export function getBranchVipTeamMembers(params) {
  const timestamp = Date.now();
  const randomParam = Math.floor(Math.random() * 1000);

  return request({
    url: 'branch-user/vip_team_members.php',
    method: 'get',
    params: {
      ...params,
      _t: timestamp,
      _r: randomParam
    },
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    timeout: 15000,
    retry: 3,
    retryDelay: 1000,
    skipErrorHandler: true,
    skipAuthToken: true
  }).catch(error => {
    console.error('获取分支机构VIP团队成员失败:', error);
    return {
      code: 0,
      data: {
        members: [],
        total: 0,
        hasMore: false
      }
    };
  });
}

/**
 * 获取分支机构VIP分红历史
 * @param {Object} params - 请求参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @returns {Promise<Object>} 分红历史列表
 */
export function getBranchVipDividendHistory(params) {
  return request({
    url: 'branch-user/vip_dividend_history.php',
    method: 'get',
    params,
    skipAuthToken: true
  });
}

/**
 * 获取分支机构分红名单
 * @param {Object} params - 请求参数
 * @param {string} params.month - 月份，格式：YYYY-MM
 * @param {string} params.type - 分红类型：vip, recharge
 * @param {string} params.level - 分红等级：junior, middle, senior
 * @returns {Promise<Object>} 分红名单数据
 */
export function getBranchVipDividendList(params) {
  const userId = localStorage.getItem('user_id')
  const branchCode = localStorage.getItem('branch_code')
  
  return request({
    url: 'branch-user/dividend_list.php',
    method: 'get',
    params: {
      user_id: userId,
      branch_code: branchCode,
      ...params
    },
    skipAuthToken: true
  })
}

/**
 * 获取分支机构VIP招募排行
 * @param {Object} params - 请求参数
 * @param {string} params.period - 时间期间
 * @param {number} params.page - 页码
 * @returns {Promise<Object>} 招募排行数据
 */
export function getBranchVipRecruitRanking(params = {}) {
  const timestamp = Date.now();
  const randomParam = Math.floor(Math.random() * 1000);

  return request({
    url: 'branch-user/vip_recruit_ranking.php',
    method: 'get',
    params: {
      ...params,
      _t: timestamp,
      _r: randomParam
    },
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    timeout: 15000,
    retry: 3,
    retryDelay: 1000,
    skipErrorHandler: true,
    skipAuthToken: true
  }).catch(error => {
    console.error('获取分支机构VIP招募排行失败:', error);
    return {
      code: 0,
      data: {
        rankings: [],
        myRanking: null,
        period: params.period || 'current_month'
      }
    };
  });
}

/**
 * 获取分支机构VIP分红排行
 * @param {Object} params - 请求参数
 * @param {string} params.period - 时间期间
 * @param {number} params.page - 页码
 * @returns {Promise<Object>} 分红排行数据
 */
export function getBranchVipDividendRanking(params = {}) {
  return request({
    url: 'branch-user/vip_dividend_ranking.php',
    method: 'get',
    params,
    skipAuthToken: true
  });
}

/**
 * 获取分支机构VIP奖励列表
 * @param {Object} params - 请求参数
 * @param {number} params.page - 页码
 * @param {string} params.type - 奖励类型
 * @returns {Promise<Object>} 奖励列表
 */
export function getBranchVipRewardList(params) {
  return request({
    url: 'branch-user/vip_reward_list.php',
    method: 'get',
    params,
    skipAuthToken: true
  });
}

/**
 * 获取分支机构团队设备数据
 * @param {Object} params - 请求参数
 * @param {string} params.month - 月份
 * @param {number} params.page - 页码
 * @returns {Promise<Object>} 团队设备数据
 */
export function getBranchTeamDevices(params = {}) {
  const timestamp = Date.now();
  const randomParam = Math.floor(Math.random() * 1000);

  return request({
    url: 'branch-user/team_devices.php',
    method: 'get',
    params: {
      ...params,
      _t: timestamp,
      _r: randomParam
    },
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    timeout: 20000,
    retry: 3,
    retryDelay: 1000,
    skipErrorHandler: true,
    skipAuthToken: true
  }).catch(error => {
    console.error('获取分支机构团队设备数据失败:', error);
    return {
      code: 0,
      data: {
        devices: [],
        total: 0,
        stats: {
          totalDevices: 0,
          activeDevices: 0,
          monthlyRevenue: 0
        }
      }
    };
  });
}

/**
 * 获取分支机构VIP时间信息
 * @returns {Promise<Object>} VIP时间信息
 */
export function getBranchVipTimeInfo() {
  const timestamp = Date.now();
  const randomParam = Math.floor(Math.random() * 1000);
  
  // 获取用户ID和分支机构代码
  const userId = localStorage.getItem('user_id')
  const branchCode = localStorage.getItem('branch_code')

  return request({
    url: 'branch-user/vip_time_info.php',
    method: 'get',
    params: {
      user_id: userId,
      branch_code: branchCode,
      _t: timestamp,
      _r: randomParam
    },
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    timeout: 10000,
    retry: 3,
    retryDelay: 1000,
    skipErrorHandler: true,
    skipAuthToken: true
  }).catch(error => {
    console.error('获取分支机构VIP时间信息失败:', error);
    return {
      code: 0,
      data: {
        name: '尊贵会员',
        avatar: '/app/images/profile/default-avatar.png',
        referrer_id: 0,
        referrer_name: '分支机构',
        vip_at: null,
        expire_at: null
      }
    };
  });
}

/**
 * 获取分支机构VIP统计信息
 * @returns {Promise<Object>} VIP统计信息
 */
export function getBranchVipDividendStats() {
  return request({
    url: 'branch-user/vip_dividend_stats.php',
    method: 'get',
    skipAuthToken: true
  });
}

/**
 * 获取分支机构VIP用户详情
 * @param {string} userId - 用户ID
 * @param {string} branchCode - 分支机构代码
 * @returns {Promise<Object>} 用户详情
 */
export function getBranchVipUserDetail(userId, branchCode) {
  return request({
    url: 'branch-user/vip_user_detail.php',
    method: 'get',
    params: { 
      user_id: userId,
      branch_code: branchCode 
    },
    skipAuthToken: true
  });
}

/**
 * 获取分支机构VIP用户分红记录
 * @param {Object} params - 请求参数
 * @param {string} params.user_id - 用户ID
 * @param {string} params.branch_code - 分支机构代码
 * @param {number} params.page - 页码
 * @param {number} params.page_size - 每页数量
 * @returns {Promise<Object>} 用户分红记录
 */
export function getBranchVipUserDividends(params = {}) {
  return request({
    url: 'branch-user/vip_user_dividends.php',
    method: 'get',
    params,
    skipAuthToken: true
  });
}

/**
 * 获取分支机构VIP用户团队成员
 * @param {Object} params - 请求参数
 * @param {string} params.user_id - 用户ID
 * @param {string} params.branch_code - 分支机构代码
 * @param {number} params.page - 页码
 * @param {number} params.page_size - 每页数量
 * @returns {Promise<Object>} 用户团队成员
 */
export function getBranchVipUserTeam(params = {}) {
  return request({
    url: 'branch-user/vip_user_team.php',
    method: 'get',
    params,
    skipAuthToken: true
  });
}

/**
 * 获取分支机构奖励名单
 * @param {Object} params - 请求参数
 * @param {string} params.branch_code - 分支机构代码
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {string} params.level - 等级筛选
 * @param {string} params.type - 类型筛选
 * @param {string} params.period - 时间筛选
 * @param {string} params.sort - 排序方式
 * @returns {Promise<Object>} 奖励名单
 */
export function getBranchRewardList(params = {}) {
  return request({
    url: 'branch-user/reward_list.php',
    method: 'get',
    params,
    skipAuthToken: true
  });
}

/**
 * 获取分支机构团队详情（指定用户的团队信息）
 * @param {Object} params - 请求参数
 * @param {string} params.user_id - 用户ID
 * @param {string} params.branch_code - 分支机构代码
 * @returns {Promise<Object>} 团队详情
 */
export function getBranchTeamDetail(params = {}) {
  return request({
    url: 'branch-user/team_detail.php',
    method: 'get',
    params,
    skipAuthToken: true
  });
} 