<template>
  <div class="login-container">
    <!-- 移除顶部导航条，界面更简洁 -->

    <div class="login-content">
      <div class="login-header">
        <img src="/images/logo.png" alt="点点够Logo" class="login-logo" />
        <h2 class="login-title">点点够</h2>
        <p class="login-subtitle">每天进步一点点，实现富而喜悦人生！</p>
      </div>

      <!-- 微信登录入口 - 突出显示 -->
      <div class="wechat-login-btn" @click="handleWechatLogin">
        <Icon name="wechat" size="20" />
        <span>微信一键登录</span>
      </div>

      <!-- 其他登录方式折叠区域 -->
      <div class="other-login-toggle" @click="toggleOtherLogin">
        <span>其他登录方式</span>
        <Icon :name="showOtherLogin ? 'arrow-up' : 'arrow-down'" />
      </div>

      <!-- 折叠的登录表单区域 -->
      <div v-show="showOtherLogin" class="collapsible-content">
        <!-- 登录方式切换 -->
        <div class="login-tabs">
          <div
            class="login-tab"
            :class="{ active: loginType === 'password' }"
            @click="loginType = 'password'"
          >
            密码登录
          </div>
          <div
            class="login-tab"
            :class="{ active: loginType === 'sms' }"
            @click="loginType = 'sms'"
          >
            短信登录
          </div>
        </div>

        <!-- 密码登录表单 -->
        <van-form @submit="onSubmit" v-if="loginType === 'password'">
          <Field
            v-model="loginForm.username"
            name="username"
            placeholder="请输入手机号"
            :rules="[{ required: true, message: '请输入手机号' }, { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }]"
          >
            <template #left-icon>
              <Icon name="phone-o" />
            </template>
          </Field>
          <Field
            v-model="loginForm.password"
            type="password"
            name="password"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请输入密码' }]"
          >
            <template #left-icon>
              <Icon name="lock" />
            </template>
          </Field>

          <div class="login-options">
            <Checkbox v-model="loginForm.remember">记住账号</Checkbox>
            <span class="forgot-password" @click="handleForgotPassword">忘记密码?</span>
          </div>

          <div style="margin: 24px 16px;">
            <Button round block type="primary" native-type="submit" :loading="loading">
              登录
            </Button>
          </div>
        </van-form>

        <!-- 短信登录表单 -->
        <van-form @submit="onSmsSubmit" v-else>
          <Field
            v-model="smsForm.phone"
            name="phone"
            placeholder="请输入手机号"
            :rules="[{ required: true, message: '请输入手机号' }, { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }]"
          >
            <template #left-icon>
              <Icon name="phone-o" />
            </template>
          </Field>
          <Field
            v-model="smsForm.code"
            name="code"
            placeholder="请输入验证码"
            :rules="[{ required: true, message: '请输入验证码' }]"
          >
            <template #left-icon>
              <Icon name="comment-o" />
            </template>
            <template #button>
              <Button
                size="small"
                type="primary"
                :disabled="!!smsTimer"
                @click="handleSendSms"
              >
                {{ smsTimer ? `${smsTimer}s` : '获取验证码' }}
              </Button>
            </template>
          </Field>

          <div style="margin: 24px 16px;">
            <Button round block type="primary" native-type="submit" :loading="loading">
              登录
            </Button>
          </div>
        </van-form>

        <div class="register-link">
          <span>还没有账号?</span>
          <span class="link" @click="$router.push('/register')">立即注册</span>
        </div>
      </div>

      <div class="login-policy">
        <Checkbox v-model="agreePolicy" icon-size="16px" checked-color="#1989fa">
          <span class="policy-text">我已阅读并同意</span>
        </Checkbox>
        <span class="policy-link" role="button" @click.stop="openAgreement">《用户协议》</span>和
        <span class="policy-link" role="button" @click.stop="openPrivacy">《隐私政策》</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Field, Button, Checkbox, Icon, Form, Dialog } from 'vant'
import { login, loginBySms, sendSmsCode } from '@/api/user'
import { useUserStore } from '@/stores/user'
import Toast from '@/utils/toast'
import authManager from '@/utils/auth-optimized'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const loading = ref(false)
const loginType = ref('password')
const smsTimer = ref(0)
const showOtherLogin = ref(false)  // 默认折叠其他登录方式
const agreePolicy = ref(false)  // 隐私政策同意状态
let timer = null

const openAgreement = () => {
  router.push('/user/settings/agreement')
}

const openPrivacy = () => {
  router.push('/user/settings/privacy-policy')
}

// 登录预检查
const checkLoginStatus = () => {
  const checkResult = authManager.preLoginCheck()
  if (!checkResult.success) {
    if (checkResult.redirect) {
      router.push(checkResult.redirect)
    } else {
      Toast({ type: 'fail', message: checkResult.message })
    }
    return false
  }
  return true
}

// 获取重定向地址
const redirect = route.query.redirect || ''

const shouldBypassAutoRedirect = computed(() => {
  if (route.query.simulate_token) {
    return true
  }
  if (route.query.force === '1') {
    return true
  }
  return false
})

const resolveRedirectTarget = () => {
  const raw = route.query.redirect
  if (typeof raw === 'string' && raw.trim()) {
    let decoded = raw.trim()
    try {
      decoded = decodeURIComponent(decoded)
    } catch (error) {
      // ignore decode errors and fall back to raw value
    }
    if (decoded.startsWith('#/')) {
      decoded = decoded.slice(1)
    }
    if (!decoded.startsWith('/') && !/^https?:\/\//i.test(decoded)) {
      decoded = `/${decoded}`
    }
    if (/^https?:\/\//i.test(decoded)) {
      return { external: true, url: decoded }
    }
    return { external: false, path: decoded || '/user' }
  }
  return { external: false, path: '/user' }
}

onMounted(() => {
  if (shouldBypassAutoRedirect.value) {
    return
  }

  const storeHasSession = userStore.isLoggedIn && !!userStore.token
  const authState = authManager.getAuthState()
  const hasPersistedSession =
    !!authState?.token ||
    !!localStorage.getItem('token') ||
    !!sessionStorage.getItem('token')

  if (storeHasSession || hasPersistedSession) {
    const target = resolveRedirectTarget()
    if (target.external) {
      window.location.href = target.url
      return
    }
    router.replace(target.path)
  }
})

// 切换显示/隐藏其他登录方式
const toggleOtherLogin = () => {
  showOtherLogin.value = !showOtherLogin.value
}

// 登录表单 - 密码登录
const loginForm = reactive({
  username: '',
  password: '',
  remember: false
})

// 登录表单 - 短信登录
const smsForm = reactive({
  phone: '',
  code: ''
})

// 密码登录提交
const onSubmit = async (values) => {
  // 检查隐私政策同意状态
  if (!checkPolicyAgreement()) {
    return
  }
  
  // 登录前预检查
  if (!checkLoginStatus()) {
    return
  }
  
  loading.value = true
  try {
    const res = await login(values)
    handleLoginSuccess(res)
  } catch (error) {
    Toast({ type: 'fail', message: '登录失败，请重试' })
  } finally {
    loading.value = false
  }
}

// 短信登录提交
const onSmsSubmit = async () => {
  // 检查隐私政策同意状态
  if (!checkPolicyAgreement()) {
    return
  }
  
  loading.value = true
  try {
    const res = await loginBySms(smsForm)
    handleLoginSuccess(res)
  } catch (error) {
    Toast({ type: 'fail', message: '短信登录失败，请重试' })
  } finally {
    loading.value = false
  }
}

// 发送短信验证码
const handleSendSms = async () => {
  if (!smsForm.phone) {
    Toast({ type: 'fail', message: '请输入手机号' })
    return
  }

  if (!/^1[3-9]\d{9}$/.test(smsForm.phone)) {
    Toast({ type: 'fail', message: '请输入正确的手机号' })
    return
  }

  try {
    // 显示发送中状态
    const loadingToast = Toast.loading('验证码发送中...')

    const res = await sendSmsCode({
      phone: smsForm.phone,
      type: 'login',
      channel: 'aliyun'
    })

    // 关闭loading提示
    Toast.clear()

    if (res && res.code === 0) {
      // 使用醒目的成功提示
      Toast.success({
        message: '验证码已发送',
        duration: 2000,
        className: 'sms-success-toast'
      })

      // 开始倒计时
      smsTimer.value = 60
      timer = setInterval(() => {
        smsTimer.value--
        if (smsTimer.value <= 0) {
          clearInterval(timer)
          timer = null
        }
      }, 1000)
    } else {
      Toast({ type: 'fail', message: res?.message || '验证码发送失败，请稍后重试' })
    }
  } catch (error) {
    // 确保loading提示被清除
    Toast.clear()
    Toast({ type: 'fail', message: '发送失败，请稍后重试' })
  }
}

// 检查隐私政策同意状态
const checkPolicyAgreement = () => {
  if (!agreePolicy.value) {
    Toast({ type: 'fail', message: '请先阅读并同意用户协议和隐私政策' })
    return false
  }
  return true
}

// 微信登录缓存
const wechatLoginCache = new Map()

// 获取微信登录URL（带缓存）
const getWechatLoginUrl = async (params) => {
  const cacheKey = JSON.stringify(params)
  
  // 检查缓存（5分钟有效期）
  if (wechatLoginCache.has(cacheKey)) {
    const { data, timestamp } = wechatLoginCache.get(cacheKey)
    if (Date.now() - timestamp < 5 * 60 * 1000) {
      return data
    }
  }
  
  // 发起请求
  const response = await fetch(params.fullUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    },
    timeout: 10000
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  const data = await response.json()
  
  // 缓存结果
  wechatLoginCache.set(cacheKey, { data, timestamp: Date.now() })
  
  return data
}

// 统一错误处理
const handleWechatError = (error) => {
  const errorMap = {
    'NETWORK_ERROR': '网络连接失败，请检查网络设置',
    'TIMEOUT_ERROR': '请求超时，请稍后重试',
    'SERVER_ERROR': '服务器繁忙，请稍后重试',
    'WECHAT_ERROR': '微信登录失败，请重试'
  }
  
  let message = '微信登录失败，请重试'
  
  if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
    message = errorMap.NETWORK_ERROR
  } else if (error.message.includes('timeout')) {
    message = errorMap.TIMEOUT_ERROR
  } else if (error.message.includes('HTTP 5')) {
    message = errorMap.SERVER_ERROR
  }
  
  Toast({ type: 'fail', message })
}

// 微信登录
const buildWechatStateTarget = () => {
  const target = resolveRedirectTarget()
  if (target?.external) {
    return target.url
  }
  if (target?.path) {
    return target.path.startsWith('/') ? target.path : `/${target.path}`
  }

  const hashPath = window.location.hash ? window.location.hash.replace(/^#/, '') : ''
  if (hashPath) {
    return hashPath.startsWith('/') ? hashPath : `/${hashPath}`
  }

  const fullPath = route.fullPath || router.currentRoute?.value?.fullPath || '/'
  return fullPath.startsWith('/') ? fullPath : `/${fullPath}`
}

const handleWechatLogin = async () => {
  // 检查隐私政策同意状态
  if (!checkPolicyAgreement()) {
    return
  }
  
  // 登录前预检查
  if (!checkLoginStatus()) {
    return
  }
  
  const loadingToast = Toast.loading({
    message: '正在准备微信登录...',
    forbidClick: true,
    duration: 0
  })

  try {
    // 获取当前主机名和协议
    const currentHost = window.location?.host || 'pay.itapgo.com'
    const protocol = window.location?.protocol || 'https:'
    
    // 构建参数
    const stateTarget = buildWechatStateTarget()
    const state = encodeURIComponent(stateTarget)
    const redirect_uri = `${protocol}//${currentHost}/app/#/wechat-callback`
    
    // 构建API请求URL
    const params = new URLSearchParams({
      redirect_uri,
      state,
      _t: Date.now()
    })
    
    const fullUrl = `${protocol}//${currentHost}/api/mobile/v1/wechat/login-url?${params.toString()}`
    
    // 获取微信登录URL（带缓存）
    const res = await getWechatLoginUrl({ fullUrl, redirect_uri, state })
    
    // 检查请求结果
    if (res?.code === 0 && res?.data?.url) {
      // 跳转到微信授权页面
      setTimeout(() => {
        window.location.href = res.data.url
      }, 100)
    } else {
      Toast({ type: 'fail', message: res?.message || '获取微信登录链接失败，请稍后重试' })
    }
  } catch (error) {
    handleWechatError(error)
  } finally {
    Toast.clear()
  }
}

// 忘记密码
const handleForgotPassword = () => {
  router.push('/forgot-password')
}

// 处理登录成功
const handleLoginSuccess = async (res) => {
  // 提取token和用户数据
  let token = res?.data?.token || res?.token || res?.data?.access_token || res?.access_token
  let userData = res?.data?.user || res?.user || res?.data?.userInfo || res?.userInfo
  
  if (!token) {
    Toast({ type: 'fail', message: '登录失败，未获取到访问令牌' })
    return
  }

  if (!userData || !userData.id) {
    Toast({ type: 'fail', message: '登录失败，用户信息不完整' })
    return
  }

  // 使用优化的认证管理器保存状态
  const saved = authManager.saveAuthState(token, userData)
  if (!saved) {
    Toast({ type: 'fail', message: '保存登录状态失败，请重试' })
    return
  }
  
  // 更新Pinia store
  userStore.setToken(token)
  userStore.setUserInfo(userData)

  // 显示登录成功提示
  Toast.success('登录成功')

  // 立即跳转，无需延迟
  Promise.resolve().then(() => {
    const target = resolveRedirectTarget()
    const host = window.location.host

    if (target.external) {
      window.location.href = target.url
      return
    }

    const normalizedPath = target.path || '/user'

    if (host.includes('pay.itapgo.com')) {
      const hashPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`
      window.location.href = `https://pay.itapgo.com/app/#${hashPath}`
    } else {
      router.replace(normalizedPath)
    }
  })
}

// 组件卸载前清除定时器
onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
/* 引入tapgo字体 - 优化加载性能 */
@font-face {
  font-family: 'Tapgo';
  src: url('/fonts/tapgo.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap; /* 快速显示fallback字体，然后切换到自定义字体 */
}

.login-container {
  min-height: 100vh;
  background-color: #fff;
}

.login-content {
  padding: 60px 20px 20px;
}

.login-header {
  text-align: center;
  margin: 20px 0 30px;
}

.login-logo {
  width: 80px;
  height: 80px;
  margin-bottom: 16px;
}

.login-title {
  font-size: 24px;
  color: #333;
  margin: 0 0 8px;
}

.login-subtitle {
  font-family: 'Tapgo', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  color: #666;
  margin: 0;
  font-weight: 500;
  letter-spacing: 0.5px;
  /* 确保在字体加载期间也有良好的显示效果 */
  text-rendering: optimizeLegibility;
}

.wechat-login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  background-color: #07c160;
  color: white;
  font-size: 16px;
  font-weight: 500;
  border-radius: 22px;
  margin: 0 16px 20px;
  box-shadow: 0 2px 8px rgba(7, 193, 96, 0.3);
}

.wechat-login-btn i {
  margin-right: 8px;
}

.other-login-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
  margin: 20px 0;
  padding: 10px;
  cursor: pointer;
}

.other-login-toggle span {
  margin-right: 5px;
}

.collapsible-content {
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.login-tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.login-tab {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: 15px;
  color: #666;
  position: relative;
}

.login-tab.active {
  color: #1989fa;
  font-weight: 500;
}

.login-tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 2px;
  background-color: #1989fa;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 16px 0;
  padding: 0 16px;
}

.forgot-password {
  color: #1989fa;
  font-size: 14px;
}

.register-link {
  text-align: center;
  margin: 20px 0;
  font-size: 14px;
  color: #666;
}

.link {
  color: #1989fa;
  margin-left: 5px;
}

.login-policy {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  font-size: 12px;
  color: #999;
  margin-top: 40px;
  padding: 0 16px;
}

.login-policy .van-checkbox {
  margin-right: 4px;
}

.login-policy .policy-text {
  color: #666;
}

.policy-link {
  color: #1989fa;
}
</style>
