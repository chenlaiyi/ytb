<template>
  <section class="service-assurance" v-if="items.length">
    <header class="service-assurance__header">
      <div>
        <p class="service-assurance__eyebrow">运行保障</p>
        <p class="service-assurance__title">让上线可落地、可复用</p>
      </div>
      <p class="service-assurance__subtitle">全链路 SLA、合规与安全内置</p>
    </header>

    <div class="service-assurance__grid" role="list">
      <article
        v-for="item in items"
        :key="item.title"
        class="assurance-card"
        role="listitem"
      >
        <div class="assurance-card__icon" aria-hidden="true">{{ item.icon }}</div>
        <div class="assurance-card__body">
          <p class="assurance-card__title">{{ item.title }}</p>
          <p class="assurance-card__desc">{{ item.description }}</p>
          <p v-if="item.meta" class="assurance-card__meta">{{ item.meta }}</p>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped>
.service-assurance {
  padding: 26px 22px;
  border-radius: 28px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(148, 163, 184, 0.08));
  border: 1px solid rgba(148, 163, 184, 0.3);
  backdrop-filter: blur(10px);
  box-shadow: inset 0 0 0 1px rgba(248, 250, 252, 0.05), 0 30px 70px rgba(15, 23, 42, 0.2);
  color: #0f172a;
  margin-bottom: 16px;
}

.service-assurance__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.service-assurance__eyebrow {
  font-size: 12px;
  color: #0ea5e9;
  font-weight: 700;
}

.service-assurance__title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.service-assurance__subtitle {
  font-size: 12px;
  color: #475569;
}

.service-assurance__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.assurance-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  padding: 16px;
  border-radius: 20px;
  background: rgba(248, 250, 252, 0.6);
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 15px 35px rgba(15, 23, 42, 0.08);
}

.assurance-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(125, 211, 252, 0.3));
  border: 1px solid rgba(14, 165, 233, 0.3);
  display: grid;
  place-items: center;
  font-size: 20px;
}

.assurance-card__title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
}

.assurance-card__desc {
  font-size: 13px;
  color: #475569;
  line-height: 1.6;
}

.assurance-card__meta {
  font-size: 12px;
  color: #0ea5e9;
  margin-top: 8px;
}

@media (max-width: 360px) {
  .service-assurance__grid {
    grid-template-columns: 1fr;
  }
}
</style>
