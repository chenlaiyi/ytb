<template>
  <span>{{ displayValue }}</span>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  startVal: {
    type: Number,
    default: 0
  },
  endVal: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 1000
  },
  autoplay: {
    type: Boolean,
    default: true
  },
  decimals: {
    type: Number,
    default: 0
  },
  decimal: {
    type: String,
    default: '.'
  },
  separator: {
    type: String,
    default: ','
  },
  prefix: {
    type: String,
    default: ''
  },
  suffix: {
    type: String,
    default: ''
  }
})

const localStartVal = ref(props.startVal)
const displayValue = ref(formatNumber(props.startVal))
const localDuration = ref(props.duration)
const startTime = ref(null)
const remainingTime = ref(null)
const rAF = ref(null)
const lastValue = ref(props.startVal)

// 监听props变化
watch(() => props.startVal, (val) => {
  if (props.autoplay) {
    localStartVal.value = val
    startAnimation()
  }
})

watch(() => props.endVal, (val) => {
  if (props.autoplay) {
    startAnimation()
  }
})

watch(() => props.duration, (val) => {
  localDuration.value = val
})

// 格式化数字
function formatNumber(num) {
  const fixedNumber = parseFloat(num).toFixed(props.decimals)
  let [integer, decimal] = fixedNumber.split('.')
  
  // 添加分隔符
  if (props.separator) {
    integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, props.separator)
  }
  
  let result = integer
  if (props.decimals > 0) {
    result += props.decimal + (decimal || '0'.repeat(props.decimals))
  }
  
  return props.prefix + result + props.suffix
}

// 计数方法
function countUp() {
  const currentTime = Date.now()
  const elapsed = currentTime - startTime.value
  
  remainingTime.value = Math.max(0, localDuration.value - elapsed)
  
  // 计算新的值
  const progress = 1 - remainingTime.value / localDuration.value
  const currentVal = localStartVal.value + (props.endVal - localStartVal.value) * progress
  
  // 更新显示值
  displayValue.value = formatNumber(currentVal)
  lastValue.value = currentVal
  
  // 是否需要继续动画
  if (remainingTime.value > 0) {
    rAF.value = requestAnimationFrame(countUp)
  } else {
    // 动画结束
    displayValue.value = formatNumber(props.endVal)
  }
}

// 开始动画
function startAnimation() {
  if (rAF.value) {
    cancelAnimationFrame(rAF.value)
  }
  
  // 如果起始值和结束值一样，不执行动画
  if (localStartVal.value === props.endVal) {
    displayValue.value = formatNumber(props.endVal)
    return
  }
  
  // 重置时间
  startTime.value = Date.now()
  remainingTime.value = localDuration.value
  
  // 使用requestAnimationFrame执行动画
  rAF.value = requestAnimationFrame(countUp)
}

// 重置
function reset() {
  if (rAF.value) {
    cancelAnimationFrame(rAF.value)
    rAF.value = null
  }
  startTime.value = null
  localStartVal.value = props.startVal
  displayValue.value = formatNumber(props.startVal)
}

// 暂停
function pause() {
  if (rAF.value) {
    cancelAnimationFrame(rAF.value)
    rAF.value = null
    localStartVal.value = lastValue.value
  }
}

// 恢复
function resume() {
  if (!rAF.value) {
    startTime.value = Date.now()
    remainingTime.value = Math.max(0, localDuration.value - (startTime.value - startTime.value))
    rAF.value = requestAnimationFrame(countUp)
  }
}

// 手动开始动画
function start() {
  localStartVal.value = props.startVal
  startAnimation()
}

// 暴露方法
defineExpose({
  start,
  pause,
  resume,
  reset
})

// 自动开始
onMounted(() => {
  if (props.autoplay) {
    startAnimation()
  }
})
</script> 