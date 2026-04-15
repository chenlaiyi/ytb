<template>
  <div class="dividend-page">
    <van-nav-bar
      title="平台分红明细"
      @click-left="onClickLeft"
      fixed
      placeholder
    >
      <template #left>
        <span style="color: #323233; font-size: 16px; cursor: pointer; display: flex; align-items: center; padding: 0 8px;">
          ←
        </span>
      </template>
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
        <div class="header-title">分支机构分红统计</div>
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
        <div class="title">分支机构分红概况</div>
        <div class="subtitle">{{ platformData.month || new Date().toISOString().slice(0, 7) }} 月度数据</div>
      </div>
      
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">{{ platformData.platform_stats?.total_vip_count || 0 }}</div>
          <div class="stat-label">机构VIP总数</div>
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

    <!-- 分红规则配置 -->
    <div class="dividend-rules" v-if="platformData.dividend_rules">
      <div class="rules-header">
        <div class="title">分支机构分红规则</div>
        <div class="subtitle">{{ platformData.branch_info?.name || '当前分支机构' }}的分红配置</div>
      </div>
      
      <!-- VIP招募分红规则 -->
      <div class="rules-category">
        <div class="category-header">
          <van-icon name="star" color="#ff4a47" />
          <span class="category-title">VIP招募分红规则</span>
        </div>
        
        <div class="rule-items">
          <div class="rule-item" v-if="platformData.dividend_rules.vip_recruitment">
            <div class="rule-level junior">
              <div class="level-badge">初级分红</div>
              <div class="level-requirement">
                达标条件：本月新增VIP ≥ {{ platformData.dividend_rules.vip_recruitment.junior?.requirement || 0 }}人
              </div>
              <div class="level-reward">
                奖金池：每人贡献 ¥{{ Number(platformData.dividend_rules.vip_recruitment.junior?.pool_amount || 0).toFixed(2) }}
              </div>
              <div class="level-description">
                {{ platformData.dividend_rules.vip_recruitment.junior?.description || '' }}
              </div>
            </div>
          </div>
          
          <div class="rule-item" v-if="platformData.dividend_rules.vip_recruitment">
            <div class="rule-level middle">
              <div class="level-badge">中级分红</div>
              <div class="level-requirement">
                达标条件：本月新增VIP ≥ {{ platformData.dividend_rules.vip_recruitment.middle?.requirement || 0 }}人 + 本月有直推
              </div>
              <div class="level-reward">
                奖金池：每人贡献 ¥{{ Number(platformData.dividend_rules.vip_recruitment.middle?.pool_amount || 0).toFixed(2) }}
              </div>
              <div class="level-description">
                {{ platformData.dividend_rules.vip_recruitment.middle?.description || '' }}
              </div>
            </div>
          </div>
          
          <div class="rule-item" v-if="platformData.dividend_rules.vip_recruitment">
            <div class="rule-level senior">
              <div class="level-badge">高级分红</div>
              <div class="level-requirement">
                达标条件：本月新增VIP ≥ {{ platformData.dividend_rules.vip_recruitment.senior?.requirement || 0 }}人 + 本月有直推
              </div>
              <div class="level-reward">
                奖金池：每人贡献 ¥{{ Number(platformData.dividend_rules.vip_recruitment.senior?.pool_amount || 0).toFixed(2) }}
              </div>
              <div class="level-description">
                {{ platformData.dividend_rules.vip_recruitment.senior?.description || '' }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 充值激励分红规则 -->
      <div class="rules-category">
        <div class="category-header">
          <van-icon name="diamond" color="#1890ff" />
          <span class="category-title">充值激励分红规则</span>
        </div>
        
        <div class="rule-items">
          <div class="rule-item" v-if="platformData.dividend_rules.device_recharge">
            <div class="rule-level junior">
              <div class="level-badge">初级分红</div>
              <div class="level-requirement">
                达标条件：本月新增充值 ≥ {{ platformData.dividend_rules.device_recharge.junior?.requirement || 0 }}台
              </div>
              <div class="level-reward">
                奖金池：每台贡献 ¥{{ Number(platformData.dividend_rules.device_recharge.junior?.pool_amount || 0).toFixed(2) }}
              </div>
              <div class="level-description">
                {{ platformData.dividend_rules.device_recharge.junior?.description || '' }}
              </div>
            </div>
          </div>
          
          <div class="rule-item" v-if="platformData.dividend_rules.device_recharge">
            <div class="rule-level middle">
              <div class="level-badge">中级分红</div>
              <div class="level-requirement">
                达标条件：本月新增充值 ≥ {{ platformData.dividend_rules.device_recharge.middle?.requirement || 0 }}台 + 本月有直推
              </div>
              <div class="level-reward">
                奖金池：每台贡献 ¥{{ Number(platformData.dividend_rules.device_recharge.middle?.pool_amount || 0).toFixed(2) }}
              </div>
              <div class="level-description">
                {{ platformData.dividend_rules.device_recharge.middle?.description || '' }}
              </div>
            </div>
          </div>
          
          <div class="rule-item" v-if="platformData.dividend_rules.device_recharge">
            <div class="rule-level senior">
              <div class="level-badge">高级分红</div>
              <div class="level-requirement">
                达标条件：本月新增充值 ≥ {{ platformData.dividend_rules.device_recharge.senior?.requirement || 0 }}台 + 本月有直推
              </div>
              <div class="level-reward">
                奖金池：每台贡献 ¥{{ Number(platformData.dividend_rules.device_recharge.senior?.pool_amount || 0).toFixed(2) }}
              </div>
              <div class="level-description">
                {{ platformData.dividend_rules.device_recharge.senior?.description || '' }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 配置说明 -->
      <div class="config-info" v-if="platformData.dividend_config">
        <div class="config-header">
          <van-icon name="info" color="#666" />
          <span class="config-title">配置说明</span>
        </div>
        <div class="config-content">
          <div class="config-item">
            <span class="config-label">配置状态：</span>
            <span class="config-value" :class="{ 'active': platformData.dividend_config.is_active }">
              {{ platformData.dividend_config.is_active ? '已启用' : '已停用' }}
            </span>
          </div>
          <div class="config-item" v-if="platformData.dividend_config.description">
            <span class="config-label">配置描述：</span>
            <span class="config-value">{{ platformData.dividend_config.description }}</span>
          </div>
          <div class="config-item">
            <span class="config-label">奖金池计算：</span>
            <span class="config-value">每新增1人/台贡献3倍奖金（分别用于初级、中级、高级分红）</span>
          </div>
          <div class="config-item">
            <span class="config-label">分配方式：</span>
            <span class="config-value">初级/中级均分，高级按直推占比分配</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 分红记录标题 -->
    <div class="records-header">
      <div class="title">分支机构分红记录</div>
      <div class="subtitle">查看分支机构分红情况</div>
    </div>

    <!-- 分红记录列表 -->
    <div class="dividend-list" v-if="platformData.qualified_users || platformData.records?.list?.length > 0">
      <!-- VIP分红记录 -->
      <div class="dividend-category">
        <div class="category-title">VIP招募分红</div>
        
        <!-- 初级VIP分红 -->
        <div class="dividend-item" v-if="platformData.dividend_distribution?.vip?.junior?.qualified_count > 0">
          <div class="item-header">
            <div class="item-period">{{ formatMonthDisplay(currentMonth) }}期初级VIP分红</div>
            <div class="item-amount">{{ Number(platformData.dividend_distribution.vip.junior.per_person || 0).toFixed(2) }}元</div>
          </div>
          <div class="qualified-users">
            <div class="user-item" v-for="user in platformData.qualified_users?.vip?.junior || []" :key="user.user_name">
              <div class="user-avatar">
                <img v-if="user.wechat_avatar" :src="user.wechat_avatar" :alt="user.user_name" />
                <div v-else class="default-avatar">{{ user.user_name?.charAt(0) || 'U' }}</div>
              </div>
              <div class="user-name">{{ user.user_name || '未知用户' }}</div>
            </div>
          </div>
        </div>
        
        <!-- 中级VIP分红 -->
        <div class="dividend-item" v-if="platformData.dividend_distribution?.vip?.middle?.qualified_count > 0">
          <div class="item-header">
            <div class="item-period">{{ formatMonthDisplay(currentMonth) }}期中级VIP分红</div>
            <div class="item-amount">{{ Number(platformData.dividend_distribution.vip.middle.per_person || 0).toFixed(2) }}元</div>
          </div>
          <div class="qualified-users">
            <div class="user-item" v-for="user in platformData.qualified_users?.vip?.middle || []" :key="user.user_name">
              <div class="user-avatar">
                <img v-if="user.wechat_avatar" :src="user.wechat_avatar" :alt="user.user_name" />
                <div v-else class="default-avatar">{{ user.user_name?.charAt(0) || 'U' }}</div>
              </div>
              <div class="user-name">{{ user.user_name || '未知用户' }}</div>
            </div>
          </div>
        </div>
        
        <!-- 高级VIP分红 -->
        <div class="dividend-item" v-if="platformData.dividend_distribution?.vip?.senior?.qualified_count > 0">
          <div class="item-header">
            <div class="item-period">{{ formatMonthDisplay(currentMonth) }}期高级VIP分红</div>
            <div class="item-amount">按直推占比分配</div>
          </div>
          <div class="qualified-users">
            <div class="user-item" v-for="user in platformData.qualified_users?.vip?.senior || []" :key="user.id">
              <div class="user-avatar">
                <img v-if="user.wechat_avatar" :src="user.wechat_avatar" :alt="user.hidden_name" />
                <div v-else class="default-avatar">{{ user.hidden_name?.charAt(0) || 'U' }}</div>
              </div>
              <div class="user-name">{{ user.hidden_name || '未知用户' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 充值分红记录 -->
      <div class="dividend-category">
        <div class="category-title">充值激励分红</div>
        
        <!-- 初级充值分红 -->
        <div class="dividend-item" v-if="platformData.dividend_distribution?.recharge?.junior?.qualified_count > 0">
          <div class="item-header">
            <div class="item-period">{{ formatMonthDisplay(currentMonth) }}期初级充值分红</div>
            <div class="item-amount">{{ Number(platformData.dividend_distribution.recharge.junior.per_person || 0).toFixed(2) }}元</div>
          </div>
          <div class="qualified-users">
            <div class="user-item" v-for="user in platformData.qualified_users?.recharge?.junior || []" :key="user.id">
              <div class="user-avatar">
                <img v-if="user.wechat_avatar" :src="user.wechat_avatar" :alt="user.hidden_name" />
                <div v-else class="default-avatar">{{ user.hidden_name?.charAt(0) || 'U' }}</div>
              </div>
              <div class="user-name">{{ user.hidden_name || '未知用户' }}</div>
            </div>
          </div>
        </div>
        
        <!-- 中级充值分红 -->
        <div class="dividend-item" v-if="platformData.dividend_distribution?.recharge?.middle?.qualified_count > 0">
          <div class="item-header">
            <div class="item-period">{{ formatMonthDisplay(currentMonth) }}期中级充值分红</div>
            <div class="item-amount">{{ Number(platformData.dividend_distribution.recharge.middle.per_person || 0).toFixed(2) }}元</div>
          </div>
          <div class="qualified-users">
            <div class="user-item" v-for="user in platformData.qualified_users?.recharge?.middle || []" :key="user.id">
              <div class="user-avatar">
                <img v-if="user.wechat_avatar" :src="user.wechat_avatar" :alt="user.hidden_name" />
                <div v-else class="default-avatar">{{ user.hidden_name?.charAt(0) || 'U' }}</div>
              </div>
              <div class="user-name">{{ user.hidden_name || '未知用户' }}</div>
            </div>
          </div>
        </div>
        
        <!-- 高级充值分红 -->
        <div class="dividend-item" v-if="platformData.dividend_distribution?.recharge?.senior?.qualified_count > 0">
          <div class="item-header">
            <div class="item-period">{{ formatMonthDisplay(currentMonth) }}期高级充值分红</div>
            <div class="item-amount">按直推占比分配</div>
          </div>
          <div class="qualified-users">
            <div class="user-item" v-for="user in platformData.qualified_users?.recharge?.senior || []" :key="user.id">
              <div class="user-avatar">
                <img v-if="user.wechat_avatar" :src="user.wechat_avatar" :alt="user.hidden_name" />
                <div v-else class="default-avatar">{{ user.hidden_name?.charAt(0) || 'U' }}</div>
              </div>
              <div class="user-name">{{ user.hidden_name || '未知用户' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <van-empty 
        image="https://fastly.jsdelivr.net/npm/@vant/assets/custom-empty-image.png" 
        description="暂无分红记录"
      >
        <div class="empty-tip">
          <div>本月还没有分红记录</div>
          <div class="tip-subtitle">分红将在每月初结算发放</div>
          <div class="empty-actions">
            <div class="action-item" @click="router.push('/branch/vip')">
              <van-icon name="star" size="20" color="#ff4a47" />
              <span>去VIP中心</span>
            </div>
            <div class="action-item" @click="router.push('/branch/team')">
              <van-icon name="friends" size="20" color="#1890ff" />
              <span>查看团队</span>
            </div>
            <div class="action-item" @click="router.push('/branch/vip/dividend-debug')" style="background: #f0f0f0; color: #666;">
              <van-icon name="setting" size="20" color="#666" />
              <span>调试工具</span>
            </div>
          </div>
        </div>
      </van-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { showToast } from 'vant'
import request from '@/utils/request'

const router = useRouter()
const userStore = useUserStore()

const isRefreshing = ref(false)
const loading = ref(false)
const dividendList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

// 月份管理
const currentMonth = ref(new Date().toISOString().slice(0, 7)) // 默认显示当前月份
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
const currentDate = new Date()
const currentMonthStr = currentDate.toISOString().slice(0, 7)
const lastMonthStr = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString().slice(0, 7)
const twoMonthsAgoStr = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1).toISOString().slice(0, 7)
const availableMonths = [currentMonthStr, lastMonthStr, twoMonthsAgoStr] // 包含当前月份和有分红记录的月份

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
  // 根据月份返回对应标签
  const currentMonth = new Date().toISOString().slice(0, 7)
  if (month === currentMonth) {
    return '本月'
  } else {
    const [year, monthNum] = month.split('-')
    return `${monthNum}月数据`
  }
}

// 获取分支机构分红统计数据
const fetchDividends = async () => {
  if (loading.value) return

  loading.value = true
  isRefreshing.value = true

  try {
    // 获取分支机构用户ID - 优先从localStorage获取
    let userId = localStorage.getItem('user_id')
    
    // 如果localStorage中没有，尝试从userStore获取
    if (!userId) {
      userId = userStore.userId
    }
    
    // 如果还是没有，尝试从branch_userInfo获取
    if (!userId) {
      try {
        const branchUserInfo = JSON.parse(localStorage.getItem('branch_userInfo') || '{}')
        userId = branchUserInfo.id || branchUserInfo.user_id || branchUserInfo.userId
      } catch (e) {
        console.error('解析branch_userInfo失败:', e)
      }
    }
    
    // 从localStorage获取分支机构代码
    const branchCode = localStorage.getItem('branch_code')
    
    console.log('获取分支机构分红数据参数:', { userId, branchCode, month: currentMonth.value })
    console.log('用户存储状态:', userStore.userInfo)
    console.log('localStorage中的分支机构代码:', localStorage.getItem('branch_code'))
    console.log('localStorage中的用户ID:', localStorage.getItem('user_id'))
    console.log('localStorage中的分支机构用户信息:', localStorage.getItem('branch_userInfo'))
    
    if (!userId) {
      console.error('用户ID为空，用户可能未登录')
      showToast('用户未登录，请先登录')
      // 跳转到分支机构登录页面
      const targetBranchCode = branchCode || 'YXY01'
      router.replace(`/branch-login?branch_code=${targetBranchCode}`)
      return
    }
    
    if (!branchCode) {
      console.error('分支机构代码为空')
      showToast('未找到分支机构信息，请先加入分支机构')
      // 跳转到分支机构页面
      router.replace('/branch')
      return
    }
    
    const response = await request.get('/admin/api/branch-user/dividend_detail.php', {
      params: {
        user_id: userId,
        branch_code: branchCode,
        month: currentMonth.value,
        page: currentPage.value,
        pageSize: pageSize.value
      }
    })
    
    if (response.code === 0 && response.data) {
      // 更新平台数据
      platformData.value = response.data
      
      // 设置分红列表数据
      dividendList.value = Array.isArray(response.data.records?.list) ? response.data.records.list : []
      total.value = response.data.records?.total || 0

      // 更新汇总数据
      summaryData.value = {
        totalAmount: parseFloat(String(response.data.pool_info?.total_pool || '0').replace(/,/g, '')).toFixed(2),
        monthAmount: parseFloat(String(response.data.pool_info?.vip_pool || '0').replace(/,/g, '')).toFixed(2),
        pendingAmount: parseFloat(String(response.data.pool_info?.recharge_pool || '0').replace(/,/g, '')).toFixed(2)
      }

      console.log('分支机构分红统计数据更新成功:', summaryData.value)
      hasPermission.value = false // 显示分支机构数据
    } else {
      console.warn('获取分支机构分红统计返回异常:', response)
      showToast(response.message || '获取分红数据失败')
    }

  } catch (error) {
    console.error('获取分支机构分红数据异常:', error)
    showToast('获取分红数据失败，' + (error.message || '请稍后重试'))
    
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

onMounted(() => {
  fetchDividends()
})
</script>

<style scoped>
.dividend-page {
  background: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 20px;
}

/* 月份选择器样式 */
.month-selector {
  background: linear-gradient(135deg, #ff8a00, #ff6600);
  padding: 20px;
  color: white;
}

.month-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 300px;
  margin: 0 auto;
}

.month-nav .van-icon {
  font-size: 20px;
  padding: 8px;
  cursor: pointer;
  transition: opacity 0.3s;
}

.month-nav .van-icon.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.current-month {
  text-align: center;
  flex: 1;
}

.month-text {
  font-size: 18px;
  font-weight: bold;
  display: block;
}

.month-type {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 2px;
}

/* 统计概览卡片样式 */
.summary-card {
  background: linear-gradient(135deg, #ff4a47, #ff7875);
  margin: 15px;
  border-radius: 15px;
  padding: 20px;
  color: white;
  box-shadow: 0 4px 12px rgba(255, 74, 71, 0.3);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-title {
  font-size: 18px;
  font-weight: bold;
}

.month-countdown {
  font-size: 12px;
  opacity: 0.8;
}

.summary-content {
  display: flex;
  align-items: center;
}

.summary-item {
  flex: 1;
  text-align: center;
}

.summary-item.highlight .summary-value {
  font-size: 22px;
}

.summary-value {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}

.summary-label {
  font-size: 12px;
  opacity: 0.8;
}

.summary-divider {
  width: 1px;
  height: 30px;
  background-color: rgba(255, 255, 255, 0.3);
  margin: 0 15px;
}

/* 平台统计信息样式 */
.platform-stats {
  background: white;
  margin: 15px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stats-header {
  margin-bottom: 20px;
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
  background-color: #f8f9fa;
  border-radius: 10px;
}

.stat-value {
  font-size: 20px;
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
  margin-bottom: 15px;
  text-align: center;
}

.qualification-grid {
  display: flex;
  gap: 15px;
}

.qualification-section {
  flex: 1;
  background-color: #f8f9fa;
  border-radius: 10px;
  padding: 15px;
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

/* 分红规则配置样式 */
.dividend-rules {
  margin: 15px;
  background-color: #fff;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.rules-header {
  background: linear-gradient(135deg, #667eea, #764ba2);
  padding: 20px;
  color: white;
  text-align: center;
}

.rules-header .title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}

.rules-header .subtitle {
  font-size: 13px;
  opacity: 0.9;
}

.rules-category {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.rules-category:last-child {
  border-bottom: none;
}

.category-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  gap: 8px;
}

.category-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.rule-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule-item {
  background-color: #f8f9fa;
  border-radius: 12px;
  padding: 15px;
  border-left: 4px solid transparent;
}

.rule-level.junior .rule-item,
.rule-item:has(.rule-level.junior) {
  border-left-color: #52c41a;
}

.rule-level.middle .rule-item,
.rule-item:has(.rule-level.middle) {
  border-left-color: #1890ff;
}

.rule-level.senior .rule-item,
.rule-item:has(.rule-level.senior) {
  border-left-color: #722ed1;
}

.rule-level {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.level-badge {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.level-requirement {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.level-reward {
  font-size: 13px;
  color: #ff4a47;
  font-weight: 500;
}

.level-description {
  font-size: 12px;
  color: #999;
  line-height: 1.4;
  margin-top: 5px;
  padding: 8px;
  background-color: #fff;
  border-radius: 8px;
  border: 1px dashed #e8e8e8;
}

/* 配置说明样式 */
.config-info {
  padding: 20px;
  background-color: #fafafa;
}

.config-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  gap: 8px;
}

.config-title {
  font-size: 15px;
  font-weight: bold;
  color: #333;
}

.config-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.config-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  line-height: 1.4;
}

.config-label {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
  min-width: 80px;
}

.config-value {
  font-size: 13px;
  color: #333;
  flex: 1;
}

.config-value.active {
  color: #52c41a;
  font-weight: 500;
}

.config-value:not(.active) {
  color: #f5222d;
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

/* 动画 */
.refresh-loading {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style> 