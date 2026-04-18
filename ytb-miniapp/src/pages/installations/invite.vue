<template>
  <view class="invite-page">
    <!-- 顶部渐变背景 -->
    <view class="header-bg"></view>

    <!-- 返回按钮 -->
    <view class="nav-back" @tap="goBack">
      <text class="back-icon">←</text>
    </view>

    <!-- 邀请卡片主体 -->
    <view class="invite-card">
      <view class="card-decoration"></view>

      <!-- 用户信息 -->
      <view class="user-section">
        <image
          v-if="userStore.avatar"
          class="user-avatar"
          :src="userStore.avatar"
          mode="aspectFill"
        />
        <view v-else class="user-avatar avatar-placeholder">
          <text class="avatar-text">{{ (userStore.nickname || '我').substring(0, 1) }}</text>
        </view>
        <view class="user-info">
          <text class="user-name">{{ userStore.nickname || '亿拓宝用户' }}</text>
          <text class="user-role">{{ userStore.roleText }}</text>
        </view>
      </view>

      <!-- 邀请说明 -->
      <view class="invite-title-box">
        <text class="invite-title">邀请好友预约安装净水器</text>
        <text class="invite-desc">好友扫码进入小程序预约安装，支付安装费后自动绑定推荐关系</text>
      </view>

      <!-- 小程序码区域 -->
      <view class="qrcode-section">
        <view class="qrcode-box">
          <image
            v-if="wxacodeImage"
            class="qrcode-image"
            :src="wxacodeImage"
            mode="aspectFit"
            @tap="previewQrcode"
            show-menu-by-longpress
          />
          <view v-else-if="qrcodeLoading" class="qrcode-loading">
            <view class="spinner"></view>
            <text class="loading-text">生成小程序码中...</text>
          </view>
          <view v-else class="qrcode-loading" @tap="fetchWxacode">
            <text class="loading-text">点击重新生成</text>
          </view>
        </view>
        <text class="qrcode-tip">长按识别小程序码 · 直接进入预约页面</text>
      </view>

      <!-- 邀请码 -->
      <view class="invite-code-section">
        <text class="code-label">我的邀请码</text>
        <view class="code-display">
          <text class="code-text">{{ inviteCode || '------' }}</text>
          <view class="copy-btn" @tap="copyInviteCode" hover-class="copy-hover">
            <text class="copy-text">复制</text>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="link-actions">
        <button class="action-btn save-btn" @tap="saveQrcode" hover-class="btn-hover">
          <text>保存图片</text>
        </button>
        <button class="action-btn share-btn" open-type="share" hover-class="btn-hover">
          <text>转发好友</text>
        </button>
      </view>
    </view>

    <!-- 邀请说明 -->
    <view class="rules-section">
      <text class="rules-title">邀请说明</text>
      <view class="rule-item">
        <text class="rule-num">1</text>
        <text class="rule-text">让好友长按上方小程序码识别进入</text>
      </view>
      <view class="rule-item">
        <text class="rule-num">2</text>
        <text class="rule-text">好友在小程序内填写预约安装信息</text>
      </view>
      <view class="rule-item">
        <text class="rule-num">3</text>
        <text class="rule-text">好友支付安装费后自动绑定推荐关系</text>
      </view>
      <view class="rule-item">
        <text class="rule-num">4</text>
        <text class="rule-text">安装完成后您将获得相应佣金奖励</text>
      </view>
    </view>

    <view class="bottom-spacer"></view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import { useUserStore } from '../../stores/user'
import { getInviteCode } from '../../api/ytb'

const userStore = useUserStore()
const inviteCode = ref('')
const wxacodeImage = ref('')
const qrcodeLoading = ref(false)

const userId = computed(() => userStore.userInfo?.id || '')

// 获取邀请码
const fetchInviteCode = async () => {
  try {
    const res = await getInviteCode()
    if (res && res.code === 0 && res.data?.invite_code) {
      inviteCode.value = res.data.invite_code
    }
  } catch (e) {
    console.error('获取邀请码失败:', e)
  }
}

// 获取小程序码
const fetchWxacode = async () => {
  qrcodeLoading.value = true
  try {
    const token = uni.getStorageSync('token') || ''
    const scene = `ref=${userId.value}`
    const res = await uni.request({
      url: `https://ytb.ddg.org.cn/api/ytb/miniapp/wxacode?scene=${encodeURIComponent(scene)}&page=pages/installations/booking`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` }
    })
    const data = res.data || res[1]?.data
    if (data && data.code === 0 && data.data?.image) {
      wxacodeImage.value = data.data.image
    } else {
      console.error('生成小程序码失败:', data)
      uni.showToast({ title: '生成小程序码失败', icon: 'none' })
    }
  } catch (e) {
    console.error('获取小程序码失败:', e)
    uni.showToast({ title: '网络错误', icon: 'none' })
  } finally {
    qrcodeLoading.value = false
  }
}

onLoad(() => {
  fetchInviteCode()
  fetchWxacode()
})

const goBack = () => {
  uni.navigateBack()
}

// 复制邀请码
const copyInviteCode = () => {
  if (!inviteCode.value) return
  uni.setClipboardData({
    data: inviteCode.value,
    success: () => {
      uni.showToast({ title: '邀请码已复制', icon: 'success' })
    }
  })
}

// 保存小程序码到相册
const saveQrcode = () => {
  if (!wxacodeImage.value) {
    return uni.showToast({ title: '小程序码未生成', icon: 'none' })
  }

  // base64 转临时文件再保存
  const base64Data = wxacodeImage.value.replace(/^data:image\/\w+;base64,/, '')
  const filePath = `${wx.env.USER_DATA_PATH}/invite_qrcode_${Date.now()}.png`

  const fs = uni.getFileSystemManager()
  fs.writeFile({
    filePath: filePath,
    data: base64Data,
    encoding: 'base64',
    success: () => {
      uni.saveImageToPhotosAlbum({
        filePath: filePath,
        success: () => {
          uni.showToast({ title: '已保存到相册', icon: 'success' })
        },
        fail: (err) => {
          if (err.errMsg?.includes('auth deny')) {
            uni.showModal({
              title: '提示',
              content: '需要您授权保存图片到相册',
              success: (res) => {
                if (res.confirm) uni.openSetting()
              }
            })
          }
        }
      })
    },
    fail: (err) => {
      console.error('写文件失败:', err)
      uni.showToast({ title: '保存失败', icon: 'none' })
    }
  })
}

// 预览小程序码
const previewQrcode = () => {
  if (!wxacodeImage.value) return
  // base64 先写入临时文件再预览
  const base64Data = wxacodeImage.value.replace(/^data:image\/\w+;base64,/, '')
  const filePath = `${wx.env.USER_DATA_PATH}/preview_qrcode_${Date.now()}.png`
  const fs = uni.getFileSystemManager()
  fs.writeFile({
    filePath,
    data: base64Data,
    encoding: 'base64',
    success: () => {
      uni.previewImage({ urls: [filePath], current: filePath })
    }
  })
}

// 微信转发
onShareAppMessage(() => {
  return {
    title: `${userStore.nickname || '好友'}邀请您预约安装净水器`,
    path: `/pages/installations/booking?referrer_id=${userId.value}`,
    imageUrl: ''
  }
})
</script>

<style scoped>
.invite-page {
  min-height: 100vh;
  background: #f0f0f5;
  position: relative;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 500rpx;
  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #A855F7 100%);
  border-radius: 0 0 80rpx 80rpx;
}

.nav-back {
  position: relative;
  z-index: 10;
  padding: 90rpx 30rpx 0;
  width: 60rpx;
}

.back-icon {
  font-size: 40rpx;
  color: #fff;
  font-weight: 700;
}

.invite-card {
  position: relative;
  z-index: 2;
  margin: 20rpx 30rpx 0;
  background: #ffffff;
  border-radius: 32rpx;
  padding: 40rpx;
  box-shadow: 0 20rpx 60rpx rgba(79, 70, 229, 0.12);
  overflow: hidden;
}

.card-decoration {
  position: absolute;
  top: -80rpx;
  right: -80rpx;
  width: 240rpx;
  height: 240rpx;
  background: radial-gradient(circle, rgba(79, 70, 229, 0.06) 0%, transparent 70%);
  border-radius: 50%;
}

.user-section {
  display: flex;
  align-items: center;
  margin-bottom: 32rpx;
}

.user-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  border: 4rpx solid #EEF2FF;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
}

.avatar-text {
  color: #fff;
  font-size: 36rpx;
  font-weight: 700;
}

.user-info { flex: 1; }

.user-name {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #1e1e2e;
}

.user-role {
  display: block;
  font-size: 24rpx;
  color: #6b7280;
  margin-top: 4rpx;
}

.invite-title-box {
  text-align: center;
  margin-bottom: 36rpx;
  padding: 24rpx;
  background: linear-gradient(135deg, #EEF2FF, #E0E7FF);
  border-radius: 20rpx;
}

.invite-title {
  display: block;
  font-size: 34rpx;
  font-weight: 800;
  color: #4F46E5;
  margin-bottom: 8rpx;
}

.invite-desc {
  display: block;
  font-size: 24rpx;
  color: #6366F1;
  line-height: 1.5;
}

.qrcode-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 36rpx;
}

.qrcode-box {
  width: 400rpx;
  height: 400rpx;
  background: #fff;
  border: 4rpx solid #E5E7EB;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.06);
}

.qrcode-image {
  width: 370rpx;
  height: 370rpx;
}

.qrcode-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
}

.spinner {
  width: 48rpx;
  height: 48rpx;
  border: 4rpx solid #E5E7EB;
  border-top-color: #4F46E5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #9CA3AF;
  font-size: 26rpx;
}

.qrcode-tip {
  font-size: 24rpx;
  color: #9CA3AF;
  margin-top: 16rpx;
}

.invite-code-section {
  margin-bottom: 28rpx;
}

.code-label {
  display: block;
  font-size: 26rpx;
  color: #6b7280;
  margin-bottom: 12rpx;
}

.code-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #F9FAFB;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  border: 2rpx solid #E5E7EB;
}

.code-text {
  font-size: 40rpx;
  font-weight: 800;
  color: #4F46E5;
  letter-spacing: 12rpx;
  font-family: monospace;
}

.copy-btn {
  background: #4F46E5;
  padding: 10rpx 28rpx;
  border-radius: 24rpx;
}

.copy-hover { opacity: 0.8; }

.copy-text {
  color: #fff;
  font-size: 24rpx;
  font-weight: 600;
}

.link-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 8rpx;
}

.action-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 600;
  border: none;
  margin: 0;
  padding: 0;
}

.action-btn::after { border: none; }

.save-btn {
  background: #EEF2FF;
  color: #4F46E5;
}

.share-btn {
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  color: #fff;
}

.btn-hover {
  opacity: 0.85;
  transform: scale(0.98);
}

.rules-section {
  margin: 30rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
}

.rules-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #1e1e2e;
  margin-bottom: 24rpx;
}

.rule-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.rule-item:last-child { margin-bottom: 0; }

.rule-num {
  width: 40rpx;
  height: 40rpx;
  line-height: 40rpx;
  text-align: center;
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  color: #fff;
  border-radius: 50%;
  font-size: 22rpx;
  font-weight: 700;
  flex-shrink: 0;
}

.rule-text {
  font-size: 26rpx;
  color: #4B5563;
  line-height: 40rpx;
}

.bottom-spacer { height: 60rpx; }
</style>
