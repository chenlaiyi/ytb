<template>
  <div class="income-page">
    <NavHeader title="收入明细" />
    <div class="content">
      <van-empty description="暂无收入记录" />
    </div>
  </div>
</template>

<script setup>
import NavHeader from '@/components/NavHeader.vue'
</script>

<style scoped>
.income-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.content {
  padding: 16px;
}
</style> 