<template>
  <section class="training-section" :aria-label="section.title">
    <header class="training-section__header">
      <div>
        <p v-if="section.eyebrow" class="training-section__eyebrow">{{ section.eyebrow }}</p>
        <h2>{{ section.title }}</h2>
      </div>
      <button type="button" class="training-section__more" @click="$emit('more', section)">
        <span>{{ section.totalLabel || '全部' }}</span>
        <i aria-hidden="true">›</i>
      </button>
    </header>
    <p v-if="section.description" class="training-section__description">{{ section.description }}</p>
    <div class="training-section__scroll">
      <article
        v-for="item in section.items"
        :key="item.id"
        class="training-card"
        :class="[`training-card--${section.variant || 'default'}`]"
        @click="$emit('select', item, section)"
      >
        <div class="training-card__media" :style="mediaStyle(item)">
          <img
            v-if="item.cover"
            :src="item.cover"
            :alt="item.title"
            loading="lazy"
            @error="handleImageError($event, item)"
          />
          <span v-if="item.badge" class="training-card__badge">{{ item.badge }}</span>
        </div>
        <div class="training-card__body">
          <p v-if="item.tag" class="training-card__tag">{{ item.tag }}</p>
          <h3>{{ item.title }}</h3>
          <p v-if="item.subtitle" class="training-card__subtitle">{{ item.subtitle }}</p>
          <div v-if="item.meta || item.duration" class="training-card__meta">
            <span>{{ item.meta }}</span>
            <span v-if="item.duration"> · {{ item.duration }}</span>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import heroBannerFallback from '@/assets/images/share-banner.jpg'

defineProps({
  section: {
    type: Object,
    required: true
  }
})

defineEmits(['select', 'more'])

function mediaStyle(item = {}) {
  if (!item.tint) return {}
  return {
    '--training-card-tint': item.tint,
    background: item.tint
  }
}

function handleImageError(event, item) {
  const target = event?.target
  if (!target) return
  target.src = item?.fallback || heroBannerFallback
}
</script>

<style scoped>
.training-section {
  margin-top: 18px;
  padding: 18px 0 4px;
}

.training-section__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.training-section__eyebrow {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 4px;
}

.training-section__header h2 {
  font-size: clamp(18px, 4vw, 22px);
  color: #0f172a;
  margin: 0;
}

.training-section__more {
  border: none;
  background: transparent;
  color: #94a3b8;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  cursor: pointer;
}

.training-section__description {
  color: #64748b;
  font-size: 13px;
  margin: 6px 0 10px;
}

.training-section__scroll {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(170px, 1fr);
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 10px;
  scroll-snap-type: x proximity;
}

.training-card {
  background: #fff;
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 200px;
}

.training-card__media {
  position: relative;
  border-radius: 14px;
  background: var(--training-card-tint, linear-gradient(135deg, #fef3c7, #fde68a));
  padding: 8px;
  min-height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(248, 250, 252, 0.7);
}

.training-card__media img {
  max-width: 100%;
  max-height: 100%;
  border-radius: 10px;
  object-fit: cover;
}

.training-card__badge {
  position: absolute;
  right: 10px;
  top: 10px;
  font-size: 12px;
  background: rgba(15, 23, 42, 0.85);
  color: #fff;
  padding: 2px 8px;
  border-radius: 999px;
}

.training-card__tag {
  font-size: 12px;
  color: #f97316;
  margin: 0;
}

.training-card__body h3 {
  margin: 4px 0;
  font-size: 15px;
  color: #0f172a;
}

.training-card__subtitle {
  margin: 0;
  font-size: 13px;
  color: #475569;
}

.training-card__meta {
  margin-top: auto;
  font-size: 12px;
  color: #94a3b8;
}

@media (min-width: 960px) {
  .training-section__scroll {
    grid-auto-columns: minmax(200px, 1fr);
  }
}
</style>
