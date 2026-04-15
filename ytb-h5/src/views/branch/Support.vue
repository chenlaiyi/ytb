<template>
  <div class="branch-support-container">
    <NavHeader title="Support" />
    <div class="empty-state">
      <van-icon name="question-o" size="60" color="#ddd" />
      <p>Support功能正在建设中</p>
      <van-button type="primary" @click="$router.go(-1)">返回</van-button>
    </div>
  </div>
</template>

<script>
import NavHeader from '@/components/NavHeader.vue'
export default { 
  name: 'BranchSupport',
  components: { NavHeader }
}
</script>

<style scoped>
.branch-support-container { background: #f7f8fa; min-height: 100vh; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; text-align: center; }
.empty-state p { margin: 16px 0 24px 0; color: #666; font-size: 14px; }
</style>
