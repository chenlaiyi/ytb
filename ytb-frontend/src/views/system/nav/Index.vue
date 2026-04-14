<template>
  <div class="nav-manager">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">导航管理</h1>
          <p class="page-subtitle">管理APP首页和底部导航栏</p>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="refreshPage">
            <el-icon><Refresh /></el-icon>
            刷新页面
          </el-button>
        </div>
      </div>
    </div>

    <!-- 导航标签页 -->
    <div class="nav-tabs-container">
      <el-tabs v-model="activeTab" type="card" class="nav-tabs">
        <el-tab-pane name="home" label="首页导航">
          <HomeNavManager />
        </el-tab-pane>
        <el-tab-pane name="bottom" label="底部导航">
          <BottomNavManager />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import HomeNavManager from './components/HomeNavManager.vue'
import BottomNavManager from './components/BottomNavManager.vue'

const activeTab = ref('home')

const refreshPage = () => {
  window.location.reload()
}
</script>

<style scoped>
.nav-manager {
  padding: 0;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 24px 32px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 4px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.nav-tabs-container {
  max-width: 1200px;
  margin: 24px auto;
  padding: 0 32px;
}

.nav-tabs {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

:deep(.el-tabs__header) {
  margin: 0;
  border-bottom: 1px solid #e4e7ed;
}

:deep(.el-tabs__nav) {
  border: none;
}

:deep(.el-tabs__item) {
  border: none;
  padding: 16px 24px;
  font-size: 14px;
  font-weight: 500;
}

:deep(.el-tabs__item.is-active) {
  color: #409eff;
  background: #f0f9ff;
}

:deep(.el-tabs__content) {
  padding: 24px;
}
</style>