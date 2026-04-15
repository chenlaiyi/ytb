<template>
  <div class="order-list">
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
            v-for="(order, index) in orders" 
            :key="index"
            @click="$router.push(`/engineer/order-detail/${order.id}`)"
          >
            <div class="order-header">
              <div class="order-no">工单号: {{ order.orderNo }}</div>
              <div class="order-status" :class="getStatusClass(order.status)">
                {{ getStatusText(order.status) }}
              </div>
            </div>
            <div class="order-body">
              <div class="order-title">{{ order.title }}</div>
              <div class="order-address">{{ order.address }}</div>
              <div class="order-user">
                <span>{{ order.userName }}</span>
                <span>{{ order.phone }}</span>
              </div>
              <div class="order-time">预约时间: {{ order.appointmentTime }}</div>
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
import { PullRefresh, List, Empty } from 'vant'

const props = defineProps({
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
  // 可以在这里初始化数据
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

// 获取工单状态样式类
const getStatusClass = (status) => {
  switch (status) {
    case 'pending':
      return 'status-pending'
    case 'processing':
      return 'status-processing'
    case 'completed':
      return 'status-completed'
    case 'cancelled':
      return 'status-cancelled'
    default:
      return ''
  }
}

// 获取工单状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'pending':
      return '待处理'
    case 'processing':
      return '处理中'
    case 'completed':
      return '已完成'
    case 'cancelled':
      return '已取消'
    default:
      return '未知'
  }
}

// 映射后端状态到前端状态
const mapOrderStatus = (backendStatus) => {
  switch (backendStatus) {
    case 0:
    case '0':
      return 'pending'
    case 1:
    case '1':
      return 'processing'
    case 2:
    case '2':
      return 'completed'
    case 3:
    case '3':
      return 'cancelled'
    default:
      return 'pending'
  }
}

// 获取工单类型文本
const getOrderTypeText = (type) => {
  switch (type) {
    case 1:
    case '1':
      return '预约工单'
    case 2:
    case '2':
      return '维修工单'
    case 3:
    case '3':
      return '拆机工单'
    case 4:
    case '4':
      return '滤芯工单'
    case 5:
    case '5':
      return '安装工单'
    case 6:
    case '6':
      return '滤芯预警'
    default:
      return '净水器工单'
  }
}

// 加载工单数据
const loadOrders = async () => {
  try {
    // 调用净水器工单API
    const token = localStorage.getItem('token')
    if (!token) {
      console.error('未找到登录token')
      return
    }

    const params = new URLSearchParams({
      page: page.value,
      per_page: pageSize
    })
    
    // 根据状态筛选
    if (props.status !== 'all') {
      params.append('status', props.status)
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
      
      // 转换数据格式以匹配前端显示
      const formattedOrders = newOrders.map(order => ({
        id: order.id,
        orderNo: order.work_order_no || `WO${order.id}`,
        status: mapOrderStatus(order.status),
        title: getOrderTypeText(order.type),
        address: order.address || '地址信息待完善',
        userName: order.customer_name || '客户姓名待完善',
        phone: order.customer_phone || '联系电话待完善',
        appointmentTime: order.appointment_time || order.created_at || '时间待确认'
      }))
      
      if (page.value === 1) {
        orders.value = formattedOrders
      } else {
        orders.value = [...orders.value, ...formattedOrders]
      }
      
      // 检查是否还有更多数据
      const hasMore = result.data.current_page < result.data.last_page
      finished.value = !hasMore
      
      if (hasMore) {
        page.value++
      }
    } else {
      console.error('获取工单数据失败:', result.message)
      finished.value = true
    }
  } catch (error) {
    console.error('加载工单数据失败:', error)
    finished.value = true
  }
}

// 生成模拟工单数据
const generateMockOrders = (count, status) => {
  const statusList = ['pending', 'processing', 'completed', 'cancelled']
  const titleList = [
    '净水器安装服务',
    '净水器滤芯更换',
    '家用净水器维修',
    '商用净水器安装',
    '水质检测服务'
  ]
  const addressList = [
    '北京市朝阳区建国路88号',
    '上海市浦东新区张江高科技园区',
    '广州市天河区天河路385号',
    '深圳市南山区科技园',
    '杭州市西湖区文三路'
  ]
  const nameList = ['张三', '李四', '王五', '赵六', '钱七']
  
  return Array.from({ length: count }, (_, i) => {
    // 根据传入的status筛选，如果是all则随机生成
    const orderStatus = status === 'all' ? 
      statusList[Math.floor(Math.random() * statusList.length)] : 
      status
    
    return {
      id: Date.now() + i,
      orderNo: `WO${Date.now().toString().slice(-8)}${i}`,
      status: orderStatus,
      title: titleList[Math.floor(Math.random() * titleList.length)],
      address: addressList[Math.floor(Math.random() * addressList.length)],
      userName: nameList[Math.floor(Math.random() * nameList.length)],
      phone: `1${Math.floor(Math.random() * 9 + 1)}${Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('')}`,
      appointmentTime: new Date(Date.now() + Math.floor(Math.random() * 10) * 86400000).toLocaleDateString() + ' ' + 
        `${Math.floor(Math.random() * 8 + 9)}:00-${Math.floor(Math.random() * 8 + 9 + 2)}:00`
    }
  })
}
</script>

<style scoped>
.order-list {
  padding: 10px;
  background-color: #f7f8fa;
}

.order-item {
  margin-bottom: 12px;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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
}

.status-pending {
  color: #ff9800;
}

.status-processing {
  color: #2196f3;
}

.status-completed {
  color: #4caf50;
}

.status-cancelled {
  color: #f44336;
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
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.order-user {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.order-time {
  font-size: 14px;
  color: #999;
}

.empty-list {
  padding: 40px 0;
}
</style> 