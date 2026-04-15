<template>
  <div class="salesman-container">
    <div class="biz-tabs-wrapper">
      <van-tabs
        v-model:active="activeBizTab"
        shrink
        line-width="24"
        line-height="3"
        title-active-color="#0f8dff"
        title-inactive-color="#8ba0b4"
        background="transparent"
      >
        <van-tab title="净水器业务" name="water"></van-tab>
        <van-tab name="payment">
          <template #title>
            <span>支付业务</span>
            <van-tag
              v-if="paymentSalesmen.length"
              type="primary"
              size="mini"
              round
              class="ml6"
            >
              {{ paymentSalesmen.length }}
            </van-tag>
          </template>
        </van-tab>
      </van-tabs>
    </div>

    <div class="content">
      <!-- 业绩概览卡片 -->
      <div class="performance-card" v-show="activeBizTab === 'water'">
        <div class="card-header">
          <div class="avatar-box">
            <VanImage
              round
              width="50"
              height="50"
              :src="salesmanInfo.avatar || userStore.userAvatar || '/app/images/profile/default-avatar.png'"
              error-icon="contact"
              fit="cover"
              show-loading
              loading-icon="photo-o"
            />
          </div>
          <div class="info-box">
            <div class="name">{{ salesmanInfo.name || userStore.userName || '业务员' }}</div>
            <div class="title">{{ salesmanInfo.title || '业务员' }}</div>
            <div class="id">编号: {{ userStore.userInfo?.id || salesmanInfo.userId || '-' }}</div>
          </div>
        </div>
        <div class="card-body">
          <div class="stats-item">
            <div class="value">{{ statsInfo.todaySales || '0' }}</div>
            <div class="label">今日销量</div>
          </div>
          <div class="divider"></div>
          <div class="stats-item">
            <div class="value">{{ statsInfo.monthSales || '0' }}</div>
            <div class="label">本月销量</div>
          </div>
          <div class="divider"></div>
          <div class="stats-item">
            <div class="value">{{ statsInfo.totalSales || '0' }}</div>
            <div class="label">累计销量</div>
            <div class="self-use-badge" v-if="statsInfo.selfUseDevices && statsInfo.selfUseDevices != '0'">
              (自用设备: {{ statsInfo.selfUseDevices }})
            </div>
          </div>
        </div>
      </div>
      
      <!-- 支付业务员卡片 -->
      <div v-if="activeBizTab === 'payment'" class="payment-card">
        <template v-if="hasPaymentData">
          <div class="payment-hero">
            <div class="hero-header">
              <div>
                <div class="hero-name">{{ (paymentPrimary && paymentPrimary.name) || userStore.userName || '支付业务员' }}</div>
                <div class="hero-meta">机构：{{ (paymentPrimary && paymentPrimary.channel_name) || '—' }} · 编号：{{ (paymentPrimary && paymentPrimary.code) || '—' }}</div>
              </div>
              <van-tag v-if="paymentPrimary" :type="paymentStatusTag(paymentPrimary.status)" round size="small">
                {{ paymentPrimary.status_text || '未知' }}
              </van-tag>
            </div>
            <div class="hero-invite">
              <span>邀请码：{{ (paymentPrimary && paymentPrimary.invitation_code) || '未生成' }}</span>
              <VanButton size="mini" type="primary" plain @click="copyInviteCode">复制</VanButton>
            </div>
            <div class="hero-stats">
              <div class="hero-stat">
                <div class="label">商户总数</div>
                <div class="value">{{ paymentMerchantStats.total_merchants }}</div>
              </div>
              <div class="hero-stat">
                <div class="label">已激活</div>
                <div class="value">{{ paymentMerchantStats.active_merchants }}</div>
              </div>
              <div class="hero-stat">
                <div class="label">待审核</div>
                <div class="value">{{ paymentMerchantStats.pending_merchants }}</div>
              </div>
              <div class="hero-stat">
                <div class="label">本月新增</div>
                <div class="value">{{ paymentMerchantStats.month_new_merchants }}</div>
              </div>
            </div>
          </div>

          <div class="payment-summary" v-if="paymentSalesmen.length">
            <div class="summary-item">
              <div class="label">累计流水</div>
              <div class="value">¥{{ paymentOverview.total }}</div>
            </div>
            <div class="summary-item">
              <div class="label">分润总额</div>
              <div class="value">¥{{ paymentOverview.withdrawable }}</div>
            </div>
            <div class="summary-item">
              <div class="label">处理中</div>
              <div class="value">{{ paymentOverview.pendingCount }} 笔</div>
            </div>
            <div class="summary-item date-filter">
              <div class="label">时间筛选</div>
              <div class="value quick-buttons">
                <span
                  v-for="opt in paymentDateOptions"
                  :key="opt.value"
                  :class="['quick-btn', { active: paymentDateQuick === opt.value }]"
                  @click="setDateRangeByQuick(opt.value)"
                >
                  {{ opt.label }}
                </span>
                <span class="date-text" v-if="paymentDateRange.length">
                  {{ paymentDateRange[0] }} ~ {{ paymentDateRange[1] }}
                </span>
              </div>
            </div>
          </div>

          <div class="merchant-summary-card">
            <div class="card-title">
              <span>商户概况</span>
              <span class="card-subtitle">本月新增 {{ paymentMerchantStats.month_new_merchants }} 家</span>
            </div>
            <div class="merchant-metrics">
              <div class="merchant-metric">
                <div class="label">商户总数</div>
                <div class="value">{{ paymentMerchantStats.total_merchants }}</div>
              </div>
              <div class="merchant-metric">
                <div class="label">已激活</div>
                <div class="value success">{{ paymentMerchantStats.active_merchants }}</div>
              </div>
              <div class="merchant-metric">
                <div class="label">待审核</div>
                <div class="value warning">{{ paymentMerchantStats.pending_merchants }}</div>
              </div>
            </div>
          </div>

          <div class="merchant-list-card">
            <div class="card-title">
              <span>商户列表</span>
              <span class="card-subtitle">共 {{ paymentMerchantStats.total_merchants }} 家</span>
            </div>
            <div v-if="paymentMerchantList.length" class="merchant-list">
              <div v-for="merchant in paginatedMerchantList" :key="merchant.id" class="merchant-item">
                <div class="merchant-row header">
                  <div>
                    <div class="merchant-name">{{ merchant.merchant_name }}</div>
                    <div class="merchant-id">编号：{{ merchant.merchant_id || '—' }}</div>
                  </div>
                  <div class="merchant-tags">
                    <span class="status-pill" :data-type="merchant.status">{{ merchant.status_text }}</span>
                    <span class="status-pill" :data-activate="merchant.activate_status">{{ merchant.activate_status_text }}</span>
                  </div>
                </div>
                <div class="merchant-row meta">
                  <div class="merchant-meta">{{ merchant.province || '' }} {{ merchant.city || '' }}</div>
                  <div class="merchant-amount">累计交易 ¥{{ merchant.transaction_amount }}</div>
                </div>
                <div class="merchant-updated">最近更新 {{ merchant.updated_at || '—' }}</div>
              </div>
              <Pagination
                v-if="paymentMerchantList.length > merchantPageSize"
                v-model="merchantPage"
                :total-items="paymentMerchantList.length"
                :items-per-page="merchantPageSize"
                mode="simple"
                class="merchant-pagination"
              />
            </div>
            <div v-else class="merchant-empty">
              <Icon name="shop-o" size="32" color="#d1d1d1" />
              <div>暂无商户进件</div>
            </div>
          </div>

        </template>
        <div v-else class="empty-payment">
          <Icon name="balance-o" size="40" color="#cccccc" />
          <div>未匹配到支付业务员</div>
          <div class="empty-tip">请确认手机号在支付系统业务员中已登记</div>
        </div>
      </div>

      <!-- 提成收入卡片 -->
      <div class="commission-card" v-show="activeBizTab === 'water'">
        <div class="card-title">
          <span>提成收入</span>
          <router-link to="/salesman/commission" class="more">查看明细 <Icon name="arrow" /></router-link>
        </div>
        <div class="commission-overview">
          <div class="commission-item">
            <div class="amount">¥{{ commissionInfo.pendingAmount || '0.00' }}</div>
            <div class="label">待结算</div>
          </div>
          <div class="commission-item">
            <div class="amount">¥{{ commissionInfo.monthAmount || '0.00' }}</div>
            <div class="label">本月提成</div>
          </div>
          <div class="commission-item">
            <div class="amount">¥{{ commissionInfo.totalAmount || '0.00' }}</div>
            <div class="label">累计提成</div>
          </div>
        </div>
      </div>
      
      <!-- 功能区 -->
      <div class="function-card" v-show="activeBizTab === 'water'">
        <div class="card-title">业务功能</div>
        <Grid :column-num="4" :border="false" square>
          <GridItem v-for="(feature, index) in features" :key="index" :to="feature.path">
            <Icon :name="feature.icon" size="28" :color="feature.color" />
            <div class="text">{{ feature.name }}</div>
          </GridItem>
        </Grid>
      </div>
      
      <!-- 任务与目标 -->
      <div class="task-card" v-show="activeBizTab === 'water'">
        <div class="card-title">
          <span>销售目标</span>
          <div class="target-date">{{ targetDate }}</div>
        </div>
        <div class="task-progress">
          <div class="progress-header">
            <div class="progress-title">本月销售目标</div>
            <div class="progress-value">{{ statsInfo.monthSales || '0' }}/{{ targetInfo.monthTarget || '0' }}</div>
          </div>
          <Progress
            :percentage="monthProgressPercentage"
            :show-pivot="false"
            stroke-width="10"
            color="#1989fa"
          />
          <div class="progress-info">
            <div>距离目标还差 {{ targetInfo.monthTarget - statsInfo.monthSales || '0' }} 台</div>
            <div>完成率 {{ monthProgressPercentage }}%</div>
          </div>
        </div>
        
        <div class="task-progress">
          <div class="progress-header">
            <div class="progress-title">年度销售目标</div>
            <div class="progress-value">{{ statsInfo.yearSales || '0' }}/{{ targetInfo.yearTarget || '0' }}</div>
          </div>
          <Progress
            :percentage="yearProgressPercentage"
            :show-pivot="false"
            stroke-width="10"
            color="#07c160"
          />
          <div class="progress-info">
            <div>距离目标还差 {{ targetInfo.yearTarget - statsInfo.yearSales || '0' }} 台</div>
            <div>完成率 {{ yearProgressPercentage }}%</div>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { NavBar, Image as VanImage, Icon, Grid, GridItem, Progress, Tag as VanTag, Tabs, Tab, Button as VanButton, Pagination, Popup } from 'vant'

import Toast from '@/utils/toast-fix'
import { getSalesmanWorkspace } from '@/api/user'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

// 获取路由实例
const router = useRouter()

// 获取用户信息存储
const userStore = useUserStore()

// 业务员信息
const salesmanInfo = ref({
  name: '',
  avatar: '',
  title: '业务员',
  userId: ''
})

const paymentSalesmen = ref([])
const activeBizTab = ref('payment') // 优先展示支付业务

const paymentPrimary = computed(() => (paymentSalesmen.value.length ? paymentSalesmen.value[0] : null))
const paymentMerchantStats = computed(() => {
  if (paymentPrimary.value && paymentPrimary.value.merchant_stats) {
    return paymentPrimary.value.merchant_stats
  }
  return {
    total_merchants: 0,
    active_merchants: 0,
    pending_merchants: 0,
    month_new_merchants: 0
  }
})
const paymentMerchantList = computed(() => {
  if (paymentPrimary.value && Array.isArray(paymentPrimary.value.merchant_list)) {
    return paymentPrimary.value.merchant_list
  }
  return []
})
const hasPaymentData = computed(() => paymentSalesmen.value.length > 0 || paymentMerchantList.value.length > 0)

const merchantPage = ref(1)
const merchantPageSize = 4
const paginatedMerchantList = computed(() => {
  const start = (merchantPage.value - 1) * merchantPageSize
  return paymentMerchantList.value.slice(start, start + merchantPageSize)
})

// 支付统计时间筛选
const paymentDateRange = ref([])
const paymentDateQuick = ref('30d')
const paymentDateOptions = [
  { label: '近7天', value: '7d' },
  { label: '近30天', value: '30d' },
  { label: '本月', value: 'month' }
]

const setDateRangeByQuick = (val) => {
  const end = new Date()
  let start = new Date()
  if (val === '7d') start.setDate(end.getDate() - 6)
  else if (val === '30d') start.setDate(end.getDate() - 29)
  else if (val === 'month') start = new Date(end.getFullYear(), end.getMonth(), 1)
  paymentDateRange.value = [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)]
  paymentDateQuick.value = val
}

watch(paymentMerchantList, () => {
  merchantPage.value = 1
})

const paymentOverview = computed(() => {
  if (!paymentSalesmen.value.length) {
    return { total: '0.00', withdrawable: '0.00', pendingCount: 0 }
  }
  const total = paymentSalesmen.value.reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0)
  const withdrawable = paymentSalesmen.value.reduce((sum, item) => sum + parseFloat(item.withdrawable_amount || 0), 0)
  const pendingCount = paymentSalesmen.value.reduce((sum, item) => sum + (parseInt(item.pending_withdraw_count || 0, 10)), 0)
  return {
    total: total.toFixed(2),
    withdrawable: withdrawable.toFixed(2),
    pendingCount
  }
})

// 销售统计
const statsInfo = ref({
  todaySales: '0',
  monthSales: '0',
  yearSales: '0',
  totalSales: '0',
  selfUseDevices: '0'
})

// 提成信息
const commissionInfo = ref({
  pendingAmount: '0.00',
  monthAmount: '0.00',
  totalAmount: '0.00'
})

// 目标信息
const targetInfo = ref({
  monthTarget: 30,
  yearTarget: 360
})

// 目标日期
const targetDate = ref('')

// 计算月度进度百分比
const monthProgressPercentage = computed(() => {
  const sales = parseFloat(statsInfo.value.monthSales) || 0
  const target = parseFloat(targetInfo.value.monthTarget) || 1
  return Math.min(Math.floor((sales / target) * 100), 100)
})

// 计算年度进度百分比
const yearProgressPercentage = computed(() => {
  const sales = parseFloat(statsInfo.value.yearSales) || 0
  const target = parseFloat(targetInfo.value.yearTarget) || 1
  return Math.min(Math.floor((sales / target) * 100), 100)
})

// 功能列表

const paymentStatusTag = (status) => {
  switch (status) {
    case 1: return 'success'
    case 2: return 'danger'
    case 3: return 'warning'
    case 4: return 'warning'
    default: return 'default'
  }
}
const features = ref([
  { name: '邀请安装', icon: 'orders-o', path: '/salesman/invite-install', color: '#1989fa' },
  { name: '我的客户', icon: 'friends-o', path: '/salesman/clients', color: '#ff9500' },
  { name: '目标管理', icon: 'flag-o', path: '/salesman/targets', color: '#07c160' },
  { name: '升级VIP', icon: 'vip-card-o', path: '/salesman/products', color: '#ffd700' }
])


// 获取当前年月
const getCurrentDate = () => {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月`
}

// 获取业务员工作台数据 - 简化版本，只依赖V1 API
const fetchSalesmanData = async () => {
  try {
    Toast.loading({
      message: '加载中...',
      forbidClick: true,
      duration: 0
    })
    
    console.log('开始获取业务员工作台数据...')
    console.log('当前用户信息:', userStore.userInfo)

    // 获取用户ID
    const userId = userStore.userInfo?.id || userStore.userId
    console.log('使用的用户ID:', userId)

    const response = await getSalesmanWorkspace({
      user_id: userId,
      start_date: paymentDateRange.value?.[0],
      end_date: paymentDateRange.value?.[1],
    })
    
    if (response && response.code === 0 && response.data) {
      console.log('成功获取业务员工作台数据:', response.data)
      console.log('API返回的commissionInfo数据:', response.data.commissionInfo)
      
      const data = response.data
      
      // 更新业务员信息
      salesmanInfo.value = {
        name: data.userInfo?.name || userStore.userName || '业务员',
        avatar: data.userInfo?.avatar || userStore.userAvatar || '/app/images/profile/default-avatar.png',
        title: data.userInfo?.title || '业务员',
        userId: data.userInfo?.id || data.userInfo?.employeeId || userStore.userInfo?.id || ''
      }
      
      // 支付业务员列表
      paymentSalesmen.value = data.paymentSalesmen || data.payment_salesmen || []
      
      statsInfo.value = {
        todaySales: String(data.salesInfo?.todaySales || '0'),
        monthSales: String(data.salesInfo?.currentMonthSales || '0'),
        yearSales: String(data.salesInfo?.totalSales || '0'), // V1暂时用总销量代替年销量
        totalSales: String(data.salesInfo?.totalSales || '0'),
        selfUseDevices: String(data.salesInfo?.selfUseDevices || '0')
      }
      
      // 更新提成信息 - 兼容多种API返回格式
      let newCommissionInfo = {
        pendingAmount: '0.00',
        monthAmount: '0.00',
        totalAmount: '0.00'
      }

      // 优先使用标准格式的commissionInfo
      if (data.commissionInfo) {
        newCommissionInfo = {
          pendingAmount: data.commissionInfo.pendingAmount || '0.00',
          monthAmount: data.commissionInfo.monthAmount || '0.00',
          totalAmount: data.commissionInfo.totalAmount || data.commissionInfo.totalCommission || '0.00'
        }
      }
      // 回退到commission_stats格式
      else if (data.commission_stats) {
        newCommissionInfo = {
          pendingAmount: data.commission_stats.pending || '0.00',
          monthAmount: data.commission_stats.personal_monthly || '0.00',
          totalAmount: data.commission_stats.personal_total || '0.00'
        }
      }

      console.log('API返回的原始佣金数据:', data.commissionInfo || data.commission_stats)
      console.log('设置新的提成信息:', newCommissionInfo)
      commissionInfo.value = newCommissionInfo
      
      // 更新目标信息 - V1 API暂时没有返回目标信息，使用默认值
      targetInfo.value = {
        monthTarget: 30,
        yearTarget: 360
      }
      
      // 更新目标日期
      targetDate.value = getCurrentDate()
      
      Toast.clear()
      
    } else {
      console.error('V1 API返回数据格式错误:', response)
      Toast({ type: 'fail', message: response?.message || '获取业务员数据失败' })
    }
    
  } catch (error) {
    console.error('获取业务员工作台数据失败:', error)
    Toast.clear()
    
    // 检查是否是认证相关错误
    if (error.message && (error.message.includes('登录') || error.message.includes('授权') || error.message.includes('token'))) {
      Toast({ type: 'fail', message: '登录已过期，请重新登录' })
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } else {
      Toast({ type: 'fail', message: '获取数据失败，请稍后重试' })
    }
  }
}

onMounted(() => {
  console.log('业务中心页面加载，准备获取用户数据')
  
  // 页面加载时获取业务员数据
  fetchSalesmanData()
})

const copyInviteCode = async () => {
  const code = paymentPrimary.value && paymentPrimary.value.invitation_code
  if (!code) {
    Toast({ type: 'fail', message: '暂无邀请码' })
    return
  }
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(code)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = code
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'absolute'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    Toast({ type: 'success', message: '邀请码已复制' })
  } catch (error) {
    console.error('复制邀请码失败', error)
    Toast({ type: 'fail', message: '复制失败，请手动复制' })
  }
}
</script>

<style scoped>
.biz-tabs-wrapper {
  padding: 8px 16px 0;
}
.van-tabs {
  background: transparent;
}
.biz-tabs-wrapper .van-tab {
  font-weight: 500;
}
.salesman-container {
  padding-top: 8px;
}
.payment-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: transparent;
  box-shadow: none;
  padding: 0;
  margin-bottom: 16px;
}
.payment-hero {
  background: linear-gradient(135deg,#0b77ff,#12c2e9);
  border-radius: 12px;
  padding: 16px;
  color: #fff;
  box-shadow: 0 10px 25px rgba(7,141,255,0.18);
}
.hero-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.hero-name {
  font-size: 20px;
  font-weight: 600;
}
.hero-meta {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 4px;
}
.hero-invite {
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}
.hero-stats {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.hero-stat {
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255,255,255,0.18);
  backdrop-filter: blur(4px);
  border-radius: 12px;
  padding: 12px;
  color: #fff;
}
.hero-stat .label {
  font-size: 12px;
  color: rgba(255,255,255,0.85);
}
.hero-stat .value {
  font-size: 20px;
  font-weight: 700;
  margin-top: 2px;
}
.payment-summary {
  display: flex;
  justify-content: space-between;
  background: linear-gradient(135deg,#0b77ff,#1199ff);
  border-radius: 10px;
  padding: 12px 16px;
  color: #fff;
  margin: 0;
  box-shadow: 0 2px 10px rgba(15,141,255,0.2);
}
.payment-summary .summary-item {
  flex: 1;
  text-align: center;
}
.payment-summary .label {
  font-size: 12px;
  color: rgba(255,255,255,0.85);
}
.payment-summary .value {
  font-size: 20px;
  font-weight: 700;
  margin-top: 2px;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
.empty-payment {
  text-align: center;
  color: #999;
  padding: 30px 0;
}
.empty-payment .empty-tip {
  margin-top: 6px;
}

.merchant-summary-card,
.merchant-list-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 6px 18px rgba(12, 84, 123, 0.06);
}
.merchant-metrics {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
}
.merchant-metric {
  flex: 1;
  text-align: center;
}
.merchant-metric .label {
  font-size: 12px;
  color: #8c8ca1;
}
.merchant-metric .value {
  font-size: 20px;
  font-weight: 600;
  margin-top: 4px;
  color: #1f2c3f;
}
.merchant-metric .value.success {
  color: #00b894;
}
.merchant-metric .value.warning {
  color: #ffb347;
}
.merchant-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.merchant-item {
  padding: 12px;
  border: 1px solid #f0f1f5;
  border-radius: 12px;
}
.merchant-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.merchant-row.meta {
  margin-top: 10px;
  font-size: 13px;
  color: #6b6c7b;
}
.merchant-tags {
  display: flex;
  gap: 6px;
}
.merchant-name {
  font-size: 16px;
  font-weight: 600;
  color: #2f2f41;
}
.merchant-id {
  font-size: 12px;
  color: #9aa0b5;
  margin-top: 2px;
}
.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  background-color: #f3f4f6;
  color: #435366;
}
.status-pill[data-type='1'] {
  background-color: rgba(15,141,255,0.15);
  color: #0f8dff;
}
.status-pill[data-type='2'] {
  background-color: #ffe5e2;
  color: #d64550;
}
.status-pill[data-type='0'],
.status-pill[data-type='3'] {
  background-color: #fff2df;
  color: #ff9500;
}
.status-pill[data-activate='1'] {
  background-color: #e1f7f0;
  color: #00b894;
}
.status-pill[data-activate='2'] {
  background-color: #ffe5e2;
  color: #d64550;
}
.merchant-amount {
  font-weight: 600;
}
.merchant-updated {
  margin-top: 8px;
  font-size: 12px;
  color: #9aa0b5;
}
.merchant-empty {
  text-align: center;
  color: #9aa0b5;
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}
.card-subtitle {
  font-size: 12px;
  color: #9aa0b5;
}

.merchant-pagination {
  margin-top: 8px;
  display: flex;
  justify-content: center;
}


.salesman-container {
  background-color: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 20px;
  padding-top: 20px; /* 添加顶部内边距替代导航条空间 */
}

.content {
  padding: 0 12px;
}

/* 业绩概览卡片 */
.performance-card {
  margin-top: 12px;
  background: linear-gradient(to bottom, #7232dd 0%, #ffffff 100%);
  border-radius: 8px;
  padding: 15px;
  color: #fff;
  box-shadow: 0 2px 12px rgba(114, 50, 221, 0.2);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.avatar-box {
  margin-right: 12px;
}

.info-box {
  flex: 1;
}

.name {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #ffffff;
}

.title {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 2px;
}

.id {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.card-body {
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
}

.value {
  font-size: 22px;
  font-weight: 600;
  color: #7232dd;
  line-height: 1.4;
}

.label {
  font-size: 12px;
  color: #646566;
  margin-top: 2px;
}

.self-use-badge {
  font-size: 10px;
  color: #909399;
  margin-top: 2px;
  background-color: #f2f3f5;
  padding: 1px 4px;
  border-radius: 8px;
}

.divider {
  width: 1px;
  background-color: rgba(255, 255, 255, 0.2);
}

/* 提成收入卡片 */
.commission-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-size: 15px;
  font-weight: 500;
}

.more {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
}

.commission-overview {
  display: flex;
  justify-content: space-between;
}

.commission-item {
  flex: 1;
  text-align: center;
}

.amount {
  font-size: 18px;
  font-weight: bold;
  color: #7232dd;
  margin-bottom: 5px;
}

.label {
  font-size: 12px;
  color: #999;
}

/* 功能卡片 */
.function-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.text {
  font-size: 12px;
  margin-top: 4px;
  color: #646566;
}

/* 任务与目标卡片 */
.task-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.target-date {
  font-size: 12px;
  color: #999;
}

.task-progress {
  margin-bottom: 15px;
}

.task-progress:last-child {
  margin-bottom: 0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.progress-title {
  font-size: 14px;
  color: #666;
}

.progress-value {
  font-size: 14px;
  color: #7232dd;
  font-weight: 500;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
  margin-top: 6px;
}
</style>
