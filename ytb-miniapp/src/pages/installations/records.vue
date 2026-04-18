<template>
  <view class="records-page">
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="nav-title">预约记录</text>
    </view>

    <!-- 加载中 -->
    <view v-if="loading && orders.length === 0" class="loading-state">
      <view class="spinner"></view>
      <text class="state-text">加载中...</text>
    </view>

    <!-- 空状态 -->
    <view v-else-if="!loading && orders.length === 0" class="empty-state">
      <text class="empty-icon">📋</text>
      <text class="empty-text">暂无预约记录</text>
      <button class="go-booking-btn" @tap="goBooking">去预约安装</button>
    </view>

    <!-- 订单列表 -->
    <scroll-view v-else scroll-y class="order-scroll" refresher-enabled :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="order-list">
        <view
          class="order-card"
          v-for="order in orders"
          :key="order.id"
          hover-class="card-hover"
          @tap="goDetail(order.id)"
        >
          <!-- 顶部 -->
          <view class="card-top">
            <text class="order-no">{{ order.order_no }}</text>
            <text :class="['status-tag', 'status-' + order.status]">{{ getStatusText(order.status) }}</text>
          </view>

          <!-- 中间信息 -->
          <view class="card-body">
            <view class="info-row">
              <text class="info-icon">👤</text>
              <text class="info-text">{{ order.contact_name }} {{ maskPhone(order.contact_phone) }}</text>
            </view>
            <view class="info-row">
              <text class="info-icon">📍</text>
              <text class="info-text">{{ order.province }}{{ order.city }} {{ order.address }}</text>
            </view>
            <view class="info-row">
              <text class="info-icon">📅</text>
              <text class="info-text">预约时间：{{ order.preferred_date }} {{ order.preferred_time }}</text>
            </view>
          </view>

          <!-- 底部 -->
          <view class="card-bottom">
            <text class="create-time">{{ formatDate(order.created_at) }}</text>
            <text class="detail-link">查看详情 →</text>
          </view>
        </view>
      </view>
      <view class="bottom-spacer"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const orders = ref([])
const loading = ref(true)
const refreshing = ref(false)

const fetchOrders = async () => {
  try {
    const token = uni.getStorageSync('token')
    if (!token) { loading.value = false; return }
    const res = await uni.request({
      url: 'https://ytb.ddg.org.cn/api/ytb/install/orders',
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` }
    })
    const data = res.data || res[1]?.data
    if (data && data.code === 0 && Array.isArray(data.data)) {
      orders.value = data.data
    }
  } catch (e) {
    console.error('获取预约记录失败:', e)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

onShow(() => { fetchOrders() })

const onRefresh = () => {
  refreshing.value = true
  fetchOrders()
}

const goBack = () => uni.navigateBack()
const goBooking = () => uni.navigateTo({ url: '/pages/installations/booking?mode=self' })
const goDetail = (id) => uni.navigateTo({ url: `/pages/installations/detail?id=${id}` })

const maskPhone = (phone) => {
  if (!phone || phone.length < 7) return phone
  return phone.substring(0, 3) + '****' + phone.substring(7)
}

const formatDate = (dt) => {
  if (!dt) return ''
  return dt.substring(0, 16).replace('T', ' ')
}

const getStatusText = (status) => {
  const map = {
    'pending': '待处理', 'paid': '已支付', 'assigned': '已派单',
    'accepted': '已接单', 'picked': '已领机', 'installing': '安装中',
    'completed': '已完成', 'activated': '已激活', 'cancelled': '已取消'
  }
  return map[status] || status
}
</script>

<style scoped>
.records-page { min-height: 100vh; background: #f5f5f7; }
.nav-bar {
  display: flex; align-items: center;
  padding: 80rpx 30rpx 20rpx;
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
}
.nav-back { width: 60rpx; height: 60rpx; display: flex; align-items: center; justify-content: center; }
.back-icon { font-size: 36rpx; color: #fff; font-weight: 700; }
.nav-title { flex: 1; text-align: center; font-size: 34rpx; font-weight: 700; color: #fff; margin-right: 60rpx; }

.loading-state, .empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding-top: 200rpx; gap: 20rpx;
}
.spinner { width: 48rpx; height: 48rpx; border: 4rpx solid #E5E7EB; border-top-color: #4F46E5; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.state-text { font-size: 28rpx; color: #9CA3AF; }
.empty-icon { font-size: 80rpx; }
.empty-text { font-size: 28rpx; color: #9CA3AF; }
.go-booking-btn { margin-top: 20rpx; background: #4F46E5; color: #fff; font-size: 28rpx; border-radius: 40rpx; padding: 0 48rpx; height: 72rpx; line-height: 72rpx; border: none; }
.go-booking-btn::after { border: none; }

.order-scroll { height: calc(100vh - 160rpx); }
.order-list { padding: 20rpx 30rpx; }

.order-card {
  background: #fff; border-radius: 24rpx; padding: 28rpx;
  margin-bottom: 20rpx; box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
}
.card-hover { background: #F8F8FF; }

.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.order-no { font-size: 24rpx; color: #9CA3AF; font-family: monospace; }
.status-tag { font-size: 24rpx; padding: 6rpx 20rpx; border-radius: 20rpx; font-weight: 600; }
.status-pending { color: #F59E0B; background: #FEF3C7; }
.status-paid { color: #3B82F6; background: #DBEAFE; }
.status-assigned { color: #8B5CF6; background: #EDE9FE; }
.status-accepted { color: #8B5CF6; background: #EDE9FE; }
.status-picked { color: #F97316; background: #FFF7ED; }
.status-installing { color: #F97316; background: #FFF7ED; }
.status-completed { color: #10B981; background: #D1FAE5; }
.status-activated { color: #059669; background: #ECFDF5; }
.status-cancelled { color: #EF4444; background: #FEE2E2; }

.card-body { margin-bottom: 16rpx; }
.info-row { display: flex; align-items: flex-start; gap: 10rpx; margin-bottom: 10rpx; }
.info-icon { font-size: 28rpx; flex-shrink: 0; }
.info-text { font-size: 26rpx; color: #4B5563; line-height: 1.5; }

.card-bottom { display: flex; justify-content: space-between; align-items: center; border-top: 1rpx solid #F3F4F6; padding-top: 16rpx; }
.create-time { font-size: 24rpx; color: #9CA3AF; }
.detail-link { font-size: 26rpx; color: #4F46E5; font-weight: 600; }
.bottom-spacer { height: 40rpx; }
</style>
