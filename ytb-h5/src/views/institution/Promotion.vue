<template>
  <div class="institution-promotion">
    <van-nav-bar
      fixed
      safe-area-inset-top
      title="推广素材中心"
      left-arrow
      @click-left="goBack"
    />
    <div class="promotion-content">
      <section class="promotion-hero">
        <div class="promotion-hero__badge">INSTITUTION TOOLKIT</div>
        <h1 class="promotion-hero__title">渠道推广素材中心</h1>
        <p class="promotion-hero__subtitle">
          精选机构招商与商户拓展图文物料，统一品牌形象。下载后可直接分发朋友圈或社群，点击分享可一键更新微信好友分享内容。
        </p>
        <div class="promotion-hero__meta">
          <span>最后更新：2025-10-29</span>
          <span>素材均支持 1080 × 1920 高清输出</span>
        </div>
      </section>

      <van-tabs
        v-model:active="activeTab"
        sticky
        :offset-top="navBarHeight"
        swipeable
        color="#1a68ff"
        title-active-color="#1a68ff"
      >
        <van-tab
          v-for="section in promotionSections"
          :key="section.key"
          :title="section.title"
          :name="section.key"
        >
          <section class="promotion-section">
            <header class="promotion-section__header">
              <h2>{{ section.title }}</h2>
              <p>{{ section.description }}</p>
            </header>
            <div class="material-grid">
              <article
                v-for="material in section.materials"
                :key="material.id"
                class="material-card"
              >
                <button
                  type="button"
                  class="material-media"
                  @click="previewMaterial(material)"
                >
                  <van-image
                    :src="material.image"
                    :alt="material.title"
                    class="material-image"
                    fit="cover"
                    radius="16"
                    width="100%"
                    height="100%"
                    loading-icon="photo"
                  />
                </button>
                <div class="material-body">
                  <div class="material-heading">
                    <h3>{{ material.title }}</h3>
                    <p>{{ material.subtitle }}</p>
                  </div>
                  <div v-if="material.tags?.length" class="material-tags">
                    <span v-for="tag in material.tags" :key="tag">{{ tag }}</span>
                  </div>
                  <div class="material-actions">
                    <van-button
                      round
                      size="small"
                      plain
                      type="primary"
                      icon="down"
                      @click="downloadMaterial(material)"
                    >
                      保存海报
                    </van-button>
                    <van-button
                      round
                      size="small"
                      type="primary"
                      icon="share-o"
                      @click="shareMaterial(material)"
                    >
                      分享好友
                    </van-button>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </van-tab>
      </van-tabs>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ImagePreview, showFailToast, showSuccessToast, showToast } from 'vant'
import { setShareMetadata, shareLink, shareToWechat, isWechatBrowser } from '@/utils/share'

const router = useRouter()
const route = useRoute()

const navBarHeight = 46

const STATIC_ORIGIN =
  typeof window !== 'undefined'
    ? `${window.location.origin}/app/images/promotions/`
    : 'https://pay.itapgo.com/app/images/promotions/'

const promotionSections = [
  {
    key: 'institution',
    title: '推广机构图文',
    description:
      '适用于渠道拓展与合伙人招募，突出政策权益、分润模式与运营支持。建议在机构社群、招商宣讲或朋友圈投放。',
    materials: [
      {
        id: 'institution-growth',
        title: '机构升级计划',
        subtitle: '数字化结算 · 分润透明 · 全程陪跑',
        image: `${STATIC_ORIGIN}institution-growth.svg`,
        filename: '点点够-机构推广海报.svg',
        tags: ['机构招商', '权益亮点', '总部支持'],
        shareTitle: '点点够全国机构合伙人招募中',
        shareSubtitle: '支付+SaaS一体化，实时分润到账，快来加入数字化升级计划'
      }
    ]
  },
  {
    key: 'merchant',
    title: '推广商户图文',
    description:
      '用于给商户介绍产品卖点与收款优势，适配餐饮、零售、美业等场景。可配合地推、短信或微信好友分享。',
    materials: [
      {
        id: 'merchant-acquisition',
        title: '商户极速开通',
        subtitle: '一码收款 · 即开即用 · 当日回款',
        image: `${STATIC_ORIGIN}merchant-acquisition.svg`,
        filename: '点点够-商户推广海报.svg',
        tags: ['商户推广', '极速进件', '多场景支付'],
        shareTitle: '点点够商户助手，一码收款极速到账',
        shareSubtitle: '0元进件，支持微信/支付宝/银联，智能营销工具随时用'
      }
    ]
  }
]

const defaultTab = route.query.section === 'merchant' ? 'merchant' : 'institution'
const activeTab = ref(defaultTab)

const activeSection = computed(() =>
  promotionSections.find((section) => section.key === activeTab.value) || promotionSections[0]
)

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.replace({ name: 'InstitutionIndex' })
}

const previewMaterial = (material) => {
  if (!material?.image) return
  ImagePreview({
    images: [material.image],
    closeable: true,
    showIndex: false
  })
}

const downloadMaterial = async (material) => {
  if (!material?.image) {
    showFailToast('找不到素材地址')
    return
  }

  const filename = material.filename || `${material.id || 'promotion'}.png`
  try {
    const anchor = document.createElement('a')
    anchor.href = material.image
    anchor.download = filename
    anchor.rel = 'noopener'
    anchor.target = '_blank'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    showSuccessToast('素材已打开，可长按保存')
  } catch (error) {
    console.warn('下载素材失败，退回手动方案', error)
    showToast('素材已在新页面打开，请手动保存')
    window.open(material.image, '_blank')
  }
}

const shareMaterial = async (material) => {
  if (!material?.image) {
    showFailToast('素材信息不完整')
    return
  }

  const shareTitle = material.shareTitle || `${material.title}｜点点够推广素材`
  const shareSubtitle =
    material.shareSubtitle ||
    `${material.subtitle} · 点点够推广素材中心`
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/app/#/institution/promotion?section=${activeSection.value.key}&material=${material.id}`
      : `/app/#/institution/promotion?section=${activeSection.value.key}&material=${material.id}`

  setShareMetadata({
    title: shareTitle,
    subtitle: shareSubtitle,
    logo: material.image,
    url: shareUrl
  })

  if (isWechatBrowser()) {
    shareToWechat({
      title: shareTitle,
      subtitle: shareSubtitle,
      logo: material.image,
      url: shareUrl
    })
    showToast('分享信息已更新，请点击右上角发送给好友')
    return
  }

  if (navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareSubtitle,
        url: shareUrl
      })
      return
    } catch (error) {
      console.info('系统分享失败，降级复制链接', error)
    }
  }

  shareLink(shareUrl, (success) => {
    showToast(success ? '链接已复制，可粘贴给好友' : '复制失败，请手动分享')
  })
}

const syncQueryWithTab = (tabKey) => {
  router.replace({
    query: {
      ...route.query,
      section: tabKey
    }
  })
}

watch(
  () => route.query.section,
  (nextSection) => {
    if (typeof nextSection !== 'string') {
      return
    }
    const exists = promotionSections.some((section) => section.key === nextSection)
    if (exists) {
      activeTab.value = nextSection
    }
  }
)

watch(activeTab, (next) => {
  syncQueryWithTab(next)
})

watch(
  activeSection,
  (section) => {
    const material = section?.materials?.[0]
    if (!material) {
      return
    }
    setShareMetadata({
      title: material.shareTitle || `${material.title}｜点点够推广素材`,
      subtitle:
        material.shareSubtitle ||
        `${material.subtitle} · 点点够推广素材中心`,
      logo: material.image,
      url:
        typeof window !== 'undefined'
          ? `${window.location.origin}/app/#/institution/promotion?section=${section.key}`
          : '/app/#/institution/promotion'
    })
  },
  { immediate: false }
)

onMounted(() => {
  const initialMaterialId = route.query.material
  if (initialMaterialId) {
    const targetMaterial = promotionSections
      .flatMap((section) => section.materials)
      .find((item) => item.id === initialMaterialId)
    if (targetMaterial) {
      setTimeout(() => {
        previewMaterial(targetMaterial)
      }, 200)
    }
  }

  const material = activeSection.value?.materials?.[0]
  if (material) {
    setShareMetadata({
      title: material.shareTitle || `${material.title}｜点点够推广素材`,
      subtitle:
        material.shareSubtitle ||
        `${material.subtitle} · 点点够推广素材中心`,
      logo: material.image,
      url:
        typeof window !== 'undefined'
          ? `${window.location.origin}/app/#/institution/promotion`
          : '/app/#/institution/promotion'
    })
  }
})
</script>

<style scoped>
.institution-promotion {
  min-height: 100vh;
  background: linear-gradient(180deg, #f5f8ff 0%, #ffffff 18%, #f8f9fb 100%);
}

.promotion-content {
  padding-top: 56px;
  padding-bottom: 32px;
}

.promotion-hero {
  padding: 80px 24px 32px;
  text-align: left;
}

.promotion-hero__badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(26, 104, 255, 0.12);
  color: #1a68ff;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.promotion-hero__title {
  margin: 16px 0 12px;
  font-size: 28px;
  font-weight: 700;
  color: #102452;
}

.promotion-hero__subtitle {
  margin: 0;
  color: #3a4a6a;
  font-size: 15px;
  line-height: 1.6;
}

.promotion-hero__meta {
  margin-top: 20px;
  color: #5b6885;
  font-size: 12px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.promotion-section {
  padding: 12px 16px 24px;
}

.promotion-section__header {
  padding: 0 8px 16px;
}

.promotion-section__header h2 {
  margin: 0;
  font-size: 20px;
  color: #132a52;
}

.promotion-section__header p {
  margin: 8px 0 0;
  color: #4a5d7c;
  font-size: 14px;
  line-height: 1.6;
}

.material-grid {
  display: grid;
  gap: 16px;
}

.material-card {
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 48px rgba(25, 58, 131, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.material-media {
  position: relative;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.material-image {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 0;
}

.material-body {
  padding: 18px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.material-heading h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #132a52;
}

.material-heading p {
  margin: 6px 0 0;
  color: #4a5d7c;
  font-size: 14px;
}

.material-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.material-tags span {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(26, 104, 255, 0.12);
  color: #1a68ff;
  font-size: 12px;
  font-weight: 600;
}

.material-actions {
  display: flex;
  gap: 12px;
}

.van-tabs__nav {
  margin: 0 16px;
  border-radius: 99px;
  background: rgba(26, 104, 255, 0.08);
  padding: 6px;
}

.van-tab {
  border-radius: 99px;
}

.van-tab--active {
  background: #ffffff;
  box-shadow: 0 12px 24px rgba(26, 104, 255, 0.12);
}

@media (min-width: 768px) {
  .promotion-content {
    max-width: 720px;
    margin: 0 auto;
  }
}
</style>
