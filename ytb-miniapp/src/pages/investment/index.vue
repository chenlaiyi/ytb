<template>
  <view class="page">
    <!-- 投资概览 -->
    <view class="overview-card">
      <view class="overview-header">
        <text class="overview-icon">💰</text>
        <text class="overview-title">Boss投资</text>
      </view>
      <view class="overview-stats">
        <view class="ov-stat">
          <text class="ov-value">{{ totalInvested }}</text>
          <text class="ov-label">累计投资(元)</text>
        </view>
        <view class="ov-divider"></view>
        <view class="ov-stat">
          <text class="ov-value">{{ investments.length }}</text>
          <text class="ov-label">投资笔数</text>
        </view>
      </view>
    </view>

    <!-- 投资记录 -->
    <view class="list-section">
      <view class="section-title">📊 投资记录</view>
      <view v-if="loading" class="loading-box"><view class="spinner"></view></view>
      <view v-else-if="investments.length === 0" class="empty-box">
        <text class="empty-icon">📈</text>
        <text class="empty-text">暂无投资记录</text>
        <text class="empty-hint">BossCP合伙人专属投资权益</text>
      </view>
      <view v-else>
        <view class="invest-item" v-for="inv in investments" :key="inv.id">
          <view class="invest-left">
            <text class="invest-amount">¥{{ inv.amount }}</text>
            <text class="invest-time">{{ inv.created_at }}</text>
          </view>
          <view class="invest-right">
            <view class="invest-status" :class="'st-' + inv.status">{{ getStatus(inv.status) }}</view>
            <text class="invest-return" v-if="inv.return_amount">收益 ¥{{ inv.return_amount }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { get } from '../../api/request'

const investments = ref([])
const loading = ref(false)

const totalInvested = computed(() => {
  return investments.value.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0).toFixed(2)
})

const getStatus = (s) => ({ pending: '进行中', completed: '已完成', cancelled: '已取消' }[s] || '进行中')

const fetchInvestments = async () => {
  loading.value = true
  try {
    const res = await get('/api/ytb/investments')
    if (res.code === 0) investments.value = res.data?.list || []
  } catch (e) {}
  finally { loading.value = false }
}

onShow(() => fetchInvestments())
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f5f7; padding: 24rpx; padding-bottom: 60rpx; }

.overview-card { background: linear-gradient(135deg, #F59E0B, #D97706); border-radius: 24rpx; padding: 40rpx; color: #fff; margin-bottom: 24rpx; }
.overview-header { display: flex; align-items: center; gap: 12rpx; margin-bottom: 24rpx; }
.overview-icon { font-size: 40rpx; }
.overview-title { font-size: 32rpx; font-weight: 700; }
.overview-stats { display: flex; }
.ov-stat { flex: 1; text-align: center; }
.ov-value { display: block; font-size: 48rpx; font-weight: 800; }
.ov-label { display: block; font-size: 22rpx; color: rgba(255,255,255,0.7); margin-top: 4rpx; }
.ov-divider { width: 2rpx; background: rgba(255,255,255,0.2); }

.list-section { background: #fff; border-radius: 20rpx; padding: 24rpx; }
.section-title { font-size: 30rpx; font-weight: 700; color: #1e293b; margin-bottom: 20rpx; }

.loading-box, .empty-box { display: flex; flex-direction: column; align-items: center; padding: 80rpx 0; gap: 12rpx; }
.spinner { width: 48rpx; height: 48rpx; border: 4rpx solid #E5E7EB; border-top-color: #D97706; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-icon { font-size: 60rpx; }
.empty-text { font-size: 28rpx; color: #64748b; }
.empty-hint { font-size: 24rpx; color: #94a3b8; }

.invest-item { display: flex; justify-content: space-between; align-items: center; padding: 20rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.invest-item:last-child { border-bottom: none; }
.invest-amount { display: block; font-size: 32rpx; font-weight: 700; color: #1e293b; }
.invest-time { display: block; font-size: 22rpx; color: #94a3b8; margin-top: 4rpx; }
.invest-right { text-align: right; }
.invest-status { font-size: 22rpx; padding: 4rpx 14rpx; border-radius: 10rpx; font-weight: 600; }
.st-pending { background: #FEF3C7; color: #D97706; }
.st-completed { background: #D1FAE5; color: #059669; }
.st-cancelled { background: #F1F5F9; color: #94a3b8; }
.invest-return { display: block; font-size: 24rpx; color: #10B981; font-weight: 600; margin-top: 4rpx; }
</style>
