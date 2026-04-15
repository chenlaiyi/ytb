<template>
  <section class="journey-planner" v-if="steps.length">
    <header class="journey-planner__header">
      <div>
        <p class="journey-planner__eyebrow">交付路径</p>
        <p class="journey-planner__title">三段式上线旅程</p>
      </div>
      <p class="journey-planner__eta">平均可见成效：{{ eta }}</p>
    </header>

    <div class="journey-planner__timeline">
      <article
        v-for="(step, index) in steps"
        :key="step.id || index"
        class="journey-step"
      >
        <div class="journey-step__index">{{ index + 1 }}</div>
        <div class="journey-step__body">
          <div class="journey-step__meta">
            <p class="journey-step__title">{{ step.title }}</p>
            <span class="journey-step__duration">{{ step.duration }}</span>
          </div>
          <p class="journey-step__desc">{{ step.description }}</p>
          <ul class="journey-step__checklist">
            <li v-for="point in step.checklist" :key="point">{{ point }}</li>
          </ul>
        </div>
        <div class="journey-step__status" v-if="step.status">
          <span :class="['journey-step__status-dot', `is-${step.status}`]"></span>
          {{ STATUS_COPY[step.status] || step.status }}
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
const STATUS_COPY = {
  ready: '随时开始',
  running: '交付中',
  done: '已上线'
}

defineProps({
  steps: {
    type: Array,
    default: () => []
  },
  eta: {
    type: String,
    default: '14 天'
  }
})
</script>

<style scoped>
.journey-planner {
  padding: 24px;
  border-radius: 24px;
  background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.35), transparent 60%),
    #020617;
  color: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: 0 25px 60px rgba(15, 23, 42, 0.35);
}

.journey-planner__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.journey-planner__eyebrow {
  font-size: 12px;
  letter-spacing: 0.4px;
  opacity: 0.7;
}

.journey-planner__title {
  font-size: 18px;
  font-weight: 700;
}

.journey-planner__eta {
  font-size: 12px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(248, 250, 252, 0.08);
}

.journey-planner__timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.journey-step {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 18px;
  padding: 16px;
  border-radius: 20px;
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(248, 250, 252, 0.08);
  backdrop-filter: blur(6px);
}

.journey-step__index {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.12);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 16px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.journey-step__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.journey-step__title {
  font-weight: 700;
  font-size: 15px;
}

.journey-step__duration {
  font-size: 12px;
  padding: 4px 10px;
  background: rgba(79, 70, 229, 0.18);
  border-radius: 999px;
  border: 1px solid rgba(99, 102, 241, 0.4);
}

.journey-step__desc {
  font-size: 13px;
  color: rgba(248, 250, 252, 0.75);
  margin-bottom: 8px;
}

.journey-step__checklist {
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
  color: rgba(248, 250, 252, 0.78);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.journey-step__status {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(248, 250, 252, 0.75);
}

.journey-step__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.4);
}

.journey-step__status-dot.is-ready {
  background: #34d399;
}

.journey-step__status-dot.is-running {
  background: #facc15;
}

.journey-step__status-dot.is-done {
  background: #60a5fa;
}

@media (max-width: 360px) {
  .journey-step {
    grid-template-columns: auto 1fr;
  }

  .journey-step__status {
    grid-column: 2 / span 1;
    justify-self: flex-start;
  }
}
</style>
