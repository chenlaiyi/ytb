<template>
  <div class="branch-engineer-container">
    <div class="content">
      <!-- 工程师信息卡片 -->
      <div class="engineer-card">
        <div class="engineer-header">
          <div class="avatar-box">
            <van-image
              round
              width="60"
              height="60"
              :src="engineerInfo.avatar || userStore.userAvatar || 'https://img.itapgo.com/profile/default-engineer.png'"
            />
          </div>
          <div class="info-box">
            <div class="name">{{ engineerInfo.name || userStore.userName || '工程师' }}</div>
            <div class="code">工号: {{ engineerInfo.code || branchCode }}</div>
            <div class="level">{{ engineerInfo.level || '初级工程师' }}</div>
          </div>
          <div class="rating-box">
            <van-rate v-model="engineerInfo.rating" readonly size="14" />
            <div class="rating-text">{{ engineerInfo.rating || '5.0' }}分</div>
          </div>
        </div>
      </div>
      
      <!-- 工作统计概览 -->
      <div class="overview-card">
        <div class="card-title">工作概览</div>
        <div class="data-overview">
          <div class="overview-item">
            <div class="item-value">{{ workStats.todayOrders || '0' }}</div>
            <div class="item-label">今日工单</div>
          </div>
          <div class="overview-divider"></div>
          <div class="overview-item">
            <div class="item-value">{{ workStats.pendingOrders || '0' }}</div>
            <div class="item-label">待处理</div>
          </div>
          <div class="overview-divider"></div>
          <div class="overview-item">
            <div class="item-value">{{ workStats.completedOrders || '0' }}</div>
            <div class="item-label">已完成</div>
          </div>
        </div>
        
        <div class="data-overview margin-top">
          <div class="overview-item">
            <div class="item-value">{{ workStats.monthOrders || '0' }}</div>
            <div class="item-label">本月工单</div>
          </div>
          <div class="overview-divider"></div>
          <div class="overview-item">
            <div class="item-value">{{ workStats.totalEarnings || '0.00' }}</div>
            <div class="item-label">本月收入(元)</div>
          </div>
          <div class="overview-divider"></div>
          <div class="overview-item">
            <div class="item-value">{{ (workStats.completionRate || '0') + '%' }}</div>
            <div class="item-label">完成率</div>
          </div>
        </div>
      </div>
      
      <!-- 工作进度图表 -->
      <div class="chart-card">
        <div class="card-title">
          <span>工作进度</span>
          <div class="chart-tabs">
            <span 
              v-for="(tab, index) in chartTabs" 
              :key="index" 
              :class="{ 'active-tab': currentChartTab === index }"
              @click="currentChartTab = index"
            >
              {{ tab }}
            </span>
          </div>
        </div>
        <div class="chart-container">
          <div class="chart-placeholder" v-if="!hasChartData">
            <van-icon name="chart-trending-o" size="40" color="#cccccc" />
            <div>暂无工作数据</div>
          </div>
          <div v-else class="chart-data">
            <div class="work-progress-chart">
              <div class="progress-item">
                <div class="progress-label">安装</div>
                <van-progress :percentage="workProgress.install || 0" color="#1989fa" />
                <div class="progress-count">{{ workProgress.installCount || 0 }}单</div>
              </div>
              <div class="progress-item">
                <div class="progress-label">维修</div>
                <van-progress :percentage="workProgress.repair || 0" color="#07c160" />
                <div class="progress-count">{{ workProgress.repairCount || 0 }}单</div>
              </div>
              <div class="progress-item">
                <div class="progress-label">保养</div>
                <van-progress :percentage="workProgress.maintenance || 0" color="#ff9500" />
                <div class="progress-count">{{ workProgress.maintenanceCount || 0 }}单</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 快捷功能 -->
      <div class="function-card">
        <div class="card-title">快捷功能</div>
        <van-grid :column-num="4" :border="false" square>
          <van-grid-item v-for="(feature, index) in features" :key="index" @click="goToFeature(feature)">
            <van-icon :name="feature.icon" size="28" :color="feature.color" />
            <div class="text">{{ feature.name }}</div>
          </van-grid-item>
        </van-grid>
      </div>
      
      <!-- 待处理工单 -->
      <div class="order-card">
        <div class="card-title">
          <span>待处理工单</span>
          <div class="more" @click="$router.push('/branch/engineer/orders')">查看全部 <van-icon name="arrow" /></div>
        </div>
        <div class="order-list" v-if="pendingOrders.length > 0">
          <div class="order-item" v-for="(order, index) in pendingOrders" :key="index" @click="goToOrderDetail(order)">
            <div class="order-left">
              <div class="order-type" :class="getOrderTypeClass(order.type)">
                <van-icon :name="getOrderTypeIcon(order.type)" size="16" />
              </div>
              <div class="order-info">
                <div class="order-title">{{ order.title }}</div>
                <div class="order-address">{{ order.address }}</div>
                <div class="order-time">预约时间: {{ order.appointmentTime }}</div>
              </div>
            </div>
            <div class="order-right">
              <div class="order-status" :class="getOrderStatusClass(order.status)">
                {{ getOrderStatusText(order.status) }}
              </div>
              <div class="order-priority" :class="getPriorityClass(order.priority)">{{ order.priority }}</div>
            </div>
          </div>
        </div>
        <div class="empty-list" v-else>
          <van-icon name="orders-o" size="40" color="#cccccc" />
          <div>暂无待处理工单</div>
        </div>
      </div>
      
      <!-- 库存状态 -->
      <div class="inventory-card">
        <div class="card-title">
          <span>库存状态</span>
          <div class="more" @click="$router.push('/branch/engineer/inventory')">查看全部 <van-icon name="arrow" /></div>
        </div>
        <div class="inventory-list" v-if="inventory.length > 0">
          <div class="inventory-item" v-for="(item, index) in inventory" :key="index">
            <div class="inventory-left">
              <div class="inventory-image">
                <van-image
                  width="40"
                  height="40"
                  :src="item.image || 'https://img.itapgo.com/default-product.png'"
                />
              </div>
              <div class="inventory-info">
                <div class="inventory-name">{{ item.name }}</div>
                <div class="inventory-code">编号: {{ item.code }}</div>
              </div>
            </div>
            <div class="inventory-right">
              <div class="inventory-stock" :class="getStockClass(item.stock, item.minStock)">
                库存: {{ item.stock }}
              </div>
              <div class="inventory-action" v-if="item.stock <= item.minStock" @click="applyRestock(item)">
                <van-button type="primary" size="mini">申请补货</van-button>
              </div>
            </div>
          </div>
        </div>
        <div class="empty-list" v-else>
          <van-icon name="goods-collect-o" size="40" color="#cccccc" />
          <div>暂无库存信息</div>
        </div>
      </div>
      
      <!-- 最近完成 -->
      <div class="completed-card">
        <div class="card-title">最近完成</div>
        <div class="completed-list" v-if="recentCompleted.length > 0">
          <div class="completed-item" v-for="(item, index) in recentCompleted" :key="index" @click="viewCompletedDetail(item)">
            <div class="completed-left">
              <div class="completed-type" :class="getOrderTypeClass(item.type)">
                <van-icon :name="getOrderTypeIcon(item.type)" size="16" />
              </div>
              <div class="completed-info">
                <div class="completed-title">{{ item.title }}</div>
                <div class="completed-customer">客户: {{ item.customerName }}</div>
              </div>
            </div>
            <div class="completed-right">
              <div class="completed-time">{{ item.completedTime }}</div>
              <div class="completed-rating">
                <van-rate v-model="item.rating" readonly size="12" />
              </div>
            </div>
          </div>
        </div>
        <div class="empty-list" v-else>
          <van-icon name="completed" size="40" color="#cccccc" />
          <div>暂无完成记录</div>
        </div>
      </div>
      
      <!-- 公告通知 -->
      <div class="notice-card">
        <div class="card-title">公告通知</div>
        <div class="notice-list" v-if="notices.length > 0">
          <div class="notice-item" v-for="(notice, index) in notices" :key="index" @click="showNoticeDetail(notice)">
            <div class="notice-content">
              <div class="notice-tag" v-if="notice.isNew">新</div>
              <div class="notice-title">{{ notice.title }}</div>
            </div>
            <div class="notice-date">{{ notice.date }}</div>
          </div>
        </div>
        <div class="empty-list" v-else>
          <van-icon name="bullhorn-o" size="40" color="#cccccc" />
          <div>暂无通知公告</div>
        </div>
      </div>
    </div>
    
    <!-- 通知详情弹窗 -->
    <van-popup v-model:show="showNoticePopup" round position="bottom" closeable :style="{ height: '70%' }">
      <div class="notice-popup">
        <div class="notice-popup-title">{{ currentNotice.title }}</div>
        <div class="notice-popup-date">{{ currentNotice.date }}</div>
        <div class="notice-popup-content">{{ currentNotice.content }}</div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { getBranchEngineerWorkspace } from '@/api/branchEngineer'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 获取分支机构代码
const branchCode = computed(() => {
  return localStorage.getItem('branch_code') || 'BRANCH001'
})

// 工程师信息
const engineerInfo = ref({
  name: '',
  avatar: '',
  code: '',
  level: '',
  rating: 5.0
})

// 工作统计数据
const workStats = ref({
  todayOrders: '0',
  pendingOrders: '0',
  completedOrders: '0',
  monthOrders: '0',
  totalEarnings: '0.00',
  completionRate: '0'
})

// 工作进度数据
const workProgress = ref({
  install: 0,
  installCount: 0,
  repair: 0,
  repairCount: 0,
  maintenance: 0,
  maintenanceCount: 0
})

// 图表相关
const chartTabs = ref(['今日', '本周', '本月'])
const currentChartTab = ref(0)
const hasChartData = ref(false)

// 功能列表
const features = ref([
  { name: '工单管理', icon: 'orders-o', path: '/branch/engineer/orders', color: '#1989fa' },
  { name: '接单抢单', icon: 'add-o', path: '/branch/engineer/grab', color: '#07c160' },
  { name: '库存管理', icon: 'goods-collect-o', path: '/branch/engineer/inventory', color: '#ff9500' },
  { name: '路线规划', icon: 'location-o', path: '/branch/engineer/route', color: '#ee0a24' },
  { name: '维修记录', icon: 'records', path: '/branch/engineer/records', color: '#7232dd' },
  { name: '技能培训', icon: 'certificate', path: '/branch/engineer/training', color: '#ff6034' },
  { name: '收入统计', icon: 'balance-o', path: '/branch/engineer/earnings', color: '#2eb57d' },
  { name: '客户评价', icon: 'star-o', path: '/branch/engineer/reviews', color: '#969799' }
])

// 待处理工单
const pendingOrders = ref([])

// 库存信息
const inventory = ref([])

// 最近完成
const recentCompleted = ref([])

// 通知公告
const notices = ref([])
const showNoticePopup = ref(false)
const currentNotice = ref({})

// 跳转到功能页面
const goToFeature = (feature) => {
  if (feature.path) {
    router.push(feature.path)
  } else {
    showToast('功能开发中...')
  }
}

// 跳转到工单详情
const goToOrderDetail = (order) => {
  router.push(`/branch/engineer/order/${order.id}`)
}

// 获取工单类型样式类
const getOrderTypeClass = (type) => {
  switch (type) {
    case 'install': return 'type-install'
    case 'repair': return 'type-repair'
    case 'maintenance': return 'type-maintenance'
    default: return 'type-default'
  }
}

// 获取工单类型图标
const getOrderTypeIcon = (type) => {
  switch (type) {
    case 'install': return 'add-o'
    case 'repair': return 'service-o'
    case 'maintenance': return 'setting-o'
    default: return 'orders-o'
  }
}

// 获取工单状态样式类
const getOrderStatusClass = (status) => {
  switch (status) {
    case 'pending': return 'status-pending'
    case 'processing': return 'status-processing'
    case 'completed': return 'status-completed'
    default: return 'status-pending'
  }
}

// 获取工单状态文本
const getOrderStatusText = (status) => {
  switch (status) {
    case 'pending': return '待处理'
    case 'processing': return '处理中'
    case 'completed': return '已完成'
    default: return '未知'
  }
}

// 获取优先级样式类
const getPriorityClass = (priority) => {
  switch (priority) {
    case '高': return 'priority-high'
    case '中': return 'priority-medium'
    case '低': return 'priority-low'
    default: return 'priority-low'
  }
}

// 获取库存样式类
const getStockClass = (stock, minStock) => {
  if (stock <= minStock) return 'stock-low'
  if (stock <= minStock * 2) return 'stock-medium'
  return 'stock-high'
}

// 申请补货
const applyRestock = async (item) => {
  try {
    await showConfirmDialog({
      title: '申请补货',
      message: `确定要申请补货"${item.name}"吗？`
    })
    showToast('补货申请已提交')
  } catch {
    // 用户取消
  }
}

// 查看完成详情
const viewCompletedDetail = (item) => {
  router.push(`/branch/engineer/completed/${item.id}`)
}

// 显示通知详情
const showNoticeDetail = (notice) => {
  currentNotice.value = notice
  showNoticePopup.value = true
}

// 加载工作台数据
const loadWorkspaceData = async () => {
  try {
    const response = await getBranchEngineerWorkspace()
    if (response.code === 0) {
      const data = response.data
      
      // 更新工程师信息
      engineerInfo.value = {
        name: data.engineer?.name || `${branchCode.value}工程师`,
        avatar: data.engineer?.avatar || '',
        code: data.engineer?.code || branchCode.value,
        level: data.engineer?.level || '初级工程师',
        rating: data.engineer?.rating || 5.0
      }
      
      // 更新工作统计
      workStats.value = data.work_stats || workStats.value
      
      // 更新工作进度
      workProgress.value = data.work_progress || workProgress.value
      
      // 更新待处理工单
      pendingOrders.value = data.pending_orders || []
      
      // 更新库存信息
      inventory.value = data.inventory || []
      
      // 更新最近完成
      recentCompleted.value = data.recent_completed || []
      
      // 更新通知公告
      notices.value = data.notices || []
      
      hasChartData.value = data.has_chart_data || false
    }
  } catch (error) {
    console.error('加载工作台数据失败:', error)
    // 使用模拟数据
    loadMockData()
  }
}

// 加载模拟数据
const loadMockData = () => {
  // 模拟工程师信息
  engineerInfo.value = {
    name: '张师傅',
    avatar: '',
    code: 'ENG001',
    level: '高级工程师',
    rating: 4.8
  }
  
  // 模拟工作统计
  workStats.value = {
    todayOrders: '5',
    pendingOrders: '3',
    completedOrders: '2',
    monthOrders: '86',
    totalEarnings: '12580.00',
    completionRate: '96.5'
  }
  
  // 模拟工作进度
  workProgress.value = {
    install: 75,
    installCount: 15,
    repair: 85,
    repairCount: 34,
    maintenance: 90,
    maintenanceCount: 37
  }
  
  // 模拟待处理工单
  pendingOrders.value = [
    {
      id: 1,
      title: '净水器安装',
      address: '天河区珠江新城A座1201',
      appointmentTime: '14:00-16:00',
      type: 'install',
      status: 'pending',
      priority: '高'
    },
    {
      id: 2,
      title: '净水器维修',
      address: '越秀区中山路88号',
      appointmentTime: '16:00-18:00',
      type: 'repair',
      status: 'processing',
      priority: '中'
    },
    {
      id: 3,
      title: '设备保养',
      address: '海珠区滨江东路168号',
      appointmentTime: '明日 09:00-11:00',
      type: 'maintenance',
      status: 'pending',
      priority: '低'
    }
  ]
  
  // 模拟库存信息
  inventory.value = [
    {
      name: 'PP棉滤芯',
      code: 'FC001',
      image: '',
      stock: 5,
      minStock: 10
    },
    {
      name: '活性炭滤芯',
      code: 'FC002',
      image: '',
      stock: 15,
      minStock: 10
    },
    {
      name: 'RO膜滤芯',
      code: 'FC003',
      image: '',
      stock: 2,
      minStock: 5
    }
  ]
  
  // 模拟最近完成
  recentCompleted.value = [
    {
      id: 1,
      title: '净水器安装',
      customerName: '李先生',
      type: 'install',
      completedTime: '今日 11:30',
      rating: 5
    },
    {
      id: 2,
      title: '净水器维修',
      customerName: '王女士',
      type: 'repair',
      completedTime: '昨日 16:45',
      rating: 4
    }
  ]
  
  // 模拟通知公告
  notices.value = [
    {
      title: '新版工单系统上线',
      date: '12-20',
      content: '新版工单系统已上线，请及时更新使用。',
      isNew: true
    },
    {
      title: '年终考核通知',
      date: '12-18',
      content: '年终考核将于下月开始，请做好准备。',
      isNew: false
    }
  ]
  
  hasChartData.value = true
}

onMounted(() => {
  loadWorkspaceData()
})
</script>

<style scoped>
.branch-engineer-container {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 50px;
}

.content {
  padding: 20px 16px;
}

/* 工程师信息卡片 */
.engineer-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  color: white;
}

.engineer-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-box {
  flex-shrink: 0;
}

.info-box {
  flex: 1;
}

.name {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 4px;
}

.code {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.level {
  font-size: 12px;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
}

.rating-box {
  text-align: center;
}

.rating-text {
  font-size: 12px;
  margin-top: 4px;
  opacity: 0.9;
}

/* 概览卡片 */
.overview-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

.data-overview {
  display: flex;
  align-items: center;
}

.data-overview.margin-top {
  margin-top: 20px;
}

.overview-item {
  flex: 1;
  text-align: center;
}

.item-value {
  font-size: 20px;
  font-weight: bold;
  color: #1989fa;
  margin-bottom: 4px;
}

.item-label {
  font-size: 12px;
  color: #666;
}

.overview-divider {
  width: 1px;
  height: 40px;
  background-color: #eee;
  margin: 0 16px;
}

/* 图表卡片 */
.chart-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-tabs {
  display: flex;
  gap: 16px;
  font-size: 14px;
}

.chart-tabs span {
  color: #666;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.chart-tabs .active-tab {
  color: #1989fa;
  background-color: #e8f4fd;
}

.chart-container {
  margin-top: 16px;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
  color: #999;
}

.chart-placeholder div {
  margin-top: 8px;
  font-size: 14px;
}

.work-progress-chart {
  width: 100%;
}

.progress-item {
  margin-bottom: 20px;
}

.progress-item:last-child {
  margin-bottom: 0;
}

.progress-label {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-count {
  font-size: 12px;
  color: #666;
}

/* 功能卡片 */
.function-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.text {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

/* 工单卡片 */
.order-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.more {
  font-size: 14px;
  color: #1989fa;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.order-list {
  margin-top: 16px;
}

.order-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.order-item:last-child {
  border-bottom: none;
}

.order-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.order-type {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.type-install {
  background-color: #1989fa;
}

.type-repair {
  background-color: #ff9500;
}

.type-maintenance {
  background-color: #07c160;
}

.type-default {
  background-color: #999;
}

.order-info {
  flex: 1;
}

.order-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.order-address {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.order-time {
  font-size: 12px;
  color: #999;
}

.order-right {
  text-align: right;
}

.order-status {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-bottom: 4px;
}

.status-pending {
  background-color: #fff2e8;
  color: #faad14;
}

.status-processing {
  background-color: #e8f4fd;
  color: #1989fa;
}

.status-completed {
  background-color: #e8f5e8;
  color: #52c41a;
}

.order-priority {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}

.priority-high {
  background-color: #fff1f0;
  color: #ff4d4f;
}

.priority-medium {
  background-color: #fff2e8;
  color: #faad14;
}

.priority-low {
  background-color: #e8f4fd;
  color: #1989fa;
}

/* 库存卡片 */
.inventory-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.inventory-list {
  margin-top: 16px;
}

.inventory-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.inventory-item:last-child {
  border-bottom: none;
}

.inventory-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.inventory-image {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
}

.inventory-info {
  flex: 1;
}

.inventory-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.inventory-code {
  font-size: 12px;
  color: #999;
}

.inventory-right {
  text-align: right;
}

.inventory-stock {
  font-size: 14px;
  margin-bottom: 8px;
}

.stock-high {
  color: #52c41a;
}

.stock-medium {
  color: #faad14;
}

.stock-low {
  color: #ff4d4f;
}

/* 完成记录卡片 */
.completed-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.completed-list {
  margin-top: 16px;
}

.completed-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.completed-item:last-child {
  border-bottom: none;
}

.completed-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.completed-type {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.completed-info {
  flex: 1;
}

.completed-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.completed-customer {
  font-size: 12px;
  color: #666;
}

.completed-right {
  text-align: right;
}

.completed-time {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

/* 通知卡片 */
.notice-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.notice-list {
  margin-top: 16px;
}

.notice-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.notice-item:last-child {
  border-bottom: none;
}

.notice-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.notice-tag {
  background-color: #ff4d4f;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}

.notice-title {
  font-size: 14px;
  color: #333;
}

.notice-date {
  font-size: 12px;
  color: #999;
}

.empty-list {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

.empty-list div {
  margin-top: 8px;
  font-size: 14px;
}

/* 通知详情弹窗 */
.notice-popup {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.notice-popup-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.notice-popup-date {
  font-size: 14px;
  color: #999;
  margin-bottom: 20px;
}

.notice-popup-content {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}
</style> 