<template>
  <div class="invite-auth-redirect">
    <van-loading v-if="loading" size="26px" type="spinner" />
    <p>{{ statusMessage }}</p>
    <van-button
      v-if="errorMessage"
      type="primary"
      size="small"
      round
      @click="retryAuthorize"
    >
      重新发起授权
    </van-button>
    <div v-if="fallbackVisible" class="fallback-panel">
      <p>请在微信中打开此页面完成授权：</p>
      <ol>
        <li>长按或截图保存本页面二维码</li>
        <li>打开微信 → 扫一扫 → 从相册选图</li>
        <li>关注“点点够”公众号后，返回消息完成资料填写</li>
      </ol>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showFailToast } from 'vant'
import {
  getInviteWechatAuthorizeUrl,
  fetchInviteWechatUser
} from '@/api/institution'
import { isWechatBrowser } from '@/utils/wechat'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const statusMessage = ref('正在跳转，请稍候...')
const errorMessage = ref('')
const fallbackVisible = ref(false)

const isWeChat = isWechatBrowser()

const storedFollowQr = ref(typeof window !== 'undefined' ? sessionStorage.getItem('invite_follow_qr') || '' : '')
const inviteCode = computed(() => route.query.invite_code || route.query.code || '')
const inviteType = computed(() => route.query.type || '')
const inviteEntry = computed(() => route.query.entry || '')
const inviteQr = computed(() => route.query.qr || storedFollowQr.value || '')

const sanitizeQuery = (extra = {}) => {
  const base = {
    invite_code: inviteCode.value || undefined,
    type: inviteType.value || undefined,
    entry: inviteEntry.value || undefined,
    ticket: route.query.ticket || undefined,
    qr: inviteQr.value || undefined,
    ...extra
  }

  Object.keys(base).forEach((key) => {
    if (base[key] === undefined || base[key] === '') {
      delete base[key]
    }
  })

  return base
}

const storeWechatProfile = (profile, ticket) => {
  try {
    if (profile.wechat_openid) {
      sessionStorage.setItem('invite_wechat_openid', profile.wechat_openid)
    }
    if (profile.wechat_unionid) {
      sessionStorage.setItem('invite_wechat_unionid', profile.wechat_unionid)
    }
    sessionStorage.setItem('invite_wechat_ticket', ticket)
    sessionStorage.setItem('invite_follow_ticket', ticket)
    sessionStorage.setItem('invite_wechat_user', JSON.stringify(profile))
    sessionStorage.setItem('invite_entry_source', inviteEntry.value || '')
    if (inviteQr.value) {
      storedFollowQr.value = inviteQr.value
      sessionStorage.setItem('invite_follow_qr', inviteQr.value)
    }
  } catch (error) {
    console.warn('[InviteAuth] store profile failed', error)
  }
}

const redirectToRegister = () => {
  sessionStorage.setItem('invite_follow_confirmed', '1')
  sessionStorage.setItem('invite_entry_source', inviteEntry.value || 'mp')
  const ticket = route.query.ticket || sessionStorage.getItem('invite_wechat_ticket') || ''
  router.replace({
    name: 'InstitutionInviteRegister',
    query: sanitizeQuery({
      entry: 'mp',
      ticket: ticket || undefined
    })
  })
}

const redirectToFollow = (ticket, followed = false) => {
  sessionStorage.setItem('invite_entry_source', inviteEntry.value || '')
  router.replace({
    name: 'InstitutionInviteFollow',
    query: sanitizeQuery({ ticket, followed: followed ? '1' : undefined })
  })
}

const handleTicket = async (ticket) => {
  try {
    statusMessage.value = '正在同步微信身份信息...'
    const response = await fetchInviteWechatUser({ ticket })

    if (!response || !(response.code === 0 || response.code === '0')) {
      throw new Error(response?.message || '授权信息已失效，请重新扫码')
    }

    const profile = {
      wechat_openid: response.data?.wechat_openid || '',
      wechat_unionid: response.data?.wechat_unionid || '',
      nickname: response.data?.nickname || '',
      avatar: response.data?.avatar || ''
    }

    storeWechatProfile(profile, ticket)

    const entrySource = inviteEntry.value || sessionStorage.getItem('invite_entry_source') || ''
    const followed = Boolean(response.data?.followed)

    if (entrySource === 'mp' || followed) {
      redirectToRegister()
      return
    }

    redirectToFollow(ticket, followed)
  } catch (error) {
    console.error('[InviteAuth] handle ticket failed', error)
    errorMessage.value = error?.message || '授权信息校验失败，请重新扫码'
    showFailToast(errorMessage.value)
  } finally {
    loading.value = false
  }
}

const startAuthorize = async () => {
  if (!isWeChat) {
    loading.value = false
    fallbackVisible.value = true
    statusMessage.value = '请在微信内打开完成授权'
    return
  }

  if (!inviteCode.value) {
    loading.value = false
    statusMessage.value = '缺少邀请码参数，无法继续'
    errorMessage.value = '邀请码缺失'
    return
  }

  try {
    statusMessage.value = '正在跳转至微信授权...'
    loading.value = true
    errorMessage.value = ''

    const response = await getInviteWechatAuthorizeUrl({
      invite_code: inviteCode.value,
      type: inviteType.value || undefined,
      entry: inviteEntry.value || undefined,
      qr: inviteQr.value || undefined,
      origin: window.location.href
    })

    if (!response || !(response.code === 0 || response.code === '0')) {
      throw new Error(response?.message || '获取授权链接失败，请稍后再试')
    }

    const authUrl = response.data?.url
    if (!authUrl) {
      throw new Error('授权链接为空，请稍后重试')
    }

    window.location.href = authUrl
  } catch (error) {
    console.error('[InviteAuth] start authorize failed', error)
    loading.value = false
    errorMessage.value = error?.message || '获取授权链接失败，请稍后再试'
    statusMessage.value = errorMessage.value
    showFailToast(errorMessage.value)
  }
}

const retryAuthorize = async () => {
  loading.value = true
  errorMessage.value = ''
  statusMessage.value = '正在重新发起授权...'

  await router.replace({
    name: 'InstitutionInviteAuth',
    query: sanitizeQuery({ t: Date.now() })
  })

  await nextTick()
  startAuthorize()
}

onMounted(() => {
  const ticket = route.query.ticket
  const errorFlag = route.query.error

  if (!isWeChat) {
    startAuthorize()
    return
  }

  if (route.query.qr) {
    storedFollowQr.value = route.query.qr
    sessionStorage.setItem('invite_follow_qr', route.query.qr)
  }

  if (ticket) {
    handleTicket(ticket)
    return
  }

  if (errorFlag) {
    errorMessage.value = '授权失败，请重新尝试'
    statusMessage.value = errorMessage.value
    loading.value = false
    return
  }

  startAuthorize()
})
</script>

<style scoped>
.invite-auth-redirect {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  text-align: center;
  background: linear-gradient(180deg, #f6faff 0%, #ffffff 100%);
  color: #576b95;
  font-size: 15px;
}

.invite-auth-redirect p {
  margin: 0;
  line-height: 1.6;
}

.fallback-panel {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 12px;
  padding: 16px;
  color: #333;
  text-align: left;
  font-size: 14px;
  max-width: 320px;
}

.fallback-panel ol {
  margin: 8px 0 0;
  padding-left: 20px;
  line-height: 1.6;
}
</style>
