<template>
  <div class="agent-container">
    <!-- 移除头部导航条，界面更简洁 -->
    
    <div class="content">
      <!-- 渠道商信息卡片 -->
      <div class="agent-card">
        <div class="agent-header">
          <div class="avatar-wrapper">
            <VanImage
              round
              width="60"
              height="60"
              :src="agentInfo.logo || userStore.userAvatar || 'https://img.itapgo.com/profile/default-shop.png'"
            />
          </div>
          <div class="agent-info">
            <div class="agent-name">{{ agentInfo.name || userStore.userName || '渠道商名称' }}</div>
            <div class="agent-level">{{ agentInfo.level || '金牌代理' }}</div>
            <div class="agent-id">代理编号: {{ agentInfo.code || 'A10086' }}</div>
          </div>
          <div class="agent-status" :class="{'status-active': agentInfo.status === 'active'}">
            {{ agentInfo.status === 'active' ? '已认证' : '待认证' }}
          </div>
        </div>
      </div>
      
      <!-- 业绩概览 -->
      <div class="stats-card">
        <div class="card-title">业绩概览</div>
        <div class="stats-grid">
          <div class="stats-item">
            <div class="stats-label">今日销量</div>
            <div class="stats-value">{{ businessData.todaySales || '0' }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">本月销量</div>
            <div class="stats-value">{{ businessData.monthSales || '0' }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">累计销量</div>
            <div class="stats-value">{{ businessData.totalSales || '0' }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">今日销售额</div>
            <div class="stats-value">¥{{ businessData.todayAmount || '0' }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">本月销售额</div>
            <div class="stats-value">¥{{ businessData.monthAmount || '0' }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">待处理订单</div>
            <div class="stats-value">{{ businessData.pendingOrders || '0' }}单</div>
          </div>
        </div>
      </div>
      
      <!-- 收益统计 -->
      <div class="income-card">
        <div class="card-title">收益统计</div>
        <div class="stats-grid">
          <div class="stats-item">
            <div class="stats-label">账户余额</div>
            <div class="stats-value">¥{{ incomeData.balance || '0.00' }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">今日收益</div>
            <div class="stats-value">¥{{ incomeData.todayIncome || '0.00' }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">本月收益</div>
            <div class="stats-value">¥{{ incomeData.monthIncome || '0.00' }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">累计收益</div>
            <div class="stats-value">¥{{ incomeData.totalIncome || '0.00' }}</div>
          </div>
          <div class="withdrawal-btn">
            <Button type="primary" size="small" block @click="$router.push('/agent/withdrawal')">申请提现</Button>
          </div>
        </div>
      </div>
      
      <!-- 销售趋势 -->
      <div class="trend-card">
        <div class="card-title">
          <span>销售趋势</span>
          <div class="tab-group">
            <div 
              v-for="(tab, index) in trendTabs" 
              :key="index" 
              :class="['tab-item', {active: currentTrendTab === tab.value}]"
              @click="currentTrendTab = tab.value"
            >
              {{ tab.name }}
            </div>
          </div>
        </div>
        <div class="trend-content">
          <!-- 真实场景中这里应该用echarts或其他图表库 -->
          <div class="trend-placeholder">
            <Icon name="chart-trending-o" size="40" color="#cccccc" />
            <div>{{ currentTrendTab }}趋势图</div>
          </div>
        </div>
      </div>
      
      <!-- 功能区 -->
      <div class="function-card">
        <div class="card-title">渠道功能</div>
        <Grid :column-num="4" :border="false" square>
          <GridItem v-for="(feature, index) in features" :key="index" :to="feature.path">
            <Icon :name="feature.icon" size="28" :color="feature.color" />
            <div class="text">{{ feature.name }}</div>
          </GridItem>
        </Grid>
      </div>
      
      <!-- 订单管理 -->
      <div class="order-card">
        <div class="card-title">订单管理</div>
        <Grid :column-num="4" :border="false">
          <GridItem v-for="(status, index) in orderStatus" :key="index" :to="status.path">
            <Badge :content="status.count || ''" :max="99">
              <Icon :name="status.icon" size="28" />
            </Badge>
            <div class="text">{{ status.name }}</div>
          </GridItem>
        </Grid>
      </div>
      
      <!-- 最近订单 -->
      <div class="recent-card">
        <div class="card-title">
          <span>最近订单</span>
          <router-link to="/agent/orders" class="more">查看全部 <Icon name="arrow" /></router-link>
        </div>
        <div class="order-list" v-if="recentOrders.length > 0">
          <div 
            class="order-item" 
            v-for="(order, index) in recentOrders" 
            :key="index"
            @click="$router.push(`/agent/orders/${order.id}`)"
          >
            <div class="order-info">
              <div class="order-title">{{ order.product }}</div>
              <div class="order-no">订单号: {{ order.orderNo }}</div>
              <div class="order-time">{{ order.createTime }}</div>
            </div>
            <div class="order-amount">¥{{ order.amount }}</div>
            <div class="order-tag" :class="getOrderStatusClass(order.status)">
              {{ getOrderStatusText(order.status) }}
            </div>
          </div>
        </div>
        <div class="empty-list" v-else>
          <Icon name="orders-o" size="40" color="#cccccc" />
          <div>暂无订单数据</div>
        </div>
      </div>
      
      <!-- 区域销售分布 -->
      <div class="region-card">
        <div class="card-title">
          <span>区域销售分布</span>
          <router-link to="/agent/analysis" class="more">查看详情 <Icon name="arrow" /></router-link>
        </div>
        <div class="region-content">
          <!-- 真实场景中这里应该用echarts或其他图表库 -->
          <div class="region-placeholder">
            <Icon name="location-o" size="40" color="#cccccc" />
            <div>区域分布图</div>
          </div>
        </div>
        <div class="region-list">
          <div class="region-item" v-for="(region, index) in regionData" :key="index">
            <div class="region-name">{{ region.name }}</div>
            <div class="region-progress">
              <Progress 
                :percentage="region.percentage" 
                :color="region.color"
                :show-pivot="false"
              />
            </div>
            <div class="region-value">{{ region.value }}%</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { NavBar, Icon, Grid, GridItem, Badge, Progress, Button, Image as VanImage } from 'vant'
import Toast from '@/utils/toast-fix'
import { getAgentWorkspace } from '@/api/user'
import { useUserStore } from '@/stores/user'

// 获取用户信息存储
const userStore = useUserStore()

// 渠道商信息
const agentInfo = ref({
  name: userStore.userName || '',
  logo: userStore.userAvatar || '',
  level: '',
  code: '',
  status: ''
})

// 业绩数据
const businessData = ref({
  todaySales: '',
  monthSales: '',
  totalSales: '',
  todayAmount: '',
  monthAmount: '',
  pendingOrders: '',
})

// 收入数据
const incomeData = ref({
  balance: '',
  todayIncome: '',
  monthIncome: '',
  totalIncome: '',
})

// 趋势图标签页
const trendTabs = ref([
  { name: '今日', value: '今日' },
  { name: '7天', value: '7天' },
  { name: '30天', value: '30天' },
])
const currentTrendTab = ref('今日')

// 渠道功能
const features = ref([
  { name: '库存管理', icon: 'cart-o', path: '/agent/inventory', color: '#1989fa' },
  { name: '下级商户', icon: 'friends-o', path: '/agent/merchants', color: '#ff9500' },
  { name: '客户管理', icon: 'contact', path: '/agent/customers', color: '#07c160' },
  { name: '数据报表', icon: 'bar-chart-o', path: '/agent/reports', color: '#ee0a24' },
  { name: '市场活动', icon: 'gift-o', path: '/agent/activities', color: '#7232dd' },
  { name: '退换货', icon: 'replay', path: '/agent/returns', color: '#ff6034' },
  { name: '财务管理', icon: 'balance-o', path: '/agent/finance', color: '#2eb57d' },
  { name: '系统设置', icon: 'setting-o', path: '/agent/settings', color: '#969799' },
])

// 订单状态
const orderStatus = ref([
  { name: '待付款', icon: 'pending-payment', path: '/agent/orders?status=pending_payment', count: 0 },
  { name: '待发货', icon: 'logistics', path: '/agent/orders?status=pending_ship', count: 0 },
  { name: '待收货', icon: 'send-gift-o', path: '/agent/orders?status=shipped', count: 0 },
  { name: '售后', icon: 'service-o', path: '/agent/orders?status=after_sale', count: 0 },
])

// 最近订单
const recentOrders = ref([])

// 区域数据
const regionData = ref([])

// 获取订单状态样式
const getOrderStatusClass = (status) => {
  switch (status) {
    case 'pending_payment':
      return 'status-pending'
    case 'pending_ship':
      return 'status-processing'
    case 'shipped':
      return 'status-shipped'
    case 'completed':
      return 'status-completed'
    case 'cancelled':
      return 'status-cancelled'
    case 'after_sale':
      return 'status-after-sale'
    default:
      return ''
  }
}

// 获取订单状态文本
const getOrderStatusText = (status) => {
  switch (status) {
    case 'pending_payment':
      return '待付款'
    case 'pending_ship':
      return '待发货'
    case 'shipped':
      return '已发货'
    case 'completed':
      return '已完成'
    case 'cancelled':
      return '已取消'
    case 'after_sale':
      return '售后中'
    default:
      return '未知'
  }
}

// 获取渠道商工作台数据
const fetchAgentData = async () => {
  try {
    Toast.loading({
      message: '加载中...',
      forbidClick: true,
    })
    
    const res = await getAgentWorkspace()
    
    if (res.code === 0 && res.data) {
      // 更新渠道商信息
      agentInfo.value = {
        ...res.data.agentInfo,
        name: res.data.agentInfo?.name || userStore.userName || '渠道商名称',
        logo: res.data.agentInfo?.logo || userStore.userAvatar || 'https://img.itapgo.com/profile/default-shop.png'
      }
      
      // 更新业绩数据
      businessData.value = res.data.businessData || {}
      
      // 更新收入数据
      incomeData.value = res.data.incomeData || {}
      
      // 更新订单状态数量
      if (res.data.orderStatus) {
        orderStatus.value.forEach(item => {
          const status = res.data.orderStatus.find(s => s.status === item.name)
          if (status) {
            item.count = status.count
          }
        })
      }
      
      // 更新最近订单
      recentOrders.value = res.data.recentOrders || []
      
      // 更新区域数据
      regionData.value = res.data.regionData || []
    }
    
    Toast.clear()
  } catch (error) {
    console.error('获取渠道商数据失败', error)
    Toast.clear()
    
    // 使用用户存储中的实际用户信息
    agentInfo.value = {
      name: userStore.userName || '渠道商名称',
      logo: userStore.userAvatar || 'https://img.itapgo.com/profile/default-shop.png',
      level: '金牌代理',
      code: 'A10086',
      status: 'active'
    }
    
    businessData.value = {
      todaySales: '12',
      monthSales: '345',
      totalSales: '5678',
      todayAmount: '9600',
      monthAmount: '276000',
      pendingOrders: '8'
    }
    
    incomeData.value = {
      balance: '56789.00',
      todayIncome: '1920.00',
      monthIncome: '55200.00',
      totalIncome: '1135600.00'
    }
    
    orderStatus.value = [
      { name: '待付款', icon: 'pending-payment', path: '/agent/orders?status=pending_payment', count: 3 },
      { name: '待发货', icon: 'logistics', path: '/agent/orders?status=pending_ship', count: 5 },
      { name: '待收货', icon: 'send-gift-o', path: '/agent/orders?status=shipped', count: 8 },
      { name: '售后', icon: 'service-o', path: '/agent/orders?status=after_sale', count: 2 },
    ]
    
    recentOrders.value = [
      { id: '1001', product: 'A8净水器家用直饮机', orderNo: 'DD202305100001', createTime: '2023-05-10 10:23:45', amount: '1299.00', status: 'completed' },
      { id: '1002', product: 'RO反渗透纯水机', orderNo: 'DD202305100002', createTime: '2023-05-10 14:33:28', amount: '2599.00', status: 'shipped' },
      { id: '1003', product: '前置过滤器+PP棉套装', orderNo: 'DD202305090008', createTime: '2023-05-09 16:45:12', amount: '399.00', status: 'pending_ship' },
      { id: '1004', product: '厨下净水器套装', orderNo: 'DD202305090005', createTime: '2023-05-09 09:12:36', amount: '899.00', status: 'pending_payment' }
    ]
    
    regionData.value = [
      { name: '广州市', percentage: 35, value: 35, color: '#1989fa' },
      { name: '深圳市', percentage: 25, value: 25, color: '#07c160' },
      { name: '佛山市', percentage: 15, value: 15, color: '#ff9500' },
      { name: '东莞市', percentage: 10, value: 10, color: '#ee0a24' },
      { name: '其他', percentage: 15, value: 15, color: '#7232dd' }
    ]
  }
}

onMounted(() => {
  fetchAgentData()
})
</script>

<style scoped>
.agent-container {
  background-color: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 20px;
  padding-top: 20px; /* 添加顶部内边距替代导航条空间 */
}

.content {
  padding: 0 12px;
}

/* 渠道商信息卡片 */
.agent-card {
  margin-top: 12px;
  background: linear-gradient(135deg, #ff9500 0%, #ff6034 100%);
  border-radius: 8px;
  padding: 15px;
  color: #fff;
  box-shadow: 0 2px 12px rgba(255, 149, 0, 0.2);
}

.agent-header {
  display: flex;
  align-items: center;
}

.avatar-wrapper {
  margin-right: 15px;
}

.agent-info {
  flex: 1;
}

.agent-name {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 4px;
}

.agent-level {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.agent-id {
  font-size: 12px;
  opacity: 0.8;
}

.agent-status {
  padding: 3px 8px;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.2);
  font-size: 12px;
}

.status-active {
  background-color: #07c160;
  color: #fff;
}

/* 业绩概览卡片 */
.stats-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.card-title {
  margin-bottom: 15px;
  font-size: 15px;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stats-item {
  text-align: center;
}

.stats-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 5px;
}

.stats-value {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

/* 收益统计卡片 */
.income-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.withdrawal-btn {
  grid-column: span 3;
  margin-top: 10px;
}

/* 销售趋势卡片 */
.trend-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.tab-group {
  display: flex;
}

.tab-item {
  font-size: 12px;
  padding: 4px 8px;
  margin-left: 5px;
  border-radius: 12px;
  color: #999;
  cursor: pointer;
}

.tab-item.active {
  background-color: #ff9500;
  color: #fff;
}

.trend-content {
  height: 180px;
}

.trend-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #999;
  font-size: 14px;
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

/* 订单管理卡片 */
.order-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

/* 最近订单卡片 */
.recent-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.more {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
}

.order-list {
  margin-top: 10px;
}

.order-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.order-item:last-child {
  border-bottom: none;
}

.order-info {
  flex: 1;
}

.order-title {
  font-size: 14px;
  margin-bottom: 4px;
}

.order-no, .order-time {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.order-amount {
  font-size: 14px;
  font-weight: 500;
  margin: 0 12px;
  color: #ff6034;
}

.order-tag {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
}

.status-pending {
  background-color: #e6f7ff;
  color: #1989fa;
}

.status-processing {
  background-color: #fff7e6;
  color: #ff9500;
}

.status-shipped {
  background-color: #e6f7ff;
  color: #1989fa;
}

.status-completed {
  background-color: #e8f5e9;
  color: #07c160;
}

.status-cancelled {
  background-color: #f5f5f5;
  color: #999;
}

.status-after-sale {
  background-color: #fce8e8;
  color: #ee0a24;
}

.empty-list {
  height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #999;
  font-size: 14px;
}

/* 区域分布卡片 */
.region-card {
  margin-top: 12px;
  margin-bottom: 20px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.region-content {
  height: 180px;
  margin-bottom: 10px;
}

.region-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #999;
  font-size: 14px;
}

.region-list {
  margin-top: 10px;
}

.region-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.region-name {
  width: 60px;
  font-size: 12px;
  color: #666;
}

.region-progress {
  flex: 1;
  margin: 0 10px;
}

.region-value {
  width: 40px;
  font-size: 12px;
  color: #666;
  text-align: right;
}
</style> 