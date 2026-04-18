<template>
  <view class="detail-page">
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="nav-title">工单详情</text>
    </view>

    <!-- 加载中 -->
    <view v-if="loading" class="loading-state">
      <view class="spinner"></view>
      <text>加载中...</text>
    </view>

    <scroll-view v-else-if="order" scroll-y class="detail-scroll">
      <!-- 状态卡片 -->
      <view class="status-card" :class="'bg-' + order.status">
        <text class="status-label">{{ getStatusText(order.status) }}</text>
        <text class="status-desc">{{ getStatusDesc(order.status) }}</text>
        <text class="order-no-white">{{ order.order_no }}</text>
      </view>

      <!-- 联系信息 -->
      <view class="section-card">
        <text class="section-title">联系信息</text>
        <view class="info-grid">
          <view class="info-cell">
            <text class="cell-label">联系人</text>
            <text class="cell-value">{{ order.contact_name }}</text>
          </view>
          <view class="info-cell">
            <text class="cell-label">电话</text>
            <text class="cell-value">{{ order.contact_phone }}</text>
          </view>
          <view class="info-cell full">
            <text class="cell-label">安装地址</text>
            <text class="cell-value">{{ order.province }}{{ order.city }} {{ order.address }}</text>
          </view>
          <view class="info-cell">
            <text class="cell-label">预约日期</text>
            <text class="cell-value">{{ order.preferred_date }}</text>
          </view>
          <view class="info-cell">
            <text class="cell-label">预约时间</text>
            <text class="cell-value">{{ order.preferred_time }}</text>
          </view>
        </view>
      </view>

      <!-- 费用信息 -->
      <view class="section-card">
        <text class="section-title">费用信息</text>
        <view class="fee-list">
          <view class="fee-item">
            <text class="fee-name">安装服务费</text>
            <view class="fee-right">
              <text class="fee-amount">¥{{ order.install_fee || '120.00' }}</text>
              <text :class="['fee-status', order.payment_status === 'paid' ? 'paid' : 'unpaid']">
                {{ order.payment_status === 'paid' ? '已支付' : '待支付' }}
              </text>
            </view>
          </view>
        </view>
      </view>

      <!-- 配件信息 -->
      <view class="section-card" v-if="order.accessory">
        <text class="section-title">配件信息</text>
        <view class="accessory-list">
          <view class="acc-item" v-for="(item, idx) in order.accessory.items" :key="idx">
            <text class="acc-name">{{ item.name }}</text>
            <text class="acc-qty">×{{ item.quantity }}</text>
            <text class="acc-price">¥{{ item.price }}</text>
          </view>
          <view class="acc-total">
            <text>配件总计</text>
            <text class="acc-total-amount">¥{{ order.accessory.total_amount }}</text>
          </view>
          <text :class="['fee-status', order.accessory.payment_status === 'paid' ? 'paid' : 'unpaid']">
            {{ order.accessory.payment_status === 'paid' ? '配件已支付' : '配件待支付' }}
          </text>
        </view>
      </view>

      <!-- 水质检测 -->
      <view class="section-card" v-if="order.water_test">
        <text class="section-title">水质检测报告</text>
        <view class="test-grid">
          <view class="test-item">
            <text class="test-label">TDS (纯水)</text>
            <text class="test-value tds-good">{{ order.water_test.tds_pure || '--' }}</text>
          </view>
          <view class="test-item">
            <text class="test-label">TDS (原水)</text>
            <text class="test-value">{{ order.water_test.tds_raw || '--' }}</text>
          </view>
          <view class="test-item">
            <text class="test-label">余氯</text>
            <text class="test-value">{{ order.water_test.chlorine || '--' }}</text>
          </view>
          <view class="test-item">
            <text class="test-label">矿物质</text>
            <text class="test-value">{{ order.water_test.mineral || '--' }}</text>
          </view>
        </view>
        <view class="test-conclusion" v-if="order.water_test.conclusion">
          <text class="conclusion-label">检测结论</text>
          <text class="conclusion-text">{{ order.water_test.conclusion }}</text>
        </view>
      </view>

      <!-- 设备信息 -->
      <view class="section-card" v-if="order.board_code">
        <text class="section-title">绑定设备</text>
        <view class="device-info">
          <text class="device-code">设备编码：{{ order.board_code }}</text>
        </view>
      </view>

      <!-- 备注 -->
      <view class="section-card" v-if="order.remark">
        <text class="section-title">备注</text>
        <text class="remark-text">{{ order.remark }}</text>
      </view>

      <!-- 时间线 -->
      <view class="section-card">
        <text class="section-title">进度记录</text>
        <view class="timeline">
          <view class="tl-item" v-if="order.created_at">
            <view class="tl-dot active"></view>
            <view class="tl-content">
              <text class="tl-title">提交预约</text>
              <text class="tl-time">{{ formatDate(order.created_at) }}</text>
            </view>
          </view>
          <view class="tl-item" v-if="order.paid_at">
            <view class="tl-dot active"></view>
            <view class="tl-content">
              <text class="tl-title">支付安装费</text>
              <text class="tl-time">{{ formatDate(order.paid_at) }}</text>
            </view>
          </view>
          <view class="tl-item" v-if="order.assigned_at">
            <view class="tl-dot active"></view>
            <view class="tl-content">
              <text class="tl-title">已派单给工程师</text>
              <text class="tl-time">{{ formatDate(order.assigned_at) }}</text>
            </view>
          </view>
          <view class="tl-item" v-if="order.accepted_at">
            <view class="tl-dot active"></view>
            <view class="tl-content">
              <text class="tl-title">工程师已接单</text>
              <text class="tl-time">{{ formatDate(order.accepted_at) }}</text>
            </view>
          </view>
          <view class="tl-item" v-if="order.picked_at">
            <view class="tl-dot active"></view>
            <view class="tl-content">
              <text class="tl-title">已领取设备</text>
              <text class="tl-time">{{ formatDate(order.picked_at) }}</text>
            </view>
          </view>
          <view class="tl-item" v-if="order.installed_at">
            <view class="tl-dot active"></view>
            <view class="tl-content">
              <text class="tl-title">安装完成</text>
              <text class="tl-time">{{ formatDate(order.installed_at) }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="bottom-spacer"></view>
    </scroll-view>

    <!-- 错误状态 -->
    <view v-else class="loading-state">
      <text class="empty-icon">😕</text>
      <text>工单不存在或无权查看</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const order = ref(null)
const loading = ref(true)

const fetchDetail = async (id) => {
  try {
    const token = uni.getStorageSync('token')
    const res = await uni.request({
      url: `https://ytb.ddg.org.cn/api/ytb/install/orders/${id}`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` }
    })
    const data = res.data || res[1]?.data
    if (data && data.code === 0 && data.data) {
      order.value = data.data
    }
  } catch (e) {
    console.error('获取工单详情失败:', e)
  } finally {
    loading.value = false
  }
}

onLoad((options) => {
  if (options.id) fetchDetail(options.id)
  else loading.value = false
})

const goBack = () => uni.navigateBack()

const formatDate = (dt) => {
  if (!dt) return ''
  return dt.substring(0, 16).replace('T', ' ')
}

const getStatusText = (s) => {
  const m = { 'pending':'待处理','paid':'已支付','assigned':'已派单','accepted':'已接单','picked':'已领机','installing':'安装中','completed':'已完成','activated':'已激活','cancelled':'已取消' }
  return m[s] || s
}

const getStatusDesc = (s) => {
  const m = {
    'pending': '您的预约已提交，等待处理中',
    'paid': '安装费已支付，等待分配工程师',
    'assigned': '已分配工程师，等待工程师确认接单',
    'accepted': '工程师已接单，即将为您安排上门',
    'picked': '工程师已领取设备，准备上门安装',
    'installing': '工程师正在为您安装净水器',
    'completed': '安装已完成，请绑定设备并选择套餐',
    'activated': '设备已激活，正常使用中',
    'cancelled': '工单已取消'
  }
  return m[s] || ''
}
</script>

<style scoped>
.detail-page { min-height: 100vh; background: #f5f5f7; }
.nav-bar { display: flex; align-items: center; padding: 80rpx 30rpx 20rpx; background: linear-gradient(135deg, #4F46E5, #7C3AED); }
.nav-back { width: 60rpx; height: 60rpx; display: flex; align-items: center; justify-content: center; }
.back-icon { font-size: 36rpx; color: #fff; font-weight: 700; }
.nav-title { flex: 1; text-align: center; font-size: 34rpx; font-weight: 700; color: #fff; margin-right: 60rpx; }

.loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding-top: 200rpx; gap: 20rpx; color: #9CA3AF; font-size: 28rpx; }
.spinner { width: 48rpx; height: 48rpx; border: 4rpx solid #E5E7EB; border-top-color: #4F46E5; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-icon { font-size: 60rpx; }

.detail-scroll { height: calc(100vh - 160rpx); }

/* 状态卡片 */
.status-card { margin: 20rpx 30rpx; padding: 36rpx; border-radius: 24rpx; color: #fff; background: linear-gradient(135deg, #4F46E5, #7C3AED); }
.bg-completed, .bg-activated { background: linear-gradient(135deg, #059669, #10B981); }
.bg-cancelled { background: linear-gradient(135deg, #DC2626, #EF4444); }
.bg-installing, .bg-picked { background: linear-gradient(135deg, #D97706, #F59E0B); }
.status-label { display: block; font-size: 36rpx; font-weight: 800; margin-bottom: 8rpx; }
.status-desc { display: block; font-size: 26rpx; opacity: 0.9; margin-bottom: 16rpx; }
.order-no-white { display: block; font-size: 22rpx; opacity: 0.7; font-family: monospace; }

/* 通用段落卡片 */
.section-card { margin: 0 30rpx 20rpx; background: #fff; border-radius: 24rpx; padding: 28rpx; box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04); }
.section-title { display: block; font-size: 30rpx; font-weight: 700; color: #1e1e2e; margin-bottom: 20rpx; }

/* 信息网格 */
.info-grid { display: flex; flex-wrap: wrap; gap: 16rpx; }
.info-cell { width: calc(50% - 8rpx); }
.info-cell.full { width: 100%; }
.cell-label { display: block; font-size: 24rpx; color: #9CA3AF; margin-bottom: 4rpx; }
.cell-value { display: block; font-size: 28rpx; color: #1f2937; font-weight: 500; }

/* 费用 */
.fee-item { display: flex; justify-content: space-between; align-items: center; padding: 12rpx 0; }
.fee-name { font-size: 28rpx; color: #4B5563; }
.fee-right { display: flex; align-items: center; gap: 12rpx; }
.fee-amount { font-size: 28rpx; font-weight: 700; color: #1e1e2e; }
.fee-status { font-size: 22rpx; padding: 4rpx 14rpx; border-radius: 12rpx; }
.paid { color: #059669; background: #ECFDF5; }
.unpaid { color: #F59E0B; background: #FEF3C7; }

/* 配件 */
.acc-item { display: flex; justify-content: space-between; padding: 10rpx 0; border-bottom: 1rpx solid #F3F4F6; }
.acc-name { flex: 1; font-size: 28rpx; color: #4B5563; }
.acc-qty { font-size: 26rpx; color: #9CA3AF; margin-right: 16rpx; }
.acc-price { font-size: 28rpx; color: #1e1e2e; font-weight: 600; }
.acc-total { display: flex; justify-content: space-between; padding: 16rpx 0 8rpx; font-size: 28rpx; font-weight: 600; }
.acc-total-amount { color: #EF4444; }

/* 水质检测 */
.test-grid { display: flex; flex-wrap: wrap; gap: 16rpx; }
.test-item { width: calc(50% - 8rpx); background: #F9FAFB; border-radius: 16rpx; padding: 20rpx; text-align: center; }
.test-label { display: block; font-size: 24rpx; color: #9CA3AF; margin-bottom: 8rpx; }
.test-value { display: block; font-size: 36rpx; font-weight: 700; color: #1e1e2e; }
.tds-good { color: #059669; }
.test-conclusion { margin-top: 16rpx; padding: 16rpx; background: #F0FDF4; border-radius: 12rpx; }
.conclusion-label { display: block; font-size: 24rpx; color: #059669; margin-bottom: 8rpx; font-weight: 600; }
.conclusion-text { font-size: 26rpx; color: #4B5563; line-height: 1.6; }

/* 设备 */
.device-code { font-size: 28rpx; color: #4B5563; font-family: monospace; }

/* 备注 */
.remark-text { font-size: 26rpx; color: #6b7280; line-height: 1.6; }

/* 时间线 */
.timeline { padding-left: 20rpx; }
.tl-item { display: flex; align-items: flex-start; gap: 20rpx; margin-bottom: 24rpx; position: relative; }
.tl-item:not(:last-child)::after { content: ''; position: absolute; left: 10rpx; top: 28rpx; width: 2rpx; height: calc(100% + 0rpx); background: #E5E7EB; }
.tl-dot { width: 20rpx; height: 20rpx; border-radius: 50%; background: #E5E7EB; flex-shrink: 0; margin-top: 6rpx; position: relative; z-index: 1; }
.tl-dot.active { background: #4F46E5; }
.tl-content { flex: 1; }
.tl-title { display: block; font-size: 28rpx; color: #1e1e2e; font-weight: 500; }
.tl-time { display: block; font-size: 24rpx; color: #9CA3AF; margin-top: 4rpx; }

.bottom-spacer { height: 60rpx; }
</style>
