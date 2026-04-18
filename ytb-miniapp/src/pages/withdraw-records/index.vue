<template>
  <view class="page">
    <view class="list-section">
      <view v-if="loading && list.length === 0" class="loading-box">
        <view class="spinner"></view>
      </view>
      <view v-else-if="list.length === 0" class="empty-box">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无提现记录</text>
      </view>
      <scroll-view v-else scroll-y class="list-scroll" @scrolltolower="loadMore" refresher-enabled :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
        <view class="record-item" v-for="item in list" :key="item.id">
          <view class="record-left">
            <view class="record-status" :class="'st-' + item.status">{{ getStatus(item.status) }}</view>
            <view class="record-info">
              <text class="record-method">{{ getMethod(item.pay_method) }} · {{ item.real_name || '-' }}</text>
              <text class="record-time">{{ item.created_at }}</text>
            </view>
          </view>
          <view class="record-right">
            <text class="record-amount">-¥{{ item.amount }}</text>
            <text class="record-fee" v-if="item.fee">手续费 ¥{{ item.fee }}</text>
          </view>
        </view>
        <view v-if="noMore" class="no-more">没有更多了</view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getWithdrawals } from '../../api/ytb'

const list = ref([])
const total = ref(0)
const loading = ref(false)
const refreshing = ref(false)
const page = ref(1)
const noMore = ref(false)

const getStatus = (s) => ({ pending: '审核中', approved: '已通过', rejected: '已拒绝', paid: '已打款' }[s] || '处理中')
const getMethod = (m) => ({ wechat: '微信', alipay: '支付宝', bank: '银行卡' }[m] || '未知')

const fetchList = async (reset = false) => {
  if (reset) { page.value = 1; noMore.value = false }
  loading.value = true
  try {
    const res = await getWithdrawals({ page: page.value, per_page: 20 })
    if (res.code === 0) {
      const items = res.data?.list || []
      if (reset) list.value = items; else list.value.push(...items)
      total.value = res.data?.total || 0
      if (items.length < 20) noMore.value = true
    }
  } catch (e) {}
  finally { loading.value = false; refreshing.value = false }
}

const loadMore = () => { if (!noMore.value && !loading.value) { page.value++; fetchList() } }
const onRefresh = () => { refreshing.value = true; fetchList(true) }

onShow(() => fetchList(true))
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f5f7; }
.list-section { margin: 24rpx; background: #fff; border-radius: 20rpx; overflow: hidden; }
.loading-box, .empty-box { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; gap: 16rpx; }
.spinner { width: 48rpx; height: 48rpx; border: 4rpx solid #E5E7EB; border-top-color: #4F46E5; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-icon { font-size: 60rpx; }
.empty-text { font-size: 28rpx; color: #94a3b8; }

.list-scroll { max-height: calc(100vh - 100rpx); }
.record-item { display: flex; justify-content: space-between; align-items: center; padding: 24rpx; border-bottom: 1rpx solid #f5f5f5; }
.record-left { display: flex; align-items: center; gap: 16rpx; }
.record-status { font-size: 20rpx; padding: 6rpx 16rpx; border-radius: 12rpx; font-weight: 600; flex-shrink: 0; }
.st-pending { background: #FEF3C7; color: #D97706; }
.st-approved { background: #DBEAFE; color: #3B82F6; }
.st-rejected { background: #FEE2E2; color: #EF4444; }
.st-paid { background: #D1FAE5; color: #059669; }
.record-info { display: flex; flex-direction: column; gap: 4rpx; }
.record-method { font-size: 28rpx; color: #334155; }
.record-time { font-size: 22rpx; color: #94a3b8; }
.record-right { text-align: right; }
.record-amount { display: block; font-size: 32rpx; font-weight: 700; color: #ef4444; }
.record-fee { display: block; font-size: 20rpx; color: #94a3b8; margin-top: 4rpx; }
.no-more { text-align: center; padding: 24rpx; font-size: 24rpx; color: #ccc; }
</style>
