<template>
  <section class="product-carousel" v-if="products.length">
    <header class="product-carousel__header">
      <div>
        <p class="product-carousel__eyebrow">商城商品</p>
        <h2>精选热销</h2>
        <p class="product-carousel__subtitle">公开版即可预览库存与履约能力</p>
      </div>
      <button type="button" class="product-carousel__link" @click="$emit('more')">
        进入商城 ›
      </button>
    </header>

    <div class="product-carousel__scroll" role="list">
      <article
        v-for="product in products"
        :key="product.id"
        class="product-card"
        role="listitem"
        @click="$emit('select', product)"
      >
        <div class="product-card__media">
          <img :src="product.cover" :alt="product.name" loading="lazy" />
          <span class="product-card__badge">{{ product.tag || '优选' }}</span>
        </div>
        <div class="product-card__body">
          <p class="product-card__name">{{ product.name }}</p>
          <div class="product-card__meta-row">
            <p class="product-card__price">¥{{ product.price }}</p>
            <small v-if="product.inventory">库存 {{ product.inventory }}</small>
          </div>
          <p class="product-card__meta">好评率 {{ product.rating }}%</p>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
defineProps({
  products: {
    type: Array,
    default: () => []
  }
})

defineEmits(['select', 'more'])
</script>

<style scoped>
.product-carousel {
  background: #ffffff;
  border-radius: 22px;
  padding: 22px;
  border: 1px solid #e2e8f0;
  color: #0f172a;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
}

.product-carousel__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.product-carousel__eyebrow {
  font-size: 12px;
  color: #0ea5e9;
  letter-spacing: 0.4px;
  font-weight: 600;
}

.product-carousel__subtitle {
  font-size: 13px;
  color: #475569;
}

.product-carousel__link {
  color: #0f172a;
  font-weight: 600;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 8px 14px;
  border-radius: 999px;
}

.product-carousel__scroll {
  margin-top: 18px;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(220px, 1fr);
  gap: 18px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.product-card {
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
  cursor: pointer;
  overflow: hidden;
}

.product-card__media {
  position: relative;
}

.product-card__media img {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
}

.product-card__badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(14, 165, 233, 0.9);
  color: #fff;
  font-size: 11px;
}

.product-card__body {
  padding: 14px;
}

.product-card__name {
  font-weight: 700;
  color: #0f172a;
}

.product-card__meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.product-card__price {
  font-size: 22px;
  font-weight: 700;
  color: #0ea5e9;
}

.product-card__meta {
  font-size: 12px;
  color: #475569;
  margin-top: 6px;
}
</style>
