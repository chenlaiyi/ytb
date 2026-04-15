<template>
  <div class="admin-login-container">
    <div class="login-header">
      <h2>管理员登录</h2>
      <p>点点够管理后台</p>
    </div>

    <div class="login-content">
      <p class="login-tip">
        使用当前已登录的 App 账号即可进入后台。系统会自动校验
        <span class="highlight">app_users.is_admin = 1</span> 的权限。
      </p>

      <van-button
        round
        block
        type="primary"
        :loading="loading"
        @click="handleOneClickLogin"
      >
        一键进入管理后台
      </van-button>

      <div class="hint warning" v-if="!hasAppToken">
        检测到尚未登录 App，请先完成 App 端登录后重试。
      </div>
      <div class="hint" v-else>
        若账号未开通管理员权限，请联系系统管理员。
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import request from '@/utils/request'
import { setAdminAuthData } from '@/utils/auth'

const router = useRouter()
const route = useRoute()
const loading = ref(false)

const hasAppToken = computed(() => {
  return Boolean(
    localStorage.getItem('token') ||
      localStorage.getItem('branch_token') ||
      sessionStorage.getItem('token') ||
      localStorage.getItem('simulate_token')
  )
})

const storeAdminSession = (token, user, options = {}) => {
  const normalizedToken = token || ''
  if (!normalizedToken) {
    throw new Error('未获取到有效的登录令牌')
  }

  const normalizedUser = {
    ...(user || {}),
    role: user?.role || 'admin',
    is_admin: user?.is_admin ?? 1,
    branch_id: user?.branch_info?.id ?? user?.branch_id ?? 3
  }

  setAdminAuthData(normalizedToken, normalizedUser)

  if (options.branchLogin) {
    localStorage.setItem('branch_admin_token', normalizedToken)
    if (normalizedUser.branch_info) {
      localStorage.setItem('branch_user_info', JSON.stringify(normalizedUser.branch_info))
    }
  } else {
    localStorage.removeItem('branch_admin_token')
  }
}

const resolveRedirect = () => {
  const redirect = route.query.redirect
  if (typeof redirect === 'string' && redirect.startsWith('/')) {
    return redirect
  }
  return '/admin'
}

const performLogin = async () => {
  const branchCode = route.query.branch_code
  const response = await request({
    url: '/api/mobile/v1/admin/login',
    method: 'post',
    data: branchCode ? { branch_code: branchCode } : {}
  })

  if (response.code !== 0) {
    throw new Error(response.message || '登录失败')
  }

  const { token, user } = response.data || {}
  const branchLogin = Boolean(branchCode || user?.branch_info)

  storeAdminSession(token, user, { branchLogin })
  showSuccessToast('登录成功')
  router.replace(resolveRedirect())
}

const handleOneClickLogin = async () => {
  if (!hasAppToken.value) {
    showToast('当前浏览器未检测到 App 登录状态，请先在 App 内完成登录')
    return
  }

  loading.value = true
  try {
    await performLogin()
  } catch (error) {
    console.error('❌ [管理员登录] 登录失败:', error)
    showToast(error.message || '一键登录暂不可用，请联系管理员')
  } finally {
    loading.value = false
  }
}

const checkAutoLogin = async () => {
  const autoLogin = route.query.auto_login
  const source = route.query.source

  if (autoLogin === '1' && source === 'branch_personal_center') {
    const branchUserInfo = localStorage.getItem('branch_user_info')
    if (branchUserInfo) {
      try {
        const parsed = JSON.parse(branchUserInfo)
        if (parsed?.is_admin !== 1 && parsed?.is_admin !== '1') {
          showToast.fail('当前账号没有管理员权限')
          return
        }
      } catch (error) {
        console.warn('解析分支用户信息失败:', error)
      }
    }

    if (!hasAppToken.value) {
      showToast.fail('未检测到 App 登录状态，请先登录后重试')
      return
    }

    try {
      loading.value = true
      await performLogin()
      showSuccessToast('自动登录成功')
    } catch (error) {
      console.error('自动登录失败:', error)
      showToast.fail(error.message || '自动登录暂不可用，请点击按钮重试')
    } finally {
      loading.value = false
    }
  }
}

onMounted(() => {
  checkAutoLogin()
})
</script>

<style scoped>
.admin-login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60px 20px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
  color: white;
}

.login-header h2 {
  font-size: 28px;
  margin-bottom: 8px;
  font-weight: bold;
}

.login-header p {
  font-size: 16px;
  opacity: 0.9;
}

.login-content {
  width: 100%;
  max-width: 420px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 28px 24px;
  box-shadow: 0 22px 48px rgba(31, 42, 86, 0.22);
}

.login-tip {
  font-size: 14px;
  color: #4a5568;
  line-height: 1.6;
  margin-bottom: 24px;
}

.login-tip .highlight {
  color: #3b82f6;
  font-weight: 600;
}

.hint {
  margin-top: 16px;
  font-size: 12px;
  color: #4a5568;
  text-align: center;
}

.hint.warning {
  color: #ff6b6b;
}
</style>
