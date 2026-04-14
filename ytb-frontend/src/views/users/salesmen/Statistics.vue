<template>
  <div class="statistics-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>业务员统计分析</h2>
      <p class="page-description">全面分析业务员销售业绩、提成收入和团队表现</p>
      <div class="header-actions">
        <el-button type="primary" @click="exportReport" :loading="loading">
          <el-icon><Download /></el-icon>
          导出报告
        </el-button>
        <el-button @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 导航标签页 -->
    <el-card class="navigation-card" shadow="never">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="salesman-tabs">
        <el-tab-pane label="业务员列表" name="list">
          <template #label>
            <el-icon><UserFilled /></el-icon>
            业务员列表
          </template>
        </el-tab-pane>
        <el-tab-pane label="数据统计" name="statistics">
          <template #label>
            <el-icon><TrendCharts /></el-icon>
            数据统计
          </template>
        </el-tab-pane>
        <el-tab-pane label="绩效管理" name="performance">
          <template #label>
            <el-icon><Trophy /></el-icon>
            绩效管理
          </template>
        </el-tab-pane>
        <el-tab-pane label="培训管理" name="training">
          <template #label>
            <el-icon><Reading /></el-icon>
            培训管理
          </template>
        </el-tab-pane>
        <el-tab-pane label="团队管理" name="team">
          <template #label>
            <el-icon><UserFilled /></el-icon>
            团队管理
          </template>
        </el-tab-pane>
        <el-tab-pane label="薪资管理" name="salary">
          <template #label>
            <el-icon><Money /></el-icon>
            薪资管理
          </template>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 数据概览仪表盘 -->
    <div class="dashboard-overview">
      <el-row :gutter="24">
        <el-col :span="6">
          <el-card class="metric-card primary-card" shadow="hover">
            <div class="metric-content">
              <div class="metric-icon">
                <el-icon><UserFilled /></el-icon>
              </div>
              <div class="metric-data">
                <div class="metric-value">{{ overview.total_salesmen || 0 }}</div>
                <div class="metric-label">总业务员数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="metric-card success-card" shadow="hover">
            <div class="metric-content">
              <div class="metric-icon">
                <el-icon><ShoppingCart /></el-icon>
              </div>
              <div class="metric-data">
                <div class="metric-value">{{ overview.total_devices || 0 }}</div>
                <div class="metric-label">设备销售总数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="metric-card warning-card" shadow="hover">
            <div class="metric-content">
              <div class="metric-icon">
                <el-icon><Money /></el-icon>
              </div>
              <div class="metric-data">
                <div class="metric-value">¥{{ formatNumber(overview.total_commission || 0) }}</div>
                <div class="metric-label">提成总额</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="metric-card info-card" shadow="hover">
            <div class="metric-content">
              <div class="metric-icon">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="metric-data">
                <div class="metric-value">¥{{ formatNumber(overview.avg_commission || 0) }}</div>
                <div class="metric-label">人均提成</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Download,
  Refresh,
  UserFilled,
  ShoppingCart,
  Money,
  TrendCharts,
  Trophy,
  Reading
} from '@element-plus/icons-vue'
import request from '@/utils/request'
import { useRouter } from 'vue-router'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const activeTab = ref('statistics')
const salesmenList = ref([])

// 概览数据
const overview = reactive({
  total_salesmen: 0,
  total_devices: 0,
  total_commission: 0,
  avg_commission: 0
})

// 页面初始化
onMounted(() => {
  loadStatisticsData()
})

// 格式化数字显示
const formatNumber = (num) => {
  if (!num) return '0.00'
  return parseFloat(num).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// 加载统计数据
const loadStatisticsData = async () => {
  loading.value = true
  try {
    // 调用业务员列表API获取统计数据
    const response = await request({
      url: '/admin/api/salesmen',
      method: 'get',
      params: {
        page: 1,
        per_page: 1000 // 获取所有数据用于统计
      }
    })
    
    if (response.code === 200) {
      // 更新概览数据
      overview.total_salesmen = response.total || 0
      overview.total_devices = response.total_sales || 0
      overview.total_commission = response.total_commission || 0
      overview.avg_commission = overview.total_salesmen > 0 ? (overview.total_commission / overview.total_salesmen) : 0
      
      console.log('统计数据加载成功:', {
        total_salesmen: overview.total_salesmen,
        total_devices: overview.total_devices,
        total_commission: overview.total_commission,
        avg_commission: overview.avg_commission
      })
    } else {
      throw new Error(response.message || '获取数据失败')
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error('加载统计数据失败: ' + (error.message || error))
  } finally {
    loading.value = false
  }
}

// 处理标签页点击
const handleTabClick = (tab) => {
  const tabName = tab.props.name
  
  // 根据标签页名称跳转到对应的路由
  switch (tabName) {
    case 'list':
      router.push('/users/salesmen')
      break
    case 'statistics':
      // 当前页面，不需要跳转
      break
    case 'performance':
      router.push('/users/salesmen/performance')
      break
    case 'training':
      router.push('/users/salesmen/training')
      break
    case 'team':
      router.push('/users/salesmen/team')
      break
    case 'salary':
      router.push('/users/salesmen/salary')
      break
    default:
      console.warn('未知的标签页:', tabName)
  }
}

// 刷新数据
const refreshData = () => {
  loadStatisticsData()
  ElMessage.success('数据已刷新')
}

// 导出报告
const exportReport = () => {
  ElMessage.success('正在导出报告...')
}
</script>

<style scoped>
.statistics-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.page-description {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.navigation-card {
  margin-bottom: 20px;
}

.salesman-tabs {
  height: 40px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-card {
  margin-bottom: 24px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.filter-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.filter-content {
  padding: 0;
}

.filter-group {
  margin-bottom: 16px;
}

.filter-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #606266;
  font-size: 14px;
}

.filter-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: flex-end;
  margin-top: 24px;
}

.dashboard-overview {
  margin-bottom: 32px;
}

.metric-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  border: none;
  overflow: hidden;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.primary-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.success-card {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.warning-card {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.info-card {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.metric-content {
  display: flex;
  align-items: center;
  padding: 24px;
}

.metric-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  font-size: 28px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.metric-data {
  flex: 1;
}

.metric-value {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 4px;
  line-height: 1;
}

.metric-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
}

.trend-up {
  color: #67c23a;
}

.trend-down {
  color: #f56c6c;
}

.sub-metric-card {
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1px solid #ebeef5;
}

.sub-metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-color: #409eff;
}

.sub-metric-content {
  padding: 20px;
  text-align: center;
}

.sub-metric-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}

.sub-metric-label {
  font-size: 13px;
  color: #909399;
  font-weight: 500;
}

.overview-cards {
  margin-bottom: 20px;
}

.overview-card {
  height: 120px;
}

.card-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.device-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.commission-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.rate-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.avg-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.card-info h3 {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.card-info p {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.charts-row {
  margin-bottom: 20px;
}

.chart-card {
  height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 320px;
}

.ranking-row {
  margin-bottom: 20px;
}

.ranking-card {
  height: 400px;
}

.ranking-list {
  max-height: 320px;
  overflow-y: auto;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.ranking-item:last-child {
  border-bottom: none;
}

.ranking-item.top-three .rank-number {
  background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%);
  color: white;
}

.rank-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-right: 12px;
}

.salesman-info {
  flex: 1;
}

.salesman-info .name {
  font-weight: 500;
  color: #303133;
}

.salesman-info .employee-id {
  font-size: 12px;
  color: #909399;
}

.stats {
  text-align: right;
}

.stats .amount {
  font-weight: 600;
  color: #e6a23c;
}

.stats .count {
  font-size: 12px;
  color: #909399;
}

.commission-management-card {
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.commission-amount {
  color: #e6a23c;
  font-weight: 600;
}

.preview-summary {
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.summary-item {
  text-align: center;
}

.summary-item .label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.summary-item .value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.commission-total {
  color: #e6a23c !important;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 