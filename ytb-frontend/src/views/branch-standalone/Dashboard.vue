<template>
  <div class="branch-dashboard">
    <!-- 数据概览卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon user-icon">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.total_users || 0 }}</div>
          <div class="stat-label">总用户数</div>
          <div class="stat-change" :class="{ positive: stats.user_growth > 0 }">
            <el-icon><TrendCharts /></el-icon>
            {{ stats.user_growth > 0 ? '+' : '' }}{{ stats.user_growth || 0 }}%
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon vip-icon">
          <el-icon><Trophy /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.vip_users || 0 }}</div>
          <div class="stat-label">CP用户</div>
          <div class="stat-change" :class="{ positive: stats.vip_growth > 0 }">
            <el-icon><TrendCharts /></el-icon>
            {{ stats.vip_growth > 0 ? '+' : '' }}{{ stats.vip_growth || 0 }}%
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon device-icon">
          <el-icon><Monitor /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.active_devices || 0 }}</div>
          <div class="stat-label">活跃设备</div>
          <div class="stat-change" :class="{ positive: stats.device_growth > 0 }">
            <el-icon><TrendCharts /></el-icon>
            {{ stats.device_growth > 0 ? '+' : '' }}{{ stats.device_growth || 0 }}%
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon revenue-icon">
          <el-icon><Wallet /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">¥{{ formatCurrency(stats.monthly_revenue) }}</div>
          <div class="stat-label">本月收入</div>
          <div class="stat-change" :class="{ positive: stats.revenue_growth > 0 }">
            <el-icon><TrendCharts /></el-icon>
            {{ stats.revenue_growth > 0 ? '+' : '' }}{{ stats.revenue_growth || 0 }}%
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <div class="chart-row">
        <!-- 用户增长趋势图 -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>用户增长趋势</h3>
            <el-select v-model="userChartPeriod" size="small" @change="fetchUserTrend">
              <el-option label="最近7天" value="7d" />
              <el-option label="最近30天" value="30d" />
              <el-option label="最近3个月" value="3m" />
            </el-select>
          </div>
          <div class="chart-content">
            <div ref="userTrendChart" class="chart-container"></div>
          </div>
        </div>

        <!-- 设备状态分布 -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>设备状态分布</h3>
            <el-button size="small" text @click="refreshDeviceStatus">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </div>
          <div class="chart-content">
            <div ref="deviceStatusChart" class="chart-container"></div>
          </div>
        </div>
      </div>

      <div class="chart-row">
        <!-- 收入趋势图 -->
        <div class="chart-card full-width">
          <div class="chart-header">
            <h3>收入趋势</h3>
            <div class="chart-controls">
              <el-radio-group v-model="revenueChartType" size="small" @change="fetchRevenueTrend">
                <el-radio-button label="daily">日收入</el-radio-button>
                <el-radio-button label="monthly">月收入</el-radio-button>
              </el-radio-group>
              <el-select v-model="revenueChartPeriod" size="small" @change="fetchRevenueTrend">
                <el-option label="最近30天" value="30d" />
                <el-option label="最近3个月" value="3m" />
                <el-option label="最近12个月" value="12m" />
              </el-select>
            </div>
          </div>
          <div class="chart-content">
            <div ref="revenueTrendChart" class="chart-container large"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷功能区域 -->
    <div class="quick-functions">
      <div class="function-row">
        <!-- 最新用户 -->
        <div class="function-card">
          <div class="function-header">
            <h3>最新用户</h3>
            <el-link :href="`#/branch-standalone/${branchInfo.code}/members/app-users`">查看全部</el-link>
          </div>
          <div class="function-content">
            <div v-if="recentUsers.length === 0" class="empty-state">
              <el-empty description="暂无新用户" />
            </div>
            <div v-else class="user-list">
              <div 
                v-for="user in recentUsers" 
                :key="user.id"
                class="user-item"
              >
                <el-avatar :size="32" :src="user.avatar">
                  {{ user.nickname?.charAt(0) }}
                </el-avatar>
                <div class="user-info">
                  <div class="user-name">{{ user.nickname || user.phone }}</div>
                  <div class="user-meta">
                    <el-tag v-if="user.is_vip" type="warning" size="small">VIP</el-tag>
                    <span class="user-time">{{ formatTime(user.created_at) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 设备状态 -->
        <div class="function-card">
          <div class="function-header">
            <h3>设备状态</h3>
            <el-link :href="`#/branch-standalone/${branchInfo.code}/devices/activated`">管理设备</el-link>
          </div>
          <div class="function-content">
            <div class="device-status-list">
              <div class="status-item">
                <div class="status-indicator online"></div>
                <div class="status-info">
                  <span class="status-label">在线设备</span>
                  <span class="status-count">{{ deviceStatus.online || 0 }}</span>
                </div>
              </div>
              <div class="status-item">
                <div class="status-indicator offline"></div>
                <div class="status-info">
                  <span class="status-label">离线设备</span>
                  <span class="status-count">{{ deviceStatus.offline || 0 }}</span>
                </div>
              </div>
              <div class="status-item">
                <div class="status-indicator warning"></div>
                <div class="status-info">
                  <span class="status-label">故障设备</span>
                  <span class="status-count">{{ deviceStatus.error || 0 }}</span>
                </div>
              </div>
              <div class="status-item">
                <div class="status-indicator maintenance"></div>
                <div class="status-info">
                  <span class="status-label">维护中</span>
                  <span class="status-count">{{ deviceStatus.maintenance || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 系统通知 -->
        <div class="function-card">
          <div class="function-header">
            <h3>系统通知</h3>
            <el-button size="small" text @click="markAllRead">全部已读</el-button>
          </div>
          <div class="function-content">
            <div v-if="notifications.length === 0" class="empty-state">
              <el-empty description="暂无通知" />
            </div>
            <div v-else class="notification-list">
              <div 
                v-for="notification in notifications.slice(0, 5)" 
                :key="notification.id"
                class="notification-item"
                :class="{ unread: !notification.read }"
              >
                <div class="notification-icon">
                  <el-icon :color="getNotificationColor(notification.type)">
                    <component :is="getNotificationIcon(notification.type)" />
                  </el-icon>
                </div>
                <div class="notification-content">
                  <div class="notification-title">{{ notification.title }}</div>
                  <div class="notification-time">{{ formatTime(notification.created_at) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速操作抽屉 -->
    <el-drawer
      v-model="quickActionVisible"
      title="快速操作"
      direction="rtl"
      size="400px"
    >
      <div class="quick-actions-content">
        <div class="action-group">
          <h4>用户管理</h4>
          <el-button 
            class="action-btn" 
            @click="navigateTo(`/branch-standalone/${branchInfo.code}/members/app-users`)"
          >
            <el-icon><User /></el-icon>
            查看APP用户
          </el-button>
          <el-button 
            class="action-btn" 
            @click="navigateTo(`/branch-standalone/${branchInfo.code}/members/vip-users`)"
          >
            <el-icon><Trophy /></el-icon>
            CP用户管理
          </el-button>
        </div>

        <div class="action-group">
          <h4>设备管理</h4>
          <el-button 
            class="action-btn" 
            @click="navigateTo(`/branch-standalone/${branchInfo.code}/devices/inventory`)"
          >
            <el-icon><DataAnalysis /></el-icon>
            设备库存
          </el-button>
          <el-button 
            class="action-btn" 
            @click="navigateTo(`/branch-standalone/${branchInfo.code}/devices/activated`)"
          >
            <el-icon><Monitor /></el-icon>
            已激活设备
          </el-button>
        </div>

        <div class="action-group">
          <h4>财务管理</h4>
          <el-button 
            class="action-btn" 
            @click="navigateTo(`/branch-standalone/${branchInfo.code}/finance/income`)"
          >
            <el-icon><TrendCharts /></el-icon>
            收入统计
          </el-button>
          <el-button 
            class="action-btn" 
            @click="navigateTo(`/branch-standalone/${branchInfo.code}/finance/dividend`)"
          >
            <el-icon><CreditCard /></el-icon>
            分红记录
          </el-button>
        </div>

        <div class="action-group">
          <h4>系统设置</h4>
          <el-button 
            class="action-btn" 
            @click="navigateTo(`/branch-standalone/${branchInfo.code}/system/admins`)"
          >
            <el-icon><UserFilled /></el-icon>
            管理员设置
          </el-button>
          <el-button 
            class="action-btn" 
            @click="navigateTo(`/branch-standalone/${branchInfo.code}/system/dividend-config`)"
          >
            <el-icon><Money /></el-icon>
            分红配置
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Plus,
  Refresh, 
  User, 
  Trophy, 
  Monitor, 
  Wallet, 
  TrendCharts,
  DataAnalysis,
  CreditCard,
  Warning,
  InfoFilled,
  Bell,
  ChatDotRound,
  Setting,
  UserFilled,
  Money
} from '@element-plus/icons-vue'
import request from '@/utils/request'
import * as echarts from 'echarts'

const router = useRouter()
const route = useRoute()

// 响应式数据
const quickActionVisible = ref(false)
const userChartPeriod = ref('30d')
const revenueChartType = ref('daily')
const revenueChartPeriod = ref('30d')

// 图表实例
let userTrendChart = null
let deviceStatusChart = null
let revenueTrendChart = null

// 分支机构和用户信息
const branchInfo = reactive({
  id: null,
  name: '分支机构',
  code: '',
  wechat_account: null,
  display_name: '分支机构',
  display_logo: '/images/logo.png'
})

const userInfo = reactive({
  name: '管理员',
  last_login_at: new Date()
})

// 统计数据
const stats = reactive({
  total_users: 0,
  user_growth: 0,
  vip_users: 0,
  vip_growth: 0,
  active_devices: 0,
  device_growth: 0,
  monthly_revenue: 0,
  revenue_growth: 0
})

// 最新用户
const recentUsers = ref([])

// 设备状态
const deviceStatus = reactive({
  online: 0,
  offline: 0,
  error: 0,
  maintenance: 0
})

// 通知列表
const notifications = ref([])

// 初始化分支机构信息
const initBranchInfo = () => {
  try {
    // 从路由参数获取分支机构ID
    const branchId = route.params.branchId
    if (branchId) {
      branchInfo.id = parseInt(branchId)
    }
    
    // 从本地存储获取分支机构信息
    const storedBranchInfo = localStorage.getItem('branch_info')
    if (storedBranchInfo) {
      const branch = JSON.parse(storedBranchInfo)
      Object.assign(branchInfo, {
        id: branch.id || branchInfo.id,
        name: branch.name || '分支机构',
        code: branch.code || '',
        wechat_account: branch.wechat_account,
        display_name: branch.display_name || branch.name || '分支机构',
        display_logo: branch.display_logo || '/images/logo.png'
      })
    }
    
    // 从本地存储获取管理员信息
    const storedAdminInfo = localStorage.getItem('branch_admin_info')
    if (storedAdminInfo) {
      const admin = JSON.parse(storedAdminInfo)
      Object.assign(userInfo, {
        name: admin.name || '管理员',
        last_login_at: admin.last_login_at || new Date()
      })
    }
  } catch (error) {
    console.error('初始化分支机构信息失败:', error.message || error)
  }
}

// 方法
const showQuickActions = () => {
  quickActionVisible.value = true
}

const refreshData = async () => {
  try {
    await Promise.all([
      fetchStats(),
      fetchRecentUsers(),
      fetchDeviceStatus(),
      fetchNotifications(),
      fetchUserTrend(),
      fetchRevenueTrend()
    ])
    ElMessage.success('数据已刷新')
  } catch (error) {
    console.error('刷新数据失败:', error.message || error)
    ElMessage.error('刷新数据失败')
  }
}

const fetchStats = async () => {
  try {
    // 确保分支机构ID存在
    if (!branchInfo.id) {
      console.warn('分支机构ID为空，跳过统计数据获取')
      return
    }
    
    const response = await request.get(`https://pay.itapgo.com/api/admin/v1/branch-organizations/${branchInfo.id}/statistics`)
    
    if (response.code === 0) {
      Object.assign(stats, response.data)
    } else {
      console.warn('获取统计数据返回错误:', response.message)
    }
  } catch (error) {
    console.error('获取统计数据失败:', error.message || error)
  }
}

const fetchRecentUsers = async () => {
  try {
    if (!branchInfo.id) {
      console.warn('分支机构ID为空，跳过最新用户获取')
      return
    }
    
    const response = await request.get(`https://pay.itapgo.com/api/admin/v1/branch-organizations/${branchInfo.id}/app-users`, {
      params: { size: 10 }
    })
    
    if (response.code === 0) {
      recentUsers.value = response.data?.data || []
    } else {
      console.warn('获取最新用户返回错误:', response.message)
    }
  } catch (error) {
    console.error('获取最新用户失败:', error.message || error)
  }
}

const fetchDeviceStatus = async () => {
  try {
    // 使用模拟数据
    Object.assign(deviceStatus, {
      active: Math.floor(Math.random() * 100) + 20,
      inactive: Math.floor(Math.random() * 20) + 5,
      maintenance: Math.floor(Math.random() * 10) + 2
    })
    updateDeviceStatusChart()
  } catch (error) {
    console.error('获取设备状态失败:', error.message || error)
  }
}

const fetchNotifications = async () => {
  try {
    // 使用模拟数据
    notifications.value = [
      {
        id: 1,
        title: '系统维护通知',
        content: '系统将于今晚进行例行维护，预计维护时间2小时',
        type: 'system',
        created_at: new Date().toLocaleString()
      },
      {
        id: 2,
        title: '新用户注册',
        content: '恭喜！您的分支机构今日新增用户5名',
        type: 'info',
        created_at: new Date().toLocaleString()
      }
    ]
  } catch (error) {
    console.error('获取通知失败:', error.message || error)
  }
}

const fetchUserTrend = async () => {
  try {
    // 使用模拟数据
    const mockData = {
      labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
      series: [
        {
          name: '总用户',
          data: [65, 89, 120, 155, 182, 210]
        },
        {
          name: 'CP用户',
          data: [10, 18, 25, 32, 38, 45]
        }
      ]
    }
    updateUserTrendChart(mockData)
  } catch (error) {
    console.error('获取用户趋势失败:', error.message || error)
  }
}

const fetchRevenueTrend = async () => {
  try {
    // 使用模拟数据
    const mockData = {
      labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
      datasets: [
        {
          label: '收入',
          data: [12000, 19000, 15000, 25000, 22000, 30000],
          borderColor: '#409eff',
          backgroundColor: 'rgba(64, 158, 255, 0.1)'
        }
      ]
    }
    updateRevenueTrendChart(mockData)
  } catch (error) {
    console.error('获取收入趋势失败:', error.message || error)
  }
}

const refreshDeviceStatus = () => {
  fetchDeviceStatus()
}

const markAllRead = async () => {
  try {
    if (!branchInfo.id) return
    
    await request.post('https://pay.itapgo.com/api/admin/v1/branch/notifications/mark-all-read', {
      branch_id: branchInfo.id
    })
    
    // 重新获取通知列表
    await fetchNotifications()
    ElMessage.success('已标记全部为已读')
  } catch (error) {
    console.error('标记已读失败:', error.message || error)
    ElMessage.error('操作失败')
  }
}

const navigateTo = (path) => {
  router.push(path)
  quickActionVisible.value = false
}

const formatTime = (time) => {
  if (!time) return '--'
  return new Date(time).toLocaleString()
}

const formatCurrency = (amount) => {
  if (!amount) return '0.00'
  return Number(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const getNotificationColor = (type) => {
  const colors = {
    info: '#409eff',
    success: '#67c23a',
    warning: '#e6a23c',
    error: '#f56c6c'
  }
  return colors[type] || colors.info
}

const getNotificationIcon = (type) => {
  const icons = {
    info: InfoFilled,
    success: InfoFilled,
    warning: Warning,
    error: Warning
  }
  return icons[type] || InfoFilled
}

// 图表初始化和更新方法
const initCharts = () => {
  nextTick(() => {
    initUserTrendChart()
    initDeviceStatusChart()
    initRevenueTrendChart()
  })
}

const initUserTrendChart = () => {
  const container = document.querySelector('[ref="userTrendChart"]')
  if (!container) return
  
  userTrendChart = echarts.init(container)
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: []
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      name: '新增用户',
      type: 'line',
      data: [],
      smooth: true,
      areaStyle: {
        opacity: 0.3
      }
    }]
  }
  
  userTrendChart.setOption(option)
}

const updateUserTrendChart = (data) => {
  if (!userTrendChart || !data) return
  
  userTrendChart.setOption({
    xAxis: {
      data: data.dates || []
    },
    series: [{
      data: data.values || []
    }]
  })
}

const initDeviceStatusChart = () => {
  const container = document.querySelector('[ref="deviceStatusChart"]')
  if (!container) return
  
  deviceStatusChart = echarts.init(container)
  
  const option = {
    tooltip: {
      trigger: 'item'
    },
    series: [{
      name: '设备状态',
      type: 'pie',
      radius: '60%',
      data: [],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }
  
  deviceStatusChart.setOption(option)
}

const updateDeviceStatusChart = () => {
  if (!deviceStatusChart) return
  
  const data = [
    { value: deviceStatus.online, name: '在线', itemStyle: { color: '#67c23a' } },
    { value: deviceStatus.offline, name: '离线', itemStyle: { color: '#909399' } },
    { value: deviceStatus.error, name: '故障', itemStyle: { color: '#f56c6c' } },
    { value: deviceStatus.maintenance, name: '维护', itemStyle: { color: '#e6a23c' } }
  ]
  
  deviceStatusChart.setOption({
    series: [{
      data: data
    }]
  })
}

const initRevenueTrendChart = () => {
  const container = document.querySelector('[ref="revenueTrendChart"]')
  if (!container) return
  
  revenueTrendChart = echarts.init(container)
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: []
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [{
      name: '收入',
      type: 'bar',
      data: [],
      itemStyle: {
        color: '#409eff'
      }
    }]
  }
  
  revenueTrendChart.setOption(option)
}

const updateRevenueTrendChart = (data) => {
  if (!revenueTrendChart || !data) return
  
  revenueTrendChart.setOption({
    xAxis: {
      data: data.dates || []
    },
    series: [{
      data: data.values || []
    }]
  })
}

// 组件挂载时初始化
onMounted(() => {
  initBranchInfo()
  initCharts()
  
  // 延迟加载数据，确保分支机构信息已初始化
  nextTick(() => {
    refreshData()
  })
  
  // 窗口大小变化时重新调整图表
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理
const handleResize = () => {
  if (userTrendChart) userTrendChart.resize()
  if (deviceStatusChart) deviceStatusChart.resize()
  if (revenueTrendChart) revenueTrendChart.resize()
}
</script>

<style scoped>
.branch-dashboard {
  padding: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.user-icon {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.vip-icon {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.device-icon {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.revenue-icon {
  background: linear-gradient(135deg, #43e97b, #38f9d7);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #1f2329;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #86909c;
  margin-bottom: 8px;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #f56c6c;
}

.stat-change.positive {
  color: #67c23a;
}

.charts-section {
  margin-bottom: 24px;
}

.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.chart-row:last-child {
  margin-bottom: 0;
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.chart-card.full-width {
  grid-column: 1 / -1;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2329;
  margin: 0;
}

.chart-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.chart-container {
  height: 300px;
}

.chart-container.large {
  height: 400px;
}

.quick-functions {
  margin-bottom: 24px;
}

.function-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.function-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.function-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.function-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2329;
  margin: 0;
}

.function-content {
  min-height: 200px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.user-item:hover {
  background: #f2f3f5;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2329;
  margin-bottom: 4px;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-time {
  font-size: 12px;
  color: #86909c;
}

.device-status-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.status-indicator.online {
  background: #67c23a;
}

.status-indicator.offline {
  background: #909399;
}

.status-indicator.warning {
  background: #f56c6c;
}

.status-indicator.maintenance {
  background: #e6a23c;
}

.status-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
}

.status-label {
  font-size: 14px;
  color: #4e5969;
}

.status-count {
  font-size: 16px;
  font-weight: 600;
  color: #1f2329;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background: #f2f3f5;
}

.notification-item.unread {
  background: #f0f9ff;
}

.notification-icon {
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-size: 14px;
  font-weight: 500;
  color: #1f2329;
  margin-bottom: 4px;
}

.notification-time {
  font-size: 12px;
  color: #86909c;
}

.quick-actions-content {
  padding: 16px 0;
}

.action-group {
  margin-bottom: 32px;
}

.action-group:last-child {
  margin-bottom: 0;
}

.action-group h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2329;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e8eaec;
}

.action-btn {
  width: 100%;
  justify-content: flex-start;
  margin-bottom: 8px;
  height: 40px;
}

.action-btn:last-child {
  margin-bottom: 0;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .chart-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .welcome-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .function-row {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    height: 250px;
  }
  
  .chart-container.large {
    height: 300px;
  }
}
</style> 