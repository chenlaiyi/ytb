<template>
  <div class="vip-list-container">
    <NavHeader title="VIP会员列表" />
    
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
    
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div v-for="user in userList" :key="user.id" class="user-item">
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
import { getVipUsers } from '@/api/vip';
import NavHeader from '@/components/NavHeader.vue';

export default {
  name: 'VipList',
  components: {
    NavHeader
  },
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

    const fetchUsers = async (isRefresh = false) => {
      try {
        if (isRefresh) {
          page.value = 1;
          userList.value = [];
        }
        
        loading.value = true;
        const response = await getVipUsers({
          page: page.value,
          search: searchQuery.value
        });
        
        if (response.data && response.code === 0) {
          if (isRefresh) {
            userList.value = response.data.users;
          } else {
            userList.value = [...userList.value, ...response.data.users];
          }
          
          // 更新统计数据 - 兼容处理两种后端返回格式
          const statsData = response.data.statistics || response.data.stats || {};
          if (statsData) {
            statistics.total = statsData.total || statsData.total_vip || 0;
            statistics.totalDividend = statsData.totalDividend || statsData.total_dividend || 0;
            statistics.pendingAmount = statsData.pendingAmount || statsData.pending_dividend || 0;
          }
          
          // 判断是否加载完所有数据
          if (response.data.users.length < 10) {
            finished.value = true;
          } else {
            page.value++;
          }
        } else {
          Toast({ type: 'fail', message: response.msg || '加载失败' });
          finished.value = true;
        }
      } catch (error) {
        console.error('加载VIP会员列表失败:', error);
        Toast({ type: 'fail', message: '网络错误，请稍后重试' });
        finished.value = true;
      } finally {
        loading.value = false;
        if (isRefresh) {
          refreshing.value = false;
        }
      }
    };

    const onLoad = () => {
      fetchUsers();
    };

    const onRefresh = () => {
      finished.value = false;
      fetchUsers(true);
    };

    const onSearch = () => {
      finished.value = false;
      fetchUsers(true);
    };

    const onClickLeft = () => {
      router.back();
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return '未知';
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    onMounted(() => {
      fetchUsers();
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
      formatDate
    };
  }
};
</script>

<style scoped>
.vip-list-container {
  padding-bottom: 50px;
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
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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