<template>
  <section class="kpi-highlights" v-if="items.length">
    <header class="kpi-highlights__header">
      <div>
        <p class="kpi-highlights__eyebrow">实时运行脉搏</p>
        <p class="kpi-highlights__title">关键指标速览</p>
      </div>
      <div class="kpi-highlights__actions">
        <p class="kpi-highlights__timestamp" v-if="timestamp">刷新 {{ timestamp }}</p>
        <button type="button" class="kpi-highlights__refresh" @click="$emit('refresh')">
          <span class="kpi-highlights__refresh-icon">⟳</span>
          刷新数据
        </button>
      </div>
    </header>

    <div class="kpi-highlights__body">
      <article v-if="lead" class="kpi-lead" role="article">
        <div>
          <p class="kpi-lead__label">{{ lead.label }}</p>
          <p class="kpi-lead__value">
            {{ lead.value }}<small v-if="lead.unit">{{ lead.unit }}</small>
          </p>
          <p class="kpi-lead__meta">{{ lead.meta }}</p>
        </div>
        <span class="kpi-lead__trend" :class="trendClass(lead.trend)">{{ lead.trend }}</span>
      </article>

      <div class="kpi-highlights__grid" role="list">
        <article
          v-for="item in secondary"
          :key="item.label"
          class="kpi-card"
          role="listitem"
        >
          <p class="kpi-card__label">{{ item.label }}</p>
          <p class="kpi-card__value">
            {{ item.value }}<small v-if="item.unit">{{ item.unit }}</small>
          </p>
          <p class="kpi-card__meta">{{ item.meta }}</p>
          <p class="kpi-card__trend" :class="trendClass(item.trend)">
            {{ item.trend }}
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  lastUpdated: {
    type: String,
    default: ''
  }
})

defineEmits(['refresh'])

const timestamp = computed(() => {
  if (!props.lastUpdated) return ''
  const date = new Date(props.lastUpdated)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
})

const lead = computed(() => props.items?.[0])
const secondary = computed(() => props.items?.slice(1) ?? [])

function trendClass(trend) {
  if (!trend) return ''
  if (trend.startsWith('+')) return 'trend--up'
  if (trend.startsWith('-')) return 'trend--down'
  return ''
}
</script>

<style scoped>
.kpi-highlights {
  padding: 22px;
  border-radius: 22px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #0f172a;
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
}

.kpi-highlights__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.kpi-highlights__eyebrow {
  font-size: 12px;
  color: #0ea5e9;
  font-weight: 700;
  letter-spacing: 0.4px;
}

.kpi-highlights__title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.kpi-highlights__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.kpi-highlights__timestamp {
  font-size: 12px;
  color: #475569;
}

.kpi-highlights__refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  color: #0f172a;
  font-weight: 600;
}

.kpi-highlights__refresh-icon {
  font-size: 12px;
}

.kpi-highlights__body {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.kpi-lead {
  border-radius: 20px;
  padding: 18px;
  background: linear-gradient(135deg, #eff6ff, #e0f2fe);
  color: #0f172a;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border: 1px solid #dbeafe;
}

.kpi-lead__label {
  font-size: 13px;
  color: #0f172a;
}

.kpi-lead__value {
  font-size: 28px;
  font-weight: 700;
  margin: 6px 0;
}

.kpi-lead__value small {
  font-size: 14px;
  margin-left: 4px;
}

.kpi-lead__meta {
  font-size: 12px;
  color: #475569;
}

.kpi-lead__trend {
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid #cbd5e1;
}

.kpi-highlights__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.kpi-card {
  background: #f8fafc;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #e2e8f0;
}

.kpi-card__label {
  font-size: 12px;
  color: #475569;
}

.kpi-card__value {
  font-size: 20px;
  font-weight: 700;
  margin: 6px 0;
}

.kpi-card__value small {
  font-size: 12px;
  margin-left: 2px;
}

.kpi-card__meta {
  font-size: 12px;
  color: #94a3b8;
}

.kpi-card__trend {
  font-size: 12px;
  margin-top: 8px;
  font-weight: 600;
}

.trend--up {
  color: #16a34a;
}

.trend--down {
  color: #dc2626;
}

@media (max-width: 360px) {
  .kpi-highlights__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .kpi-lead {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
