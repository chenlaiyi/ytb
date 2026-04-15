import { defineStore } from 'pinia'
import request from '@/utils/request'
import { showToast } from 'vant'
import router from '@/router'
import { useUserStore } from '@/stores/user'

export const useMerchantStore = defineStore('merchant', {
  state: () => ({
    currentMerchant: null,
    workspaceData: null,
    tradeList: [],
    tradeTotal: 0,
    tradeSummary: null,
    loading: false,
    availableMerchants: [],
    pointsData: null
  }),
  
  getters: {
    // 获取当前商户
    getCurrentMerchant: (state) => state.currentMerchant,
    
    // 商户是否激活
    isMerchantActive: (state) => state.currentMerchant && state.currentMerchant.status === 'active',
    
    // 获取商户工作台数据
    getWorkspaceData: (state) => state.workspaceData || {},
    
    // 获取商户交易列表
    getTradeList: (state) => state.tradeList || [],
    
    // 获取商户交易总数
    getTradeTotal: (state) => state.tradeTotal || 0,
    
    // 获取交易汇总数据
    getTradeSummary: (state) => state.tradeSummary || {},
    
    // 获取加载状态
    isLoading: (state) => state.loading,
    
    // 获取可用商户列表
    getAvailableMerchants: (state) => state.availableMerchants || [],
    getPointsData: (state) => state.pointsData || { total: 0, earned: 0, spent: 0, history: [] },
    
    // 获取今日收款
    getTodayIncome: (state) => {
      if (state.workspaceData && state.workspaceData.incomeData) {
        return state.workspaceData.incomeData.todayIncome || '0.00'
      }
      return '0.00'
    },
    
    // 获取本月收款
    getMonthIncome: (state) => {
      if (state.workspaceData && state.workspaceData.incomeData) {
        return state.workspaceData.incomeData.monthIncome || '0.00'
      }
      return '0.00'
    },
    
    // 获取总收款额
    getTotalReceived: (state) => {
      if (state.workspaceData && state.workspaceData.incomeData) {
        return state.workspaceData.incomeData.totalReceived || '0.00'
      }
      return '0.00'
    }
  },
  
  actions: {
    handleAuthFailure(message = '登录已过期，请重新登录') {
      const userStore = useUserStore()

      if (typeof userStore?.token !== 'undefined') {
        userStore.token = ''
      }
      if (typeof userStore?.userInfo !== 'undefined') {
        userStore.userInfo = {}
      }
      if (typeof userStore?.isLoggedIn !== 'undefined') {
        userStore.isLoggedIn = false
      }
      if (typeof userStore?.simulateToken !== 'undefined') {
        userStore.simulateToken = ''
      }
      if (typeof userStore?.isSimulateMode !== 'undefined') {
        userStore.isSimulateMode = false
      }

      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      sessionStorage.removeItem('userInfo')
      localStorage.removeItem('isLoggedIn')
      sessionStorage.removeItem('isLoggedIn')

      this.currentMerchant = null
      this.workspaceData = null
      this.availableMerchants = []
      this.pointsData = null

      const currentRoute = router.currentRoute?.value
      const redirect = currentRoute?.fullPath && currentRoute.path !== '/login'
        ? currentRoute.fullPath
        : '/merchant'

      if (currentRoute?.path !== '/login') {
        router.replace({
          path: '/login',
          query: { redirect }
        }).catch(() => {})
      }

      showToast(message)
    },

    // 设置当前选择的商户
    setCurrentMerchant(merchant) {
      this.currentMerchant = merchant
      // 保存到localStorage以便刷新后恢复
      if (merchant) {
        localStorage.setItem('currentMerchant', JSON.stringify(merchant))
      } else {
        localStorage.removeItem('currentMerchant')
      }
    },
    
    // 设置可用商户列表
    setAvailableMerchants(merchants) {
      this.availableMerchants = merchants || []
    },
    
    // 设置工作台数据
    setWorkspaceData(data) {
      this.workspaceData = data
      this.pointsData = data?.points || { total: 0, earned: 0, spent: 0, history: [] }
    },
    
    // 设置交易列表数据
    setTradeList(data) {
      this.tradeList = data.items || []
      this.tradeTotal = data.total || 0
      this.tradeSummary = data.summary || null
    },
    
    // 设置加载状态
    setLoading(status) {
      this.loading = status
    },
    
    // 获取商户工作台数据
    async fetchWorkspaceData(params = {}) {
      const query = { ...params }

      if (!query.merchant_id && this.currentMerchant) {
        query.merchant_id = this.currentMerchant.merchant_id
      }

      this.loading = true

      try {
        const res = await request.get('/api/mobile/v1/business/merchant/workspace', {
          params: query
        })

        if (res.code === 0 && res.data) {
          this.workspaceData = res.data

          if (Array.isArray(res.data.merchants)) {
            this.availableMerchants = res.data.merchants
          } else {
            this.availableMerchants = []
          }

          if (res.data.currentMerchant) {
            this.setCurrentMerchant(res.data.currentMerchant)
          } else if (!this.currentMerchant && this.availableMerchants.length > 0) {
            this.setCurrentMerchant(this.availableMerchants[0])
          }

          this.pointsData = res.data.points || { total: 0, earned: 0, spent: 0, history: [] }

          return res.data
        }

        if (res.code === 1002) {
          this.handleAuthFailure(res.message || '登录已过期，请重新登录')
          return null
        }

        showToast(res.message || '获取商户工作台数据失败')
        return null
      } catch (error) {
        if (import.meta.env?.MODE !== 'production') {
          console.error('获取商户工作台数据失败', error)
        }
        if (error?.response?.status === 401) {
          this.handleAuthFailure('登录已过期，请重新登录')
          return null
        }
        showToast('获取商户工作台数据失败')
        return null
      } finally {
        this.loading = false
      }
    },
    
    // 获取商户交易列表
    async fetchTradeList(params = {}) {
      if (!this.currentMerchant && !params.merchant_id) {
        return Promise.reject(new Error('未选择商户'))
      }
      
      this.loading = true
      
      // 如果没有传入merchant_id，则使用当前选择的商户
      if (!params.merchant_id && this.currentMerchant) {
        params.merchant_id = this.currentMerchant.merchant_id
      }
      
      try {
        const res = await request.get('/api/mobile/v1/business/merchant/transactions', { params })
        
        if (res.code === 0 && res.data) {
          this.tradeList = res.data.items || []
          this.tradeTotal = res.data.total || 0
          this.tradeSummary = res.data.summary || null
          return res.data
        } else {
          showToast(res.message || '获取交易记录失败')
          return null
        }
      } catch (error) {
        // 生产环境关闭日志
        showToast('获取交易记录失败')
        return null
      } finally {
        this.loading = false
      }
    },
    
    // 获取交易详情
    async fetchTradeDetail(tradeNo) {
      if (!tradeNo) return null
      
      try {
        const res = await request.get(`/api/mobile/v1/business/merchant/transactions/${tradeNo}`)

        if (res.code === 0) {
          return res.data
        }

        return null
      } catch (error) {
        if (import.meta.env?.MODE !== 'production') {
          console.error('获取交易详情失败', error)
        }
        return null
      }
    },
    
    // 切换商户
    async switchMerchant(merchant) {
      this.setCurrentMerchant(merchant)
      if (!merchant) {
        this.workspaceData = null
        this.tradeList = []
        this.tradeTotal = 0
        this.tradeSummary = null
        return null
      }
      return await this.fetchWorkspaceData({ merchant_id: merchant.merchant_id })
    },
    
    // 清除商户数据
    clearMerchantData() {
      this.currentMerchant = null
      this.workspaceData = null
      this.tradeList = []
      this.tradeTotal = 0
      this.tradeSummary = null
      this.pointsData = null
      localStorage.removeItem('currentMerchant')
    },
    
    // 初始化商户数据（从localStorage恢复）
    initMerchantData() {
      const storedMerchant = localStorage.getItem('currentMerchant')
      
      if (storedMerchant) {
        try {
          const merchant = JSON.parse(storedMerchant)
          this.setCurrentMerchant(merchant)
        } catch (e) {
          // 生产环境关闭日志
          localStorage.removeItem('currentMerchant')
        }
      }
    }
  }
}) 
