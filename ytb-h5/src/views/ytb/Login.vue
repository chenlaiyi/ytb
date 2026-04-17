<template>
  <div class="ytb-login">
    <!-- 顶部背景 -->
    <div class="header-bg">
      <div class="logo-container">
        <img v-if="logoUrl" :src="logoUrl" alt="亿拓宝" class="logo" @error="handleLogoError" />
        <div v-else class="logo-placeholder">YTB</div>
        <h1 class="title">亿拓宝联盟</h1>
        <p class="subtitle">
          <span class="typing-text">{{ displayText }}</span>
          <span class="cursor">|</span>
        </p>
      </div>
    </div>

    <!-- 登录卡片 -->
    <div class="login-card">
      <!-- 邀请码输入（可选） -->
      <div class="invite-section" v-if="showInviteInput">
        <div class="section-title">
          <span>输入邀请码（可选）</span>
          <span class="skip-btn" @click="showInviteInput = false">跳过</span>
        </div>
        <van-field
          v-model="inviteCode"
          placeholder="请输入6位邀请码"
          maxlength="6"
          type="digit"
          :error-message="inviteError"
          @blur="validateInviteCodeInput"
        >
          <template #button>
            <van-button 
              size="small" 
              type="primary" 
              :loading="validating"
              @click="validateInviteCodeInput"
            >
              验证
            </van-button>
          </template>
        </van-field>
        
        <!-- 邀请人信息 -->
        <div class="inviter-info" v-if="inviter">
          <van-icon name="checked" color="#07c160" />
          <span>邀请人：{{ inviter.nickname || '未知' }}（{{ inviter.role_name }}）</span>
        </div>
      </div>

      <!-- 微信登录按钮 -->
      <van-button 
        type="success" 
        block 
        round 
        size="large"
        :loading="loading"
        @click="handleWechatLogin"
        class="wechat-btn"
      >
        <van-icon name="wechat" />
        <span>微信授权登录</span>
      </van-button>

      <!-- 协议 -->
      <div class="agreement">
        <van-checkbox v-model="agreed" icon-size="16px">
          <span class="agreement-text">
            我已阅读并同意
            <a href="javascript:;" @click="showAgreement('user')">《用户协议》</a>
            和
            <a href="javascript:;" @click="showAgreement('privacy')">《隐私政策》</a>
          </span>
        </van-checkbox>
      </div>
    </div>

    <!-- 底部说明 -->
    <div class="footer">
      <p>加入亿拓宝联盟，开启您的创业之旅</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { getWechatLoginUrl, validateInviteCode as validateInviteCodeApi, isLoggedIn } from '@/api/ytb'
import { useYtbShare } from '@/composables/useYtbShare'

// 设置亿拓宝分享配置
useYtbShare('亿拓宝联盟')

const route = useRoute()
const router = useRouter()

const normalizeWechatAuthUrl = (url) => {
  if (!url) return ''

  let normalized = String(url).trim()

  // 先统一替换所有明文scope值
  normalized = normalized.replace(/snsapi_userinfo/gi, 'snsapi_base')

  // 再强制scope参数为base，避免被其他参数拼接污染
  normalized = normalized.replace(/([?&])scope=[^&#]*/i, '$1scope=snsapi_base')

  // 兼容被encode后的scope参数
  normalized = normalized.replace(/scope%3D[^%#&]*/i, 'scope%3Dsnsapi_base')

  return normalized
}

// 状态
const loading = ref(false)
const validating = ref(false)
const agreed = ref(false)
const showInviteInput = ref(true)
const inviteCode = ref('')
const inviteError = ref('')
const inviter = ref(null)
// 亿拓宝公众号logo (使用HTTPS)
const logoUrl = ref('https://wx.qlogo.cn/mmopen/PiajxSqBRaEKwO9tEjCgLvIPqa96gV5bP2LoUpFvOiajAvicTO9OgibZ2sLzxP37UxktxFKw03JNTiaHh05EWmKT1MqPRH92MbCumtH0goy3Vh5TI0hu4P8BelkXuxvtINHjG/0')

// 打字机动画
const fullText = '极度真诚 • 极致服务'
const displayText = ref('')
let typingTimer = null
let isTyping = true
let charIndex = 0

const startTypingAnimation = () => {
  const typeSpeed = 150 // 打字速度
  const deleteSpeed = 100 // 删除速度
  const pauseTime = 2000 // 完成后暂停时间
  
  const animate = () => {
    if (isTyping) {
      // 逐字输出
      if (charIndex < fullText.length) {
        displayText.value = fullText.substring(0, charIndex + 1)
        charIndex++
        typingTimer = setTimeout(animate, typeSpeed)
      } else {
        // 输出完成，暂停后开始删除
        isTyping = false
        typingTimer = setTimeout(animate, pauseTime)
      }
    } else {
      // 逐字删除
      if (charIndex > 0) {
        charIndex--
        displayText.value = fullText.substring(0, charIndex)
        typingTimer = setTimeout(animate, deleteSpeed)
      } else {
        // 删除完成，暂停后重新开始
        isTyping = true
        typingTimer = setTimeout(animate, 500)
      }
    }
  }
  
  animate()
}

// 初始化
onMounted(() => {
  // 启动打字机动画
  startTypingAnimation()

  const code = route.query.invite_code

  // 如果已登录，优先跳转到注册页（带邀请码）
  if (isLoggedIn()) {
    if (code) {
      router.replace({ path: '/register', query: { invite_code: code } })
    } else {
      router.replace('/home')
    }
    return
  }

  // 检查URL中是否有邀请码
  if (code) {
    inviteCode.value = code
    validateInviteCodeInput()
  }
})

// 验证邀请码
const validateInviteCodeInput = async () => {
  if (!inviteCode.value || inviteCode.value.length !== 6) {
    inviteError.value = '请输入6位邀请码'
    inviter.value = null
    return
  }

  validating.value = true
  inviteError.value = ''

  try {
    const res = await validateInviteCodeApi(inviteCode.value)
    if (res.code === 0) {
      inviter.value = res.data.inviter
      inviteError.value = ''
      // 保存邀请码到本地
      localStorage.setItem('ytb_invite_code', inviteCode.value)
    } else {
      inviteError.value = res.message || '邀请码无效'
      inviter.value = null
    }
  } catch (error) {
    inviteError.value = '验证失败，请重试'
    inviter.value = null
  } finally {
    validating.value = false
  }
}

// 微信登录
const handleWechatLogin = async () => {
  if (!agreed.value) {
    showToast('请先同意用户协议和隐私政策')
    return
  }

  loading.value = true

  try {
    // 如果带邀请码但未验证，先验证
    if (inviteCode.value && !inviter.value) {
      await validateInviteCodeInput()
      if (inviteError.value) {
        showToast(inviteError.value)
        return
      }
    }

    // 保存邀请码（如果有）
    if (inviteCode.value && inviter.value) {
      localStorage.setItem('ytb_invite_code', inviteCode.value)
    }

    const redirectUrl = inviteCode.value
      ? `/register?invite_code=${inviteCode.value}`
      : '/devices'
    const res = await getWechatLoginUrl(redirectUrl)
    const rawAuthUrl = res?.data?.url || ''
    const authUrl = normalizeWechatAuthUrl(rawAuthUrl)

    if (res?.code === 0 && authUrl) {
      window.__ytb_last_auth_url_raw = rawAuthUrl
      window.__ytb_last_auth_url = authUrl
      localStorage.setItem('ytb_last_auth_url_raw', String(rawAuthUrl))
      localStorage.setItem('ytb_last_auth_url', String(authUrl))
      console.info('[YTB_AUTH_URL]', authUrl)
      // 跳转到微信授权页面
      window.location.href = authUrl
    } else {
      showToast(res.message || '获取登录链接失败')
    }
  } catch (error) {
    showToast('网络错误，请重试')
  } finally {
    loading.value = false
  }
}

// 显示协议
const showAgreement = (type) => {
  const title = type === 'user' ? '用户协议' : '隐私政策'
  showDialog({
    title,
    message: type === 'user' 
      ? '亿拓宝用户协议内容...'
      : '亿拓宝隐私政策内容...',
    confirmButtonText: '我知道了'
  })
}

// Logo加载失败时显示占位符
const handleLogoError = () => {
  logoUrl.value = ''
}

// 清理定时器
onUnmounted(() => {
  if (typingTimer) {
    clearTimeout(typingTimer)
  }
})
</script>

<style scoped>
.ytb-login {
  min-height: 100vh;
  background: #f5f5f5;
}

.header-bg {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60px 20px 80px;
  text-align: center;
}

.logo-container {
  color: white;
}

.logo {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  margin: 0 auto 12px;
  object-fit: cover;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.9);
}

.logo-placeholder {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  margin: 0 auto 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.title {
  font-size: 28px;
  font-weight: bold;
  margin: 0 0 8px;
}

.subtitle {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
  min-height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.typing-text {
  display: inline-block;
}

.cursor {
  display: inline-block;
  margin-left: 2px;
  animation: blink 0.8s infinite;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

.login-card {
  background: white;
  margin: -40px 16px 20px;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.invite-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  color: #333;
}

.skip-btn {
  color: #999;
  font-size: 12px;
}

.inviter-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 12px;
  background: #f0fff4;
  border-radius: 8px;
  font-size: 14px;
  color: #07c160;
}

.wechat-btn {
  height: 48px;
  font-size: 16px;
}

.wechat-btn .van-icon {
  margin-right: 8px;
  font-size: 20px;
}

.agreement {
  margin-top: 20px;
  text-align: center;
}

.agreement-text {
  font-size: 12px;
  color: #666;
}

.agreement-text a {
  color: #667eea;
  text-decoration: none;
}

.footer {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 12px;
}

.footer p {
  margin: 4px 0;
}

</style>
