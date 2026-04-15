<template>
  <div class="merchant-onboarding-form">
    <van-nav-bar
      :title="merchantFlowTitle"
      left-text="返回"
      fixed
      placeholder
      left-arrow
      @click-left="handleBack"
    />

    <div class="merchant-onboarding-form__body">
      <section class="form-step-header">
        <van-steps :active="activeStep" active-color="#ff2d55" inactive-color="#d7d7d7">
          <van-step v-for="step in steps" :key="step.title">{{ step.title }}</van-step>
        </van-steps>
      </section>

      <!-- 法人资料（小微可与基本信息合并） -->
      <section v-if="showLegalSection" class="form-section">
        <header class="section-title">
          <span>法人资料</span>
          <small v-if="isMicroType && showBasicSection">先上传身份证正反面，系统会根据识别结果自动填写姓名与地址</small>
          <small v-else>上传法人证件并完善联系方式</small>
        </header>

        <div class="photo-grid small">
          <div
            v-for="item in legalPhotoFields"
            :key="item.key"
            class="photo-grid__item"
          >
            <UploadCard
              :variant="item.key"
              :placeholder-icon="item.icon"
              :label="item.label"
              :file-list="uploadLists[item.key]"
              @upload="(payload) => handleUpload(item.key, payload)"
              @remove="() => handleRemoveUpload(item.key)"
            />
          </div>
        </div>

        <van-cell-group inset>
          <van-field
            v-model="form.legal.legalName"
            :label="legalNameLabel"
            placeholder="请输入证件姓名"
            maxlength="20"
            required
          />
          <van-field
            v-model="form.legal.legalIdNumber"
            :label="legalIdLabel"
            placeholder="上传证件后自动识别"
            maxlength="20"
            required
          />
          <van-field
            v-model="form.legal.contactPhone"
            :label="legalPhoneLabel"
            placeholder="请输入法人联系电话"
            maxlength="20"
            required
          />
          <van-field
            :model-value="legalIdExpiryDisplay"
            label="证件有效期"
            readonly
            is-link
            placeholder="请选择证件有效期"
            @click="legalCalendarVisible = true"
          />
          <van-field
            :model-value="legalIdTypeLabel"
            label="证件类型"
            readonly
            is-link
            :required="isMicroType"
            placeholder="请选择证件类型"
            @click="legalIdTypePickerVisible = true"
          />
        </van-cell-group>
      </section>

      <!-- 基本资料 -->
      <section v-if="showBasicSection" class="form-section">
        <header class="section-title section-title--center">
          <span>基本资料</span>
          <div class="section-title__divider" />
        </header>

        <div class="photo-grid photo-grid--basic">
          <div
            v-for="item in basicPhotoFields"
            :key="item.key"
            class="photo-grid__item"
          >
            <UploadCard
              :variant="item.key"
              :placeholder-icon="item.icon"
              :label="item.label"
              :hint="item.hint"
              :file-list="uploadLists[item.key]"
              @upload="(payload) => handleUpload(item.key, payload)"
              @remove="() => handleRemoveUpload(item.key)"
            />
          </div>
        </div>

        <van-cell-group class="basic-info-fields" inset>
          <van-field
            :model-value="merchantTypeLabel"
            label="进件类型"
            readonly
            disabled
          />
          <van-field
            v-model="form.inviteCode"
            label="邀请码"
            placeholder="请输入或确认业务员邀请码"
            maxlength="64"
            required
            clearable
            :right-icon="inviteCodeRightIcon"
            :error-message="inviteCodeErrorMessage"
          >
            <template v-if="inviteCodeHint" #message>
              <span
                class="field-hint"
                :class="{
                  'field-hint--success': inviteCodeState.status === 'success',
                  'field-hint--loading': inviteCodeState.status === 'checking'
                }"
              >
                {{ inviteCodeHint }}
              </span>
            </template>
          </van-field>
          <van-field
            v-model="form.basic.merchantName"
            label="商户名称"
            :placeholder="isMicroType ? '身份证识别后自动生成' : '上传营业执照后将自动识别'"
            maxlength="60"
            required
          />
          <van-field
            v-model="form.basic.merchantShortName"
            label="商户简称"
            placeholder="用于终端展示，可与门店一致"
            maxlength="30"
          />
          <van-field
            v-if="!isMicroType"
            v-model="form.basic.licenseNumber"
            label="营业执照编号"
            placeholder="上传证件后自动识别"
            maxlength="30"
            required
          />
          <van-field
            v-if="!isMicroType"
            :model-value="licenseExpiryDisplay"
            readonly
            is-link
            label="营业执照有效期"
            placeholder="请选择有效期或永久"
            @click="licenseCalendarVisible = true"
          />
          <van-field
            v-model="form.basic.industry"
            readonly
            is-link
            label="行业类别"
            placeholder="请选择行业类别"
            required
            @click="industryPickerVisible = true"
          />
          <van-field
            :model-value="basicRegionDisplay"
            readonly
            is-link
            label="所在地区"
            placeholder="请选择省市区"
            required
            @click="areaPickerVisible = true"
          />
          <van-field
            v-model="form.basic.address"
            label="详细地址"
            placeholder="请输入详细地址（街道/门牌号）"
            maxlength="120"
            required
          />
          <van-field
            v-model="form.basic.contactPhone"
            label="客服电话"
            placeholder="请输入客服电话或联系人手机号"
            maxlength="20"
          />
          <van-field
            v-model="form.basic.remark"
            label="备注"
            type="textarea"
            rows="2"
            maxlength="120"
            placeholder="可补充经营场景、特色等信息"
          />
        </van-cell-group>
      </section>

      <!-- 结算账户 -->
      <section v-if="showSettlementSection" class="form-section">
        <header class="section-title">
          <span>结算账户</span>
          <small>确认结算银行卡或对公账户信息</small>
        </header>

        <div class="account-type-selector">
          <div class="account-type-selector__label">请选择账户类型</div>
          <div class="account-type-selector__chips">
            <button
              v-for="option in accountTypeOptions"
              :key="option.value"
              type="button"
              class="account-type-chip"
              :class="{ active: form.settlement.accountType === option.value }"
              @click="handleSelectAccountType(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="certificate-upload-grid">
          <div
            v-for="item in settlementCertificateFields"
            :key="item.key"
            class="certificate-upload"
          >
            <div class="certificate-upload__title">{{ item.title }}</div>
            <p class="certificate-upload__desc">{{ item.desc }}</p>
            <van-uploader
              :file-list="uploadLists[item.key]"
              :max-count="1"
              accept="image/*"
              :preview-full-image="true"
            :after-read="(payload) => handleUpload(item.key, payload)"
            @delete="handleRemoveUpload(item.key)"
          >
            <div
              class="certificate-upload__placeholder"
              v-if="!(uploadLists[item.key] && uploadLists[item.key].length)"
            >
              <van-icon :name="item.icon" size="28" />
              <span>{{ item.button }}</span>
            </div>
          </van-uploader>
            <div
              v-if="uploadLists[item.key] && uploadLists[item.key].length"
              class="certificate-upload__preview"
            >
              <img
                v-if="uploadLists[item.key][0]?.url"
                :src="uploadLists[item.key][0].url"
                alt="银行卡预览"
              />
            </div>
        </div>
        </div>

        <van-cell-group inset>
          <van-field
            v-model="form.settlement.accountName"
            label="结算账户名"
            placeholder="请输入开户名"
            maxlength="60"
            required
          />
          <van-field
            v-model="form.settlement.accountNumber"
            label="结算账号"
            placeholder="请输入银行卡或对公账号"
            maxlength="30"
            required
          />
          <van-field
            v-model="form.settlement.bankName"
            label="开户银行"
            placeholder="请选择开户银行"
            readonly
            is-link
            required
            @click="bankPickerVisible = true"
          />
          <van-field
            :model-value="form.settlement.bankRegion.province"
            label="开户行省份"
            placeholder="请选择开户行所在省"
            readonly
            is-link
            required
            @click="bankAreaPickerVisible = true"
          />
          <van-field
            :model-value="form.settlement.bankRegion.city"
            label="开户行城市"
            placeholder="请选择开户行所在市"
            readonly
            is-link
            required
            @click="bankAreaPickerVisible = true"
          />
          <van-field
            v-model="form.settlement.bankBranch"
            label="开户支行"
            placeholder="请输入开户支行或网点"
            maxlength="120"
          />
          <template v-if="isMicroType">
            <van-field
              :model-value="cardholderIdTypeLabel"
              label="持卡人证件类型"
              readonly
              is-link
              placeholder="请选择证件类型"
              @click="cardholderIdTypePickerVisible = true"
            />
            <van-field
              v-model="form.settlement.cardholderIdNumber"
              label="持卡人证件号"
              placeholder="请输入持卡人证件号"
              maxlength="30"
              required
            />
            <van-field
              v-model="form.settlement.cardholderPhone"
              label="持卡人手机号"
              placeholder="请输入持卡人手机号"
              maxlength="20"
              required
            />
            <van-field
              v-model="form.settlement.cardholderAddress"
              label="持卡人地址"
              type="textarea"
              rows="2"
              maxlength="120"
              placeholder="请输入持卡人常驻地址"
              required
            />
          </template>
        </van-cell-group>
      </section>

      <!-- 产品签约 -->
      <section v-if="showProductSection" class="form-section">
        <header class="section-title">
          <span>产品签约</span>
          <small>选择拟开通的支付产品并确认费率</small>
        </header>

        <div class="product-fee-card">
          <h3 class="product-fee-card__title">开通聚合支付费率</h3>
          <ul class="product-fee-card__list">
            <li v-for="product in productDisplayList" :key="product.value" class="product-fee-card__item">
              <div class="product-fee-card__icon" :style="{ background: product.bg }">
                <span>{{ product.short }}</span>
              </div>
              <div class="product-fee-card__meta">
                <p class="product-fee-card__name">{{ product.title }}</p>
                <p class="product-fee-card__rate">{{ product.rate }}</p>
              </div>
            </li>
          </ul>
        </div>

        <div class="authorization-upload" v-if="showAuthorizationUpload">
          <div class="authorization-upload__header">
            <span>签约授权书（选填）</span>
            <small>如由代理人办理，请上传授权文件</small>
          </div>
          <van-uploader
            :file-list="uploadLists.product_contract"
            :max-count="1"
            accept="image/*"
            :preview-full-image="true"
            :after-read="(payload) => handleUpload('product_contract', payload)"
            @delete="handleRemoveUpload('product_contract')"
          >
            <div class="authorization-upload__placeholder">
              <van-icon name="description" size="24" />
              <span>上传授权书</span>
            </div>
          </van-uploader>
        </div>

        <div class="agreements-block">
          <van-checkbox v-model="form.agreements.acceptFeeAgreement">
            我已确认费率并确保上述资料真实有效
          </van-checkbox>
        </div>
        <div class="agreements-block privacy-agreement">
          <van-checkbox v-model="form.agreements.acceptPrivacyPolicy" icon-size="16px">
            <span class="privacy-text">我已阅读并同意</span>
            <span class="privacy-link" @click.stop="openPrivacyPolicy">《隐私政策》</span>
            <span class="privacy-text">，同意平台收集、使用我提交的身份证、银行卡等信息用于商户进件审核</span>
          </van-checkbox>
        </div>
      </section>
    </div>

    <div class="merchant-onboarding-form__actions">
      <van-button
        v-if="activeStep > 0"
        type="primary"
        plain
        class="action-button"
        @click="goPrevStep"
      >
        上一步
      </van-button>

      <van-button
        type="primary"
        round
        class="action-button"
        :loading="submitLoading"
        @click="handleNextOrSubmit"
      >
        {{ activeStep === steps.length - 1 ? '提交进件' : '下一步' }}
      </van-button>
    </div>

    <!-- 行业选择 -->
    <van-popup v-model:show="industryPickerVisible" position="bottom" round>
      <van-picker
        title="选择行业类别"
        :columns="industryOptions"
        @confirm="onIndustryConfirm"
        @cancel="industryPickerVisible = false"
      />
    </van-popup>

    <!-- 地区选择 -->
    <van-popup v-model:show="areaPickerVisible" position="bottom" round>
      <van-area
        :area-list="areaList"
        title="所在地区"
        @confirm="onAreaConfirm"
        @cancel="areaPickerVisible = false"
      />
    </van-popup>

    <!-- 银行省市选择 -->
    <van-popup v-model:show="bankAreaPickerVisible" position="bottom" round>
      <van-area
        :area-list="areaList"
        title="开户行省市"
        :columns-num="2"
        @confirm="onBankAreaConfirm"
        @cancel="bankAreaPickerVisible = false"
      />
    </van-popup>

    <!-- 银行选择 -->
    <van-popup v-model:show="bankPickerVisible" position="bottom" round>
      <van-picker
        title="选择开户银行"
        :columns="bankOptions"
        @confirm="onBankConfirm"
        @cancel="bankPickerVisible = false"
      />
    </van-popup>

    <!-- 法人证件类型选择 -->
    <van-popup v-model:show="legalIdTypePickerVisible" position="bottom" round>
      <van-picker
        title="选择证件类型"
        :columns="idTypeOptions"
        @confirm="onLegalIdTypeConfirm"
        @cancel="legalIdTypePickerVisible = false"
      />
    </van-popup>

    <!-- 持卡人证件类型选择 -->
    <van-popup v-model:show="cardholderIdTypePickerVisible" position="bottom" round>
      <van-picker
        title="选择证件类型"
        :columns="idTypeOptions"
        @confirm="onCardholderIdTypeConfirm"
        @cancel="cardholderIdTypePickerVisible = false"
      />
    </van-popup>

    <!-- 有效期 -->
    <van-calendar
      v-model:show="licenseCalendarVisible"
      title="营业执照有效期"
      :min-date="minLicenseDate"
      :max-date="maxLicenseDate"
      color="#ff2d55"
      @confirm="onLicenseDateConfirm"
    />

    <van-calendar
      v-model:show="legalCalendarVisible"
      title="证件有效期"
      :min-date="minLegalDate"
      :max-date="maxLegalDate"
      color="#ff2d55"
      @confirm="onLegalDateConfirm"
    />
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast, showFailToast, showDialog } from 'vant'
import { areaList } from '@vant/area-data'
import { submitMerchantOnboarding, checkSalesmanInviteCode, auditOnboardingAttachment } from '@/api/merchant'
import { commonApi } from '@/api/v1'
import { analyzeBusinessLicenseOcr, analyzeIdCardOcr, analyzeBankCardOcr, analyzeAccountPermitOcr } from '@/api/institution'
import UploadCard from './components/UploadCard.vue'

const route = useRoute()
const router = useRouter()

const normalizeRegionName = (name = '') =>
  name
    .replace(/(壮族自治区|回族自治区|维吾尔自治区|自治区|特别行政区|地区|盟|自治州|省|市)$/gu, '')
    .trim()

const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const sanitizeAddressWithoutRegion = (address = '', region = {}) => {
  if (!address) return ''
  let cleaned = address
  const regionNames = [region.province, region.city, region.district]
    .filter(Boolean)
    .flatMap((name) => [name, normalizeRegionName(name)])
    .filter(Boolean)

  regionNames.forEach((name) => {
    const pattern = new RegExp(escapeRegExp(name), 'g')
    cleaned = cleaned.replace(pattern, '')
  })

  cleaned = cleaned.replace(/[省市区县自治区特别行政区]/g, '')
  cleaned = cleaned.replace(/^[\s,，]+|[\s,，]+$/g, '')
  const trimmed = cleaned.trim()
  return trimmed || address.trim()
}

const matchAreaFromAddress = (address = '', entries = []) => {
  if (!address) return null
  const normalizedAddress = address.replace(/\s+/g, '')
  for (const [code, rawName] of entries) {
    const candidates = [rawName, normalizeRegionName(rawName)].map((item) => item.replace(/\s+/g, ''))
    if (candidates.some((candidate) => candidate && normalizedAddress.includes(candidate))) {
      return { code, name: rawName }
    }
  }
  return null
}

const detectRegionFromAddress = (address = '') => {
  if (!address) return null
  const provinceEntries = Object.entries(areaList.province_list || {})
  const cityEntries = Object.entries(areaList.city_list || {})
  const countyEntries = Object.entries(areaList.county_list || {})

  const provinceMatch = matchAreaFromAddress(address, provinceEntries)
  if (!provinceMatch) {
    return null
  }

  const provinceCodePrefix = provinceMatch.code.slice(0, 2)
  const scopedCityEntries = cityEntries.filter(([code]) => code.startsWith(provinceCodePrefix))
  const cityMatch = matchAreaFromAddress(address, scopedCityEntries)

  let districtMatch = null
  if (cityMatch) {
    districtMatch = matchAreaFromAddress(
      address,
      countyEntries.filter(([code]) => code.startsWith(cityMatch.code.slice(0, 4)))
    )
  }

  return {
    province: provinceMatch.name,
    city: cityMatch?.name || '',
    district: districtMatch?.name || ''
  }
}

const productOptions = [
  {
    value: 'UNIONPAY',
    title: '云闪付及银行码',
    rate: '1000元以下 0.38%，1000元以上 0.6%',
    desc: '支持云闪付、银行 App 扫码等场景',
    short: '银',
    bg: 'linear-gradient(135deg, #ffb347 0%, #ffcc33 100%)'
  },
  {
    value: 'WECHAT',
    title: '微信支付',
    rate: '费率 0.38%',
    desc: '覆盖公众号、小程序、扫码等渠道收款',
    short: '微',
    bg: 'linear-gradient(135deg, #00c851 0%, #00b94f 100%)'
  },
  {
    value: 'ALIPAY',
    title: '支付宝',
    rate: '费率 0.38%',
    desc: '支持花呗、扫码及 App 支付',
    short: '支',
    bg: 'linear-gradient(135deg, #4facfe 0%, #00c6fb 100%)'
  }
]

const industryOptions = [
  '餐饮美食',
  '休闲娱乐',
  '商超零售',
  '生活服务',
  '教育培训',
  '旅游酒店',
  '医疗健康',
  '美容美业',
  '交通出行',
  '电商平台'
].map((text) => ({ text, value: text }))

const bankOptions = [
  '中国工商银行',
  '中国农业银行',
  '中国银行',
  '中国建设银行',
  '交通银行',
  '中国邮政储蓄银行',
  '招商银行',
  '浦发银行',
  '中信银行',
  '光大银行',
  '华夏银行',
  '民生银行',
  '广发银行',
  '平安银行',
  '兴业银行'
].map((text) => ({ text, value: text }))

const PHOTO_AUDIT_FIELDS = new Set(['handheld_id', 'storefront', 'cashier', 'indoor'])
const PHOTO_FIELD_LABELS = {
  handheld_id: '手持身份证照片',
  storefront: '门头照片',
  cashier: '法人与收银台合照',
  indoor: '店内场景照片'
}
const FORM_STORAGE_VERSION = 'v1'

const initialType = String(route.query.type || '').toLowerCase()
const merchantType = ref(['enterprise', 'individual', 'micro'].includes(initialType) ? initialType : 'enterprise')

const initialAccountType = merchantType.value === 'micro' ? 'personal' : 'enterprise'

const form = reactive({
  merchantType: merchantType.value,
  inviteCode: (route.query.invite_code && String(route.query.invite_code)) || '',
  basic: {
    merchantName: '',
    merchantShortName: '',
    licenseNumber: '',
    licenseExpiry: '',
    licenseValidFrom: '',
    licenseValidTo: '',
    industry: '',
    region: {
      province: '',
      city: '',
      district: ''
    },
    address: '',
    contactPhone: '',
    remark: ''
  },
  legal: {
    legalName: '',
    legalIdNumber: '',
    contactPhone: '',
    idExpiry: '',
    idValidFrom: '',
    idType: 'ID_CARD'
  },
  settlement: {
    accountType: initialAccountType,
    accountName: '',
    accountNumber: '',
    bankName: '',
    bankRegion: {
      province: '',
      city: ''
    },
    bankBranch: '',
    cardholderIdType: 'ID_CARD',
    cardholderIdNumber: '',
    cardholderPhone: '',
    cardholderAddress: ''
  },
  product: {
    selectedProducts: productOptions.map((item) => item.value)
  },
  attachments: {
    business_license: '',
    handheld_id: '',
    storefront: '',
    cashier: '',
    indoor: '',
    legal_id_front: '',
    legal_id_back: '',
    account_permit: '',
    product_contract: ''
  },
  agreements: {
    acceptFeeAgreement: false,
    acceptPrivacyPolicy: false
  }
})

const uploadLists = reactive({
  business_license: [],
  handheld_id: [],
  storefront: [],
  cashier: [],
  indoor: [],
  legal_id_front: [],
  legal_id_back: [],
  account_permit: [],
  product_contract: []
})

const formStorageKey = `merchant/onboarding/${form.merchantType || 'default'}/${FORM_STORAGE_VERSION}`
let formPersistTimer = null

const mergeReactiveObject = (target, source) => {
  if (!source || typeof source !== 'object') {
    return
  }
  Object.keys(source).forEach((key) => {
    const value = source[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = Array.isArray(value) ? [] : {}
      }
      mergeReactiveObject(target[key], value)
    } else {
      target[key] = value
    }
  })
}

const restoreFormState = () => {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(formStorageKey)
    if (!raw) return
    const snapshot = JSON.parse(raw)
    if (snapshot.form) {
      mergeReactiveObject(form, snapshot.form)
    }
    if (snapshot.uploadLists) {
      mergeReactiveObject(uploadLists, snapshot.uploadLists)
    }
  } catch (error) {
    console.info('恢复进件缓存失败', error)
  }
}

const persistFormState = () => {
  if (typeof window === 'undefined') return
  try {
    const payload = {
      form: JSON.parse(JSON.stringify(form)),
      uploadLists: JSON.parse(JSON.stringify(uploadLists)),
      timestamp: Date.now()
    }
    window.localStorage.setItem(formStorageKey, JSON.stringify(payload))
  } catch (error) {
    console.info('缓存进件表单失败', error)
  }
}

const schedulePersistFormState = () => {
  if (typeof window === 'undefined') return
  if (formPersistTimer) {
    clearTimeout(formPersistTimer)
  }
  formPersistTimer = setTimeout(persistFormState, 800)
}

const clearFormState = () => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(formStorageKey)
  } catch (error) {
    console.info('清理进件缓存失败', error)
  }
}

if (typeof window !== 'undefined') {
  restoreFormState()
}

const inviteCodeState = reactive({
  status: 'idle',
  message: ''
})
const lastValidatedInviteCode = ref('')
let inviteCodeDebounceTimer = null

const temporaryPreviewBuckets = new Map()

const registerTemporaryPreview = (field, url) => {
  if (!url) return
  const list = temporaryPreviewBuckets.get(field) || []
  list.push(url)
  temporaryPreviewBuckets.set(field, list)
}

const revokeTemporaryPreviews = (field) => {
  const list = temporaryPreviewBuckets.get(field)
  if (!list || !list.length) return
  list.forEach((url) => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  })
  temporaryPreviewBuckets.delete(field)
}

const isMicroType = computed(() => form.merchantType === 'micro')

const STEP_CONFIGS = {
  basic: { title: '基本资料' },
  legal: { title: '法人资料' },
  settlement: { title: '结算账户' },
  product: { title: '产品签约' },
  basic_legal: { title: '身份证与基本资料' }
}

const DEFAULT_STEP_KEYS = ['basic', 'legal', 'settlement', 'product']
const MICRO_STEP_KEYS = ['basic_legal', 'settlement', 'product']

const idTypeOptions = [
  { text: '大陆身份证', value: 'ID_CARD' },
  { text: '护照', value: 'PASSPORT' },
  { text: '港澳居民来往内地通行证', value: 'HKM_TRAVEL' },
  { text: '台湾居民来往大陆通行证', value: 'TAIWAN_TRAVEL' }
]

const idTypeLabelMap = idTypeOptions.reduce((acc, cur) => {
  acc[cur.value] = cur.text
  return acc
}, {})

const legalIdTypeLabel = computed(() => idTypeLabelMap[form.legal.idType] || '证件类型')
const cardholderIdTypeLabel = computed(() => idTypeLabelMap[form.settlement.cardholderIdType] || '证件类型')

const defaultBasicPhotoFields = [
  { key: 'business_license', label: '营业执照', hint: '务必清晰可见', icon: 'photograph' },
  { key: 'storefront', label: '门头照片', hint: '需展示完整招牌', icon: 'shop' },
  { key: 'cashier', label: '收银台照', hint: '需包含收银设备', icon: 'logistics' },
  { key: 'indoor', label: '经营场景', hint: '可上传多张场景图', icon: 'smile' }
]

const microBasicPhotoFields = [
  { key: 'handheld_id', label: '手持证件半身照', hint: '需露出五官及证件信息', icon: 'manager' },
  { key: 'storefront', label: '门头照片', hint: '门店整体及招牌清晰可见', icon: 'shop' },
  { key: 'cashier', label: '法人与收银台合照', hint: '包含法人与收银设备', icon: 'friends-o' },
  { key: 'indoor', label: '店内场景照', hint: '展示真实经营环境', icon: 'smile' }
]

const basicPhotoFields = computed(() => (isMicroType.value ? microBasicPhotoFields : defaultBasicPhotoFields))

const legalPhotoFields = [
  { key: 'legal_id_front', label: '身份证人像面', icon: 'idcard' },
  { key: 'legal_id_back', label: '身份证国徽面', icon: 'idcard' }
]

const isPersonalAccount = computed(() => form.settlement.accountType !== 'enterprise')

const settlementCertificateFields = computed(() => {
  if (isPersonalAccount.value) {
    return [
      {
        key: 'account_permit',
        title: '银行卡照片',
        desc: '请上传法人或结算人的银行卡正面，需与账户名一致',
        button: '上传银行卡照片',
        icon: 'card'
      }
    ]
  }
  return [
    {
      key: 'account_permit',
      title: '开户许可证或对公账户证明文件',
      desc: '请上传清晰完整的开户许可证或银行出具的账户证明文件',
      button: '上传开户证明',
      icon: 'description'
    }
  ]
})

const productDisplayList = computed(() => productOptions)
const showAuthorizationUpload = computed(() => !isMicroType.value)

const baseAccountTypeOptions = [
  { label: '对公账户', value: 'enterprise' },
  { label: '个人账户', value: 'personal' }
]

const microAccountTypeOptions = [{ label: '对私账户', value: 'personal' }]

const accountTypeOptions = computed(() => (isMicroType.value ? microAccountTypeOptions : baseAccountTypeOptions))

const legalNameLabel = computed(() => (isMicroType.value ? '负责人姓名' : '法人姓名'))
const legalIdLabel = computed(() => (isMicroType.value ? '负责人身份证号' : '法人身份证号'))
const legalPhoneLabel = computed(() => (isMicroType.value ? '负责人手机号' : '联系电话'))

const activeStep = ref(0)
const stepKeyOrder = computed(() => (isMicroType.value ? MICRO_STEP_KEYS : DEFAULT_STEP_KEYS))
const steps = computed(() => stepKeyOrder.value.map((key) => STEP_CONFIGS[key] || { title: key }))
const currentStepKey = computed(() => stepKeyOrder.value[activeStep.value] || stepKeyOrder.value[0] || 'basic')
const showBasicSection = computed(() => ['basic', 'basic_legal'].includes(currentStepKey.value))
const showLegalSection = computed(() => ['legal', 'basic_legal'].includes(currentStepKey.value))
const showSettlementSection = computed(() => currentStepKey.value === 'settlement')
const showProductSection = computed(() => currentStepKey.value === 'product')
const submitLoading = ref(false)

const handleSelectAccountType = (value) => {
  const validValues = accountTypeOptions.value.map((item) => item.value)
  const nextValue = validValues.includes(value) ? value : validValues[0]
  form.settlement.accountType = nextValue
}

const industryPickerVisible = ref(false)
const areaPickerVisible = ref(false)
const bankAreaPickerVisible = ref(false)
const bankPickerVisible = ref(false)
const licenseCalendarVisible = ref(false)
const legalCalendarVisible = ref(false)
const legalIdTypePickerVisible = ref(false)
const cardholderIdTypePickerVisible = ref(false)

const minLicenseDate = new Date(new Date().getFullYear() - 10, 0, 1)
const maxLicenseDate = new Date(new Date().getFullYear() + 20, 11, 31)
const minLegalDate = new Date(new Date().getFullYear() - 5, 0, 1)
const maxLegalDate = new Date(new Date().getFullYear() + 30, 11, 31)

const lastAutoAccountName = ref('')

const setAutoAccountName = (value, force = false) => {
  const target = String(value || '').trim()
  if (!target) return
  const current = form.settlement.accountName.trim()
  const shouldUpdate = force || !current || current === lastAutoAccountName.value
  if (!shouldUpdate) return
  form.settlement.accountName = target
  lastAutoAccountName.value = target
}

const merchantTypeLabel = computed(() => {
  switch (form.merchantType) {
    case 'individual':
      return '个体户进件'
    case 'micro':
      return '小微商户进件'
    default:
      return '企业进件'
  }
})

const merchantFlowTitle = computed(() => (isMicroType.value ? '小微商户进件' : '企业/个体户进件'))
const stepSubtitle = computed(() => (isMicroType.value ? '请准备手持证件、门头、收银合照及场景照，确保照片清晰完整' : '请准备营业执照、门头、收银台与场景照片，确保信息可识别'))

const basicRegionDisplay = computed(() => {
  const { province, city, district } = form.basic.region
  return [province, city, district].filter(Boolean).join(' / ')
})

const licenseExpiryDisplay = computed(() => {
  const { licenseValidFrom, licenseValidTo, licenseExpiry } = form.basic
  if (licenseValidFrom && licenseValidTo) {
    if (licenseValidFrom === licenseValidTo) {
      return licenseValidTo
    }
    return `${licenseValidFrom} ~ ${licenseValidTo}`
  }
  return licenseValidTo || licenseExpiry || ''
})

const legalIdExpiryDisplay = computed(() => {
  const { idValidFrom, idExpiry } = form.legal
  if (idValidFrom && idExpiry) {
    if (idValidFrom === idExpiry) {
      return idExpiry
    }
    return `${idValidFrom} ~ ${idExpiry}`
  }
  return idExpiry
})

const inviteCodeErrorMessage = computed(() => (inviteCodeState.status === 'error' ? inviteCodeState.message : ''))
const inviteCodeHint = computed(() => {
  if (inviteCodeState.status === 'success') {
    return inviteCodeState.message || '邀请码可用'
  }
  if (inviteCodeState.status === 'checking') {
    return '正在校验邀请码...'
  }
  return ''
})
const inviteCodeRightIcon = computed(() => {
  if (inviteCodeState.status === 'success') return 'success'
  if (inviteCodeState.status === 'checking') return 'clock-o'
  if (inviteCodeState.status === 'error') return 'close'
  return ''
})

watch(
  () => form.merchantType,
  (type) => {
    if (type === 'micro') {
      form.settlement.accountType = 'personal'
      return
    }
    if (type === 'individual' && form.settlement.accountType === 'enterprise') {
      form.settlement.accountType = 'personal'
      return
    }
    if (type === 'enterprise' && !['enterprise', 'personal'].includes(form.settlement.accountType)) {
      form.settlement.accountType = 'enterprise'
    }
  }
)

watch(
  stepKeyOrder,
  (keys) => {
    if (!keys.length) {
      activeStep.value = 0
      return
    }
    if (activeStep.value >= keys.length) {
      activeStep.value = keys.length - 1
    }
  },
  { immediate: true }
)

const resetInviteCodeState = () => {
  inviteCodeState.status = 'idle'
  inviteCodeState.message = ''
  lastValidatedInviteCode.value = ''
}

const validateInviteCodeImmediately = async (rawCode) => {
  const trimmed = String(rawCode || '').trim()
  if (!trimmed) {
    resetInviteCodeState()
    return false
  }
  if (inviteCodeState.status === 'success' && lastValidatedInviteCode.value === trimmed) {
    return true
  }
  inviteCodeState.status = 'checking'
  inviteCodeState.message = ''
  try {
    const response = await checkSalesmanInviteCode(trimmed)
    if (response?.code !== 0) {
      throw new Error(response?.message || '邀请码无效')
    }
    const salesmanName = response?.data?.salesman_name || response?.data?.salesman_code
    inviteCodeState.status = 'success'
    inviteCodeState.message = salesmanName ? `匹配业务员：${salesmanName}` : '邀请码可用'
    lastValidatedInviteCode.value = trimmed
    return true
  } catch (error) {
    inviteCodeState.status = 'error'
    inviteCodeState.message = error?.response?.data?.message || error?.message || '邀请码无效'
    return false
  }
}

watch(
  () => form.inviteCode,
  (value) => {
    if (inviteCodeDebounceTimer) {
      clearTimeout(inviteCodeDebounceTimer)
      inviteCodeDebounceTimer = null
    }
    const trimmed = String(value || '').trim()
    if (!trimmed) {
      resetInviteCodeState()
      return
    }
    inviteCodeDebounceTimer = setTimeout(() => {
      validateInviteCodeImmediately(trimmed)
    }, 500)
  },
  { immediate: true }
)

watch(
  () => form.settlement.accountType,
  (type) => {
    if (type === 'enterprise') {
      setAutoAccountName(form.basic.merchantName, true)
    } else {
      setAutoAccountName(form.legal.legalName, true)
    }
  },
  { immediate: true }
)

watch(
  () => form.basic.merchantName,
  (value) => {
    if (form.settlement.accountType === 'enterprise') {
      setAutoAccountName(value)
    }
  }
)

watch(
  () => form.legal.legalName,
  (value) => {
    if (form.settlement.accountType !== 'enterprise') {
      setAutoAccountName(value)
    }
  }
)

watch(
  form,
  () => {
    schedulePersistFormState()
  },
  { deep: true }
)

watch(
  uploadLists,
  () => {
    schedulePersistFormState()
  },
  { deep: true }
)

onBeforeUnmount(() => {
  if (inviteCodeDebounceTimer) {
    clearTimeout(inviteCodeDebounceTimer)
    inviteCodeDebounceTimer = null
  }
  if (formPersistTimer) {
    clearTimeout(formPersistTimer)
    formPersistTimer = null
  }
})

const handleBack = () => {
  if (activeStep.value > 0) {
    activeStep.value -= 1
    return
  }
  router.back()
}

const goPrevStep = () => {
  if (activeStep.value > 0) {
    activeStep.value -= 1
  }
}

const focusInviteCodeStep = () => {
  const targetKey = isMicroType.value ? 'basic_legal' : 'basic'
  const targetIndex = stepKeyOrder.value.indexOf(targetKey)
  if (targetIndex >= 0) {
    activeStep.value = targetIndex
  }
}

const onIndustryConfirm = ({ selectedOptions }) => {
  form.basic.industry = selectedOptions[0]?.text || selectedOptions[0]?.value || ''
  industryPickerVisible.value = false
}

const resolveSelectedOptions = (payload, fallback) => {
  if (payload?.selectedOptions) return payload.selectedOptions
  if (Array.isArray(fallback) && fallback.length) return fallback
  if (Array.isArray(payload)) {
    return payload.map((item) => (typeof item === 'object' ? item : { name: item, text: item, value: item }))
  }
  return []
}

const getOptionName = (option) => option?.name || option?.text || option?.label || option?.value || ''

const onAreaConfirm = (payload, detail = {}) => {
  const options = resolveSelectedOptions(payload, detail?.selectedOptions)
  form.basic.region = {
    province: getOptionName(options[0]),
    city: getOptionName(options[1]),
    district: getOptionName(options[2])
  }
  areaPickerVisible.value = false
}

const onBankAreaConfirm = (payload, detail = {}) => {
  const options = resolveSelectedOptions(payload, detail?.selectedOptions)
  form.settlement.bankRegion = {
    province: getOptionName(options[0]),
    city: getOptionName(options[1])
  }
  bankAreaPickerVisible.value = false
}

const onBankConfirm = ({ selectedOptions }) => {
  form.settlement.bankName = selectedOptions[0]?.text || selectedOptions[0]?.value || ''
  bankPickerVisible.value = false
}

const onLicenseDateConfirm = (date) => {
  const value = formatDate(date)
  form.basic.licenseValidFrom = ''
  form.basic.licenseValidTo = value
  form.basic.licenseExpiry = value
  licenseCalendarVisible.value = false
}

const onLegalDateConfirm = (date) => {
  form.legal.idValidFrom = ''
  form.legal.idExpiry = formatDate(date)
  legalCalendarVisible.value = false
}

const onLegalIdTypeConfirm = ({ selectedOptions }) => {
  form.legal.idType = selectedOptions[0]?.value || selectedOptions[0]?.text || 'ID_CARD'
  legalIdTypePickerVisible.value = false
}

const onCardholderIdTypeConfirm = ({ selectedOptions }) => {
  form.settlement.cardholderIdType = selectedOptions[0]?.value || selectedOptions[0]?.text || 'ID_CARD'
  cardholderIdTypePickerVisible.value = false
}

const formatDate = (date) => {
  if (!(date instanceof Date)) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const handleRemoveUpload = (field) => {
  form.attachments[field] = ''
  uploadLists[field] = []
  revokeTemporaryPreviews(field)
}

const auditAttachmentIfNeeded = async (field, url) => {
  if (!PHOTO_AUDIT_FIELDS.has(field)) {
    return { pass: true }
  }
  const label = PHOTO_FIELD_LABELS[field] || '该图片'
  try {
    const response = await auditOnboardingAttachment({ type: field, image_url: url })
    if (response?.code === 0 && response?.data?.pass) {
      return { pass: true }
    }
    return {
      pass: false,
      reason: response?.data?.reason || response?.message || `${label}未通过审核，请重新上传`
    }
  } catch (error) {
    const message = error?.response?.data?.message || error?.message || `${label}审核失败，请稍后重试`
    return { pass: false, reason: message }
  }
}

const populateBusinessLicenseFromOcr = async (imageUrl) => {
  if (!imageUrl) return

  let loadingToast
  try {
    loadingToast = showLoadingToast({
      message: '识别营业执照...',
      forbidClick: true,
      duration: 0
    })

    const response = await analyzeBusinessLicenseOcr({ image_url: imageUrl })
    const fields = response?.data?.fields || {}

    if (fields.merchant_name) {
      form.basic.merchantName = fields.merchant_name
    }
    if (fields.license_number) {
      form.basic.licenseNumber = fields.license_number
    }
    if (fields.license_expiry) {
      form.basic.licenseValidTo = fields.license_expiry
      form.basic.licenseExpiry = fields.license_expiry
    }
    if (fields.license_valid_from) {
      form.basic.licenseValidFrom = fields.license_valid_from
    }
    if (fields.license_valid_to) {
      form.basic.licenseValidTo = fields.license_valid_to
      form.basic.licenseExpiry = fields.license_valid_to
    }
    if (fields.address) {
      let processedAddress = fields.address
      const autoRegion = detectRegionFromAddress(fields.address)
      if (autoRegion) {
        form.basic.region = autoRegion
        processedAddress = sanitizeAddressWithoutRegion(fields.address, autoRegion)
      }
      form.basic.address = processedAddress
    }

    showToast({ type: 'success', message: '营业执照识别成功，已自动填入信息' })
  } catch (error) {
    console.error('[Onboarding] 营业执照识别失败', error)
    const message = error?.message || error?.response?.data?.message || '未识别为营业执照，请重新上传清晰的营业执照'
    await showDialog({
      title: '营业执照识别失败',
      message,
      confirmButtonColor: '#ff2d55'
    })
    const wrappedError = new Error(message)
    wrappedError.__ocrHandled = true
    throw wrappedError
  } finally {
    if (loadingToast) {
      closeToast()
    }
  }
}

const populateLegalIdFromOcr = async (field, imageUrl) => {
  if (!imageUrl) return
  const side = field === 'legal_id_front' ? 'front' : 'back'

  let loadingToast
  try {
    loadingToast = showLoadingToast({
      message: '识别身份证...',
      forbidClick: true,
      duration: 0
    })

    const response = await analyzeIdCardOcr({ image_url: imageUrl, side })
    const fields = response?.data?.fields || {}

    if (side === 'front') {
      if (fields.legal_name) {
        form.legal.legalName = fields.legal_name
        if (isMicroType.value) {
          const trimmedName = fields.legal_name.trim()
          if (trimmedName) {
            form.basic.merchantName = `商户_${trimmedName}`
          }
        }
      }
      if (fields.legal_id_number) {
        form.legal.legalIdNumber = fields.legal_id_number
        if (isMicroType.value && !form.settlement.cardholderIdNumber.trim()) {
          form.settlement.cardholderIdNumber = fields.legal_id_number
        }
      }
      if (fields.address) {
        if (isMicroType.value) {
          const autoRegion = detectRegionFromAddress(fields.address)
          const sanitizedAddress = autoRegion
            ? sanitizeAddressWithoutRegion(fields.address, autoRegion)
            : fields.address
          if (autoRegion && (!form.basic.region.province || !form.basic.region.city)) {
            form.basic.region = autoRegion
          }
          if (!form.basic.address.trim()) {
            form.basic.address = sanitizedAddress
          }
          if (!form.settlement.cardholderAddress.trim()) {
            form.settlement.cardholderAddress = sanitizedAddress
          }
        } else if (!form.basic.address) {
          form.basic.address = fields.address
        }
      }
    } else {
      if (fields.valid_from) {
        form.legal.idValidFrom = fields.valid_from
      }
      if (fields.valid_to) {
        form.legal.idExpiry = fields.valid_to
      }
    }

    showToast({ type: 'success', message: '身份证识别成功，已自动填入信息' })
  } catch (error) {
    console.error('[Onboarding] 身份证识别失败', error)
    const message = error?.message || error?.response?.data?.message || '未识别为身份证，请重新上传清晰的身份证照片'
    await showDialog({
      title: '身份证识别失败',
      message,
      confirmButtonColor: '#ff2d55'
    })
    const wrappedError = new Error(message)
    wrappedError.__ocrHandled = true
    throw wrappedError
  } finally {
    if (loadingToast) {
      closeToast()
    }
  }
}

const populateSettlementDocumentFromOcr = async (imageUrl) => {
  if (!imageUrl) return
  const personal = isPersonalAccount.value
  const api = personal ? analyzeBankCardOcr : analyzeAccountPermitOcr
  const successMessage = personal ? '银行卡识别成功，已自动填入信息' : '开户许可证识别成功，已自动填入信息'
  const failTitle = personal ? '银行卡识别失败' : '开户许可证识别失败'
  let loadingToast
  try {
    loadingToast = showLoadingToast({
      message: personal ? '识别银行卡...' : '识别开户许可证...',
      forbidClick: true,
      duration: 0
    })
    const response = await api({ image_url: imageUrl })
    const fields = response?.data?.fields || {}
    if (fields.account_name) {
      setAutoAccountName(fields.account_name, true)
    }
    if (fields.account_number) {
      form.settlement.accountNumber = String(fields.account_number).replace(/\\s+/g, '')
    }
    if (fields.bank_name) {
      form.settlement.bankName = fields.bank_name
    }
    if (fields.bank_branch) {
      form.settlement.bankBranch = fields.bank_branch
    }
    showToast({ type: 'success', message: successMessage })
  } catch (error) {
    console.error('[Onboarding] 结算资料识别失败', error)
    const message = error?.message || error?.response?.data?.message || '识别失败，请上传清晰的证件照片'
    await showDialog({
      title: failTitle,
      message,
      confirmButtonColor: '#ff2d55'
    })
    const wrappedError = new Error(message)
    wrappedError.__ocrHandled = true
    throw wrappedError
  } finally {
    if (loadingToast) {
      closeToast()
    }
  }
}

const handleUpload = async (field, payload) => {
  const files = Array.isArray(payload) ? payload : [payload]

  for (const item of files) {
    const rawFile = item?.file || item
    if (!rawFile) {
      showToast('无法读取文件，请重试')
      continue
    }

    const previewUrl = item?.content || (rawFile instanceof File ? URL.createObjectURL(rawFile) : '')
    if (previewUrl) {
      uploadLists[field] = [{ url: previewUrl, status: 'uploading', isImage: true }]
      registerTemporaryPreview(field, previewUrl)
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

      form.attachments[field] = url
      uploadLists[field] = [{ url, isImage: true }]
      const auditResult = await auditAttachmentIfNeeded(field, url)
      if (!auditResult.pass) {
        const reason = auditResult.reason || `${PHOTO_FIELD_LABELS[field] || '图片'}未通过审核`
        await showDialog({
          title: '图片未通过审核',
          message: reason,
          confirmButtonColor: '#ff5d5b'
        })
        uploadLists[field] = []
        form.attachments[field] = ''
        continue
      }
      if (field === 'business_license') {
        await populateBusinessLicenseFromOcr(url)
      } else if (field === 'legal_id_front' || field === 'legal_id_back') {
        await populateLegalIdFromOcr(field, url)
      } else if (field === 'account_permit') {
        await populateSettlementDocumentFromOcr(url)
      } else {
        showToast({ type: 'success', message: '上传成功' })
      }
    } catch (error) {
      console.error('[Onboarding] 上传失败', error)
      const needsOcrHandling = ['business_license', 'legal_id_front', 'legal_id_back'].includes(field)
      const ocrHandled = needsOcrHandling && error?.__ocrHandled
      if (!ocrHandled) {
        showFailToast({ message: error?.message || '上传失败，请稍后重试', duration: 3500 })
      }
      if (!ocrHandled) {
        uploadLists[field] = []
        form.attachments[field] = ''
      }
    } finally {
      if (loadingToast) {
        closeToast()
      }
      revokeTemporaryPreviews(field)
    }
  }
}

const extractUploadUrl = (response) => {
  if (!response) return ''
  const candidates = [
    response?.data?.url,
    response?.data?.path,
    response?.data?.full_url,
    response?.data?.fullUrl,
    response?.url,
    response?.path
  ]
  return candidates.find((item) => typeof item === 'string' && item) || ''
}

const isValidPhone = (value) => /^1[3-9]\d{9}$/.test(String(value || '').trim())
const isValidIdCard = (value) => /^[1-9]\d{5}(18|19|20)?\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(String(value || '').trim())
const isValidBankAccount = (value) => /^\d{9,20}$/.test(String(value || '').replace(/\s+/g, ''))
const validateIdNumber = (value, type = 'ID_CARD') => {
  const target = String(value || '').trim()
  if (!target) return false
  if (!type || type === 'ID_CARD') {
    return isValidIdCard(target)
  }
  return target.length >= 6 && target.length <= 30
}

const validateBasicSection = () => {
  if (!form.inviteCode.trim()) {
    showToast('请输入邀请码')
    focusInviteCodeStep()
    return false
  }
  if (inviteCodeState.status === 'checking') {
    showToast('邀请码验证中，请稍后再试')
    focusInviteCodeStep()
    return false
  }
  if (inviteCodeState.status === 'error') {
    showToast(inviteCodeState.message || '邀请码无效，请重新输入')
    focusInviteCodeStep()
    return false
  }
  if (inviteCodeState.status !== 'success') {
    showToast('请先校验邀请码')
    focusInviteCodeStep()
    return false
  }
  if (!form.basic.merchantName.trim()) {
    showToast('请输入商户名称')
    return false
  }
  if (!isMicroType.value && !form.basic.licenseNumber.trim()) {
    showToast('请输入营业执照编号')
    return false
  }
  if (!form.basic.industry) {
    showToast('请选择行业类别')
    return false
  }
  if (!form.basic.region.province || !form.basic.region.city) {
    showToast('请选择所在省市')
    return false
  }
  if (!form.basic.address.trim()) {
    showToast('请输入详细地址')
    return false
  }
  const requiredPrimaryAttachmentKey = isMicroType.value ? 'handheld_id' : 'business_license'
  if (!form.attachments[requiredPrimaryAttachmentKey]) {
    showToast(isMicroType.value ? '请上传手持证件照' : '请上传营业执照照片')
    return false
  }
  return true
}

const validateLegalSection = () => {
  if (!form.legal.legalName.trim()) {
    showToast('请输入法人姓名')
    return false
  }
  if (!validateIdNumber(form.legal.legalIdNumber, form.legal.idType)) {
    showToast('请输入正确的证件号码')
    return false
  }
  if (!isValidPhone(form.legal.contactPhone)) {
    showToast('请输入正确的法人联系电话')
    return false
  }
  if (isMicroType.value && !form.legal.idType) {
    showToast('请选择证件类型')
    return false
  }
  if (!form.attachments.legal_id_front || !form.attachments.legal_id_back) {
    showToast('请上传法人身份证正反面')
    return false
  }
  return true
}

const validateSettlementSection = () => {
  if (!form.settlement.accountName.trim()) {
    showToast('请输入结算账户名')
    return false
  }
  if (!isValidBankAccount(form.settlement.accountNumber)) {
    showToast('请输入正确的结算账号')
    return false
  }
  if (!form.settlement.bankName) {
    showToast('请选择开户银行')
    return false
  }
  if (!form.settlement.bankRegion.province || !form.settlement.bankRegion.city) {
    showToast('请选择开户行所在省市')
    return false
  }
  if (!form.attachments.account_permit) {
    showToast(isMicroType.value ? '请上传银行卡照片' : '请上传开户许可证')
    return false
  }
  if (isMicroType.value) {
    if (!form.settlement.cardholderIdType) {
      showToast('请选择持卡人证件类型')
      return false
    }
    if (!validateIdNumber(form.settlement.cardholderIdNumber, form.settlement.cardholderIdType)) {
      showToast('请输入正确的持卡人证件号')
      return false
    }
    if (!isValidPhone(form.settlement.cardholderPhone)) {
      showToast('请输入正确的持卡人手机号')
      return false
    }
    if (!form.settlement.cardholderAddress.trim()) {
      showToast('请输入持卡人地址')
      return false
    }
  }
  return true
}

const validateProductSection = () => {
  if (!form.agreements.acceptFeeAgreement) {
    showToast('请确认费率及资料真实性')
    return false
  }
  if (!form.agreements.acceptPrivacyPolicy) {
    showToast('请阅读并同意隐私政策')
    return false
  }
  return true
}

// 打开隐私政策
const openPrivacyPolicy = () => {
  router.push('/user/settings/privacy-policy')
}

const validateStep = (stepIndex) => {
  const key = stepKeyOrder.value[stepIndex] || 'basic'
  if (key === 'basic') {
    return validateBasicSection()
  }
  if (key === 'legal') {
    return validateLegalSection()
  }
  if (key === 'basic_legal') {
    return validateLegalSection() && validateBasicSection()
  }
  if (key === 'settlement') {
    return validateSettlementSection()
  }
  if (key === 'product') {
    return validateProductSection()
  }
  return true
}

const handleNextOrSubmit = () => {
  if (!validateStep(activeStep.value)) return

  if (activeStep.value === steps.value.length - 1) {
    handleSubmit()
    return
  }

  activeStep.value += 1
}

const buildPayload = () => {
  const attachments = { ...form.attachments }

  if (form.merchantType === 'micro' && !attachments.business_license && attachments.handheld_id) {
    attachments.business_license = attachments.handheld_id
  }

  return {
    merchant_type: form.merchantType,
    invite_code: form.inviteCode.trim(),
    basic_info: {
      merchant_name: form.basic.merchantName.trim(),
      merchant_short_name: form.basic.merchantShortName.trim(),
      license_number: form.basic.licenseNumber.trim(),
      license_expiry: form.basic.licenseExpiry,
      industry: form.basic.industry,
      region: {
        province: form.basic.region.province,
        city: form.basic.region.city,
        district: form.basic.region.district
      },
      address: form.basic.address.trim(),
      contact_phone: form.basic.contactPhone.trim(),
      remark: form.basic.remark.trim()
    },
    legal_info: {
      legal_name: form.legal.legalName.trim(),
      legal_id_number: form.legal.legalIdNumber.trim(),
      contact_phone: form.legal.contactPhone.trim(),
      id_expiry: form.legal.idExpiry,
      id_type: form.legal.idType
    },
    settlement_info: {
      account_type: form.settlement.accountType,
      account_name: form.settlement.accountName.trim(),
      account_number: form.settlement.accountNumber.trim(),
      bank_name: form.settlement.bankName.trim(),
      bank_province: form.settlement.bankRegion.province,
      bank_city: form.settlement.bankRegion.city,
      bank_branch: form.settlement.bankBranch.trim(),
      cardholder_id_type: form.settlement.cardholderIdType,
      cardholder_id_number: form.settlement.cardholderIdNumber.trim(),
      cardholder_phone: form.settlement.cardholderPhone.trim(),
      cardholder_address: form.settlement.cardholderAddress.trim()
    },
    product_info: {
      selected_products: [...new Set(form.product.selectedProducts)]
    },
    attachments,
    agreements: {
      accept_fee_agreement: form.agreements.acceptFeeAgreement
    }
  }
}

const handleSubmit = async () => {
  const payload = buildPayload()

  try {
    submitLoading.value = true
    const response = await submitMerchantOnboarding(payload)
    if (response?.code !== 0) {
      throw new Error(response?.message || '提交失败，请稍后重试')
    }

    showToast({ type: 'success', message: '提交成功，等待审核' })
    clearFormState()

    const recordId = response?.data?.id
    setTimeout(() => {
      if (recordId) {
        router.replace({
          name: 'MerchantOnboardingDetail',
          params: { id: String(recordId) }
        })
      } else {
        router.replace({ name: 'MerchantOnboardingList' })
      }
    }, 600)
  } catch (error) {
    console.error('[Onboarding] 提交失败', error)
    const responseData = error?.response?.data || {}
    const serverErrors =
      responseData?.errors ||
      responseData?.data?.errors ||
      responseData?.data?.validation_errors

    if (error?.name === 'AxiosError' && serverErrors && Object.keys(serverErrors).length) {
      const firstKey = Object.keys(serverErrors)[0]
      const messages = serverErrors[firstKey]
      const firstMsg = Array.isArray(messages) ? messages[0] : messages
      const toastMessage = firstMsg || responseData?.message || '提交失败，请稍后重试'
      if (toastMessage && toastMessage.includes('邀请码')) {
        focusInviteCodeStep()
      }
      showToast(toastMessage)
      return
    }

    const fallbackMessage = responseData?.message || error?.message || '提交失败，请稍后重试'
    if (fallbackMessage && fallbackMessage.includes('邀请码')) {
      focusInviteCodeStep()
    }
    showToast(fallbackMessage)
  } finally {
    submitLoading.value = false
  }
}
</script>

<style scoped>
.merchant-onboarding-form {
  min-height: 100vh;
  background: linear-gradient(180deg, #f6f7fb 0%, #ffffff 100%);
  display: flex;
  flex-direction: column;
}

.merchant-onboarding-form__body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px 100px;
  box-sizing: border-box;
}

.form-step-header {
  background: #fff;
  border-radius: 20px;
  padding: 20px 18px;
  margin-bottom: 20px;
  box-shadow: 0 16px 32px rgba(255, 45, 85, 0.08);
  border: 1px solid rgba(255, 77, 97, 0.1);
}

.form-section {
  background: #ffffff;
  border-radius: 18px;
  padding: 18px 16px 24px;
  box-shadow: 0 12px 30px rgba(33, 56, 123, 0.05);
  margin-bottom: 20px;
}

.basic-info-fields :deep(.van-cell) {
  padding: 8px 12px;
}

.basic-info-fields :deep(.van-field__label) {
  text-align: left;
  width: auto;
  min-width: 80px;
  color: #7a7a7a;
}

.basic-info-fields :deep(.van-field__body),
.basic-info-fields :deep(.van-field__control),
.basic-info-fields :deep(textarea.van-field__control) {
  text-align: left;
}

.field-hint {
  font-size: 12px;
  line-height: 1.4;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.field-hint--success {
  color: #22b07d;
}

.field-hint--loading {
  color: #ff8c42;
}

.section-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
}

.section-title--center {
  align-items: center;
  text-align: center;
}

.section-title__divider {
  width: 56px;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ff7a7a 0%, #ff2d55 100%);
  margin: 4px 0 6px;
}

.section-title span {
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
}

.section-title small {
  font-size: 12px;
  color: #93949a;
}


.photo-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.photo-grid--basic {
  grid-auto-rows: 1fr;
}

.photo-grid.small {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.photo-grid__item {
  width: 100%;
}

.account-type-selector {
  margin-bottom: 18px;
}

.account-type-selector__label {
  font-size: 13px;
  color: #7d7e80;
  margin-bottom: 8px;
}

.account-type-selector__chips {
  display: flex;
  gap: 10px;
}

.account-type-chip {
  flex: 1;
  border-radius: 999px;
  border: 1px solid rgba(255, 77, 97, 0.3);
  background: #fff;
  appearance: none;
  outline: none;
  color: #ff4d62;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 10px rgba(255, 45, 85, 0.06);
}

.account-type-chip.active {
  background: linear-gradient(135deg, #ff5f52 0%, #ff2d55 100%);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 10px 18px rgba(255, 45, 85, 0.18);
}

.certificate-upload-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.certificate-upload {
  padding: 14px;
  border-radius: 16px;
  border: 1px dashed rgba(255, 77, 97, 0.35);
  background: #fff9fa;
}

.certificate-upload__title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2d3d;
}

.certificate-upload__desc {
  margin: 6px 0 12px;
  font-size: 12px;
  color: #8a8b91;
}

.certificate-upload__placeholder {
  height: 170px;
  border-radius: 14px;
  background: rgba(255, 45, 85, 0.05);
  border: 1px dashed rgba(255, 77, 97, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #ff2d55;
  font-size: 14px;
  text-align: center;
}

.certificate-upload__preview {
  margin-top: 12px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255, 77, 97, 0.2);
}

.certificate-upload__preview img {
  display: block;
  width: 100%;
  height: 170px;
  object-fit: cover;
}

.certificate-upload :deep(.van-uploader__preview-image) {
  border-radius: 14px;
  object-fit: cover;
  width: 100%;
  height: 170px;
}

.product-fee-card {
  background: #fff8f5;
  border-radius: 16px;
  padding: 18px;
  border: 1px solid rgba(255, 77, 97, 0.15);
  margin-bottom: 16px;
}

.product-fee-card__title {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2d3d;
}

.product-fee-card__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.product-fee-card__item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-fee-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  font-size: 16px;
}

.product-fee-card__name {
  margin: 0;
  font-size: 14px;
  color: #1f2d3d;
  font-weight: 600;
}

.product-fee-card__rate {
  margin: 2px 0 0;
  font-size: 12px;
  color: #ff4d62;
}

.authorization-upload {
  border: 1px dashed rgba(255, 77, 97, 0.3);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 16px;
  background: #fff;
}

.authorization-upload__header {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
  color: #1f2d3d;
  font-size: 14px;
  font-weight: 600;
}

.authorization-upload__header small {
  font-size: 12px;
  color: #8a8b91;
  font-weight: 400;
}

.authorization-upload__placeholder {
  height: 120px;
  border-radius: 12px;
  border: 1px dashed rgba(255, 77, 97, 0.35);
  background: rgba(255, 45, 85, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #ff2d55;
}

.agreements-block {
  margin-top: 18px;
  background: #f7f8fa;
  border-radius: 12px;
  padding: 12px;
}

.agreements-block.privacy-agreement {
  margin-top: 12px;
  background: #fff8f8;
  border: 1px solid rgba(255, 77, 97, 0.2);
}

.agreements-block .privacy-text {
  color: #666;
  font-size: 12px;
}

.agreements-block .privacy-link {
  color: #1989fa;
  font-size: 12px;
  cursor: pointer;
}

.agreements-block .privacy-link:active {
  opacity: 0.7;
}

.merchant-onboarding-form__actions {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 -6px 20px rgba(15, 38, 98, 0.08);
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: stretch;
}

.merchant-onboarding-form__actions .van-button {
  height: 48px;
  font-size: 16px;
}

.merchant-onboarding-form__actions .action-button {
  flex: 1;
}
</style>
