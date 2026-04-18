<template>
  <view class="page">
    <!-- 邀请码卡片 -->
    <view class="invite-card">
      <view class="invite-header">
        <text class="invite-icon">🎯</text>
        <text class="invite-title">拓展推广</text>
      </view>
      <text class="invite-desc">分享邀请码给朋友，组建你的团队</text>
      <view class="invite-code-box">
        <text class="invite-code-label">我的邀请码</text>
        <text class="invite-code">{{ inviteCode || '加载中...' }}</text>
        <button class="copy-btn" @tap="copyCode">复制邀请码</button>
      </view>
    </view>

    <!-- 功能入口 -->
    <view class="grid-section">
      <view class="grid-item" @tap="goTo('/pages/team/index')">
        <text class="grid-icon">👥</text>
        <text class="grid-label">我的团队</text>
        <text class="grid-desc">查看直推成员</text>
      </view>
      <view class="grid-item" @tap="goTo('/pages/poster/index')">
        <text class="grid-icon">🖼️</text>
        <text class="grid-label">推广海报</text>
        <text class="grid-desc">分享推广素材</text>
      </view>
      <view class="grid-item" @tap="goTo('/pages/commission/index')">
        <text class="grid-icon">💰</text>
        <text class="grid-label">佣金明细</text>
        <text class="grid-desc">查看收益记录</text>
      </view>
      <view class="grid-item" @tap="goTo('/pages/upgrade/index')">
        <text class="grid-icon">🚀</text>
        <text class="grid-label">升级中心</text>
        <text class="grid-desc">提升合伙人等级</text>
      </view>
    </view>

    <!-- 分享按钮 -->
    <view class="share-section">
      <button class="share-btn" open-type="share">
        <text class="share-btn-icon">📤</text>
        <text>分享给微信好友</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow, onShareAppMessage } from '@dcloudio/uni-app'
import { getInviteCode } from '../../api/ytb'

const inviteCode = ref('')

const fetchCode = async () => {
  try {
    const res = await getInviteCode()
    if (res.code === 0) inviteCode.value = res.data?.invite_code || res.data?.code || ''
  } catch (e) {}
}

const copyCode = () => {
  if (!inviteCode.value) return
  uni.setClipboardData({
    data: inviteCode.value,
    success: () => uni.showToast({ title: '已复制', icon: 'success' })
  })
}

const goTo = (url) => uni.navigateTo({ url })

onShareAppMessage(() => ({
  title: `我正在使用亿拓宝，邀请你一起加入！邀请码：${inviteCode.value}`,
  path: `/pages/index/index?invite_code=${inviteCode.value}`
}))

onShow(() => fetchCode())
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f5f7; padding: 24rpx; padding-bottom: 60rpx; }

.invite-card { background: linear-gradient(135deg, #4F46E5, #7C3AED); border-radius: 24rpx; padding: 40rpx; color: #fff; margin-bottom: 24rpx; position: relative; overflow: hidden; }
.invite-card::after { content: ''; position: absolute; right: -40rpx; bottom: -40rpx; width: 200rpx; height: 200rpx; background: rgba(255,255,255,0.06); border-radius: 50%; }
.invite-header { display: flex; align-items: center; gap: 12rpx; margin-bottom: 8rpx; }
.invite-icon { font-size: 36rpx; }
.invite-title { font-size: 34rpx; font-weight: 800; }
.invite-desc { font-size: 24rpx; color: rgba(255,255,255,0.6); margin-bottom: 24rpx; }
.invite-code-box { background: rgba(255,255,255,0.15); border-radius: 16rpx; padding: 24rpx; text-align: center; backdrop-filter: blur(10rpx); }
.invite-code-label { font-size: 22rpx; color: rgba(255,255,255,0.6); display: block; margin-bottom: 8rpx; }
.invite-code { font-size: 52rpx; font-weight: 800; letter-spacing: 12rpx; display: block; margin-bottom: 16rpx; }
.copy-btn { background: #fff; color: #4F46E5; border: none; border-radius: 12rpx; padding: 12rpx 40rpx; font-size: 26rpx; font-weight: 600; display: inline-block; margin: 0; }
.copy-btn::after { border: none; }

.grid-section { display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx; margin-bottom: 24rpx; }
.grid-item { background: #fff; border-radius: 20rpx; padding: 32rpx 24rpx; text-align: center; transition: all 0.2s; }
.grid-icon { font-size: 48rpx; display: block; margin-bottom: 12rpx; }
.grid-label { font-size: 28rpx; font-weight: 700; color: #1e293b; display: block; }
.grid-desc { font-size: 22rpx; color: #94a3b8; display: block; margin-top: 4rpx; }

.share-section { margin-top: 16rpx; }
.share-btn { width: 100%; background: linear-gradient(135deg, #4F46E5, #7C3AED); color: #fff; border: none; border-radius: 16rpx; padding: 28rpx 0; font-size: 30rpx; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 12rpx; }
.share-btn::after { border: none; }
.share-btn-icon { font-size: 32rpx; }
</style>
