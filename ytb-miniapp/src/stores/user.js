/**
 * 用户状态管理 (Pinia)
 * 从 H5 的 stores/user.js 迁移，适配小程序
 */
import { defineStore } from 'pinia'
import { miniappLogin, getUserInfo } from '../api/ytb'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: uni.getStorageSync('token') || '',
    userInfo: JSON.parse(uni.getStorageSync('userInfo') || 'null'),
    isLoggedIn: !!uni.getStorageSync('token'),
  }),

  getters: {
    nickname: (state) => state.userInfo?.nickname || '未命名',
    phone: (state) => state.userInfo?.phone || '',
    role: (state) => state.userInfo?.role || 'user',
    avatar: (state) => state.userInfo?.avatar || '',
    roleText: (state) => {
      const map = {
        user: '普通用户',
        normal: '普通用户',
        scp: '城市合伙人',
        team_cp: '团队合伙人',
        boss_cp: 'Boss合伙人',
      }
      return map[state.userInfo?.role] || '普通用户'
    },
    realName: (state) => state.userInfo?.real_name || '',
    needProfileComplete: (state) => {
      const u = state.userInfo
      if (!u) return false
      return !u.avatar || 
        !u.nickname || 
        u.nickname === '微信用户' || 
        (u.nickname && u.nickname.startsWith('用户')) ||
        !u.real_name
    },
  },

  actions: {
    // 小程序登录
    async wxLogin() {
      try {
        const loginRes = await new Promise((resolve, reject) => {
          uni.login({
            provider: 'weixin',
            success: resolve,
            fail: reject,
          })
        })

        const res = await miniappLogin(loginRes.code)
        if (res.code === 0 && res.data?.token) {
          this.setToken(res.data.token)
          if (res.data.user) {
            this.setUserInfo(res.data.user)
          }
          return true
        }
        return false
      } catch (e) {
        console.error('微信登录失败:', e)
        return false
      }
    },

    // 获取用户信息
    async fetchUserInfo() {
      try {
        const res = await getUserInfo()
        if (res.code === 0 && res.data) {
          this.setUserInfo(res.data)
        }
      } catch (e) {
        console.error('获取用户信息失败:', e)
      }
    },

    setToken(token) {
      this.token = token
      this.isLoggedIn = true
      uni.setStorageSync('token', token)
    },

    setUserInfo(info) {
      this.userInfo = info
      uni.setStorageSync('userInfo', JSON.stringify(info))
    },

    logout() {
      this.token = ''
      this.userInfo = null
      this.isLoggedIn = false
      uni.removeStorageSync('token')
      uni.removeStorageSync('userInfo')
      uni.reLaunch({ url: '/pages/login/index' })
    },
  },
})
