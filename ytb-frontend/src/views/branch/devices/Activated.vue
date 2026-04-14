<template>
  <div class="branch-device-activated">
    <div class="page-header">
      <div class="header-left">
        <h2>已激活设备</h2>
        <p>管理分支机构的已激活设备</p>
      </div>
    </div>
    
    <el-card shadow="never">
      <div class="activated-content">
        <p>已激活设备管理功能开发中...</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
const branchId = route.params.branchId
</script>

<style scoped>
.branch-device-activated {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.header-left h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.header-left p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.activated-content {
  text-align: center;
  padding: 40px;
  color: #909399;
}
</style> 