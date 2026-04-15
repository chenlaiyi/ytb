<template>
  <div class="team-page">
    <NavHeader title="我的团队" />
    <div class="content">
      <van-empty description="暂无团队成员" />
    </div>
  </div>
</template>

<script setup>
import NavHeader from '@/components/NavHeader.vue'
</script>

<style scoped>
.team-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.content {
  padding: 16px;
}
</style> 