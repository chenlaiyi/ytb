<template>
  <section class="merchant-showcase">
    <header class="merchant-showcase__header">
      <div>
        <p class="merchant-showcase__eyebrow">商户生态</p>
        <h2>多业态共同成长</h2>
        <p class="merchant-showcase__subtitle">公开版即可看到真实数据与案例</p>
      </div>
      <button type="button" class="merchant-showcase__cta" @click="$emit('contact')">
        联系顾问
      </button>
    </header>

    <div class="merchant-showcase__content">
      <div class="merchant-showcase__distribution" v-if="merchant.industries?.length">
        <article
          v-for="industry in merchant.industries"
          :key="industry.name"
          class="industry-card"
        >
          <div class="industry-card__top">
            <span class="industry-card__dot" :style="{ background: industry.color }"></span>
            <div>
              <p class="industry-card__name">{{ industry.name }}</p>
              <p class="industry-card__hint">占比 {{ industry.rate }}%</p>
            </div>
          </div>
          <div class="industry-card__progress">
            <div class="industry-card__fill" :style="{ width: `${industry.rate}%`, background: industry.color }"></div>
          </div>
          <p class="industry-card__footer">门店 {{ industry.devices || industry.rate * 10 }}+</p>
        </article>
      </div>

      <div class="merchant-showcase__cases" v-if="merchant.cases?.length">
        <article class="case-card" v-for="item in merchant.cases" :key="item.name">
          <div class="case-card__header">
            <div class="case-card__avatar">{{ item.name?.[0] }}</div>
            <div>
              <p class="case-card__name">{{ item.name }}</p>
              <p class="case-card__industry">{{ item.industry }}</p>
            </div>
            <van-tag plain type="primary">{{ item.tag || '复制经验' }}</van-tag>
          </div>
          <p class="case-card__summary">{{ item.summary }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  merchant: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['contact'])
</script>

<style scoped>
.merchant-showcase {
  background: linear-gradient(160deg, #0f172a, #111827 70%, #1f2937);
  border-radius: 28px;
  padding: 24px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #f8fafc;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.35);
}

.merchant-showcase__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.merchant-showcase__eyebrow {
  font-size: 12px;
  color: #67e8f9;
  letter-spacing: 0.4px;
}

.merchant-showcase__subtitle {
  font-size: 13px;
  color: rgba(226, 232, 240, 0.75);
}

.merchant-showcase__cta {
  border: none;
  background: linear-gradient(120deg, #06b6d4, #6366f1);
  color: #fff;
  padding: 10px 22px;
  border-radius: 999px;
  font-weight: 600;
}

.merchant-showcase__content {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.merchant-showcase__distribution {
  display: grid;
  gap: 12px;
}

.industry-card {
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(15, 23, 42, 0.65);
  color: #e2e8f0;
}

.industry-card__top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.industry-card__dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.industry-card__name {
  font-size: 14px;
  font-weight: 700;
  color: #f8fafc;
}

.industry-card__hint {
  font-size: 12px;
  color: rgba(226, 232, 240, 0.7);
}

.industry-card__progress {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.12);
  margin: 10px 0;
}

.industry-card__fill {
  height: 100%;
  border-radius: 999px;
}

.industry-card__footer {
  font-size: 12px;
  color: #67e8f9;
}

.merchant-showcase__cases {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.case-card {
  padding: 18px;
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(15, 23, 42, 0.7);
}

.case-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.case-card__avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(59, 130, 246, 0.2);
  display: grid;
  place-items: center;
  font-weight: 700;
  color: #67e8f9;
}

.case-card__summary {
  font-size: 13px;
  color: rgba(226, 232, 240, 0.8);
  margin-top: 12px;
  line-height: 1.6;
}

@media (max-width: 360px) {
  .merchant-showcase__content {
    grid-template-columns: 1fr;
  }
}
</style>
