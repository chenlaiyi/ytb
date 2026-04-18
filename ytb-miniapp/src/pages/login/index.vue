<template>
  <view class="ytb-login">
    <!-- 顶部信息区 -->
    <view class="header-bg">
      <view class="logo-container">
        <image class="logo" :src="logoUrl" mode="aspectFill" @error="handleLogoError" />
        <text class="title">亿拓宝联盟</text>
        <view class="subtitle">
          <text class="typing-text">{{ displayText }}</text>
          <text class="cursor">|</text>
        </view>
      </view>
    </view>

    <!-- 登录交互卡片 -->
    <view class="login-card">
      <text class="card-title">欢迎回来</text>
      <text class="card-desc">请授权微信或手机号完成登录</text>
      
      <!-- 微信快捷登录 (优先推荐) -->
      <button class="wx-login-btn primary-btn" open-type="getPhoneNumber" @getphonenumber="onGetPhone">
        <text class="btn-icon-text">📱</text>
        <text>一键获取手机号登录</text>
      </button>

      <!-- 微信授权码登录 (备用方案) -->
      <button class="code-login-btn secondary-btn" @click="wxCodeLogin">
        <text class="btn-icon-text">💬</text>
        <text>微信授权登录</text>
      </button>

      <!-- 协议区 -->
      <view class="agreement">
        <view class="checkbox-box" @tap="agreed = !agreed">
          <view :class="['custom-checkbox', agreed ? 'checked' : '']">
            <text v-if="agreed" class="check-mark">✓</text>
          </view>
        </view>
        <view class="agreement-text">
          <text class="text-gray">我已阅读并同意</text>
          <text class="link">《用户协议》</text>
          <text class="text-gray">和</text>
          <text class="link">《隐私政策》</text>
        </view>
      </view>
    </view>

    <!-- 底部标识 -->
    <view class="footer">
      <text class="footer-text">加入亿拓宝联盟，开启您的创业之旅</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { post } from '../../api/request'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()
const agreed = ref(false)
const logoUrl = ref('https://wx.qlogo.cn/mmopen/PiajxSqBRaEKwO9tEjCgLvIPqa96gV5bP2LoUpFvOiajAvicTO9OgibZ2sLzxP37UxktxFKw03JNTiaHh05EWmKT1MqPRH92MbCumtH0goy3Vh5TI0hu4P8BelkXuxvtINHjG/0')

const handleLogoError = () => {
  logoUrl.value = '/static/images/logo.png'
}

// 已登录时自动跳转首页
onShow(() => {
  const token = uni.getStorageSync('token')
  if (token) {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      uni.navigateBack({ delta: 1 })
    } else {
      uni.switchTab({ url: '/pages/index/index' })
    }
  }
})

// 打字机动画
const fullText = '极度真诚 • 极致服务'
const displayText = ref('')
let typingTimer = null
let isTyping = true
let charIndex = 0

const startTypingAnimation = () => {
  const typeSpeed = 200
  const deleteSpeed = 100
  const pauseTime = 2500
  
  const animate = () => {
    if (isTyping) {
      if (charIndex < fullText.length) {
        displayText.value = fullText.substring(0, charIndex + 1)
        charIndex++
        typingTimer = setTimeout(animate, typeSpeed)
      } else {
        isTyping = false
        typingTimer = setTimeout(animate, pauseTime)
      }
    } else {
      if (charIndex > 0) {
        charIndex--
        displayText.value = fullText.substring(0, charIndex)
        typingTimer = setTimeout(animate, deleteSpeed)
      } else {
        isTyping = true
        typingTimer = setTimeout(animate, 800)
      }
    }
  }
  animate()
}

// 预先获取登录 code 防止 session_key 与 getPhoneNumber 错位
const sessionCode = ref('')
const refreshSessionCode = () => {
  uni.login({
    provider: 'weixin',
    success: (res) => {
      sessionCode.value = res.code
    }
  })
}

onMounted(() => {
  startTypingAnimation()
  refreshSessionCode()
})

onUnmounted(() => {
  if (typingTimer) clearTimeout(typingTimer)
})

// 验证协议
const checkAgreement = () => {
  if (!agreed.value) {
    uni.showToast({ title: '请先勾选协议', icon: 'none', duration: 2000 })
    return false
  }
  return true
}

// 登录成功后的统一处理
const handleLoginSuccess = (token, user) => {
  userStore.setToken(token)
  if (user) {
    userStore.setUserInfo(user)
  }
  
  // 检查资料完整度：缺少头像、昵称或真实姓名时引导完善
  const needComplete = !user?.avatar || 
    !user?.nickname || 
    user?.nickname === '微信用户' || 
    user?.nickname?.startsWith('用户') ||
    !user?.real_name
  
  if (needComplete) {
    // 跳转到资料完善页
    uni.redirectTo({ url: '/pages/profile-edit/index?from=login' })
  } else {
    // 资料完整，直接进首页
    const pages = getCurrentPages()
    if (pages.length > 1) {
      uni.navigateBack({ delta: 1 })
    } else {
      uni.switchTab({ url: '/pages/index/index' })
    }
  }
}

// 微信授权码静默登录
const wxCodeLogin = async () => {
  if (!checkAgreement()) return
  
  uni.showLoading({ title: '极速登录中...', mask: true })
  try {
    const loginRes = await new Promise((resolve, reject) => {
      uni.login({ provider: 'weixin', success: resolve, fail: reject })
    })

    const res = await post('/api/ytb/miniapp-login', { code: loginRes.code })
    uni.hideLoading()
    
    if (res.code === 0 && res.data?.token) {
      handleLoginSuccess(res.data.token, res.data.user)
    } else {
      setTimeout(() => uni.showToast({ title: res.message || '登录失败', icon: 'none' }), 100)
    }
  } catch (e) {
    console.error('wxCodeLogin err:', e)
    uni.hideLoading()
    setTimeout(() => uni.showToast({ title: '登录异常', icon: 'none' }), 100)
  }
} // ⬅️ fixed syntax

// 手机号快捷登录
const onGetPhone = async (e) => {
  if (!checkAgreement()) return
  
  const errMsg = e.detail.errMsg || ''
  if (errMsg && !errMsg.includes('ok')) {
    console.log('获取手机号取消:', errMsg)
    return
  }

  if (!sessionCode.value) {
    uni.showToast({ title: '安全守卫未就绪，请重试', icon: 'none' })
    refreshSessionCode()
    return
  }

  uni.showLoading({ title: '极速登录中...', mask: true })
  try {
    const res = await post('/api/ytb/miniapp-phone-login', {
      code: sessionCode.value,
      encryptedData: e.detail.encryptedData,
      iv: e.detail.iv,
    })
    
    // 用完立刻刷新确保下一个操作合法
    refreshSessionCode()
    uni.hideLoading()
    
    if (res.code === 0 && res.data?.token) {
      handleLoginSuccess(res.data.token, res.data.user)
    } else {
      setTimeout(() => uni.showToast({ title: res.message || '登录失败', icon: 'none' }), 100)
    }
  } catch (e) {
    console.error('onGetPhone err:', e)
    refreshSessionCode()
    uni.hideLoading()
    setTimeout(() => uni.showToast({ title: '网络异常', icon: 'none' }), 100)
  }
}
</script>

<style scoped>
.ytb-login {
  position: relative;
  min-height: 100vh;
  background-color: #f7f8fa;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 顶部信息 - 亮色纯净风格 */
.header-bg {
  z-index: 1;
  width: 100%;
  padding-top: 15vh;
  margin-bottom: 6vh;
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo {
  width: 160rpx;
  height: 160rpx;
  border-radius: 32rpx;
  box-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.08);
  margin-bottom: 40rpx;
}

.title {
  font-size: 52rpx;
  font-weight: 800;
  color: #333;
  letter-spacing: 2rpx;
  margin-bottom: 16rpx;
}

.subtitle {
  display: flex;
  align-items: center;
  height: 48rpx;
}

.typing-text {
  font-size: 28rpx;
  color: #666;
  font-weight: 400;
  letter-spacing: 4rpx;
}

.cursor {
  font-size: 32rpx;
  color: #4f46e5;
  margin-left: 8rpx;
  animation: blink 1s step-end infinite;
}

@keyframes blink { 50% { opacity: 0; } }

/* 登录交互卡片 - 白色卡片风格 */
.login-card {
  z-index: 1;
  width: 650rpx;
  background: #ffffff;
  border-radius: 32rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.card-title {
  font-size: 38rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 12rpx;
  text-align: center;
}

.card-desc {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 50rpx;
  text-align: center;
}

/* 按钮通用与特效 */
.wx-login-btn, .code-login-btn {
  width: 100%;
  height: 96rpx;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 30rpx;
  transition: all 0.3s;
  border: none;
}

.wx-login-btn::after, .code-login-btn::after {
  display: none;
}

.wx-login-btn:active, .code-login-btn:active {
  transform: scale(0.96);
  opacity: 0.9;
}

.primary-btn {
  background: #07c160;
  color: #fff;
  box-shadow: 0 12rpx 24rpx rgba(7, 193, 96, 0.2);
}

.secondary-btn {
  background: #f8f9fa;
  color: #333;
  border: 2rpx solid #e1e4e8;
}

.btn-icon {
  width: 44rpx;
  height: 44rpx;
  margin-right: 16rpx;
}

.btn-icon-text {
  font-size: 36rpx;
  margin-right: 12rpx;
}

/* 协议区 */
.agreement {
  display: flex;
  align-items: flex-start;
  margin-top: 10rpx;
}

.checkbox-box {
  padding: 6rpx 12rpx 12rpx 0;
}

.custom-checkbox {
  width: 30rpx;
  height: 30rpx;
  border-radius: 8rpx;
  border: 2rpx solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: #fff;
}

.custom-checkbox.checked {
  background: #07c160;
  border-color: #07c160;
}

.check-mark {
  color: #fff;
  font-size: 22rpx;
  font-weight: bold;
}

.agreement-text {
  flex: 1;
  font-size: 24rpx;
  line-height: 1.6;
}

.text-gray {
  color: #999;
}

.link {
  color: #4f46e5;
  display: inline-block;
  padding: 0 4rpx;
}

/* 底部标语 */
.footer {
  position: absolute;
  bottom: 80rpx;
  width: 100%;
  text-align: center;
  z-index: 1;
}

.footer-text {
  font-size: 24rpx;
  color: #bbb;
  letter-spacing: 2rpx;
}
</style>
