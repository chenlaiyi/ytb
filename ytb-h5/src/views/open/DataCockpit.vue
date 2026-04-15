<template>
  <div class="open-cockpit">
    <header class="hero">
      <div class="hero-text">
        <p class="eyebrow">Data Cockpit</p>
        <h1>点点够系统数据驾驶舱</h1>
        <p class="subtitle">
          汇总美团、盛付通及引流进件数据，一键洞察交易热力与昨日心跳。
        </p>
      </div>
      <div class="hero-meta">
        <p>最后更新：{{ generatedAtText }}</p>
        <p>统计区间：{{ rangeText }}</p>
        <button class="ghost-btn" :disabled="loading" @click="fetchCockpit">
          {{ loading ? '刷新中...' : '手动刷新' }}
        </button>
      </div>
    </header>

    <section class="summary-section">
      <div v-for="card in summaryCards" :key="card.key" class="summary-card">
        <p class="label">{{ card.label }}</p>
        <p class="value">
          <span>{{ card.value }}</span>
          <small>{{ card.unit }}</small>
        </p>
        <p class="desc">{{ card.desc }}</p>
      </div>
    </section>

    <section class="map-section">
      <div class="section-header">
        <div>
          <h2>全国商户热力</h2>
          <p>亮点代表昨日有交易的商户，自动带有心跳涟漪效果</p>
        </div>
        <div class="map-badges">
          <span v-for="item in sourceBadges" :key="item.key" class="badge">
            {{ item.label }}：{{ item.value }}
          </span>
          <span class="badge badge-highlight">昨日高亮：{{ mapInfo.highlight_total }}</span>
        </div>
      </div>
      <div class="map-body">
        <div ref="mapRef" class="map-panel">
          <div v-if="!mapPoints.length && !loading" class="map-empty">
            <p>暂无可视化数据</p>
          </div>
        </div>
        <div class="map-side">
          <h3>热点商户</h3>
          <div v-if="topMerchants.length" class="merchant-list">
            <div
              v-for="merchant in topMerchants"
              :key="merchant.id"
              class="merchant-item"
              :class="{ highlight: merchant.highlight }"
            >
              <div class="merchant-title">
                <span class="dot"></span>
                <strong>{{ merchant.name }}</strong>
              </div>
              <p class="merchant-meta">
                {{ merchant.city || merchant.province || '未知城市' }} ·
                {{ merchant.sourceLabel }}
              </p>
              <p class="merchant-amount">近30日：¥{{ formatAmount(merchant.amount) }}</p>
            </div>
          </div>
          <div v-else class="map-empty">
            <p>加载中...</p>
          </div>
        </div>
      </div>
    </section>

    <section class="ticker-section">
      <div class="section-header">
        <div>
          <h2>昨日交易心跳</h2>
          <p>逐笔轮播最新 {{ tickerItems.length }} 条美团/盛付通/进件事件</p>
        </div>
        <div class="ticker-meta">
          <span>心跳间隔：{{ tickerInterval }}s</span>
        </div>
      </div>

      <div class="ticker-body" v-if="activeTicker">
        <transition name="ticker-fade" mode="out-in">
          <div :key="activeTicker.id" class="ticker-current">
            <span class="ticker-source" :class="`src-${activeTicker.source}`">
              {{ sourceLabel(activeTicker.source) }}
            </span>
            <div class="ticker-info">
              <p class="ticker-msg">{{ activeTicker.message }}</p>
              <p class="ticker-sub">
                {{ activeTicker.occurred_text }} · {{ activeTicker.city || '全国' }}
                <span v-if="activeTicker.amount"> · ¥{{ formatAmount(activeTicker.amount) }}</span>
              </p>
            </div>
          </div>
        </transition>
        <div class="ticker-queue">
          <div v-for="item in upcomingTicker" :key="item.id" class="ticker-queue-item">
            <span>{{ item.occurred_text }}</span>
            <span>{{ sourceLabel(item.source) }}</span>
            <span class="ellipsis">{{ item.message }}</span>
          </div>
        </div>
      </div>
      <div v-else class="ticker-empty">
        <p v-if="loading">心跳生成中...</p>
        <p v-else>暂无昨日交易，稍后再来~</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { MapChart, ScatterChart, EffectScatterChart } from 'echarts/charts'
import { GeoComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Toast } from 'vant'
import { getOpenDataCockpit } from '@/api/open'

echarts.use([MapChart, ScatterChart, EffectScatterChart, GeoComponent, TooltipComponent, VisualMapComponent, CanvasRenderer])

const fallbackChinaGeoJson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'China Mainland' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [73.5, 18.2],
            [110, 18.2],
            [123.5, 24.5],
            [134.5, 48.5],
            [120, 53.5],
            [108, 49],
            [97, 40],
            [85, 34],
            [76, 40],
            [73.5, 18.2],
          ],
        ],
      },
    },
  ],
}

const loadChinaGeoJson = async () => {
  if (echarts.getMap('china')) {
    return
  }
  const candidateUrls = [
    'https://fastly.jsdelivr.net/npm/echarts@5/map/json/china.json',
    'https://cdn.jsdelivr.net/npm/echarts@5/map/json/china.json',
  ]

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, { cache: 'force-cache' })
      if (response.ok) {
        const data = await response.json()
        echarts.registerMap('china', data)
        return
      }
    } catch (error) {
      console.warn('[open-cockpit] load china map failed', url, error)
    }
  }

  console.warn('[open-cockpit] using fallback map geometry')
  echarts.registerMap('china', fallbackChinaGeoJson)
}

const loading = ref(false)
const summary = ref({
  meituan: {},
  leads: {},
  shengfutong: {},
})
const mapInfo = ref({
  total: 0,
  highlight_total: 0,
  source_totals: {},
  items: [],
})
const ticker = ref({
  items: [],
  rolling_interval_seconds: 8,
})
const metadata = ref({
  generated_at: '',
  range: { start: '', end: '', days: 0 },
})

const mapRef = ref(null)
let chartInstance = null
const mapPoints = computed(() =>
  (mapInfo.value.items || []).map((item) => ({
    name: item.name,
    value: [item.coordinate?.lng ?? 0, item.coordinate?.lat ?? 0, item.amount ?? 0],
    meta: item,
  }))
)

const summaryCards = computed(() => {
  const m = summary.value.meituan || {}
  const l = summary.value.leads || {}
  const s = summary.value.shengfutong || {}
  return [
    {
      key: 'gmv',
      label: '美团 GMV',
      value: `¥${formatAmount(m.gmv_total || 0)}`,
      unit: '',
      desc: `活跃商户 ${m.merchant_total || 0} 家`,
    },
    {
      key: 'net',
      label: '盛付通流水',
      value: `¥${formatAmount(s.amount_total || 0)}`,
      unit: '',
      desc: `活跃商户 ${s.merchant_total || 0} 家`,
    },
    {
      key: 'leads',
      label: '引流进件',
      value: `${formatNumber(l.lead_total || 0)}`,
      unit: '个',
      desc: `昨日新增 ${l.new_yesterday || 0} 个`,
    },
    {
      key: 'heart',
      label: '昨日心跳',
      value: `${mapInfo.value.highlight_total || 0}`,
      unit: '个',
      desc: `覆盖 GMV 商户与盛付通商户`,
    },
  ]
})

const sourceBadges = computed(() => {
  const totals = mapInfo.value.source_totals || {}
  return [
    { key: 'meituan', label: '美团', value: totals.meituan || 0 },
    { key: 'lead', label: '进件', value: totals.lead || 0 },
    { key: 'shengfutong', label: '盛付通', value: totals.shengfutong || 0 },
  ]
})

const rangeText = computed(() => {
  const range = metadata.value.range
  if (!range?.start || !range?.end) return '--'
  return `${range.start} ~ ${range.end} · ${range.days || 0}天`
})

const generatedAtText = computed(() => {
  if (!metadata.value.generated_at) return '--'
  return new Date(metadata.value.generated_at).toLocaleString()
})

const topMerchants = computed(() => {
  return [...(mapInfo.value.items || [])]
    .sort((a, b) => (b.highlight ? 1 : 0) - (a.highlight ? 1 : 0) || (b.amount || 0) - (a.amount || 0))
    .slice(0, 5)
    .map((item) => ({
      ...item,
      sourceLabel: sourceLabel(item.source),
    }))
})

const tickerIndex = ref(0)
let tickerTimer = null
const tickerItems = computed(() => ticker.value.items || [])
const tickerInterval = computed(() => ticker.value.rolling_interval_seconds || 8)
const activeTicker = computed(() => {
  if (!tickerItems.value.length) return null
  return tickerItems.value[tickerIndex.value % tickerItems.value.length]
})
const upcomingTicker = computed(() => {
  if (!tickerItems.value.length) return []
  const list = tickerItems.value
  const start = (tickerIndex.value + 1) % list.length
  const result = []
  for (let i = 0; i < Math.min(3, list.length - 1); i += 1) {
    result.push(list[(start + i) % list.length])
  }
  return result
})

const fetchCockpit = async () => {
  try {
    loading.value = true
    const res = await getOpenDataCockpit({ range: 30 })
    if (res?.code !== 0) {
      throw new Error(res?.message || '获取数据失败')
    }
    summary.value = res.data?.summary || summary.value
    mapInfo.value = res.data?.map || mapInfo.value
    ticker.value = res.data?.ticker || ticker.value
    metadata.value = {
      generated_at: res.data?.generated_at,
      range: res.data?.range,
    }
    tickerIndex.value = 0
    await nextTick()
    renderChart()
    startTickerLoop()
  } catch (error) {
    console.error('fetchCockpit failed', error)
    Toast.fail(error.message || '获取驾驶舱数据失败')
  } finally {
    loading.value = false
  }
}

const initChart = async () => {
  await loadChinaGeoJson()
  if (!mapRef.value) return
  if (chartInstance) {
    chartInstance.dispose()
  }
  chartInstance = echarts.init(mapRef.value)
  renderChart()
}

const renderChart = () => {
  if (!chartInstance) return
  const scatterData = mapPoints.value
  const highlightData = scatterData.filter((item) => item.meta?.highlight)

  chartInstance.setOption({
    backgroundColor: 'transparent',
    geo: {
      map: 'china',
      roam: true,
      zoom: 1.15,
      label: { show: false },
      itemStyle: {
        areaColor: '#0b1f44',
        borderColor: '#1f3b75',
      },
      emphasis: {
        itemStyle: {
          areaColor: '#1c3575',
        },
      },
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const meta = params.data?.meta || {}
        return `
          <strong>${meta.name || '商户'}</strong><br/>
          来源：${sourceLabel(meta.source)}<br/>
          最近交易：${meta.last_transaction_at || '未知'}<br/>
          近30日GMV：¥${formatAmount(meta.amount || 0)}
        `
      },
    },
    series: [
      {
        name: '商户分布',
        type: 'scatter',
        coordinateSystem: 'geo',
        symbolSize: (val) => Math.max(6, Math.min(18, val[2] / 500)),
        itemStyle: {
          color: '#ff4d6d',
          opacity: 0.8,
        },
        data: scatterData,
        zlevel: 1,
      },
      {
        name: '昨日心跳',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: highlightData,
        rippleEffect: {
          brushType: 'stroke',
          period: 4,
          scale: 3,
        },
        symbolSize: (val) => Math.max(10, Math.min(24, val[2] / 400)),
        itemStyle: {
          color: '#ffd166',
        },
        zlevel: 2,
      },
    ],
  })
}

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

const startTickerLoop = () => {
  stopTickerLoop()
  if (!tickerItems.value.length) return
  const interval = Math.max(5, tickerInterval.value) * 1000
  tickerTimer = window.setInterval(() => {
    tickerIndex.value = (tickerIndex.value + 1) % tickerItems.value.length
  }, interval)
}

const stopTickerLoop = () => {
  if (tickerTimer) {
    clearInterval(tickerTimer)
    tickerTimer = null
  }
}

const formatAmount = (value) => {
  const num = Number(value) || 0
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatNumber = (value) => {
  const num = Number(value) || 0
  return num.toLocaleString()
}

const sourceLabel = (source) => {
  switch (source) {
    case 'meituan':
      return '美团'
    case 'shengfutong':
      return '盛付通'
    case 'lead':
      return '进件'
    default:
      return '未知来源'
  }
}

watch(
  () => mapPoints.value,
  () => renderChart(),
  { deep: true }
)

onMounted(() => {
  initChart()
  fetchCockpit()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  stopTickerLoop()
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
:root {
  --card-bg: rgba(14, 26, 54, 0.75);
}

.open-cockpit {
  min-height: 100vh;
  padding: 24px;
  background: radial-gradient(circle at top, #081832, #030c1c 60%);
  color: #e2e8ff;
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 24px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(20, 41, 91, 0.9), rgba(7, 14, 30, 0.9));
  margin-bottom: 24px;
  box-shadow: 0 10px 40px rgba(8, 26, 52, 0.6);
}

.hero-text h1 {
  font-size: 32px;
  margin: 8px 0;
}

.hero-text .eyebrow {
  text-transform: uppercase;
  letter-spacing: 4px;
  color: #5be7ff;
  font-size: 12px;
}

.hero-meta {
  text-align: right;
}

.hero-meta p {
  margin: 0;
  font-size: 14px;
}

.ghost-btn {
  margin-top: 12px;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.ghost-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.summary-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  padding: 16px;
  border-radius: 16px;
  background: var(--card-bg);
  box-shadow: inset 0 0 0 1px rgba(91, 231, 255, 0.08);
}

.summary-card .label {
  font-size: 14px;
  opacity: 0.7;
}

.summary-card .value {
  font-size: 28px;
  margin: 8px 0;
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.summary-card .value small {
  font-size: 14px;
  opacity: 0.7;
}

.summary-card .desc {
  font-size: 13px;
  opacity: 0.65;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 12px;
}

.section-header h2 {
  margin: 0;
}

.map-section,
.ticker-section {
  margin-bottom: 32px;
}

.map-body {
  display: flex;
  gap: 16px;
  min-height: 500px;
}

.map-panel {
  flex: 2;
  min-height: 500px;
  background: rgba(5, 13, 30, 0.8);
  border-radius: 20px;
  position: relative;
  overflow: hidden;
}

.map-side {
  flex: 1;
  background: var(--card-bg);
  border-radius: 20px;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.map-side h3 {
  margin-top: 0;
}

.map-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.badge {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 12px;
}

.badge-highlight {
  border-color: #ffd166;
  color: #ffd166;
}

.merchant-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.merchant-item {
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
}

.merchant-item.highlight {
  border: 1px solid rgba(255, 209, 102, 0.4);
  box-shadow: 0 0 15px rgba(255, 209, 102, 0.2);
}

.merchant-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.merchant-title .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff4d6d;
}

.merchant-item.highlight .merchant-title .dot {
  background: #ffd166;
}

.merchant-meta,
.merchant-amount {
  font-size: 13px;
  margin: 4px 0;
  opacity: 0.7;
}

.map-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.ticker-body {
  background: var(--card-bg);
  border-radius: 20px;
  padding: 16px;
}

.ticker-current {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.ticker-source {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  text-transform: uppercase;
}

.src-meituan {
  background: rgba(91, 231, 255, 0.15);
  color: #5be7ff;
}

.src-shengfutong {
  background: rgba(255, 209, 102, 0.15);
  color: #ffd166;
}

.src-lead {
  background: rgba(255, 98, 140, 0.15);
  color: #ff628c;
}

.ticker-info .ticker-msg {
  margin: 0;
  font-size: 16px;
}

.ticker-info .ticker-sub {
  margin: 4px 0 0;
  font-size: 13px;
  opacity: 0.7;
}

.ticker-queue {
  margin-top: 16px;
  display: grid;
  gap: 8px;
}

.ticker-queue-item {
  display: grid;
  grid-template-columns: 80px 80px 1fr;
  gap: 8px;
  font-size: 13px;
  opacity: 0.75;
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ticker-empty {
  text-align: center;
  padding: 32px;
  border-radius: 20px;
  background: var(--card-bg);
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.ticker-fade-enter-active,
.ticker-fade-leave-active {
  transition: opacity 0.4s;
}

.ticker-fade-enter-from,
.ticker-fade-leave-to {
  opacity: 0;
}

@media (max-width: 960px) {
  .hero {
    flex-direction: column;
  }

  .hero-meta {
    text-align: left;
  }

  .map-body {
    flex-direction: column;
  }

  .map-panel {
    min-height: 360px;
  }
}
</style>
