<template>
  <section class="banner-carousel" v-if="banners.length">
    <van-swipe
      class="banner-carousel__swipe ignore"
      :autoplay="4000"
      indicator-color="#0ea5e9"
      lazy-render
      :touchable="true"
      :loop="true"
    >
      <van-swipe-item
        v-for="banner in banners"
        :key="banner.id"
        class="banner-carousel__item"
        @click="$emit('select', banner)"
      >
        <img
          :src="banner.image"
          :alt="banner.title || 'banner'"
          loading="lazy"
          @error="handleImageError"
        />
      </van-swipe-item>
    </van-swipe>
  </section>
</template>

<script setup>
import heroBannerFallback from '@/assets/images/share-banner.jpg'

defineProps({
  banners: {
    type: Array,
    default: () => []
  }
})

defineEmits(['select'])

function handleImageError(event) {
  const target = event?.target
  if (!target || target.dataset?.fallbackApplied) return
  target.dataset.fallbackApplied = '1'
  target.src = heroBannerFallback
}
</script>

<style scoped>
.banner-carousel {
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
}

.banner-carousel__swipe {
  height: 320px;
  background: linear-gradient(135deg, #e0f2fe, #dbeafe);
}

.banner-carousel__item {
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.banner-carousel__item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>
