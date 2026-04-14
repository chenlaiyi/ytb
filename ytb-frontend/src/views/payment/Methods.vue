<template>
  <div class="page-container">
    <el-card class="page-card">
      <div class="page-header">
        <h2>支付方式管理</h2>
        <p class="page-description">管理系统支持的支付方式及支付配置</p>
      </div>
      
      <el-alert
        title="页面正在开发中"
        type="info"
        description="支付方式管理功能正在开发中，即将上线，请稍后再访问。"
        :closable="false"
        show-icon
      />
      
      <div class="page-actions">
        <el-button type="primary" @click="goBack">返回上一页</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'PaymentMethods',
  data() {
    return {
      title: '支付方式管理',
      description: '管理系统支持的支付方式及支付配置'
    }
  },
  methods: {
    goBack() {
      this.$router.go(-1);
    }
  }
}
</script>

<style scoped>
.page-container {
  padding: 20px;
}
.page-card {
  margin-bottom: 20px;
}
.page-header {
  margin-bottom: 20px;
}
.page-description {
  color: #666;
  margin: 10px 0;
}
.page-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 