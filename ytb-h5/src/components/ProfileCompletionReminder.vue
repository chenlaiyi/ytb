<template>
  <div class="profile-reminder" v-if="shouldShowReminder">
    <van-notice-bar
      left-icon="info-o"
      :text="reminderText"
      color="#1989fa"
      background="#e6f7ff"
      @click="handleReminderClick"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { NoticeBar } from 'vant'

const router = useRouter()
const userStore = useUserStore()

// 检查是否需要显示提醒
const shouldShowReminder = computed(() => {
  if (!userStore.isLoggedIn || !userStore.user) {
    return false
  }

  const user = userStore.user
  
  // 检查是否缺少关键信息
  const missingPhone = !user.phone || user.phone === ''
  const missingRealName = !user.real_name || user.real_name === ''
  const missingIdCard = !user.id_card || user.id_card === ''
  
  return missingPhone || missingRealName || missingIdCard
})

// 提醒文本
const reminderText = computed(() => {
  if (!userStore.user) return ''
  
  const user = userStore.user
  const missing = []
  
  if (!user.phone || user.phone === '') {
    missing.push('手机号')
  }
  if (!user.real_name || user.real_name === '') {
    missing.push('真实姓名')
  }
  if (!user.id_card || user.id_card === '') {
    missing.push('身份证')
  }
  
  if (missing.length === 0) return ''
  
  return `为了更好的服务体验，建议您完善${missing.join('、')}等信息。点击前往设置 →`
})

// 处理提醒点击
const handleReminderClick = () => {
  // 跳转到个人信息完善页面
  router.push('/user/profile-complete')
}

onMounted(() => {
  console.log('ProfileCompletionReminder mounted')
})
</script>

<style scoped>
.profile-reminder {
  margin: 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.profile-reminder :deep(.van-notice-bar) {
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.profile-reminder :deep(.van-notice-bar:hover) {
  background-color: #d6f3ff !important;
}
</style>
