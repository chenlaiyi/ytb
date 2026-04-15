<template>
  <div class="onboarding-detail">
    <div class="top-bar">
      <van-icon name="arrow-left" class="back-icon" @click="goBack" />
      <div class="top-title">进件详情</div>
    </div>

    <div v-if="loading" class="state-block">
      <van-loading type="spinner" size="24" />
      <span>加载详情中...</span>
    </div>

    <div v-else-if="error" class="state-block">
      <van-empty description="加载进件详情失败">
        <van-button type="primary" size="small" round @click="fetchDetail">重试</van-button>
      </van-empty>
    </div>

    <div v-else-if="detail" class="detail-content">
      <section class="status-card">
        <div class="status-card__header">
          <div class="status-card__title">
            <div class="merchant-name">{{ detail.merchant_name || '商户进件' }}</div>
            <van-tag :type="enrichedStatusMeta.badge">
              {{ enrichedStatusMeta.label }}
            </van-tag>
          </div>
          <div class="status-card__meta">
            <span>提交时间：{{ detail.submitted_at || '—' }}</span>
            <span v-if="detail.updated_at">更新时间：{{ detail.updated_at }}</span>
          </div>
        </div>
      </section>

      <section
        v-for="section in detail.sections || []"
        :key="section.title"
        class="info-section"
      >
        <h3 class="section-title">{{ section.title }}</h3>

        <div v-if="section.photos && section.photos.length" class="photo-section">
          <div v-for="photo in section.photos" :key="photo.label" class="photo-group">
            <div class="photo-label">{{ photo.label }}</div>
            <div class="photo-grid">
              <van-image
                v-for="(url, idx) in photo.urls"
                :key="idx"
                :src="url"
                width="118"
                height="86"
                fit="cover"
                radius="12"
                show-error
                class="preview-image"
                @click="previewImages(photo.urls, idx)"
              />
            </div>
          </div>
        </div>

        <div v-if="section.fields && section.fields.length" class="field-list">
          <div v-for="field in section.fields" :key="field.label" class="field-item">
            <span class="field-label">{{ field.label }}</span>
            <span class="field-value">{{ field.value }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, ImagePreview } from 'vant'
import { getMerchantOnboardingDetail } from '@/api/merchant'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref(null)
const detail = ref(null)

const fetchDetail = async () => {
  loading.value = true
  error.value = null
  try {
    const id = route.params.id
    if (!id) {
      throw new Error('缺少进件ID')
    }
    const res = await getMerchantOnboardingDetail(id)
    const data = res?.data
    if (!data) {
      throw new Error('未获取到进件详情')
    }
    detail.value = data
  } catch (err) {
    error.value = err
    if (import.meta.env.MODE !== 'production') {
      console.error('加载进件详情失败', err)
    }
    showToast(err?.message || '加载进件详情失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else if (router.hasRoute('MerchantOnboardingList')) {
    router.replace({ name: 'MerchantOnboardingList' })
  } else {
    router.replace({ path: '/merchant' })
  }
}

const enrichedStatusMeta = computed(() => {
  const current = detail.value
  if (!current) {
    return { badge: 'primary', label: '未识别' }
  }
  return {
    badge: current.status_badge || 'primary',
    label: current.status_label || '未识别'
  }
})

const previewImages = (urls, startPosition = 0) => {
  if (!Array.isArray(urls) || urls.length === 0) {
    return
  }
  ImagePreview({
    images: urls,
    startPosition,
    closeable: true,
    showIndex: true
  })
}

onMounted(fetchDetail)
</script>

<style scoped>
.onboarding-detail {
  min-height: 100vh;
  background-color: #f6f7fb;
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 24px);
}

.top-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px;
  background: linear-gradient(180deg, rgba(246, 248, 255, 0.95), rgba(246, 247, 251, 0));
  backdrop-filter: blur(6px);
}

.back-icon {
  font-size: 22px;
  color: #4a5672;
}

.top-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
}

.detail-content {
  padding: 12px 16px 32px;
}

.status-card {
  background: linear-gradient(140deg, rgba(82, 118, 255, 0.16), rgba(255, 255, 255, 0.9));
  border-radius: 20px;
  padding: 20px 18px;
  box-shadow: 0 18px 36px rgba(60, 100, 255, 0.16);
  margin-bottom: 18px;
  backdrop-filter: blur(3px);
}

.status-card__title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.merchant-name {
  font-size: 20px;
  font-weight: 700;
  color: #1f2d3d;
}

.status-card__meta {
  font-size: 12px;
  color: rgba(32, 45, 75, 0.65);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-section {
  background: #ffffff;
  border-radius: 20px;
  padding: 20px 18px 22px;
  margin-bottom: 18px;
  box-shadow: 0 16px 32px rgba(28, 64, 201, 0.08);
  border: 1px solid rgba(96, 120, 255, 0.08);
}

.section-title {
  font-size: 17px;
  font-weight: 700;
  color: #1f2d3d;
  margin-bottom: 14px;
  position: relative;
  padding-left: 12px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  border-radius: 4px;
  background: linear-gradient(180deg, #5f82ff, #8aa4ff);
}

.photo-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}

.photo-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: linear-gradient(135deg, rgba(244, 246, 255, 0.8), rgba(255, 255, 255, 0.95));
  border-radius: 16px;
  padding: 12px;
  border: 1px solid rgba(120, 140, 255, 0.12);
}

.photo-label {
  font-size: 13px;
  color: #5f6368;
  font-weight: 600;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 10px;
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(247, 249, 255, 0.9);
}

.field-label {
  font-size: 13px;
  color: #7d7e80;
}

.field-value {
  font-size: 14px;
  color: #1f2d3d;
  word-break: break-all;
  text-align: right;
}

.state-block {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #7d7e80;
}

.preview-image {
  cursor: zoom-in;
}
</style>
