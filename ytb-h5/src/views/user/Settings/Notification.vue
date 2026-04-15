<template>
  <div class="settings-simple-page">
    <NavBar
      title="通知设置"
      left-text="返回"
      left-arrow
      fixed
      placeholder
      @click-left="$router.back()"
    />
    <div class="page-content">
      <Empty description="通知设置功能正在升级，请稍后再试。">
        <Button round type="primary" size="small" @click="$router.back()">
          返回上一页
        </Button>
      </Empty>
    </div>
  </div>
</template>

<script setup>
import { NavBar, Empty, Button } from 'vant'
</script>

<style scoped>
.settings-simple-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.page-content {
  padding: 64px 16px 24px;
}
</style>
