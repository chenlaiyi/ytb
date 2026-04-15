<template>
  <div class="team-page">
    <van-nav-bar
      title="我的VIP团队"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    >
      <template #right>
        <van-icon name="replay" size="18" @click="refreshData" :class="{ 'refresh-loading': isRefreshing }" />
      </template>
    </van-nav-bar>

    <!-- 精致紧凑的统计卡片 -->
    <div class="stats-container">
      <!-- 登录提示 -->
      <div v-if="hasLoginError" class="login-prompt">
        <van-icon name="warning" class="prompt-icon" />
        <span class="prompt-text">请先登录后查看团队数据</span>
        <van-button type="primary" size="mini" @click="$router.push('/login')">去登录</van-button>
      </div>
      
      <!-- VIP和充值统计 -->
      <div v-else class="stats-row">
        <!-- VIP统计 -->
        <div class="stats-section vip-section">
          <div class="section-header">
            <van-icon name="vip" class="section-icon" />
            <span class="section-title">VIP</span>
          </div>
          <div class="stats-grid">
            <div class="stats-item">
              <div class="stats-value">{{ statsLoaded ? teamStats.totalVipCount : '--' }}</div>
              <div class="stats-label">团队</div>
            </div>
            <div class="stats-item">
              <div class="stats-value">{{ statsLoaded ? teamStats.directVipCount : '--' }}</div>
              <div class="stats-label">直推</div>
            </div>
            <div class="stats-item">
              <div class="stats-value">{{ statsLoaded ? teamStats.monthDirectVipCount : '--' }}</div>
              <div class="stats-label">本月</div>
            </div>
          </div>
        </div>

        <!-- 充值统计 -->
        <div class="stats-section recharge-section">
          <div class="section-header">
            <van-icon name="gold-coin" class="section-icon" />
            <span class="section-title">充值</span>
          </div>
          <div class="stats-grid">
            <div class="stats-item">
              <div class="stats-value">{{ statsLoaded ? teamStats.totalRechargeCount : '--' }}</div>
              <div class="stats-label">团队</div>
            </div>
            <div class="stats-item">
              <div class="stats-value">{{ statsLoaded ? teamStats.directRechargeCount : '--' }}</div>
              <div class="stats-label">直推</div>
            </div>
            <div class="stats-item">
              <div class="stats-value">{{ statsLoaded ? teamStats.monthDirectRechargeCount : '--' }}</div>
              <div class="stats-label">本月</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选Tab -->
    <van-tabs v-model="activeTab" @change="handleTabChange" :sticky="true" color="#ff4a47">
      <van-tab title="全部" name="all" />
      <van-tab title="直接推荐" name="direct" />
      <van-tab title="本月新增" name="month" />
    </van-tabs>

    <!-- 列表内容 -->
    <div class="team-content">
      <template v-if="teamList.length > 0">
        <div class="team-list">
          <div class="team-item" v-for="member in teamList" :key="member.id">
            <div class="member-avatar">
              <van-image
                round
                width="40"
                height="40"
                :src="member.avatar"
                :error-content="'头像'"
              />
              <div class="member-level">{{ member.relation }}</div>
            </div>
            <div class="member-info">
              <div class="member-name">
                {{ member.name || '用户' + member.id }}
                <van-tag
                  :type="member.is_vip_paid ? 'success' : 'warning'"
                  size="mini"
                  class="payment-tag"
                >
                  {{ member.is_vip_paid ? '已完款' : '未完款' }}
                </van-tag>
              </div>
              <div class="member-date">{{ member.join_date }}</div>
            </div>
            <div class="member-stats">
              <div class="stats-item">
                <span class="stats-value">{{ member.direct_count || 0 }}</span>
                <span class="stats-label">直推</span>
              </div>
              <div class="stats-divider"></div>
              <div class="stats-item">
                <span class="stats-value">{{ member.team_count || 0 }}</span>
                <span class="stats-label">团队</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <van-pagination
          v-model="currentPage"
          :total-items="total"
          :items-per-page="pageSize"
          force-ellipses
          @change="handlePageChange"
        />
      </template>

      <!-- 空状态 -->
      <van-empty v-else description="暂无团队成员" />
    </div>

    <!-- 加载状态 -->
    <div class="loading-container" v-if="loading">
      <van-loading color="#ff4a47" />
      <span class="loading-text">加载中...</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { NavBar, Tab, Tabs, Icon, Image as VanImage, Empty, Loading, Pagination, Tag, Button } from 'vant'
import { getVipTeamData, getVipTeamMembers } from '@/api/vip'
import Toast from '@/utils/toast-fix'
import { safeGet, validateAndFixData, safeAsync, safeToast } from '@/utils/bug-fix'

// 团队列表数据
const teamList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const activeTab = ref('all')
const loading = ref(false)
const isRefreshing = ref(false)

// 团队统计数据
const teamStats = ref({
  // VIP相关数据
  totalVipCount: 0,         // 团队总VIP数
  directVipCount: 0,        // 直推VIP数
  monthDirectVipCount: 0,   // 本月直推VIP数
  monthVipCount: 0,         // 本月团队新增VIP数
  
  // 充值相关数据
  totalRechargeCount: 0,    // 团队总充值台数
  directRechargeCount: 0,   // 直推充值台数
  monthRechargeCount: 0,    // 本月团队充值台数
  monthDirectRechargeCount: 0 // 本月直推充值台数
})

// 数据加载状态
const statsLoaded = ref(false)
const hasLoginError = ref(false)

// 获取团队统计信息
const fetchTeamStats = () => {
  return safeAsync(async () => {
    const res = await getVipTeamData({ month: 'current' })
    
    if (safeGet(res, 'code') === 0) {
      const data = safeGet(res, 'data', {})
      
      // 使用安全的数据访问
      teamStats.value = {
        totalVipCount: safeGet(data, 'totalVipCount', 0),
        directVipCount: safeGet(data, 'directVipCount', 0),
        monthDirectVipCount: safeGet(data, 'monthDirectVipCount', 0),
        monthVipCount: safeGet(data, 'monthVipCount', 0),
        totalRechargeCount: safeGet(data, 'totalRechargeCount', 0),
        directRechargeCount: safeGet(data, 'directRechargeCount', 0),
        monthRechargeCount: safeGet(data, 'monthTeamRechargeCount', 0),
        monthDirectRechargeCount: safeGet(data, 'monthDirectRechargeCount', 0),
        queryMonth: safeGet(data, 'queryMonth', '本月'),
        queryMonthValue: safeGet(data, 'queryMonthValue', '')
      }
      
      statsLoaded.value = true
      console.log('VIP团队统计数据:', teamStats.value)
      return true
    } else {
      console.error('获取团队统计信息失败:', safeGet(res, 'message', '未知错误'))
      
      // 检查是否是登录相关错误
      const errorMessage = safeGet(res, 'message', '')
      if (errorMessage && (errorMessage.includes('访问令牌') || errorMessage.includes('登录') || errorMessage.includes('token'))) {
        hasLoginError.value = true
        return false
      }
      
      safeToast.show('获取团队数据失败: ' + (errorMessage || '未知错误'), 'error')
      return false
    }
  }, null, (error) => {
    console.error('获取团队统计信息失败', error)
    
    // 检查是否是认证错误
    const errorMessage = safeGet(error, 'message', '')
    if (errorMessage && (errorMessage.includes('访问令牌') || errorMessage.includes('401') || errorMessage.includes('Unauthorized'))) {
      hasLoginError.value = true
      return false
    }
    
    safeToast.show('网络错误，请稍后重试', 'error')
    return false
  })
}

// 获取团队成员列表
const fetchTeamMembers = async () => {
  if (loading.value) return

  loading.value = true
  isRefreshing.value = true

  try {
    // 构建请求参数 - 确保明确传递type参数
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      type: activeTab.value // 始终传递type参数，不使用undefined
    }

    console.log('获取VIP团队成员, 标签:', activeTab.value, '参数:', params)
    const res = await getVipTeamMembers(params)
    console.log('VIP团队成员结果:', res)

    if (safeGet(res, 'code') === 0) {
      const data = safeGet(res, 'data', [])
      
      // 安全地处理团队成员数据
      teamList.value = data.list || []
      total.value = data.total || 0

      console.log(`标签: ${activeTab.value}, 成员数: ${teamList.value.length}, 总数: ${total.value}`)
    } else {
      console.error('API返回错误:', res)
      
      // 检查是否是登录相关错误
      if (safeGet(res, 'message') && (safeGet(res, 'message').includes('访问令牌') || safeGet(res, 'message').includes('登录') || safeGet(res, 'message').includes('token'))) {
        Toast({ type: 'fail', message: '请先登录后查看团队成员' })
      } else {
        Toast({ type: 'fail', message: safeGet(res, 'message', '获取团队成员失败') })
      }
      
      teamList.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取团队成员失败', error)
    
    // 检查是否是认证错误
    if (safeGet(error, 'message', '').includes('访问令牌') || 
        safeGet(error, 'message', '').includes('401') || 
        safeGet(error, 'message', '').includes('Unauthorized')) {
      Toast({ type: 'fail', message: '请先登录后查看团队成员' })
    } else {
      Toast({ type: 'fail', message: '网络错误，请稍后重试' })
    }
    
    teamList.value = []
    total.value = 0
  } finally {
    loading.value = false
    isRefreshing.value = false
  }
}

// 刷新数据
const refreshData = () => {
  if (isRefreshing.value) return

  isRefreshing.value = true

  // 显示加载提示
  Toast.loading({
    message: '刷新中...',
    duration: 1000
  })

  // 清除浏览器缓存
  if (window.caches && window.caches.delete) {
    try {
      console.log('刷新时清除缓存 - VIP团队页面')
      caches.delete('api-cache').then(deleted => {
        console.log('缓存清除结果:', deleted)
      })
    } catch (e) {
      console.error('清除缓存失败:', e)
    }
  }

  // 重置页码到第一页
  currentPage.value = 1

  console.log('手动刷新，重新获取团队成员数据，当前标签:', activeTab.value)

  // 使用唯一时间戳确保每次请求都是最新的
  fetchTeamMembers()
  fetchTeamStats() // 同时刷新团队统计信息
}

// 处理分页变化
const handlePageChange = (page) => {
  currentPage.value = page
  fetchTeamMembers()
}

// 处理标签页切换
const handleTabChange = (name) => {
  console.log('标签切换事件触发，新标签:', name, '当前标签:', activeTab.value)
  
  // 如果标签没有实际变化，不执行任何操作
  if (name === activeTab.value) {
    console.log('标签未变化，跳过处理')
    return
  }
  
  // 更新当前标签
  activeTab.value = name
  
  // 重置页码
  currentPage.value = 1

  // 清除浏览器缓存
  if (window.caches && window.caches.delete) {
    try {
      console.log('切换标签时清除缓存')
      caches.delete('api-cache').then(deleted => {
        console.log('缓存清除结果:', deleted)
      })
    } catch (e) {
      console.error('清除缓存失败:', e)
    }
  }

  // 获取新数据
  console.log('重新获取团队成员数据，标签:', activeTab.value)
  fetchTeamMembers()
}

// 页面加载
onMounted(() => {
  console.log('VIP团队页面加载，初始标签:', activeTab.value)

  // 清除浏览器缓存
  if (window.caches && window.caches.delete) {
    try {
      console.log('页面加载时清除缓存')
      caches.delete('api-cache').then(deleted => {
        console.log('缓存清除结果:', deleted)
      })
    } catch (e) {
      console.error('清除缓存失败:', e)
    }
  }

  // 获取数据
  fetchTeamMembers()
  fetchTeamStats()

  // 添加页面可见性变化监听，当用户切回页面时刷新数据
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('页面重新可见，刷新数据')
      refreshData()
    }
  })
})

// 清理工作（例如清除缓存）
const cleanUp = () => {
  console.log('清理VIP团队页面资源')

  // 清除缓存
  if (window.caches && window.caches.delete) {
    try {
      caches.delete('api-cache').catch(e => console.error('离开页面时清除缓存失败:', e))
    } catch (e) {}
  }

  // 移除事件监听器
  document.removeEventListener('visibilitychange', () => {})
}

// 组件卸载前清理资源
onUnmounted(() => {
  console.log('VIP团队页面卸载')
  cleanUp()
})
</script>

<style scoped>
.stats-container {
  margin: 8px 12px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.login-prompt {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
  color: #666;
}

.prompt-icon {
  color: #ff6b35;
  margin-right: 8px;
  font-size: 18px;
}

.prompt-text {
  flex: 1;
  margin-right: 12px;
  font-size: 14px;
}

.stats-row {
  display: flex;
}

.stats-section {
  flex: 1;
  padding: 12px;
  position: relative;
}

.vip-section {
  border-right: 1px solid #f0f0f0;
}

.vip-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #ff6b6b, #ff4a47);
}

.recharge-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #ffd93d, #ff9500);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  gap: 4px;
}

.section-icon {
  font-size: 14px;
  color: #ff4a47;
}

.recharge-section .section-icon {
  color: #ff9500;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.stats-grid {
  display: flex;
  justify-content: space-around;
  gap: 4px;
}

.stats-item {
  flex: 1;
  text-align: center;
  padding: 6px 4px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.stats-item:hover {
  background: #f8f9fa;
}

.stats-value {
  font-size: 16px;
  font-weight: bold;
  color: #ff4a47;
  margin-bottom: 2px;
  line-height: 1;
}

.recharge-section .stats-value {
  color: #ff9500;
}

.stats-label {
  font-size: 10px;
  color: #666;
  font-weight: 500;
  line-height: 1;
}

.team-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

/* 导航栏样式 */
:deep(.van-nav-bar) {
  background-color: #fff;
  border-bottom: 1px solid #ebedf0;
}

:deep(.van-nav-bar__title) {
  color: #323233;
  font-weight: 600;
}

:deep(.van-nav-bar__left) {
  color: #323233;
}

:deep(.van-nav-bar__arrow) {
  color: #323233;
  font-size: 18px;
}

:deep(.van-nav-bar__right) {
  color: #323233;
}

.team-content {
  padding: 8px 12px;
}

.team-list {
  padding-bottom: 12px;
}

.team-item {
  background-color: #fff;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  position: relative;
}

.member-avatar {
  position: relative;
  margin-right: 10px;
}

.member-level {
  position: absolute;
  bottom: -1px;
  right: -1px;
  background-color: #ff4a47;
  color: #fff;
  font-size: 8px;
  padding: 1px 4px;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
}

.payment-tag {
  margin-left: 6px;
}

.member-date {
  font-size: 11px;
  color: #999;
}

.member-stats {
  display: flex;
  align-items: center;
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 6px 8px;
}

.member-stats .stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 6px;
}

.member-stats .stats-value {
  font-size: 13px;
  font-weight: bold;
  color: #ff4a47;
  margin-bottom: 1px;
  line-height: 1;
}

.member-stats .stats-label {
  font-size: 9px;
  color: #999;
  line-height: 1;
}

.stats-divider {
  width: 1px;
  height: 16px;
  background-color: #e0e0e0;
}

:deep(.van-pagination) {
  margin-top: 12px;
  margin-bottom: 12px;
}

:deep(.van-pagination__item--active) {
  color: #fff;
  background-color: #ff4a47;
}

.loading-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.loading-text {
  margin-top: 10px;
  font-size: 14px;
  color: #999;
}

.refresh-loading {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
