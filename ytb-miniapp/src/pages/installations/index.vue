<template>
  <view class="install-page">
    <!-- 顶部渐变背景 -->
    <view class="header-bg"></view>

    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">净水器安装服务</text>
      <text class="page-desc">专业工程师上门安装，一站式净水体验</text>
    </view>

    <!-- 两大核心入口 -->
    <view class="action-cards">
      <!-- 自己预约安装 -->
      <view class="action-card self-card" hover-class="card-hover" @tap="goSelfBooking">
        <view class="card-glow"></view>
        <view class="card-icon-box">
          <text class="card-icon">🚰</text>
        </view>
        <view class="card-content">
          <text class="card-title">自己预约安装</text>
          <text class="card-desc">填写地址信息，预约工程师上门为您安装净水器</text>
        </view>
        <view class="card-arrow">
          <text class="arrow-text">→</text>
        </view>
        <view class="card-tags">
          <text class="tag">免费上门</text>
          <text class="tag">专业安装</text>
          <text class="tag">水质检测</text>
        </view>
      </view>

      <!-- 邀请预约安装 -->
      <view class="action-card invite-card" hover-class="card-hover" @tap="goInviteBooking">
        <view class="card-glow invite-glow"></view>
        <view class="card-icon-box invite-icon-box">
          <text class="card-icon">📨</text>
        </view>
        <view class="card-content">
          <text class="card-title">邀请预约安装</text>
          <text class="card-desc">分享链接给好友，邀请他们预约安装净水器</text>
        </view>
        <view class="card-arrow">
          <text class="arrow-text">→</text>
        </view>
        <view class="card-tags">
          <text class="tag invite-tag">分享赚佣</text>
          <text class="tag invite-tag">一键转发</text>
          <text class="tag invite-tag">好友专享</text>
        </view>
      </view>
    </view>

    <!-- 我的预约记录 -->
    <view class="records-section" v-if="orders.length > 0">
      <view class="section-header">
        <text class="section-title">我的预约记录</text>
        <text class="section-more" @tap="goOrderList">查看全部 →</text>
      </view>
      <view class="order-list">
        <view class="order-item" v-for="order in orders" :key="order.id" hover-class="item-hover" @tap="goOrderDetail(order.id)">
          <view class="order-top">
            <text class="order-no">{{ order.order_no }}</text>
            <text :class="['order-status', 'status-' + order.status]">{{ getStatusText(order.status) }}</text>
          </view>
          <view class="order-info">
            <text class="order-contact">{{ order.contact_name }} {{ order.contact_phone }}</text>
            <text class="order-time">{{ order.preferred_date }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部服务说明 -->
    <view class="service-info">
      <view class="info-title">服务流程</view>
      <view class="steps-row">
        <view class="step-item">
          <text class="step-num">1</text>
          <text class="step-text">预约登记</text>
        </view>
        <view class="step-line"></view>
        <view class="step-item">
          <text class="step-num">2</text>
          <text class="step-text">工程师上门</text>
        </view>
        <view class="step-line"></view>
        <view class="step-item">
          <text class="step-num">3</text>
          <text class="step-text">安装调试</text>
        </view>
        <view class="step-line"></view>
        <view class="step-item">
          <text class="step-num">4</text>
          <text class="step-text">水质检测</text>
        </view>
      </view>
    </view>

    <view class="bottom-spacer"></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()
const orders = ref([])

// 获取我的预约记录
const fetchOrders = async () => {
  try {
    const token = uni.getStorageSync('token')
    if (!token) return
    const res = await uni.request({
      url: 'https://ytb.ddg.org.cn/api/ytb/install/orders',
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` }
    })
    const data = res.data || res[1]?.data
    if (data && data.code === 0 && Array.isArray(data.data)) {
      orders.value = data.data.slice(0, 3) // 只显示最近3条
    }
  } catch (e) {
    console.error('获取预约记录失败:', e)
  }
}

onShow(() => {
  fetchOrders()
})

// 自己预约安装 -> 跳转到预约表单页
const goSelfBooking = () => {
  const userId = userStore.userInfo?.id || ''
  uni.navigateTo({
    url: `/pages/installations/booking?referrer_id=${userId}&mode=self`
  })
}

// 邀请预约安装 -> 跳转到邀请页面
const goInviteBooking = () => {
  uni.navigateTo({
    url: '/pages/installations/invite'
  })
}

// 查看全部订单
const goOrderList = () => {
  uni.navigateTo({ url: '/pages/installations/records' })
}

// 查看工单详情
const goOrderDetail = (id) => {
  uni.navigateTo({ url: `/pages/installations/detail?id=${id}` })
}

// 状态文本映射
const getStatusText = (status) => {
  const map = {
    'pending': '待处理',
    'paid': '已支付',
    'assigned': '已派单',
    'accepted': '已接单',
    'picked': '已领机',
    'installing': '安装中',
    'completed': '已完成',
    'activated': '已激活',
    'cancelled': '已取消'
  }
  return map[status] || status
}

// 配置分享
onShareAppMessage(() => {
  const userId = userStore.userInfo?.id || ''
  return {
    title: '预约安装净水器，专业工程师免费上门',
    path: `/pages/installations/booking?referrer_id=${userId}`,
    imageUrl: '' // 可以配置分享图片
  }
})

// 需要从 @dcloudio/uni-app 引入
import { onShareAppMessage } from '@dcloudio/uni-app'
</script>

<style scoped>
.install-page {
  min-height: 100vh;
  background: #f5f5f7;
  position: relative;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 400rpx;
  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #A855F7 100%);
  border-radius: 0 0 60rpx 60rpx;
}

.page-header {
  position: relative;
  z-index: 2;
  padding: 100rpx 40rpx 40rpx;
}

.page-title {
  display: block;
  font-size: 44rpx;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 2rpx;
}

.page-desc {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 12rpx;
}

/* 两大核心入口 */
.action-cards {
  position: relative;
  z-index: 2;
  padding: 0 30rpx;
}

.action-card {
  position: relative;
  background: #ffffff;
  border-radius: 28rpx;
  padding: 40rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 12rpx 40rpx rgba(79, 70, 229, 0.08);
  overflow: hidden;
  transition: all 0.3s;
}

.card-hover {
  transform: scale(0.98);
  box-shadow: 0 8rpx 24rpx rgba(79, 70, 229, 0.15);
}

.card-glow {
  position: absolute;
  top: -40rpx;
  right: -40rpx;
  width: 160rpx;
  height: 160rpx;
  background: radial-gradient(circle, rgba(79, 70, 229, 0.1) 0%, transparent 70%);
  border-radius: 50%;
}

.invite-glow {
  background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%);
}

.card-icon-box {
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #EEF2FF, #E0E7FF);
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}

.invite-icon-box {
  background: linear-gradient(135deg, #ECFDF5, #D1FAE5);
}

.card-icon {
  font-size: 48rpx;
}

.card-content {
  margin-bottom: 16rpx;
}

.card-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #1e1e2e;
  margin-bottom: 8rpx;
}

.card-desc {
  display: block;
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.5;
}

.card-arrow {
  position: absolute;
  top: 50%;
  right: 40rpx;
  transform: translateY(-50%);
  width: 60rpx;
  height: 60rpx;
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.invite-card .card-arrow {
  background: linear-gradient(135deg, #10B981, #059669);
}

.arrow-text {
  color: #fff;
  font-size: 32rpx;
  font-weight: 700;
}

.card-tags {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
  margin-top: 8rpx;
}

.tag {
  font-size: 22rpx;
  color: #4F46E5;
  background: #EEF2FF;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
}

.invite-tag {
  color: #059669;
  background: #ECFDF5;
}

/* 预约记录 */
.records-section {
  padding: 30rpx;
  margin-top: 20rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1e1e2e;
}

.section-more {
  font-size: 26rpx;
  color: #4F46E5;
}

.order-item {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
}

.item-hover {
  background: #f8f8ff;
}

.order-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.order-no {
  font-size: 26rpx;
  color: #6b7280;
  font-family: monospace;
}

.order-status {
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.status-pending { color: #F59E0B; background: #FEF3C7; }
.status-paid { color: #3B82F6; background: #DBEAFE; }
.status-assigned, .status-accepted { color: #8B5CF6; background: #EDE9FE; }
.status-installing { color: #F97316; background: #FFF7ED; }
.status-completed { color: #10B981; background: #D1FAE5; }
.status-activated { color: #059669; background: #ECFDF5; }
.status-cancelled { color: #EF4444; background: #FEE2E2; }

.order-info {
  display: flex;
  justify-content: space-between;
}

.order-contact {
  font-size: 28rpx;
  color: #374151;
  font-weight: 500;
}

.order-time {
  font-size: 24rpx;
  color: #9CA3AF;
}

/* 服务说明 */
.service-info {
  margin: 30rpx;
  padding: 36rpx;
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
}

.info-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1e1e2e;
  margin-bottom: 28rpx;
  text-align: center;
}

.steps-row {
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

.step-num {
  width: 48rpx;
  height: 48rpx;
  line-height: 48rpx;
  text-align: center;
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  color: #fff;
  border-radius: 50%;
  font-size: 24rpx;
  font-weight: 700;
}

.step-text {
  font-size: 22rpx;
  color: #6b7280;
  white-space: nowrap;
}

.step-line {
  width: 40rpx;
  height: 4rpx;
  background: #E5E7EB;
  margin: 0 8rpx;
  margin-bottom: 30rpx;
}

.bottom-spacer {
  height: 60rpx;
}
</style>
