<template>
  <section class="content-hub">
    <header class="content-hub__header">
      <div>
        <p class="content-hub__eyebrow">运营动态</p>
        <h2>内容枢纽</h2>
      </div>
      <div class="content-hub__tabs" role="tablist">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          role="tab"
          :aria-selected="tab.key === active"
          :class="['content-hub__tab', { 'content-hub__tab--active': tab.key === active }]"
          @click="$emit('update:active', tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>
    </header>

    <div class="content-hub__list" role="list">
      <article v-for="item in items" :key="item.id" class="content-card" role="listitem">
        <div class="content-card__badge">{{ item.category }}</div>
        <div class="content-card__body">
          <p class="content-card__title">{{ item.title }}</p>
          <p class="content-card__meta">{{ item.date }}</p>
        </div>
        <button type="button" class="content-card__link" @click="$emit('open', item)">
          查看
        </button>
      </article>
    </div>
  </section>
</template>

<script setup>
defineProps({
  tabs: {
    type: Array,
    default: () => []
  },
  active: {
    type: String,
    default: ''
  },
  items: {
    type: Array,
    default: () => []
  }
})

defineEmits(['update:active', 'open'])
</script>

<style scoped>
.content-hub {
  background: #0b1120;
  border-radius: 20px;
  padding: 20px;
  border: 1px solid rgba(99, 102, 241, 0.25);
  color: #f8fafc;
}

.content-hub__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.content-hub__eyebrow {
  font-size: 12px;
  color: #a5b4fc;
}

.content-hub__tabs {
  display: inline-flex;
  background: rgba(79, 70, 229, 0.3);
  border-radius: 999px;
  padding: 4px;
}

.content-hub__tab {
  border: none;
  background: transparent;
  padding: 6px 16px;
  border-radius: 999px;
  font-size: 13px;
  color: rgba(226, 232, 240, 0.8);
}

.content-hub__tab--active {
  background: #fff;
  color: #312e81;
  font-weight: 600;
}

.content-hub__list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.content-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.04);
}

.content-card__badge {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(165, 180, 252, 0.5);
  font-size: 11px;
}

.content-card__title {
  font-weight: 600;
  color: #fff;
}

.content-card__meta {
  font-size: 12px;
  color: rgba(226, 232, 240, 0.7);
}

.content-card__link {
  font-size: 13px;
  color: #c7d2fe;
}
</style>
