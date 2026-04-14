<template>
  <div class="test-page">
    <h1>测试页面 - 测试路由</h1>
    <div>
      <p>这是一个简单的测试页面，用于测试路由是否正常工作。</p>
      <p>当前时间: {{ currentTime }}</p>
      <el-button type="primary" @click="updateTime">刷新时间</el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TestPage',
  data() {
    return {
      currentTime: new Date().toLocaleString()
    };
  },
  methods: {
    updateTime() {
      this.currentTime = new Date().toLocaleString();
    }
  }
};
</script>

<style scoped>
.test-page {
  padding: 20px;
}
</style> 