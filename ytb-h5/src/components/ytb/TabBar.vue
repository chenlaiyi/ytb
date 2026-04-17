<template>
  <van-tabbar v-model="active" route class="ytb-tabbar">
    <van-tabbar-item to="/devices" icon="cluster-o">
      设备
    </van-tabbar-item>
    <van-tabbar-item to="/expand" icon="share-o">
      拓展
    </van-tabbar-item>
    <van-tabbar-item to="/home" icon="user-o">
      我的
    </van-tabbar-item>
  </van-tabbar>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const active = ref(0)

// 根据当前路由设置激活状态
watch(() => route.path, (path) => {
  if (path.startsWith('/devices') || path.startsWith('/device/')) {
    active.value = 0
  } else if (path.startsWith('/expand')) {
    active.value = 1
  } else {
    active.value = 2
  }
}, { immediate: true })
</script>

<style scoped>
.ytb-tabbar {
  --van-tabbar-item-active-color: #667eea;
}
</style>
