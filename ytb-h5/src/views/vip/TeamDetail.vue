<template>
  <div class="team-detail-page">
    <!-- 导航栏 -->
    <van-nav-bar
      title="团队详情"
      left-text="返回"
      left-arrow
      @click-left="$router.go(-1)"
      fixed
      placeholder
    />

    <!-- 团队成员信息卡片 -->
    <div class="member-card">
      <div class="member-header">
        <img :src="memberInfo.avatar" alt="头像" class="member-avatar" />
        <div class="member-info">
          <h3 class="member-name">{{ memberInfo.name }}</h3>
          <p class="member-phone">{{ memberInfo.phone || '未绑定手机' }}</p>
          <div class="member-tags">
            <span v-if="memberInfo.isVip" class="tag vip-tag">VIP会员</span>
            <span v-if="memberInfo.isDirect" class="tag direct-tag">直推</span>
            <span class="tag level-tag">{{ memberInfo.level }}级</span>
          </div>
        </div>
      </div>
      
      <div class="member-stats">
        <div class="stat-item">
          <span class="stat-value">{{ memberInfo.joinDays }}天</span>
          <span class="stat-label">加入天数</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ memberInfo.teamSize }}</span>
          <span class="stat-label">团队人数</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ memberInfo.deviceCount }}</span>
          <span class="stat-label">设备数量</span>
        </div>
      </div>
    </div>

    <!-- 贡献数据 -->
    <div class="contribution-section">
      <h4 class="section-title">贡献数据</h4>
      
      <!-- VIP招募贡献 -->
      <div class="contribution-card">
        <div class="card-header">
          <van-icon name="friends" />
          <span>VIP招募贡献</span>
        </div>
        <div class="contribution-stats">
          <div class="stat-row">
            <span class="stat-name">累计招募VIP</span>
            <span class="stat-value">{{ contributionData.totalVipRecruits }}人</span>
          </div>
          <div class="stat-row">
            <span class="stat-name">本月招募VIP</span>
            <span class="stat-value highlight">{{ contributionData.monthVipRecruits }}人</span>
          </div>
          <div class="stat-row">
            <span class="stat-name">贡献分红池</span>
            <span class="stat-value">¥{{ contributionData.vipPoolContribution }}</span>
          </div>
        </div>
      </div>

      <!-- 充值设备贡献 -->
      <div class="contribution-card">
        <div class="card-header">
          <van-icon name="shop" />
          <span>充值设备贡献</span>
        </div>
        <div class="contribution-stats">
          <div class="stat-row">
            <span class="stat-name">累计充值设备</span>
            <span class="stat-value">{{ contributionData.totalDeviceRecharges }}台</span>
          </div>
          <div class="stat-row">
            <span class="stat-name">本月充值设备</span>
            <span class="stat-value highlight">{{ contributionData.monthDeviceRecharges }}台</span>
          </div>
          <div class="stat-row">
            <span class="stat-name">贡献分红池</span>
            <span class="stat-value">¥{{ contributionData.devicePoolContribution }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 团队结构 -->
    <div class="team-structure-section">
      <h4 class="section-title">团队结构</h4>
      
      <div class="structure-card">
        <div class="structure-item">
          <span class="structure-label">直推成员</span>
          <span class="structure-value">{{ teamStructure.directMembers }}人</span>
        </div>
        <div class="structure-item">
          <span class="structure-label">间推成员</span>
          <span class="structure-value">{{ teamStructure.indirectMembers }}人</span>
        </div>
        <div class="structure-item">
          <span class="structure-label">最大层级</span>
          <span class="structure-value">{{ teamStructure.maxLevel }}级</span>
        </div>
        <div class="structure-item">
          <span class="structure-label">VIP占比</span>
          <span class="structure-value">{{ teamStructure.vipRatio }}%</span>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-section">
      <van-button 
        type="primary" 
        block 
        @click="viewTeamMembers"
        :loading="loading"
      >
        查看下级团队
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Toast } from 'vant'
import { getVipUserDetail, getVipUserTeam } from '@/api/vip'

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(false)
const memberInfo = ref({
  id: 0,
  name: '团队成员',
  phone: '',
  avatar: '/app/images/profile/default-avatar.png',
  isVip: false,
  isDirect: false,
  level: 1,
  joinDays: 0,
  teamSize: 0,
  deviceCount: 0
})

const contributionData = ref({
  totalVipRecruits: 0,
  monthVipRecruits: 0,
  vipPoolContribution: '0.00',
  totalDeviceRecharges: 0,
  monthDeviceRecharges: 0,
  devicePoolContribution: '0.00'
})

const teamStructure = ref({
  directMembers: 0,
  indirectMembers: 0,
  maxLevel: 1,
  vipRatio: 0
})

// 获取成员详情
const fetchMemberDetail = async () => {
  try {
    loading.value = true
    const memberId = route.params.id
    
    const res = await getVipUserDetail(memberId)
    if (res.code === 0) {
      const data = res.data
      
      // 更新成员信息
      memberInfo.value = {
        id: data.id,
        name: data.name || data.wechat_nickname || '团队成员',
        phone: data.phone || '',
        avatar: data.wechat_avatar || '/app/images/profile/default-avatar.png',
        isVip: data.is_vip_paid === 1,
        isDirect: data.is_direct === 1,
        level: data.level || 1,
        joinDays: data.join_days || 0,
        teamSize: data.team_size || 0,
        deviceCount: data.device_count || 0
      }
      
      // 更新贡献数据
      contributionData.value = {
        totalVipRecruits: data.total_vip_recruits || 0,
        monthVipRecruits: data.month_vip_recruits || 0,
        vipPoolContribution: (data.vip_pool_contribution || 0).toFixed(2),
        totalDeviceRecharges: data.total_device_recharges || 0,
        monthDeviceRecharges: data.month_device_recharges || 0,
        devicePoolContribution: (data.device_pool_contribution || 0).toFixed(2)
      }
      
      // 更新团队结构
      teamStructure.value = {
        directMembers: data.direct_members || 0,
        indirectMembers: data.indirect_members || 0,
        maxLevel: data.max_level || 1,
        vipRatio: data.vip_ratio || 0
      }
    } else {
      Toast({ type: 'fail', message: res.message || '获取成员详情失败' })
    }
  } catch (error) {
    console.error('获取成员详情失败:', error)
    Toast({ type: 'fail', message: '网络错误，请重试' })
  } finally {
    loading.value = false
  }
}

// 查看团队成员
const viewTeamMembers = () => {
  router.push({
    name: 'VipTeam',
    query: { userId: memberInfo.value.id }
  })
}

// 页面初始化
onMounted(() => {
  fetchMemberDetail()
})
</script>

<style scoped>
.team-detail-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 20px;
}

/* 成员信息卡片 */
.member-card {
  background: white;
  margin: 15px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.member-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.member-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin-right: 15px;
  object-fit: cover;
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 5px 0;
}

.member-phone {
  font-size: 14px;
  color: #666;
  margin: 0 0 10px 0;
}

.member-tags {
  display: flex;
  gap: 8px;
}

.tag {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.vip-tag {
  background: linear-gradient(135deg, #ff9500, #ff6b35);
  color: white;
}

.direct-tag {
  background: #e8f5e8;
  color: #52c41a;
}

.level-tag {
  background: #f0f0f0;
  color: #666;
}

.member-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: #ff9500;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

/* 贡献数据部分 */
.contribution-section {
  margin: 15px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
}

.contribution-card {
  background: white;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.card-header .van-icon {
  margin-right: 8px;
  color: #ff9500;
}

.contribution-stats {
  space-y: 10px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.stat-name {
  font-size: 14px;
  color: #666;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.stat-value.highlight {
  color: #ff9500;
}

/* 团队结构部分 */
.team-structure-section {
  margin: 15px;
}

.structure-card {
  background: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.structure-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.structure-item:last-child {
  border-bottom: none;
}

.structure-label {
  font-size: 14px;
  color: #666;
}

.structure-value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

/* 操作按钮 */
.action-section {
  margin: 20px 15px;
}

.van-button--primary {
  background: linear-gradient(135deg, #ff9500, #ff6b35);
  border: none;
  border-radius: 25px;
  height: 50px;
  font-size: 16px;
  font-weight: 600;
}
</style> 