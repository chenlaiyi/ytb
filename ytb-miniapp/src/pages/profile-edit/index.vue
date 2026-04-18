<template>
  <view class="profile-edit-page">
    <!-- 顶部提示 -->
    <view class="tip-banner" v-if="isFirstTime">
      <text class="tip-icon">🎉</text>
      <text class="tip-text">欢迎加入亿拓宝联盟！请完善您的个人资料</text>
    </view>

    <!-- 头像选择 -->
    <view class="section">
      <view class="section-title">头像</view>
      <view class="avatar-row">
        <button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
          <image
            class="avatar-preview"
            :src="form.avatar || '/static/images/default-avatar.png'"
            mode="aspectFill"
          />
          <view class="avatar-edit-badge">
            <text class="edit-icon">📷</text>
          </view>
        </button>
        <text class="avatar-tip">点击更换头像</text>
      </view>
    </view>

    <!-- 昵称 -->
    <view class="section">
      <view class="section-title">昵称</view>
      <view class="input-row">
        <input
          type="nickname"
          class="form-input"
          v-model="form.nickname"
          placeholder="请输入昵称"
          @blur="onNicknameBlur"
        />
      </view>
    </view>

    <!-- 真实姓名 -->
    <view class="section">
      <view class="section-title">真实姓名</view>
      <view class="input-row">
        <input
          class="form-input"
          v-model="form.real_name"
          placeholder="请输入真实姓名（用于佣金结算）"
        />
      </view>
    </view>

    <!-- 手机号 -->
    <view class="section">
      <view class="section-title">手机号</view>
      <view class="input-row" v-if="form.phone">
        <text class="phone-display">{{ formatPhone(form.phone) }}</text>
        <text class="phone-tag">已绑定</text>
      </view>
      <view class="input-row" v-else>
        <button class="phone-btn" open-type="getPhoneNumber" @getphonenumber="onGetPhone">
          <text class="phone-btn-icon">📱</text>
          <text>一键获取微信手机号</text>
        </button>
      </view>
    </view>

    <!-- 保存按钮 -->
    <view class="save-section">
      <button class="save-btn" :loading="saving" @tap="handleSave">
        {{ isFirstTime ? '完成并进入' : '保存修改' }}
      </button>
      <button class="skip-btn" v-if="isFirstTime" @tap="handleSkip">
        跳过，稍后完善
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { post } from '../../api/request'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()
const saving = ref(false)
const isFirstTime = ref(false)
const uploadingAvatar = ref(false)

const form = ref({
  avatar: '',
  nickname: '',
  real_name: '',
  phone: '',
})

// 预获取 session code（给手机号解密用）
const sessionCode = ref('')
const refreshSessionCode = () => {
  uni.login({
    provider: 'weixin',
    success: (res) => { sessionCode.value = res.code }
  })
}

onMounted(() => {
  refreshSessionCode()
})

onShow(() => {
  // 从 Pinia/Storage 加载现有资料
  const info = userStore.userInfo || {}
  form.value.avatar = info.avatar || ''
  form.value.nickname = info.nickname || ''
  form.value.real_name = info.real_name || ''
  form.value.phone = info.phone || ''

  // 判断是否首次（从登录跳来的）
  const pages = getCurrentPages()
  const curPage = pages[pages.length - 1]
  isFirstTime.value = curPage?.options?.from === 'login'
})

// 微信原生选择头像
const onChooseAvatar = (e) => {
  const tempUrl = e.detail.avatarUrl
  if (!tempUrl) return

  uploadingAvatar.value = true
  // 上传到后端（或直接用临时链接——微信临时链接7天有效，建议上传）
  // 此处简化：直接用微信给的临时 URL 存储
  // 正式环境建议上传到自有 OSS
  uni.uploadFile({
    url: 'https://ytb.ddg.org.cn/api/ytb/upload-avatar',
    filePath: tempUrl,
    name: 'file',
    header: {
      'Authorization': 'Bearer ' + uni.getStorageSync('token')
    },
    success: (res) => {
      try {
        const data = JSON.parse(res.data)
        if (data.code === 0 && data.data?.url) {
          form.value.avatar = data.data.url
        } else {
          // 上传失败，使用临时链接作为后备
          form.value.avatar = tempUrl
        }
      } catch {
        form.value.avatar = tempUrl
      }
    },
    fail: () => {
      // 上传服务不可用时，直接使用本地临时路径
      form.value.avatar = tempUrl
    },
    complete: () => {
      uploadingAvatar.value = false
    }
  })
}

const onNicknameBlur = (e) => {
  // type=nickname 的 input，微信会自动弹窗授权并填入用户的微信昵称
  if (e.detail?.value) {
    form.value.nickname = e.detail.value
  }
}

// 一键获取手机号
const onGetPhone = async (e) => {
  const errMsg = e.detail.errMsg || ''
  if (!errMsg.includes('ok')) return

  if (!sessionCode.value) {
    uni.showToast({ title: '请稍后重试', icon: 'none' })
    refreshSessionCode()
    return
  }

  uni.showLoading({ title: '获取中...', mask: true })
  try {
    const res = await post('/api/ytb/miniapp-phone-login', {
      code: sessionCode.value,
      encryptedData: e.detail.encryptedData,
      iv: e.detail.iv,
    })
    refreshSessionCode()
    uni.hideLoading()

    if (res.code === 0 && res.data?.user?.phone) {
      form.value.phone = res.data.user.phone
      // 同步更新 token
      if (res.data.token) {
        userStore.setToken(res.data.token)
      }
      if (res.data.user) {
        userStore.setUserInfo(res.data.user)
        // 从最新用户数据回填表单（比如手机号匹配到了存量号，昵称头像都有了）
        form.value.avatar = res.data.user.avatar || form.value.avatar
        form.value.nickname = res.data.user.nickname || form.value.nickname
        form.value.real_name = res.data.user.real_name || form.value.real_name
      }
      setTimeout(() => uni.showToast({ title: '手机号绑定成功', icon: 'success' }), 100)
    } else {
      setTimeout(() => uni.showToast({ title: res.message || '获取失败', icon: 'none' }), 100)
    }
  } catch (err) {
    refreshSessionCode()
    uni.hideLoading()
    setTimeout(() => uni.showToast({ title: '网络异常', icon: 'none' }), 100)
  }
}

const formatPhone = (phone) => {
  if (!phone || phone.length < 11) return phone
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

const handleSave = async () => {
  // 至少要有昵称
  if (!form.value.nickname?.trim()) {
    uni.showToast({ title: '请填写昵称', icon: 'none' })
    return
  }

  saving.value = true
  try {
    const payload = {}
    if (form.value.nickname) payload.nickname = form.value.nickname.trim()
    if (form.value.real_name) payload.real_name = form.value.real_name.trim()
    if (form.value.avatar) payload.avatar = form.value.avatar

    const res = await post('/api/ytb/user/update', payload)
    
    if (res.code === 0) {
      // 更新本地存储
      const info = { ...(userStore.userInfo || {}), ...payload }
      userStore.setUserInfo(info)
      
      uni.hideLoading()
      if (isFirstTime.value) {
        uni.switchTab({ url: '/pages/index/index' })
      } else {
        uni.navigateBack()
        setTimeout(() => uni.showToast({ title: '保存成功', icon: 'success' }), 300)
      }
    } else {
      uni.showToast({ title: res.message || '保存失败', icon: 'none' })
    }
  } catch (err) {
    console.error('保存失败:', err)
    uni.showToast({ title: '网络异常', icon: 'none' })
  } finally {
    saving.value = false
  }
}

const handleSkip = () => {
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<style scoped>
.profile-edit-page {
  min-height: 100vh;
  background: #f5f5f7;
  padding-bottom: 40rpx;
}

.tip-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 32rpx 40rpx;
  display: flex;
  align-items: center;
}

.tip-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}

.tip-text {
  font-size: 28rpx;
  color: #fff;
  font-weight: 500;
}

.section {
  margin: 24rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
}

.section-title {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 20rpx;
  font-weight: 500;
}

.avatar-row {
  display: flex;
  align-items: center;
}

.avatar-btn {
  position: relative;
  width: 140rpx;
  height: 140rpx;
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  line-height: normal;
}

.avatar-btn::after {
  display: none;
}

.avatar-preview {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  border: 4rpx solid #e5e7eb;
}

.avatar-edit-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 44rpx;
  height: 44rpx;
  background: #4F46E5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3rpx solid #fff;
}

.edit-icon {
  font-size: 24rpx;
}

.avatar-tip {
  margin-left: 28rpx;
  font-size: 26rpx;
  color: #999;
}

.input-row {
  display: flex;
  align-items: center;
}

.form-input {
  flex: 1;
  height: 80rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  color: #333;
}

.phone-display {
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
  letter-spacing: 2rpx;
}

.phone-tag {
  margin-left: 16rpx;
  font-size: 22rpx;
  color: #07c160;
  background: rgba(7, 193, 96, 0.1);
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.phone-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 80rpx;
  background: #f0f9eb;
  border: 2rpx solid #e1f3d8;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #07c160;
  font-weight: 500;
  padding: 0;
  margin: 0;
}

.phone-btn::after {
  display: none;
}

.phone-btn-icon {
  margin-right: 12rpx;
  font-size: 32rpx;
}

.save-section {
  margin: 48rpx 24rpx 24rpx;
}

.save-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 48rpx;
  border: none;
  line-height: 96rpx;
}

.save-btn::after {
  display: none;
}

.save-btn:active {
  opacity: 0.9;
  transform: scale(0.98);
}

.skip-btn {
  width: 100%;
  height: 80rpx;
  background: transparent;
  color: #999;
  font-size: 28rpx;
  border: none;
  margin-top: 16rpx;
  line-height: 80rpx;
}

.skip-btn::after {
  display: none;
}
</style>
