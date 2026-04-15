<template>
  <div 
    class="backtop" 
    v-show="visible" 
    :style="{ right: `${right}px`, bottom: `${bottom}px` }"
    @click="scrollToTop"
  >
    <Icon name="arrow-up" size="18" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Icon } from 'vant'

const props = defineProps({
  height: {
    type: Number,
    default: 200
  },
  right: {
    type: [Number, String],
    default: 30
  },
  bottom: {
    type: [Number, String],
    default: 50
  },
  duration: {
    type: Number,
    default: 300
  }
})

const visible = ref(false)

// 监听滚动事件
const onScroll = () => {
  visible.value = window.pageYOffset > props.height
}

// 滚动到顶部
const scrollToTop = () => {
  const startTime = Date.now()
  const startScrollTop = window.pageYOffset
  
  const scrollStep = () => {
    const currentTime = Date.now()
    const time = Math.min(1, (currentTime - startTime) / props.duration)
    
    // 使用缓动函数让滚动更平滑
    const easeInOutQuad = time => time < 0.5 
      ? 2 * time * time 
      : -1 + (4 - 2 * time) * time
    
    window.scrollTo(0, startScrollTop * (1 - easeInOutQuad(time)))
    
    if (time < 1) {
      requestAnimationFrame(scrollStep)
    }
  }
  
  requestAnimationFrame(scrollStep)
}

onMounted(() => {
  window.addEventListener('scroll', onScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<style scoped>
.backtop {
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  transition: background-color 0.3s;
  z-index: 100;
}

.backtop:hover {
  background-color: rgba(0, 0, 0, 0.75);
}
</style> 