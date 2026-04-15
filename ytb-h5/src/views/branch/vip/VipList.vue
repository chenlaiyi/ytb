<template>
  <div class="vip-list-container">
    <van-nav-bar title="VIP会员列表" left-arrow @click-left="onClickLeft" />
    
    <van-search
      v-model="searchQuery"
      placeholder="搜索会员姓名或手机号"
      @search="onSearch"
    />
    
    <div class="stats-panel">
      <div class="stat-item">
        <span class="label">VIP总人数</span>
        <span class="value">{{ statistics.total || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="label">已分红金额</span>
        <span class="value">¥{{ statistics.totalDividend || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="label">待结算金额</span>
        <span class="value">¥{{ statistics.pendingAmount || 0 }}</span>
      </div>
    </div>
    
    <van-pull-refresh v-model:loading="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div v-for="user in userList" :key="user.id" class="user-item" @click="goToUserDetail(user.id)">
          <div class="user-avatar">
            <van-image
              round
              width="50"
              height="50"
              :src="user.avatar || require('@/assets/images/default-avatar.png')"
            />
          </div>
          <div class="user-info">
            <div class="user-name">{{ user.name }}</div>
            <div class="user-mobile">{{ user.mobile }}</div>
            <div class="user-date">加入时间: {{ formatDate(user.vip_at) }}</div>
          </div>
          <div class="user-balance">
            <div class="balance-value">¥{{ user.balance }}</div>
            <div class="balance-label">余额</div>
          </div>
          <van-icon name="arrow" size="16" color="#999" />
        </div>
      </van-list>
    </van-pull-refresh>
    
    <van-empty v-if="userList.length === 0 && !loading" description="暂无VIP会员" />
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Toast } from 'vant';
import { getBranchVipUsers } from '@/api/branchVip';

export default {
  name: 'BranchVipList',
  setup() {
    const router = useRouter();
    const userList = ref([]);
    const page = ref(1);
    const loading = ref(false);
    const finished = ref(false);
    const refreshing = ref(false);
    const searchQuery = ref('');
    const statistics = reactive({
      total: 0,
      totalDividend: 0,
      pendingAmount: 0
    });

    // 获取分支机构信息
    const getBranchInfo = () => {
      // 优先从localStorage获取分支机构代码和ID
      const branchCode = localStorage.getItem('branch_code');
      const branchId = localStorage.getItem('branch_id');
      
      if (branchCode) {
        return {
          branch_code: branchCode,
          branch_id: branchId || 2
        };
      }
      
      // 尝试从branch_userInfo获取
      const branchUserInfo = localStorage.getItem('branch_userInfo');
      if (branchUserInfo) {
        try {
          const userInfo = JSON.parse(branchUserInfo);
          if (userInfo.branch_code || userInfo.code) {
            return {
              branch_code: userInfo.branch_code || userInfo.code,
              branch_id: userInfo.branch_id || userInfo.id || 2
            };
          }
        } catch (error) {
          console.error('Parse branch_userInfo error:', error);
        }
      }
      
      // 尝试从userInfo获取
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        try {
          const parsed = JSON.parse(userInfo);
          if (parsed.branch_code || parsed.code) {
            return {
              branch_code: parsed.branch_code || parsed.code,
              branch_id: parsed.branch_id || parsed.id || 2
            };
          }
        } catch (error) {
          console.error('Parse userInfo error:', error);
        }
      }
      
      // 默认值
      return {
        branch_code: 'YXY01',
        branch_id: 2
      };
    };

    const fetchUsers = async (isRefresh = false) => {
      try {
        const branchInfo = getBranchInfo();
        
        if (!branchInfo || !branchInfo.branch_code) {
          Toast({ type: 'fail', message: '获取分支机构信息失败，请重新登录' });
          return;
        }

        if (isRefresh) {
          page.value = 1;
          userList.value = [];
        }
        
        loading.value = true;
        
        const response = await getBranchVipUsers({
          branch_code: branchInfo.branch_code,
          page: page.value,
          search: searchQuery.value
        });
        
        if (response.code === 0 && response.data) {
          const newUsers = response.data.users || [];
          
          if (isRefresh) {
            userList.value = newUsers;
          } else {
            userList.value.push(...newUsers);
          }
          
          // 更新统计信息
          if (response.data.statistics) {
            Object.assign(statistics, response.data.statistics);
          }
          
          // 检查是否还有更多数据
          finished.value = newUsers.length < 10;
          
          if (!isRefresh) {
            page.value++;
          }
        } else {
          Toast({ type: 'fail', message: response.message || '获取VIP会员列表失败' });
          finished.value = true;
        }
      } catch (error) {
        console.error('获取VIP会员列表失败:', error);
        Toast({ type: 'fail', message: '网络错误，请稍后重试' });
        finished.value = true;
      } finally {
        loading.value = false;
        refreshing.value = false;
      }
    };

    const onLoad = () => {
      if (!finished.value) {
        fetchUsers();
      }
    };

    const onRefresh = () => {
      finished.value = false;
      fetchUsers(true);
    };

    const onSearch = () => {
      finished.value = false;
      page.value = 1;
      fetchUsers(true);
    };

    const onClickLeft = () => {
      router.back();
    };

    const goToUserDetail = (userId) => {
      router.push(`/branch/vip/detail/${userId}`);
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN');
    };

    onMounted(() => {
      fetchUsers(true);
    });

    return {
      userList,
      loading,
      finished,
      refreshing,
      searchQuery,
      statistics,
      onLoad,
      onRefresh,
      onSearch,
      onClickLeft,
      goToUserDetail,
      formatDate
    };
  }
};
</script>

<style scoped>
.vip-list-container {
  padding-bottom: 50px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.stats-panel {
  display: flex;
  justify-content: space-between;
  padding: 15px;
  background-color: #fff;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-item .label {
  font-size: 12px;
  color: #999;
}

.stat-item .value {
  font-size: 16px;
  color: #333;
  font-weight: bold;
  margin-top: 5px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #fff;
  margin-bottom: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
}

.user-item:active {
  background-color: #f9f9f9;
  transform: scale(0.98);
}

.user-avatar {
  margin-right: 15px;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.user-mobile {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.user-date {
  font-size: 12px;
  color: #999;
}

.user-balance {
  text-align: right;
  margin-right: 10px;
}

.balance-value {
  font-size: 18px;
  font-weight: bold;
  color: #f56c6c;
}

.balance-label {
  font-size: 12px;
  color: #999;
}
</style> 