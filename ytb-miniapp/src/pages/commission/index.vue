<template>
  <view class="page">
    <!-- 余额卡片 -->
    <view class="balance-card">
      <view class="card-bg"></view>
      <view class="balance-info">
        <text class="balance-label">可提现余额（元）</text>
        <text class="balance-value">{{ userStore.userInfo?.available_balance || '0.00' }}</text>
      </view>
      <view class="balance-actions">
        <button class="action-btn withdraw-btn" @tap="goWithdraw">去提现</button>
        <button class="action-btn records-btn" @tap="goRecords">提现记录</button>
      </view>
      <view class="frozen-row">
        <text class="frozen-label">冻结中</text>
        <text class="frozen-value">¥{{ userStore.userInfo?.frozen_balance || '0.00' }}</text>
      </view>
    </view>

    <!-- 分佣列表 -->
    <view class="list-section">
      <view class="section-header">
        <text class="section-title">分佣明细</text>
        <text class="section-total">共{{ total }}条</text>
      </view>

      <view v-if="loading && list.length === 0" class="loading-box">
        <view class="spinner"></view>
      </view>

      <view v-else-if="list.length === 0" class="empty-box">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无分佣记录</text>
      </view>

      <scroll-view v-else scroll-y class="list-scroll" @scrolltolower="loadMore" refresher-enabled :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
        <view class="comm-item" v-for="item in list" :key="item.id">
          <view class="comm-left">
            <view class="comm-type-badge" :class="'type-' + (item.type || 'direct')">
              {{ getTypeText(item.type) }}
            </view>
            <view class="comm-detail">
              <text class="comm-source">{{ item.source_desc || item.description || '佣金收入' }}</text>
              <text class="comm-time">{{ item.created_at }}</text>
            </view>
          </view>
          <text class="comm-amount" :class="{ negative: parseFloat(item.amount) < 0 }">
            {{ parseFloat(item.amount) > 0 ? '+' : '' }}{{ item.amount }}
          </text>
        </view>
        <view v-if="noMore" class="no-more">没有更多了</view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../stores/user'
import { getCommissions } from '../../api/ytb'

const userStore = useUserStore()
const list = ref([])
const total = ref(0)
const loading = ref(false)
const refreshing = ref(false)
const page = ref(1)
const noMore = ref(false)

const fetchList = async (reset = false) => {
  if (reset) { page.value = 1; noMore.value = false }
  loading.value = true
  try {
    const res = await getCommissions({ page: page.value, per_page: 20 })
    if (res.code === 0) {
      const items = res.data?.list || []
      if (reset) { list.value = items } else { list.value.push(...items) }
      total.value = res.data?.total || 0
      if (items.length < 20) noMore.value = true
    }
  } catch (e) { console.error(e) }
  finally { loading.value = false; refreshing.value = false }
}

const loadMore = () => { if (!noMore.value && !loading.value) { page.value++; fetchList() } }
const onRefresh = () => { refreshing.value = true; fetchList(true) }
const goWithdraw = () => uni.navigateTo({ url: '/pages/withdraw/index' })
const goRecords = () => uni.navigateTo({ url: '/pages/withdraw-records/index' })

const getTypeText = (type) => {
  const m = { direct: '直推', indirect: '间推', team: '团队', install: '装机', package: '套餐', bonus: '奖励' }
  return m[type] || '佣金'
}

onShow(() => fetchList(true))
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f5f7; }
.balance-card { margin: 24rpx; background: linear-gradient(135deg, #4F46E5, #7C3AED); border-radius: 24rpx; padding: 40rpx; color: #fff; position: relative; overflow: hidden; }
.card-bg { position: absolute; right: -40rpx; top: -40rpx; width: 200rpx; height: 200rpx; background: rgba(255,255,255,0.08); border-radius: 50%; }
.balance-label { font-size: 26rpx; color: rgba(255,255,255,0.7); display: block; }
.balance-value { font-size: 64rpx; font-weight: 800; display: block; margin: 12rpx 0 24rpx; }
.balance-actions { display: flex; gap: 16rpx; margin-bottom: 20rpx; }
.action-btn { flex: 1; height: 72rpx; line-height: 72rpx; border-radius: 36rpx; font-size: 28rpx; font-weight: 600; text-align: center; border: none; margin: 0; }
.action-btn::after { border: none; }
.withdraw-btn { background: #fff; color: #4F46E5; }
.records-btn { background: rgba(255,255,255,0.2); color: #fff; }
.frozen-row { display: flex; justify-content: space-between; padding-top: 16rpx; border-top: 1rpx solid rgba(255,255,255,0.15); }
.frozen-label { font-size: 24rpx; color: rgba(255,255,255,0.5); }
.frozen-value { font-size: 24rpx; color: rgba(255,255,255,0.7); }

.list-section { margin: 0 24rpx; background: #fff; border-radius: 20rpx; overflow: hidden; }
.section-header { display: flex; justify-content: space-between; align-items: center; padding: 24rpx; border-bottom: 1rpx solid #f0f0f0; }
.section-title { font-size: 30rpx; font-weight: 700; color: #1e293b; }
.section-total { font-size: 24rpx; color: #94a3b8; }

.loading-box, .empty-box { display: flex; flex-direction: column; align-items: center; padding: 80rpx 0; gap: 16rpx; }
.spinner { width: 48rpx; height: 48rpx; border: 4rpx solid #E5E7EB; border-top-color: #4F46E5; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-icon { font-size: 60rpx; }
.empty-text { font-size: 28rpx; color: #94a3b8; }

.list-scroll { max-height: calc(100vh - 480rpx); }
.comm-item { display: flex; justify-content: space-between; align-items: center; padding: 24rpx; border-bottom: 1rpx solid #f8f8f8; }
.comm-left { display: flex; align-items: center; gap: 16rpx; flex: 1; }
.comm-type-badge { font-size: 20rpx; padding: 4rpx 14rpx; border-radius: 12rpx; font-weight: 600; flex-shrink: 0; }
.type-direct { background: #DBEAFE; color: #3B82F6; }
.type-indirect { background: #E0E7FF; color: #6366F1; }
.type-team { background: #FEF3C7; color: #D97706; }
.type-install { background: #D1FAE5; color: #059669; }
.type-package { background: #FFF7ED; color: #EA580C; }
.type-bonus { background: #FDF4FF; color: #C026D3; }
.comm-detail { display: flex; flex-direction: column; gap: 4rpx; min-width: 0; }
.comm-source { font-size: 28rpx; color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.comm-time { font-size: 22rpx; color: #94a3b8; }
.comm-amount { font-size: 32rpx; font-weight: 700; color: #10B981; flex-shrink: 0; }
.comm-amount.negative { color: #EF4444; }
.no-more { text-align: center; padding: 24rpx; font-size: 24rpx; color: #ccc; }
</style>
