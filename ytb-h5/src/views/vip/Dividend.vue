<template>
  <div class="dividend-page">
    <van-nav-bar
      title="分红收益明细"
      left-arrow
      @click-left="onClickLeft"
      fixed
      placeholder
    >
      <template #right>
        <van-icon name="replay" size="18" @click="refreshData" :class="{ 'refresh-loading': isRefreshing }" />
      </template>
    </van-nav-bar>

    <!-- 月份选择器 -->
    <div class="month-selector">
      <div class="month-nav">
        <van-icon 
          name="arrow-left" 
          @click="switchToPreviousMonth" 
          :class="{ 'disabled': !canGoPrevious }"
        />
        <div class="current-month">
          <span class="month-text">{{ formatMonthDisplay(currentMonth) }}</span>
          <span class="month-type">{{ getMonthTypeLabel(currentMonth) }}</span>
        </div>
        <van-icon 
          name="arrow" 
          @click="switchToNextMonth" 
          :class="{ 'disabled': !canGoNext }"
        />
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="summary-card">
      <div class="summary-header">
        <div class="header-title">平台分红统计</div>
        <div class="month-countdown">{{ formatMonthDisplay(currentMonth) }} 数据</div>
      </div>

      <div class="summary-content">
        <div class="summary-item">
          <div class="summary-value">{{ summaryData.totalAmount || '0.00' }}元</div>
          <div class="summary-label">总奖金池</div>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item highlight">
          <div class="summary-value">{{ summaryData.monthAmount || '0.00' }}元</div>
          <div class="summary-label">VIP分红池</div>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <div class="summary-value">{{ summaryData.pendingAmount || '0.00' }}元</div>
          <div class="summary-label">充值分红池</div>
        </div>
      </div>
    </div>

    <!-- 平台统计信息 -->
    <div class="platform-stats">
      <div class="stats-header">
        <div class="title">平台分红概况</div>
        <div class="subtitle">{{ platformData.month || new Date().toISOString().slice(0, 7) }} 月度数据</div>
      </div>
      
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">{{ platformData.platform_stats?.total_vip_count || 0 }}</div>
          <div class="stat-label">平台VIP总数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ platformData.platform_stats?.month_new_vip_count || 0 }}</div>
          <div class="stat-label">本月新增VIP</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ platformData.platform_stats?.total_device_count || 0 }}</div>
          <div class="stat-label">充值设备总数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ platformData.platform_stats?.month_new_device_count || 0 }}</div>
          <div class="stat-label">本月新增设备</div>
        </div>
      </div>
      
      <div class="qualification-stats">
        <div class="qualification-title">达标人数统计</div>
        <div class="qualification-grid">
          <div class="qualification-section">
            <div class="section-title">VIP分红达标</div>
            <div class="qualification-items">
              <div class="qualification-item">
                <span class="level junior">初级</span>
                <span class="count">{{ platformData.qualification_stats?.vip?.junior || 0 }}人</span>
              </div>
              <div class="qualification-item">
                <span class="level middle">中级</span>
                <span class="count">{{ platformData.qualification_stats?.vip?.middle || 0 }}人</span>
              </div>
              <div class="qualification-item">
                <span class="level senior">高级</span>
                <span class="count">{{ platformData.qualification_stats?.vip?.senior || 0 }}人</span>
              </div>
            </div>
          </div>
          
          <div class="qualification-section">
            <div class="section-title">充值分红达标</div>
            <div class="qualification-items">
              <div class="qualification-item">
                <span class="level junior">初级</span>
                <span class="count">{{ platformData.qualification_stats?.recharge?.junior || 0 }}人</span>
              </div>
              <div class="qualification-item">
                <span class="level middle">中级</span>
                <span class="count">{{ platformData.qualification_stats?.recharge?.middle || 0 }}人</span>
              </div>
              <div class="qualification-item">
                <span class="level senior">高级</span>
                <span class="count">{{ platformData.qualification_stats?.recharge?.senior || 0 }}人</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="calculation-info">
        <div class="calculation-title">奖金池计算公式</div>
        <div class="calculation-items">
          <div class="calculation-item">
            <div class="formula">{{ platformData.pool_info?.calculation?.vip_formula || '' }}</div>
          </div>
          <div class="calculation-item">
            <div class="formula">{{ platformData.pool_info?.calculation?.device_formula || '' }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分红记录标题 -->
    <div class="records-header">
      <div class="title">平台分红记录</div>
      <div class="subtitle">查看平台分红情况</div>
    </div>

    <!-- 分红记录列表 -->
    <div class="dividend-list" v-if="platformData.qualified_users">
      <!-- VIP分红记录 -->
      <div class="dividend-category">
        <div class="category-title">VIP招募分红</div>
        
        <!-- 初级VIP分红 -->
        <div class="dividend-item" v-if="platformData.dividend_distribution?.vip?.junior?.qualified_count > 0">
          <div class="item-header">
            <div class="item-period">{{ currentMonth.replace('-', '-') }}期初级VIP分红</div>
            <div class="item-amount">{{ Number(platformData.dividend_distribution.vip.junior.per_person || 0).toFixed(2) }}元</div>
          </div>
          <div class="qualified-users">
            <div class="user-item" v-for="user in platformData.qualified_users.vip.junior" :key="user.id">
              <div class="user-avatar">
                <img v-if="user.wechat_avatar" :src="user.wechat_avatar" :alt="user.hidden_name" />
                <div v-else class="default-avatar">{{ user.hidden_name.charAt(0) }}</div>
              </div>
              <div class="user-name">{{ user.hidden_name }}</div>
            </div>
          </div>
        </div>
        
        <!-- 中级VIP分红 -->
        <div class="dividend-item" v-if="platformData.dividend_distribution?.vip?.middle?.qualified_count > 0">
          <div class="item-header">
            <div class="item-period">{{ currentMonth.replace('-', '-') }}期中级VIP分红</div>
            <div class="item-amount">{{ Number(platformData.dividend_distribution.vip.middle.per_person || 0).toFixed(2) }}元</div>
          </div>
          <div class="qualified-users">
            <div class="user-item" v-for="user in platformData.qualified_users.vip.middle" :key="user.id">
              <div class="user-avatar">
                <img v-if="user.wechat_avatar" :src="user.wechat_avatar" :alt="user.hidden_name" />
                <div v-else class="default-avatar">{{ user.hidden_name.charAt(0) }}</div>
              </div>
              <div class="user-name">{{ user.hidden_name }}</div>
            </div>
          </div>
        </div>
        
        <!-- 高级VIP分红 -->
        <div class="dividend-item" v-if="platformData.dividend_distribution?.vip?.senior?.qualified_count > 0">
          <div class="item-header">
            <div class="item-period">{{ currentMonth.replace('-', '-') }}期高级VIP分红</div>
            <div class="item-amount">按直推占比分配</div>
          </div>
          <div class="qualified-users">
            <div class="user-item" v-for="user in platformData.qualified_users.vip.senior" :key="user.id">
              <div class="user-avatar">
                <img v-if="user.wechat_avatar" :src="user.wechat_avatar" :alt="user.hidden_name" />
                <div v-else class="default-avatar">{{ user.hidden_name.charAt(0) }}</div>
              </div>
              <div class="user-name">{{ user.hidden_name }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 充值分红记录 -->
      <div class="dividend-category">
        <div class="category-title">充值套餐分红</div>
        
        <!-- 初级充值分红 -->
        <div class="dividend-item" v-if="platformData.dividend_distribution?.recharge?.junior?.qualified_count > 0">
          <div class="item-header">
            <div class="item-period">{{ currentMonth.replace('-', '-') }}期初级充值分红</div>
            <div class="item-amount">{{ Number(platformData.dividend_distribution.recharge.junior.per_person || 0).toFixed(2) }}元</div>
          </div>
          <div class="qualified-users">
            <div class="user-item" v-for="user in (platformData.qualified_users.device?.junior || platformData.qualified_users.recharge?.junior || [])" :key="user.id">
              <div class="user-avatar">
                <img v-if="user.wechat_avatar" :src="user.wechat_avatar" :alt="user.hidden_name" />
                <div v-else class="default-avatar">{{ user.hidden_name.charAt(0) }}</div>
              </div>
              <div class="user-name">{{ user.hidden_name }}</div>
            </div>
          </div>
        </div>
        
        <!-- 中级充值分红 -->
        <div class="dividend-item" v-if="platformData.dividend_distribution?.recharge?.middle?.qualified_count > 0">
          <div class="item-header">
            <div class="item-period">{{ currentMonth.replace('-', '-') }}期中级充值分红</div>
            <div class="item-amount">{{ Number(platformData.dividend_distribution.recharge.middle.per_person || 0).toFixed(2) }}元</div>
          </div>
          <div class="qualified-users">
            <div class="user-item" v-for="user in (platformData.qualified_users.device?.middle || platformData.qualified_users.recharge?.middle || [])" :key="user.id">
              <div class="user-avatar">
                <img v-if="user.wechat_avatar" :src="user.wechat_avatar" :alt="user.hidden_name" />
                <div v-else class="default-avatar">{{ user.hidden_name.charAt(0) }}</div>
              </div>
              <div class="user-name">{{ user.hidden_name }}</div>
            </div>
          </div>
        </div>
        
        <!-- 高级充值分红 -->
        <div class="dividend-item" v-if="platformData.dividend_distribution?.recharge?.senior?.qualified_count > 0">
          <div class="item-header">
            <div class="item-period">{{ currentMonth.replace('-', '-') }}期高级充值分红</div>
            <div class="item-amount">按直推占比分配</div>
          </div>
          <div class="qualified-users">
            <div class="user-item" v-for="user in (platformData.qualified_users.device?.senior || platformData.qualified_users.recharge?.senior || [])" :key="user.id">
              <div class="user-avatar">
                <img v-if="user.wechat_avatar" :src="user.wechat_avatar" :alt="user.hidden_name" />
                <div v-else class="default-avatar">{{ user.hidden_name.charAt(0) }}</div>
              </div>
              <div class="user-name">{{ user.hidden_name }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-else-if="!loading && (!platformData.qualified_users || (
      !platformData.dividend_distribution?.vip?.junior?.qualified_count &&
      !platformData.dividend_distribution?.vip?.middle?.qualified_count &&
      !platformData.dividend_distribution?.vip?.senior?.qualified_count &&
      !platformData.dividend_distribution?.recharge?.junior?.qualified_count &&
      !platformData.dividend_distribution?.recharge?.middle?.qualified_count &&
      !platformData.dividend_distribution?.recharge?.senior?.qualified_count
    ))">
      <van-empty
        description="暂无分红记录"
        image="https://fastly.jsdelivr.net/npm/@vant/assets/custom-empty-image.png"
      >
        <template #bottom>
          <div class="empty-tip">
            <p v-if="isCurrentMonth()">{{ getCurrentMonthTip() }}</p>
            <p v-else>暂无该月份的分红记录</p>
          </div>
        </template>
      </van-empty>
    </div>

    <!-- 加载状态 -->
    <div class="loading-container" v-if="loading">
      <van-loading color="#ff4a47" />
      <span class="loading-text">加载中...</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, DropdownMenu, DropdownItem, Tag, Loading, Empty, Popup, Icon } from 'vant'
import { formatDate as formatDateUtil } from '@/utils/date'
import { getVipDividends, getVipDividendsPublic, getVipDividendsAccurate } from '@/api/vip'
import Toast from '@/utils/toast-fix'

const router = useRouter()
const isRefreshing = ref(false)
const loading = ref(false)
const dividendList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

// 月份管理
const currentMonth = ref(new Date().toISOString().slice(0, 7)) // 动态获取当前月份
const thisMonth = new Date().toISOString().slice(0, 7) // 本月
const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7) // 上月

// 权限状态
const hasPermission = ref(true)

// 分红汇总数据
const summaryData = ref({
  totalAmount: '0.00',
  monthAmount: '0.00',
  pendingAmount: '0.00'
})

// 平台统计数据
const platformData = ref({
  month: '',
  platform_stats: {
    total_vip_count: 0,
    month_new_vip_count: 0,
    total_device_count: 0,
    month_new_device_count: 0
  },
  pool_info: {
    vip_pool: 0,
    device_pool: 0,
    total_pool: 0,
    calculation: {
      vip_formula: '',
      device_formula: ''
    }
  },
  qualification_stats: {
    vip: { junior: 0, middle: 0, senior: 0 },
    recharge: { junior: 0, middle: 0, senior: 0 }
  },
  dividend_distribution: {
    vip: {
      junior: { pool: 0, qualified_count: 0, per_person: 0 },
      middle: { pool: 0, qualified_count: 0, per_person: 0 },
      senior: { pool: 0, qualified_count: 0, per_person: '按直推占比分配' }
    },
    recharge: {
      junior: { pool: 0, qualified_count: 0, per_person: 0 },
      middle: { pool: 0, qualified_count: 0, per_person: 0 },
      senior: { pool: 0, qualified_count: 0, per_person: '按直推占比分配' }
    }
  }
})

// 返回上一页
const onClickLeft = () => {
  router.back()
}

// 有数据的月份列表（包含当月和有分红记录的月份）
const availableMonths = (() => {
  const months = []
  const now = new Date()
  // 添加当前月份和前几个月
  for (let i = 0; i < 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    months.push(monthStr)
  }
  return months
})()

// 月份切换相关函数
const canGoPrevious = computed(() => {
  const currentIndex = availableMonths.indexOf(currentMonth.value)
  return currentIndex < availableMonths.length - 1
})

const canGoNext = computed(() => {
  const currentIndex = availableMonths.indexOf(currentMonth.value)
  return currentIndex > 0
})

const switchToPreviousMonth = () => {
  if (canGoPrevious.value) {
    const currentIndex = availableMonths.indexOf(currentMonth.value)
    currentMonth.value = availableMonths[currentIndex + 1]
    currentPage.value = 1
    fetchDividends()
  }
}

const switchToNextMonth = () => {
  if (canGoNext.value) {
    const currentIndex = availableMonths.indexOf(currentMonth.value)
    currentMonth.value = availableMonths[currentIndex - 1]
    currentPage.value = 1
    fetchDividends()
  }
}

const formatMonthDisplay = (month) => {
  if (!month) return ''
  const [year, monthNum] = month.split('-')
  return `${year}年${monthNum}月`
}

const getMonthTypeLabel = (month) => {
  const now = new Date()
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastMonthStr = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`
  
  if (month === currentMonthStr) {
    return '本月'
  } else if (month === lastMonthStr) {
    return '上月'
  } else {
    const [year, monthNum] = month.split('-')
    return `${monthNum}月数据`
  }
}

// 获取平台分红统计数据（此页面专门显示平台分红记录）
const fetchDividends = async () => {
  if (loading.value) return

  loading.value = true
  isRefreshing.value = true

  try {
    // 使用准确的分红统计API
    const accurateParams = {
      month: currentMonth.value // 使用选择的月份
    }

    console.log('开始获取准确VIP分红统计，参数:', accurateParams)
    const publicRes = await getVipDividendsAccurate(accurateParams)
    console.log('获取准确VIP分红统计结果:', publicRes)

    if (publicRes && publicRes.code === 0 && publicRes.data) {
      // 更新平台数据
      platformData.value = publicRes.data
      
      // 设置分红列表数据（平台记录）
      dividendList.value = Array.isArray(publicRes.data.records?.list) ? publicRes.data.records.list : []
      total.value = publicRes.data.records?.total || 0

      // 更新汇总数据（显示平台奖金池信息）
      summaryData.value = {
        totalAmount: (publicRes.data.pool_info?.total_pool || 0).toFixed(2),
        monthAmount: (publicRes.data.pool_info?.vip_pool || 0).toFixed(2),
        pendingAmount: (publicRes.data.pool_info?.device_pool || 0).toFixed(2)
      }

      console.log('平台分红统计数据更新成功:', summaryData.value)
      hasPermission.value = false // 始终显示平台数据，不是个人数据
    } else {
      console.warn('获取平台分红统计返回异常:', publicRes)
      Toast({ type: 'fail', message: '获取分红数据失败' })
    }

  } catch (error) {
    console.error('获取平台分红数据异常:', error)
      Toast({ type: 'fail', message: '获取分红数据失败' })
    
    // 设置默认值
    hasPermission.value = false
    dividendList.value = []
    total.value = 0
    summaryData.value = {
      totalAmount: '0.00',
      monthAmount: '0.00',
      pendingAmount: '0.00'
    }
  } finally {
    loading.value = false
    isRefreshing.value = false
  }
}

// 刷新数据
const refreshData = async () => {
  currentPage.value = 1
  await fetchDividends()
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  try {
    return formatDateUtil(new Date(dateStr), 'YYYY-MM-DD HH:mm')
  } catch (error) {
    return dateStr
  }
}

// 获取类型样式类
const getTypeClass = (type, level) => {
  return `${type}-${level}`
}

// 获取类型标签
const getTypeLabel = (type, level) => {
  const typeMap = {
    'vip': 'VIP招募',
    'recharge': '充值分红'
  }
  const levelMap = {
    'primary': '初级',
    'middle': '中级', 
    'senior': '高级'
  }
  return `${typeMap[type] || type}${levelMap[level] || level}分红`
}

// 获取等级标签
const getLevelLabel = (level) => {
  const levelMap = {
    'primary': '初级分红',
    'middle': '中级分红',
    'senior': '高级分红'
  }
  return levelMap[level] || level
}

// 获取状态类型
const getStatusType = (status) => {
  const statusMap = {
    'pending': 'warning',
    'settled': 'success',
    'cancelled': 'danger'
  }
  return statusMap[status] || 'default'
}

// 获取状态标签
const getStatusLabel = (status) => {
  const statusMap = {
    'pending': '待结算',
    'settled': '已结算',
    'cancelled': '已取消'
  }
  return statusMap[status] || status
}

// 获取本月剩余天数
const getRemainingDays = () => {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return lastDay.getDate() - now.getDate()
}

// 判断是否为当前月份
const isCurrentMonth = () => {
  const now = new Date()
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return currentMonth.value === currentMonthStr
}

// 获取空状态描述
const getEmptyDescription = () => {
  if (isCurrentMonth()) {
    return '分红记录生成中'
  }
  return '暂无分红记录'
}

// 获取空状态图标
const getEmptyImage = () => {
  if (isCurrentMonth()) {
    return 'default'
  }
  return 'search'
}

// 获取当前月份提示
const getCurrentMonthTip = () => {
  const now = new Date()
  const monthNum = now.getMonth() + 1
  return `${monthNum}月份分红记录正在生成中，请耐心等待。平台统计数据已实时更新，分红记录将在月底统一生成。`
}

// 页面加载时获取数据
onMounted(() => {
  fetchDividends()
})
</script>

<style scoped>
.dividend-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 20px;
}

/* 月份选择器 */
.month-selector {
  background-color: #fff;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.month-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 300px;
  margin: 0 auto;
}

.month-nav .van-icon {
  font-size: 20px;
  color: #ff4a47;
  padding: 8px;
  border-radius: 50%;
  background-color: #f8f9fa;
  transition: all 0.3s ease;
}

.month-nav .van-icon:not(.disabled):hover {
  background-color: #ff4a47;
  color: #fff;
  transform: scale(1.1);
}

.month-nav .van-icon.disabled {
  color: #c8c9cc;
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.current-month {
  text-align: center;
  flex: 1;
  margin: 0 20px;
}

.month-text {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 2px;
}

.month-type {
  display: block;
  font-size: 12px;
  color: #ff4a47;
  background-color: rgba(255, 74, 71, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-block;
}

/* 统计概览 */
.summary-card {
  background: linear-gradient(135deg, #ff4a47 0%, #ff7676 100%);
  color: #fff;
  padding: 20px 15px;
  border-radius: 0 0 16px 16px;
  margin-bottom: 15px;
  box-shadow: 0 4px 12px rgba(255, 74, 71, 0.2);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.header-title {
  font-size: 16px;
  font-weight: bold;
}

.month-countdown {
  background-color: rgba(255, 255, 255, 0.2);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.summary-content {
  display: flex;
  justify-content: space-between;
}

.summary-item {
  flex: 1;
  text-align: center;
  transition: transform 0.3s ease;
}

.summary-item.highlight {
  transform: scale(1.05);
}

.summary-value {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}

.summary-label {
  font-size: 12px;
  opacity: 0.9;
}

.summary-divider {
  width: 1px;
  height: 30px;
  background-color: rgba(255, 255, 255, 0.3);
  margin: auto 10px;
}

/* 平台统计信息 */
.platform-stats {
  margin: 15px;
  background-color: #fff;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stats-header {
  margin-bottom: 15px;
  text-align: center;
}

.stats-header .title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.stats-header .subtitle {
  font-size: 12px;
  color: #999;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 15px;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 10px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #ff4a47;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.qualification-stats {
  margin-bottom: 20px;
}

.qualification-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
  text-align: center;
}

.qualification-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.qualification-section {
  background-color: #f8f9fa;
  border-radius: 10px;
  padding: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
  text-align: center;
}

.qualification-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qualification-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.level {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  color: #fff;
  font-weight: 500;
}

.level.junior {
  background: linear-gradient(135deg, #52c41a, #7cb305);
}

.level.middle {
  background: linear-gradient(135deg, #1890ff, #096dd9);
}

.level.senior {
  background: linear-gradient(135deg, #722ed1, #531dab);
}

.count {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.calculation-info {
  background-color: #f0f7ff;
  border-radius: 10px;
  padding: 12px;
}

.calculation-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
  text-align: center;
}

.calculation-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.calculation-item {
  text-align: center;
}

.formula {
  font-size: 12px;
  color: #1890ff;
  background-color: rgba(24, 144, 255, 0.1);
  padding: 6px 10px;
  border-radius: 15px;
  display: inline-block;
}

/* 分红记录标题 */
.records-header {
  padding: 15px 15px 5px;
}

.records-header .title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.records-header .subtitle {
  font-size: 12px;
  color: #999;
}

/* 分红记录列表 */
.dividend-list {
  padding: 0 15px 15px;
}

.dividend-category {
  margin-bottom: 20px;
}

.category-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
  padding-left: 5px;
  border-left: 4px solid #ff4a47;
}

.dividend-item {
  background-color: #fff;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #f0f0f0;
}

.item-period {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.item-amount {
  font-size: 18px;
  font-weight: bold;
  color: #ff4a47;
}

.qualified-users {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.user-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-bottom: 5px;
  overflow: hidden;
  border: 2px solid #f0f0f0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-avatar {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ff4a47, #ff7875);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
}

.user-name {
  font-size: 12px;
  color: #666;
  text-align: center;
  max-width: 50px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 空状态样式 */
.empty-state {
  padding: 20px 15px;
}

.empty-tip {
  margin-top: 10px;
  color: #666;
  font-size: 14px;
  text-align: center;
  line-height: 1.5;
}

.empty-tip .tip-subtitle {
  color: #c8c9cc;
  font-size: 12px;
  margin-top: 5px;
  margin-bottom: 20px;
}

.empty-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 15px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 15px;
  background-color: #f9f9f9;
  border-radius: 10px;
}

.action-item span {
  margin-top: 5px;
  font-size: 12px;
  color: #333;
  font-weight: 500;
}

/* 用户信息样式 */
.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #f0f0f0;
}

.user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  margin-right: 8px;
  object-fit: cover;
  border: 1px solid #eee;
}

.user-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  flex: 1;
}

.user-tag {
  background-color: #ff4a47;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 5px;
}

/* 分页 */
:deep(.van-pagination) {
  margin-top: 20px;
  margin-bottom: 20px;
}

:deep(.van-pagination__item--active) {
  color: #fff;
  background-color: #ff4a47;
}

/* 加载状态 */
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

/* 动画 */
.refresh-loading {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>