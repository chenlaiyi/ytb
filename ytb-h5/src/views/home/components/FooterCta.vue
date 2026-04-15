<template>
  <footer class="footer-cta">
    <div class="footer-cta__grid">
      <div>
        <p class="footer-cta__eyebrow">下一步</p>
        <h2>{{ footer.title }}</h2>
        <p class="footer-cta__description">{{ footer.description }}</p>
        <div class="footer-cta__chips">
          <span>H5 / App / 小程序</span>
          <span>开放 Demo</span>
        </div>
      </div>
      <div class="footer-cta__actions">
        <button type="button" class="footer-cta__btn footer-cta__btn--primary" @click="$emit('login')">
          立即登录
        </button>
        <button type="button" class="footer-cta__btn" @click="$emit('download')">
          下载 App
        </button>
        <div class="footer-cta__contact">
          <p>客服热线：{{ footer.hotline }}</p>
          <p>{{ footer.record }}</p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
defineProps({
  footer: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['login', 'download'])
</script>

<style scoped>
.footer-cta {
  padding: 28px 20px;
  color: #fff;
  background: radial-gradient(circle at top left, rgba(59, 130, 246, 0.4), rgba(15, 23, 42, 0.95));
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.footer-cta__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: center;
}

.footer-cta__eyebrow {
  font-size: 12px;
  letter-spacing: 0.4px;
  opacity: 0.8;
}

.footer-cta__description {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.75);
  margin-bottom: 10px;
}

.footer-cta__chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.footer-cta__chips span {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 12px;
}

.footer-cta__actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
}

.footer-cta__btn {
  border: none;
  padding: 12px 18px;
  border-radius: 12px;
  font-weight: 600;
  width: 100%;
}

.footer-cta__btn--primary {
  background: #f97316;
  color: #fff;
}

.footer-cta__btn:not(.footer-cta__btn--primary) {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.footer-cta__contact {
  font-size: 12px;
  opacity: 0.85;
}

@media (max-width: 360px) {
  .footer-cta__grid {
    grid-template-columns: 1fr;
    text-align: left;
  }

  .footer-cta__actions {
    width: 100%;
  }
}
</style>
