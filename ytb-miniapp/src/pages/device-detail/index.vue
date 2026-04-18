<template>
  <view class="detail-page" v-if="device">
    <!-- 设备头部 -->
    <view class="device-header">
      <view class="header-content">
        <view class="device-image-wrap">
          <image class="device-image" :src="getDeviceImage(device.brand)" mode="aspectFit" />
        </view>
        <view class="header-info">
          <view class="header-top">
            <text class="device-name">{{ device.brand }} {{ device.device_model }}</text>
          </view>
          <text class="device-sn">S/N: {{ device.device_number || device.device_id }}</text>
          <view :class="['status-tag', device.is_online ? 'online' : 'offline']">
            <view :class="['status-dot', device.is_online ? 'pulse' : '']"></view>
            <text>{{ device.is_online ? '设备正常在线' : '设备已离线' }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 水质数据 -->
    <view class="section">
      <view class="section-title">水质数据</view>
      <view class="water-data">
        <view class="water-item">
          <text class="water-value">{{ device.raw_water_value || 0 }}</text>
          <text class="water-unit">ppm</text>
          <text class="water-label">原水TDS</text>
        </view>
        <view class="water-divider" />
        <view class="water-item">
          <text class="water-value pure">{{ device.purification_water_value || 0 }}</text>
          <text class="water-unit">ppm</text>
          <text class="water-label">净水TDS</text>
        </view>
      </view>
    </view>

    <!-- 滤芯寿命 -->
    <view class="section" v-if="device.filters && device.filters.length">
      <view class="section-title">滤芯寿命</view>
      <view v-for="(filter, idx) in device.filters" :key="idx" class="filter-item">
        <view class="filter-header">
          <text class="filter-name">{{ filter.name }}</text>
          <text class="filter-pct">{{ filter.life }}%</text>
        </view>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: filter.life + '%', background: getProgressColor(filter.life) }"></view>
        </view>
      </view>
    </view>

    <!-- 我的套餐 -->
    <view class="section package-section">
      <view class="section-title">📦 我的套餐</view>
      <view class="package-current">
        <view class="pkg-type-badge">
          <text>{{ device.billing_mode === 'flow' ? '流量套餐' : '包年套餐' }}</text>
        </view>
        <view class="pkg-stats">
          <view class="pkg-stat-item" v-if="device.billing_mode === 'flow'">
            <text class="pkg-stat-value">{{ device.surplus_flow || 0 }}</text>
            <text class="pkg-stat-unit">L</text>
            <text class="pkg-stat-label">剩余流量</text>
          </view>
          <view class="pkg-stat-item" v-else>
            <text class="pkg-stat-value">{{ device.remaining_days || 0 }}</text>
            <text class="pkg-stat-unit">天</text>
            <text class="pkg-stat-label">剩余天数</text>
          </view>
          <view class="pkg-stat-divider"></view>
          <view class="pkg-stat-item">
            <text class="pkg-stat-value" v-if="device.billing_mode === 'flow'">{{ device.total_water || 0 }}</text>
            <text class="pkg-stat-value pkg-unlimited" v-else>不限量</text>
            <text class="pkg-stat-unit" v-if="device.billing_mode === 'flow'">L</text>
            <text class="pkg-stat-label">{{ device.billing_mode === 'flow' ? '累计用水' : '用水额度' }}</text>
          </view>
          <view class="pkg-stat-divider"></view>
          <view class="pkg-stat-item">
            <text class="pkg-stat-value">{{ device.used_days || 0 }}</text>
            <text class="pkg-stat-unit">天</text>
            <text class="pkg-stat-label">使用天数</text>
          </view>
        </view>
        <view class="pkg-expire" v-if="device.service_end_date">
          <text>到期日: {{ device.service_end_date }}</text>
        </view>
      </view>
    </view>

    <!-- 可选套餐 -->
    <view class="section" v-if="packages.length > 0">
      <view class="section-title">🛒 充值套餐</view>
      <view class="package-list">
        <view 
          v-for="pkg in packages" 
          :key="pkg.id" 
          class="package-card"
          :class="{ active: selectedPkg === pkg.id }"
          @tap="selectedPkg = pkg.id"
        >
          <view class="pkg-card-top">
            <text class="pkg-name">{{ pkg.name }}</text>
            <view class="pkg-tag" v-if="pkg.brand">{{ pkg.brand }} · {{ pkg.device_model }}</view>
            <view class="pkg-tag pkg-tag-renew" v-if="pkg.is_renewal_only">续费专享</view>
          </view>
          <view class="pkg-card-body">
            <text class="pkg-price">¥{{ pkg.price }}</text>
            <text class="pkg-original-price" v-if="pkg.original_price && pkg.original_price > pkg.price">¥{{ pkg.original_price }}</text>
            <text class="pkg-detail" v-if="pkg.type === 'flow'">{{ pkg.flow_limit }}L</text>
            <text class="pkg-detail" v-else-if="pkg.type === 'yearly'">{{ pkg.days }}天不限量</text>
          </view>
          <text class="pkg-desc" v-if="pkg.description">{{ pkg.description }}</text>
        </view>
      </view>
      <view class="pkg-action">
        <button class="recharge-btn" :disabled="!selectedPkg" @tap="onRecharge">立即充值</button>
      </view>
    </view>

    <!-- 设备信息 -->
    <view class="section">
      <view class="section-title">设备信息</view>
      <view class="info-list">
        <view class="info-row">
          <text class="info-label">计费模式</text>
          <text class="info-value">{{ device.billing_mode === 'flow' ? '流量计费' : '包年计费' }}</text>
        </view>
        <view v-if="device.billing_mode === 'flow'" class="info-row">
          <text class="info-label">剩余流量</text>
          <text class="info-value">{{ device.surplus_flow }}L</text>
        </view>
        <view class="info-row">
          <text class="info-label">激活日期</text>
          <text class="info-value">{{ device.activate_date || '-' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">安装地址</text>
          <text class="info-value">{{ device.address || '-' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">联系人</text>
          <text class="info-value">{{ device.contact_name || '-' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">联系电话</text>
          <text class="info-value">{{ device.contact_phone || '-' }}</text>
        </view>
      </view>
    </view>
  </view>

  <view v-else class="loading">
    <text>加载中...</text>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getDeviceDetail, getPackages } from '../../api/ytb'

const device = ref(null)
const packages = ref([])
const selectedPkg = ref(null)

const getProgressColor = (life) => {
  if (life > 60) return '#52c41a'
  if (life > 30) return '#faad14'
  return '#ff4d4f'
}

onLoad((options) => {
  if (options.id) {
    fetchDetail(options.id)
  }
  fetchPackages()
})

const getDeviceImage = (brand) => {
  if (brand) {
    if (brand.includes('怡宝')) return '/static/images/yibao-water-dispenser.png'
    if (brand.includes('扬子')) return '/static/images/yangzi-water-dispenser.png'
    if (brand.includes('万达') || brand.toUpperCase().includes('WD') || brand.toUpperCase().includes('WANDA')) return '/static/images/wanda-water-dispenser.jpg'
  }
  return '/static/images/wtj-water-dispenser.png'
}

const fetchDetail = async (id) => {
  try {
    const res = await getDeviceDetail(id)
    if (res.code === 0) {
      device.value = res.data
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

const fetchPackages = async () => {
  try {
    const res = await getPackages()
    if (res.code === 0) {
      packages.value = res.data || []
    }
  } catch (e) {
    console.error('获取套餐失败:', e)
  }
}

const onRecharge = () => {
  if (!selectedPkg.value) return
  const pkg = packages.value.find(p => p.id === selectedPkg.value)
  uni.showModal({
    title: '充值确认',
    content: `确定要购买「${pkg.name}」(¥${pkg.price})？\n请联系工作人员完成充值。`,
    confirmText: '联系客服',
    success: (res) => {
      if (res.confirm) {
        uni.makePhoneCall({ phoneNumber: '400-000-0000' })
      }
    }
  })
}
</script>

<style scoped>
.detail-page {
  padding: 24rpx;
  padding-bottom: 60rpx;
}

.device-header {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.04);
}

.header-content {
  display: flex;
  align-items: center;
}

.device-image-wrap {
  width: 160rpx;
  height: 160rpx;
  background: #f1f5f9;
  border-radius: 20rpx;
  padding: 10rpx;
  margin-right: 32rpx;
  flex-shrink: 0;
}

.device-image {
  width: 100%;
  height: 100%;
}

.header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.header-top {
  margin-bottom: 8rpx;
}

.device-name {
  font-size: 34rpx;
  font-weight: 800;
  color: #1e293b;
}

.device-sn {
  font-size: 24rpx;
  color: #64748b;
  font-family: monospace;
  margin-bottom: 16rpx;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  padding: 8rpx 20rpx;
  border-radius: 30rpx;
  font-size: 22rpx;
  font-weight: 600;
  align-self: flex-start;
}

.status-tag.online {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-tag.offline {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.status-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  margin-right: 12rpx;
}

.status-tag.online .status-dot {
  background: #10b981;
}

.status-tag.offline .status-dot {
  background: #ef4444;
}

.status-dot.pulse {
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  70% { transform: scale(1); box-shadow: 0 0 0 8rpx rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.section {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 24rpx;
}

.water-data {
  display: flex;
  align-items: center;
  justify-content: center;
}

.water-item {
  flex: 1;
  text-align: center;
}

.water-value {
  font-size: 56rpx;
  font-weight: bold;
  color: #ff6b35;
}

.water-value.pure {
  color: #4F46E5;
}

.water-unit {
  font-size: 22rpx;
  color: #999;
  margin-left: 4rpx;
}

.water-label {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

.water-divider {
  width: 2rpx;
  height: 80rpx;
  background: #eee;
  margin: 0 40rpx;
}

.filter-item {
  margin-bottom: 20rpx;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.filter-name {
  font-size: 26rpx;
  color: #666;
}

.filter-pct {
  font-size: 26rpx;
  color: #333;
  font-weight: 600;
}

.progress-bar {
  height: 12rpx;
  background: #f0f0f0;
  border-radius: 6rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 6rpx;
  transition: width 0.3s;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 26rpx;
  color: #999;
}

.info-value {
  font-size: 26rpx;
  color: #333;
  max-width: 420rpx;
  text-align: right;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 120rpx;
  color: #999;
}
/* 套餐卡片 */
.package-section {
  background: linear-gradient(135deg, #f0f4ff 0%, #fef6ff 100%);
}

.package-current {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  border: 2rpx solid #e8e8ff;
}

.pkg-type-badge {
  display: inline-block;
  background: linear-gradient(135deg, #4F46E5, #7c3aed);
  color: #fff;
  padding: 6rpx 24rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 600;
  margin-bottom: 20rpx;
}

.pkg-stats {
  display: flex;
  align-items: center;
  justify-content: center;
}

.pkg-stat-item {
  flex: 1;
  text-align: center;
}

.pkg-stat-value {
  font-size: 48rpx;
  font-weight: 800;
  color: #4F46E5;
}

.pkg-unlimited {
  font-size: 32rpx;
  color: #10b981;
}

.pkg-stat-unit {
  font-size: 22rpx;
  color: #64748b;
  margin-left: 4rpx;
}

.pkg-stat-label {
  display: block;
  font-size: 22rpx;
  color: #94a3b8;
  margin-top: 6rpx;
}

.pkg-stat-divider {
  width: 2rpx;
  height: 60rpx;
  background: #e2e8f0;
}

.pkg-expire {
  text-align: center;
  font-size: 22rpx;
  color: #94a3b8;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx dashed #e2e8f0;
}

/* 充值套餐列表 */
.package-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.package-card {
  background: #f8fafc;
  border-radius: 16rpx;
  padding: 24rpx;
  border: 2rpx solid #e2e8f0;
  transition: all 0.2s;
}

.package-card.active {
  border-color: #4F46E5;
  background: #f0f0ff;
  box-shadow: 0 4rpx 16rpx rgba(79, 70, 229, 0.15);
}

.pkg-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.pkg-name {
  font-size: 30rpx;
  font-weight: 700;
  color: #1e293b;
}

.pkg-tag {
  font-size: 20rpx;
  color: #64748b;
  background: #e2e8f0;
  padding: 4rpx 16rpx;
  border-radius: 12rpx;
}

.pkg-card-body {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
}

.pkg-price {
  font-size: 40rpx;
  font-weight: 800;
  color: #ef4444;
}

.pkg-original-price {
  font-size: 24rpx;
  color: #c0c4cc;
  text-decoration: line-through;
  margin-left: 8rpx;
}

.pkg-tag-renew {
  background: #fef0e7 !important;
  color: #e6a23c !important;
}

.pkg-detail {
  font-size: 24rpx;
  color: #64748b;
}

.pkg-desc {
  display: block;
  font-size: 22rpx;
  color: #94a3b8;
  margin-top: 8rpx;
}

.pkg-action {
  margin-top: 24rpx;
}

.recharge-btn {
  width: 100%;
  background: linear-gradient(135deg, #4F46E5, #7c3aed);
  color: #fff;
  border: none;
  border-radius: 16rpx;
  padding: 24rpx 0;
  font-size: 30rpx;
  font-weight: 700;
  letter-spacing: 4rpx;
}

.recharge-btn[disabled] {
  opacity: 0.5;
}
</style>
