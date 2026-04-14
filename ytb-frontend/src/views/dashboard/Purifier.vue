<template>
  <div class="purifier-dashboard">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="welcome-card">
          <h2>净水器管理面板</h2>
          <p>这里是净水器设备管理控制台，您可以在这里监控和管理所有净水器设备。</p>
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
            <el-icon size="48" color="#409EFF">
              <Tools />
            </el-icon>
            <h3>净水器管理功能正在开发中</h3>
            <p>该功能模块正在紧张开发中，敬请期待！</p>
            <p>预计功能包括：</p>
            <ul>
              <li>净水器设备监控</li>
              <li>滤芯更换提醒</li>
              <li>水质检测报告</li>
              <li>设备维护记录</li>
              <li>用户使用统计</li>
            </ul>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { Tools } from '@element-plus/icons-vue';

export default {
  name: 'PurifierDashboard',
  components: {
    Tools
  },
  setup() {
    return {};
  }
};
</script>

<style scoped>
.purifier-dashboard {
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