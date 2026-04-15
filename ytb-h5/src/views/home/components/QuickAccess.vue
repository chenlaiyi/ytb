<template>
  <section class="quick-access" v-if="items.length">
    <header class="quick-access__header">
      <div>
        <p class="quick-access__eyebrow">按角色快速开始</p>
        <p class="quick-access__title">选择与你最匹配的入口</p>
      </div>
      <slot name="extra"></slot>
    </header>

    <div class="quick-access__grid" role="list">
      <article
        v-for="item in items"
        :key="item.title"
        class="quick-access__card"
        role="listitem"
        @click="$emit('navigate', item)"
      >
        <div class="quick-access__icon" aria-hidden="true">{{ item.icon }}</div>
        <div class="quick-access__content">
          <p class="quick-access__card-title">{{ item.title }}</p>
          <p class="quick-access__card-desc">{{ item.description }}</p>
          <p v-if="item.hint" class="quick-access__hint">{{ item.hint }}</p>
        </div>
        <div class="quick-access__meta">
          <span v-if="item.tag" class="quick-access__tag">{{ item.tag }}</span>
          <van-icon name="arrow" class="quick-access__arrow" />
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

defineEmits(['navigate'])
</script>

<style scoped>
.quick-access {
  background: #ffffff;
  border-radius: 22px;
  padding: 22px 20px;
  margin-bottom: 16px;
  border: 1px solid #e2e8f0;
  color: #0f172a;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
}

.quick-access__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.quick-access__eyebrow {
  font-size: 12px;
  color: #0ea5e9;
  font-weight: 600;
}

.quick-access__title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.quick-access__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.quick-access__card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 14px;
  padding: 16px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
}

.quick-access__card:active {
  transform: translateY(2px);
}

.quick-access__icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(37, 99, 235, 0.14));
  border: 1px solid rgba(14, 165, 233, 0.35);
  display: grid;
  place-items: center;
  font-size: 20px;
}

.quick-access__content {
  min-width: 0;
}

.quick-access__card-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
}

.quick-access__card-desc {
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
}

.quick-access__hint {
  font-size: 12px;
  color: #0ea5e9;
  margin-top: 4px;
}

.quick-access__meta {
  display: grid;
  gap: 6px;
  align-content: space-between;
  justify-items: end;
}

.quick-access__tag {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(14, 165, 233, 0.08);
  color: #0f172a;
  border: 1px solid rgba(14, 165, 233, 0.25);
  font-weight: 600;
}

.quick-access__arrow {
  color: #94a3b8;
  font-size: 14px;
}

@media (max-width: 360px) {
  .quick-access__grid {
    grid-template-columns: 1fr;
  }
}
</style>
