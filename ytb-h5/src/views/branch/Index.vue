<template>
  <div class="branch-page">
    <!-- 页面头部 -->
    <van-nav-bar
      title="分支机构"
      left-text="返回"
      left-arrow
      @click-left="$router.go(-1)"
    />

    <!-- 分支机构信息卡片 -->
    <div class="branch-info-card" v-if="branchInfo">
      <div class="branch-header">
        <div class="branch-icon">
          <van-icon name="shop-o" size="24" />
        </div>
        <div class="branch-details">
          <h3 class="branch-name">{{ branchInfo.name }}</h3>
          <p class="branch-code">机构代码：{{ branchInfo.code }}</p>
          <van-tag 
            :type="branchInfo.status === 'active' ? 'success' : 'danger'"
            size="small"
          >
            {{ branchInfo.status === 'active' ? '正常运营' : '暂停服务' }}
          </van-tag>
          <van-tag 
            v-if="branchInfo.is_headquarters"
            type="primary"
            size="small"
            style="margin-left: 8px;"
          >
            总部
          </van-tag>
        </div>
      </div>

      <!-- 微信公众号信息 -->
      <div class="wechat-info" v-if="branchInfo.wechat_account">
        <div class="info-row">
          <van-icon name="wechat" color="#07c160" />
          <span class="info-label">关联公众号：</span>
          <span class="info-value">{{ branchInfo.wechat_account.name }}</span>
        </div>
      </div>
    </div>

    <!-- 无分支机构提示 -->
    <van-empty 
      v-else
      image="error"
      description="您尚未分配到任何分支机构"
    >
      <van-button 
        type="primary" 
        size="small"
        @click="contactAdmin"
      >
        联系管理员
      </van-button>
    </van-empty>

    <!-- 功能菜单 -->
    <div class="function-menu" v-if="branchInfo">
      <van-cell-group>
        <van-cell
          title="机构统计"
          icon="chart-trending-o"
          is-link
          @click="goToStatistics"
        />
        <van-cell
          title="团队成员"
          icon="friends-o"
          is-link
          @click="goToMembers"
        />
        <van-cell
          title="VIP分红"
          icon="gold-coin-o"
          is-link
          @click="goToVipDividend"
          v-if="userStore.isVip"
        />
        <van-cell
          title="业务管理"
          icon="manager-o"
          is-link
          @click="goToBusiness"
          v-if="userStore.isSalesman"
        />
      </van-cell-group>
    </div>

    <!-- 统计数据 -->
    <div class="statistics-section" v-if="branchInfo && statistics">
      <h4 class="section-title">机构数据概览</h4>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-number">{{ statistics.users_count || 0 }}</div>
          <div class="stat-label">总用户数</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ statistics.vip_users_count || 0 }}</div>
          <div class="stat-label">VIP用户</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ statistics.current_month_vip_count || 0 }}</div>
          <div class="stat-label">本月新增VIP</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ statistics.devices_count || 0 }}</div>
          <div class="stat-label">设备总数</div>
        </div>
      </div>
    </div>

    <!-- 最近动态 -->
    <div class="recent-activities" v-if="branchInfo">
      <h4 class="section-title">最近动态</h4>
      <van-list
        v-model:loading="activitiesLoading"
        :finished="activitiesFinished"
        finished-text="没有更多了"
        @load="loadActivities"
      >
        <div 
          class="activity-item"
          v-for="activity in activities"
          :key="activity.id"
        >
          <div class="activity-icon">
            <van-icon :name="getActivityIcon(activity.type)" />
          </div>
          <div class="activity-content">
            <p class="activity-title">{{ activity.title }}</p>
            <p class="activity-time">{{ formatTime(activity.created_at) }}</p>
          </div>
        </div>
      </van-list>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { showToast, showDialog } from 'vant'
import { getBranchStatistics, getBranchActivities } from '@/api/branch'

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const statistics = ref(null)
const activities = ref([])
const activitiesLoading = ref(false)
const activitiesFinished = ref(false)
const activitiesPage = ref(1)

// 计算属性
const branchInfo = computed(() => userStore.branchInfo)

// 页面加载
onMounted(() => {
  if (branchInfo.value) {
    loadStatistics()
    loadActivities()
  }
})

// 加载统计数据
const loadStatistics = async () => {
  try {
    const response = await getBranchStatistics(branchInfo.value.id)
    if (response.code === 0) {
      statistics.value = response.data
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 加载动态数据
const loadActivities = async () => {
  if (activitiesLoading.value) return
  
  activitiesLoading.value = true
  
  try {
    const response = await getBranchActivities(branchInfo.value.id, {
      page: activitiesPage.value,
      per_page: 10
    })
    
    if (response.code === 0) {
      const newActivities = response.data.data || []
      
      if (activitiesPage.value === 1) {
        activities.value = newActivities
      } else {
        activities.value.push(...newActivities)
      }
      
      activitiesPage.value++
      
      if (newActivities.length < 10) {
        activitiesFinished.value = true
      }
    }
  } catch (error) {
    console.error('加载动态数据失败:', error)
    showToast('加载动态失败')
  } finally {
    activitiesLoading.value = false
  }
}

// 导航方法
const goToStatistics = () => {
  router.push('/branch/statistics')
}

const goToMembers = () => {
  router.push('/branch/members')
}

const goToVipDividend = () => {
  router.push('/vip/dividend')
}

const goToBusiness = () => {
  router.push('/salesman/dashboard')
}

const contactAdmin = () => {
  showDialog({
    title: '联系管理员',
    message: '请联系系统管理员为您分配分支机构',
    confirmButtonText: '我知道了'
  })
}

// 工具方法
const getActivityIcon = (type) => {
  const iconMap = {
    'user_register': 'user-o',
    'vip_upgrade': 'diamond-o',
    'device_bind': 'setting-o',
    'dividend_settle': 'gold-coin-o'
  }
  return iconMap[type] || 'info-o'
}

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}
</script>

<style scoped>
.branch-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.branch-info-card {
  background: white;
  margin: 16px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.branch-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
}

.branch-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 16px;
}

.branch-details {
  flex: 1;
}

.branch-name {
  font-size: 20px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 8px 0;
}

.branch-code {
  font-size: 14px;
  color: #969799;
  margin: 0 0 12px 0;
}

.wechat-info {
  border-top: 1px solid #ebedf0;
  padding-top: 16px;
}

.info-row {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.info-label {
  margin-left: 8px;
  color: #646566;
}

.info-value {
  margin-left: 8px;
  color: #323233;
  font-weight: 500;
}

.function-menu {
  margin: 16px;
}

.statistics-section {
  margin: 16px;
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 16px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f7f8fa;
  border-radius: 8px;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #1989fa;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #646566;
}

.recent-activities {
  margin: 16px;
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #ebedf0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 32px;
  height: 32px;
  background: #f2f3f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: #646566;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-size: 14px;
  color: #323233;
  margin: 0 0 4px 0;
}

.activity-time {
  font-size: 12px;
  color: #969799;
  margin: 0;
}
</style> 