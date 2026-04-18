<template>
  <view class="engineer-page">
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="nav-title">工程师工作台</text>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-row">
      <view class="stat-card" @tap="switchTab('available')">
        <text class="stat-num">{{ stats.available }}</text>
        <text class="stat-label">待接单</text>
      </view>
      <view class="stat-card" @tap="switchTab('processing')">
        <text class="stat-num">{{ stats.processing }}</text>
        <text class="stat-label">进行中</text>
      </view>
      <view class="stat-card" @tap="switchTab('completed')">
        <text class="stat-num">{{ stats.completed }}</text>
        <text class="stat-label">已完成</text>
      </view>
    </view>

    <!-- Tab切换 -->
    <view class="tab-bar">
      <view :class="['tab-item', activeTab === 'available' && 'tab-active']" @tap="switchTab('available')">
        <text>待接单</text>
      </view>
      <view :class="['tab-item', activeTab === 'processing' && 'tab-active']" @tap="switchTab('processing')">
        <text>进行中</text>
      </view>
      <view :class="['tab-item', activeTab === 'completed' && 'tab-active']" @tap="switchTab('completed')">
        <text>已完成</text>
      </view>
    </view>

    <!-- 工单列表 -->
    <scroll-view scroll-y class="order-scroll" refresher-enabled :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view v-if="loading && orders.length === 0" class="empty-state">
        <view class="spinner"></view>
      </view>
      <view v-else-if="orders.length === 0" class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无{{ tabLabel }}工单</text>
      </view>
      <view v-else class="order-list">
        <view class="order-card" v-for="order in orders" :key="order.id" hover-class="card-hover">
          <view class="card-top">
            <text class="order-no">{{ order.order_no }}</text>
            <text :class="['status-tag', 'status-' + order.status]">{{ getStatusText(order.status) }}</text>
          </view>
          <view class="card-body">
            <view class="info-row">
              <text class="info-icon">👤</text>
              <text class="info-text">{{ order.contact_name }} {{ order.contact_phone }}</text>
            </view>
            <view class="info-row">
              <text class="info-icon">📍</text>
              <text class="info-text">{{ order.province }}{{ order.city }} {{ order.address }}</text>
            </view>
            <view class="info-row">
              <text class="info-icon">📅</text>
              <text class="info-text">{{ order.preferred_date }} {{ order.preferred_time }}</text>
            </view>
          </view>
          <view class="card-actions">
            <button v-if="order.status === 'paid' || order.status === 'assigned'" class="act-btn accept-btn" @tap="acceptOrder(order.id)">接单</button>
            <button v-if="order.status === 'accepted'" class="act-btn pick-btn" @tap="pickOrder(order.id)">领机</button>
            <button v-if="order.status === 'picked'" class="act-btn install-btn" @tap="startInstall(order.id)">开始安装</button>
          </view>
        </view>
      </view>
      <view class="bottom-spacer"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const activeTab = ref('available')
const orders = ref([])
const loading = ref(false)
const refreshing = ref(false)
const stats = ref({ available: 0, processing: 0, completed: 0 })

const tabLabel = computed(() => {
  const m = { available: '待接单', processing: '进行中', completed: '已完成' }
  return m[activeTab.value]
})

const fetchOrders = async () => {
  loading.value = true
  try {
    const token = uni.getStorageSync('token')
    const type = activeTab.value === 'available' ? 'available' : 'my'
    const status = activeTab.value === 'processing' ? 'processing' : (activeTab.value === 'completed' ? 'completed' : '')
    
    let url = `https://ytb.ddg.org.cn/api/ytb/engineer/orders?type=${type}`
    if (status) url += `&status=${status}`
    
    const res = await uni.request({
      url,
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` }
    })
    const data = res.data || res[1]?.data
    if (data && data.code === 0 && Array.isArray(data.data)) {
      orders.value = data.data
    }
  } catch (e) {
    console.error('获取工单失败:', e)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

const fetchStats = async () => {
  try {
    const token = uni.getStorageSync('token')
    // 分别获取各状态的数量
    const [avRes, procRes, compRes] = await Promise.all([
      uni.request({ url: 'https://ytb.ddg.org.cn/api/ytb/engineer/orders?type=available', header: { 'Authorization': `Bearer ${token}` } }),
      uni.request({ url: 'https://ytb.ddg.org.cn/api/ytb/engineer/orders?type=my&status=processing', header: { 'Authorization': `Bearer ${token}` } }),
      uni.request({ url: 'https://ytb.ddg.org.cn/api/ytb/engineer/orders?type=my&status=completed', header: { 'Authorization': `Bearer ${token}` } }),
    ])
    const getData = (r) => { const d = r.data || r[1]?.data; return (d && d.code === 0) ? (d.data || []) : [] }
    stats.value = {
      available: getData(avRes).length,
      processing: getData(procRes).length,
      completed: getData(compRes).length,
    }
  } catch (e) { console.error(e) }
}

const switchTab = (tab) => {
  activeTab.value = tab
  fetchOrders()
}

const onRefresh = () => {
  refreshing.value = true
  fetchOrders()
  fetchStats()
}

onShow(() => {
  fetchOrders()
  fetchStats()
})

const goBack = () => uni.navigateBack()

const acceptOrder = async (id) => {
  uni.showModal({
    title: '确认接单',
    content: '确定要接下这个安装工单吗？',
    success: async (res) => {
      if (!res.confirm) return
      try {
        const token = uni.getStorageSync('token')
        const r = await uni.request({
          url: `https://ytb.ddg.org.cn/api/ytb/engineer/orders/${id}/accept`,
          method: 'POST',
          header: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        })
        const d = r.data || r[1]?.data
        if (d && d.code === 0) {
          uni.showToast({ title: '接单成功', icon: 'success' })
          fetchOrders()
          fetchStats()
        } else {
          uni.showToast({ title: d?.message || '操作失败', icon: 'none' })
        }
      } catch (e) { uni.showToast({ title: '网络错误', icon: 'none' }) }
    }
  })
}

const pickOrder = async (id) => {
  uni.showModal({
    title: '确认领机',
    content: '确认已到仓库领取净水器设备？',
    success: async (res) => {
      if (!res.confirm) return
      try {
        const token = uni.getStorageSync('token')
        const r = await uni.request({
          url: `https://ytb.ddg.org.cn/api/ytb/engineer/orders/${id}/pick`,
          method: 'POST',
          header: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          data: { board_code: '' }
        })
        const d = r.data || r[1]?.data
        if (d && d.code === 0) {
          uni.showToast({ title: '领机成功', icon: 'success' })
          fetchOrders()
          fetchStats()
        } else {
          uni.showToast({ title: d?.message || '操作失败', icon: 'none' })
        }
      } catch (e) { uni.showToast({ title: '网络错误', icon: 'none' }) }
    }
  })
}

const startInstall = (id) => {
  uni.showToast({ title: '请前往客户地址安装', icon: 'none', duration: 2000 })
}

const getStatusText = (s) => {
  const m = { 'pending':'待处理','paid':'待接单','assigned':'已派单','accepted':'已接单','picked':'已领机','installing':'安装中','completed':'已完成','activated':'已激活','cancelled':'已取消' }
  return m[s] || s
}
</script>

<style scoped>
.engineer-page { min-height: 100vh; background: #f5f5f7; }
.nav-bar { display: flex; align-items: center; padding: 80rpx 30rpx 20rpx; background: linear-gradient(135deg, #EA580C, #F97316); }
.nav-back { width: 60rpx; height: 60rpx; display: flex; align-items: center; justify-content: center; }
.back-icon { font-size: 36rpx; color: #fff; font-weight: 700; }
.nav-title { flex: 1; text-align: center; font-size: 34rpx; font-weight: 700; color: #fff; margin-right: 60rpx; }

.stats-row { display: flex; margin: -10rpx 30rpx 20rpx; gap: 16rpx; position: relative; z-index: 2; }
.stat-card { flex: 1; background: #fff; border-radius: 20rpx; padding: 24rpx; text-align: center; box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06); }
.stat-num { display: block; font-size: 40rpx; font-weight: 800; color: #EA580C; }
.stat-label { display: block; font-size: 24rpx; color: #9CA3AF; margin-top: 4rpx; }

.tab-bar { display: flex; margin: 0 30rpx 16rpx; background: #fff; border-radius: 16rpx; padding: 6rpx; }
.tab-item { flex: 1; text-align: center; padding: 16rpx 0; font-size: 28rpx; color: #6b7280; border-radius: 12rpx; }
.tab-active { background: linear-gradient(135deg, #EA580C, #F97316); color: #fff; font-weight: 600; }

.order-scroll { height: calc(100vh - 400rpx); }
.empty-state { display: flex; flex-direction: column; align-items: center; padding-top: 120rpx; gap: 16rpx; }
.spinner { width: 48rpx; height: 48rpx; border: 4rpx solid #E5E7EB; border-top-color: #EA580C; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-icon { font-size: 60rpx; }
.empty-text { font-size: 28rpx; color: #9CA3AF; }

.order-list { padding: 0 30rpx; }
.order-card { background: #fff; border-radius: 20rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.04); }
.card-hover { background: #FFFBF5; }
.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.order-no { font-size: 24rpx; color: #9CA3AF; font-family: monospace; }
.status-tag { font-size: 22rpx; padding: 6rpx 16rpx; border-radius: 16rpx; font-weight: 600; }
.status-paid { color: #3B82F6; background: #DBEAFE; }
.status-assigned { color: #8B5CF6; background: #EDE9FE; }
.status-accepted { color: #EA580C; background: #FFF7ED; }
.status-picked { color: #D97706; background: #FEF3C7; }
.status-installing { color: #F97316; background: #FFF7ED; }
.status-completed { color: #10B981; background: #D1FAE5; }
.status-cancelled { color: #EF4444; background: #FEE2E2; }

.card-body { margin-bottom: 12rpx; }
.info-row { display: flex; align-items: flex-start; gap: 10rpx; margin-bottom: 8rpx; }
.info-icon { font-size: 26rpx; flex-shrink: 0; }
.info-text { font-size: 26rpx; color: #4B5563; line-height: 1.4; }

.card-actions { display: flex; gap: 12rpx; justify-content: flex-end; border-top: 1rpx solid #F3F4F6; padding-top: 16rpx; }
.act-btn { font-size: 26rpx; padding: 0 32rpx; height: 60rpx; line-height: 60rpx; border-radius: 30rpx; border: none; font-weight: 600; margin: 0; }
.act-btn::after { border: none; }
.accept-btn { background: linear-gradient(135deg, #4F46E5, #7C3AED); color: #fff; }
.pick-btn { background: linear-gradient(135deg, #EA580C, #F97316); color: #fff; }
.install-btn { background: linear-gradient(135deg, #059669, #10B981); color: #fff; }

.bottom-spacer { height: 40rpx; }
</style>
