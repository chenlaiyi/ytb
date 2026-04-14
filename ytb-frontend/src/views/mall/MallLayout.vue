<template>
  <div class="mall-layout">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'MallLayout',
  data() {
    return {
      
    }
  },
  created() {
    // 商城模块初始化逻辑
  }
}
</script>

<style scoped>
.mall-layout {
  min-height: 400px;
}
</style> 