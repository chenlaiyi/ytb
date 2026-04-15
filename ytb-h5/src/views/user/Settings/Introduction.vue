<template>
  <div class="settings-simple-page">
    <NavBar
      title="公司介绍"
      left-text="返回"
      left-arrow
      fixed
      placeholder
      @click-left="$router.back()"
    />
    <div class="page-content">
      <Empty description="公司介绍内容正在更新，将在近期发布。">
        <Button round type="primary" size="small" @click="openWebsite">
          访问官网
        </Button>
      </Empty>
    </div>
  </div>
</template>

<script setup>
import { NavBar, Empty, Button } from 'vant'

const openWebsite = () => {
  window.open('https://www.itapgo.com', '_blank')
}
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
