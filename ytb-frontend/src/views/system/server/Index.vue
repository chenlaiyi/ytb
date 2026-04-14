<template>
  <div class="server-management">
    <div class="page-header">
      <h1>🤖 Chaterm 智能终端</h1>
      <p>AI驱动的智能终端，支持自然语言命令执行和系统管理</p>
    </div>

    <el-tabs v-model="activeTab" type="card" class="server-tabs">
      <el-tab-pane label="🤖 智能终端" name="terminal">
        <ChatermTerminal />
      </el-tab-pane>
      <el-tab-pane label="📊 服务器监控" name="monitor">
        <ServerMonitor />
      </el-tab-pane>
      <el-tab-pane label="🔒 SSL证书管理" name="ssl">
        <SslManager />
      </el-tab-pane>
      <el-tab-pane label="⚙️ 进程管理" name="process">
        <div class="tab-content">
          <el-empty description="进程管理功能开发中..." />
        </div>
      </el-tab-pane>
      <el-tab-pane label="📝 日志管理" name="logs">
        <div class="tab-content">
          <el-empty description="日志管理功能开发中..." />
        </div>
      </el-tab-pane>
      <el-tab-pane label="🔧 服务管理" name="services">
        <div class="tab-content">
          <el-empty description="服务管理功能开发中..." />
        </div>
      </el-tab-pane>
      <el-tab-pane label="⚙️ 系统设置" name="settings">
        <div class="tab-content">
          <el-empty description="系统设置功能开发中..." />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ServerMonitor from './components/ServerMonitor.vue'
import SslManager from './components/SslManager.vue'
import ChatermTerminal from './components/ChatermTerminal.vue'

const activeTab = ref('terminal')
</script>

<style scoped>
.server-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.server-tabs {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.tab-content {
  padding: 20px;
  min-height: 400px;
}

:deep(.el-tabs__header) {
  margin: 0;
  border-bottom: 1px solid #e4e7ed;
}

:deep(.el-tabs__nav-wrap) {
  padding: 0 20px;
}

:deep(.el-tabs__content) {
  padding: 0;
}
</style>