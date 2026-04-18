<template>
  <view class="page">
    <!-- 统计面板 -->
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-value">{{ total }}</text>
        <text class="stat-label">团队总人数</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ list.length }}</text>
        <text class="stat-label">直推成员</text>
      </view>
    </view>

    <!-- 成员列表 -->
    <view class="list-section">
      <view class="section-header">
        <text class="section-title">👥 我的团队</text>
      </view>

      <view v-if="loading && list.length === 0" class="loading-box">
        <view class="spinner"></view>
      </view>

      <view v-else-if="list.length === 0" class="empty-box">
        <text class="empty-icon">👋</text>
        <text class="empty-text">暂无团队成员</text>
        <text class="empty-hint">分享邀请码给朋友，组建您的团队</text>
      </view>

      <scroll-view v-else scroll-y class="list-scroll" @scrolltolower="loadMore" refresher-enabled :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
        <view class="member-item" v-for="item in list" :key="item.id">
          <image class="member-avatar" :src="item.avatar || '/static/images/default-avatar.png'" mode="aspectFill" />
          <view class="member-info">
            <view class="member-top">
              <text class="member-name">{{ item.nickname || '用户' + item.id }}</text>
              <view class="member-role" :class="'role-' + item.role">{{ getRoleName(item.role) }}</view>
            </view>
            <text class="member-phone" v-if="item.phone">{{ maskPhone(item.phone) }}</text>
            <text class="member-time">加入时间: {{ formatDate(item.created_at) }}</text>
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
import { getTeam } from '../../api/ytb'

const list = ref([])
const total = ref(0)
const loading = ref(false)
const refreshing = ref(false)
const page = ref(1)
const noMore = ref(false)

const getRoleName = (r) => ({ normal: '用户', scp: 'SCP', team_cp: 'VIPCP', boss_cp: 'BossCP' }[r] || '用户')
const maskPhone = (p) => p ? p.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : ''
const formatDate = (d) => d ? d.substring(0, 10) : '-'

const fetchList = async (reset = false) => {
  if (reset) { page.value = 1; noMore.value = false }
  loading.value = true
  try {
    const res = await getTeam({ page: page.value, per_page: 20 })
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

.stats-card { display: flex; margin: 24rpx; background: linear-gradient(135deg, #4F46E5, #7C3AED); border-radius: 24rpx; padding: 40rpx; color: #fff; }
.stat-item { flex: 1; text-align: center; }
.stat-value { display: block; font-size: 52rpx; font-weight: 800; }
.stat-label { display: block; font-size: 24rpx; color: rgba(255,255,255,0.7); margin-top: 8rpx; }
.stat-divider { width: 2rpx; background: rgba(255,255,255,0.2); margin: 0 20rpx; }

.list-section { margin: 0 24rpx; background: #fff; border-radius: 20rpx; overflow: hidden; }
.section-header { padding: 24rpx; border-bottom: 1rpx solid #f0f0f0; }
.section-title { font-size: 30rpx; font-weight: 700; color: #1e293b; }

.loading-box, .empty-box { display: flex; flex-direction: column; align-items: center; padding: 80rpx 0; gap: 12rpx; }
.spinner { width: 48rpx; height: 48rpx; border: 4rpx solid #E5E7EB; border-top-color: #4F46E5; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-icon { font-size: 60rpx; }
.empty-text { font-size: 28rpx; color: #64748b; }
.empty-hint { font-size: 24rpx; color: #94a3b8; }

.list-scroll { max-height: calc(100vh - 360rpx); }
.member-item { display: flex; align-items: center; padding: 24rpx; border-bottom: 1rpx solid #f8f8f8; gap: 20rpx; }
.member-avatar { width: 88rpx; height: 88rpx; border-radius: 50%; background: #f0f0f5; flex-shrink: 0; }
.member-info { flex: 1; display: flex; flex-direction: column; gap: 4rpx; }
.member-top { display: flex; align-items: center; gap: 12rpx; }
.member-name { font-size: 30rpx; font-weight: 600; color: #1e293b; }
.member-role { font-size: 20rpx; padding: 4rpx 12rpx; border-radius: 10rpx; font-weight: 600; }
.role-normal { background: #F1F5F9; color: #64748b; }
.role-scp { background: #DBEAFE; color: #3B82F6; }
.role-team_cp { background: #FEF3C7; color: #D97706; }
.role-boss_cp { background: #FDF4FF; color: #C026D3; }
.member-phone { font-size: 24rpx; color: #64748b; }
.member-time { font-size: 22rpx; color: #94a3b8; }
.no-more { text-align: center; padding: 24rpx; font-size: 24rpx; color: #ccc; }
</style>
