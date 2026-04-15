<template>
  <div class="institution-settings">
    <van-nav-bar
      title="机构设置"
      left-arrow
      fixed
      placeholder
      @click-left="$router.back()"
    />

    <div class="settings-content" v-if="!loading">
      <van-notice-bar
        v-if="loadError"
        wrapable
        mode="closeable"
        color="#ed6a0c"
        background="#fff7cc"
        :text="loadError"
        @close="loadError = ''"
      />
      <van-cell-group inset title="基础信息">
        <van-cell title="认证状态">
          <template #value>
            <van-tag :type="statusTag">{{ statusText }}</van-tag>
          </template>
        </van-cell>
        <van-cell title="机构等级" :value="displayLevel" />
        <van-cell title="分润等级" :value="displayProfitLevel" />
        <van-cell title="机构编号" :value="displayNumber" />
        <van-cell title="邀请码" :value="displayInviteCode" />
      </van-cell-group>

      <van-cell-group inset title="联系信息">
        <van-cell title="负责人" :value="principalName" />
        <van-cell title="联系电话" :value="displayPhone" />
        <van-cell
          title="联系邮箱"
          :value="displayEmail"
          is-link
          @click="openEmailPopup"
        />
        <van-cell title="联系地址" :value="displayAddress" />
        <van-cell title="加入时间" :value="displayJoinDate" />
      </van-cell-group>
    </div>

    <van-skeleton v-else title avatar :row="6" animated />
  </div>

  <van-popup
    v-model:show="showEmailPopup"
    round
    position="bottom"
    closeable
    class="email-popup"
    @closed="handleEmailPopupClosed"
  >
    <div class="email-popup__header">
      <div class="title">绑定联系邮箱</div>
      <p>用于接收机构通知与风险提醒</p>
    </div>
    <van-field
      v-model="emailForm.email"
      label="邮箱"
      placeholder="请输入联系邮箱"
      clearable
      maxlength="80"
    />
    <van-field
      v-model="emailForm.code"
      label="验证码"
      placeholder="请输入验证码"
      maxlength="6"
    >
      <template #button>
        <van-button
          size="small"
          type="primary"
          plain
          :loading="emailSending"
          :disabled="emailSending || emailCountdown > 0"
          @click.stop="handleSendEmailCode"
        >
          {{ emailCountdown > 0 ? `${emailCountdown}s` : '发送验证码' }}
        </van-button>
      </template>
    </van-field>
    <van-button
      type="primary"
      block
      round
      class="email-popup__submit"
      :loading="emailSubmitting"
      @click="handleBindEmail"
    >
      确认绑定
    </van-button>
  </van-popup>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import {
  getInstitutionOnboardingStats,
  getInstitutionWorkspace,
  sendInstitutionEmailCode,
  bindInstitutionEmail
} from '@/api/institution'

const userStore = useUserStore()

const INSTITUTION_STORAGE_KEY = 'institution/active-id'

const getActiveInstitutionId = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(INSTITUTION_STORAGE_KEY)
    if (!raw) return null
    const numeric = Number(raw)
    return Number.isFinite(numeric) ? numeric : null
  } catch (error) {
    console.info('读取机构选择缓存失败:', error)
    return null
  }
}

const loading = ref(true)
const statsInfo = reactive({
  status: userStore.userInfo?.is_pay_institution === 1 ? 1 : 0,
  inviteCode: userStore.userInfo?.institution_invite_code || userStore.userInfo?.invite_code || '',
  number: userStore.userInfo?.institution_number || '',
  principal: userStore.userInfo?.institution_principal || userStore.userInfo?.name || ''
})

const baseInfo = reactive({
  statusText: userStore.userInfo?.is_pay_institution === 1 ? '已认证' : '待认证',
  level: userStore.userInfo?.institution_level_text || userStore.userInfo?.institution_level || '—',
  profitLevel: userStore.userInfo?.institution_profit_level || userStore.userInfo?.profit_level || '—',
  phone: userStore.userInfo?.institution_phone || userStore.userInfo?.phone || '—',
  email: userStore.userInfo?.institution_email || userStore.userInfo?.email || '—',
  address: userStore.userInfo?.institution_address || userStore.userInfo?.address || '—',
  joinDate: userStore.userInfo?.institution_join_date || userStore.userInfo?.created_at || '—'
})
const loadError = ref('')

const showEmailPopup = ref(false)
const emailForm = reactive({
  email: '',
  code: ''
})
const emailSending = ref(false)
const emailSubmitting = ref(false)
const emailCountdown = ref(0)
let emailCountdownTimer = null
const emailRegex = /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/i

const formatErrorMessage = (message) => {
  if (!message) return ''
  const trimmed = String(message).trim()
  if (trimmed === '') {
    return ''
  }
  const suppressionKeywords = ['系统错误', '系统内部错误', 'System error', 'Server error']
  if (suppressionKeywords.some(keyword => trimmed.includes(keyword))) {
    return ''
  }
  return trimmed
}

const statusMap = {
  0: '待认证',
  1: '已认证',
  2: '审核中',
  3: '已禁用'
}

const statusTag = computed(() => {
  if (statsInfo.status === 1) return 'success'
  if (statsInfo.status === 0) return 'warning'
  return 'default'
})

const statusText = computed(() => baseInfo.statusText || statusMap[statsInfo.status] || '未知状态')
const displayLevel = computed(() => baseInfo.level || '—')
const displayProfitLevel = computed(() => baseInfo.profitLevel || '—')
const displayInviteCode = computed(() => statsInfo.inviteCode || '—')
const displayNumber = computed(() => statsInfo.number || '—')
const principalName = computed(() => statsInfo.principal || userStore.userName || '—')
const displayPhone = computed(() => baseInfo.phone || '—')
const displayEmail = computed(() => baseInfo.email || '—')
const displayAddress = computed(() => baseInfo.address || '—')
const displayJoinDate = computed(() => baseInfo.joinDate || '—')

const loadSettings = async () => {
  loading.value = true
  loadError.value = ''

  try {
    const params = {}
    const activeInstitutionId = getActiveInstitutionId()
    if (typeof activeInstitutionId === 'number' && !Number.isNaN(activeInstitutionId)) {
      params.institution_id = activeInstitutionId
    }
    const statsRes = await getInstitutionOnboardingStats(params)
    if (statsRes?.code === 0) {
      const inst = statsRes.data?.institution || {}
      if (typeof inst.status === 'number') {
        statsInfo.status = inst.status
      }
      if (inst.invite_code) {
        statsInfo.inviteCode = inst.invite_code
      }
      if (inst.number) {
        statsInfo.number = inst.number
      }
      if (inst.principal_name) {
        statsInfo.principal = inst.principal_name
      }
      if (inst.phone) {
        baseInfo.phone = inst.phone
      }
      if (inst.email || inst.contact_email) {
        baseInfo.email = inst.email || inst.contact_email
      }
      if (inst.address) {
        baseInfo.address = inst.address
      }

      if (typeof inst.status === 'number') {
        baseInfo.statusText = statusMap[inst.status] || baseInfo.statusText
      }
    } else if (statsRes) {
      const msg = formatErrorMessage(statsRes.message)
      if (msg) loadError.value = msg
    }
  } catch (error) {
    const message = error?.response?.data?.message || error?.message || '获取机构认证信息失败'
    console.warn('加载机构认证信息失败:', message)
    const msg = formatErrorMessage(message)
    if (msg) loadError.value = msg
  }

  try {
    const workspaceRes = await getInstitutionWorkspace()
    if (workspaceRes?.code === 0) {
      const info = workspaceRes.data?.institutionInfo || workspaceRes.data?.institution_info || {}
      if (info.statusText || info.status_text) {
        baseInfo.statusText = info.statusText || info.status_text
      }
      if (info.level) {
        baseInfo.level = info.level
      }
      if (info.profitLevel || info.profit_level) {
        baseInfo.profitLevel = info.profitLevel || info.profit_level
      }
      if (info.phone) {
        baseInfo.phone = info.phone
      }
      if (info.email || info.contact_email) {
        baseInfo.email = info.email || info.contact_email
      }
      if (info.address) {
        baseInfo.address = info.address
      }
      if (info.joinDate || info.join_date) {
        baseInfo.joinDate = info.joinDate || info.join_date
      }
      if (info.principal || info.principal_name) {
        statsInfo.principal = info.principal || info.principal_name
      }
    } else if (workspaceRes && workspaceRes.message) {
      console.info('获取机构工作台信息失败:', workspaceRes.message)
      if (!loadError.value) {
        const msg = formatErrorMessage(workspaceRes.message)
        if (msg) loadError.value = msg
      }
    }
  } catch (error) {
    const message = error?.message || '获取机构工作台信息失败'
    console.info('获取机构工作台信息接口暂不可用:', message)
    if (!loadError.value) {
      const msg = formatErrorMessage(message)
      if (msg) loadError.value = msg
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSettings()
})

const clearEmailTimer = () => {
  if (emailCountdownTimer) {
    clearInterval(emailCountdownTimer)
    emailCountdownTimer = null
  }
}

const startEmailCountdown = (duration = 60) => {
  clearEmailTimer()
  emailCountdown.value = duration
  emailCountdownTimer = setInterval(() => {
    if (emailCountdown.value <= 1) {
      clearEmailTimer()
      emailCountdown.value = 0
      return
    }
    emailCountdown.value -= 1
  }, 1000)
}

const openEmailPopup = () => {
  emailForm.email = baseInfo.email && baseInfo.email !== '—' ? baseInfo.email : ''
  emailForm.code = ''
  showEmailPopup.value = true
}

const handleSendEmailCode = async () => {
  if (emailSending.value || emailCountdown.value > 0) return
  const targetEmail = emailForm.email.trim()
  if (!emailRegex.test(targetEmail)) {
    showToast('请输入正确的邮箱地址')
    return
  }
  try {
    emailSending.value = true
    const response = await sendInstitutionEmailCode({ email: targetEmail })
    const message = response?.message || '验证码已发送'
    showToast(message)
    const expires = Number(response?.expiresIn) || 60
    startEmailCountdown(expires >= 10 ? expires : 60)
  } catch (error) {
    const message = error?.response?.data?.message || error?.message || '验证码发送失败'
    showToast(message)
  } finally {
    emailSending.value = false
  }
}

const handleBindEmail = async () => {
  const targetEmail = emailForm.email.trim()
  const code = emailForm.code.trim()
  if (!emailRegex.test(targetEmail)) {
    showToast('请输入正确的邮箱地址')
    return
  }
  if (!code) {
    showToast('请输入验证码')
    return
  }
  try {
    emailSubmitting.value = true
    const response = await bindInstitutionEmail({ email: targetEmail, code })
    if (response?.code !== 0) {
      throw new Error(response?.message || '邮箱绑定失败')
    }
    baseInfo.email = targetEmail
    showToast('邮箱绑定成功')
    showEmailPopup.value = false
    emailForm.code = ''
  } catch (error) {
    const message = error?.response?.data?.message || error?.message || '邮箱绑定失败'
    showToast(message)
  } finally {
    emailSubmitting.value = false
  }
}

const handleEmailPopupClosed = () => {
  emailForm.code = ''
}

onBeforeUnmount(() => {
  clearEmailTimer()
})
</script>

<style scoped>
.institution-settings {
  min-height: 100vh;
  background-color: #f5f6f9;
}

.settings-content {
  padding: 16px 0 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

:deep(.van-cell__title) {
  font-weight: 500;
}

:deep(.van-tag) {
  font-size: 12px;
}

.email-popup {
  padding: 24px 20px 32px;
}

.email-popup__header {
  text-align: center;
  margin-bottom: 16px;
}

.email-popup__header .title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
}

.email-popup__header p {
  margin: 6px 0 0;
  font-size: 13px;
  color: #8f9098;
}

.email-popup :deep(.van-field) {
  margin-bottom: 12px;
  border-radius: 12px;
  background: #f7f8fa;
  padding: 8px 12px;
}

.email-popup__submit {
  margin-top: 8px;
}
</style>
