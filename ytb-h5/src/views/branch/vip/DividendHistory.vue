<template>
  <div class="dividend-history-page">
    <van-nav-bar
      title="分支机构分红记录"
      @click-left="$router.back()"
      fixed
      placeholder
    >
      <template #left>
        <span style="color: #323233; font-size: 16px; cursor: pointer; display: flex; align-items: center; padding: 0 8px;">
          ←
        </span>
      </template>
    </van-nav-bar>

    <!-- 分红类型和等级选择 -->
    <div class="filter-section">
      <van-tabs v-model="activeType" @change="handleTypeChange" :sticky="true" color="#ff4a47">
        <van-tab title="VIP招募分红" name="vip" />
        <van-tab title="充值分红" name="recharge" />
      </van-tabs>
      
      <div class="level-filter">
        <div class="level-buttons">
          <van-button 
            :type="activeLevel === 'junior' ? 'primary' : 'default'" 
            size="small"
            @click="handleLevelChange('junior')"
          >
            初级
          </van-button>
          <van-button 
            :type="activeLevel === 'middle' ? 'primary' : 'default'" 
            size="small"
            @click="handleLevelChange('middle')"
          >
            中级
          </van-button>
          <van-button 
            :type="activeLevel === 'senior' ? 'primary' : 'default'" 
            size="small"
            @click="handleLevelChange('senior')"
          >
            高级
          </van-button>
        </div>
      </div>
    </div>

    <!-- 月份选择 -->
    <div class="month-section">
      <van-field
        v-model="selectedMonth"
        label="查询月份"
        placeholder="选择月份"
        readonly
        is-link
        @click="showMonthPicker = true"
      />
    </div>

    <!-- 分红概览 -->
    <div class="overview-card" v-if="dividendOverview">
      <div class="overview-header">
        <h3>{{ getTypeTitle() }}{{ getLevelTitle() }}分红</h3>
        <span class="month-info">{{ selectedMonth }}</span>
      </div>
      <div class="overview-stats">
        <div class="stat-item">
          <span class="stat-label">奖金池总额</span>
          <span class="stat-value">¥{{ dividendOverview.total_pool_amount || '0.00' }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">达标人数</span>
          <span class="stat-value">{{ dividendOverview.qualified_count || 0 }}人</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">达标条件</span>
          <span class="stat-value">{{ dividendOverview.requirement || 0 }}{{ getRequirementUnit() }}</span>
        </div>
      </div>
    </div>

    <!-- 分红名单 -->
    <div class="dividend-list-section">
      <div class="section-title">
        <h4>分红名单</h4>
        <span class="total-count">共{{ dividendList.length }}人</span>
      </div>

      <template v-if="!loading && dividendList.length > 0">
        <div class="dividend-list">
          <div class="dividend-item" v-for="(user, index) in dividendList" :key="user.user_id">
            <div class="user-rank">{{ index + 1 }}</div>
            <div class="user-avatar">
              <van-image
                round
                width="40"
                height="40"
                :src="formatAvatar(user.avatar)"
                :error-content="'头像'"
              />
            </div>
            <div class="user-info">
              <div class="user-name">{{ user.name }}</div>
              <div class="user-stats">
                <span>团队{{ getRequirementUnit() }}：{{ user.team_count }}</span>
                <span v-if="activeLevel !== 'junior'">直推：{{ user.direct_count }}</span>
              </div>
            </div>
            <div class="dividend-amount">
              <span class="amount">¥{{ user.dividend_amount }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- 空状态 -->
      <van-empty v-else-if="!loading" description="暂无分红记录" />
    </div>

    <!-- 加载状态 -->
    <div class="loading-container" v-if="loading">
      <van-loading color="#ff4a47" />
      <span class="loading-text">加载中...</span>
    </div>

    <!-- 月份选择器 -->
    <van-popup v-model:show="showMonthPicker" position="bottom">
      <van-date-picker
        v-model="pickerDate"
        type="year-month"
        title="选择月份"
        @confirm="onMonthConfirm"
        @cancel="showMonthPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { NavBar, Tab, Tabs, Empty, Loading, Field, Popup, DatePicker, Button, Image as VanImage, Icon } from 'vant'
import { getBranchVipDividendList } from '@/api/branchVip'
import { showToast } from 'vant'

// 响应式数据
const activeType = ref('vip')
const activeLevel = ref('junior')
const selectedMonth = ref(new Date().toISOString().slice(0, 7)) // YYYY-MM格式
const loading = ref(false)
const dividendList = ref([])
const dividendOverview = ref(null)
const showMonthPicker = ref(false)
const pickerDate = ref(new Date().toISOString().slice(0, 7).split('-'))

// 计算属性
const getTypeTitle = () => {
  return activeType.value === 'vip' ? 'VIP招募' : '充值'
}

const getLevelTitle = () => {
  const levelMap = {
    'junior': '初级',
    'middle': '中级',
    'senior': '高级'
  }
  return levelMap[activeLevel.value] || ''
}

const getRequirementUnit = () => {
  return activeType.value === 'vip' ? '人' : '台'
}

// 类型切换处理
const handleTypeChange = (type) => {
  activeType.value = type
  loadDividendList()
}

// 等级切换处理
const handleLevelChange = (level) => {
  activeLevel.value = level
  loadDividendList()
}

// 月份确认处理
const onMonthConfirm = (values) => {
  selectedMonth.value = `${values[0]}-${values[1].toString().padStart(2, '0')}`
  showMonthPicker.value = false
  loadDividendList()
}

// 格式化头像URL
const formatAvatar = (avatar) => {
  if (!avatar) {
    return '/app/images/profile/default-avatar.png'
  }
  
  if (avatar.startsWith('http')) {
    return avatar
  }
  
  return `https://pay.itapgo.com${avatar.startsWith('/') ? '' : '/'}${avatar}`
}

// 加载分红名单数据
const loadDividendList = async () => {
  try {
    loading.value = true
    dividendList.value = []
    dividendOverview.value = null

    const res = await getBranchVipDividendList({
      month: selectedMonth.value,
      type: activeType.value,
      level: activeLevel.value
    })

    if (res.code === 0) {
      const data = res.data || {}
      dividendList.value = data.list || []
      dividendOverview.value = {
        total_pool_amount: data.total_pool_amount,
        qualified_count: data.qualified_count,
        requirement: data.requirement,
        type: data.type,
        level: data.level,
        month: data.month,
        branch_name: data.branch_name
      }
      
      console.log('🏆 分红名单加载成功:', {
        type: activeType.value,
        level: activeLevel.value,
        month: selectedMonth.value,
        count: dividendList.value.length,
        totalAmount: data.total_pool_amount
      })
    } else {
      console.error('获取分红名单失败:', res.message)
      showToast('获取分红名单失败')
    }
  } catch (error) {
    console.error('加载分红名单失败:', error)
    showToast('网络错误，请重试')
  } finally {
    loading.value = false
  }
}

// 初始化
onMounted(() => {
  loadDividendList()
})
</script>

<style scoped>
.dividend-history-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.filter-section {
  background: white;
  padding-bottom: 16px;
}

.level-filter {
  padding: 0 16px 16px;
  display: flex;
  justify-content: center;
}

.level-buttons {
  display: flex;
  gap: 8px;
}

.month-section {
  background: white;
  margin-bottom: 12px;
  padding: 0 16px;
}

.overview-card {
  background: white;
  margin: 0 16px 16px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.overview-header h3 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.month-info {
  font-size: 14px;
  color: #666;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 16px;
  font-weight: bold;
  color: #ff4a47;
}

.dividend-list-section {
  background: white;
  margin: 0 16px;
  border-radius: 12px;
  padding: 16px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title h4 {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.total-count {
  font-size: 14px;
  color: #666;
}

.dividend-list {
  space-y: 12px;
}

.dividend-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 12px;
}

.user-rank {
  width: 24px;
  height: 24px;
  background: #ff4a47;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  margin-right: 12px;
  flex-shrink: 0;
}

.user-avatar {
  margin-right: 12px;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.user-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}

.dividend-amount {
  text-align: right;
  flex-shrink: 0;
}

.amount {
  font-size: 18px;
  font-weight: bold;
  color: #ff4a47;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 12px;
}

.loading-text {
  font-size: 14px;
  color: #666;
}

/* 特殊排名样式 */
.dividend-item:nth-child(1) .user-rank {
  background: #ffd700;
  color: #333;
}

.dividend-item:nth-child(2) .user-rank {
  background: #c0c0c0;
  color: #333;
}

.dividend-item:nth-child(3) .user-rank {
  background: #cd7f32;
  color: white;
}
</style> 