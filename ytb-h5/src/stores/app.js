import { defineStore } from 'pinia'

// 简化状态管理，避免复杂的引用
export const useAppStore = defineStore('app', {
  state: () => ({
    tabActive: 0,
    loading: false,
    title: '点点够App',
    navData: {
      show: true,
      items: []
    }
  }),

  getters: {
    // 添加一些getters便于访问状态
    getTitle: (state) => state.title,
    getTabActive: (state) => state.tabActive,
    isLoading: (state) => state.loading,
    navVisible: (state) => state.navData.show
  },

  actions: {
    // 设置标签页索引
    setTabActive(index) {
      this.tabActive = index
    },
    
    // 设置加载状态
    setLoading(status) {
      this.loading = status
    },
    
    // 设置页面标题
    setTitle(title) {
      this.title = title
      // 同步更新文档标题
      document.title = title
    },
    
    // 设置导航栏显示状态
    setNavShow(show) {
      this.navData.show = show
    },
    
    // 设置导航项
    setNavItems(items) {
      this.navData.items = items
    }
  }
}) 