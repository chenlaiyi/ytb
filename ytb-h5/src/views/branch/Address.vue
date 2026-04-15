<template>
  <div class="branch-address-container">
    <van-nav-bar title="收货地址" left-arrow @click-left="$router.go(-1)" />
    <div class="empty-state">
      <van-icon name="location-o" size="60" color="#ddd" />
      <p>暂无收货地址</p>
      <van-button type="primary">添加地址</van-button>
    </div>
  </div>
</template>

<script>
export default { name: 'BranchAddress' }
</script>

<style scoped>
.branch-address-container { background: #f7f8fa; min-height: 100vh; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; text-align: center; }
.empty-state p { margin: 16px 0 24px 0; color: #666; font-size: 14px; }
</style> 