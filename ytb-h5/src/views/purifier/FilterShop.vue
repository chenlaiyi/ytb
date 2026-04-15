<template>
  <div class="filter-shop">
    <NavHeader title="滤芯商城" />
    <div class="content">
      <van-empty description="暂无滤芯商品" />
    </div>
  </div>
</template>

<script setup>
import NavHeader from '@/components/NavHeader.vue'
</script>

<style scoped>
.filter-shop {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.content {
  padding: 16px;
}
</style> 