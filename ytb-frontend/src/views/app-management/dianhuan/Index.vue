<template>
  <div class="dianhuan-app-management">
    <div class="page-header">
      <h2>点点换APP管理</h2>
      <p>点点换应用的综合管理平台</p>
    </div>

    <!-- 功能开发中提示 -->
    <el-card class="coming-soon-card">
      <div class="coming-soon-content">
        <el-icon class="coming-soon-icon"><Tools /></el-icon>
        <h3>功能开发中</h3>
        <p>点点换APP管理功能正在开发中，敬请期待...</p>
        <div class="planned-features">
          <h4>计划功能：</h4>
          <ul>
            <li>版本管理</li>
            <li>用户管理</li>
            <li>数据统计</li>
            <li>配置管理</li>
            <li>反馈管理</li>
          </ul>
        </div>
        <el-button type="primary" @click="goToDiandian">
          <el-icon><ArrowLeft /></el-icon>
          返回点点够管理
        </el-button>
      </div>
    </el-card>

    <!-- 临时统计卡片 -->
    <el-row :gutter="20" class="mt-6">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">--</div>
              <div class="stat-label">总用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon">
              <el-icon><Download /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">--</div>
              <div class="stat-label">总下载量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon">
              <el-icon><Star /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">--</div>
              <div class="stat-label">应用评分</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">--</div>
              <div class="stat-label">活跃用户</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Tools, ArrowLeft, User, Download, Star, TrendCharts } from '@element-plus/icons-vue'

export default {
  name: 'DianhuanAppManagement',
  components: {
    Tools,
    ArrowLeft,
    User,
    Download,
    Star,
    TrendCharts
  },
  setup() {
    const router = useRouter()

    const goToDiandian = () => {
      router.push({ name: 'AppManagementDiandian' })
    }

    return {
      goToDiandian
    }
  }
}
</script>

<style scoped>
.dianhuan-app-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 24px;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.coming-soon-card {
  margin-bottom: 24px;
}

.coming-soon-content {
  text-align: center;
  padding: 60px 20px;
}

.coming-soon-icon {
  font-size: 64px;
  color: #409eff;
  margin-bottom: 20px;
}

.coming-soon-content h3 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 20px;
}

.coming-soon-content p {
  margin: 0 0 32px 0;
  color: #606266;
  font-size: 16px;
}

.planned-features {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin: 32px auto;
  max-width: 400px;
  text-align: left;
}

.planned-features h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
}

.planned-features ul {
  margin: 0;
  padding-left: 20px;
  color: #606266;
}

.planned-features li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.15);
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  background: linear-gradient(135deg, #e0e0e0 0%, #f0f0f0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 20px;
  color: #909399;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #909399;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  line-height: 1;
}

.mt-6 {
  margin-top: 24px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dianhuan-app-management {
    padding: 16px;
  }
  
  .coming-soon-content {
    padding: 40px 16px;
  }
  
  .coming-soon-icon {
    font-size: 48px;
  }
  
  .planned-features {
    margin: 24px 0;
    padding: 16px;
  }
}
</style>
