<template>
  <view class="devices-page">
    <!-- 顶部渐变背景 -->
    <view class="header-bg"></view>

    <scroll-view scroll-y class="device-list" refresher-enabled :refresher-triggered="isRefreshing" @refresherrefresh="onRefresh">
      
      <view class="page-title-box" style="display:flex; justify-content:space-between; align-items:flex-end;">
        <view>
          <text class="page-title">我的设备</text>
          <text class="page-subtitle" v-if="devices.length > 0">共 {{ devices.length }} 台净水器</text>
        </view>
        <button class="header-add-btn" @tap="goAdd">新增净水器</button>
      </view>

      <!-- Loading 状态 -->
      <view v-if="loading && devices.length === 0" class="loading-state">
        <view class="spinner"></view>
        <text>数据加载中...</text>
      </view>

      <!-- 空状态 -->
      <view v-else-if="devices.length === 0" class="empty-state">
        <image class="empty-image" src="https://img.icons8.com/bubbles/200/water-dispenser.png" mode="aspectFit" />
        <text class="empty-text">您目前还没有绑定的净水器</text>
        <button class="add-btn" @tap="goAdd">立即绑定</button>
      </view>

      <!-- 设备列表 -->
      <view v-else class="list-container">
        <view 
          v-for="(device, index) in devices" 
          :key="device.id" 
          class="device-card fade-in"
          :style="{ animationDelay: `${index * 0.08}s` }"
          hover-class="card-hover"
          @tap="goDetail(device.id)"
        >
          <!-- 装饰效果 -->
          <view class="card-glow"></view>

          <!-- 顶部：核心信息 -->
          <view class="card-top">
            <view class="device-image-box">
              <image class="device-product-image" :src="getDeviceImage(device.brand)" mode="aspectFit" />
            </view>
            <view class="main-info">
              <view class="name-row">
                <text class="brand">{{ device.brand || 'YTB' }}</text>
                <text class="model">{{ device.device_model || '智能净水器' }}</text>
              </view>
              <view class="sn-row">
                <text class="sn-text">S/N: {{ device.device_number || device.device_id || '未知' }}</text>
              </view>
            </view>
            <!-- 状态标签 -->
            <view :class="['status-badge', device.network_status == '1' || device.is_online ? 'online' : 'offline']">
              <view class="pulse-dot" v-if="device.network_status == '1' || device.is_online"></view>
              <view class="solid-dot" v-else></view>
              <text>{{ device.network_status == '1' || device.is_online ? '在线' : '离线' }}</text>
            </view>
          </view>

          <!-- 中部：数据网格 -->
          <view class="metrics-grid">
            <view class="metric-item">
              <text class="metric-label">计费模式</text>
              <text class="metric-value">{{ device.billing_mode === 'time' ? '包年计费' : '流量计费' }}</text>
            </view>
            <view class="metric-item">
              <text class="metric-label">剩余{{ device.billing_mode === 'time' ? '天数' : '流量' }}</text>
              <text class="metric-value highlight">
                {{ device.billing_mode === 'time' ? `${device.remaining_days || 0}天` : `${device.surplus_flow || 0}L` }}
              </text>
            </view>
            <view class="metric-item">
              <text class="metric-label">纯水(TDS)</text>
              <text :class="['metric-value', getTdsClass(device.purification_water_value)]">
                {{ device.purification_water_value || '--' }}
              </text>
            </view>
          </view>

          <!-- 底部：地址 -->
          <view class="card-bottom">
            <view class="location-box">
              <text class="location-icon">📍</text>
              <text class="location-text">{{ device.address || device.install_location || device.client_address || '未设置地址' }}</text>
            </view>
            <view class="action-arrow">→</view>
          </view>
        </view>
      </view>
      <view class="bottom-spacer"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { getDevices } from '../../api/ytb'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()
const devices = ref([])
const loading = ref(false)
const isRefreshing = ref(false)

const fetchDevices = async () => {
  loading.value = true
  try {
    const res = await getDevices({ page: 1, limit: 50 })
    if (res.code === 0) {
      // 兼容两种接口格式，取 data.data 或 data.list
      devices.value = res.data?.data || res.data?.list || res.data || []
    }
  } catch (e) {
    console.error('获取设备列表失败:', e)
  } finally {
    loading.value = false
    isRefreshing.value = false
  }
}

const onRefresh = () => {
  isRefreshing.value = true
  fetchDevices()
}

const goDetail = (id) => {
  uni.navigateTo({ url: `/pages/device-detail/index?id=${id}` })
}

const goAdd = () => {
  uni.navigateTo({ url: '/pages/installations/index' })
}

// 简单的TDS颜色逻辑
const getTdsClass = (tds) => {
  const val = parseInt(tds)
  if (isNaN(val)) return ''
  if (val <= 50) return 'tds-excellent'
  if (val <= 100) return 'tds-good'
  return 'tds-warning'
}

const getDeviceImage = (brand) => {
  if (brand) {
    if (brand.includes('怡宝')) return '/static/images/yibao-water-dispenser.png'
    if (brand.includes('扬子')) return '/static/images/yangzi-water-dispenser.png'
    if (brand.includes('万达') || brand.toUpperCase().includes('WD') || brand.toUpperCase().includes('WANDA')) return '/static/images/wanda-water-dispenser.jpg'
  }
  // 默认使用沃特佳的图片
  return '/static/images/wtj-water-dispenser.png'
}

onShow(() => {
  fetchDevices()
})

// 分享给好友
onShareAppMessage(() => {
  const userId = userStore.userInfo?.id || ''
  const name = userStore.nickname || '好友'
  const count = devices.value.length
  return {
    title: `${name}的净水器${count > 0 ? '（' + count + '台在运行）' : ''} — 邀请您也来体验健康饮水`,
    path: `/pages/installations/booking?referrer_id=${userId}`,
    imageUrl: ''
  }
})

// 分享到朋友圈
onShareTimeline(() => {
  const userId = userStore.userInfo?.id || ''
  return {
    title: '亿拓宝智能净水器 — 预约安装享专属优惠',
    query: `referrer_id=${userId}`
  }
})
</script>

<style scoped>
.devices-page {
  min-height: 100vh;
  background: #f7f8fa;
  position: relative;
}

/* 顶部流体背景 */
.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 480rpx;
  background: linear-gradient(135deg, #4F46E5 0%, #a855f7 100%);
  border-radius: 0 0 60rpx 60rpx;
  z-index: 0;
}

.device-list {
  position: relative;
  height: 100vh;
  z-index: 1;
}

.page-title-box {
  padding: calc(env(safe-area-inset-top) + 40rpx) 40rpx 40rpx;
  display: flex;
  flex-direction: column;
}

.page-title {
  font-size: 48rpx;
  color: #fff;
  font-weight: 800;
  letter-spacing: 2rpx;
  margin-bottom: 8rpx;
}

.page-subtitle {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

.header-add-btn {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 24rpx;
  border-radius: 40rpx;
  padding: 0 24rpx;
  height: 60rpx;
  line-height: 60rpx;
  margin: 0;
  border: 1px solid rgba(255, 255, 255, 0.3);
}
.header-add-btn::after {
  border: none;
}

.list-container {
  padding: 0 30rpx;
}

/* 优质感卡片 */
.device-card {
  position: relative;
  background: #ffffff;
  border-radius: 32rpx;
  padding: 36rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 16rpx 48rpx rgba(79, 70, 229, 0.06);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(0);
}

.card-hover {
  transform: translateY(-4rpx) scale(0.995);
  box-shadow: 0 24rpx 64rpx rgba(79, 70, 229, 0.12);
}

/* 装饰性反光效果 */
.card-glow {
  position: absolute;
  top: -60rpx;
  right: -60rpx;
  width: 180rpx;
  height: 180rpx;
  background: radial-gradient(circle, rgba(79, 70, 229, 0.08) 0%, rgba(255,255,255,0) 70%);
  border-radius: 50%;
  pointer-events: none;
}

/* 顶部布局 */
.card-top {
  display: flex;
  align-items: flex-start;
  margin-bottom: 36rpx;
}

.device-image-box {
  width: 140rpx;
  height: 140rpx;
  background: #f8fafc;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  overflow: hidden;
  box-shadow: inset 0 2rpx 10rpx rgba(0,0,0,0.02);
}

.device-product-image {
  width: 100%;
  height: 100%;
}

.main-info {
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.brand {
  font-size: 32rpx;
  font-weight: 800;
  color: #1e293b;
  margin-right: 12rpx;
}

.model {
  font-size: 26rpx;
  color: #64748b;
  background: #f1f5f9;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
}

.sn-text {
  font-size: 24rpx;
  color: #94a3b8;
  font-family: monospace;
}

/* 状态徽章 */
.status-badge {
  display: flex;
  align-items: center;
  padding: 8rpx 20rpx;
  border-radius: 30rpx;
  font-size: 22rpx;
  font-weight: 600;
}

.status-badge.online {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-badge.offline {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.pulse-dot {
  width: 12rpx;
  height: 12rpx;
  background-color: #10b981;
  border-radius: 50%;
  margin-right: 10rpx;
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
  animation: pulse 2s infinite;
}

.solid-dot {
  width: 12rpx;
  height: 12rpx;
  background-color: #ef4444;
  border-radius: 50%;
  margin-right: 10rpx;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  70% { transform: scale(1); box-shadow: 0 0 0 12rpx rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

/* 数据网格 */
.metrics-grid {
  display: flex;
  background: #f8fafc;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 30rpx;
}

.metric-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-right: 1rpx solid #e2e8f0;
  padding-left: 12rpx;
}

.metric-item:first-child {
  padding-left: 0;
}

.metric-item:last-child {
  border-right: none;
}

.metric-label {
  font-size: 22rpx;
  color: #64748b;
  margin-bottom: 8rpx;
}

.metric-value {
  font-size: 28rpx;
  font-weight: 700;
  color: #1e293b;
}

.metric-value.highlight {
  color: #4F46E5;
  font-size: 32rpx;
}

.tds-excellent { color: #10b981; }
.tds-good { color: #3b82f6; }
.tds-warning { color: #f59e0b; }

/* 底部发货/安装地址 */
.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1rpx dashed #e2e8f0;
  padding-top: 24rpx;
}

.location-box {
  display: flex;
  align-items: center;
  flex: 1;
  margin-right: 20rpx;
}

.location-icon {
  font-size: 28rpx;
  margin-right: 8rpx;
}

.location-text {
  font-size: 24rpx;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 480rpx;
}

.action-arrow {
  width: 48rpx;
  height: 48rpx;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 28rpx;
  font-weight: bold;
}

/* 进场动画 */
.fade-in {
  animation: fadeInUp 0.6s ease both;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30rpx); }
  to { opacity: 1; transform: translateY(0); }
}

/* 状态页 */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  background: #fff;
  margin: 0 30rpx;
  border-radius: 32rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.04);
}

.empty-image {
  width: 240rpx;
  height: 240rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #64748b;
  margin-bottom: 40rpx;
}

.add-btn {
  background: #4F46E5;
  color: #fff;
  border-radius: 40rpx;
  padding: 0 60rpx;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 28rpx;
  font-weight: 600;
  border: none;
}

.add-btn::after {
  display: none;
}

.spinner {
  width: 60rpx;
  height: 60rpx;
  border: 6rpx solid #e2e8f0;
  border-top-color: #4F46E5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 24rpx;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.bottom-spacer {
  height: env(safe-area-inset-bottom);
  padding-bottom: 40rpx;
}
</style>
