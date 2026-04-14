<template>
  <div class="server-monitor">
    <!-- 刷新控制 -->
    <div class="monitor-header">
      <div class="header-left">
        <h2>服务器监控仪表盘 v2.0</h2>
        <span class="last-update">最后更新: {{ lastUpdateTime }}</span>
      </div>
      <div class="header-right">
        <el-switch
          v-model="autoRefresh"
          active-text="自动刷新"
          inactive-text="手动刷新"
          @change="toggleAutoRefresh"
        />
        <el-button 
          type="primary" 
          :loading="loading"
          @click="refreshData"
        >
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 系统概览卡片 -->
    <div class="overview-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="overview-card cpu-card">
            <div class="card-header">
              <span class="card-title">CPU使用率</span>
              <el-tag :type="getStatusType(serverInfo.cpu_usage)" size="small">
                {{ getStatusText(serverInfo.cpu_usage) }}
              </el-tag>
            </div>
            <div class="card-content">
              <div class="metric-value">{{ serverInfo.cpu_usage }}%</div>
              <el-progress 
                :percentage="serverInfo.cpu_usage" 
                :color="getProgressColor(serverInfo.cpu_usage)"
                :show-text="false"
              />
            </div>
            <div class="card-footer">
              <span class="metric-label">负载: {{ serverInfo.load_average }}</span>
            </div>
          </div>
        </el-col>
        
        <el-col :span="6">
          <div class="overview-card memory-card">
            <div class="card-header">
              <span class="card-title">内存使用</span>
              <el-tag :type="getStatusType(serverInfo.memory_usage)" size="small">
                {{ getStatusText(serverInfo.memory_usage) }}
              </el-tag>
            </div>
            <div class="card-content">
              <div class="metric-value">{{ serverInfo.memory_usage }}%</div>
              <el-progress 
                :percentage="serverInfo.memory_usage" 
                :color="getProgressColor(serverInfo.memory_usage)"
                :show-text="false"
              />
            </div>
            <div class="card-footer">
              <span class="metric-label">{{ serverInfo.memory_used }} / {{ serverInfo.memory_total }}</span>
            </div>
          </div>
        </el-col>
        
        <el-col :span="6">
          <div class="overview-card disk-card">
            <div class="card-header">
              <span class="card-title">磁盘使用</span>
              <el-tag :type="getStatusType(serverInfo.disk_usage)" size="small">
                {{ getStatusText(serverInfo.disk_usage) }}
              </el-tag>
            </div>
            <div class="card-content">
              <div class="metric-value">{{ serverInfo.disk_usage }}%</div>
              <el-progress 
                :percentage="serverInfo.disk_usage" 
                :color="getProgressColor(serverInfo.disk_usage)"
                :show-text="false"
              />
            </div>
            <div class="card-footer">
              <span class="metric-label">{{ serverInfo.disk_used }} / {{ serverInfo.disk_total }}</span>
            </div>
          </div>
        </el-col>
        
        <el-col :span="6">
          <div class="overview-card network-card">
            <div class="card-header">
              <span class="card-title">网络状态</span>
              <el-tag type="success" size="small">在线</el-tag>
            </div>
            <div class="card-content">
              <div class="network-stats">
                <div class="network-item">
                  <span class="network-label">上传:</span>
                  <span class="network-value">{{ serverInfo.network_upload }}</span>
                </div>
                <div class="network-item">
                  <span class="network-label">下载:</span>
                  <span class="network-value">{{ serverInfo.network_download }}</span>
                </div>
              </div>
            </div>
            <div class="card-footer">
              <span class="metric-label">连接数: {{ serverInfo.connections }}</span>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 详细信息区域 -->
    <div class="detail-section">
      <el-row :gutter="20">
        <!-- 系统信息 -->
        <el-col :span="8">
          <el-card class="detail-card">
            <template #header>
              <div class="card-header">
                <span>系统信息</span>
              </div>
            </template>
            <div class="system-info">
              <div class="info-item">
                <span class="info-label">操作系统:</span>
                <span class="info-value">{{ serverInfo.os_name }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">内核版本:</span>
                <span class="info-value">{{ serverInfo.kernel_version }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">运行时间:</span>
                <span class="info-value">{{ serverInfo.uptime }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">CPU型号:</span>
                <span class="info-value">{{ serverInfo.cpu_model }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">CPU核心:</span>
                <span class="info-value">{{ serverInfo.cpu_cores }} 核</span>
              </div>
              <div class="info-item">
                <span class="info-label">主机名:</span>
                <span class="info-value">{{ serverInfo.hostname }}</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 服务状态 -->
        <el-col :span="8">
          <el-card class="detail-card">
            <template #header>
              <div class="card-header">
                <span>服务状态</span>
              </div>
            </template>
            <div class="service-status">
              <div class="service-item" v-for="service in serverInfo.services" :key="service.name">
                <div class="service-info">
                  <span class="service-name">{{ service.name }}</span>
                  <el-tag 
                    :type="service.status === 'running' ? 'success' : 'danger'"
                    size="small"
                  >
                    {{ service.status === 'running' ? '运行中' : '已停止' }}
                  </el-tag>
                </div>
                <div class="service-details">
                  <span class="service-detail">PID: {{ service.pid || 'N/A' }}</span>
                  <span class="service-detail">内存: {{ service.memory || 'N/A' }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- CPU占用排行 -->
        <el-col :span="8">
          <el-card class="detail-card">
            <template #header>
              <div class="card-header">
                <span>CPU占用排行</span>
              </div>
            </template>
            <div class="process-ranking">
              <div class="ranking-item" v-for="(process, index) in serverInfo.cpu_top" :key="process.pid">
                <div class="rank-number">{{ index + 1 }}</div>
                <div class="process-info">
                  <div class="process-name">{{ truncateCommand(process.command) }}</div>
                  <div class="process-details">
                    <span class="process-pid">PID: {{ process.pid }}</span>
                    <span class="process-user">{{ process.user }}</span>
                  </div>
                </div>
                <div class="process-metrics">
                  <div class="cpu-usage">{{ process.cpu }}%</div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 内存占用排行 -->
    <div class="memory-ranking-section">
      <el-card class="detail-card">
        <template #header>
          <div class="card-header">
            <span>内存占用排行</span>
          </div>
        </template>
        <el-table :data="serverInfo.memory_top" style="width: 100%" size="small">
          <el-table-column type="index" label="排名" width="60" />
          <el-table-column prop="pid" label="PID" width="80" />
          <el-table-column prop="user" label="用户" width="120" />
          <el-table-column prop="cpu" label="CPU%" width="80">
            <template #default="scope">
              <el-tag :type="scope.row.cpu > 50 ? 'danger' : scope.row.cpu > 20 ? 'warning' : 'success'" size="small">
                {{ scope.row.cpu }}%
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="memory" label="内存%" width="80">
            <template #default="scope">
              <el-tag :type="scope.row.memory > 10 ? 'danger' : scope.row.memory > 5 ? 'warning' : 'success'" size="small">
                {{ scope.row.memory }}%
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="command" label="进程命令">
            <template #default="scope">
              <el-tooltip :content="scope.row.command" placement="top">
                <span>{{ truncateCommand(scope.row.command, 60) }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 磁盘详情 -->
    <div class="disk-section">
      <el-card class="detail-card">
        <template #header>
          <div class="card-header">
            <span>磁盘详情</span>
          </div>
        </template>
        <el-table :data="serverInfo.disk_partitions" style="width: 100%">
          <el-table-column prop="device" label="设备" width="200" />
          <el-table-column prop="mount" label="挂载点" width="150" />
          <el-table-column prop="total" label="总大小" width="120" />
          <el-table-column prop="used" label="已使用" width="120" />
          <el-table-column prop="available" label="可用" width="120" />
          <el-table-column prop="usage_percent" label="使用率" width="120">
            <template #default="scope">
              <el-progress 
                :percentage="parseFloat(scope.row.usage.replace('%', '')) || 0" 
                :color="getProgressColor(parseFloat(scope.row.usage.replace('%', '')) || 0)"
                :show-text="true"
                :stroke-width="8"
              />
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getServerInfo } from '@/api/v1/system'

const loading = ref(false)
const autoRefresh = ref(true)
const lastUpdateTime = ref('')
const refreshTimer = ref(null)

const serverInfo = ref({
  cpu_usage: 0,
  memory_usage: 0,
  disk_usage: 0,
  load_average: '0.00',
  memory_used: '0 GB',
  memory_total: '0 GB',
  disk_used: '0 GB',
  disk_total: '0 GB',
  network_upload: '0 KB/s',
  network_download: '0 KB/s',
  connections: 0,
  os_name: 'Loading...',
  kernel_version: 'Loading...',
  uptime: 'Loading...',
  cpu_model: 'Loading...',
  cpu_cores: 0,
  hostname: 'Loading...',
  services: [],
  disk_partitions: [],
  cpu_top: [],
  memory_top: []
})

// 获取进度条颜色
const getProgressColor = (percentage) => {
  if (percentage < 60) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
}

// 获取状态类型
const getStatusType = (percentage) => {
  if (percentage < 60) return 'success'
  if (percentage < 80) return 'warning'
  return 'danger'
}

// 获取状态文本
const getStatusText = (percentage) => {
  if (percentage < 60) return '正常'
  if (percentage < 80) return '警告'
  return '危险'
}

// 截断命令文本
const truncateCommand = (command, maxLength = 30) => {
  if (!command) return 'N/A'
  if (command.length <= maxLength) return command
  return command.substring(0, maxLength) + '...'
}

// 刷新数据
const refreshData = async () => {
  loading.value = true
  try {
    const response = await getServerInfo()
    if (response.success) {
      const data = response.data
      // 适配新的API响应格式
      serverInfo.value = {
        cpu_usage: data.cpu.usage,
        memory_usage: data.memory.usage_percent,
        disk_usage: data.disk.usage_percent,
        load_average: Array.isArray(data.cpu.load_average) ? 
          data.cpu.load_average.map(l => l.toFixed(2)).join(', ') : 
          data.cpu.load_average,
        memory_used: data.memory.used + ' GB',
        memory_total: data.memory.total + ' GB',
        disk_used: data.disk.used + ' GB',
        disk_total: data.disk.total + ' GB',
        network_upload: '0 KB/s', // 暂时使用默认值
        network_download: '0 KB/s', // 暂时使用默认值
        connections: data.network.connections,
        os_name: data.system.os,
        kernel_version: data.system.kernel,
        uptime: data.system.uptime,
        cpu_model: data.cpu.model,
        cpu_cores: data.cpu.cores,
        hostname: data.system.hostname || 'Unknown',
        services: data.services,
        disk_partitions: data.disk.partitions || [],
        cpu_top: data.process_ranking?.cpu_top?.slice(0, 5) || [],
        memory_top: data.process_ranking?.memory_top || []
      }
      lastUpdateTime.value = data.last_update || new Date().toLocaleString()
      ElMessage.success('服务器信息刷新成功')
    } else {
      ElMessage.error(response.message || '获取服务器信息失败')
    }
  } catch (error) {
    console.error('获取服务器信息失败:', error)
    ElMessage.error('获取服务器信息失败')
  } finally {
    loading.value = false
  }
}

// 切换自动刷新
const toggleAutoRefresh = (value) => {
  if (value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

// 开始自动刷新
const startAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }
  refreshTimer.value = setInterval(() => {
    refreshData()
  }, 30000) // 30秒刷新一次
}

// 停止自动刷新
const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

onMounted(() => {
  refreshData()
  if (autoRefresh.value) {
    startAutoRefresh()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.server-monitor {
  padding: 20px;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.header-left h2 {
  margin: 0 0 5px 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.last-update {
  color: #909399;
  font-size: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.overview-cards {
  margin-bottom: 20px;
}

.overview-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  height: 140px;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.metric-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.card-footer {
  margin-top: 10px;
}

.metric-label {
  font-size: 12px;
  color: #909399;
}

.network-stats {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.network-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.network-label {
  font-size: 12px;
  color: #909399;
}

.network-value {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.detail-section, .memory-ranking-section {
  margin-bottom: 20px;
}

.detail-card {
  height: 100%;
}

.detail-card .card-header {
  display: flex;
  align-items: center;
  font-weight: 500;
}

.system-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: #303133;
}

.service-status {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.service-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #409eff;
}

.service-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.service-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.service-details {
  display: flex;
  gap: 15px;
}

.service-detail {
  font-size: 12px;
  color: #909399;
}

.process-ranking {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.rank-number {
  width: 24px;
  height: 24px;
  background: #409eff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  margin-right: 10px;
}

.process-info {
  flex: 1;
  min-width: 0;
}

.process-name {
  font-size: 12px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.process-details {
  display: flex;
  gap: 10px;
  margin-top: 2px;
}

.process-pid, .process-user {
  font-size: 10px;
  color: #909399;
}

.process-metrics {
  text-align: right;
}

.cpu-usage {
  font-size: 12px;
  font-weight: bold;
  color: #409eff;
}

.disk-section {
  margin-bottom: 20px;
}

:deep(.el-table) {
  border-radius: 6px;
}

:deep(.el-table th) {
  background-color: #f8f9fa;
}
</style> 