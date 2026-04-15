<template>
  <div class="training-home">
    <section class="training-home__search" aria-label="培训搜索">
      <i class="training-home__search-icon" aria-hidden="true"></i>
      <input
        type="search"
        v-model.trim="searchKeyword"
        placeholder="请输入搜索内容"
        @keyup.enter="handleSearch"
      />
      <button type="button" @click="handleSearch">搜索</button>
    </section>

    <section class="training-hero" aria-label="展业培训指南">
      <div class="training-hero__content">
        <p class="training-hero__eyebrow">{{ heroCard.eyebrow }}</p>
        <h1>{{ heroCard.title }}</h1>
        <p class="training-hero__subtitle">{{ heroCard.subtitle }}</p>
        <div class="training-hero__chips">
          <span v-for="chip in heroCard.tags" :key="chip">{{ chip }}</span>
        </div>
        <p class="training-hero__meta">{{ heroCard.meta }}</p>
        <div class="training-hero__cta">
          <button type="button" @click="openHeroPrimary">{{ heroCard.primaryCta }}</button>
          <button type="button" class="ghost" @click="openHeroSecondary">{{ heroCard.secondaryCta }}</button>
        </div>
      </div>
      <div class="training-hero__media">
        <van-swipe
          v-if="heroSlides.length"
          class="training-hero__swipe"
          :autoplay="4500"
          indicator-color="#fde68a"
        >
          <van-swipe-item
            v-for="slide in heroSlides"
            :key="slide.id"
            class="training-hero__slide"
            @click="handleHeroSlide(slide)"
          >
            <img
              :src="slide.image"
              :alt="slide.title || heroCard.title"
              loading="lazy"
              @error="handleHeroImageError"
            />
          </van-swipe-item>
        </van-swipe>
        <div v-else class="training-hero__fallback">
          <img :src="heroCard.image" :alt="heroCard.title" loading="lazy" />
        </div>
        <span class="training-hero__badge">{{ heroCard.badge }}</span>
        <p class="training-hero__footnote">{{ heroCard.footnote }}</p>
      </div>
    </section>

    <section class="training-clients" aria-label="服务的企业">
      <header>
        <h2>服务的企业</h2>
        <p>为行业头部企业提供线上线下展业服务</p>
      </header>
      <div class="training-clients__grid">
        <div v-for="client in clientList" :key="client.key" class="training-clients__item">
          <div class="training-clients__logo" :style="client.image && !client.imageError ? '' : { background: client.tint }">
            <img
              v-if="client.image"
              :src="client.image"
              :alt="client.name"
              class="client-logo-img"
              @error="handleImageError(client.key)"
            />
            <span v-else-if="client.imageError || !client.image">{{ client.icon }}</span>
          </div>
          <p>{{ client.name }}</p>
        </div>
      </div>
    </section>

    <training-section
      v-for="section in primarySections"
      :key="section.key"
      :section="section"
      @more="handleSectionMore"
      @select="handleSectionSelect"
    />

    <section v-if="infoEntries.length" class="training-home__info-grid" aria-label="培训工具导航">
      <button
        v-for="entry in infoEntries"
        :key="entry.key"
        type="button"
        @click="handleInfoEntry(entry)"
      >
        <span class="training-home__info-icon" :style="{ background: entry.tint }">{{ entry.icon }}</span>
        <div>
          <strong>{{ entry.label }}</strong>
          <p>{{ entry.description }}</p>
        </div>
      </button>
    </section>

    <training-section
      v-for="section in secondarySections"
      :key="section.key"
      :section="section"
      @more="handleSectionMore"
      @select="handleSectionSelect"
    />

    <section v-if="calendarList.length" class="training-calendar" aria-label="培训排期">
      <header>
        <div>
          <p>培训日历</p>
          <h2>近期排期</h2>
        </div>
        <button type="button" @click="handleCalendarMore">全部日程</button>
      </header>
      <ul>
        <li v-for="event in calendarList" :key="event.id">
          <div>
            <p class="training-calendar__date">{{ formatScheduleLabel(event.date) }}</p>
            <p class="training-calendar__title">{{ event.title }}</p>
            <p class="training-calendar__meta">{{ event.channel }} · {{ event.owner }}</p>
          </div>
          <button type="button" class="ghost" @click="handleCalendarJoin(event)">
            {{ event.cta || '报名' }}
          </button>
        </li>
      </ul>
    </section>

    <section class="training-feedback" aria-label="意见收集">
      <div class="training-feedback__copy">
        <p>意见反馈</p>
        <h2>想要新增什么培训？</h2>
        <p>告诉展业学院你的场景需求，我们将在下周直播排期中优先安排。</p>
      </div>
      <button type="button" @click="openFeedback">提交建议</button>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import TrainingSection from './components/TrainingSection.vue'
import { getBanners, getPublicContentFeed } from '@/api/home'
import heroBannerFallback from '@/assets/images/share-banner.jpg'

const router = useRouter()
const searchKeyword = ref('')
const useStaticHomeData = ref(shouldUseStaticMode())
const heroCard = ref(buildTrainingHero())
const heroSlides = ref(buildHeroSlides())
const trainingSections = ref(buildTrainingSectionsFallback())
const infoEntries = ref(buildInfoEntries())
const calendarList = ref(buildCalendarList())
const clientList = ref(buildClientList())

const primarySections = computed(() => trainingSections.value.slice(0, 1))
const secondarySections = computed(() => trainingSections.value.slice(1))

const monthDayFormatter = new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' })
const weekdayFormatter = new Intl.DateTimeFormat('zh-CN', { weekday: 'short' })

onMounted(() => {
  if (!useStaticHomeData.value) initHome()
})

watch(useStaticHomeData, enabled => {
  if (!enabled) initHome()
})

async function initHome() {
  if (useStaticHomeData.value) return
  await Promise.allSettled([fetchHeroSlides(), fetchTrainingFeed()])
}

async function fetchHeroSlides() {
  try {
    const res = await getBanners()
    const list = Array.isArray(res?.data) ? res.data : []
    if (list.length) {
      heroSlides.value = normalizeSlides(list)
    }
  } catch (error) {
    console.warn('获取 banner 失败', error)
    enableStaticMode()
  }
}

async function fetchTrainingFeed() {
  try {
    const res = await getPublicContentFeed()
    const payload = res?.data?.trainingHome || res?.data?.training || res?.data || {}
    applyTrainingPayload(payload)
  } catch (error) {
    console.warn('获取培训内容失败', error)
    enableStaticMode()
  }
}

function applyTrainingPayload(payload = {}) {
  if (payload.hero) heroCard.value = normalizeHero(payload.hero)
  if (Array.isArray(payload.sections) && payload.sections.length) {
    trainingSections.value = normalizeSections(payload.sections)
  }
  if (Array.isArray(payload.infoEntries) && payload.infoEntries.length) {
    infoEntries.value = normalizeInfoEntries(payload.infoEntries)
  }
  if (Array.isArray(payload.calendar) && payload.calendar.length) {
    calendarList.value = normalizeCalendar(payload.calendar)
  }
}

function handleSearch() {
  const keyword = searchKeyword.value.trim()
  if (!keyword) {
    showToast('请输入培训关键词')
    return
  }
  navigateOrToast({ path: '/training/search', query: { keyword } }, '搜索即将上线')
}

function openHeroPrimary() {
  navigateOrToast(heroCard.value.primaryLink || '/training/live', '直播暂未开放')
}

function openHeroSecondary() {
  navigateOrToast(heroCard.value.secondaryLink || '/training/replay', '回放暂未开放')
}

function handleHeroSlide(slide) {
  if (!slide?.link) return
  if (typeof slide.link === 'string' && slide.link.startsWith('http')) {
    if (typeof window !== 'undefined') window.open(slide.link, '_blank')
    return
  }
  navigateOrToast(slide.link, '跳转暂不可用')
}

function handleSectionSelect(item) {
  if (item?.path || item?.to) {
    navigateOrToast(item.path || item.to, item.toast || '课程即将上线')
    return
  }
  if (item?.link && typeof window !== 'undefined') {
    window.open(item.link, '_blank')
    return
  }
  showToast(item?.toast || '课程即将上线')
}

function handleSectionMore(section) {
  navigateOrToast(section?.path || '/training/catalogue', '目录暂未开放')
}

function handleInfoEntry(entry) {
  if (entry?.external && typeof window !== 'undefined') {
    window.open(entry.external, '_blank')
    return
  }
  navigateOrToast(entry?.path, entry?.toast || '功能即将上线')
}

function handleCalendarMore() {
  navigateOrToast('/training/calendar', '排期即将上线')
}

function handleCalendarJoin(event) {
  navigateOrToast(event?.path || event?.link, event?.toast || '报名即将开放')
}

function openFeedback() {
  navigateOrToast('/training/feedback', '反馈渠道暂未开通')
}

function handleHeroImageError(event) {
  const target = event?.target
  if (!target) return
  target.src = heroBannerFallback
}

function navigateOrToast(target, fallbackMessage = '功能即将上线') {
  if (!target) {
    showToast(fallbackMessage)
    return
  }
  if (typeof target === 'string' && /^https?:\/\//i.test(target)) {
    if (typeof window !== 'undefined') window.open(target, '_blank')
    return
  }
  const destination = typeof target === 'string' ? { path: target } : target
  router.push(destination).catch(() => showToast(fallbackMessage))
}

function formatScheduleLabel(dateLike) {
  if (!dateLike) return ''
  const date = new Date(dateLike)
  if (Number.isNaN(date.getTime())) return ''
  return `${monthDayFormatter.format(date)} ${weekdayFormatter.format(date)}`
}

function normalizeHero(payload = {}) {
  const fallback = buildTrainingHero()
  return {
    ...fallback,
    eyebrow: payload.eyebrow || payload.label || fallback.eyebrow,
    title: payload.title || fallback.title,
    subtitle: payload.subtitle || payload.description || fallback.subtitle,
    tags: Array.isArray(payload.tags) && payload.tags.length ? payload.tags : fallback.tags,
    meta: payload.meta || payload.updatedAt || fallback.meta,
    badge: payload.badge || fallback.badge,
    footnote: payload.footnote || fallback.footnote,
    primaryCta: payload.primaryCta || fallback.primaryCta,
    secondaryCta: payload.secondaryCta || fallback.secondaryCta,
    primaryLink: payload.primaryLink || payload.primaryPath || fallback.primaryLink,
    secondaryLink: payload.secondaryLink || payload.secondaryPath || fallback.secondaryLink,
    image: resolveBannerImage(payload.image || payload.bannerImage || fallback.image)
  }
}

function normalizeSections(sections = []) {
  return sections.map((section, index) => ({
    key: section.key || `section-${index}`,
    title: section.title || `栏目 ${index + 1}`,
    totalLabel: section.totalLabel || section.moreLabel || '全部',
    description: section.description || '',
    variant: section.variant || 'default',
    path: section.path,
    items: Array.isArray(section.items) && section.items.length ? section.items.map(normalizeSectionItem) : []
  }))
}

function normalizeSectionItem(item = {}, index = 0) {
  return {
    id: item.id || `item-${index}`,
    title: item.title || item.name || '未命名课程',
    subtitle: item.subtitle || item.description || '',
    meta: item.meta || item.time || '',
    duration: item.duration || '',
    tag: item.tag || item.category || '',
    badge: item.badge,
    path: item.path,
    to: item.to,
    link: item.link,
    toast: item.toast,
    tint: item.tint,
    cover: resolveBannerImage(item.cover || item.image || '')
  }
}

function normalizeSlides(list = []) {
  return list
    .map((item, index) => ({
      id: item.id || index,
      title: item.title || item.name || '',
      image: resolveBannerImage(item.cover || item.image || item.imageUrl || item.url),
      link: item.link || item.to || item.path || ''
    }))
    .filter(item => item.image)
}

function normalizeInfoEntries(entries = []) {
  return entries.map((entry, index) => ({
    key: entry.key || `info-${index}`,
    label: entry.label || entry.title || '导航',
    description: entry.description || '',
    icon: entry.icon || '📘',
    tint: entry.tint || 'linear-gradient(135deg, #fee2e2, #fecdd3)',
    path: entry.path,
    toast: entry.toast
  }))
}

function normalizeCalendar(list = []) {
  return list.map((event, index) => ({
    id: event.id || `calendar-${index}`,
    title: event.title || '培训课程',
    date: event.date || event.startTime,
    channel: event.channel || '直播',
    owner: event.owner || '展业学院',
    path: event.path,
    link: event.link,
    cta: event.cta || '报名'
  }))
}

function buildTrainingHero() {
  const today = new Date()
  return {
    eyebrow: '内部培训空间',
    title: '星驿付展业指南',
    subtitle: '商户进件 · 库存管理 · 收益管理 · 展业必修',
    tags: ['商户进件', '库存管理', '收益管理', '展业必修'],
    meta: `更新于 ${today.getMonth() + 1}月${today.getDate()}日`,
    badge: '0-1 快速展业指南',
    footnote: '展业训练营 · 周四 19:30',
    primaryCta: '预约直播',
    secondaryCta: '查看回放',
    primaryLink: '/training/live',
    secondaryLink: '/training/replay',
    image: heroBannerFallback
  }
}

function buildHeroSlides() {
  return [
    { id: 'guide', title: '0-1 快速展业指南', image: heroBannerFallback },
    {
      id: 'merchant-toolkit',
      title: '终端物料工具包',
      image: 'https://img01.yzcdn.cn/vant/apple-1.jpg'
    }
  ]
}

function buildTrainingSectionsFallback() {
  return [
    {
      key: 'featured',
      title: '课程精选',
      totalLabel: '全部6门',
      variant: 'course',
      items: [
        {
          id: 'course-enroll',
          title: '联合收单活动报名',
          subtitle: '从物料发放到渠道核销，一次看懂',
          meta: '直播回放 · 28 分钟',
          tag: '运营活动',
          badge: '必修',
          cover: 'https://cdn.vuetifyjs.com/images/cards/foster.jpg'
        },
        {
          id: 'course-data',
          title: '星驿秘书经营数据中心功能',
          subtitle: '指标拆解 + 看板搭建演示',
          meta: '实操课程 · 35 分钟',
          tag: '数据中台',
          cover: 'https://cdn.vuetifyjs.com/images/cards/road.jpg'
        },
        {
          id: 'course-classroom',
          title: '星驿学堂功能导览',
          subtitle: '培训资源聚合 + 考核模板',
          meta: '图文 / H5',
          tag: '工具功能',
          cover: 'https://img01.yzcdn.cn/vant/cat.jpeg'
        },
        {
          id: 'course-merchant',
          title: '星驿付商户整改功能',
          subtitle: '巡检整改闭环与提醒',
          meta: '案例拆解 · 18 分钟',
          tag: '商户共建',
          cover: 'https://cdn.vuetifyjs.com/images/cards/plane.jpg'
        },
        {
          id: 'course-agency',
          title: '服务商联合收单活动报名指引',
          subtitle: '用一套话术搞定地推',
          meta: '直播预约 · 11月29日',
          tag: '展业技巧',
          badge: '直播预告',
          cover: 'https://cdn.vuetifyjs.com/images/cards/house.jpg'
        },
        {
          id: 'course-smart-terminal',
          title: '驿收款功能快速培训',
          subtitle: '终端激活到分润核算',
          meta: '回放 · 32 分钟',
          tag: '终端',
          cover: 'https://cdn.vuetifyjs.com/images/cards/docks.jpg'
        }
      ]
    },
    {
      key: 'product-highlights',
      title: '产品亮点',
      totalLabel: '全部12门',
      description: '按月发布的功能速递，便于展业场景复盘',
      variant: 'highlight',
      items: [
        {
          id: 'highlight-nov',
          title: '11月功能速递',
          subtitle: '聚焦 SaaS 终端 + 商户分层策略',
          meta: '刊物 · 2025年11月',
          tag: '刊物',
          tint: 'linear-gradient(135deg, #f97316, #fcd34d)'
        },
        {
          id: 'highlight-oct',
          title: '产品10月刊',
          subtitle: '联营产品体验改进',
          meta: '刊物 · 2025年10月',
          tag: '刊物',
          tint: 'linear-gradient(135deg, #fda4af, #fecdd3)'
        },
        {
          id: 'highlight-speed',
          title: '10月功能速递',
          subtitle: '0-1 展业物料更新',
          meta: '刊物 · 2025年10月',
          tag: '功能速递',
          tint: 'linear-gradient(135deg, #bae6fd, #7dd3fc)'
        },
        {
          id: 'highlight-sep',
          title: '产品9月刊',
          subtitle: '智慧场景模板 + API 新增',
          meta: '刊物 · 2025年9月',
          tag: '刊物',
          tint: 'linear-gradient(135deg, #ddd6fe, #c4b5fd)'
        }
      ]
    },
    {
      key: 'smart-scenarios',
      title: '智慧场景',
      totalLabel: '全部14门',
      variant: 'scenario',
      items: [
        {
          id: 'scene-beauty',
          title: '美业解决方案',
          subtitle: '连锁付费体验 + 店员分佣指南',
          meta: '场景指引',
          tag: '行业方案',
          tint: 'linear-gradient(135deg, #fee2e2, #fecaca)'
        },
        {
          id: 'scene-parking',
          title: '停车场解决方案',
          subtitle: '进出场识别 + 无感支付',
          meta: '解决方案',
          tag: '智慧城市',
          tint: 'linear-gradient(135deg, #fef3c7, #fde68a)'
        },
        {
          id: 'scene-community',
          title: '社区解决方案',
          subtitle: '社区团购 + 生活缴费',
          meta: '案例包',
          tag: '社区',
          tint: 'linear-gradient(135deg, #e0f2fe, #bae6fd)'
        },
        {
          id: 'scene-religion',
          title: '宗教场景解决方案',
          subtitle: '香火 + 文创周边收款',
          meta: '运营白皮书',
          tag: '场景拓展',
          tint: 'linear-gradient(135deg, #ede9fe, #ddd6fe)'
        }
      ]
    },
    {
      key: 'recent-replay',
      title: '近期回放',
      totalLabel: '全部10门',
      variant: 'replay',
      items: [
        {
          id: 'replay-religion',
          title: '驿宗教功能培训',
          subtitle: '分润方案 + 终端改造',
          meta: '回放 · 42 分钟',
          tag: '回放',
          cover: 'https://cdn.vuetifyjs.com/images/cards/forest.jpg'
        },
        {
          id: 'replay-event',
          title: '联合收单业务介绍',
          subtitle: '从报名到返佣',
          meta: '回放 · 35 分钟',
          tag: '业务',
          cover: 'https://cdn.vuetifyjs.com/images/cards/road.jpg'
        },
        {
          id: 'replay-service',
          title: '服务商联合收单活动报名实操',
          subtitle: '7 个高频问题解答',
          meta: '回放 · 31 分钟',
          tag: '服务商',
          cover: 'https://cdn.vuetifyjs.com/images/cards/sunshine.jpg'
        },
        {
          id: 'replay-terminal',
          title: '驿收款功能技能培训',
          subtitle: '终端组合拳案例',
          meta: '回放 · 24 分钟',
          tag: '终端',
          cover: 'https://cdn.vuetifyjs.com/images/cards/plane.jpg'
        }
      ]
    }
  ]
}

function buildInfoEntries() {
  return [
    {
      key: 'category',
      label: '课程分类',
      description: '产品介绍/指南/终端场景',
      icon: '📚',
      tint: 'linear-gradient(135deg, #fee2e2, #fecdd3)',
      path: '/training/catalogue'
    },
    {
      key: 'live',
      label: '培训回放',
      description: '直播/回放合集',
      icon: '📺',
      tint: 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
      path: '/training/replay'
    },
    {
      key: 'feedback',
      label: '意见反馈',
      description: '建议/吐槽',
      icon: '💬',
      tint: 'linear-gradient(135deg, #fef3c7, #fde68a)',
      path: '/training/feedback'
    }
  ]
}

function buildCalendarList() {
  const today = new Date()
  const oneDay = 24 * 60 * 60 * 1000
  return [
    {
      id: 'calendar-1',
      title: '驿宗教功能培训',
      date: new Date(today.getTime() + oneDay).toISOString(),
      channel: '直播',
      owner: '展业学院',
      path: '/training/live/religion',
      cta: '预约'
    },
    {
      id: 'calendar-2',
      title: '服务商联合收单业务介绍',
      date: new Date(today.getTime() + oneDay * 3).toISOString(),
      channel: '直播',
      owner: '展业学院',
      path: '/training/live/agency',
      cta: '报名'
    },
    {
      id: 'calendar-3',
      title: '终端改造工作坊',
      date: new Date(today.getTime() + oneDay * 5).toISOString(),
      channel: '直播 + 回放',
      owner: '展业学院',
      path: '/training/live/device',
      cta: '占座'
    }
  ]
}

function buildClientList() {
  return [
    {
      key: 'unionpay',
      name: '中国银联',
      icon: '💳',
      image: 'https://payitapgo.oss-cn-shanghai.aliyuncs.com/uploads/clients/2026/01/09/unionpay.jpg',
      tint: 'linear-gradient(135deg, #dc2626, #ef4444)'
    },
    {
      key: 'yunshanfu',
      name: '云闪付',
      icon: '⚡',
      image: 'https://payitapgo.oss-cn-shanghai.aliyuncs.com/uploads/clients/2026/01/09/yunshanfu.png',
      tint: 'linear-gradient(135deg, #2563eb, #3b82f6)'
    },
    {
      key: 'xinsheng',
      name: '新生支付',
      icon: '🎯',
      image: 'https://payitapgo.oss-cn-shanghai.aliyuncs.com/uploads/clients/2026/01/09/xinsheng.png',
      tint: 'linear-gradient(135deg, #7c3aed, #8b5cf6)'
    },
    {
      key: 'shengfutong',
      name: '盛付通支付',
      icon: '💰',
      image: 'https://payitapgo.oss-cn-shanghai.aliyuncs.com/uploads/clients/2026/01/09/shengfutong.png',
      tint: 'linear-gradient(135deg, #ea580c, #f97316)'
    },
    {
      key: 'qianhai',
      name: '前海移联科技',
      icon: '🔗',
      image: 'https://payitapgo.oss-cn-shanghai.aliyuncs.com/uploads/clients/2026/01/09/qianhai.jpg',
      tint: 'linear-gradient(135deg, #0891b2, #06b6d4)'
    },
    {
      key: 'meituan',
      name: '美团',
      icon: '🦌',
      image: 'https://payitapgo.oss-cn-shanghai.aliyuncs.com/uploads/clients/2026/01/09/meituan.jpg',
      tint: 'linear-gradient(135deg, #fbbf24, #f59e0b)'
    },
    {
      key: 'chongdianlang',
      name: '冲电狼',
      icon: '🔋',
      image: 'https://payitapgo.oss-cn-shanghai.aliyuncs.com/uploads/clients/2026/01/09/chongdianlang.png',
      tint: 'linear-gradient(135deg, #059669, #10b981)'
    },
    {
      key: 'xingyifu',
      name: '星驿付',
      icon: '⭐',
      image: 'https://payitapgo.oss-cn-shanghai.aliyuncs.com/uploads/clients/2026/01/09/xingyifu.png',
      tint: 'linear-gradient(135deg, #f59e0b, #fbbf24)'
    },
    {
      key: 'huamai',
      name: '华迈',
      icon: '🚀',
      image: 'https://payitapgo.oss-cn-shanghai.aliyuncs.com/uploads/clients/2026/01/09/huamai.png',
      tint: 'linear-gradient(135deg, #3b82f6, #60a5fa)'
    },
    {
      key: 'jingzhiquan',
      name: '净之泉',
      icon: '💧',
      image: 'https://payitapgo.oss-cn-shanghai.aliyuncs.com/uploads/clients/2026/01/09/jingzhiquan.png',
      tint: 'linear-gradient(135deg, #0ea5e9, #38bdf8)'
    }
  ]
}

function resolveBannerImage(source) {
  if (!source) return heroBannerFallback
  let normalized = String(source).trim()
  if (!normalized) return heroBannerFallback
  normalized = normalized.replace(/\/Tapp\/app\//i, '/app/')
  if (/^\/app\//i.test(normalized) || normalized.startsWith('/images/')) {
    if (typeof window !== 'undefined' && window.location?.origin) {
      normalized = `${window.location.origin}${normalized}`
    }
  } else if (normalized.startsWith('//')) {
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:'
    normalized = `${protocol}${normalized}`
  }
  return normalized || heroBannerFallback
}

// 图片加载失败处理
function handleImageError(key) {
  const client = clientList.value.find(c => c.key === key)
  if (client && !client.imageError) {
    client.imageError = true
  }
}

function shouldUseStaticMode() {
  if (import.meta.env.VITE_HOME_STATIC_MODE === 'true') return true
  if (import.meta.env.VITE_HOME_STATIC_MODE === 'false') return false
  if (typeof window === 'undefined') return true
  try {
    const override = window.localStorage.getItem('home_force_live_api')
    if (override === '1') return false
    if (override === '0') return true
    const token = window.localStorage.getItem('token') || window.sessionStorage.getItem('token')
    return !token
  } catch (error) {
    return true
  }
}

function enableStaticMode() {
  useStaticHomeData.value = true
}
</script>

<style scoped>
.training-home {
  min-height: 100vh;
  background: #f5f6fb;
  padding: clamp(16px, 3vw, 32px);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.training-home__search {
  background: #fff;
  border-radius: 999px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
  gap: 10px;
}

.training-home__search input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 15px;
}

.training-home__search button {
  border: none;
  background: #f97316;
  color: #fff;
  padding: 8px 18px;
  border-radius: 999px;
  font-weight: 600;
}

.training-home__search-icon {
  width: 18px;
  height: 18px;
  border: 2px solid #cbd5f5;
  border-radius: 50%;
  position: relative;
}

.training-home__search-icon::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 2px;
  background: #cbd5f5;
  bottom: -5px;
  right: -4px;
  transform: rotate(45deg);
}

.training-hero {
  background: linear-gradient(135deg, #f97316, #ea580c);
  border-radius: 26px;
  padding: clamp(18px, 3vw, 32px);
  color: #fff;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 18px;
  box-shadow: 0 30px 60px rgba(234, 88, 12, 0.35);
}

.training-hero__eyebrow {
  font-size: 13px;
  letter-spacing: 0.3px;
  opacity: 0.8;
}

.training-hero__content h1 {
  margin: 4px 0 12px;
  font-size: clamp(24px, 5vw, 34px);
}

.training-hero__subtitle {
  margin: 0;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.85);
}

.training-hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 14px 0;
}

.training-hero__chips span {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 12px;
}

.training-hero__meta {
  font-size: 13px;
  margin-bottom: 12px;
  color: rgba(255, 255, 255, 0.85);
}

.training-hero__cta {
  display: flex;
  gap: 10px;
}

.training-hero__cta button {
  border: none;
  border-radius: 999px;
  padding: 10px 20px;
  font-weight: 600;
}

.training-hero__cta .ghost {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.5);
  color: #fff;
}

.training-hero__media {
  position: relative;
  background: radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.25), transparent 60%);
  border-radius: 22px;
  padding: 12px;
  min-height: 240px;
}

.training-hero__swipe,
.training-hero__fallback {
  height: 100%;
  border-radius: 18px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.12);
}

.training-hero__slide img,
.training-hero__fallback img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  mix-blend-mode: screen;
}

.training-hero__badge {
  position: absolute;
  top: 16px;
  left: 16px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  background: rgba(15, 23, 42, 0.25);
}

.training-hero__footnote {
  position: absolute;
  bottom: 12px;
  left: 16px;
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
}

.training-clients {
  background: #fff;
  border-radius: 24px;
  padding: 24px 20px;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
}

.training-clients header {
  text-align: center;
  margin-bottom: 20px;
}

.training-clients header h2 {
  margin: 0 0 8px;
  font-size: 22px;
  color: #0f172a;
}

.training-clients header p {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.training-clients__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.training-clients__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.training-clients__logo {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.training-clients__logo:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.client-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 16px;
}

.training-clients__item p {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: #334155;
  line-height: 1.4;
}

@media (max-width: 640px) {
  .training-clients__grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .training-clients__logo {
    width: 48px;
    height: 48px;
    font-size: 20px;
    margin-bottom: 8px;
  }

  .training-clients__item p {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .training-clients__grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .training-clients {
    padding: 20px 16px;
  }

  .training-clients header h2 {
    font-size: 20px;
  }

  .training-clients header p {
    font-size: 13px;
  }
}

.training-home__info-grid {
  background: #fff;
  border-radius: 20px;
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.training-home__info-grid button {
  border: none;
  background: #f8fafc;
  border-radius: 16px;
  padding: 14px;
  display: flex;
  gap: 12px;
  text-align: left;
}

.training-home__info-grid strong {
  font-size: 15px;
  color: #0f172a;
}

.training-home__info-grid p {
  margin: 2px 0 0;
  font-size: 13px;
  color: #64748b;
}

.training-home__info-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.training-calendar {
  background: #fff;
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
}

.training-calendar header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.training-calendar header h2 {
  margin: 4px 0 0;
}

.training-calendar ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.training-calendar li {
  background: #f8fafc;
  border-radius: 16px;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.training-calendar__date {
  color: #f97316;
  font-weight: 600;
  margin: 0 0 6px;
}

.training-calendar__title {
  margin: 0;
  font-size: 15px;
  color: #0f172a;
}

.training-calendar__meta {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.training-calendar button {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 999px;
  padding: 8px 16px;
  background: transparent;
}

.training-feedback {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 24px;
  padding: 22px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
}

.training-feedback__copy h2 {
  margin: 4px 0;
}

.training-feedback button {
  border: none;
  background: #0f172a;
  color: #fff;
  border-radius: 999px;
  padding: 10px 24px;
  font-weight: 600;
}

@media (max-width: 640px) {
  .training-hero__cta {
    flex-direction: column;
  }

  .training-calendar li {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
