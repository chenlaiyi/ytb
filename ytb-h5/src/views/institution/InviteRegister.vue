<template>
  <div class="invite-register">
    <van-nav-bar
      fixed
      placeholder
      safe-area-inset-top
      title="点点够机构认证申请"
      left-arrow
      @click-left="handleBack"
    />

    <div class="invite-register__body">
      <div v-if="loading" class="state-placeholder">
        <van-loading size="24px" type="spinner" />
        <p>正在加载邀请码信息...</p>
      </div>

      <template v-else>
        <div v-if="errorMessage" class="state-placeholder state-placeholder--error">
          <van-icon name="warning-o" size="32" />
          <p>{{ errorMessage }}</p>
          <van-button type="primary" round block @click="reload">
            重新尝试
          </van-button>
        </div>

        <template v-else>
          <section class="invite-summary">
            <div class="invite-summary__badge">
              <van-tag round type="primary">{{ inviteTypeLabel }}</van-tag>
            </div>
            <h2 class="invite-summary__title">
              {{ inviteInfo?.institution?.name || '点点够支付机构' }}
            </h2>
            <p class="invite-summary__subtitle">
              邀请您成为 {{ inviteTypeLabel }}，服务费 {{ priceText }}
            </p>
            <div class="invite-summary__code">
              邀请码：<strong>{{ inviteInfo?.invite?.code }}</strong>
            </div>
          </section>

          <section v-if="!completed" class="form-section">
            <van-form @submit="handleSubmit">
              <van-cell-group inset>
                <van-field
                  v-model="form.name"
                  name="name"
                  label="姓名"
                  placeholder="请输入您的姓名"
                  :rules="[{ required: true, message: '请输入姓名' }]"
                />
                <van-field
                  v-model="form.phone"
                  name="phone"
                  label="手机号"
                  type="tel"
                  placeholder="请输入本人实名手机号"
                  :rules="[
                    { required: true, message: '请输入手机号' },
                    { validator: validatePhone, message: '请输入正确的手机号' }
                  ]"
                />
                <van-field
                  v-model="form.idCard"
                  name="idCard"
                  label="身份证号"
                  placeholder="请输入本人身份证号码"
                  :rules="[
                    { required: true, message: '请输入身份证号' },
                    { validator: validateIdCard, message: '请输入正确的身份证号' }
                  ]"
                />
              </van-cell-group>

              <div class="uploader-section">
                <div class="uploader-field uploader-field--idcard">
                  <div class="uploader-label">
                    身份证照片
                    <span class="uploader-hint">（上传人像面和国徽面）</span>
                  </div>
                  <div class="idcard-uploader-grid">
                    <div class="idcard-uploader-card">
                      <div class="idcard-uploader-title">人像面</div>
                      <van-uploader
                        :max-count="1"
                        :after-read="(payload) => handleUpload('front', payload)"
                        :before-read="beforeRead"
                        :image-fit="'cover'"
                        v-model="frontFileList"
                      />
                    </div>
                    <div class="idcard-uploader-card">
                      <div class="idcard-uploader-title">国徽面</div>
                      <van-uploader
                        :max-count="1"
                        :after-read="(payload) => handleUpload('back', payload)"
                        :before-read="beforeRead"
                        :image-fit="'cover'"
                        v-model="backFileList"
                      />
                    </div>
                  </div>
                </div>
                <div class="uploader-field">
                  <div class="uploader-label">
                    支付凭证
                    <span class="uploader-hint">（支付或转账截图）</span>
                  </div>
                  <van-uploader
                    :max-count="1"
                    :after-read="(payload) => handleUpload('voucher', payload)"
                    :before-read="beforeRead"
                    :image-fit="'cover'"
                    v-model="voucherFileList"
                  />
                </div>
              </div>

              <div class="form-tips">
                <van-icon name="info-o" />
                <span>提交后由平台专员审核，通过后将短信通知您。</span>
              </div>

              <div class="privacy-agreement">
                <van-checkbox v-model="agreePrivacy" icon-size="16px" checked-color="#1989fa">
                  <span class="privacy-text">我已阅读并同意</span>
                  <span class="privacy-link" @click.stop="openPrivacyPolicy">《隐私政策》</span>
                  <span class="privacy-text">，同意平台收集、使用我提交的身份证信息用于机构认证审核</span>
                </van-checkbox>
              </div>

              <div class="form-actions">
                <van-button
                  round
                  block
                  type="primary"
                  native-type="submit"
                  :loading="submitting"
                >
                  提交信息
                </van-button>
              </div>
            </van-form>
          </section>

          <section v-else class="result-section">
            <div class="result-box">
              <van-icon name="success" size="48" color="#07c160" class="result-box__icon" />
              <h3 class="result-box__title">提交成功</h3>
              <p class="result-box__desc">您的资料已提交，我们将尽快审核并联系您。</p>

              <div v-if="successData?.institution" class="result-card">
                <div class="result-card__item">
                  <span class="label">机构名称</span>
                  <span class="value">{{ successData.institution.nickname || successData.institution.name }}</span>
                </div>
                <div class="result-card__item">
                  <span class="label">机构编号</span>
                  <span class="value">{{ successData.institution.number || '待审核' }}</span>
                </div>
                <div class="result-card__item">
                  <span class="label">缴费金额</span>
                  <span class="value">{{ priceText }}</span>
                </div>
              </div>

              <van-button round block type="primary" @click="goToHome">
                返回首页
              </van-button>
            </div>
          </section>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, closeToast, showFailToast, showLoadingToast } from 'vant'
import { commonApi } from '@/api/v1'
import {
  lookupInstitutionInvite,
  submitInstitutionInvite,
  getInviteFollowStatus
} from '@/api/institution'
import { isWechatBrowser } from '@/utils/wechat'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const submitting = ref(false)
const completed = ref(false)
const errorMessage = ref('')

const inviteCode = ref(route.query.invite_code || route.query.code || '')
const inviteInfo = ref(null)
const successData = ref(null)
const inviteWechatOpenId = ref(sessionStorage.getItem('invite_wechat_openid') || '')
const inviteUnionId = ref('')
const followStatusChecked = ref(false)
const inviteEntrySource = ref(sessionStorage.getItem('invite_entry_source') || '')

const backUrlStorageKey = 'invite_register_back_url'

const form = reactive({
  name: '',
  phone: '',
  idCard: '',
  idCardFront: '',
  idCardBack: '',
  paymentVoucher: ''
})

const frontFileList = ref([])
const backFileList = ref([])
const voucherFileList = ref([])
const agreePrivacy = ref(false)  // 隐私政策同意状态

const persistWechatIdentifiers = (openId, unionId) => {
  if (openId) {
    inviteWechatOpenId.value = openId
    try {
      sessionStorage.setItem('invite_wechat_openid', openId)
    } catch (error) {
      console.warn('[InviteRegister] persist openid failed', error)
    }
  }

  if (unionId) {
    inviteUnionId.value = unionId
    try {
      sessionStorage.setItem('invite_wechat_unionid', unionId)
    } catch (error) {
      console.warn('[InviteRegister] persist unionid failed', error)
    }
  }
}

const inviteTypeLabel = computed(() => {
  const type = inviteInfo.value?.invite?.type
  if (type === 'partner') {
    return '合伙人'
  }
  if (type === 'salesman') {
    return '销售经理'
  }
  return '邀请登记'
})

const priceText = computed(() => {
  const type = inviteInfo.value?.invite?.type
  if (type === 'partner') {
    return '￥3,980'
  }
  if (type === 'salesman') {
    return '￥598'
  }
  return '以平台价格为准'
})

const normalizedWechatOpenId = computed(() => inviteWechatOpenId.value || '')
const normalizedUnionId = computed(() => inviteUnionId.value || '')

const beforeRead = (file) => {
  const raw = file instanceof Array ? file[0] : file
  if (!raw || !raw.type) {
    showFailToast('无法读取文件，请重试')
    return false
  }

  if (!raw.type.startsWith('image/')) {
    showFailToast('请上传图片文件')
    return false
  }

  const sizeLimit = 5 * 1024 * 1024
  if (raw.size && raw.size > sizeLimit) {
    showFailToast('图片大小不能超过5MB')
    return false
  }

  return true
}

const validatePhone = (value) => /^1[3-9]\d{9}$/.test(String(value || '').trim())
const validateIdCard = (value) =>
  /^[1-9]\d{5}(18|19|20)?\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(String(value || '').trim())

const extractUploadUrl = (response) => {
  if (!response) return ''
  const candidates = [
    response?.data?.full_url,
    response?.data?.fullUrl,
    response?.data?.url,
    response?.data?.path,
    response?.url,
    response?.path
  ]
  return candidates.find((item) => typeof item === 'string' && item) || ''
}

const handleUpload = async (field, payload) => {
  const files = Array.isArray(payload) ? payload : [payload]

  for (const item of files) {
    const rawFile = item?.file || item
    if (!rawFile) {
      showFailToast('无法读取文件，请重试')
      continue
    }

    let loadingToast
    try {
      loadingToast = showLoadingToast({
        message: '上传中...',
        forbidClick: true,
        duration: 0
      })

      const response = await commonApi.upload.image(rawFile)
      const url = extractUploadUrl(response)
      if (!url) {
        throw new Error('上传失败，请稍后重试')
      }

      if (field === 'front') {
        form.idCardFront = url
        frontFileList.value = [{ url, isImage: true }]
      } else if (field === 'back') {
        form.idCardBack = url
        backFileList.value = [{ url, isImage: true }]
      } else if (field === 'voucher') {
        form.paymentVoucher = url
        voucherFileList.value = [{ url, isImage: true }]
      }
      showToast('上传成功')
    } catch (error) {
      console.error('[InviteRegister] 上传失败', error)
      showFailToast(error?.message || '上传失败，请稍后重试')
    } finally {
      if (loadingToast) {
        closeToast()
      }
    }
  }
}

const loadInvite = async () => {
  if (!inviteCode.value) {
    errorMessage.value = '缺少邀请码参数'
    loading.value = false
    return false
  }

  try {
    const res = await lookupInstitutionInvite({ invite_code: inviteCode.value })
    if (isSuccessResponse(res)) {
      inviteInfo.value = res.data || {}
      const followQr = res.data?.wechat_follow_qr?.url || ''
      const followTicket = res.data?.wechat_follow_qr?.ticket || ''
      if (followQr) {
        sessionStorage.setItem('invite_follow_qr', followQr)
      }
      if (followTicket) {
        sessionStorage.setItem('invite_follow_ticket', followTicket)
      }
      loading.value = false
      return true
    }

    errorMessage.value = res?.message || '邀请码无效或已失效'
  } catch (error) {
    console.error('[InviteRegister] lookup failed', error)
    errorMessage.value = error?.message || '加载邀请码信息失败'
  } finally {
    loading.value = false
  }

  return false
}

const validateForm = () => {
  if (!form.name.trim()) {
    showFailToast('请输入姓名')
    return false
  }
  if (!validatePhone(form.phone)) {
    showFailToast('请输入正确的手机号')
    return false
  }
  if (!validateIdCard(form.idCard)) {
    showFailToast('请输入正确的身份证号')
    return false
  }
  if (!form.idCardFront) {
    showFailToast('请上传身份证正面照片')
    return false
  }
  if (!form.idCardBack) {
    showFailToast('请上传身份证反面照片')
    return false
  }
  if (!form.paymentVoucher) {
    showFailToast('请上传支付凭证')
    return false
  }
  if (!agreePrivacy.value) {
    showFailToast('请阅读并同意隐私政策')
    return false
  }
  return true
}

// 打开隐私政策
const openPrivacyPolicy = () => {
  router.push('/user/settings/privacy-policy')
}

const handleSubmit = async () => {
  if (submitting.value) return
  if (!validateForm()) return

  if (isWechatBrowser() && (!normalizedWechatOpenId.value || !normalizedUnionId.value)) {
    showFailToast('获取微信授权信息失败，请刷新后重试')
    return
  }

  submitting.value = true
  try {
    const res = await submitInstitutionInvite({
      invite_code: inviteCode.value,
      name: form.name.trim(),
      phone: form.phone.trim(),
      id_card: form.idCard.trim().toUpperCase(),
      id_card_front: form.idCardFront,
      id_card_back: form.idCardBack,
      payment_voucher: form.paymentVoucher,
      wechat_openid: normalizedWechatOpenId.value,
      wechat_unionid: normalizedUnionId.value
    })

    if (isSuccessResponse(res)) {
      successData.value = res.data || null
      completed.value = true
      showToast('提交成功')
    } else {
      const message = res?.message || '提交失败，请稍后重试'
      showFailToast(message)
    }
  } catch (error) {
    console.error('[InviteRegister] submit failed', error)
    showFailToast(error?.response?.data?.message || error?.message || '提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

const handleBack = () => {
  if (router.options.history.state?.back) {
    router.back()
  } else {
    router.replace('/')
  }
}

const reload = () => {
  loading.value = true
  errorMessage.value = ''
  loadInvite()
}

const goToHome = () => {
  router.replace('/')
}

const redirectToAuthIfNeeded = () => {
  if (!isWechatBrowser()) {
    return
  }

  if (route.query.entry) {
    inviteEntrySource.value = route.query.entry
    try {
      sessionStorage.setItem('invite_entry_source', route.query.entry)
    } catch (error) {
      console.warn('[InviteRegister] cache entry source failed', error)
    }
  }

  const hasOpenId = Boolean(normalizedWechatOpenId.value)
  const fromMpEntry = route.query.entry === 'mp' || inviteEntrySource.value === 'mp'
  const followConfirmed = sessionStorage.getItem('invite_follow_confirmed') === '1'

  if (hasOpenId || fromMpEntry || followConfirmed) {
    return
  }

  const currentUrl = `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`
  try {
    sessionStorage.setItem(backUrlStorageKey, currentUrl)
  } catch (error) {
    console.warn('[InviteRegister] store back url failed', error)
  }
  const query = {}
  if (inviteCode.value) {
    query.invite_code = inviteCode.value
  }
  if (route.query.type) {
    query.type = route.query.type
  }
  if (route.query.entry) {
    query.entry = route.query.entry
  } else if (inviteEntrySource.value) {
    query.entry = inviteEntrySource.value
  }
  if (route.query.ticket) {
    query.ticket = route.query.ticket
  } else {
    const storedTicket = sessionStorage.getItem('invite_wechat_ticket')
    if (storedTicket) {
      query.ticket = storedTicket
    }
  }
  const followQr = sessionStorage.getItem('invite_follow_qr') || route.query.qr || ''
  if (followQr) {
    query.qr = followQr
  }
  query.back = currentUrl

  router.replace({
    name: 'InstitutionInviteAuth',
    query
  })
}

onMounted(async () => {
  restoreWechatIdentifiers()
  const inviteLoaded = await loadInvite()
  if (!inviteLoaded) {
    return
  }
  const followAllowed = await ensureFollowStatus()
  if (!followAllowed) {
    return
  }
  redirectToAuthIfNeeded()
})

function isSuccessResponse(res) {
  return res && (res.code === 0 || res.code === '0' || res.success === true)
}

function restoreWechatIdentifiers() {
  try {
    const storedUser = sessionStorage.getItem('invite_wechat_user')
    if (storedUser) {
      const parsed = JSON.parse(storedUser)
      const resolve = (payload, keys) =>
        (keys
          .map((key) => (typeof key === 'string' ? payload?.[key] : undefined))
          .find((val) => typeof val === 'string' && val.trim()) || '')
          .trim()

      inviteWechatOpenId.value =
        resolve(parsed, ['openid', 'openId', 'open_id']) ||
        resolve(parsed?.wechat_user || {}, ['openid', 'openId']) ||
        resolve(parsed?.wechatUser || {}, ['openid', 'openId']) ||
        resolve(parsed?.user || {}, ['openid', 'wechat_openid'])

      inviteUnionId.value =
        resolve(parsed, ['unionid', 'unionId', 'union_id']) ||
        resolve(parsed?.wechat_user || {}, ['unionid', 'unionId', 'union_id']) ||
        resolve(parsed?.wechatUser || {}, ['unionid', 'unionId', 'union_id']) ||
        resolve(parsed?.user || {}, ['unionid', 'unionId', 'wechat_unionid'])
    }
    const storedUnionId = sessionStorage.getItem('invite_wechat_unionid')
    if (storedUnionId && !inviteUnionId.value) {
      inviteUnionId.value = storedUnionId
    }
    inviteEntrySource.value = sessionStorage.getItem('invite_entry_source') || inviteEntrySource.value
  } catch (error) {
    console.warn('[InviteRegister] restore identifiers failed', error)
  }
}

async function ensureFollowStatus() {
  if (!isWechatBrowser()) {
    followStatusChecked.value = true
    return true
  }

  if (!inviteCode.value) {
    followStatusChecked.value = true
    return true
  }

  const storedTicket = sessionStorage.getItem('invite_wechat_ticket') || ''

  if (!normalizedWechatOpenId.value && !storedTicket && !(route.query.ticket || '')) {
    followStatusChecked.value = true
    return true
  }

  if (route.query.entry === 'mp' || inviteEntrySource.value === 'mp') {
    sessionStorage.setItem('invite_follow_confirmed', '1')
    if (route.query.entry === 'mp') {
      sessionStorage.setItem('invite_entry_source', 'mp')
      inviteEntrySource.value = 'mp'
    }
    followStatusChecked.value = true
    return true
  }

  const confirmed = sessionStorage.getItem('invite_follow_confirmed') === '1'
  if (confirmed) {
    followStatusChecked.value = true
    return true
  }

  try {
    const response = await getInviteFollowStatus({
      invite_code: inviteCode.value,
      wechat_openid: normalizedWechatOpenId.value || undefined,
      ticket: storedTicket || route.query.ticket || undefined
    })

    if (isSuccessResponse(response)) {
      const data = response.data || {}

      if (data.wechat_openid && !normalizedWechatOpenId.value) {
        persistWechatIdentifiers(data.wechat_openid, data.wechat_unionid)
      } else if (data.wechat_unionid && !inviteUnionId.value) {
        persistWechatIdentifiers(undefined, data.wechat_unionid)
      }

      if (data.followed) {
        sessionStorage.setItem('invite_follow_confirmed', '1')
        sessionStorage.setItem('invite_entry_source', 'mp')
        inviteEntrySource.value = 'mp'
        followStatusChecked.value = true
        return true
      }
    }
  } catch (error) {
    console.warn('[InviteRegister] follow status check failed', error)
  }

  followStatusChecked.value = true
  const hasIdentityHint =
    Boolean(normalizedWechatOpenId.value) ||
    Boolean(sessionStorage.getItem('invite_wechat_ticket')) ||
    Boolean(sessionStorage.getItem('invite_wechat_unionid'))

  if (hasIdentityHint) {
    showFailToast('尚未检测到关注记录，请关注“点点够”公众号后继续')
  }

  return true
}
</script>

<style scoped>
.invite-register {
  min-height: 100vh;
  background: linear-gradient(180deg, #f6faff 0%, #ffffff 100%);
}

.invite-register__body {
  padding: 16px;
  padding-bottom: 48px;
}

.state-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 16px;
  color: #666;
  gap: 12px;
  text-align: center;
}

.state-placeholder--error {
  gap: 16px;
}

.invite-summary {
  text-align: center;
  padding: 24px 16px;
  border-radius: 16px;
  background: linear-gradient(180deg, #1a68ff 0%, #4f8dff 100%);
  color: #fff;
  box-shadow: 0 12px 24px rgba(26, 104, 255, 0.15);
  margin-bottom: 20px;
}

.invite-summary__badge {
  margin-bottom: 12px;
}

.invite-summary__title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.invite-summary__subtitle {
  margin: 8px 0 16px;
  font-size: 14px;
  opacity: 0.85;
}

.invite-summary__code {
  font-size: 16px;
  font-weight: 500;
}

.form-section {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(20, 31, 62, 0.08);
  padding: 16px 0 4px;
}

.uploader-section {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding: 0 16px;
  margin-top: 8px;
}

.uploader-field {
  background: #f7f8fc;
  border-radius: 12px;
  padding: 12px;
}

.uploader-field--idcard {
  background: linear-gradient(180deg, #f7f8fc 0%, #ffffff 100%);
  box-shadow: 0 8px 24px rgba(20, 31, 62, 0.08);
}

.idcard-uploader-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.idcard-uploader-card {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(26, 40, 91, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.idcard-uploader-title {
  font-size: 13px;
  font-weight: 600;
  color: #1a2b6d;
}

.uploader-label {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.uploader-hint {
  font-size: 12px;
  color: #999;
  font-weight: 400;
}

.form-tips {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #576b95;
  font-size: 12px;
  padding: 16px 16px 0;
}

.privacy-agreement {
  margin: 16px 16px 0;
  padding: 12px;
  background: #fff8f8;
  border: 1px solid rgba(26, 104, 255, 0.2);
  border-radius: 8px;
}

.privacy-agreement .privacy-text {
  color: #666;
  font-size: 12px;
}

.privacy-agreement .privacy-link {
  color: #1989fa;
  font-size: 12px;
  cursor: pointer;
}

.privacy-agreement .privacy-link:active {
  opacity: 0.7;
}

.form-actions {
  padding: 16px;
}

.result-section {
  margin-top: 16px;
}

.result-box {
  background: #fff;
  border-radius: 16px;
  padding: 32px 20px;
  box-shadow: 0 12px 28px rgba(20, 31, 62, 0.12);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-box__title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #111;
}

.result-box__desc {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.result-box__icon {
  align-self: center;
}

.result-card {
  background: #f7f8fc;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.result-card__item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  padding: 6px 0;
}

.result-card__item .label {
  color: #666;
}

.result-card__item .value {
  font-weight: 600;
  color: #111;
}

@media (min-width: 768px) {
  .invite-register__body {
    max-width: 480px;
    margin: 0 auto;
  }

  .uploader-section {
    grid-template-columns: 1fr;
  }
}
</style>
