<template>
  <view class="ytb-home">
    <view class="header-bg"></view>
    
    <!-- 欢迎词 -->
    <view class="dashboard-header">
      <view class="greeting">
        <text class="greet-text">{{ timeGreeting }}，</text>
        <text class="nickname">{{ userInfo.nickname || '亿拓宝贵宾' }}</text>
        <text :class="['role-tag', userInfo.role]">{{ roleName || '普通用户' }}</text>
      </view>
    </view>

    <!-- 关键指标卡片 -->
    <view class="key-metrics-card">
      <view class="metric-main" @tap="navigateTo('/pages/commission/index')">
        <text class="m-label">累计获取佣金 (元) ›</text>
        <text class="m-value">{{ formatMoney(commissionStats.total_settled || 0) }}</text>
      </view>
      <view class="metric-sub-row">
        <view class="m-sub" @tap="navigateTo('/pages/team/index')">
          <text class="s-label">直推用户</text>
          <text class="s-value">{{ userInfo.direct_user_count || 0 }}</text>
        </view>
        <view class="s-divider"></view>
        <view class="m-sub" @tap="navigateTo('/pages/team/index')">
          <text class="s-label">直推CP伙伴</text>
          <text class="s-value">{{ userInfo.direct_scp_count || 0 }}</text>
        </view>
        <view class="s-divider"></view>
        <view class="m-sub" @tap="navigateTo('/pages/commission/index')">
          <text class="s-label">待结佣金</text>
          <text class="s-value">{{ formatMoney(commissionStats.total_pending || 0) }}</text>
        </view>
      </view>
    </view>

    <!-- 工作台入口 -->
    <view class="workspace">
      <view class="section-title">核心业务</view>
      <view class="grid-layout">
        
        <view class="grid-item" @tap="navigateTo('/pages/team/index')">
          <view class="grid-icon-box team-icon">👥</view>
          <text class="grid-label">我的团队</text>
        </view>
        
        <view class="grid-item" @tap="navigateTo('/pages/installations/index')">
          <view class="grid-icon-box install-icon">🔧</view>
          <text class="grid-label">预约安装</text>
        </view>

        <view class="grid-item" @tap="navigateTo('/pages/commission/index')">
          <view class="grid-icon-box comm-icon">💰</view>
          <text class="grid-label">分佣明细</text>
        </view>

        <view class="grid-item" @tap="showInviteCode" v-if="userInfo.can_invite">
          <view class="grid-icon-box inv-icon">📱</view>
          <text class="grid-label">邀请码</text>
        </view>

        <view class="grid-item" @tap="goEngineer" v-if="userInfo.is_engineer">
          <view class="grid-icon-box engineer-icon">🛠️</view>
          <text class="grid-label">工程师工作台</text>
        </view>
        
      </view>
    </view>

    <!-- BOSS 或 升级入口 -->
    <view class="promo-banner" @tap="handlePromoClick">
      <view class="promo-info">
        <text class="promo-title">{{ userInfo.role === 'boss_cp' ? 'Boss CP 管理专区' : upgradeTitle }}</text>
        <text class="promo-desc">{{ userInfo.role === 'boss_cp' ? '查看您投资管理的设备资产与分润明细' : '获取更高层级分佣权益，开启更多权限' }}</text>
      </view>
      <view class="promo-btn">
        <text>{{ userInfo.role === 'boss_cp' ? '进入' : '去升级' }}</text>
        <text class="promo-arrow">›</text>
      </view>
    </view>

    <!-- 邀请码弹窗 -->
    <view class="popup-mask" v-if="showInvitePopup" @tap="showInvitePopup = false">
      <view class="popup-content" @tap.stop>
        <text class="popup-title">大咖推广码</text>
        <image class="qrcode" :src="inviteCodeData.qrcode_url" mode="aspectFit" />
        <text class="code-display">{{ inviteCodeData.invite_code }}</text>
        <text class="invite-tip">分享二维码或邀请码给好友，好友升级CP伙伴后您即可获得分佣收益</text>
        <button class="primary-btn" @tap="copyInviteCode">复制邀请码</button>
        <button class="secondary-btn" @tap="copyInviteUrl">复制邀请链接</button>
      </view>
    </view>

  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../stores/user'
import { getUserInfo, getInviteCode } from '../../api/ytb'

const userStore = useUserStore()
const userInfo = ref({})
const commissionStats = ref({})
const showInvitePopup = ref(false)
const inviteCodeData = ref({})

const timeGreeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '凌晨好'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const roleName = computed(() => {
  const map = { user: '普通用户', scp: '城市合伙人', team_cp: '团队合伙人', boss_cp: 'Boss合伙人' }
  return map[userInfo.value.role] || '普通用户'
})

const upgradeTitle = computed(() => {
  if (userInfo.value.role === 'normal' || userInfo.value.role === 'user') {
    return '升级为CP伙伴'
  } else if (userInfo.value.role === 'scp') {
    const requirement = 9
    const current = userInfo.value.direct_scp_count || 0
    if (current >= requirement) return '升级为VIP团队合伙人（已达标）'
    return `升级为VIP团队合伙人（${current}/${requirement}）`
  }
  return '权益升级中心'
})

onShow(() => {
  const token = uni.getStorageSync('token')
  if (token) {
    if (!userStore.isLoggedIn) userStore.setToken(token) 
    loadUserInfo()
  } else {
    uni.reLaunch({ url: '/pages/login/index' })
  }
})

const loadUserInfo = async () => {
  try {
    const res = await getUserInfo()
    if (res.code === 0 && res.data) {
      userInfo.value = res.data
      commissionStats.value = res.data.commission_stats || {}
      userStore.setUserInfo(res.data)
    }
  } catch (e) {
    userInfo.value = userStore.userInfo || {}
  }
}

const goEngineer = () => {
  uni.navigateTo({ url: '/pages/engineer/index' })
}

const showInviteCode = async () => {
  if (userInfo.value.invite_code) {
    const inviteUrl = `https://ytb.ddg.org.cn/app/#/register?invite=${userInfo.value.invite_code}`
    inviteCodeData.value = {
      invite_code: userInfo.value.invite_code,
      invite_url: inviteUrl,
      qrcode_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteUrl)}`
    }
    showInvitePopup.value = true
    return
  }

  try {
    const res = await getInviteCode()
    if (res.code === 0) {
      inviteCodeData.value = res.data
      userInfo.value.invite_code = res.data.invite_code
      showInvitePopup.value = true
    } else {
      uni.showToast({ title: '获取邀请码失败', icon: 'none' })
    }
  } catch (error) {
    uni.showToast({ title: '网络异常', icon: 'none' })
  }
}

const copyToClipboard = (text, successMsg) => {
  uni.setClipboardData({
    data: text,
    success: () => uni.showToast({ title: successMsg, icon: 'success' })
  })
}

const copyInviteCode = () => copyToClipboard(inviteCodeData.value.invite_code, '已复制邀请码')
const copyInviteUrl  = () => copyToClipboard(inviteCodeData.value.invite_url, '已复制邀请链接')
const formatMoney = (val) => parseFloat(val || 0).toFixed(2)

const navigateTo = (url) => {
  uni.navigateTo({ url })
}

const handlePromoClick = () => {
  if (userInfo.value.role === 'boss_cp') {
    navigateTo('/pages/investment/index')
  } else {
    navigateTo('/pages/upgrade/index')
  }
}
</script>

<style scoped>
.ytb-home {
  min-height: 100vh;
  background: #f7f8fa;
  position: relative;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 400rpx;
  background: linear-gradient(135deg, #1e3a8a 0%, #4F46E5 100%);
  border-radius: 0 0 60rpx 60rpx;
  z-index: 0;
}

.dashboard-header {
  position: relative;
  z-index: 1;
  padding: calc(env(safe-area-inset-top) + 40rpx) 40rpx 60rpx;
}

.greeting {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.greet-text {
  font-size: 40rpx;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 300;
}

.nickname {
  font-size: 44rpx;
  color: #fff;
  font-weight: 800;
  margin-right: 16rpx;
}

.role-tag {
  background: rgba(255, 255, 255, 0.2);
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  color: #fff;
  font-weight: 600;
  margin-top: 4rpx;
}

.role-tag.scp { background: #f59e0b; color: #fff; }
.role-tag.team_cp { background: #ef4444; color: #fff; }
.role-tag.boss_cp { background: #facc15; color: #1e3a8a; }

.key-metrics-card {
  position: relative;
  z-index: 2;
  background: #fff;
  margin: 0 32rpx;
  border-radius: 32rpx;
  padding: 40rpx 0 0;
  box-shadow: 0 16rpx 48rpx rgba(79, 70, 229, 0.08);
  margin-top: -20rpx;
}

.metric-main {
  display: flex;
  flex-direction: column;
  padding: 0 40rpx 32rpx;
}

.m-label {
  font-size: 26rpx;
  color: #64748b;
  margin-bottom: 12rpx;
  font-weight: 500;
}

.m-value {
  font-size: 64rpx;
  font-weight: 900;
  color: #1e293b;
  font-family: inherit;
  letter-spacing: -2rpx;
}

.metric-sub-row {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border-radius: 0 0 32rpx 32rpx;
  padding: 24rpx 20rpx;
  border-top: 1rpx solid #f1f5f9;
}

.m-sub {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.s-label {
  font-size: 22rpx;
  color: #94a3b8;
  margin-bottom: 8rpx;
}

.s-value {
  font-size: 32rpx;
  font-weight: 700;
  color: #334155;
}

.s-divider {
  width: 2rpx;
  height: 48rpx;
  background: #e2e8f0;
}

.workspace {
  margin: 48rpx 32rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 24rpx;
}

.grid-layout {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.grid-item {
  width: 48%;
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx 0;
  margin-bottom: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.02);
  transition: transform 0.2s;
}

.grid-item:active {
  transform: scale(0.98);
}

.grid-icon-box {
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  margin-bottom: 16rpx;
}

.team-icon { background: #eff6ff; color: #3b82f6; }
.install-icon { background: #f0fdf4; color: #22c55e; }
.comm-icon { background: #fff7ed; color: #f97316; }
.inv-icon { background: #fdf4ff; color: #d946ef; }
.engineer-icon { background: #fff7ed; color: #ea580c; }

.grid-label {
  font-size: 26rpx;
  color: #475569;
  font-weight: 600;
}

.promo-banner {
  margin: 0 32rpx 60rpx;
  background: linear-gradient(135deg, #111827 0%, #374151 100%);
  border-radius: 24rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 12rpx 24rpx rgba(17, 24, 39, 0.15);
}

.promo-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding-right: 20rpx;
}

.promo-title {
  font-size: 32rpx;
  font-weight: 800;
  color: #f3f4f6;
  margin-bottom: 8rpx;
}

.promo-desc {
  font-size: 22rpx;
  color: #9ca3af;
  line-height: 1.4;
}

.promo-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  padding: 12rpx 24rpx;
  border-radius: 30rpx;
  font-size: 24rpx;
  font-weight: bold;
  color: #fff;
  display: flex;
  align-items: center;
}

.promo-arrow {
  margin-left: 8rpx;
  font-weight: 900;
}

/* Popup Styles */
.popup-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.7);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.popup-content {
  background: #fff;
  width: 560rpx;
  border-radius: 40rpx;
  padding: 56rpx 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 24rpx 64rpx rgba(0, 0, 0, 0.2);
}

.popup-title {
  font-size: 36rpx;
  font-weight: 800;
  margin-bottom: 40rpx;
  color: #1e293b;
}

.qrcode {
  width: 380rpx;
  height: 380rpx;
  margin-bottom: 32rpx;
  padding: 16rpx;
  border: 2rpx solid #e2e8f0;
  border-radius: 20rpx;
}

.code-display {
  font-size: 56rpx;
  font-weight: 900;
  color: #4F46E5;
  letter-spacing: 6rpx;
  background: #eef2ff;
  padding: 20rpx 48rpx;
  border-radius: 24rpx;
  margin-bottom: 24rpx;
}

.invite-tip {
  font-size: 24rpx;
  color: #64748b;
  text-align: center;
  margin-bottom: 48rpx;
  line-height: 1.6;
}

.primary-btn, .secondary-btn {
  width: 100%;
  height: 96rpx;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}

.primary-btn {
  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
  color: #fff;
  border: none;
}

.secondary-btn {
  background: #f8fafc;
  color: #475569;
  border: 2rpx solid #cbd5e1;
}

.primary-btn::after, .secondary-btn::after {
  display: none;
}
</style>
