<template>
  <div class="vip-detail-container">
    <NavHeader title="VIP会员详情" />
    
    <div class="content" v-if="userDetail">
      <!-- 会员信息卡片 -->
      <div class="user-card">
        <div class="user-header">
          <div class="avatar-wrapper">
            <van-image
              round
              width="80"
              height="80"
              :src="userDetail.avatar || require('@/assets/images/default-avatar.png')"
            />
            <div class="vip-badge">VIP</div>
          </div>
          <div class="user-info">
            <div class="user-name">{{ userDetail.name }}</div>
            <div class="user-mobile">{{ userDetail.mobile }}</div>
            <div class="user-date">加入时间: {{ formatDate(userDetail.vip_at) }}</div>
            <div class="user-id">会员ID: {{ userDetail.id }}</div>
          </div>
        </div>
      </div>
      
      <!-- 账户信息卡片 -->
      <div class="info-card">
        <div class="card-title">账户信息</div>
        <div class="info-row">
          <span class="label">账户余额</span>
          <span class="value amount">¥{{ userDetail.balance || '0.00' }}</span>
        </div>
        <div class="info-row">
          <span class="label">累计分红</span>
          <span class="value amount">¥{{ userDetail.total_dividend || '0.00' }}</span>
        </div>
        <div class="info-row" v-if="userDetail.referrer_name">
          <span class="label">推荐人</span>
          <span class="value">{{ userDetail.referrer_name }}</span>
        </div>
        <div class="info-row">
          <span class="label">直推人数</span>
          <span class="value">{{ userDetail.direct_count || 0 }}人</span>
        </div>
        <div class="info-row">
          <span class="label">团队人数</span>
          <span class="value">{{ userDetail.team_count || 0 }}人</span>
        </div>
      </div>
      
      <!-- 分红记录卡片 -->
      <div class="dividend-card">
        <div class="card-title">
          <span>分红记录</span>
          <div v-if="dividendList.length > 0" class="view-more" @click="viewAllDividends">
            <span>查看全部</span>
            <van-icon name="arrow" />
          </div>
        </div>
        
        <div class="dividend-list" v-if="dividendList.length > 0">
          <div class="dividend-item" v-for="item in dividendList" :key="item.id">
            <div class="dividend-info">
              <div class="dividend-type">{{ item.type_name }}</div>
              <div class="dividend-date">{{ formatDate(item.created_at) }}</div>
            </div>
            <div class="dividend-amount">+{{ item.amount }}</div>
          </div>
        </div>
        
        <van-empty v-else description="暂无分红记录" />
      </div>
      
      <!-- 团队成员卡片 -->
      <div class="team-card">
        <div class="card-title">
          <span>团队成员</span>
          <div v-if="teamMembers.length > 0" class="view-more" @click="viewAllTeamMembers">
            <span>查看全部</span>
            <van-icon name="arrow" />
          </div>
        </div>
        
        <div class="team-list" v-if="teamMembers.length > 0">
          <div class="team-item" v-for="member in teamMembers" :key="member.id">
            <div class="member-avatar">
              <van-image
                round
                width="40"
                height="40"
                :src="member.avatar || require('@/assets/images/default-avatar.png')"
              />
            </div>
            <div class="member-info">
              <div class="member-name">{{ member.name }}</div>
              <div class="member-date">加入时间: {{ formatDate(member.vip_at) }}</div>
            </div>
            <div class="member-relation">{{ member.is_direct ? '直推' : '团队' }}</div>
          </div>
        </div>
        
        <van-empty v-else description="暂无团队成员" />
      </div>
    </div>
    
    <van-empty v-else-if="!loading" description="未找到会员信息" />
    <van-loading v-else type="spinner" vertical>加载中...</van-loading>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Toast } from 'vant';
import { getVipUserDetail, getVipUserDividends, getVipUserTeam } from '@/api/vip';
import NavHeader from '@/components/NavHeader.vue';

export default {
  name: 'VipDetail',
  components: {
    NavHeader
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const userId = route.params.id;
    
    const loading = ref(true);
    const userDetail = ref(null);
    const dividendList = ref([]);
    const teamMembers = ref([]);
    
    // 获取会员详情
    const fetchUserDetail = async () => {
      try {
        loading.value = true;
        const response = await getVipUserDetail(userId);
        
        if (response.code === 0 && response.data) {
          userDetail.value = response.data;
        } else {
          Toast({ type: 'fail', message: response.msg || '获取会员信息失败' });
        }
      } catch (error) {
        console.error('获取VIP会员详情失败:', error);
        Toast({ type: 'fail', message: '网络错误，请稍后重试' });
      } finally {
        loading.value = false;
      }
    };
    
    // 获取分红记录
    const fetchDividends = async () => {
      try {
        const response = await getVipUserDividends({
          user_id: userId,
          page: 1,
          page_size: 5
        });
        
        if (response.code === 0 && response.data) {
          dividendList.value = response.data.list || [];
        }
      } catch (error) {
        console.error('获取分红记录失败:', error);
      }
    };
    
    // 获取团队成员
    const fetchTeamMembers = async () => {
      try {
        const response = await getVipUserTeam({
          user_id: userId,
          page: 1,
          page_size: 5
        });
        
        if (response.code === 0 && response.data) {
          teamMembers.value = response.data.list || [];
        }
      } catch (error) {
        console.error('获取团队成员失败:', error);
      }
    };
    
    const onClickLeft = () => {
      router.back();
    };
    
    const formatDate = (dateStr) => {
      if (!dateStr) return '未知';
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    
    const viewAllDividends = () => {
      router.push(`/admin/vip-dividends?user_id=${userId}`);
    };
    
    const viewAllTeamMembers = () => {
      router.push(`/admin/vip-team?user_id=${userId}`);
    };
    
    onMounted(() => {
      if (userId) {
        fetchUserDetail();
        fetchDividends();
        fetchTeamMembers();
      } else {
        Toast({ type: 'fail', message: '会员ID不能为空' });
        router.back();
      }
    });
    
    return {
      loading,
      userDetail,
      dividendList,
      teamMembers,
      onClickLeft,
      formatDate,
      viewAllDividends,
      viewAllTeamMembers
    };
  }
};
</script>

<style scoped>
.vip-detail-container {
  padding-bottom: 50px;
}

.content {
  padding: 15px;
}

.user-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.user-header {
  display: flex;
  align-items: center;
}

.avatar-wrapper {
  position: relative;
  margin-right: 20px;
}

.vip-badge {
  position: absolute;
  right: 0;
  bottom: 0;
  background-color: #ff9500;
  color: #fff;
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: bold;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.user-mobile {
  font-size: 16px;
  color: #666;
  margin-bottom: 5px;
}

.user-date, .user-id {
  font-size: 14px;
  color: #999;
  margin-bottom: 3px;
}

.info-card, .dividend-card, .team-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.view-more {
  display: flex;
  align-items: center;
  color: #666;
  font-size: 14px;
  font-weight: normal;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  color: #666;
  font-size: 14px;
}

.value {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.amount {
  color: #f56c6c;
  font-weight: bold;
}

.dividend-list, .team-list {
  margin-top: 10px;
}

.dividend-item, .team-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.dividend-item:last-child, .team-item:last-child {
  border-bottom: none;
}

.dividend-info {
  flex: 1;
}

.dividend-type {
  font-size: 15px;
  color: #333;
  margin-bottom: 5px;
}

.dividend-date {
  font-size: 12px;
  color: #999;
}

.dividend-amount {
  font-size: 16px;
  color: #f56c6c;
  font-weight: bold;
}

.team-item {
  display: flex;
  align-items: center;
}

.member-avatar {
  margin-right: 15px;
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 15px;
  color: #333;
  margin-bottom: 5px;
}

.member-date {
  font-size: 12px;
  color: #999;
}

.member-relation {
  padding: 2px 8px;
  background-color: #f2f8ff;
  color: #1989fa;
  border-radius: 20px;
  font-size: 12px;
}
</style> 