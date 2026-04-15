<template>
  <section class="hero-section">
    <div class="hero-section__background" aria-hidden="true">
      <span class="hero-section__orb hero-section__orb--one"></span>
      <span class="hero-section__orb hero-section__orb--two"></span>
    </div>

    <div class="hero-section__grid">
      <div class="hero-section__content">
        <div class="hero-section__labels">
          <span class="hero-section__eyebrow" v-if="hero.eyebrow">{{ hero.eyebrow }}</span>
          <span class="hero-section__timestamp" v-if="timestamp">更新 {{ timestamp }}</span>
        </div>
        <h1>{{ hero.headline }}</h1>
        <p class="hero-section__subtitle" v-if="hero.subline">{{ hero.subline }}</p>
        <p class="hero-section__description">{{ hero.description }}</p>

        <div class="hero-section__badges" v-if="badges.length">
          <span v-for="badge in badges" :key="badge" class="hero-section__badge">{{ badge }}</span>
        </div>

        <div class="hero-section__cta" role="group" aria-label="核心操作">
          <van-button
            v-if="hero.ctas?.primary"
            type="primary"
            size="small"
            block
            class="hero-section__btn hero-section__btn--primary"
            @click="$emit('primary')"
          >
            {{ hero.ctas.primary.label || '立即使用' }}
          </van-button>
          <van-button
            v-if="hero.ctas?.secondary"
            type="default"
            size="small"
            block
            class="hero-section__btn hero-section__btn--secondary"
            @click="$emit('secondary')"
          >
            {{ hero.ctas.secondary.label || '商户入驻咨询' }}
          </van-button>
        </div>
      </div>

      <div class="hero-section__panel">
        <div class="hero-section__metrics" v-if="hero.metrics?.length">
          <article v-for="metric in hero.metrics" :key="metric.label" class="hero-section__metric">
            <p class="hero-section__metric-label">{{ metric.label }}</p>
            <p class="hero-section__metric-value">{{ metric.value }}</p>
            <p class="hero-section__metric-trend" :class="trendClass(metric.trend)">{{ metric.trend }}</p>
          </article>
        </div>
        <div class="hero-section__highlights" v-if="highlights.length">
          <article v-for="highlight in highlights" :key="highlight.label" class="hero-section__highlight">
            <p class="hero-section__highlight-value">{{ highlight.value }}</p>
            <p class="hero-section__highlight-label">{{ highlight.label }}</p>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ hero: { type: Object, default: () => ({}) } })

defineEmits(['primary', 'secondary'])

const timestamp = computed(() => {
  if (!props.hero?.lastUpdated) return ''
  const date = new Date(props.hero.lastUpdated)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
})

const highlights = computed(() => props.hero?.highlights || [])
const badges = computed(() => props.hero?.badges || [])

function trendClass(value) {
  if (!value) return ''
  if (value.startsWith('+')) return 'is-up'
  if (value.startsWith('-')) return 'is-down'
  return ''
}
</script>

<style scoped>
.hero-section {
  position: relative;
  border-radius: 36px;
  overflow: hidden;
  padding: clamp(24px, 4vw, 40px);
  background: linear-gradient(135deg, #e0f2ff, #eef2ff);
  color: #0f172a;
  min-height: 320px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 14px 38px rgba(15, 23, 42, 0.1);
}

.hero-section__background {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 20%, rgba(14, 165, 233, 0.18), transparent 55%),
    radial-gradient(circle at 80% 30%, rgba(59, 130, 246, 0.18), transparent 50%);
}

.hero-section__orb {
  position: absolute;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  filter: blur(22px);
}

.hero-section__orb--one {
  top: -40px;
  right: -60px;
  background: rgba(14, 165, 233, 0.35);
}

.hero-section__orb--two {
  bottom: -50px;
  left: -40px;
  background: rgba(64, 81, 255, 0.28);
}

.hero-section__grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(20px, 4vw, 60px);
  z-index: 1;
}

.hero-section__eyebrow {
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  letter-spacing: 0.3px;
}

.hero-section__labels {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hero-section__timestamp {
  color: rgba(15, 23, 42, 0.6);
  font-size: 12px;
}

.hero-section__badges {
  display: flex;
  gap: 8px;
  margin: 12px 0;
  flex-wrap: wrap;
}

.hero-section__badge {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(14, 165, 233, 0.25);
  background: rgba(14, 165, 233, 0.1);
  color: #0f172a;
  font-size: 12px;
}

.hero-section__cta {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.hero-section__btn--primary {
  --van-button-primary-background: linear-gradient(120deg, #0ea5e9, #2563eb);
  --van-button-primary-border-color: transparent;
  --van-button-primary-color: #fff;
}

.hero-section__btn--secondary {
  --van-button-default-border-color: rgba(15, 23, 42, 0.1);
  --van-button-default-color: #0f172a;
  background: rgba(255, 255, 255, 0.8);
}

.hero-section__panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hero-section__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.hero-section__metric {
  padding: 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e2e8f0;
  color: #0f172a;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
}

.hero-section__highlights {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.hero-section__highlight {
  padding: 12px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.hero-section__metric-trend.is-up {
  color: #16a34a;
}

.hero-section__metric-trend.is-down {
  color: #dc2626;
}

@media (max-width: 720px) {
  .hero-section__grid {
    grid-template-columns: 1fr;
  }

  .hero-section__metrics,
  .hero-section__highlights,
  .hero-section__cta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 420px) {
  .hero-section__metrics,
  .hero-section__highlights,
  .hero-section__cta {
    grid-template-columns: 1fr;
  }
}
</style>
