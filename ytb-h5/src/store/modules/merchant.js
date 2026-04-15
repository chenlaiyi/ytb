// 商户状态管理模块
import { getMerchantWorkspace, getMerchantTradeList } from '@/api/merchant';
import { Toast } from 'vant';

const state = {
  currentMerchant: null,
  workspaceData: null,
  tradeList: [],
  tradeTotal: 0,
  tradeSummary: null,
  loading: false
};

const mutations = {
  // 设置当前选择的商户
  setCurrentMerchant(state, merchant) {
    state.currentMerchant = merchant;
    // 保存到localStorage以便刷新后恢复
    if (merchant) {
      localStorage.setItem('currentMerchant', JSON.stringify(merchant));
    } else {
      localStorage.removeItem('currentMerchant');
    }
  },
  
  // 设置工作台数据
  setWorkspaceData(state, data) {
    state.workspaceData = data;
  },
  
  // 设置交易列表数据
  setTradeList(state, { items, total, summary }) {
    state.tradeList = items;
    state.tradeTotal = total;
    state.tradeSummary = summary;
  },
  
  // 设置加载状态
  setLoading(state, status) {
    state.loading = status;
  }
};

const actions = {
  // 初始化状态，恢复选择的商户
  initMerchantState({ commit }) {
    // 恢复当前选择的商户
    const savedMerchant = localStorage.getItem('currentMerchant');
    if (savedMerchant) {
      try {
        const merchantData = JSON.parse(savedMerchant);
        commit('setCurrentMerchant', merchantData);
      } catch (e) {
        console.error('恢复商户数据失败', e);
        localStorage.removeItem('currentMerchant');
      }
    }
  },
  
  // 获取商户工作台数据
  async fetchWorkspaceData({ commit, state }) {
    if (!state.currentMerchant) {
      return Promise.reject(new Error('未选择商户'));
    }
    
    commit('setLoading', true);
    
    try {
      const res = await getMerchantWorkspace();
      
      if (res.code === 0 && res.data) {
        commit('setWorkspaceData', res.data);
        return res.data;
      } else {
        Toast(res.message || '获取商户工作台数据失败');
        return null;
      }
    } catch (error) {
      console.error('获取商户工作台数据失败', error);
      Toast('获取商户工作台数据失败');
      return null;
    } finally {
      commit('setLoading', false);
    }
  },
  
  // 获取商户交易列表
  async fetchTradeList({ commit, state }, params = {}) {
    if (!state.currentMerchant && !params.merchant_id) {
      return Promise.reject(new Error('未选择商户'));
    }
    
    commit('setLoading', true);
    
    // 如果没有传入merchant_id，则使用当前选择的商户
    if (!params.merchant_id && state.currentMerchant) {
      params.merchant_id = state.currentMerchant.merchant_id;
    }
    
    try {
      const res = await getMerchantTradeList(params);
      
      if (res.code === 0 && res.data) {
        commit('setTradeList', {
          items: res.data.items || [],
          total: res.data.total || 0,
          summary: res.data.summary || null
        });
        return res.data;
      } else {
        Toast(res.message || '获取交易记录失败');
        return null;
      }
    } catch (error) {
      console.error('获取交易记录失败', error);
      Toast('获取交易记录失败');
      return null;
    } finally {
      commit('setLoading', false);
    }
  },
  
  // 切换商户
  switchMerchant({ commit, dispatch }, merchant) {
    commit('setCurrentMerchant', merchant);
    dispatch('fetchWorkspaceData');
  },
  
  // 清除商户数据
  clearMerchantData({ commit }) {
    commit('setCurrentMerchant', null);
    commit('setWorkspaceData', null);
    commit('setTradeList', { items: [], total: 0, summary: null });
  }
};

const getters = {
  // 获取当前商户
  currentMerchant: state => state.currentMerchant,
  
  // 商户是否激活
  isMerchantActive: state => state.currentMerchant && state.currentMerchant.status === 'active',
  
  // 获取商户工作台数据
  workspaceData: state => state.workspaceData || {},
  
  // 获取商户交易列表
  tradeList: state => state.tradeList || [],
  
  // 获取商户交易总数
  tradeTotal: state => state.tradeTotal || 0,
  
  // 获取交易汇总数据
  tradeSummary: state => state.tradeSummary || {},
  
  // 获取加载状态
  loading: state => state.loading
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}; 