<template>
  <view class="page">
    <view class="placeholder">
      <text class="placeholder-icon">🚧</text>
      <text class="placeholder-text">页面开发中...</text>
    </view>
  </view>
</template>

<script setup>
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f7;
  display: flex;
  justify-content: center;
  align-items: center;
}
.placeholder {
  text-align: center;
}
.placeholder-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 20rpx;
}
.placeholder-text {
  font-size: 28rpx;
  color: #999;
}
</style>
