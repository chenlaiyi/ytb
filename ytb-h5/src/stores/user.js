import { defineStore } from 'pinia'
import { getUserInfo as fetchUserInfoAPI } from '@/api/user' // 导入获取用户信息的API函数，重命名以避免与 action 冲突

export const useUserStore = defineStore('user', {
  state: () => {
    // 检查VIP备份标记
    let storedUserInfo = {}
    try {
      storedUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    } catch (e) {
      console.error('解析用户信息失败:', e)
      storedUserInfo = {}
    }
    
    const vipBackup = localStorage.getItem('is_vip_backup')
    const salesmanBackup = localStorage.getItem('is_salesman_backup')
    // 生产环境关闭日志

    // 如果有VIP备份标记，立即强制设置VIP状态
    if (vipBackup === '1') {
      // 生产环境关闭日志
      storedUserInfo.is_vip = 1

      // 确保角色数组中包含VIP会员
      if (!storedUserInfo.roles) {
        storedUserInfo.roles = []
      }

      if (!storedUserInfo.roles.includes('VIP会员')) {
        storedUserInfo.roles.push('VIP会员')
        // 生产环境关闭日志
      }

      // 更新本地存储
      try {
        localStorage.setItem('userInfo', JSON.stringify(storedUserInfo))
      } catch (e) {
        console.error('更新用户信息失败:', e)
      }
    }

    // 如果有业务员备份标记，确保业务员状态正确
    if (salesmanBackup === '1') {
      // 生产环境关闭日志
      storedUserInfo.is_salesman = 1

      // 确保角色数组中包含业务员
      if (!storedUserInfo.roles) {
        storedUserInfo.roles = []
      }

      if (!storedUserInfo.roles.includes('业务员')) {
        storedUserInfo.roles.push('业务员')
        // 生产环境关闭日志
      }

      // 更新本地存储
      try {
        localStorage.setItem('userInfo', JSON.stringify(storedUserInfo))
      } catch (e) {
        console.error('更新用户信息失败:', e)
      }
    }

    // 增强登录状态验证，支持微信登录
    const token = localStorage.getItem('token') || ''
    const isLoggedInFlag = localStorage.getItem('isLoggedIn')
    const fromWechatLogin = localStorage.getItem('fromWechatLogin')
    
    // 放宽验证条件，支持微信登录场景
    const isLoggedIn = !!token && !!storedUserInfo && Object.keys(storedUserInfo).length > 0 || 
                      isLoggedInFlag === 'true' || 
                      fromWechatLogin === 'true'

    return {
      token: token,
      userInfo: storedUserInfo,
      isLoggedIn: isLoggedIn,
      // 模拟登录相关状态
      isSimulateMode: false,
      simulateToken: '',
      originalUserInfo: null
    }
  },

  getters: {
    // 获取用户ID
    userId: (state) => {
      return state.userInfo.id || state.userInfo.userId || null
    },
    // 获取用户姓名
    userName: (state) => {
      // 获取用户名 - 优先显示姓名
      // 生产环境关闭日志
      // 生产环境关闭日志

      // 优先使用姓名，其次是微信昵称，最后是普通昵称
      return state.userInfo.name || state.userInfo.wechat_nickname || state.userInfo.nickname || '未登录'
    },
    // 获取用户头像
    userAvatar: (state) => {
      // 获取用户头像 - 微信头像
      // 生产环境关闭日志

      // 优先使用微信头像，其次是普通头像，不返回默认头像路径
      return state.userInfo.wechat_avatar || state.userInfo.avatar || ''
    }
  },

  actions: {
    // 设置令牌
    setToken(token) {
      if (!token) {
        // 生产环境关闭日志
        return
      }

      // 生产环境关闭日志
      this.token = token
      localStorage.setItem('token', token)
      localStorage.setItem('isLoggedIn', 'true')
      this.isLoggedIn = true

      // 验证token是否正确保存
      const savedToken = localStorage.getItem('token')
      if (savedToken !== token) {
        // 生产环境关闭日志
      } else {
        // 生产环境关闭日志
      }
    },

    // 设置用户信息
    setUserInfo(userInfo) {
      // 生产环境关闭日志

      // 确保userInfo不为null
      if (!userInfo) {
        // 生产环境关闭日志
        return
      }

      this.isLoggedIn = true

      // 处理微信头像URL
      if (userInfo.wechat_avatar && !userInfo.wechat_avatar.startsWith('http')) {
        userInfo.wechat_avatar = 'https://pay.itapgo.com' + userInfo.wechat_avatar
      }

      // 确保用户ID一致
      if (userInfo.id && !userInfo.userId) {
        userInfo.userId = userInfo.id
      } else if (userInfo.userId && !userInfo.id) {
        userInfo.id = userInfo.userId
      }

      // 处理VIP状态
      let isVip = 0;

      // 明确记录VIP检查过程
      // 生产环境关闭日志

      // 判断VIP状态
      if (userInfo.is_vip === 1 || userInfo.is_vip === '1') {
        isVip = 1;
        // 生产环境关闭日志
      }

      // 设置角色默认值
      // 根据业务规则: 业务员默认为1，其他角色默认为0
      const safeUserInfo = {
        ...userInfo,
        // 业务员角色(is_salesman)默认为1 - 除非明确设置为0
        is_salesman: this.forceSalesmanRole(userInfo.is_salesman),

        // 统一设置VIP状态
        is_vip: isVip,

        // 确保其他字段都转为数字类型，默认为0
        is_pay_institution: this.normalizeRoleValue(userInfo.is_pay_institution),
        is_water_purifier_user: this.normalizeRoleValue(userInfo.is_water_purifier_user),
        is_engineer: this.normalizeRoleValue(userInfo.is_engineer),
        is_water_purifier_agent: this.normalizeRoleValue(userInfo.is_water_purifier_agent),
        is_pay_merchant: this.normalizeRoleValue(userInfo.is_pay_merchant),
        is_admin: this.normalizeRoleValue(userInfo.is_admin)
      }

      // 生产环境关闭日志

      this.userInfo = safeUserInfo
      localStorage.setItem('userInfo', JSON.stringify(safeUserInfo))
      localStorage.removeItem('fromWechatLogin')
    },

    // 辅助方法：将角色值归一化为数字（默认为0）
    normalizeRoleValue(value) {
      // 如果值等于1或"1"，返回1，否则返回0
      if (value === 1 || value === '1' || value === true) {
        return 1;
      }
      return 0;
    },

    // 辅助方法：处理业务员角色值（默认为1）
    forceSalesmanRole(value) {
      // 只有明确设置为0或"0"时才返回0，默认为1
      if (value === 0 || value === '0' || value === false) {
        return 0;
      }
      return 1;
    },

    // 强制刷新用户存储数据 - 从localStorage重新加载
    refreshUserData() {
      try {
        // 从localStorage重新读取token
        const token = localStorage.getItem('token') || ''
        
        // 从localStorage重新读取用户信息
        let storedUserInfo = {}
        try {
          storedUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
        } catch (e) {
          console.error('解析用户信息失败:', e)
          storedUserInfo = {}
        }
        
        // 读取登录状态标记
        const isLoggedInFlag = localStorage.getItem('isLoggedIn')
        const fromWechatLogin = localStorage.getItem('fromWechatLogin')
        
        // 更新store状态
        this.token = token
        this.userInfo = storedUserInfo
        
        // 计算登录状态
        const isLoggedIn = !!token && !!storedUserInfo && Object.keys(storedUserInfo).length > 0 || 
                          isLoggedInFlag === 'true' || 
                          fromWechatLogin === 'true'
        
        this.isLoggedIn = isLoggedIn
        
        console.log('用户存储数据已刷新:', {
          hasToken: !!this.token,
          hasUserInfo: !!this.userInfo && Object.keys(this.userInfo).length > 0,
          isLoggedIn: this.isLoggedIn,
          userId: this.userInfo.userId || this.userInfo.id || '无'
        })
        
        return true
      } catch (error) {
        console.error('刷新用户数据失败:', error)
        return false
      }
    },

    // 清除用户信息（登出）
    clearUserInfo() {
      this.token = ''
      this.userInfo = {}
      this.isLoggedIn = false

      // 清除所有登录相关的localStorage项
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('wechat_info')
      localStorage.removeItem('tempUserInfo')
      localStorage.removeItem('needBindPhone')
      localStorage.removeItem('login_time')
      localStorage.removeItem('is_vip_backup')
      localStorage.removeItem('is_salesman_backup')
      localStorage.removeItem('simulate_mode')
      localStorage.removeItem('simulate_token')
      localStorage.removeItem('simulate_user_info')
      localStorage.removeItem('login_redirect')
      localStorage.removeItem('h5_version_cache')
      localStorage.removeItem('branch_token')
      localStorage.removeItem('isBranch')
      localStorage.removeItem('branch_code')

      // 清除所有登录相关的sessionStorage项
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('userInfo')
      sessionStorage.removeItem('isLoggedIn')
      sessionStorage.removeItem('simulate_mode')
      sessionStorage.removeItem('simulate_token')
      sessionStorage.removeItem('simulate_user_info')

      // 清除认证相关的cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      })

      // 清除全局认证变量
      if (window.TAPGO_AUTH) {
        delete window.TAPGO_AUTH
      }
      window.TAPGO_TOKEN = null
      window.TAPGO_USER_INFO = null
      window.TAPGO_LOGIN_TIME = null

      // 生产环境关闭日志
    },

    // 设置模拟登录状态
    setSimulateMode(simulateToken, simulateUserInfo) {
      // 保存原始用户信息
      if (!this.isSimulateMode) {
        this.originalUserInfo = { ...this.userInfo }
      }
      
      this.isSimulateMode = true
      this.simulateToken = simulateToken
      this.isLoggedIn = true
      
      // 在模拟登录模式下，只在内存中设置用户信息，不覆盖localStorage
      // 确保simulateUserInfo不为null
      if (!simulateUserInfo) {
        console.error('模拟用户信息为空')
        return
      }

      // 处理微信头像URL
      if (simulateUserInfo.wechat_avatar && !simulateUserInfo.wechat_avatar.startsWith('http')) {
        simulateUserInfo.wechat_avatar = 'https://pay.itapgo.com' + simulateUserInfo.wechat_avatar
      }

      // 确保用户ID一致
      if (simulateUserInfo.id && !simulateUserInfo.userId) {
        simulateUserInfo.userId = simulateUserInfo.id
      } else if (simulateUserInfo.userId && !simulateUserInfo.id) {
        simulateUserInfo.id = simulateUserInfo.userId
      }

      // 处理VIP状态
      let isVip = 0;
      if (simulateUserInfo.is_vip === 1 || simulateUserInfo.is_vip === '1') {
        isVip = 1;
      }

      // 设置角色默认值
      const safeUserInfo = {
        ...simulateUserInfo,
        is_salesman: this.forceSalesmanRole(simulateUserInfo.is_salesman),
        is_vip: isVip,
        is_pay_institution: this.normalizeRoleValue(simulateUserInfo.is_pay_institution),
        is_water_purifier_user: this.normalizeRoleValue(simulateUserInfo.is_water_purifier_user),
        is_engineer: this.normalizeRoleValue(simulateUserInfo.is_engineer),
        is_water_purifier_agent: this.normalizeRoleValue(simulateUserInfo.is_water_purifier_agent),
        is_pay_merchant: this.normalizeRoleValue(simulateUserInfo.is_pay_merchant),
        is_admin: this.normalizeRoleValue(simulateUserInfo.is_admin)
      }

      // 只在内存中设置模拟用户信息，不覆盖localStorage
      this.userInfo = safeUserInfo
      
      // 在sessionStorage中标记模拟模式
      sessionStorage.setItem('simulate_mode', 'true')
      sessionStorage.setItem('simulate_token', simulateToken)
      sessionStorage.setItem('simulate_user_info', JSON.stringify(safeUserInfo))
      
      console.log('已进入模拟登录模式:', safeUserInfo.name || safeUserInfo.phone)
    },

    // 退出模拟登录模式
    exitSimulateMode() {
      if (this.isSimulateMode && this.originalUserInfo) {
        // 恢复原始用户信息
        this.userInfo = { ...this.originalUserInfo }
        localStorage.setItem('userInfo', JSON.stringify(this.originalUserInfo))
      }
      
      this.isSimulateMode = false
      this.simulateToken = ''
      this.originalUserInfo = null
      
      // 清除sessionStorage中的模拟模式标记
      sessionStorage.removeItem('simulate_mode')
      sessionStorage.removeItem('simulate_token')
      sessionStorage.removeItem('simulate_user_info')
      
      console.log('已退出模拟登录模式')
    },

    // 检查是否处于模拟登录模式
    checkSimulateMode() {
      const simulateMode = sessionStorage.getItem('simulate_mode')
      const simulateToken = sessionStorage.getItem('simulate_token')
      const simulateUserInfo = sessionStorage.getItem('simulate_user_info')
      
      if (simulateMode === 'true' && simulateToken && simulateUserInfo) {
        this.isSimulateMode = true
        this.simulateToken = simulateToken
        this.isLoggedIn = true
        
        try {
          // 恢复模拟用户信息
          const userInfo = JSON.parse(simulateUserInfo)
          this.userInfo = userInfo
          console.log('恢复模拟登录模式:', userInfo.name || userInfo.phone)
        } catch (error) {
          console.error('解析模拟用户信息失败:', error)
          // 清除无效的模拟登录状态
          this.exitSimulateMode()
          return false
        }
        
        return true
      }
      
      return false
    },

    // 设置临时用户信息（用于绑定手机号页面）
    setTempUserInfo(tempUserInfo) {
      // 生产环境关闭日志

      // 确保tempUserInfo不为null
      if (!tempUserInfo) {
        // 生产环境关闭日志
        return
      }

      // 处理微信头像URL
      if (tempUserInfo.wechat_avatar && !tempUserInfo.wechat_avatar.startsWith('http')) {
        tempUserInfo.wechat_avatar = 'https://pay.itapgo.com' + tempUserInfo.wechat_avatar
      }

      // 存储临时用户信息，但不覆盖主用户信息
      localStorage.setItem('tempUserInfo', JSON.stringify(tempUserInfo))
    },

    // 更新用户VIP状态
    updateUserVip(isVip = true) {
      // 生产环境关闭日志

      // 修改用户VIP状态
      this.userInfo.is_vip = isVip ? 1 : 0

      // 确保角色数组存在
      if (!this.userInfo.roles) {
        this.userInfo.roles = []
      }

      // 强制刷新是否有效的标志，确保用户中心能够显示VIP角色
      if (isVip) {
        // 先移除可能存在的VIP会员角色，避免重复
        this.userInfo.roles = this.userInfo.roles.filter(role => role !== 'VIP会员')

        // 添加VIP会员角色
        this.userInfo.roles.push('VIP会员')
        // 生产环境关闭日志
      } else {
        // 如果不是VIP，移除VIP会员角色
        this.userInfo.roles = this.userInfo.roles.filter(role => role !== 'VIP会员')
        // 生产环境关闭日志
      }

      // 确保本地存储中的userInfo被正确更新
      // 生产环境关闭日志
      localStorage.setItem('userInfo', JSON.stringify(this.userInfo))

      // 为了确保VIP状态在页面刷新后仍然存在，添加一个备份标记
      localStorage.setItem('is_vip_backup', isVip ? '1' : '0')
      // 生产环境关闭日志
    },

    // 更新用户业务员状态
    updateUserSalesman(isSalesman = true) {
      // 生产环境关闭日志

      // 修改用户业务员状态
      this.userInfo.is_salesman = isSalesman ? 1 : 0

      // 确保角色数组存在
      if (!this.userInfo.roles) {
        this.userInfo.roles = []
      }

      // 更新角色列表
      if (isSalesman) {
        // 先移除可能存在的业务员角色，避免重复
        this.userInfo.roles = this.userInfo.roles.filter(role => role !== '业务员')

        // 添加业务员角色
        this.userInfo.roles.push('业务员')
        // 生产环境关闭日志
      } else {
        // 如果不是业务员，移除业务员角色
        this.userInfo.roles = this.userInfo.roles.filter(role => role !== '业务员')
        // 生产环境关闭日志
      }

      // 更新本地存储
      localStorage.setItem('userInfo', JSON.stringify(this.userInfo))

      // 为了确保业务员状态在页面刷新后仍然存在，添加一个备份标记
      localStorage.setItem('is_salesman_backup', isSalesman ? '1' : '0')
      // 生产环境关闭日志
    },

    // 新增：从 API 获取并更新当前用户信息
    async fetchUserInfo(options = {}) {
      // 解析选项
      const { forceRefresh = false, retryCount = 0 } = options;
      const maxRetries = 3;

      // 只有在登录状态下才获取用户信息
      if (!this.isLoggedIn || !this.token) {
        // 生产环境关闭日志
        return Promise.reject('User not logged in'); // 返回拒绝状态
      }

      try {
        // 生产环境关闭日志

        // 添加时间戳参数防止缓存，强制刷新时使用
        const timestamp = forceRefresh ? `?t=${Date.now()}` : '';
        const res = await fetchUserInfoAPI(timestamp); // 调用 API

        // 生产环境关闭日志

        if (res && res.code === 0 && res.data) {
          // 生产环境关闭日志

          // 检查VIP状态是否有变化
          const oldVipStatus = this.userInfo?.is_vip;
          this.setUserInfo(res.data); // 使用 setUserInfo 更新 store

          // 生产环境关闭日志

          // 检查VIP状态是否仍然不匹配，且需要强制刷新
          if (forceRefresh && this.userInfo?.is_vip !== 1 && localStorage.getItem('vip_upgrade_success') === 'true') {
            // 计算升级时间是否在24小时内
            const upgradeTime = parseInt(localStorage.getItem('vip_upgrade_time') || '0');
            const now = Date.now();
            const hoursSinceUpgrade = (now - upgradeTime) / (1000 * 60 * 60);

            if (hoursSinceUpgrade < 24) {
              // 生产环境关闭日志
              this.updateUserVip(true);
            }
          }

          return Promise.resolve(this.userInfo); // 返回更新后的用户信息
        } else {
          // 生产环境关闭日志

          // 如果需要重试
          if (retryCount < maxRetries) {
            // 生产环境关闭日志
            return new Promise((resolve, reject) => {
              setTimeout(() => {
                this.fetchUserInfo({ forceRefresh, retryCount: retryCount + 1 })
                  .then(resolve)
                  .catch(reject);
              }, 1000);
            });
          }

          return Promise.reject(res?.message || 'Failed to fetch user info');
        }
      } catch (error) {
        // 生产环境关闭日志

        // 如果需要重试
        if (retryCount < maxRetries) {
          // 生产环境关闭日志
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              this.fetchUserInfo({ forceRefresh, retryCount: retryCount + 1 })
                .then(resolve)
                .catch(reject);
            }, 1000);
          });
        }

        return Promise.reject(error);
      }
    }
  }
})
