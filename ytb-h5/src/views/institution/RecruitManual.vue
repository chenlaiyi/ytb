<template>
  <div class="recruit-manual">
    <div v-if="canPresent || presentationMode" class="view-mode-toggle">
      <span class="view-mode-toggle__title">演示模式</span>
      <button
        class="view-mode-toggle__switch"
        type="button"
        role="switch"
        :aria-checked="presentationMode"
        :class="{ 'is-active': presentationMode }"
        @click="togglePresentationMode"
      >
        <span class="view-mode-toggle__track">
          <span class="view-mode-toggle__thumb"></span>
        </span>
        <span class="view-mode-toggle__state">{{ presentationMode ? '开启' : '关闭' }}</span>
      </button>
    </div>
    <div v-if="showDeck" class="ppt-wrapper">
      <div class="ppt-deck" ref="deckRef" :style="{ '--active-accent': activeSlideAccent }">
        <header class="ppt-deck__header">
          <div class="ppt-deck__header-left">
            <span class="ppt-deck__badge">MEITUAN PARTNER ROADSHOW</span>
            <h1 class="ppt-deck__title">{{ slides[activeSlide]?.title || SHARE_TITLE }}</h1>
            <p class="ppt-deck__subtitle" v-if="slides[activeSlide]?.subtitle">{{ slides[activeSlide]?.subtitle }}</p>
          </div>
          <div class="ppt-deck__header-right">
            <span class="ppt-deck__step">{{ activeSlide + 1 }} / {{ totalSlides }}</span>
            <button class="ppt-deck__fullscreen" type="button" @click="toggleFullscreen">
              {{ isFullscreen ? '退出全屏' : '全屏模式' }}
            </button>
          </div>
        </header>
        <div class="ppt-deck__viewport" ref="deckViewportRef">
          <div
            v-for="(slide, index) in slides"
            :key="slide.key"
            class="ppt-slide"
            :class="slideClasses(slide, index)"
            :style="getSlideStyle(slide)"
          >
            <div class="ppt-slide__content">
              <template v-if="slide.type === 'cover'">
                <span class="ppt-badge">MEITUAN PARTNER</span>
                <h1 class="ppt-heading">{{ SHARE_TITLE }}</h1>
                <p class="ppt-text">{{ slide.subtitle }}</p>
                <div class="ppt-actions">
                  <a class="ppt-button ppt-button--primary" href="tel:19859923412">拨打招商热线</a>
                  <button class="ppt-button ppt-button--ghost" type="button" @click="scrollToSection('tiers')">查看加盟政策</button>
                </div>
              </template>
              <template v-else-if="slide.type === 'metrics'">
                <h2 class="ppt-title">{{ slide.title }}</h2>
                <div class="ppt-metrics-grid">
                  <div v-for="metric in slide.metrics" :key="metric.label" class="ppt-metric-card">
                    <span class="ppt-metric-label">{{ metric.label }}</span>
                    <strong class="ppt-metric-value">{{ metric.value }}</strong>
                    <span class="ppt-metric-desc">{{ metric.desc }}</span>
                  </div>
                </div>
              </template>
              <template v-else-if="slide.type === 'features'">
                <h2 class="ppt-title">{{ slide.title }}</h2>
                <ul class="ppt-feature-list">
                  <li v-for="feature in slide.features" :key="feature.title">
                    <span class="ppt-feature-badge">{{ feature.badge }}</span>
                    <div class="ppt-feature-content">
                      <strong>{{ feature.title }}</strong>
                      <p>{{ feature.text }}</p>
                    </div>
                  </li>
                </ul>
              </template>
              <template v-else-if="slide.type === 'tiers-overview'">
                <h2 class="ppt-title">{{ slide.title }}</h2>
                <div class="ppt-tier-overview">
                  <div v-for="tier in slide.tiers" :key="tier.title" class="ppt-tier-card">
                    <div class="ppt-tier-header">
                      <span class="ppt-tier-tag">{{ tier.tag }}</span>
                      <h3>{{ tier.title }}</h3>
                    </div>
                    <div class="ppt-tier-price">
                      <span>{{ tier.priceLabel }}</span>
                      <strong>{{ tier.serviceFee }}</strong>
                      <small v-if="tier.serviceNote">{{ tier.serviceNote }}</small>
                    </div>
                    <ul class="ppt-tier-bullets">
                      <li v-for="bundle in tier.bundles" :key="bundle">{{ bundle }}</li>
                    </ul>
                  </div>
                </div>
              </template>
              <template v-else-if="slide.type === 'tier-detail'">
                <h2 class="ppt-title">{{ slide.tier.title }}政策要点</h2>
                <div class="ppt-tier-detail">
                  <div class="ppt-tier-detail__price">
                    <span>{{ slide.tier.priceLabel }}</span>
                    <strong>{{ slide.tier.serviceFee }}</strong>
                    <small v-if="slide.tier.serviceNote">{{ slide.tier.serviceNote }}</small>
                  </div>
                  <div class="ppt-tier-detail__section">
                    <h3>标准礼包</h3>
                    <ul>
                      <li v-for="bundle in slide.tier.bundles" :key="bundle">{{ bundle }}</li>
                    </ul>
                  </div>
                  <div
                    v-for="section in slide.tier.sections"
                    :key="section.title"
                    class="ppt-tier-detail__section"
                  >
                    <h3>{{ section.title }}</h3>
                    <ul>
                      <li v-for="item in section.items" :key="item">{{ item }}</li>
                    </ul>
                  </div>
                  <p class="ppt-tier-detail__highlight">{{ slide.tier.highlight }}</p>
                </div>
              </template>
              <template v-else-if="slide.type === 'faq'">
                <h2 class="ppt-title">{{ slide.title }}</h2>
                <div class="ppt-faq-grid">
                  <div v-for="faq in slide.faqs" :key="faq.question" class="ppt-faq-item">
                    <h3>{{ faq.question }}</h3>
                    <p>{{ faq.answer }}</p>
                  </div>
                </div>
              </template>
              <template v-else-if="slide.type === 'cta'">
                <h2 class="ppt-title">携手美团，落地本地生活数字化</h2>
                <p class="ppt-text">
                  填写合作信息或直接拨打热线，我们将在 24 小时内对接，提供区域诊断与收益测算方案。
                </p>
                <div class="ppt-actions">
                  <a class="ppt-button ppt-button--primary" href="tel:19859923412">拨打招商热线 19859923412</a>
                  <button class="ppt-button ppt-button--ghost" type="button" @click="scrollToSection('overview')">回到封面</button>
                </div>
              </template>
            </div>
          </div>
        </div>
        <footer class="ppt-controls">
          <button class="ppt-control" type="button" :disabled="activeSlide === 0" @click="goPrev">
            上一页
          </button>
          <div class="ppt-indicator">{{ activeSlide + 1 }} / {{ totalSlides }}</div>
          <button class="ppt-control" type="button" :disabled="activeSlide === totalSlides - 1" @click="goNext">
            下一页
          </button>
        </footer>
      </div>
    </div>
    <div v-else class="page">
      <header class="hero">
        <div class="hero__container">
          <span class="hero__badge">MEITUAN PARTNER</span>
          <h1 class="hero__title">美团收钱助手招商手册</h1>
          <p class="hero__subtitle">
            2025 年最新招商政策已上线：围绕运营中心、合伙人与销售经理三大档位，明确名额、押金与分润标准，助力区域伙伴快速起盘。
          </p>
          <div class="hero__actions">
            <a class="hero__btn hero__btn--primary" href="tel:19859923412">拨打招商热线</a>
            <a class="hero__btn hero__btn--ghost" href="#"
              @click.prevent="scrollToSection('tiers')"
            >查看加盟政策</a>
          </div>
          <div class="hero__metrics">
            <div
              v-for="metric in metrics"
              :key="metric.label"
              class="metric-card"
              :style="{ background: metric.tone }"
            >
              <div class="metric-card__glass">
                <span class="metric-card__label">{{ metric.label }}</span>
                <span class="metric-card__value">{{ metric.value }}</span>
                <span class="metric-card__desc">{{ metric.desc }}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav class="anchor-nav">
        <a
          v-for="anchor in anchors"
          :key="anchor.id"
          class="anchor-nav__item"
          href="#"
          @click.prevent="scrollToSection(anchor.id)"
        >{{ anchor.label }}</a>
      </nav>

      <main>
        <section class="section" id="overview">
          <header class="section__header">
            <span class="section__eyebrow">WHY JOIN</span>
            <h2 class="section__title">加入美团收钱助手，解锁区域经营新增长</h2>
            <p class="section__description">
              美团收钱助手依托美团生态能力，为区域代理提供一站式数字化经营服务。帮助合作伙伴快速切入本地生活服务市场，实现支付、SaaS、营销增值的多维盈利。
            </p>
          </header>
          <div class="grid-4">
            <article v-for="feature in features" :key="feature.title" class="feature-card">
              <span class="feature-card__badge">{{ feature.badge }}</span>
              <h3 class="feature-card__title">{{ feature.title }}</h3>
              <p class="feature-card__text">{{ feature.text }}</p>
            </article>
          </div>
        </section>

        <section class="section" id="tiers">
          <header class="section__header">
            <span class="section__eyebrow">PARTNER TIERS</span>
            <h2 class="section__title">运营中心 / 合伙人 / 销售经理政策对比</h2>
            <p class="section__description">
              最新政策聚焦三类档位：运营中心服务费 19,800 元（含 20 名合伙人名额），合伙人与销售经理采用运营中心代管押金模式，明确物料、客户资源与分润标准。
            </p>
          </header>
          <div class="tiers-grid">
            <article v-for="tier in tiers" :key="tier.title" class="tier-card">
              <header class="tier-card__header">
                <div class="tier-card__title-group">
                  <span class="tier-card__tag">{{ tier.tag }}</span>
                  <h3 class="tier-card__title">{{ tier.title }}</h3>
                </div>
                <div class="tier-card__price">
                  <span class="tier-card__price-label">{{ tier.priceLabel || '费用' }}</span>
                  <strong>{{ tier.serviceFee }}</strong>
                  <span v-if="tier.serviceNote" class="tier-card__price-note">{{ tier.serviceNote }}</span>
                </div>
              </header>
              <section class="tier-card__section">
                <h4 class="tier-card__section-title">标准礼包</h4>
                <ul class="tier-card__list">
                  <li v-for="bundle in tier.bundles" :key="bundle">{{ bundle }}</li>
                </ul>
              </section>
              <section
                v-for="section in tier.sections"
                :key="section.title"
                class="tier-card__section"
              >
                <h4 class="tier-card__section-title">{{ section.title }}</h4>
                <ul class="tier-card__list">
                  <li v-for="item in section.items" :key="item">{{ item }}</li>
                </ul>
              </section>
              <p class="tier-card__highlight">{{ tier.highlight }}</p>
            </article>
          </div>
        </section>

        <section class="section" id="faq">
          <header class="section__header">
            <span class="section__eyebrow">FAQ</span>
            <h2 class="section__title">合作前常见问题</h2>
            <p class="section__description">如未覆盖您的问题，可通过招商热线或在线意向表联系我们，专属顾问将在 24 小时内回电。</p>
          </header>
          <div class="faq">
            <details v-for="faq in faqs" :key="faq.question" class="faq__item">
              <summary class="faq__question">{{ faq.question }}</summary>
              <div class="faq__answer">{{ faq.answer }}</div>
            </details>
          </div>
        </section>

        <section class="cta">
          <h3 class="cta__title">即刻锁定城市席位，<br />抢占本地数字化窗口期</h3>
          <p class="cta__text">填写合作信息或直接拨打热线，我们将在 24 小时内对接，提供区域诊断与收益测算方案。</p>
          <div class="cta__actions">
            <a class="cta__button" href="tel:19859923412">拨打招商热线 19859923412</a>
          </div>
        </section>
      </main>

      <footer class="footer">
        <span>美团收钱助手 · 区域代理事业部</span>
        <span>页面更新时间：2025 年 10 月 31 日</span>
        <span>政策如有调整，请以最新官方通知为准</span>
        <a
          class="footer__link"
          href="https://mt.tapgo.cn"
          target="_blank"
          rel="noopener noreferrer"
        >美团业务点点够全攻略</a>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { setShareMetadata } from '@/utils/share'

const SHARE_TITLE = '美团收钱助手招商手册'
const SHARE_DESC = '查看美团收钱助手 2025 年新版招商政策，了解运营中心、合伙人与销售经理的费用、名额与分润标准。'
const SHARE_IMAGE = 'https://pay.itapgo.com/app/images/zhaoshang-share.png'
const PRESENTATION_MODE_STORAGE_KEY = 'recruit-manual:presentation-mode'

const router = useRouter()
const canPresent = ref(false)
const presentationMode = ref(false)
const activeSlide = ref(0)
const deckRef = ref(null)
const deckViewportRef = ref(null)
const isFullscreen = ref(false)
const showDeck = computed(() => presentationMode.value)
let scaleFrameId = null
let presentationPreferenceLoaded = false

const metrics = [
  {
    label: '运营中心服务费',
    value: '¥19,800',
    desc: '一次性咨询服务费，含资源与陪跑',
    tone: 'linear-gradient(135deg, #1b2c63 0%, #374fba 100%)'
  },
  {
    label: '合伙人发展额',
    value: '20 名',
    desc: '≈600 名销售经理可再分配',
    tone: 'linear-gradient(135deg, #f6a526 0%, #fcd273 100%)'
  },
  {
    label: '意向客户礼包',
    value: '100 位',
    desc: '总部 3 个工作日内派发',
    tone: 'linear-gradient(135deg, #15a8ad 0%, #3fd6c8 100%)'
  },
  {
    label: '密训席位',
    value: '20 个',
    desc: '运营中心专属实战训练营',
    tone: 'linear-gradient(135deg, #5a36f4 0%, #9370ff 100%)'
  }
]

const anchors = [
  { id: 'overview', label: '合作亮点' },
  { id: 'tiers', label: '加盟档位' },
  { id: 'faq', label: '常见问题' }
]

const features = [
  {
    title: '全域拓客能力',
    text: '联动线上线下资源，精准触达高潜商户，构建区域拓展通路。',
    badge: '获客'
  },
  {
    title: '多元业务矩阵',
    text: '支付分润、会员营销、供应链等多维产品，打造持续复购收益。',
    badge: '产品'
  },
  {
    title: '总部陪跑赋能',
    text: '城市经理驻场辅导，策略 + 实战双驱动，保障落地成效。',
    badge: '运营'
  },
  {
    title: '押金与风控保障',
    text: '押金统一由运营中心代管，达标后原路退还；配套美团支付与银行双风控，保障资金安全。',
    badge: '保障'
  }
]

const tiers = [
  {
    title: '运营中心',
    tag: 'Operation Center',
    priceLabel: '服务费',
    serviceFee: '¥19,800',
    serviceNote: '咨询服务费',
    bundles: ['50 台播报器（含一年保修）', '100 位优选意向客户礼包'],
    sections: [
      {
        title: '发展权益',
        items: ['含 20 名合伙人发展名额（≈600 名销售经理）', '附带 20 个密训席位，可预约总部线下实战营', '总部提供渠道拓展、培训陪跑与物料支持']
      },
      {
        title: '收益政策',
        items: ['交易分润标准：万12-万14（按机构设置执行）', '区县独家保护，6 个月考核后未达标可补位', '收益结算周期：T+7，明细后台实时可查']
      }
    ],
    presentation: {
      background: 'linear-gradient(135deg, #0b1446 0%, #1f48ff 55%, #32b2ff 100%)',
      accent: '#ffd400',
      accentSoft: 'rgba(255, 212, 0, 0.24)',
      mode: 'dark'
    },
    highlight: '适合具备团队管理与区域服务能力的伙伴，快速构建县域到门店的落地网络。'
  },
  {
    title: '合伙人',
    tag: 'Partner',
    priceLabel: '押金',
    serviceFee: '¥3,980',
    serviceNote: '由运营中心代管',
    bundles: ['10 台播报器', '20 位意向客户礼包'],
    sections: [
      {
        title: '团队搭建',
        items: ['可发展 30 名销售经理拓展业务', '总部提供线上课程与招募物料', '完成既定业绩后押金原路退还（按运营中心细则）']
      },
      {
        title: '收益政策',
        items: ['交易分润标准：万10-万12（按机构设置执行）', '可申请参加运营中心组织的培训与活动', '可自费报名密训（¥1,980，不含食宿与差旅）']
      }
    ],
    presentation: {
      background: 'linear-gradient(140deg, #0a3d43 0%, #13a0a4 45%, #f6b24c 100%)',
      accent: '#f6a526',
      accentSoft: 'rgba(246, 165, 38, 0.22)',
      mode: 'dark'
    },
    highlight: '推荐给拥有本地渠道或小型团队的合作方，承接县域扩张与团队管理。'
  },
  {
    title: '销售经理',
    tag: 'Sales Manager',
    priceLabel: '押金',
    serviceFee: '¥598',
    serviceNote: '由运营中心代管',
    bundles: ['1 台播报器', '5 位意向客户资源'],
    sections: [
      {
        title: '业务权益',
        items: ['个人可直接拓展商户出单', '获得运营中心的驻场陪跑与工具支持']
      },
      {
        title: '收益政策',
        items: ['交易分润标准：万8-万10（按机构设置执行）', '完成首批考核后押金退还（按运营中心细则）', '可自费报名密训（¥1,980，不含食宿与差旅）']
      }
    ],
    presentation: {
      background: 'linear-gradient(140deg, #261051 0%, #6237ff 55%, #9b5bff 100%)',
      accent: '#c39bff',
      accentSoft: 'rgba(195, 155, 255, 0.26)',
      mode: 'dark'
    },
    highlight: '适合成熟 BD 或想切入本地生活行业的个人，低门槛入局、即学即用。'
  }
]

const faqs = [
  {
    question: '合作伙伴需具备哪些基础条件？',
    answer: '需拥有合法经营主体，具备本地销售或地推团队，并有生活服务行业经验或客户资源。'
  },
  {
    question: '押金由谁收取？如何退还？',
    answer: '合伙人 ¥3,980 与销售经理 ¥598 均由签约运营中心代管，完成各自考核指标后按合同约定原路退还，具体细则以运营中心补充协议为准。'
  },
  {
    question: '是否支持跨区域经营？',
    answer: '默认按授权区域经营，如需跨区域拓展，可提交增补申请，总部将根据表现评估。'
  },
  {
    question: '收益如何结算？',
    answer: '交易分润按月 T+7 结算，设备补贴与活动激励按批次发放，系统提供结算明细。'
  },
  {
    question: '总部是否提供客户资源？',
    answer: '提供优选商户名单、行业案例、线上线索发放，并联合策划区域营销活动。'
  },
  {
    question: '多久能启动业务？',
    answer: '完成签约与培训后即可开通系统，平均 2 周完成首批商户上线，1-2 个月进入稳定增长。'
  }
]

const shareLink = computed(() => {
  if (typeof window === 'undefined') {
    return 'https://pay.itapgo.com/app/#/recruit/zhaoshang-handbook'
  }
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  return `${window.location.origin}${normalizedBase}#/recruit/zhaoshang-handbook`
})

const slides = computed(() => {
  const baseSlides = [
    {
      key: 'cover',
      type: 'cover',
      title: SHARE_TITLE,
      subtitle:
        '2025 年最新招商政策已上线：围绕运营中心、合伙人与销售经理三大档位，明确名额、押金与分润标准，助力区域伙伴快速起盘。',
      anchor: 'overview',
      background: 'linear-gradient(140deg, #0b132b 0%, #1f48ff 55%, #17c6c8 100%)',
      accent: '#ffd400',
      accentSoft: 'rgba(255, 212, 0, 0.2)',
      mode: 'dark'
    },
    {
      key: 'metrics',
      type: 'metrics',
      title: '核心政策速览',
      metrics,
      anchor: 'overview',
      background: 'linear-gradient(145deg, #111b53 0%, #1f48ff 50%, #17c6c8 100%)',
      accent: '#17c6c8',
      accentSoft: 'rgba(23, 198, 200, 0.22)',
      mode: 'dark'
    },
    {
      key: 'features',
      type: 'features',
      title: '加入亮点',
      features,
      anchor: 'overview',
      background: 'linear-gradient(155deg, #ffffff 0%, #eef2ff 100%)',
      accent: '#1f48ff',
      accentSoft: 'rgba(31, 72, 255, 0.18)',
      mode: 'light'
    },
    {
      key: 'tiers-overview',
      type: 'tiers-overview',
      title: '合作档位一览',
      tiers,
      anchor: 'tiers',
      background: 'linear-gradient(150deg, #ffffff 0%, #fff2dd 100%)',
      accent: '#f08a00',
      accentSoft: 'rgba(240, 138, 0, 0.2)',
      mode: 'light'
    },
    ...tiers.map((tier) => ({
      key: `tier-${tier.tag}`,
      type: 'tier-detail',
      tier,
      anchor: 'tiers',
      background: tier.presentation?.background,
      accent: tier.presentation?.accent,
      accentSoft: tier.presentation?.accentSoft,
      mode: tier.presentation?.mode || 'light'
    })),
    {
      key: 'faq',
      type: 'faq',
      title: '常见问题',
      faqs: faqs.slice(0, 4),
      anchor: 'faq',
      background: 'linear-gradient(150deg, #f4f7ff 0%, #ffffff 100%)',
      accent: '#1f48ff',
      accentSoft: 'rgba(31, 72, 255, 0.16)',
      mode: 'light'
    },
    {
      key: 'cta',
      type: 'cta',
      title: '立即联系',
      anchor: 'cta',
      background: 'linear-gradient(140deg, #0b1f3f 0%, #1d3fff 60%, #17c6c8 100%)',
      accent: '#ffd400',
      accentSoft: 'rgba(255, 212, 0, 0.25)',
      mode: 'dark'
    }
  ]

  return baseSlides
})

const activeSlideAccent = computed(() => slides.value[activeSlide.value]?.accent || '#1f48ff')

const totalSlides = computed(() => slides.value.length)

const goToSlide = (index) => {
  const bounded = Math.max(0, Math.min(index, totalSlides.value - 1))
  activeSlide.value = bounded
  if (showDeck.value) {
    scheduleScaleUpdate()
  }
}

const goPrev = () => {
  goToSlide(activeSlide.value - 1)
}

const goNext = () => {
  goToSlide(activeSlide.value + 1)
}

const slideClasses = (slide, index) => {
  const classes = []
  if (index === activeSlide.value) {
    classes.push('ppt-slide--active')
  } else if (index < activeSlide.value) {
    classes.push('ppt-slide--before')
  } else {
    classes.push('ppt-slide--after')
  }
  if ((slide?.mode || 'light') === 'dark') {
    classes.push('ppt-slide--dark')
  } else {
    classes.push('ppt-slide--light')
  }
  if (slide?.type) {
    classes.push(`ppt-slide--${slide.type}`)
  }
  return classes
}

const getSlideStyle = (slide) => {
  if (!slide) return {}
  const style = {}
  if (slide.background) {
    style.background = slide.background
  }
  if (slide.accent) {
    style['--slide-accent'] = slide.accent
  }
  if (slide.accentSoft) {
    style['--slide-accent-soft'] = slide.accentSoft
  }
  return style
}

const handleFullscreenChange = () => {
  if (typeof document === 'undefined') return
  isFullscreen.value = Boolean(document.fullscreenElement)
}

const exitFullscreen = () => {
  if (typeof document === 'undefined') return
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {})
  }
}

const enterFullscreen = () => {
  if (!deckRef.value) return
  const element = deckRef.value
  if (element.requestFullscreen) {
    element.requestFullscreen().catch(() => {})
  }
}

const toggleFullscreen = () => {
  if (!deckRef.value) return
  if (isFullscreen.value) {
    exitFullscreen()
  } else {
    enterFullscreen()
  }
}

const persistPresentationPreference = (value) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PRESENTATION_MODE_STORAGE_KEY, value ? '1' : '0')
  } catch (error) {
    // ignore persistence errors
  }
}

const loadPresentationPreference = () => {
  if (presentationPreferenceLoaded) return
  presentationPreferenceLoaded = true
  if (typeof window === 'undefined') {
    presentationMode.value = canPresent.value
    return
  }
  try {
    const stored = window.localStorage.getItem(PRESENTATION_MODE_STORAGE_KEY)
    if (stored === '1' || stored === '0') {
      presentationMode.value = stored === '1'
      return
    }
  } catch (error) {
    // ignore load errors
  }
  presentationMode.value = canPresent.value
}

const togglePresentationMode = () => {
  presentationMode.value = !presentationMode.value
}

const handleKeydown = (event) => {
  if (!presentationMode.value) return
  if (event.key === 'ArrowRight' || event.key === 'PageDown') {
    event.preventDefault()
    goNext()
  } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
    event.preventDefault()
    goPrev()
  }
}

const updatePresentationCapability = () => {
  if (typeof window === 'undefined') {
    canPresent.value = false
    return
  }
  const nextCanPresent = window.innerWidth >= 960
  if (!nextCanPresent && isFullscreen.value) {
    if (isFullscreen.value) {
      exitFullscreen()
    }
  }
  canPresent.value = nextCanPresent
  if (nextCanPresent) {
    loadPresentationPreference()
  }
  if (showDeck.value) {
    scheduleScaleUpdate()
  } else {
    clearContentScale()
  }
}

const scrollToSection = (id) => {
  if (!id) {
    return
  }

  if (presentationMode.value) {
    const targetIndex = slides.value.findIndex((slide) => {
      if (slide.anchor === id) return true
      if (Array.isArray(slide.anchorGroup)) {
        return slide.anchorGroup.includes(id)
      }
      return false
    })
    if (targetIndex !== -1) {
      goToSlide(targetIndex)
      router.replace({ hash: id }).catch(() => {})
      return
    }
  }

  if (typeof window === 'undefined') {
    return
  }

  router.replace({ hash: id }).catch(() => {})

  requestAnimationFrame(() => {
    const target = document.getElementById(id)
    if (!target) {
      return
    }
    try {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (error) {
      target.scrollIntoView()
    }
  })
}

const clearContentScale = () => {
  const viewport = deckViewportRef.value
  if (!viewport) return
  viewport.querySelectorAll('.ppt-slide__content').forEach((el) => {
    el.style.removeProperty('--ppt-scale')
    el.style.removeProperty('--ppt-translate')
    delete el.dataset.pptScale
    delete el.dataset.pptTranslate
  })
}

const updateActiveSlideScale = async () => {
  if (!presentationMode.value) {
    clearContentScale()
    return
  }

  await nextTick()
  const viewport = deckViewportRef.value
  if (!viewport) return

  clearContentScale()

  const activeContent = viewport.querySelector('.ppt-slide--active .ppt-slide__content')
  if (!activeContent) return

  const availableHeight = viewport.clientHeight
  const contentHeight = activeContent.scrollHeight
  if (!availableHeight || !contentHeight) {
    scaleFrameId = requestAnimationFrame(updateActiveSlideScale)
    return
  }

  const scale = Math.min(1, availableHeight / contentHeight)
  const translate = scale < 1 ? (availableHeight - contentHeight * scale) / 2 : 0

  activeContent.style.setProperty('--ppt-scale', scale.toString())
  activeContent.style.setProperty('--ppt-translate', `${translate}px`)
  activeContent.dataset.pptScale = scale.toString()
  activeContent.dataset.pptTranslate = translate.toString()
  scaleFrameId = null
}

const scheduleScaleUpdate = () => {
  if (scaleFrameId) {
    cancelAnimationFrame(scaleFrameId)
  }
  scaleFrameId = requestAnimationFrame(updateActiveSlideScale)
}

onMounted(() => {
  setShareMetadata({
    title: SHARE_TITLE,
    subtitle: SHARE_DESC,
    logo: SHARE_IMAGE,
    url: shareLink.value
  })

  try {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) {
    window.scrollTo(0, 0)
  }

  loadPresentationPreference()
  updatePresentationCapability()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updatePresentationCapability)
    window.addEventListener('keydown', handleKeydown)
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    handleFullscreenChange()
  }
  if (showDeck.value) {
    scheduleScaleUpdate()
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updatePresentationCapability)
    window.removeEventListener('keydown', handleKeydown)
  }
  if (typeof document !== 'undefined') {
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }
  if (isFullscreen.value) {
    exitFullscreen()
  }
  if (scaleFrameId) {
    cancelAnimationFrame(scaleFrameId)
  }
})

watch(activeSlide, () => {
  if (showDeck.value) {
    scheduleScaleUpdate()
  }
})

watch(canPresent, (available) => {
  if (available) {
    loadPresentationPreference()
  }
  if (showDeck.value) {
    scheduleScaleUpdate()
  } else {
    clearContentScale()
  }
})

watch(showDeck, (enabled) => {
  if (enabled) {
    nextTick(() => {
      scheduleScaleUpdate()
    })
  } else {
    if (isFullscreen.value) {
      exitFullscreen()
    }
    clearContentScale()
  }
})

watch(presentationMode, (enabled) => {
  if (!enabled && isFullscreen.value) {
    exitFullscreen()
  }
  persistPresentationPreference(enabled)
  if (enabled) {
    nextTick(() => {
      scheduleScaleUpdate()
    })
  } else {
    clearContentScale()
  }
})
</script>

<style scoped>
.recruit-manual {
  --bg: #f4f6fb;
  --bg-dark: #040b1f;
  --surface: #ffffff;
  --surface-dark: rgba(9, 17, 42, 0.86);
  --surface-muted: #f0f2f9;
  --brand-navy: #0c1733;
  --brand-blue: #1f48ff;
  --brand-cyan: #17c6c8;
  --accent: #f4b23f;
  --accent-strong: #f08a00;
  --text: #0f182a;
  --text-sub: rgba(15, 24, 42, 0.72);
  --text-light: rgba(255, 255, 255, 0.92);
  --shadow-xl: 0 30px 60px rgba(15, 20, 48, 0.18);
  --shadow-lg: 0 18px 40px rgba(16, 26, 56, 0.14);
  --shadow-md: 0 12px 28px rgba(18, 30, 62, 0.1);
  --radius-lg: 26px;
  --radius-md: 20px;
  --radius-sm: 16px;
  background: var(--bg);
  min-height: 100vh;
  color: var(--text);
  line-height: 1.7;
  position: relative;
  overflow-x: hidden;
}

.view-mode-toggle {
  position: fixed;
  top: clamp(16px, 4vw, 32px);
  right: clamp(16px, 4vw, 36px);
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--brand-navy);
}

.view-mode-toggle__title {
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0.6;
}

.view-mode-toggle__switch {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px 8px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(31, 72, 255, 0.18);
  box-shadow: 0 16px 36px rgba(16, 26, 56, 0.14);
  cursor: pointer;
  color: var(--brand-navy);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.view-mode-toggle__switch:hover,
.view-mode-toggle__switch:focus-visible {
  transform: translateY(-1px);
  box-shadow: 0 20px 42px rgba(16, 26, 56, 0.16);
}

.view-mode-toggle__switch:focus-visible {
  outline: 2px solid rgba(31, 72, 255, 0.4);
  outline-offset: 3px;
}

.view-mode-toggle__track {
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 999px;
  background: rgba(31, 72, 255, 0.18);
  transition: background 0.25s ease;
  flex-shrink: 0;
}

.view-mode-toggle__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 6px 16px rgba(12, 23, 51, 0.18);
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.view-mode-toggle__state {
  font-size: 0.82rem;
  min-width: 2.5em;
  text-align: left;
  color: rgba(15, 24, 42, 0.72);
}

.view-mode-toggle__switch.is-active .view-mode-toggle__track {
  background: linear-gradient(135deg, var(--brand-blue) 0%, #5b78ff 100%);
}

.view-mode-toggle__switch.is-active .view-mode-toggle__thumb {
  transform: translateX(20px);
}

.view-mode-toggle__switch.is-active .view-mode-toggle__state {
  color: var(--brand-blue);
}

.ppt-wrapper {
  position: relative;
  width: 100%;
  min-height: 100vh;
  padding: clamp(48px, 6vw, 80px) clamp(32px, 6vw, 96px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 12% 18%, rgba(31, 72, 255, 0.32), transparent 60%),
    radial-gradient(circle at 86% 82%, rgba(23, 198, 200, 0.24), transparent 68%),
    linear-gradient(135deg, #050d24 0%, #0b1a40 100%);
  overflow: hidden;
}

.ppt-wrapper::before,
.ppt-wrapper::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(140px);
  opacity: 0.55;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.ppt-wrapper::before {
  width: 520px;
  height: 520px;
  top: -160px;
  right: -140px;
  background: radial-gradient(circle, rgba(31, 72, 255, 0.42), transparent 70%);
}

.ppt-wrapper::after {
  width: 620px;
  height: 620px;
  bottom: -220px;
  left: -200px;
  background: radial-gradient(circle, rgba(255, 212, 0, 0.36), transparent 72%);
}

.ppt-deck {
  position: relative;
  width: min(1280px, 92vw);
  height: min(760px, 85vh);
  border-radius: clamp(28px, 3vw, 48px);
  background: linear-gradient(140deg, rgba(12, 20, 48, 0.92), rgba(6, 14, 36, 0.88));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 45px 120px rgba(5, 12, 32, 0.55);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(26px);
}

.ppt-deck::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 80% 12%, rgba(255, 212, 0, 0.24), transparent 68%),
    radial-gradient(circle at 18% 82%, rgba(23, 198, 200, 0.18), transparent 72%);
  opacity: 0.45;
  pointer-events: none;
}

.ppt-deck__header {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: clamp(24px, 3vw, 48px);
  padding: clamp(28px, 3vw, 42px) clamp(36px, 4vw, 56px) clamp(16px, 2.6vw, 28px);
  color: rgba(255, 255, 255, 0.9);
}

.ppt-deck__header-left {
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 1.8vw, 18px);
}

.ppt-deck__badge {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 8px 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: var(--active-accent);
  font-size: 0.78rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.ppt-deck__title {
  margin: 0;
  font-size: clamp(1.9rem, 3.3vw, 2.8rem);
  font-weight: 700;
  letter-spacing: -0.01em;
  color: rgba(255, 255, 255, 0.95);
}

.ppt-deck__subtitle {
  margin: 0;
  font-size: clamp(1rem, 1.6vw, 1.2rem);
  line-height: 1.6;
  color: rgba(235, 240, 255, 0.8);
  max-width: clamp(420px, 36vw, 600px);
}

.ppt-deck__header-right {
  display: flex;
  align-items: center;
  gap: clamp(16px, 2vw, 24px);
  margin-top: clamp(4px, 1vw, 8px);
}

.ppt-deck__step {
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.22em;
  color: rgba(235, 240, 255, 0.7);
}

.ppt-deck__fullscreen {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.88);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.ppt-deck__fullscreen:hover,
.ppt-deck__fullscreen:focus-visible {
  background: var(--active-accent);
  color: #060d24;
  transform: translateY(-1px);
  box-shadow: 0 16px 30px rgba(17, 32, 64, 0.24);
}

.ppt-deck__fullscreen:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.36);
  outline-offset: 3px;
}

.ppt-deck__viewport {
  position: relative;
  flex: 1;
  padding: clamp(20px, 2.5vw, 36px) clamp(28px, 3vw, 44px) clamp(28px, 3vw, 44px);
  display: flex;
  align-items: stretch;
  justify-content: center;
}

.ppt-slide {
  position: absolute;
  inset: clamp(4px, 0.8vw, 12px);
  border-radius: clamp(24px, 3vw, 40px);
  padding: clamp(40px, 4vw, 64px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: clamp(24px, 3vw, 36px);
  background-size: cover;
  background-position: center;
  box-shadow: 0 36px 80px rgba(6, 14, 36, 0.38);
  opacity: 0;
  pointer-events: none;
  transform: translate3d(0, 48px, 0) scale(0.94);
  transition:
    opacity 0.45s ease,
    transform 0.6s cubic-bezier(0.19, 1, 0.22, 1);
  color: #0f182a;
}

.ppt-slide::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(6, 14, 36, 0.12), rgba(6, 14, 36, 0.28));
  mix-blend-mode: multiply;
  opacity: 0.35;
  pointer-events: none;
  transition: opacity 0.45s ease;
}

.ppt-slide--light::before {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.6));
  opacity: 0.28;
}

.ppt-slide--dark {
  color: rgba(255, 255, 255, 0.95);
}

.ppt-slide--dark .ppt-text {
  color: rgba(255, 255, 255, 0.86);
}

.ppt-slide--light .ppt-text {
  color: rgba(15, 24, 42, 0.72);
}

.ppt-slide--active {
  opacity: 1;
  pointer-events: auto;
  transform: translate3d(0, 0, 0) scale(1);
  z-index: 3;
}

.ppt-slide--active::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 1px solid rgba(255, 255, 255, 0.24);
  mix-blend-mode: screen;
  opacity: 0.7;
  pointer-events: none;
}

.ppt-slide--before,
.ppt-slide--after {
  z-index: 1;
}

@media (prefers-reduced-motion: reduce) {
  .ppt-slide {
    transition: none;
    transform: none;
  }

  .ppt-slide--active {
    transform: none;
  }
}

.ppt-slide__content {
  position: relative;
  z-index: 1;
  margin: 0 auto;
  width: min(960px, 82vw);
  max-height: 100%;
  display: flex;
  flex-direction: column;
  gap: clamp(24px, 3vw, 40px);
  transform-origin: top center;
  transform: translateY(var(--ppt-translate, 0)) scale(var(--ppt-scale, 1));
  transition: transform 0.28s ease;
}

.ppt-badge {
  display: inline-flex;
  align-self: flex-start;
  padding: 10px 20px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  font-size: 0.88rem;
  letter-spacing: 0.26em;
  text-transform: uppercase;
}

.ppt-slide--light .ppt-badge {
  background: rgba(31, 72, 255, 0.16);
  color: #1f48ff;
}

.ppt-heading {
  margin: 0;
  font-size: clamp(2.8rem, 4.5vw, 4.2rem);
  line-height: 1.05;
  letter-spacing: -0.01em;
}

.ppt-title {
  margin: 0;
  font-size: clamp(2rem, 3.2vw, 2.8rem);
  font-weight: 700;
  letter-spacing: -0.01em;
}

.ppt-text {
  font-size: clamp(1.05rem, 1.6vw, 1.26rem);
  line-height: 1.65;
  max-width: 72ch;
  opacity: 0.9;
}

.ppt-actions {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(16px, 2vw, 24px);
}

.ppt-button {
  padding: clamp(14px, 1.4vw, 18px) clamp(26px, 2.5vw, 34px);
  border-radius: 999px;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.ppt-button--primary {
  background: var(--slide-accent, var(--active-accent));
  color: #060d24;
  box-shadow: 0 18px 48px rgba(6, 14, 36, 0.32);
}

.ppt-slide--dark .ppt-button--primary {
  color: #060d24;
}

.ppt-button--ghost {
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.24);
  color: rgba(255, 255, 255, 0.92);
}

.ppt-slide--light .ppt-button--ghost {
  background: rgba(15, 24, 42, 0.06);
  border-color: rgba(15, 24, 42, 0.16);
  color: var(--active-accent);
}

.ppt-button:hover,
.ppt-button:focus-visible {
  transform: translateY(-2px);
  box-shadow: 0 22px 48px rgba(6, 14, 36, 0.28);
}

.ppt-button:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.36);
  outline-offset: 3px;
}

.ppt-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: clamp(20px, 2.6vw, 32px);
}

.ppt-metric-card {
  padding: clamp(20px, 2.2vw, 28px);
  border-radius: clamp(18px, 2.4vw, 24px);
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.24);
  backdrop-filter: blur(18px);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ppt-slide--light .ppt-metric-card {
  background: rgba(255, 255, 255, 0.94);
  border-color: rgba(15, 24, 42, 0.08);
  box-shadow: 0 20px 40px rgba(15, 24, 42, 0.12);
}

.ppt-metric-label {
  font-size: 0.78rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0.75;
}

.ppt-metric-value {
  font-size: clamp(1.8rem, 3vw, 2.6rem);
  font-weight: 700;
  color: var(--slide-accent, #f08a00);
}

.ppt-metric-desc {
  font-size: 0.98rem;
  opacity: 0.82;
}

.ppt-feature-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: clamp(20px, 2.8vw, 32px);
  list-style: none;
  padding: 0;
  margin: 0;
}

.ppt-feature-list li {
  display: flex;
  gap: 18px;
  padding: clamp(20px, 2.4vw, 28px);
  border-radius: clamp(18px, 2.4vw, 24px);
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.26);
  backdrop-filter: blur(18px);
}

.ppt-slide--light .ppt-feature-list li {
  background: rgba(255, 255, 255, 0.96);
  border-color: rgba(15, 24, 42, 0.08);
  box-shadow: 0 18px 32px rgba(15, 24, 42, 0.12);
}

.ppt-feature-badge {
  display: inline-flex;
  min-width: 60px;
  justify-content: center;
  padding: 8px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.14);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-size: 0.78rem;
}

.ppt-slide--light .ppt-feature-badge {
  background: rgba(31, 72, 255, 0.18);
  color: #1f48ff;
}

.ppt-feature-content strong {
  font-size: 1.12rem;
  display: block;
  margin-bottom: 6px;
}

.ppt-feature-content p {
  margin: 0;
  font-size: 0.98rem;
  opacity: 0.85;
}

.ppt-tier-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: clamp(20px, 2.8vw, 32px);
}

.ppt-tier-card {
  padding: clamp(22px, 2.6vw, 30px);
  border-radius: clamp(20px, 2.6vw, 26px);
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.26);
  backdrop-filter: blur(18px);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.ppt-slide--light .ppt-tier-card {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(15, 24, 42, 0.08);
  box-shadow: 0 22px 44px rgba(15, 24, 42, 0.12);
}

.ppt-tier-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ppt-tier-tag {
  display: inline-flex;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.85rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.18);
}

.ppt-slide--light .ppt-tier-tag {
  background: rgba(31, 72, 255, 0.12);
  color: #1f48ff;
}

.ppt-tier-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  font-weight: 600;
}

.ppt-tier-price span {
  font-size: 0.9rem;
  letter-spacing: 0.1em;
  opacity: 0.72;
}

.ppt-tier-price strong {
  font-size: 1.6rem;
  color: var(--slide-accent, #f08a00);
}

.ppt-tier-price-note {
  font-size: 0.82rem;
  opacity: 0.7;
}

.ppt-tier-card__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ppt-tier-card__section-title {
  margin: 0;
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.8;
}

.ppt-tier-card__list {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 6px;
  font-size: 0.96rem;
  opacity: 0.85;
}

.ppt-tier-card__highlight {
  margin: 0;
  padding: 12px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 0.95rem;
  line-height: 1.5;
  opacity: 0.86;
}

.ppt-slide--light .ppt-tier-card__highlight {
  background: rgba(31, 72, 255, 0.08);
  color: rgba(15, 24, 42, 0.76);
}

.ppt-tier-detail {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: clamp(20px, 2.6vw, 32px);
}

.ppt-tier-detail__price {
  padding: clamp(20px, 2.4vw, 28px);
  border-radius: clamp(18px, 2.4vw, 24px);
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.26);
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.95rem;
}

.ppt-tier-detail__price span {
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.76;
}

.ppt-tier-detail__price strong {
  font-size: 1.8rem;
  color: var(--slide-accent, #f08a00);
}

.ppt-tier-detail__price small {
  font-size: 0.82rem;
  opacity: 0.7;
}

.ppt-tier-detail__section {
  padding: clamp(18px, 2.2vw, 26px);
  border-radius: clamp(18px, 2.4vw, 24px);
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.24);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ppt-slide--light .ppt-tier-detail__price,
.ppt-slide--light .ppt-tier-detail__section {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(15, 24, 42, 0.08);
  box-shadow: 0 20px 40px rgba(15, 24, 42, 0.12);
}

.ppt-tier-detail__section h3 {
  margin: 0;
  font-size: 1.02rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.8;
}

.ppt-tier-detail__section ul {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 6px;
  font-size: 0.95rem;
  opacity: 0.86;
}

.ppt-tier-detail__highlight {
  margin: 0;
  font-size: 0.98rem;
  line-height: 1.6;
  padding: 14px 18px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.16);
  opacity: 0.85;
}

.ppt-slide--light .ppt-tier-detail__highlight {
  background: rgba(31, 72, 255, 0.08);
  color: rgba(15, 24, 42, 0.76);
}

.ppt-faq-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: clamp(20px, 2.6vw, 30px);
}

.ppt-faq-item {
  padding: clamp(20px, 2.4vw, 28px);
  border-radius: clamp(18px, 2.4vw, 24px);
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.24);
  backdrop-filter: blur(18px);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ppt-slide--light .ppt-faq-item {
  background: rgba(255, 255, 255, 0.96);
  border-color: rgba(15, 24, 42, 0.08);
  box-shadow: 0 18px 36px rgba(15, 24, 42, 0.12);
}

.ppt-faq-item h3 {
  margin: 0;
  font-size: 1.08rem;
  letter-spacing: -0.01em;
}

.ppt-faq-item p {
  margin: 0;
  font-size: 0.95rem;
  opacity: 0.82;
  line-height: 1.6;
}

.ppt-controls {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(18px, 2.4vw, 32px);
  padding: clamp(18px, 2.4vw, 28px) clamp(36px, 4vw, 56px) clamp(28px, 3vw, 40px);
  background: linear-gradient(180deg, rgba(6, 14, 36, 0.65), rgba(6, 14, 36, 0.82));
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(22px);
}

.ppt-control {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.ppt-control:hover:not(:disabled),
.ppt-control:focus-visible:not(:disabled) {
  background: var(--active-accent);
  color: #060d24;
  transform: translateY(-1px);
  box-shadow: 0 14px 30px rgba(17, 32, 64, 0.28);
}

.ppt-control:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.36);
  outline-offset: 3px;
}

.ppt-control:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ppt-indicator {
  font-size: 0.95rem;
  letter-spacing: 0.18em;
  color: rgba(235, 240, 255, 0.72);
}

@media (min-width: 1360px) {
  .ppt-deck {
    width: 1280px;
    height: 760px;
  }
}

@media (max-width: 1023px) {
  .ppt-wrapper {
    padding: clamp(36px, 6vw, 64px) clamp(18px, 6vw, 48px);
  }

  .ppt-deck {
    width: min(1080px, 96vw);
    height: min(700px, 88vh);
  }
}

@media (max-width: 767px) {
  .ppt-wrapper {
    display: none;
  }

  .view-mode-toggle {
    display: none;
  }
}
@media (max-height: 720px) {
  .ppt-deck {
    height: calc(100vh - clamp(120px, 14vh, 180px));
  }

  .ppt-slide__content {
    padding-right: 4px;
  }
}

.recruit-manual::before,
.recruit-manual::after {
  content: '';
  position: fixed;
  width: 540px;
  height: 540px;
  border-radius: 50%;
  z-index: -2;
  filter: blur(120px);
  opacity: 0.65;
  transition: opacity 0.3s ease;
}

.recruit-manual::before {
  top: -180px;
  right: -160px;
  background: radial-gradient(circle, rgba(31, 72, 255, 0.28), transparent 65%);
}

.recruit-manual::after {
  bottom: -220px;
  left: -120px;
  background: radial-gradient(circle, rgba(240, 138, 0, 0.26), transparent 68%);
}

@media (prefers-color-scheme: dark) {
  .recruit-manual {
    background: var(--bg-dark);
    color: var(--text-light);
  }
  .recruit-manual::before,
  .recruit-manual::after {
    opacity: 0.45;
  }
}

.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.hero {
  position: relative;
  padding: clamp(40px, 5vw, 80px) clamp(12px, 4vw, 32px) clamp(36px, 4vw, 60px);
  overflow: hidden;
}

.hero::after {
  content: '';
  position: absolute;
  inset: clamp(12px, 3vw, 24px);
  border-radius: clamp(30px, 4vw, 46px);
  background: linear-gradient(140deg, rgba(31, 72, 255, 0.22), rgba(23, 198, 200, 0.18));
  filter: blur(280px);
  z-index: -1;
}

.hero__container {
  margin: 0 auto;
  max-width: 1024px;
  border-radius: clamp(28px, 4vw, 40px);
  background: linear-gradient(165deg, rgba(255, 209, 0, 0.98), rgba(253, 239, 177, 0.92));
  backdrop-filter: blur(26px);
  border: 1px solid rgba(255, 209, 0, 0.4);
  box-shadow: var(--shadow-xl);
  padding: clamp(36px, 5vw, 56px);
  position: relative;
  overflow: hidden;
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(31, 72, 255, 0.12);
  color: var(--brand-blue);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.18em;
}

.hero__title {
  font-size: clamp(2.4rem, 5vw, 3.6rem);
  margin: clamp(20px, 3vw, 26px) 0 16px;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.hero__subtitle {
  max-width: 640px;
  font-size: clamp(1.02rem, 2.4vw, 1.18rem);
  color: var(--text-sub);
  margin-bottom: clamp(24px, 4vw, 36px);
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: clamp(24px, 4vw, 36px);
}

.hero__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 24px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  box-shadow: var(--shadow-md);
  transition: transform 0.25s ease, box-shadow 0.25s ease, filter 0.25s ease;
  text-decoration: none;
}

.hero__btn--primary {
  background: linear-gradient(135deg, var(--brand-blue) 0%, #5b78ff 100%);
  color: #fff;
}

.hero__btn--ghost {
  background: rgba(15, 24, 42, 0.04);
  color: var(--brand-blue);
  border: 1px solid rgba(31, 72, 255, 0.24);
}

.hero__btn:hover,
.hero__btn:focus-visible {
  transform: translateY(-2px);
  box-shadow: 0 18px 36px rgba(31, 72, 255, 0.24);
}

 .hero__metrics {
   display: grid;
   grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
   gap: clamp(16px, 3vw, 22px);
 }

 .metric-card {
   border-radius: 22px;
   position: relative;
   overflow: hidden;
   padding: 1px;
 }

 .metric-card__glass {
   display: flex;
   flex-direction: column;
   gap: 6px;
   padding: 20px;
   border-radius: inherit;
   background: rgba(255, 255, 255, 0.9);
   backdrop-filter: blur(16px);
   min-height: 140px;
 }

.metric-card__label {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: rgba(17, 32, 50, 0.6);
}

.metric-card__value {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--accent-strong);
}

.metric-card__desc {
  font-size: 13px;
  color: rgba(17, 32, 50, 0.6);
}

.anchor-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  margin: clamp(10px, 2vw, 14px) auto;
  max-width: 960px;
  padding: 10px clamp(8px, 4vw, 20px);
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(241, 244, 255, 0.92));
  backdrop-filter: blur(18px);
  border: 1px solid rgba(36, 54, 110, 0.12);
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  box-shadow: var(--shadow-md);
}

.anchor-nav__item {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 8px 18px;
  border-radius: 999px;
  color: rgba(15, 24, 42, 0.68);
  transition: background 0.25s ease, color 0.25s ease, transform 0.25s ease;
  text-decoration: none;
}

.anchor-nav__item:hover,
.anchor-nav__item:focus-visible {
  background: rgba(31, 72, 255, 0.12);
  color: var(--brand-blue);
  transform: translateY(-1px);
}

@media (prefers-color-scheme: dark) {
  .anchor-nav {
    background: rgba(10, 20, 40, 0.88);
    border-color: rgba(43, 63, 112, 0.38);
  }
  .anchor-nav__item {
    color: rgba(223, 232, 255, 0.72);
  }
}

main {
  flex: 1;
  padding: clamp(40px, 5vw, 60px) clamp(12px, 4vw, 24px);
}

.section {
  max-width: 1024px;
  margin: 0 auto clamp(48px, 6vw, 72px);
  background: var(--surface);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(226, 232, 240, 0.62);
  box-shadow: var(--shadow-lg);
  padding: clamp(32px, 4vw, 46px) clamp(26px, 4vw, 52px);
  position: relative;
  overflow: hidden;
  scroll-margin-top: 120px;
}

.section::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 12% 20%, rgba(31, 72, 255, 0.08), transparent 60%),
    radial-gradient(circle at 88% 80%, rgba(244, 178, 63, 0.12), transparent 66%);
  opacity: 0.6;
  pointer-events: none;
}

#overview {
  background: linear-gradient(170deg, rgba(255, 255, 255, 0.96), rgba(254, 244, 205, 0.82));
  border-color: rgba(255, 209, 0, 0.38);
}

#overview::before {
  background: radial-gradient(circle at 18% 24%, rgba(255, 209, 0, 0.22), transparent 60%),
    radial-gradient(circle at 82% 76%, rgba(31, 72, 255, 0.12), transparent 70%);
  opacity: 0.68;
}

#overview .section__eyebrow {
  color: rgba(58, 106, 255, 0.65);
}

#overview .section__title {
  color: var(--brand-navy);
}

#overview .section__description {
  color: rgba(15, 24, 42, 0.7);
}

.section__header {
  position: relative;
  margin-bottom: clamp(24px, 3vw, 32px);
  display: grid;
  gap: 12px;
  max-width: 720px;
}

.section__eyebrow {
  font-size: 12px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-weight: 600;
  color: rgba(17, 32, 50, 0.54);
}

.section__title {
  font-size: clamp(1.8rem, 3.4vw, 2.4rem);
  letter-spacing: -0.01em;
  margin: 0;
}

.section__description {
  font-size: 15px;
  color: var(--text-sub);
  margin: 0;
}

#benefits {
  background: linear-gradient(175deg, rgba(255, 255, 255, 0.96), rgba(243, 247, 255, 0.92));
  border-color: rgba(210, 217, 232, 0.5);
}

#benefits::before {
  background: radial-gradient(circle at 18% 24%, rgba(31, 72, 255, 0.12), transparent 62%),
    radial-gradient(circle at 82% 76%, rgba(255, 209, 0, 0.14), transparent 70%);
  opacity: 0.6;
}

#benefits .section__eyebrow {
  color: rgba(31, 72, 255, 0.7);
}

#benefits .section__title {
  color: var(--brand-navy);
}

#benefits .section__description {
  color: rgba(15, 24, 42, 0.72);
}

#tiers {
  background: linear-gradient(178deg, rgba(255, 255, 255, 0.96), rgba(244, 248, 255, 0.9));
  border-color: rgba(210, 217, 232, 0.45);
}

#tiers::before {
  background: radial-gradient(circle at 18% 24%, rgba(31, 72, 255, 0.12), transparent 62%),
    radial-gradient(circle at 82% 76%, rgba(255, 209, 0, 0.12), transparent 70%);
  opacity: 0.6;
}

#tiers .section__eyebrow {
  color: rgba(31, 72, 255, 0.7);
}

#tiers .section__title {
  color: var(--brand-navy);
}

#tiers .section__description {
  color: rgba(15, 24, 42, 0.72);
}

.section#support,
#support {
  background: linear-gradient(178deg, rgba(255, 255, 255, 0.96), rgba(243, 247, 255, 0.9));
  border-color: rgba(210, 217, 232, 0.45);
}

#support::before {
  background: radial-gradient(circle at 18% 24%, rgba(31, 72, 255, 0.1), transparent 62%),
    radial-gradient(circle at 82% 76%, rgba(255, 209, 0, 0.1), transparent 70%);
  opacity: 0.5;
}

#support .section__eyebrow {
  color: rgba(31, 72, 255, 0.68);
}

#support .section__title {
  color: var(--brand-navy);
}

#support .section__description {
  color: rgba(15, 24, 42, 0.72);
}

#faq .section__title {
  color: var(--brand-blue);
}

.grid-4 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: clamp(18px, 3vw, 24px);
  position: relative;
  z-index: 1;
}

.tiers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: clamp(18px, 3vw, 24px);
  position: relative;
  z-index: 1;
}

.tier-card {
  border-radius: var(--radius-lg);
  border: 1px solid rgba(210, 217, 232, 0.55);
  background: linear-gradient(184deg, rgba(255, 255, 255, 0.98), rgba(249, 252, 255, 0.94));
  box-shadow: 0 18px 36px rgba(24, 38, 72, 0.1);
  padding: clamp(22px, 3vw, 32px);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.tier-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.tier-card__title-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tier-card__tag {
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(31, 72, 255, 0.7);
}

.tier-card__title {
  font-size: 1.3rem;
  color: var(--brand-navy);
  margin: 0;
}

.tier-card__price {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tier-card__price-label {
  font-size: 12px;
  color: rgba(15, 24, 42, 0.6);
}

.tier-card__price strong {
  font-size: 1.2rem;
  color: var(--accent-strong);
}

.tier-card__price-note {
  font-size: 11px;
  color: rgba(15, 24, 42, 0.55);
}

.tier-card__section {
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.6);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
  padding: 16px;
  display: grid;
  gap: 10px;
}

.tier-card__section-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: rgba(15, 24, 42, 0.75);
  margin: 0;
}

.tier-card__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 6px;
  color: rgba(15, 24, 42, 0.72);
  font-size: 0.94rem;
}

.tier-card__list li {
  position: relative;
  padding-left: 16px;
}

.tier-card__list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 9px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(31, 72, 255, 0.6), rgba(255, 209, 0, 0.6));
}

.tier-card__highlight {
  padding: 14px 16px;
  border-radius: var(--radius-sm);
  background: rgba(255, 244, 207, 0.8);
  border: 1px dashed rgba(255, 209, 0, 0.5);
  color: var(--accent-strong);
  font-size: 0.94rem;
  line-height: 1.55;
}

.feature-card {
  padding: clamp(20px, 3vw, 26px);
  border-radius: var(--radius-md);
  border: 1px solid rgba(210, 217, 232, 0.5);
  background: linear-gradient(183deg, rgba(255, 255, 255, 0.98), rgba(244, 248, 255, 0.92));
  box-shadow: 0 14px 30px rgba(24, 38, 72, 0.08);
  display: grid;
  gap: 12px;
  position: relative;
  overflow: hidden;
}

.feature-card__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  background: rgba(31, 72, 255, 0.12);
  color: var(--brand-blue);
  width: max-content;
}

.feature-card__title {
  font-size: 1.12rem;
  font-weight: 700;
  margin: 0;
  color: var(--brand-navy);
}

.feature-card__text {
  font-size: 0.95rem;
  color: rgba(15, 24, 42, 0.68);
  margin: 0;
}

.policy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: clamp(20px, 3vw, 28px);
  position: relative;
  z-index: 1;
}

.policy-card {
  border-radius: clamp(24px, 3vw, 32px);
  border: 1px solid rgba(210, 217, 232, 0.55);
  padding: clamp(26px, 3.4vw, 34px);
  background: linear-gradient(184deg, rgba(255, 255, 255, 0.98), rgba(248, 251, 255, 0.94));
  box-shadow: 0 16px 34px rgba(24, 38, 72, 0.1);
  display: flex;
  flex-direction: column;
  gap: clamp(18px, 3vw, 26px);
  position: relative;
  overflow: hidden;
}

.policy-card__glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 24% 20%, rgba(255, 209, 0, 0.16), transparent 60%),
    radial-gradient(circle at 84% 80%, rgba(31, 72, 255, 0.12), transparent 70%);
  opacity: 0.6;
  pointer-events: none;
  z-index: 0;
}

.policy-card__header {
  position: relative;
  display: grid;
  gap: 6px;
  z-index: 1;
}

.policy-card__title {
  color: var(--brand-navy);
  font-size: 1.2rem;
}

.policy-card__price {
  color: var(--brand-blue);
  font-weight: 600;
  font-size: 1.05rem;
}

.policy-card__highlight {
  color: var(--accent-strong);
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: 0.02em;
}

.policy-card__list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
  position: relative;
  z-index: 1;
}

.policy-card__item {
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(226, 232, 240, 0.65);
  box-shadow: 0 10px 22px rgba(24, 38, 72, 0.08);
  font-size: 0.96rem;
  color: rgba(15, 24, 42, 0.72);
  position: relative;
}

.policy-card__item::before {
  content: '';
  position: absolute;
  left: 14px;
  top: 14px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(31, 72, 255, 0.5), rgba(23, 198, 200, 0.6));
  box-shadow: 0 0 0 6px rgba(31, 72, 255, 0.08);
}

.policy-card__item span {
  display: inline-block;
  margin-left: 16px;
}

.policy-card__note {
  border-radius: var(--radius-sm);
  padding: clamp(14px, 3vw, 18px);
  border: 1px dashed rgba(255, 209, 0, 0.45);
  background: rgba(255, 250, 228, 0.85);
  color: var(--accent-strong);
  font-size: 0.95rem;
  line-height: 1.55;
  position: relative;
  z-index: 1;
}

.support-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: clamp(18px, 3vw, 24px);
  position: relative;
  z-index: 1;
}


.faq {
  display: grid;
  gap: clamp(12px, 2vw, 16px);
  position: relative;
  z-index: 1;
}

.faq__item {
  border-radius: var(--radius-sm);
  border: 1px solid rgba(210, 217, 232, 0.66);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: var(--shadow-md);
  padding: clamp(18px, 3vw, 24px);
  font-size: 0.96rem;
  color: var(--text);
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.faq__item[open] {
  border-color: rgba(31, 72, 255, 0.38);
  box-shadow: 0 20px 36px rgba(31, 72, 255, 0.18);
}

.faq__question {
  list-style: none;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.faq__question::-webkit-details-marker {
  display: none;
}

.faq__question::after {
  content: '＋';
  font-size: 18px;
  color: rgba(15, 24, 42, 0.38);
  transition: transform 0.2s ease;
}

.faq__item[open] .faq__question::after {
  transform: rotate(45deg);
  color: var(--brand-blue);
}

.faq__answer {
  margin: clamp(10px, 2vw, 14px) 0 0;
  color: var(--text-sub);
  font-size: 0.95rem;
}

.cta {
  max-width: 1120px;
  margin: 0 auto;
  padding: clamp(36px, 4vw, 48px);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, rgba(31, 72, 255, 0.9), rgba(23, 198, 200, 0.9));
  color: #fff;
  box-shadow: 0 32px 58px rgba(31, 72, 255, 0.28);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.cta__title {
  position: relative;
  font-size: clamp(0.9rem, calc((100vw - 64px) / 16), 2.6rem);
  white-space: nowrap;
  margin: 0 0 clamp(12px, 2vw, 16px);
}

.cta__text {
  position: relative;
  margin: 0 0 clamp(16px, 2vw, 20px);
  font-size: 1.02rem;
  line-height: 1.6;
}

.cta__actions {
  position: relative;
}

.cta__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 28px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  color: var(--brand-blue);
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.25s ease, filter 0.25s ease;
}

.cta__button:hover,
.cta__button:focus-visible {
  transform: translateY(-2px);
  filter: brightness(1.05);
}

.footer {
  margin: clamp(32px, 6vw, 48px) auto clamp(46px, 7vw, 68px);
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  color: rgba(17, 32, 50, 0.6);
}

.footer__link {
  color: inherit;
  text-decoration: underline;
  font-weight: 600;
  transition: color 0.2s ease;
}

.footer__link:hover,
.footer__link:focus-visible {
  color: rgba(31, 72, 255, 0.8);
}

@media (prefers-color-scheme: dark) {
  .footer {
    color: rgba(217, 226, 255, 0.56);
  }
}

@media (max-width: 768px) {
  .hero__title {
    font-size: clamp(2.1rem, 8vw, 3rem);
  }
  .hero__metrics {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }
  .policy-grid {
    grid-template-columns: 1fr;
  }
  .section {
    padding: clamp(24px, 6vw, 32px);
  }
}

@media (max-width: 480px) {
  .hero {
    padding: 28px 16px 32px;
  }
  .hero__container {
    padding: 24px 16px 32px;
    border-radius: 24px;
  }
}
</style>
