<template>
  <div class="dividend-config-menu">
    <div class="page-header">
      <h2 style="color: red; font-weight: bold;">分红配置管理菜单</h2>
      <p>这是分红配置的红色二级菜单页面</p>
    </div>

    <div class="menu-content">
      <el-card class="config-card">
        <template #header>
          <div class="card-header" style="color: red;">
            <span>管理菜单功能</span>
          </div>
        </template>
        
        <div class="menu-items">
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="menu-item">
                <el-icon class="menu-icon" style="color: red;"><Money /></el-icon>
                <h4>VIP分红配置</h4>
                <p>配置VIP招募分红规则</p>
                <el-button type="danger" @click="goToVipConfig">进入配置</el-button>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="menu-item">
                <el-icon class="menu-icon" style="color: red;"><CreditCard /></el-icon>
                <h4>设备分红配置</h4>
                <p>配置设备充值分红规则</p>
                <el-button type="danger" @click="goToDeviceConfig">进入配置</el-button>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="menu-item">
                <el-icon class="menu-icon" style="color: red;"><DataAnalysis /></el-icon>
                <h4>分红统计报表</h4>
                <p>查看分红统计数据</p>
                <el-button type="danger" @click="goToStats">查看报表</el-button>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>

      <el-card class="info-card" style="margin-top: 20px;">
        <template #header>
          <div class="card-header" style="color: red;">
            <span>重要提示</span>
          </div>
        </template>
        
        <div class="info-content">
          <el-alert
            title="分红配置注意事项"
            type="warning"
            :closable="false"
            show-icon
          >
            <template #default>
              <ul style="margin: 0; padding-left: 20px;">
                <li>分红配置修改后立即生效</li>
                <li>请谨慎修改分红比例，避免影响用户收益</li>
                <li>建议在业务低峰期进行配置调整</li>
                <li style="color: red; font-weight: bold;">此为红色标识的重要管理菜单</li>
              </ul>
            </template>
          </el-alert>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { Money, CreditCard, DataAnalysis } from '@element-plus/icons-vue'

const router = useRouter()

const goToVipConfig = () => {
  // 跳转到VIP分红配置页面
  console.log('跳转到VIP分红配置')
}

const goToDeviceConfig = () => {
  // 跳转到设备分红配置页面
  console.log('跳转到设备分红配置')
}

const goToStats = () => {
  // 跳转到分红统计页面
  console.log('跳转到分红统计')
}
</script>

<style scoped>
.dividend-config-menu {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 10px 0;
  font-size: 24px;
}

.page-header p {
  margin: 0;
  color: #666;
}

.card-header {
  font-weight: bold;
  font-size: 16px;
}

.menu-items {
  padding: 20px 0;
}

.menu-item {
  text-align: center;
  padding: 20px;
  border: 2px solid #f5f5f5;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.menu-item:hover {
  border-color: #ff4d4f;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.15);
}

.menu-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.menu-item h4 {
  margin: 10px 0;
  color: #333;
}

.menu-item p {
  margin: 10px 0;
  color: #666;
  font-size: 14px;
}

.info-content {
  padding: 10px 0;
}

:deep(.el-alert__content) {
  line-height: 1.6;
}
</style> 