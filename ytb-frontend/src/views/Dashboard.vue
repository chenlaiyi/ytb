<template>
  <div class="dashboard cockpit-mode">
    <section class="page-header">
      <div class="header-main">
        <div class="title-block">
          <p class="eyebrow">管理驾驶舱</p>
          <h1>运营数据总览</h1>
          <p class="subtitle">{{ todayText }} · {{ greeting }}</p>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="goToFullCockpit">
            <el-icon><DataAnalysis /></el-icon>
            查看完整驾驶舱
          </el-button>
          <el-button circle :loading="loading" @click="refreshData" title="刷新数据">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
      </div>
      <div class="highlight-grid">
        <div class="highlight-card" v-for="card in highlightCards" :key="card.title">
          <p class="highlight-title">{{ card.title }}</p>
          <div class="highlight-value">
            <span>{{ card.value }}</span>
            <small>{{ card.suffix }}</small>
          </div>
          <p class="highlight-meta">{{ card.meta }}</p>
        </div>
      </div>
    </section>

    <el-row :gutter="20" class="snapshot-row">
      <el-col :xs="24" :sm="12" :md="6" v-for="card in snapshotCards" :key="card.title">
        <el-card shadow="hover" class="snapshot-card">
          <div class="snapshot-icon" :class="card.type">
            <el-icon :size="24"><component :is="card.icon" /></el-icon>
          </div>
          <div class="snapshot-info">
            <p class="snapshot-title">{{ card.title }}</p>
            <p class="snapshot-value">{{ card.prefix }}{{ formatNumber(card.value) }}</p>
            <p class="snapshot-meta">{{ card.meta }}</p>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="actions-insights-row">
      <el-col :xs="24" :md="12">
        <el-card shadow="never" class="quick-actions-card">
          <template #header>
            <div class="card-header">
              <span>快速操作</span>
              <el-tag size="small" type="success">常用功能</el-tag>
            </div>
          </template>
          <div class="quick-actions-grid">
            <div class="quick-action" v-for="action in quickActions" :key="action.title" @click="navigateTo(action.path)">
              <div class="action-icon" :class="action.type">
                <el-icon><component :is="action.icon" /></el-icon>
              </div>
              <div class="action-text">
                <p class="action-title">{{ action.title }}</p>
                <p class="action-desc">{{ action.desc }}</p>
              </div>
              <el-icon class="action-arrow"><ArrowRight /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12">
        <el-card shadow="never" class="insights-card">
          <template #header>
            <div class="card-header">
              <span>智能洞察</span>
              <el-button link size="small" @click="refreshData">更新</el-button>
            </div>
          </template>
          <div class="insight-item" v-for="insight in insightCards" :key="insight.title">
            <div>
              <p class="insight-title">{{ insight.title }}</p>
              <p class="insight-desc">{{ insight.desc }}</p>
            </div>
            <el-button :type="insight.buttonType" size="small" @click="navigateTo(insight.path)">
              {{ insight.buttonText }}
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import {
  Refresh,
  ArrowRight,
  User,
  ShoppingCart,
  Money,
  Monitor,
  DataAnalysis,
  Bell,
  Trophy
} from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const cockpitData = reactive({
  overview: {},
  orders: {},
  members: {},
  devices: {},
  finance: {}
})

const quickActions = [
  { title: '用户管理', desc: '查看并管理APP用户', path: '/users/app-users', icon: User, type: 'user' },
  { title: 'VIP会员', desc: '审批与配置VIP', path: '/users/vip-members', icon: Trophy, type: 'vip' },
  { title: '订单管理', desc: '订单跟进与处理', path: '/mall/orders', icon: ShoppingCart, type: 'order' },
  { title: '设备监控', desc: '查看设备状态', path: '/devices', icon: Monitor, type: 'device' },
  { title: '财务对账', desc: '提现与收入统计', path: '/finance', icon: Money, type: 'finance' },
  { title: '通知中心', desc: '配置系统提醒', path: '/notifications', icon: Bell, type: 'notice' }
]

const todayText = computed(() => {
  const formatter = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
  return formatter.format(new Date())
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '上午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const formatNumber = (num) => {
  if (!num) return '0'
  const value = Number(num)
  if (value >= 10000) {
    return (value / 10000).toFixed(1) + '万'
  }
  return value.toLocaleString()
}

const formatCurrency = (num) => `¥${formatNumber(num || 0)}`

const normalizeApiResult = (response) => {
  if (!response) {
    return { code: null, payload: null, message: '无响应数据' }
  }
  const code = response?.code ?? response?.status ?? null
  let payload = null
  if (Object.prototype.hasOwnProperty.call(response, 'data')) {
    payload = response.data
  } else if (Object.prototype.hasOwnProperty.call(response, 'payload')) {
    payload = response.payload
  } else {
    payload = response
  }
  const message = response?.message ?? response?.msg ?? ''
  return { code, payload, message }
}

const highlightCards = computed(() => {
  const overview = cockpitData.overview || {}
  const users = overview.users || {}
  const revenue = overview.revenue || {}
  const devices = overview.devices || {}
  return [
    {
      title: '今日新增用户',
      value: formatNumber(users.today || 0),
      suffix: '人',
      meta: `VIP渗透率 ${users.vip_rate || 0}%`
    },
    {
      title: '今日收入',
      value: formatCurrency(revenue.today || 0),
      suffix: '',
      meta: `累计 ${formatCurrency(revenue.total || 0)}`
    },
    {
      title: '在线设备',
      value: formatNumber(devices.online || 0),
      suffix: '台',
      meta: `总设备 ${formatNumber(devices.total || 0)} · 在线率 ${devices.online_rate || 0}%`
    }
  ]
})

const snapshotCards = computed(() => {
  const overview = cockpitData.overview || {}
  const users = overview.users || {}
  const revenue = overview.revenue || {}
  const devices = overview.devices || {}
  return [
    {
      title: '总收入',
      value: revenue.total || 0,
      prefix: '¥',
      meta: `今日 ${formatCurrency(revenue.today || 0)}`,
      icon: Money,
      type: 'finance'
    },
    {
      title: '总用户数',
      value: users.total || 0,
      prefix: '',
      meta: `今日新增 ${formatNumber(users.today || 0)}`,
      icon: User,
      type: 'user'
    },
    {
      title: 'VIP用户',
      value: users.vip_count || 0,
      prefix: '',
      meta: `VIP占比 ${users.vip_rate || 0}%`,
      icon: Trophy,
      type: 'vip'
    },
    {
      title: '设备总数',
      value: devices.total || 0,
      prefix: '',
      meta: `在线率 ${devices.online_rate || 0}%`,
      icon: Monitor,
      type: 'device'
    }
  ]
})

const insightCards = computed(() => {
  const overview = cockpitData.overview || {}
  const users = overview.users || {}
  const revenue = overview.revenue || {}
  const devices = overview.devices || {}
  return [
    {
      title: '用户增长趋势',
      desc: `今日新增 ${formatNumber(users.today || 0)} · VIP渗透 ${users.vip_rate || 0}%`,
      buttonText: '查看用户',
      buttonType: 'primary',
      path: '/users/app-users'
    },
    {
      title: '收入表现',
      desc: `今日收入 ${formatCurrency(revenue.today || 0)} · 累计 ${formatCurrency(revenue.total || 0)}`,
      buttonText: '查看财务',
      buttonType: 'success',
      path: '/finance'
    },
    {
      title: '设备健康',
      desc: `在线设备 ${formatNumber(devices.online || 0)} 台 · 在线率 ${devices.online_rate || 0}%`,
      buttonText: '设备监控',
      buttonType: 'warning',
      path: '/devices'
    }
  ]
})

const normalizeCockpitPayload = (payload = {}) => ({
  overview: payload.overview || payload.overview_data || {},
  orders: payload.orders || payload.order_perspective || {},
  members: payload.members || payload.member_perspective || {},
  devices: payload.devices || payload.device_perspective || {},
  finance: payload.finance || payload.finance_perspective || {}
})

const fetchCockpitData = async () => {
  try {
    loading.value = true
    const response = await request.get('/api/admin/v1/dashboard/cockpit')
    const { code, payload, message } = normalizeApiResult(response)
    const isSuccess = [0, 200, 'success', true, null, undefined].includes(code)
    if (isSuccess && payload) {
      Object.assign(cockpitData, normalizeCockpitPayload(payload))
      return
    }
    ElMessage.error(message || '获取驾驶舱数据失败')
  } catch (error) {
    console.error('获取驾驶舱数据失败:', error)
    ElMessage.error('获取驾驶舱数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const navigateTo = (path) => {
  if (path) router.push(path)
}

const goToFullCockpit = () => {
  router.push('/data-cockpit')
}

const refreshData = () => {
  fetchCockpitData()
}

onMounted(() => {
  fetchCockpitData()
})
</script>

<style lang="scss" scoped>
.dashboard.cockpit-mode {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  gap: 20px;

  .page-header {
    background: #fff;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 10px 30px rgba(64, 158, 255, 0.08);
    display: flex;
    flex-direction: column;
    gap: 20px;

    .header-main {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;

      .title-block {
        .eyebrow {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }
        h1 {
          margin: 4px 0;
          font-size: 28px;
          color: #111827;
        }
        .subtitle {
          margin: 0;
          color: #6b7280;
        }
      }

      .header-actions {
        display: flex;
        gap: 12px;
      }
    }

    .highlight-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;

      .highlight-card {
        background: linear-gradient(135deg, #f0f9ff, #ecfeff);
        border-radius: 12px;
        padding: 16px;

        .highlight-title {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
        }

        .highlight-value {
          margin: 8px 0;
          font-size: 28px;
          font-weight: 600;
          color: #0f172a;
          display: flex;
          align-items: baseline;
          gap: 4px;

          small {
            font-size: 14px;
            color: #94a3b8;
          }
        }

        .highlight-meta {
          margin: 0;
          font-size: 13px;
          color: #64748b;
        }
      }
    }
  }

  .snapshot-row, .actions-insights-row {
    .snapshot-card,
    .quick-actions-card,
    .insights-card {
      border-radius: 12px;
    }
  }

  .snapshot-card {
    display: flex;
    gap: 12px;
    align-items: center;

    .snapshot-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      &.finance { background: rgba(103, 194, 58, 0.1); color: #67c23a; }
      &.user { background: rgba(64, 158, 255, 0.1); color: #409eff; }
      &.vip { background: rgba(246, 173, 85, 0.1); color: #f6ad55; }
      &.device { background: rgba(132, 216, 206, 0.2); color: #42c9c0; }
    }

    .snapshot-title {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }
    .snapshot-value {
      margin: 4px 0 0;
      font-size: 22px;
      font-weight: 600;
    }
    .snapshot-meta {
      margin: 0;
      color: #94a3b8;
      font-size: 13px;
    }
  }

  .quick-actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;

    .quick-action {
      background: #f9fafb;
      border-radius: 12px;
      padding: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(15, 23, 42, 0.08);
      }

      .action-icon {
        width: 42px;
        height: 42px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;

        &.user { background: #60a5fa; }
        &.vip { background: #f59e0b; }
        &.order { background: #34d399; }
        &.device { background: #38bdf8; }
        &.finance { background: #67c23a; }
        &.notice { background: #909399; }
      }

      .action-text {
        flex: 1;
        .action-title {
          margin: 0;
          font-weight: 600;
        }
        .action-desc {
          margin: 4px 0 0;
          color: #94a3b8;
          font-size: 13px;
        }
      }

      .action-arrow {
        color: #cbd5f5;
      }
    }
  }

  .insights-card {
    .insight-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;

      &:last-child {
        border-bottom: none;
      }

      .insight-title {
        margin: 0;
        font-weight: 600;
        color: #111827;
      }

      .insight-desc {
        margin: 4px 0 0;
        color: #6b7280;
        font-size: 13px;
      }
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

@media (max-width: 768px) {
  .dashboard.cockpit-mode {
    padding: 12px;

    .header-main {
      flex-direction: column;
      align-items: flex-start !important;
    }

    .quick-actions-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
