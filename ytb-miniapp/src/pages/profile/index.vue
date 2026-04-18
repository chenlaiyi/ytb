<template>
  <view class="profile-page">
    <!-- 用户卡片 -->
    <view class="user-card">
      <view class="card-content">
        <image
          class="avatar"
          :src="userStore.avatar || '/static/images/default-avatar.png'"
          mode="aspectFill"
        />
        <view class="user-detail">
          <view class="name-row">
            <text class="nickname">{{ userStore.nickname || '未设置昵称' }}</text>
            <view class="edit-btn" @tap="goEditProfile">
              <text class="edit-text">编辑资料</text>
            </view>
          </view>
          <text class="phone" v-if="userStore.phone">{{ formatPhone(userStore.phone) }}</text>
          <text class="phone" v-else>未绑定手机号</text>
          <view class="role-row">
            <view class="role-badge">
              <text>{{ userStore.roleText }}</text>
            </view>
            <text class="real-name" v-if="userInfo.real_name">{{ userInfo.real_name }}</text>
          </view>
        </view>
      </view>
      <!-- 💡 资料完善提示 -->
      <view class="complete-tip" v-if="showCompleteTip" @tap="goEditProfile">
        <text class="tip-icon">💡</text>
        <text class="tip-text">资料不完整，点击完善可获得更好体验</text>
        <text class="tip-arrow">›</text>
      </view>
    </view>

    <!-- 数据统计卡片 -->
    <view class="stats-card">
      <view class="stat-item" @tap="navigateTo('/pages/commission/index')">
        <text class="stat-value">{{ formatMoney(userInfo.available_balance) }}</text>
        <text class="stat-label">可提现(元)</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item" @tap="navigateTo('/pages/team/index')">
        <text class="stat-value">{{ userInfo.direct_count || 0 }}</text>
        <text class="stat-label">直推人数</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item" @tap="navigateTo('/pages/team/index')">
        <text class="stat-value">{{ userInfo.team_count || 0 }}</text>
        <text class="stat-label">团队人数</text>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-group-title">财务与资产</view>
      <view class="menu-item" @tap="navigateTo('/pages/commission/index')">
        <view class="menu-left">
          <view class="menu-icon-box" style="background: #fff3e0;">
            <text class="menu-icon">💰</text>
          </view>
          <text class="menu-label">分佣存折</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @tap="navigateTo('/pages/withdraw-records/index')">
        <view class="menu-left">
          <view class="menu-icon-box" style="background: #e3f2fd;">
            <text class="menu-icon">💳</text>
          </view>
          <text class="menu-label">提现记录</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <view class="menu-section" v-if="userInfo.is_engineer">
      <view class="menu-group-title">工程师专区</view>
      <view class="menu-item" @tap="navigateTo('/pages/engineer/index')">
        <view class="menu-left">
          <view class="menu-icon-box" style="background: #fff7ed;">
            <text class="menu-icon">🛠️</text>
          </view>
          <text class="menu-label">工程师工作台</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @tap="navigateTo('/pages/installations/records')">
        <view class="menu-left">
          <view class="menu-icon-box" style="background: #f0fdf4;">
            <text class="menu-icon">📋</text>
          </view>
          <text class="menu-label">安装记录</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <view class="menu-section">
      <view class="menu-group-title">工具与设置</view>
      <view class="menu-item" @tap="navigateTo('/pages/upgrade/index')" v-if="userInfo.role !== 'boss_cp'">
        <view class="menu-left">
          <view class="menu-icon-box" style="background: #ede7f6;">
            <text class="menu-icon">⭐</text>
          </view>
          <text class="menu-label">升级中心</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @tap="navigateTo('/pages/poster/index')">
        <view class="menu-left">
          <view class="menu-icon-box" style="background: #e0f7fa;">
            <text class="menu-icon">📋</text>
          </view>
          <text class="menu-label">推广海报</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @tap="goEditProfile">
        <view class="menu-left">
          <view class="menu-icon-box" style="background: #f3e5f5;">
            <text class="menu-icon">⚙️</text>
          </view>
          <text class="menu-label">个人资料设置</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-section">
      <button class="logout-btn" @tap="handleLogout">退出当前账号</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../stores/user'
import { getUserInfo } from '../../api/ytb'

const userStore = useUserStore()
const userInfo = ref({})

// 检测资料完善度
const showCompleteTip = computed(() => {
  const u = userStore.userInfo || {}
  return !u.avatar || 
    !u.nickname || 
    u.nickname === '微信用户' || 
    (u.nickname && u.nickname.startsWith('用户')) ||
    !u.real_name
})

onShow(() => {
  loadUserInfo()
})

const loadUserInfo = async () => {
  try {
    const res = await getUserInfo()
    if (res.code === 0 && res.data) {
      userInfo.value = res.data
      userStore.setUserInfo(res.data)
    }
  } catch (e) {
    console.error('获取用户信息失败:', e)
    userInfo.value = userStore.userInfo || {}
  }
}

const formatPhone = (phone) => {
  if (!phone || phone.length < 11) return phone
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

const formatMoney = (val) => {
  const num = parseFloat(val || 0)
  return num.toFixed(2)
}

const navigateTo = (url) => {
  uni.navigateTo({ url })
}

const goEditProfile = () => {
  uni.navigateTo({ url: '/pages/profile-edit/index' })
}

const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
      }
    }
  })
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f5f5f7;
  padding-bottom: env(safe-area-inset-bottom);
}

.user-card {
  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
  padding-top: calc(env(safe-area-inset-top) + 20rpx);
  border-radius: 0 0 32rpx 32rpx;
  overflow: hidden;
}

.card-content {
  display: flex;
  align-items: center;
  padding: 32rpx 40rpx 28rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.4);
  margin-right: 28rpx;
  flex-shrink: 0;
}

.user-detail {
  flex: 1;
  overflow: hidden;
}

.name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.nickname {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.edit-btn {
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.2);
  padding: 6rpx 20rpx;
  border-radius: 24rpx;
  margin-left: 16rpx;
}

.edit-text {
  font-size: 22rpx;
  color: #fff;
}

.phone {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.7);
  display: block;
  margin-bottom: 8rpx;
}

.role-row {
  display: flex;
  align-items: center;
}

.role-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  padding: 4rpx 20rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  color: #fff;
  margin-right: 16rpx;
}

.real-name {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

.complete-tip {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.15);
  padding: 20rpx 40rpx;
  margin-top: 4rpx;
}

.tip-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.tip-text {
  flex: 1;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
}

.tip-arrow {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.6);
}

/* 统计卡片 */
.stats-card {
  display: flex;
  align-items: center;
  margin: -20rpx 24rpx 0;
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx 0;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 2;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 22rpx;
  color: #999;
}

.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background: #e5e7eb;
}

/* 菜单 */
.menu-section {
  margin: 24rpx;
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.menu-group-title {
  font-size: 24rpx;
  color: #999;
  padding: 24rpx 24rpx 8rpx;
  font-weight: 500;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
}

.menu-left {
  display: flex;
  align-items: center;
}

.menu-icon-box {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.menu-icon {
  font-size: 32rpx;
}

.menu-label {
  font-size: 30rpx;
  color: #333;
}

.menu-arrow {
  font-size: 32rpx;
  color: #ccc;
}

.logout-section {
  padding: 24rpx 24rpx 40rpx;
}

.logout-btn {
  width: 100%;
  height: 88rpx;
  background: #fff;
  color: #ff4d4f;
  font-size: 30rpx;
  border-radius: 44rpx;
  border: 2rpx solid #ff4d4f;
  line-height: 88rpx;
}

.logout-btn::after {
  display: none;
}
</style>
