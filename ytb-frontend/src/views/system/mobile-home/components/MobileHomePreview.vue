<template>
  <div class="mobile-preview">
    <div class="mobile-preview__shell">
      <div class="mobile-preview__notch"></div>
      <div class="mobile-preview__screen">
        <section class="preview-hero" :style="heroStyle">
          <p class="preview-hero__sup">{{ config.hero.highlight }}</p>
          <h3>{{ config.hero.title }}</h3>
          <p class="preview-hero__sub">{{ config.hero.subtitle }}</p>
          <button class="preview-hero__cta">{{ config.hero.cta_text || '查看更多' }}</button>
        </section>

        <section class="preview-section" v-if="serviceEntries.length">
          <p class="preview-section__title">服务中心</p>
          <div class="preview-grid">
            <div v-for="entry in serviceEntries" :key="entry.key" class="preview-tile">
              <div class="preview-tile__icon">{{ entry.icon || '⭐' }}</div>
              <p class="preview-tile__title">{{ entry.title }}</p>
              <p class="preview-tile__desc">{{ entry.desc }}</p>
            </div>
          </div>
        </section>

        <section class="preview-section" v-if="workspaceEntries.length">
          <p class="preview-section__title">专属工作台</p>
          <div class="preview-list">
            <div v-for="workspace in workspaceEntries" :key="workspace.key" class="preview-list__item">
              <div class="preview-list__icon">{{ workspace.icon || '🧩' }}</div>
              <div>
                <p class="preview-list__title">{{ workspace.title }}</p>
                <p class="preview-list__desc">{{ workspace.desc }}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="preview-section" v-if="products.length">
          <p class="preview-section__title">精选推荐</p>
          <div class="preview-product" v-for="product in products" :key="product.uid">
            <div class="preview-product__cover"></div>
            <div>
              <p class="preview-product__title">{{ product.name }}</p>
              <p class="preview-product__price">¥{{ formatPrice(product.price) }}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  config: {
    type: Object,
    required: true
  }
})

const heroStyle = computed(() => {
  const bg = props.config?.hero?.background
  if (bg) {
    return {
      backgroundImage: `linear-gradient(180deg, rgba(19,41,89,.85), rgba(19,41,89,.6)), url(${bg})`
    }
  }
  return null
})

const serviceEntries = computed(() => props.config?.service_entries || [])
const workspaceEntries = computed(() => props.config?.workspace_entries || [])
const products = computed(() => props.config?.featured_products || [])

const formatPrice = (value) => {
  const num = Number(value || 0)
  if (Number.isNaN(num)) return '0.00'
  return num.toFixed(2)
}
</script>

<style scoped>
.mobile-preview {
  display: flex;
  justify-content: center;
}

.mobile-preview__shell {
  width: 320px;
  border-radius: 36px;
  padding: 16px 12px;
  background: linear-gradient(145deg, #dfe9f3, #ffffff);
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.2);
}

.mobile-preview__notch {
  width: 160px;
  height: 24px;
  background: #111827;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  margin: 0 auto 8px;
}

.mobile-preview__screen {
  background: #f5f7fb;
  border-radius: 28px;
  padding: 16px;
  height: 560px;
  overflow-y: auto;
}

.preview-hero {
  border-radius: 20px;
  padding: 18px;
  background: linear-gradient(180deg, #3b82f6, #60a5fa);
  color: #fff;
  text-align: left;
  margin-bottom: 16px;
  background-size: cover;
  background-position: center;
}

.preview-hero__sup {
  margin: 0;
  font-size: 12px;
  letter-spacing: 2px;
  text-transform: uppercase;
  opacity: 0.9;
}

.preview-hero h3 {
  margin: 6px 0;
  font-size: 18px;
}

.preview-hero__sub {
  margin: 0;
  font-size: 13px;
  opacity: 0.85;
}

.preview-hero__cta {
  margin-top: 14px;
  border: none;
  border-radius: 999px;
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 12px;
}

.preview-section {
  margin-bottom: 18px;
}

.preview-section__title {
  margin: 0 0 10px;
  font-size: 13px;
  color: #94a3b8;
  letter-spacing: 1px;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.preview-tile {
  background: #fff;
  border-radius: 14px;
  padding: 10px;
  min-height: 90px;
}

.preview-tile__icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  margin-bottom: 8px;
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-tile__title {
  margin: 0;
  font-weight: 600;
}

.preview-tile__desc {
  margin: 2px 0 0;
  font-size: 12px;
  color: #94a3b8;
}

.preview-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preview-list__item {
  background: #fff;
  border-radius: 16px;
  padding: 10px 12px;
  display: flex;
  gap: 12px;
  align-items: center;
}

.preview-list__icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #e0f2fe;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-list__title {
  margin: 0;
  font-weight: 600;
}

.preview-list__desc {
  margin: 2px 0 0;
  font-size: 12px;
  color: #94a3b8;
}

.preview-product {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-radius: 18px;
  padding: 10px;
  margin-bottom: 10px;
}

.preview-product__cover {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, #93c5fd, #a5b4fc);
}

.preview-product__title {
  margin: 0;
  font-size: 13px;
}

.preview-product__price {
  margin: 4px 0 0;
  color: #ef4444;
  font-weight: 600;
}
</style>
