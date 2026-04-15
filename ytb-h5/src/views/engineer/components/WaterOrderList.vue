<template>
  <div class="water-order-list">
    <!-- 下拉刷新和上拉加载组件 -->
    <PullRefresh v-model="refreshing" @refresh="onRefresh">
      <List
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多数据了"
        @load="onLoad"
      >
        <!-- 工单列表 -->
        <div v-if="orders.length > 0">
          <div 
            class="order-item" 
            v-for="order in orders" 
            :key="order.id"
            @click="goToOrderDetail(order)"
          >
            <div class="order-header">
              <div class="order-no">工单号: {{ order.work_order_code || `WO${order.id}` }}</div>
              <div class="order-status" :class="getStatusClass(order)">
                {{ getStatusText(order) }}
              </div>
              <div class="order-classification" v-if="order.work_order_classification_name">
                {{ order.work_order_classification_name }}
              </div>
            </div>
            <div class="order-body">
              <div class="order-title">{{ order.title || getOrderTypeText(order) }}</div>
              
              <!-- 滤芯预警工单显示设备号和滤芯信息 -->
              <div v-if="order.order_type === '10' && order.filter_info" class="filter-alert-info">
                <div class="device-info" v-if="order.device_number">
                  <Icon name="desktop-o" size="14" />
                  设备号: {{ order.device_number }}
                </div>
                <div class="filter-list">
                  <div 
                    v-for="filter in order.filter_info" 
                    :key="filter.name"
                    class="filter-item"
                    :class="getFilterStatusClass(filter.remaining_percentage)"
                  >
                    <span class="filter-name">{{ filter.name }}</span>
                    <span class="filter-percentage">剩余{{ filter.remaining_percentage }}%</span>
                  </div>
                </div>
                <div v-if="order.min_filter_life" class="min-life-warning">
                  <Icon name="warning-o" size="14" color="#ff4444" />
                  最低剩余寿命: {{ order.min_filter_life }}%
                </div>
              </div>
              
              <!-- 普通工单信息 -->
              <div v-else>
                <div class="order-address" v-if="order.address">
                  <Icon name="location-o" size="14" />
                  {{ order.address }}
                </div>
                <div class="order-user" v-if="order.client_name || order.client_phone">
                  <span v-if="order.client_name">{{ order.client_name }}</span>
                  <span v-if="order.client_phone">{{ order.client_phone }}</span>
                </div>
              </div>
              
              <div class="order-time">
                创建时间: {{ formatTime(order.create_date) }}
              </div>
              <div class="order-time" v-if="order.update_date">
                更新时间: {{ formatTime(order.update_date) }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- 无数据时显示 -->
        <div v-else-if="!loading && !refreshing" class="empty-list">
          <van-empty description="暂无工单" />
        </div>
      </List>
    </PullRefresh>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps } from 'vue'
import { useRouter } from 'vue-router'
import { PullRefresh, List, Empty, Icon, showToast } from 'vant'

const router = useRouter()

const props = defineProps({
  type: {
    type: String,
    default: 'all'
  },
  status: {
    type: String,
    default: 'all'
  }
})

// 页面状态
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const page = ref(1)
const pageSize = 10
const orders = ref([])

// 页面加载时
onMounted(() => {
  // 初始化数据：首次加载
  onLoad()
})

// 下拉刷新
const onRefresh = async () => {
  // 重置页码和数据
  finished.value = false
  page.value = 1
  orders.value = []
  
  // 重新加载数据
  await loadOrders()
  refreshing.value = false
}

// 上拉加载
const onLoad = async () => {
  if (refreshing.value) return
  
  loading.value = true
  await loadOrders()
  loading.value = false
}

// 加载工单数据
const loadOrders = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      console.error('未找到登录token')
      showToast('登录已失效，请先登录')
      finished.value = true
      return
    }

    const params = new URLSearchParams({
      page: page.value,
      per_page: pageSize
    })
    
    // 根据工单类型筛选
    if (props.type !== 'all') {
      // 直接传递类型参数给后端，后端会处理映射
      params.append('type', props.type)
      console.log('工单类型筛选:', props.type)
    }
    
    // 根据状态筛选
    if (props.status !== 'all') {
      params.append('status', props.status)
      console.log('工单状态筛选:', props.status)
    }

    const response = await fetch(`/api/mobile/v1/engineer/water-work-orders?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    if (result.code === 0 && result.data) {
      const newOrders = result.data.data || []
      
      if (page.value === 1) {
        orders.value = newOrders
      } else {
        orders.value = [...orders.value, ...newOrders]
      }
      
      // 检查是否还有更多数据
      const hasMore = result.data.current_page < result.data.last_page
      finished.value = !hasMore
      
      if (hasMore) {
        page.value++
      }
    } else {
      console.error('获取工单数据失败:', result.message)
      showToast(result.message || '获取工单失败')
      finished.value = true
    }
  } catch (error) {
    console.error('加载工单数据失败:', error)
    showToast('加载工单失败')
    finished.value = true
  }
}

// 跳转到工单详情页
const goToOrderDetail = (order) => {
  // 如果是滤芯预警工单，跳转到滤芯预警详情页
  if (order.order_type === '10' || props.type === 'filter_alert') {
    // 使用设备号的哈希作为ID
    const hashId = order.device_number ? 
      generateFilterAlertId(order.device_number) : 
      order.id;
    router.push(`/engineer/filter-alert-detail/${hashId}`)
  } else {
    // 普通工单跳转到工单详情页
    router.push(`/engineer/water-order-detail/${order.id}`)
  }
}

// 生成滤芯预警工单ID（与后端逻辑保持一致）
const generateFilterAlertId = (deviceNumber) => {
  // 简单使用设备号加后缀的方式，与后端哈希匹配逻辑保持一致
  // 后端会尝试多种哈希格式进行匹配
  return deviceNumber + '_filter_alert'
}

// 获取工单状态样式类
const getStatusClass = (input) => {
  // 支持传入整个order或简单状态码
  const status = typeof input === 'object' && input !== null
    ? (input.work_status || input.status || '')
    : input
  switch (status) {
    case '01':
    case 'pending':
    case null:
      return 'status-pending'
    case '02':
    case 'completed':
      return 'status-completed'
    case 'processing':
      return 'status-processing'
    case '04':
    case 'cancelled':
      return 'status-cancelled'
    default:
      return ''
  }
}

// 获取工单状态文本
const getStatusText = (order) => {
  // 优先使用后端计算的状态名称
  if (order.work_status_name) {
    return order.work_status_name;
  }

  // 如果有旧的简单状态值，作为备用（向后兼容）
  if (order.status) {
    const statusMap = {
      'pending': '待处理',
      'processing': '处理中',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[order.status] || order.status;
  }

  // 使用新的复合状态判断逻辑（备用）
  const classification = order.work_order_classification;
  const orderType = order.work_order_type;

  // 安装工单 (01) - 使用order_type字典
  if (classification === '01') {
    switch (orderType) {
      case '01': return '公司派装';
      case '02': return '待派师傅';
      case '03': return '待安装';
      case '05': return '已激活';
      case '06': return '待发货';
      case '09': return '已完成';
      case '10': return '撤销';
      default: return '未知状态';
    }
  }

  // 维修工单 (02) - 使用or_wei字典
  if (classification === '02') {
    switch (orderType) {
      case '01': return '待派单';
      case '02': return '待维修';
      case '03': return '已完成';
      default: return '未知状态';
    }
  }

  // 拆机工单 (03) - 使用or_chai字典
  if (classification === '03') {
    switch (orderType) {
      case '01': return '待派单';
      case '02': return '待拆机';
      case '04': return '待还库';
      case '09': return '已完成';
      default: return '未知状态';
    }
  }

  // 迁机工单 (04) - 使用or_qian字典
  if (classification === '04') {
    switch (orderType) {
      case '01': return '待支付';
      case '02': return '待派单';
      case '03': return '待迁机';
      case '04': return '已完成';
      default: return '未知状态';
    }
  }

  return '未知状态';
};

// 获取工单类型文本
const getOrderTypeText = (order) => {
  const typeMap = {
    '01': '预约工单',
    '02': '维修工单',
    '03': '拆机工单',
    '06': '滤芯工单',
    '09': '安装工单',
    '10': '滤芯预警'
  };
  return typeMap[order.order_type] || '净水器工单';
}

// 获取滤芯状态样式类
const getFilterStatusClass = (percentage) => {
  if (percentage <= 5) {
    return 'filter-critical'
  } else if (percentage <= 20) {
    return 'filter-warning'
  } else {
    return 'filter-normal'
  }
}

// 格式化时间（兼容 iOS Safari 日期解析）
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  try {
    let s = timeStr
    // 时间戳（秒/毫秒）
    if (/^\d+$/.test(s)) {
      const n = Number(s)
      const d = new Date(s.length === 10 ? n * 1000 : n)
      return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    }
    // 替换连字符为斜杠，去掉T与Z，兼容 iOS
    s = s.replace(/T/, ' ').replace(/Z$/, '').replace(/-/g, '/').replace(/\.\d{3}$/, '')
    const d = new Date(s)
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    }
  } catch (e) {
    // ignore
  }
  return String(timeStr)
}
</script>

<style scoped>
.water-order-list {
  padding: 10px;
  background-color: #f7f8fa;
}

.order-item {
  margin-bottom: 12px;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
}

.order-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 滤芯预警信息样式 */
.filter-alert-info {
  margin-top: 8px;
}

.device-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.filter-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.filter-critical {
  background-color: #ffebee;
  color: #d32f2f;
  border: 1px solid #ffcdd2;
}

.filter-warning {
  background-color: #fff3e0;
  color: #f57c00;
  border: 1px solid #ffcc02;
}

.filter-normal {
  background-color: #e8f5e8;
  color: #388e3c;
  border: 1px solid #c8e6c9;
}

.filter-name {
  font-weight: 600;
}

.filter-percentage {
  font-size: 11px;
}

.min-life-warning {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #ff4444;
  font-weight: 500;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f9f9f9;
  border-bottom: 1px solid #f0f0f0;
}

.order-no {
  font-size: 14px;
  color: #999;
}

.order-status {
  font-size: 14px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 12px;
}

.status-pending {
  color: #ff9800;
  background-color: #fff3e0;
}

.status-processing {
  color: #2196f3;
  background-color: #e3f2fd;
}

.status-completed {
  color: #4caf50;
  background-color: #e8f5e9;
}

.status-cancelled {
  color: #f44336;
  background-color: #ffebee;
}

.order-body {
  padding: 16px;
}

.order-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 10px;
  color: #333;
}

.order-address {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  gap: 4px;
}

.order-user {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.order-time {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.order-time:last-child {
  margin-bottom: 0;
}

.empty-list {
  padding: 40px 0;
}
</style>
