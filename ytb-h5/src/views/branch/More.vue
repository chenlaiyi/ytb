<template>
  <div class="branch-more-container">
    <van-nav-bar title="More" left-arrow @click-left="$router.go(-1)" />
    <div class="empty-state">
      <van-icon name="question-o" size="60" color="#ddd" />
      <p>More功能正在建设中</p>
      <van-button type="primary" @click="$router.go(-1)">返回</van-button>
    </div>
  </div>
</template>

<script>
export default { name: 'BranchMore' }
</script>

<style scoped>
.branch-more-container { background: #f7f8fa; min-height: 100vh; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; text-align: center; }
.empty-state p { margin: 16px 0 24px 0; color: #666; font-size: 14px; }
</style>
