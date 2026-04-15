<template>
  <div class="work-orders-page">
    <!-- 自定义导航栏 -->
    <div class="custom-navbar">
      <div class="navbar-content">
        <div class="navbar-left" @click="$router.go(-1)">
          <van-icon name="arrow-left" />
          <span>返回</span>
        </div>
        <div class="navbar-title">工单管理</div>
        <div class="navbar-right" @click="refreshData">
          <van-icon name="replay" />
          <span>刷新</span>
        </div>
      </div>
    </div>

    <!-- 筛选标签 -->
    <div class="filter-tabs">
      <div 
        class="filter-tab" 
        :class="{ active: activeTab === tab.key }"
        v-for="tab in filterTabs" 
        :key="tab.key"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
        <span class="tab-count" v-if="tab.count > 0">{{ tab.count }}</span>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <van-search
        v-model="searchKeyword"
        placeholder="搜索工单号、联系人、地址"
        background="#f5f5f5"
        @search="onSearch"
      />
    </div>

    <!-- 工单列表 -->
    <PullRefresh v-model="refreshing" @refresh="onRefresh">
      <List
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div class="work-order-list">
          <div 
            class="work-order-item" 
            v-for="order in workOrders" 
            :key="order.id"
            @click="viewOrderDetail(order.id)"
          >
            <div class="order-header">
              <div class="order-id">#{{ order.booking_no || order.id }}</div>
              <div class="order-status" :class="getStatusClass(order.status)">
                {{ getStatusText(order.status) }}
              </div>
            </div>
            
            <div class="order-content">
              <div class="order-title">{{ order.title || order.device_type || '安装工单' }}</div>
              <div class="order-info">
                <div class="info-item">
                  <van-icon name="location-o" />
                  <span>{{ order.address }}</span>
                </div>
                <div class="info-item">
                  <van-icon name="clock-o" />
                  <span>{{ formatDateTime(order.booking_date) }} {{ order.time_slot }}</span>
                </div>
                <div class="info-item">
                  <van-icon name="phone-o" />
                  <span>{{ order.contact_phone }}</span>
                </div>
                <div class="info-item" v-if="order.engineer && order.engineer.name">
                  <van-icon name="user-o" />
                  <span>{{ order.engineer.name }}</span>
                </div>
              </div>
            </div>
            
            <div class="order-actions" v-if="order.status === 'pending' || order.status === 'confirmed'">
              <van-button 
                size="small" 
                type="primary" 
                @click.stop="acceptOrder(order.id)"
              >
                接受工单
              </van-button>
            </div>
            
            <div class="order-actions" v-else-if="order.status === 'assigned' || order.status === 'in_progress'">
              <van-button 
                size="small" 
                type="success" 
                @click.stop="startWork(order.id)"
                v-if="order.status === 'assigned'"
              >
                开始工作
              </van-button>
              <van-button 
                size="small" 
                type="success" 
                @click.stop="completeOrder(order.id)"
                v-else-if="order.status === 'in_progress'"
              >
                完成工单
              </van-button>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div class="empty-state" v-if="workOrders.length === 0 && !loading">
          <van-icon name="notes-o" size="60" color="#ddd" />
          <div class="empty-text">暂无工单</div>
        </div>
      </List>
    </PullRefresh>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { PullRefresh, List, Button as VanButton, Icon as VanIcon, Search as VanSearch } from 'vant'
import Toast from '@/utils/toast-fix'
import { getWorkOrders, acceptWorkOrder } from '@/api/engineer'
import { useRouter } from 'vue-router'

const router = useRouter()

// 页面状态
const loading = ref(false)
const refreshing = ref(false)
const finished = ref(false)
const currentPage = ref(1)
const activeTab = ref('all')
const searchKeyword = ref('')

// 工单列表
const workOrders = ref([])

// 筛选标签
const filterTabs = reactive([
  { key: 'all', label: '全部', count: 0 },
  { key: 'pending', label: '待接单', count: 0 },
  { key: 'assigned', label: '已分配', count: 0 },
  { key: 'in_progress', label: '处理中', count: 0 },
  { key: 'completed', label: '已完成', count: 0 }
])

// 加载工单数据
const loadWorkOrders = async (isRefresh = false) => {
  try {
    if (isRefresh) {
      currentPage.value = 1
      finished.value = false
    }
    
    const params = {
      page: currentPage.value,
      per_page: 20,
      status: activeTab.value === 'all' ? '' : activeTab.value,
      keyword: searchKeyword.value
    }
    
    const res = await getWorkOrders(params)
    
    if (res.code === 0) {
      const newOrders = res.data.data || []
      
      if (isRefresh) {
        workOrders.value = newOrders
      } else {
        workOrders.value.push(...newOrders)
      }
      
      // 更新标签计数
      updateTabCounts(res.data.counts || {})
      
      // 检查是否还有更多数据
      if (newOrders.length < params.per_page) {
        finished.value = true
      } else {
        currentPage.value++
      }
    } else {
      Toast.fail(res.message || '加载失败')
    }
  } catch (error) {
    console.error('加载工单失败:', error)
    Toast.fail('加载失败')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 更新标签计数
const updateTabCounts = (counts) => {
  filterTabs.forEach(tab => {
    tab.count = counts[tab.key] || 0
  })
}

// 切换标签
const switchTab = (tabKey) => {
  if (activeTab.value === tabKey) return
  
  activeTab.value = tabKey
  currentPage.value = 1
  finished.value = false
  workOrders.value = []
  loadWorkOrders(true)
}

// 搜索工单
const onSearch = () => {
  currentPage.value = 1
  finished.value = false
  workOrders.value = []
  loadWorkOrders(true)
}

// 下拉刷新
const onRefresh = () => {
  loadWorkOrders(true)
}

// 上拉加载
const onLoad = () => {
  if (!finished.value) {
    loadWorkOrders()
  }
}

// 刷新数据
const refreshData = () => {
  refreshing.value = true
  onRefresh()
}

// 接受工单
const acceptOrder = async (orderId) => {
  try {
    const res = await acceptWorkOrder(orderId)
    if (res.code === 0) {
      Toast.success('接单成功')
      // 刷新列表
      refreshData()
    } else {
      Toast.fail(res.message || '接单失败')
    }
  } catch (error) {
    console.error('接单失败:', error)
    Toast.fail('接单失败')
  }
}

// 开始工作
const startWork = async (orderId) => {
  try {
    // 这里应该调用开始工作的API，暂时直接更新状态
    Toast.success('开始工作')
    // 刷新列表
    refreshData()
  } catch (error) {
    console.error('开始工作失败:', error)
    Toast.fail('开始工作失败')
  }
}

// 完成工单
const completeOrder = async (orderId) => {
  try {
    router.push(`/engineer/work-orders/${orderId}`)
  } catch (error) {
    console.error('跳转失败:', error)
    Toast.fail('跳转失败')
  }
}

// 查看工单详情
const viewOrderDetail = (orderId) => {
  router.push(`/engineer/work-orders/${orderId}`)
}

// 获取状态样式
const getStatusClass = (status) => {
  const statusMap = {
    'pending': 'status-pending',
    'confirmed': 'status-confirmed',
    'assigned': 'status-assigned',
    'in_progress': 'status-processing',
    'completed': 'status-completed',
    'cancelled': 'status-cancelled'
  }
  return statusMap[status] || ''
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'pending': '待接单',
    'confirmed': '已确认',
    'assigned': '已分配',
    'in_progress': '处理中',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status] || '未知'
}

// 格式化日期时间
const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

// 页面挂载时加载数据
onMounted(() => {
  loadWorkOrders(true)
})
</script>

<style scoped>
.work-orders-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 自定义导航栏 */
.custom-navbar {
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  color: white;
  padding: 0 12px;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 4px;
}

.navbar-left, .navbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 16px;
  cursor: pointer;
}

.navbar-title {
  font-size: 18px;
  font-weight: bold;
}

/* 搜索栏 */
.search-bar {
  padding: 8px 12px;
}

/* 筛选标签 */
.filter-tabs {
  display: flex;
  background: white;
  padding: 12px 16px;
  gap: 20px;
  border-bottom: 1px solid #eee;
  overflow-x: auto;
}

.filter-tab {
  position: relative;
  padding: 8px 0;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.3s;
}

.filter-tab.active {
  color: #4A90E2;
  font-weight: bold;
}

.filter-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #4A90E2;
}

.tab-count {
  background: #ff4444;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 4px;
}

/* 工单列表 */
.work-order-list {
  padding: 12px;
}

.work-order-item {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

.work-order-item:active {
  transform: scale(0.98);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.order-id {
  font-weight: bold;
  color: #333;
}

.order-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.status-pending { background: #fff3cd; color: #856404; }
.status-confirmed { background: #cce5ff; color: #004085; }
.status-assigned { background: #d4edda; color: #155724; }
.status-processing { background: #cce5ff; color: #004085; }
.status-completed { background: #d1ecf1; color: #0c5460; }
.status-cancelled { background: #f8d7da; color: #721c24; }

.order-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
}

.order-actions {
  margin-top: 12px;
  text-align: right;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-text {
  margin-top: 12px;
  color: #999;
  font-size: 14px;
}
</style>