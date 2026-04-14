<template>
  <div class="finance-purifier">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <div class="page-icon">
            <el-icon size="32" color="#67C23A">
              <Tools />
            </el-icon>
          </div>
          <div class="page-info">
            <h1 class="page-title">净水器提现</h1>
            <p class="page-description">管理净水器设备相关的提现业务</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="page-content">
      <!-- 欢迎卡片 -->
      <el-card class="welcome-card" shadow="hover">
        <div class="welcome-content">
          <div class="welcome-icon">
            <el-icon size="48" color="#67C23A">
              <Tools />
            </el-icon>
          </div>
          <div class="welcome-text">
            <h2>欢迎使用净水器提现管理</h2>
            <p>在这里您可以管理净水器设备相关的提现申请、审核和处理流程</p>
          </div>
        </div>
      </el-card>

      <!-- 开发状态提示 -->
      <el-card class="development-card" shadow="hover">
        <div class="development-content">
          <div class="development-icon">
            <el-icon size="64" color="#67C23A">
              <Tools />
            </el-icon>
          </div>
          <div class="development-text">
            <h3>功能开发中</h3>
            <p>净水器提现管理功能正在紧张开发中，敬请期待！</p>
            <div class="development-progress">
              <el-progress :percentage="35" color="#67C23A" />
              <span class="progress-text">开发进度：35%</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 功能预览 -->
      <el-card class="features-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><List /></el-icon>
            <span>预计功能</span>
          </div>
        </template>
        <div class="features-grid">
          <div class="feature-item">
            <el-icon size="24" color="#67C23A"><Money /></el-icon>
            <span>设备收益提现</span>
          </div>
          <div class="feature-item">
            <el-icon size="24" color="#409EFF"><Document /></el-icon>
            <span>提现记录查询</span>
          </div>
          <div class="feature-item">
            <el-icon size="24" color="#E6A23C"><Warning /></el-icon>
            <span>提现审核流程</span>
          </div>
          <div class="feature-item">
            <el-icon size="24" color="#F56C6C"><DataAnalysis /></el-icon>
            <span>收益数据统计</span>
          </div>
          <div class="feature-item">
            <el-icon size="24" color="#909399"><Setting /></el-icon>
            <span>分成规则配置</span>
          </div>
          <div class="feature-item">
            <el-icon size="24" color="#606266"><Bell /></el-icon>
            <span>提现通知管理</span>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import {
  Tools,
  List,
  Money,
  Document,
  Warning,
  DataAnalysis,
  Setting,
  Bell
} from '@element-plus/icons-vue'

export default {
  name: 'FinancePurifier',
  components: {
    Tools,
    List,
    Money,
    Document,
    Warning,
    DataAnalysis,
    Setting,
    Bell
  },
  setup() {
    onMounted(() => {
      console.log('净水器提现页面已加载')
    })

    return {}
  }
}
</script>

<style scoped>
.finance-purifier {
  padding: 0;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, #67C23A 0%, #85CE61 100%);
  color: white;
  padding: 24px 32px;
  margin-bottom: 24px;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-info h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
}

.page-info p {
  margin: 0;
  opacity: 0.9;
  font-size: 16px;
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px 32px;
}

.welcome-card {
  margin-bottom: 24px;
}

.welcome-content {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px;
}

.welcome-icon {
  background: linear-gradient(135deg, #67C23A, #85CE61);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-text h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.welcome-text p {
  margin: 0;
  color: #606266;
  font-size: 16px;
  line-height: 1.5;
}

.development-card {
  margin-bottom: 24px;
}

.development-content {
  text-align: center;
  padding: 32px;
}

.development-icon {
  margin-bottom: 24px;
}

.development-text h3 {
  margin: 0 0 12px 0;
  color: #67C23A;
  font-size: 24px;
  font-weight: 600;
}

.development-text p {
  margin: 0 0 24px 0;
  color: #606266;
  font-size: 16px;
}

.development-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.progress-text {
  color: #909399;
  font-size: 14px;
}

.features-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px 0;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.feature-item:hover {
  background: #f0f9ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.15);
}

.feature-item span {
  color: #303133;
  font-weight: 500;
}

@media (max-width: 768px) {
  .page-header {
    padding: 16px 20px;
  }
  
  .page-content {
    padding: 0 20px 20px;
  }
  
  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .welcome-content {
    flex-direction: column;
    text-align: center;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style> 