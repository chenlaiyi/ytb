<template>
  <div class="xinsheng-dashboard">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="welcome-card">
          <h2>新生业务管理面板</h2>
          <p>这里是新生业务系统管理控制台，您可以在这里管理新生相关业务。</p>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>功能开发中</span>
            </div>
          </template>
          <div class="development-notice">
            <el-icon size="48" color="#E6A23C">
              <Star />
            </el-icon>
            <h3>新生业务功能正在开发中</h3>
            <p>该功能模块正在紧张开发中，敬请期待！</p>
            <p>预计功能包括：</p>
            <ul>
              <li>新生业务管理</li>
              <li>客户信息维护</li>
              <li>业务流程跟踪</li>
              <li>数据统计分析</li>
              <li>报表生成</li>
            </ul>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { Star } from '@element-plus/icons-vue';

export default {
  name: 'XinshengDashboard',
  components: {
    Star
  },
  setup() {
    return {};
  }
};
</script>

<style scoped>
.xinsheng-dashboard {
  padding: 20px;
}

.welcome-card {
  margin-bottom: 20px;
}

.welcome-card h2 {
  margin-top: 0;
  color: #303133;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.development-notice {
  text-align: center;
  padding: 40px 20px;
}

.development-notice h3 {
  margin: 20px 0;
  color: #303133;
}

.development-notice p {
  color: #606266;
  margin: 10px 0;
}

.development-notice ul {
  text-align: left;
  display: inline-block;
  margin-top: 20px;
}

.development-notice li {
  margin: 8px 0;
  color: #606266;
}
</style> 