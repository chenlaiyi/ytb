<template>
  <section class="business-pillars">
    <header class="business-pillars__header">
      <div>
        <p class="business-pillars__eyebrow">主营业务</p>
        <h2>净水、商户、商城、SaaS 一体化能力</h2>
      </div>
    </header>
    <div class="business-pillars__grid">
      <article
        v-for="pillar in pillars"
        :key="pillar.title"
        class="pillar-card"
      >
        <div class="pillar-card__icon" :style="{ backgroundColor: pillar.bg }">
          <span>{{ pillar.icon }}</span>
        </div>
        <h3>{{ pillar.title }}</h3>
        <p>{{ pillar.description }}</p>
        <div v-if="pillar.chips?.length" class="pillar-card__chips">
          <span v-for="chip in pillar.chips" :key="chip" class="pillar-card__chip">{{ chip }}</span>
        </div>
        <button type="button" class="pillar-card__link" @click="$emit('navigate', pillar)">
          {{ pillar.ctaLabel || '了解详情' }}
        </button>
      </article>
    </div>
  </section>
</template>

<script setup>
defineProps({
  pillars: {
    type: Array,
    default: () => []
  }
})

defineEmits(['navigate'])
</script>

<style scoped>
.business-pillars {
  padding: 18px 0 8px;
}

.business-pillars__header {
  color: #f8fafc;
}

.business-pillars__header h2 {
  font-size: 20px;
  margin-top: 4px;
  color: #f8fafc;
}

.business-pillars__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 16px;
}

.pillar-card {
  background: rgba(15, 23, 42, 0.65);
  border-radius: 24px;
  padding: 20px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  color: #f8fafc;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.35);
}

.pillar-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  font-size: 18px;
}

.pillar-card h3 {
  font-size: 18px;
  margin-bottom: 8px;
}

.pillar-card p {
  color: rgba(226, 232, 240, 0.85);
  font-size: 13px;
  min-height: 48px;
  line-height: 1.6;
}

.pillar-card__chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 8px 0 6px;
}

.pillar-card__chip {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.15);
  color: #f8fafc;
  font-size: 11px;
  border: 1px solid rgba(248, 250, 252, 0.25);
}

.pillar-card__link {
  margin-top: 14px;
  font-size: 13px;
  color: #a5b4fc;
  border: none;
  background: transparent;
  text-align: left;
  padding: 0;
}

@media (max-width: 340px) {
  .business-pillars__grid {
    grid-template-columns: 1fr;
  }
}
</style>
