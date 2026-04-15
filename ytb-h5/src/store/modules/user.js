// 添加商户状态管理

// 在state中添加
state: {
  // ... 其他 state
  currentMerchant: null,
},

// 在mutations中添加
mutations: {
  // ... 其他 mutations
  setCurrentMerchant(state, merchant) {
    state.currentMerchant = merchant;
    // 保存到localStorage以便刷新后恢复
    if (merchant) {
      localStorage.setItem('currentMerchant', JSON.stringify(merchant));
    } else {
      localStorage.removeItem('currentMerchant');
    }
  },
},

// 在actions中添加
actions: {
  // ... 其他 actions
  
  // 在初始化用户信息的action中添加恢复商户信息的逻辑
  async getUserInfo({ commit, dispatch }) {
    // ... 原有代码
    
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
    
    // ... 原有代码返回结果
  },
} 