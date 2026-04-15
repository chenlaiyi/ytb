<template>
  <div class="team-page">
    <!-- 显示成员详情 -->
    <div v-if="selectedUserId" class="member-detail-view">
      <van-nav-bar
        :title="memberDetail ? `${memberDetail.name || '用户'}的详情` : '成员详情'"
        left-arrow
        @click-left="goBackToTeamList"
        fixed
        placeholder
      />

      <!-- 成员详情内容 -->
      <div v-if="memberDetail" class="detail-content">
        <!-- 成员信息卡片 -->
        <div class="member-card">
          <div class="member-header">
            <img :src="memberDetail.avatar" alt="头像" class="member-avatar" />
            <div class="member-info">
              <h3 class="member-name">{{ memberDetail.name || '用户' + memberDetail.id }}</h3>
              <p class="member-phone">{{ memberDetail.phone || '未绑定手机' }}</p>
              <div class="member-tags">
                <span v-if="memberDetail.isVip" class="tag vip-tag">VIP会员</span>
                <span v-if="memberDetail.isDirect" class="tag direct-tag">直推</span>
                <span class="tag level-tag">{{ memberDetail.level }}级</span>
              </div>
            </div>
          </div>

          <!-- 基础数据 -->
          <div class="stats-section">
            <div class="stats-row">
              <div class="stats-item">
                <span class="stats-value">{{ memberDetail.joinDays || 0 }}</span>
                <span class="stats-label">加入天数</span>
              </div>
              <div class="stats-item">
                <span class="stats-value">{{ memberDetail.teamCount || 0 }}</span>
                <span class="stats-label">团队人数</span>
              </div>
              <div class="stats-item">
                <span class="stats-value">{{ memberDetail.deviceCount || 0 }}</span>
                <span class="stats-label">设备数量</span>
              </div>
            </div>
          </div>
        </div>

        <!-- VIP招募贡献 -->
        <div class="contribution-card">
          <h4 class="card-title">
            <van-icon name="vip" />
            VIP招募贡献
          </h4>
          <div class="contribution-grid">
            <div class="contribution-item">
              <span class="contribution-value">{{ memberDetail.totalVipCount || 0 }}人</span>
              <span class="contribution-label">累计招募</span>
            </div>
            <div class="contribution-item">
              <span class="contribution-value">{{ memberDetail.monthVipCount || 0 }}人</span>
              <span class="contribution-label">本月招募</span>
            </div>
            <div class="contribution-item">
              <span class="contribution-value">{{ formatAmount(memberDetail.vipDividendPool) }}</span>
              <span class="contribution-label">贡献分红池</span>
            </div>
          </div>
        </div>

        <!-- 充值设备贡献 -->
        <div class="contribution-card">
          <h4 class="card-title">
            <van-icon name="gold-coin" />
            充值设备贡献
          </h4>
          <div class="contribution-grid">
            <div class="contribution-item">
              <span class="contribution-value">{{ memberDetail.totalRechargeCount || 0 }}台</span>
              <span class="contribution-label">累计充值</span>
            </div>
            <div class="contribution-item">
              <span class="contribution-value">{{ memberDetail.monthRechargeCount || 0 }}台</span>
              <span class="contribution-label">本月充值</span>
            </div>
            <div class="contribution-item">
              <span class="contribution-value">{{ formatAmount(memberDetail.rechargeDividendPool) }}</span>
              <span class="contribution-label">贡献分红池</span>
            </div>
          </div>
        </div>

        <!-- 团队结构 -->
        <div class="structure-card">
          <h4 class="card-title">
            <van-icon name="manager" />
            团队结构
          </h4>
          <div class="structure-grid">
            <div class="structure-row">
              <span class="structure-label">直推成员：</span>
              <span class="structure-value">{{ memberDetail.directCount || 0 }}人</span>
            </div>
            <div class="structure-row">
              <span class="structure-label">间推成员：</span>
              <span class="structure-value">{{ (memberDetail.teamCount || 0) - (memberDetail.directCount || 0) }}人</span>
            </div>
            <div class="structure-row">
              <span class="structure-label">最大层级：</span>
              <span class="structure-value">{{ memberDetail.maxLevel || 0 }}层</span>
            </div>
            <div class="structure-row">
              <span class="structure-label">VIP占比：</span>
              <span class="structure-value">{{ calculateVipRatio() }}%</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <van-button 
            type="warning" 
            size="large" 
            round 
            class="action-button"
            @click="viewSubTeam"
          >
            查看下级团队
          </van-button>
        </div>
      </div>

      <!-- 详情加载状态 -->
      <div v-else class="detail-loading">
        <van-loading color="#ff9500" />
        <span>加载成员详情中...</span>
      </div>
    </div>

    <!-- 显示团队列表 -->
    <div v-else class="team-list-view">
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
          <van-button type="primary" size="mini" @click="$router.push('/branch-login')">去登录</van-button>
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
            <div class="team-item" v-for="member in teamList" :key="member.id" @click="viewMemberDetail(member)">
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
                    :type="member.is_vip == 1 ? 'success' : 'warning'"
                    size="mini"
                    class="payment-tag"
                  >
                    {{ member.is_vip == 1 ? '已完款' : '未完款' }}
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
              <van-icon name="arrow" class="team-item-arrow" />
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
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NavBar, Tab, Tabs, Icon, Image as VanImage, Empty, Loading, Pagination, Tag, Button } from 'vant'
import { getBranchVipTeamData, getBranchVipTeamMembers, getBranchTeamDetail } from '@/api/branchVip'
import { showToast } from 'vant'

const router = useRouter()
const route = useRoute()

// 当前选中的用户ID（从URL参数获取）
const selectedUserId = computed(() => route.query.userId)

// 团队列表数据
const teamList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const activeTab = ref('all')
const loading = ref(false)
const isRefreshing = ref(false)

// 成员详情数据
const memberDetail = ref(null)

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

// 获取成员详情
const fetchMemberDetail = async (userId) => {
  try {
    const branchCode = localStorage.getItem('branch_code')
    const currentUserId = localStorage.getItem('user_id') || localStorage.getItem('branch_user_id')
    
    if (!branchCode || !currentUserId) {
      showToast('用户信息不完整，请重新登录')
      return
    }

    const res = await getBranchTeamDetail({
      user_id: currentUserId,
      branch_code: branchCode,
      target_user_id: userId
    })

    if (res.code === 0) {
      memberDetail.value = res.data
    } else {
      showToast('获取成员详情失败')
      console.error('获取成员详情失败:', res.message)
    }
  } catch (error) {
    console.error('获取成员详情失败:', error)
    showToast('网络错误，请重试')
  }
}

// 获取团队统计信息
const fetchTeamStats = async () => {
  try {
    // 获取当前用户ID和分支机构代码
    const userId = localStorage.getItem('user_id') || localStorage.getItem('branch_user_id')
    const branchCode = localStorage.getItem('branch_code')
    
    if (!userId || !branchCode) {
      console.error('[团队页面] 用户信息不完整:', { userId, branchCode })
      hasLoginError.value = true
      showToast({
        message: '用户信息不完整，请重新登录',
        type: 'fail'
      })
      return
    }

    console.log('[团队页面] 调用团队统计API，参数:', { 
      user_id: userId,
      branch_code: branchCode,
      month: 'current' 
    })

    const res = await getBranchVipTeamData({ 
      user_id: userId,
      branch_code: branchCode,
      month: 'current' 
    })
    
    console.log('[团队页面] 团队统计API响应:', res)
    
    if (res.code === 0) {
      const data = res.data || {}
      
      teamStats.value = {
        totalVipCount: data.totalVipCount || 0,
        directVipCount: data.directVipCount || 0,
        monthDirectVipCount: data.monthDirectVipCount || 0,
        monthVipCount: data.monthVipCount || 0,
        totalRechargeCount: data.totalRechargeCount || 0,
        directRechargeCount: data.directRechargeCount || 0,
        monthRechargeCount: data.monthTeamRechargeCount || 0,
        monthDirectRechargeCount: data.monthDirectRechargeCount || 0,
        queryMonth: data.queryMonth || '本月',
        queryMonthValue: data.queryMonthValue || ''
      }
      
      statsLoaded.value = true
      hasLoginError.value = false
    } else {
      console.error('获取团队统计失败:', res.message || res)
      hasLoginError.value = true
      showToast({
        message: res.message || '获取团队统计失败',
        type: 'fail'
      })
    }
  } catch (error) {
    console.error('获取团队统计失败:', error)
    hasLoginError.value = true
    showToast({
      message: '网络错误，请重试',
      type: 'fail'
    })
  }
}

// 获取团队成员列表
const fetchTeamMembers = async (reset = false) => {
  if (loading.value) return
  
  loading.value = true
  
  try {
    if (reset) {
      currentPage.value = 1
      teamList.value = []
    }

    // 获取当前用户ID和分支机构代码
    const userId = localStorage.getItem('user_id') || localStorage.getItem('branch_user_id')
    const branchCode = localStorage.getItem('branch_code')
    
    if (!userId || !branchCode) {
      console.error('[团队页面] 获取成员列表时用户信息不完整:', { userId, branchCode })
      hasLoginError.value = true
      showToast({
        message: '用户信息不完整，请重新登录',
        type: 'fail'
      })
      return
    }

    const apiParams = {
      user_id: userId,
      branch_code: branchCode,
      type: activeTab.value,
      page: currentPage.value,
      pageSize: pageSize.value
    }

    console.log('[团队页面] 调用团队成员API，参数:', apiParams)

    const res = await getBranchVipTeamMembers(apiParams)

    console.log('[团队页面] 团队成员API响应:', res)

    if (res.code === 0) {
      const data = res.data || {}
      
      if (reset) {
        teamList.value = data.members || []
      } else {
        teamList.value = [...teamList.value, ...(data.members || [])]
      }
      
      total.value = data.total || 0
      hasLoginError.value = false
    } else {
      console.error('获取团队成员失败:', res.message || res)
      showToast({
        message: res.message || '获取团队成员失败',
        type: 'fail'
      })
    }
  } catch (error) {
    console.error('获取团队成员失败:', error)
    showToast({
      message: '网络错误，请重试',
      type: 'fail'
    })
  } finally {
    loading.value = false
  }
}

// Tab切换处理
const handleTabChange = (name) => {
  activeTab.value = name
  fetchTeamMembers(true)
}

// 分页处理
const handlePageChange = (page) => {
  currentPage.value = page
  fetchTeamMembers()
}

// 查看成员详情
const viewMemberDetail = (member) => {
  // 使用query参数而不是跳转到新路由
  router.push({
    path: '/branch/vip/team',
    query: { userId: member.id }
  })
}

// 返回团队列表
const goBackToTeamList = () => {
  router.push({
    path: '/branch/vip/team'
  })
}

// 查看下级团队
const viewSubTeam = () => {
  // 跳转到以该成员为主的团队页面
  router.push({
    path: '/branch/vip/team',
    query: { userId: memberDetail.value.id, viewTeam: 'sub' }
  })
}

// 计算VIP占比
const calculateVipRatio = () => {
  if (!memberDetail.value || !memberDetail.value.teamCount) return 0
  const vipCount = memberDetail.value.vipCount || 0
  const teamCount = memberDetail.value.teamCount || 0
  return teamCount > 0 ? Math.round((vipCount / teamCount) * 100) : 0
}

// 格式化金额
const formatAmount = (amount) => {
  if (!amount) return '¥0.00'
  return `¥${(amount / 100).toFixed(2)}`
}

// 刷新数据
const refreshData = async () => {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  
  try {
    if (selectedUserId.value) {
      // 如果在详情页面，刷新详情数据
      await fetchMemberDetail(selectedUserId.value)
    } else {
      // 如果在列表页面，刷新列表数据
      await Promise.all([
        fetchTeamStats(),
        fetchTeamMembers(true)
      ])
    }
    showToast('刷新成功')
  } catch (error) {
    console.error('刷新失败:', error)
    showToast('刷新失败')
  } finally {
    isRefreshing.value = false
  }
}

// 监听selectedUserId变化
watch(selectedUserId, (newUserId) => {
  if (newUserId) {
    // 显示成员详情
    fetchMemberDetail(newUserId)
  } else {
    // 显示团队列表
    memberDetail.value = null
  }
})

// 监听activeTab变化
watch(activeTab, () => {
  if (!selectedUserId.value) {
    fetchTeamMembers(true)
  }
})

// 初始化
onMounted(async () => {
  // 检查用户登录状态
  const userId = localStorage.getItem('user_id') || localStorage.getItem('branch_user_id')
  const branchCode = localStorage.getItem('branch_code')
  const isBranch = localStorage.getItem('isBranch')
  
  console.log('[团队页面] 初始化检查用户信息:')
  console.log('userId:', userId)
  console.log('branchCode:', branchCode)
  console.log('isBranch:', isBranch)
  
  if (!userId || !branchCode || isBranch !== '1') {
    console.error('[团队页面] 用户信息不完整，请重新登录')
    hasLoginError.value = true
    
    // 显示错误提示
    showToast({
      message: '登录信息已过期，请重新登录',
      type: 'fail',
      duration: 3000
    })
    
    // 3秒后跳转到登录页面
    setTimeout(() => {
      router.push('/branch/login')
    }, 3000)
    return
  }
  
  try {
    if (selectedUserId.value) {
      // 如果URL包含userId，显示成员详情
      await fetchMemberDetail(selectedUserId.value)
    } else {
      // 否则显示团队列表
      await Promise.all([
        fetchTeamStats(),
        fetchTeamMembers(true)
      ])
    }
  } catch (error) {
    console.error('[团队页面] 初始化失败:', error)
    hasLoginError.value = true
    showToast({
      message: '加载失败，请重试',
      type: 'fail'
    })
  }
})
</script>

<style scoped>
.team-page {
  min-height: 100vh;
  background: #f5f5f5;
}

/* ===== 成员详情页面样式 ===== */
.member-detail-view {
  min-height: 100vh;
  background: #f5f5f5;
}

.detail-content {
  padding: 16px;
}

/* 成员信息卡片 */
.member-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
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
  margin-right: 16px;
  object-fit: cover;
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px 0;
}

.member-phone {
  font-size: 14px;
  color: #666;
  margin: 0 0 8px 0;
}

.member-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.vip-tag {
  background: linear-gradient(135deg, #ff9500, #ff6b35);
  color: white;
}

.direct-tag {
  background: linear-gradient(135deg, #52c41a, #389e0d);
  color: white;
}

.level-tag {
  background: linear-gradient(135deg, #1890ff, #096dd9);
  color: white;
}

/* 统计区块 */
.stats-section .stats-row {
  display: flex;
  justify-content: space-around;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.stats-section .stats-item {
  text-align: center;
}

.stats-section .stats-value {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: #ff9500;
  margin-bottom: 4px;
}

.stats-section .stats-label {
  display: block;
  font-size: 12px;
  color: #666;
}

/* 贡献卡片 */
.contribution-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.card-title .van-icon {
  color: #ff9500;
  font-size: 18px;
}

.contribution-grid {
  display: flex;
  justify-content: space-around;
  text-align: center;
}

.contribution-item {
  flex: 1;
}

.contribution-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #ff9500;
  margin-bottom: 4px;
}

.contribution-label {
  display: block;
  font-size: 12px;
  color: #666;
}

/* 团队结构卡片 */
.structure-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.structure-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.structure-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.structure-row:last-child {
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
.action-buttons {
  margin-top: 20px;
  padding: 0 20px 20px;
}

.action-button {
  width: 100%;
  background: linear-gradient(135deg, #ff9500, #ff6b35);
  border: none;
  font-weight: 600;
}

/* 详情加载状态 */
.detail-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  gap: 16px;
  color: #666;
}

/* ===== 团队列表页面样式 ===== */
.team-list-view {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 统计卡片容器 */
.stats-container {
  padding: 16px;
  background: white;
  margin-bottom: 8px;
}

.login-prompt {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  background: #fff3cd;
  border-radius: 8px;
  color: #856404;
}

.prompt-icon {
  color: #f39c12;
}

.prompt-text {
  font-size: 14px;
}

/* 统计行 */
.stats-row {
  display: flex;
  gap: 16px;
}

.stats-section {
  flex: 1;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px;
  padding: 16px;
  color: white;
}

.vip-section {
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
}

.recharge-section {
  background: linear-gradient(135deg, #4ecdc4, #44a08d);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.section-icon {
  font-size: 16px;
  color: white;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: white;
}

.stats-grid {
  display: flex;
  justify-content: space-around;
  text-align: center;
}

.stats-item {
  flex: 1;
}

.stats-section .stats-value {
  display: block;
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 4px;
  color: white !important;
}

.stats-section .stats-label {
  display: block;
  font-size: 12px;
  color: white !important;
}

/* 内容区域 */
.team-content {
  padding: 16px;
}

/* 团队列表 */
.team-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.team-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.team-item:active {
  transform: translateY(1px);
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

.member-avatar {
  position: relative;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.member-level {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #ff4757;
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 8px;
  min-width: 16px;
  text-align: center;
  line-height: 1;
  z-index: 1;
}

.member-info {
  flex: 1;
  margin-right: 12px;
}

.member-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.payment-tag {
  font-size: 10px !important;
}

.member-date {
  font-size: 12px;
  color: #666;
}

.member-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 8px;
}

.member-stats .stats-item {
  text-align: center;
}

.member-stats .stats-value {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.member-stats .stats-label {
  display: block;
  font-size: 10px;
  color: #666;
}

.stats-divider {
  width: 1px;
  height: 20px;
  background: #e8e8e8;
}

.team-item-arrow {
  color: #ddd;
  font-size: 16px;
}

/* 加载状态 */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  color: #666;
}

.loading-text {
  font-size: 14px;
}

/* 刷新图标动画 */
.refresh-loading {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式适配 */
@media (max-width: 375px) {
  .stats-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .contribution-grid {
    flex-direction: column;
    gap: 12px;
    text-align: left;
  }
  
  .contribution-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style> 