<template>
  <div class="invite-follow">
    <van-nav-bar
      fixed
      placeholder
      safe-area-inset-top
      title="关注点点够公众号"
      left-arrow
      @click-left="handleBack"
    />

    <div class="invite-follow__body">
      <section class="card">
        <h2>第一步：长按识别下方二维码</h2>
        <p>请关注“点点够”官方公众号，才能继续完成认证申请。</p>
        <div class="qrcode-box">
          <img :src="followQrImage" alt="公众号二维码" />
        </div>
        <p class="qrcode-hint">关注成功后，公众号将推送一条图文消息给您。</p>
      </section>

      <section class="card">
        <h2>第二步：在公众号消息中继续</h2>
        <ol>
          <li>打开微信 → 进入“点点够”公众号对话框</li>
          <li>查收最新推送的图文消息</li>
          <li>点击图文消息中的“填写认证申请”按钮</li>
        </ol>
      </section>

      <section class="card card--action">
        <h2>没有收到推送？</h2>
        <p>如果已关注公众号但仍未收到推送，可以点击下方按钮重新发送一次提醒。</p>
        <van-button
          round
          block
          type="primary"
          :loading="sending"
          @click="handleResend"
        >
          重新发送公众号提醒
        </van-button>
        <p v-if="sendMessage" class="action-hint">{{ sendMessage }}</p>
      </section>

      <section class="card card--tips">
        <van-icon name="info-o" />
        <p>收到推送后，请务必从公众号消息打开表单链接继续填写。直接刷新当前页面将无法完成认证。</p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showFailToast, showSuccessToast } from 'vant'
import { sendInviteFollowMessage } from '@/api/institution'

const FOLLOW_QR_DEFAULT = '/app/images/wechat-official-account.png'

const route = useRoute()
const router = useRouter()

const inviteCode = computed(() => route.query.invite_code || route.query.code || '')
const inviteTicket = computed(() => route.query.ticket || sessionStorage.getItem('invite_wechat_ticket') || '')
const storedFollowQr = ref(typeof window !== 'undefined' ? sessionStorage.getItem('invite_follow_qr') || '' : '')
const followQrImage = computed(() => route.query.qr || storedFollowQr.value || FOLLOW_QR_DEFAULT)
const sending = ref(false)
const sendMessage = ref('')

onMounted(() => {
  if (route.query.qr) {
    storedFollowQr.value = route.query.qr
    sessionStorage.setItem('invite_follow_qr', route.query.qr)
  }
  if (inviteTicket.value) {
    sessionStorage.setItem('invite_follow_ticket', inviteTicket.value)
  }
  if (route.query.followed === '1') {
    sessionStorage.setItem('invite_follow_confirmed', '1')
    sendMessage.value = '已检测到您已关注公众号，请从公众号消息进入表单填写。'
  }
})

const handleBack = () => {
  router.replace('/')
}

const handleResend = async () => {
  if (!inviteCode.value) {
    showFailToast('缺少邀请码，无法重新发送提醒')
    return
  }

  const openId = sessionStorage.getItem('invite_wechat_openid') || ''
  if (!openId) {
    showFailToast('未获取到微信身份信息，请返回重新扫码授权')
    return
  }

  const unionId = sessionStorage.getItem('invite_wechat_unionid') || ''

  sending.value = true
  sendMessage.value = ''
  try {
    const response = await sendInviteFollowMessage({
      invite_code: inviteCode.value,
      wechat_openid: openId,
      wechat_unionid: unionId,
      ticket: inviteTicket.value || undefined
    })

    const success =
      response &&
      (response.code === 0 || response.code === '0' || response.success === true)

    if (success) {
      sessionStorage.setItem('invite_follow_confirmed', '1')
      const notifyText =
        response?.message || '提醒已发送，请稍后在公众号消息中查看最新推送。'
      showSuccessToast(notifyText)
      sendMessage.value = notifyText
    } else {
      throw new Error(response?.message || '发送提醒失败，请稍后再试')
    }
  } catch (error) {
    console.error('[InviteFollow] resend failed', error)
    showFailToast(error?.message || '发送提醒失败，请稍后再试')
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
.invite-follow {
  min-height: 100vh;
  background: linear-gradient(180deg, #f4f7ff 0%, #ffffff 100%);
}

.invite-follow__body {
  padding: 16px;
  padding-bottom: 48px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 12px 24px rgba(33, 82, 255, 0.08);
  padding: 20px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
}

.card p {
  margin: 0;
  color: #5d6a7a;
  line-height: 1.5;
}

.card ol {
  padding-left: 18px;
  margin: 0;
  color: #4a5568;
}

.card--action {
  gap: 10px;
}

.card--tips {
  flex-direction: row;
  align-items: center;
  gap: 12px;
  background: #f0f5ff;
  color: #3c4d90;
}

.card--tips p {
  color: inherit;
}

.qrcode-box {
  display: flex;
  justify-content: center;
}

.qrcode-box img {
  width: 220px;
  height: 220px;
  border-radius: 16px;
  box-shadow: 0 12px 24px rgba(33, 82, 255, 0.15);
  object-fit: cover;
}

.qrcode-hint {
  font-size: 14px;
  color: #3c82f6;
  text-align: center;
}

.action-hint {
  font-size: 13px;
  color: #3c82f6;
  text-align: center;
}
</style>
