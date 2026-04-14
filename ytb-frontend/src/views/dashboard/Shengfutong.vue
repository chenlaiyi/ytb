<template>
  <div class="shengfutong-dashboard">
    <!-- 直接嵌入盛付通控制面板组件 -->
    <ShengfutongDashboard />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ShengfutongDashboard from '../shengfutong/Dashboard.vue'

const router = useRouter()

// 可选：如果想要重定向到独立的盛付通模块页面
// onMounted(() => {
//   router.push('/shengfutong/dashboard')
// })
</script>

<style scoped>
.shengfutong-dashboard {
  padding: 0; /* 移除padding，让子组件自己控制 */
}
</style> 