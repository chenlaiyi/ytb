<template>
  <div class="verification-container">
    <NavBar
      title="实名认证"
      left-text="返回"
      left-arrow
      fixed
      placeholder
      @click-left="router.back()"
    />

    <div class="verification-content">
      <div v-if="loading" class="loading-section">
        <Loading type="spinner" color="#1989fa" />
        <div class="loading-text">加载中...</div>
      </div>

      <template v-else>
        <div class="notice-card">
          <Icon name="info-o" size="18" color="#1989fa" />
          <div class="notice-text">
            为保障账户安全，请完善实名信息。提交后将用于账户找回与重要通知。
          </div>
        </div>

        <section class="status-section">
          <div :class="['status-card', statusClass]">
            <Icon
              v-if="verificationDetail.isVerified"
              name="passed"
              size="40"
              color="#07c160"
            />
            <Icon
              v-else
              name="warning-o"
              size="40"
              color="#ff976a"
            />
            <div class="status-title">{{ statusTitle }}</div>
            <div class="status-desc">{{ statusDescription }}</div>
            <div v-if="missingFieldsHint" class="missing-hint">{{ missingFieldsHint }}</div>
          </div>
        </section>

        <div v-if="verificationDetail.isVerified" class="info-card">
          <div class="card-title">实名认证信息</div>
          <Cell title="姓名" :value="displayName" />
          <Cell title="手机号码" :value="displayPhone" />
          <Cell title="推荐人ID" :value="displayReferrer" />
          <Cell v-if="maskedIdCard" title="身份证号" :value="maskedIdCard" />
          <div v-if="idCardImages.length" class="image-preview">
            <div class="image-title">身份证照片</div>
            <div class="image-list">
              <div
                v-for="(img, index) in idCardImages"
                :key="img + index"
                class="image-item"
                @click="previewIdImages(index)"
              >
                <img :src="img" alt="身份证照片" class="image-thumbnail" />
                <div class="image-mask">
                  <Icon name="eye-o" class="image-mask-icon" />
                  <div class="image-mask-text">点击查看原件</div>
                  <div class="image-mask-label">{{ imageLabel(index) }}（已遮挡）</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="form-card">
          <div class="card-title">填写认证信息</div>
          <div class="card-desc">
            请填写真实信息，提交后用于核验身份。如填写错误可再次修改提交。
          </div>

          <Field
            v-model="form.realName"
            label="真实姓名"
            placeholder="请输入真实姓名"
            :rules="[{ required: true, message: '请输入真实姓名' }]"
          />

          <Field
            v-model="form.phone"
            label="手机号码"
            type="tel"
            placeholder="请输入11位手机号码"
            :rules="phoneRules"
          />

          <Field
            v-model="form.referrerId"
            label="推荐人ID"
            placeholder="请输入推荐人ID（选填）"
            :disabled="!canModifyReferrerId"
            :maxlength="50"
          />
          <div v-if="!canModifyReferrerId" class="field-tip">
            推荐人已确认，如需修改请联系客服。
          </div>

          <div class="agreement-section">
            <Checkbox v-model="form.agreement">我已阅读并同意</Checkbox>
            <span class="agreement-link" role="button" @click="showAgreement">《实名认证服务协议》</span>
          </div>

          <div class="submit-btn">
            <Button
              round
              block
              type="primary"
              :loading="submitting"
              :disabled="!form.agreement || submitting"
              @click="handleSubmit"
            >
              {{ submitting ? '提交中…' : '提交认证' }}
            </Button>
          </div>
        </div>
      </template>
    </div>
  </div>
  <ImagePreview
    v-model:show="previewVisible"
    :images="idCardImages"
    :start-position="previewStartIndex"
    :class="previewClassName"
    closeable
    :close-icon="previewRevealed ? 'closed-eye' : 'cross'"
    @close="handlePreviewClose"
    @change="handlePreviewChange"
  >
    <template #cover>
      <div class="privacy-cover">
        <Icon
          :name="previewRevealed ? 'eye' : 'shield-o'"
          size="28"
          class="privacy-cover-icon"
        />
        <div class="privacy-cover-title">
          {{ previewRevealed ? '正在显示原件' : '身份证图片已遮挡敏感信息' }}
        </div>
        <div class="privacy-cover-desc">
          {{
            previewRevealed
              ? '5 秒后将自动重新遮挡，如需继续查看请再次点击。'
              : '确认周围无旁人后，可点击下方按钮短暂查看原件。'
          }}
        </div>
        <Button
          v-if="!previewRevealed"
          type="primary"
          size="small"
          round
          class="privacy-cover-btn"
          @click="revealOriginalTemporarily"
        >
          显示原件（5 秒）
        </Button>
        <Button
          v-else
          type="primary"
          size="small"
          plain
          round
          class="privacy-cover-btn"
          @click="remaskImmediately"
        >
          立即遮挡
        </Button>
      </div>
    </template>
  </ImagePreview>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  NavBar,
  Cell,
  Field,
  Button,
  Icon,
  Toast,
  Checkbox,
  Dialog,
  Loading,
  ImagePreview
} from 'vant'
import { getVerificationStatus, submitVerification, getUserInfo } from '@/api/user'

const router = useRouter()

const loading = ref(true)
const submitting = ref(false)

const verificationDetail = ref({
  isVerified: false,
  missingFields: [] as string[],
  canModifyReferrerId: true,
  userInfo: {
    name: '',
    phone: '',
    referrerId: '',
    id_card: '',
    id_card_images: [] as string[]
  }
})

const form = ref({
  realName: '',
  phone: '',
  referrerId: '',
  agreement: false
})

const phonePattern = /^1[3-9]\d{9}$/
const phoneRules = [
  { required: true, message: '请输入手机号码' },
  { pattern: phonePattern, message: '请输入正确的手机号码' }
]

const statusClass = computed(() => (verificationDetail.value.isVerified ? 'verified' : 'pending'))
const statusTitle = computed(() => (verificationDetail.value.isVerified ? '已完成实名认证' : '尚未完成实名认证'))
const statusDescription = computed(() =>
  verificationDetail.value.isVerified
    ? '您的实名信息已完善，可安全使用点点够服务。'
    : '我们将核验您提供的信息，请确保真实准确。'
)

const missingFieldsHint = computed(() => {
  if (verificationDetail.value.isVerified || !verificationDetail.value.missingFields.length) {
    return ''
  }
  const labels: Record<string, string> = {
    name: '姓名',
    phone: '手机号码',
    referrer_id: '推荐人ID',
    id_card: '身份证号',
    id_card_images: '身份证照片'
  }
  const items = verificationDetail.value.missingFields
    .map((field) => labels[field] || field)
    .join('、')
  return items ? `缺少信息：${items}` : ''
})

const canModifyReferrerId = computed(() => verificationDetail.value.canModifyReferrerId)

const maskIdCard = (value: string) => {
  if (!value) return ''
  const trimmed = value.trim()
  if (trimmed.length <= 7) return '*'.repeat(Math.max(trimmed.length - 1, 0)) + trimmed.slice(-1)
  const head = trimmed.slice(0, 3)
  const tail = trimmed.slice(-4)
  const mask = '*'.repeat(trimmed.length - head.length - tail.length)
  const masked = `${head}${mask}${tail}`
  return masked.replace(/(.{4})/g, '$1 ').trim()
}

const userInfo = computed(() => verificationDetail.value.userInfo || {})
const displayName = computed(() => userInfo.value.name || '-')
const displayPhone = computed(() => userInfo.value.phone || '-')
const displayReferrer = computed(() => userInfo.value.referrerId || '—')
const maskedIdCard = computed(() => maskIdCard(userInfo.value.id_card || ''))
const idCardImages = computed(() => {
  const list = userInfo.value.id_card_images
  return Array.isArray(list) ? list : []
})

const imageLabel = (index: number) => {
  if (index === 0) return '正面'
  if (index === 1) return '反面'
  return `附件${index + 1}`
}

const previewVisible = ref(false)
const previewStartIndex = ref(0)
const previewRevealed = ref(false)
let previewTimer: ReturnType<typeof setTimeout> | null = null

const previewClassName = computed(() =>
  previewRevealed.value ? 'privacy-preview privacy-preview--revealed' : 'privacy-preview'
)

const clearPreviewTimer = () => {
  if (previewTimer) {
    clearTimeout(previewTimer)
    previewTimer = null
  }
}

const remaskImmediately = (showHint = true) => {
  clearPreviewTimer()
  if (previewRevealed.value && showHint) {
    Toast('已遮挡证件原件')
  }
  previewRevealed.value = false
}

const revealOriginalTemporarily = () => {
  clearPreviewTimer()
  previewRevealed.value = true
  Toast('证件原件已显示，将在 5 秒后自动遮挡')
  previewTimer = setTimeout(() => {
    remaskImmediately()
  }, 5000)
}

const handlePreviewClose = () => {
  remaskImmediately(false)
  previewVisible.value = false
}

const handlePreviewChange = () => {
  if (previewRevealed.value) {
    remaskImmediately(false)
  }
}

watch(previewVisible, (visible) => {
  if (!visible) {
    remaskImmediately(false)
  }
})

onBeforeUnmount(() => {
  clearPreviewTimer()
})

const previewIdImages = (startPosition: number) => {
  if (!idCardImages.value.length) {
    Toast('暂无身份证照片')
    return
  }
  previewStartIndex.value = startPosition
  previewVisible.value = true
  previewRevealed.value = false
}

const showAgreement = () => {
  Dialog.alert({
    title: '实名认证服务协议',
    message:
      '1. 您承诺提交的信息真实准确，并授权点点够用于身份核验。\n' +
      '2. 我们仅在合规要求及保障服务安全的前提下使用实名信息。\n' +
      '3. 如需更正或撤回实名信息，可通过客服渠道处理。'
  })
}

const populateFormFromProfile = (profile: any) => {
  if (!profile) return
  if (!form.value.realName && profile.name) {
    form.value.realName = profile.name
  }
  if (!form.value.phone && profile.phone) {
    form.value.phone = profile.phone
  }
  if (!form.value.referrerId && profile.referrer_id) {
    form.value.referrerId = profile.referrer_id
  }
}

const fetchUserProfile = async () => {
  try {
    const res: any = await getUserInfo()
    if (res?.code === 0 && res.data) {
      populateFormFromProfile(res.data)
    }
  } catch (error) {
    console.warn('获取用户信息失败', error)
  }
}

const fetchVerificationData = async () => {
  try {
    const res: any = await getVerificationStatus()
    if (res?.success && res.data) {
      const data = res.data
      verificationDetail.value = {
        isVerified: !!data.is_verified,
        missingFields: data.missing_fields || [],
        canModifyReferrerId: data.can_modify_referrer_id !== false,
        userInfo: {
          name: data.user_info?.name || '',
          phone: data.user_info?.phone || '',
          referrerId: data.user_info?.referrer_id || '',
          id_card: data.user_info?.id_card || '',
          id_card_images: Array.isArray(data.user_info?.id_card_images)
            ? data.user_info.id_card_images
            : []
        }
      }

      if (!verificationDetail.value.isVerified) {
        form.value.realName = data.user_info?.name || form.value.realName
        form.value.phone = data.user_info?.phone || form.value.phone
        if (verificationDetail.value.canModifyReferrerId) {
          form.value.referrerId = data.user_info?.referrer_id || form.value.referrerId
        } else {
          form.value.referrerId = data.user_info?.referrer_id || ''
        }
      } else {
        form.value.agreement = false
      }
    } else if (res?.message) {
      Toast(res.message)
    }
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message
    if (message && !/请求资源不存在/i.test(message)) {
      Toast(message)
    }
  }
}

const handleSubmit = async () => {
  if (!form.value.realName.trim()) {
    Toast('请输入真实姓名')
    return
  }
  if (!phonePattern.test(form.value.phone.trim())) {
    Toast('请输入正确的手机号码')
    return
  }
  if (!form.value.agreement) {
    Toast('请先阅读并同意服务协议')
    return
  }

  submitting.value = true
  try {
    Toast.loading({ message: '提交中…', forbidClick: true, duration: 0 })
    const payload = {
      name: form.value.realName.trim(),
      phone: form.value.phone.trim(),
      referrer_id: canModifyReferrerId.value ? form.value.referrerId.trim() : undefined
    }

    const res: any = await submitVerification(payload)
    Toast.clear()

    if (res?.success) {
      Toast.success(res.message || '提交成功')
      await fetchVerificationData()
      await fetchUserProfile()
      form.value.agreement = false
    } else {
      Toast(res?.message || '提交失败，请稍后重试')
    }
  } catch (error: any) {
    Toast.clear()
    const message = error?.response?.data?.message || error?.message || '提交失败，请稍后重试'
    Toast(message)
  } finally {
    submitting.value = false
  }
}

const initialise = async () => {
  loading.value = true
  try {
    await fetchUserProfile()
    await fetchVerificationData()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  initialise()
})
</script>

<style scoped>
.verification-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.verification-content {
  padding: 16px;
}

.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
}

.loading-text {
  margin-top: 12px;
  color: #969799;
  font-size: 14px;
}

.notice-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  font-size: 13px;
  line-height: 1.6;
  color: #494b4d;
}

.status-section {
  margin-bottom: 16px;
}

.status-card {
  background: linear-gradient(135deg, rgba(88, 101, 242, 0.12), rgba(79, 209, 197, 0.08));
  border-radius: 16px;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
}

.status-card.verified {
  background: linear-gradient(135deg, rgba(15, 199, 86, 0.18), rgba(56, 189, 248, 0.12));
}

.status-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.status-desc {
  font-size: 13px;
  color: #4b5563;
  line-height: 1.6;
}

.missing-hint {
  font-size: 12px;
  color: #ee0a24;
}

.info-card,
.form-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.info-card {
  margin-bottom: 16px;
}

.image-preview {
  margin-top: 16px;
}

.image-title {
  font-size: 14px;
  color: #1f2937;
  margin-bottom: 8px;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-item {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  background: #f7f8fa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px solid rgba(148, 163, 184, 0.2);
  position: relative;
}

.image-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(12px) brightness(0.85);
  transform: scale(1.05);
}

.image-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(17, 24, 39, 0.65);
  color: #fff;
  text-align: center;
  padding: 12px;
  pointer-events: none;
}

.image-mask-icon {
  font-size: 28px;
  color: rgba(255, 255, 255, 0.95);
}

.image-mask-text {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.2px;
}

.image-mask-label {
  font-size: 12px;
  opacity: 0.85;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
}

.card-desc {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 16px;
}

.field-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #9ca3af;
}

.agreement-section {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #4b5563;
  margin: 16px 0;
}

.agreement-link {
  color: #1989fa;
  margin-left: 4px;
}

.submit-btn {
  margin-top: 8px;
}

.privacy-cover {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 0 20px;
  pointer-events: auto;
  text-align: center;
  color: #fff;
}

.privacy-cover-icon {
  color: rgba(255, 255, 255, 0.92);
}

.privacy-cover-title {
  font-size: 16px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.privacy-cover-desc {
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
}

.privacy-cover-btn {
  margin-top: 6px;
  min-width: 200px;
}

:deep(.privacy-preview .van-image-preview__image img) {
  filter: blur(18px) brightness(0.75);
  transform: scale(1.03);
  transition: filter 0.2s ease, transform 0.2s ease;
}

:deep(.privacy-preview.privacy-preview--revealed .van-image-preview__image img) {
  filter: none;
  transform: none;
}

:deep(.privacy-preview .van-image-preview__close-icon) {
  color: rgba(255, 255, 255, 0.85);
}

:deep(.privacy-preview .van-image-preview__index) {
  color: rgba(255, 255, 255, 0.9);
}

:global(.privacy-image-preview .van-image-preview__close-icon) {
  color: rgba(255, 255, 255, 0.85);
}

:global(.privacy-image-preview .van-image-preview__index) {
  color: rgba(255, 255, 255, 0.9);
}
</style>
