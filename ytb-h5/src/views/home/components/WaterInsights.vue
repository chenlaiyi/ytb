<template>
  <section class="water-insights" v-if="insights">
    <header class="water-insights__header">
      <div>
        <p class="water-insights__eyebrow">净水网络</p>
        <h2>实时洞察净水部署</h2>
      </div>
      <div class="water-insights__badge" v-if="insights.lastUpdated">
        更新 {{ formatDate(insights.lastUpdated) }}
      </div>
    </header>

    <div class="water-insights__summary">
      <article
        v-for="stat in insights.summary || []"
        :key="stat.label"
        class="water-card"
      >
        <p class="water-card__label">{{ stat.label }}</p>
        <p class="water-card__value">{{ stat.value }}</p>
        <p class="water-card__meta" v-if="stat.meta">{{ stat.meta }}</p>
      </article>
    </div>

    <div class="water-insights__panels">
      <div class="water-panel" v-if="insights.regions?.length">
        <div class="water-panel__header">
          <p>重点城市群部署</p>
          <span>覆盖 {{ insights.regions.length }} 区域</span>
        </div>
        <div class="heatmap-bar" v-for="region in insights.regions" :key="region.name">
          <div class="heatmap-bar__info">
            <p class="heatmap-bar__label">{{ region.name }}</p>
            <p class="heatmap-bar__value">{{ region.devices }} 台</p>
          </div>
          <div class="heatmap-bar__track">
            <div class="heatmap-bar__fill" :style="{ width: `${region.rate}%` }"></div>
          </div>
        </div>
      </div>

      <div class="water-panel" v-if="insights.leaderboard?.length">
        <div class="water-panel__header">
          <p>热门型号榜单</p>
          <span>实时跟踪售后 SLA</span>
        </div>
        <div class="leaderboard">
          <article v-for="item in insights.leaderboard" :key="item.model" class="leaderboard__item">
            <div>
              <p class="leaderboard__model">{{ item.model }}</p>
              <p class="leaderboard__price">{{ item.priceRange }}</p>
            </div>
            <div class="leaderboard__meta">
              <span>{{ item.filterLife }}</span>
              <span>{{ item.service }}售后</span>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  insights: {
    type: Object,
    default: () => ({})
  }
})

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
</script>

<style scoped>
.water-insights {
  background: radial-gradient(circle at top left, rgba(14, 165, 233, 0.4), rgba(12, 74, 110, 0.85));
  color: #e2e8f0;
  border-radius: 28px;
  padding: 24px;
  border: 1px solid rgba(56, 189, 248, 0.35);
  box-shadow: 0 25px 60px rgba(8, 47, 73, 0.5);
}

.water-insights__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.water-insights__eyebrow {
  font-size: 12px;
  color: #38bdf8;
  letter-spacing: 0.4px;
}

.water-insights__badge {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.water-insights__summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.water-card {
  padding: 18px;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.45);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.water-card__label {
  font-size: 12px;
  color: rgba(226, 232, 240, 0.8);
}

.water-card__value {
  font-size: 20px;
  font-weight: 700;
  margin: 6px 0;
}

.water-card__meta {
  font-size: 12px;
  color: rgba(226, 232, 240, 0.75);
}

.water-insights__panels {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.water-panel {
  background: rgba(7, 89, 133, 0.65);
  border-radius: 22px;
  padding: 18px;
  border: 1px solid rgba(56, 189, 248, 0.25);
  backdrop-filter: blur(4px);
}

.water-panel__header {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 10px;
  color: rgba(226, 232, 240, 0.9);
}

.heatmap-bar {
  margin-bottom: 12px;
}

.heatmap-bar:last-child {
  margin-bottom: 0;
}

.heatmap-bar__info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 4px;
}

.heatmap-bar__track {
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
}

.heatmap-bar__fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #67e8f9, #22d3ee);
}

.leaderboard__item {
  display: flex;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.leaderboard__item:last-child {
  border-bottom: none;
}

.leaderboard__model {
  font-weight: 600;
}

.leaderboard__meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: rgba(226, 232, 240, 0.65);
  text-align: right;
}

@media (max-width: 360px) {
  .water-insights__summary,
  .water-insights__panels {
    grid-template-columns: 1fr;
  }
}
</style>
