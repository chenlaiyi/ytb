<template>
  <div class="branch-devices-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">设备管理</h1>
        <p class="page-description">管理分支机构的设备信息</p>
      </div>
      <div class="header-actions">
        <el-button @click="refreshDevices" :icon="Refresh">
          刷新
        </el-button>
        <el-button type="primary" @click="exportDevices" :icon="Download">
          导出
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" inline>
        <el-form-item label="关键词:">
          <el-input
            v-model="filterForm.keyword"
            placeholder="设备编号/用户手机号"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="设备状态:">
          <el-select 
            v-model="filterForm.status" 
            placeholder="选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="在线" value="online" />
            <el-option label="离线" value="offline" />
            <el-option label="故障" value="error" />
            <el-option label="维护中" value="maintenance" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备类型:">
          <el-select 
            v-model="filterForm.device_type" 
            placeholder="选择类型"
            clearable
            style="width: 120px"
          >
            <el-option label="净水器" value="water_purifier" />
            <el-option label="POS机" value="pos" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="激活时间:">
          <el-date-picker
            v-model="filterForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :icon="Search">
            搜索
          </el-button>
          <el-button @click="resetSearch">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据统计 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon color="#409eff"><Monitor /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.total_devices || 0 }}</div>
          <div class="stat-label">设备总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon color="#67c23a"><CircleCheck /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.online_devices || 0 }}</div>
          <div class="stat-label">在线设备</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon color="#f56c6c"><CircleClose /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.offline_devices || 0 }}</div>
          <div class="stat-label">离线设备</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon color="#e6a23c"><Warning /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.error_devices || 0 }}</div>
          <div class="stat-label">故障设备</div>
        </div>
      </div>
    </div>

    <!-- 设备列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="deviceList"
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="#" width="60" />
        
        <el-table-column prop="device_code" label="设备编号" width="140" />
        
        <el-table-column label="设备信息" min-width="200">
          <template #default="{ row }">
            <div class="device-info">
              <div class="device-name">{{ row.device_name || '未命名设备' }}</div>
              <div class="device-type">
                <el-tag size="small" :type="getDeviceTypeColor(row.device_type)">
                  {{ getDeviceTypeName(row.device_type) }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="所属用户" min-width="150">
          <template #default="{ row }">
            <div v-if="row.user" class="user-info">
              <div class="user-name">{{ row.user.nickname || '未设置' }}</div>
              <div class="user-phone">{{ row.user.phone }}</div>
            </div>
            <span v-else class="text-muted">未绑定</span>
          </template>
        </el-table-column>

        <el-table-column label="设备状态" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="getStatusColor(row.status)" 
              size="small"
            >
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="位置信息" width="120">
          <template #default="{ row }">
            <div v-if="row.location">
              <div class="location-name">{{ row.location.name }}</div>
              <div class="location-address">{{ row.location.address }}</div>
            </div>
            <span v-else class="text-muted">未设置</span>
          </template>
        </el-table-column>

        <el-table-column label="最后在线" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.last_online_time) }}
          </template>
        </el-table-column>

        <el-table-column label="激活时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.activated_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="viewDevice(row)"
            >
              查看
            </el-button>
            <el-button
              type="warning"
              size="small"
              @click="editDevice(row)"
            >
              编辑
            </el-button>
            <el-dropdown @command="(command) => handleDeviceAction(command, row)">
              <el-button size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="remote-control">
                    远程控制
                  </el-dropdown-item>
                  <el-dropdown-item command="view-logs">
                    查看日志
                  </el-dropdown-item>
                  <el-dropdown-item command="maintenance">
                    设置维护
                  </el-dropdown-item>
                  <el-dropdown-item command="unbind" divided>
                    解绑用户
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.current_page"
          v-model:page-size="pagination.per_page"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 设备详情对话框 -->
    <el-drawer
      v-model="deviceDetailVisible"
      title="设备详情"
      direction="rtl"
      size="600px"
    >
      <div v-if="currentDevice" class="device-detail-content">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h3>基本信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="设备编号">
              {{ currentDevice.device_code }}
            </el-descriptions-item>
            <el-descriptions-item label="设备名称">
              {{ currentDevice.device_name || '未命名' }}
            </el-descriptions-item>
            <el-descriptions-item label="设备类型">
              <el-tag :type="getDeviceTypeColor(currentDevice.device_type)">
                {{ getDeviceTypeName(currentDevice.device_type) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="设备状态">
              <el-tag :type="getStatusColor(currentDevice.status)">
                {{ getStatusName(currentDevice.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="激活时间">
              {{ formatDateTime(currentDevice.activated_at) }}
            </el-descriptions-item>
            <el-descriptions-item label="最后在线">
              {{ formatDateTime(currentDevice.last_online_time) }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 用户信息 -->
        <div class="detail-section" v-if="currentDevice.user">
          <h3>绑定用户</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="用户昵称">
              {{ currentDevice.user.nickname || '未设置' }}
            </el-descriptions-item>
            <el-descriptions-item label="手机号">
              {{ currentDevice.user.phone }}
            </el-descriptions-item>
            <el-descriptions-item label="用户类型">
              <el-tag v-if="currentDevice.user.is_vip" type="warning">CP用户</el-tag>
              <el-tag v-else>普通用户</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="绑定时间">
              {{ formatDateTime(currentDevice.bind_time) }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 位置信息 -->
        <div class="detail-section" v-if="currentDevice.location">
          <h3>位置信息</h3>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="位置名称">
              {{ currentDevice.location.name }}
            </el-descriptions-item>
            <el-descriptions-item label="详细地址">
              {{ currentDevice.location.address }}
            </el-descriptions-item>
            <el-descriptions-item label="坐标信息">
              {{ currentDevice.location.latitude }}, {{ currentDevice.location.longitude }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 运行状态 -->
        <div class="detail-section">
          <h3>运行状态</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="累计运行时间">
              {{ currentDevice.total_runtime || '0' }} 小时
            </el-descriptions-item>
            <el-descriptions-item label="今日运行时间">
              {{ currentDevice.today_runtime || '0' }} 小时
            </el-descriptions-item>
            <el-descriptions-item label="累计收入">
              ¥{{ (currentDevice.total_income || 0).toFixed(2) }}
            </el-descriptions-item>
            <el-descriptions-item label="本月收入">
              ¥{{ (currentDevice.month_income || 0).toFixed(2) }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Search, 
  Refresh, 
  Download, 
  Monitor, 
  CircleCheck, 
  CircleClose, 
  Warning,
  ArrowDown
} from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import { getBranchDevices, getBranchDeviceStats } from '@/api/v1/branchManagement'

const route = useRoute()
const branchId = computed(() => route.params.branchId)

// 响应式数据
const loading = ref(false)
const deviceList = ref([])
const stats = ref({})
const deviceDetailVisible = ref(false)
const currentDevice = ref(null)

// 搜索表单
const filterForm = reactive({
  keyword: '',
  status: '',
  device_type: '',
  date_range: null
})

// 分页数据
const pagination = reactive({
  current_page: 1,
  per_page: 20,
  total: 0
})

// 设备类型映射
const deviceTypeMap = {
  water_purifier: '净水器',
  pos: 'POS机',
  other: '其他'
}

// 状态映射
const statusMap = {
  online: '在线',
  offline: '离线',
  error: '故障',
  maintenance: '维护中'
}

// 获取设备类型名称
const getDeviceTypeName = (type) => {
  return deviceTypeMap[type] || '未知'
}

// 获取设备类型颜色
const getDeviceTypeColor = (type) => {
  const colorMap = {
    water_purifier: 'primary',
    pos: 'success',
    other: 'info'
  }
  return colorMap[type] || 'info'
}

// 获取状态名称
const getStatusName = (status) => {
  return statusMap[status] || '未知'
}

// 获取状态颜色
const getStatusColor = (status) => {
  const colorMap = {
    online: 'success',
    offline: 'info',
    error: 'danger',
    maintenance: 'warning'
  }
  return colorMap[status] || 'info'
}

// 加载设备列表
const loadDevices = async () => {
  try {
    loading.value = true
    
    const params = {
      page: pagination.current_page,
      per_page: pagination.per_page,
      ...filterForm
    }
    
    // 处理日期范围
    if (filterForm.date_range && filterForm.date_range.length === 2) {
      params.start_date = filterForm.date_range[0]
      params.end_date = filterForm.date_range[1]
    }
    
    const response = await getBranchDevices(branchId.value, params)
    
    if (response.code === 200) {
      deviceList.value = response.data.data || []
      pagination.total = response.data.total || 0
      pagination.current_page = response.data.current_page || 1
      pagination.per_page = response.data.per_page || 20
    } else {
      ElMessage.error(response.message || '获取设备列表失败')
    }
  } catch (error) {
    console.error('获取设备列表失败:', error)
    ElMessage.error('获取设备列表失败')
  } finally {
    loading.value = false
  }
}

// 加载统计数据
const loadStats = async () => {
  try {
    const response = await getBranchDeviceStats(branchId.value)
    if (response.code === 200) {
      stats.value = response.data || {}
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.current_page = 1
  loadDevices()
}

// 重置搜索
const resetSearch = () => {
  Object.assign(filterForm, {
    keyword: '',
    status: '',
    device_type: '',
    date_range: null
  })
  pagination.current_page = 1
  loadDevices()
}

// 刷新
const refreshDevices = () => {
  loadDevices()
  loadStats()
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.per_page = size
  pagination.current_page = 1
  loadDevices()
}

const handleCurrentChange = (page) => {
  pagination.current_page = page
  loadDevices()
}

// 查看设备详情
const viewDevice = (device) => {
  currentDevice.value = device
  deviceDetailVisible.value = true
}

// 编辑设备
const editDevice = (device) => {
  ElMessage.info('编辑功能开发中...')
}

// 设备操作
const handleDeviceAction = async (command, device) => {
  switch (command) {
    case 'remote-control':
      ElMessage.info('远程控制功能开发中...')
      break
    case 'view-logs':
      ElMessage.info('查看日志功能开发中...')
      break
    case 'maintenance':
      await setDeviceMaintenance(device)
      break
    case 'unbind':
      await unbindDevice(device)
      break
  }
}

// 设置设备维护
const setDeviceMaintenance = async (device) => {
  try {
    await ElMessageBox.confirm(
      `确定要将设备 ${device.device_code} 设置为维护状态吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ElMessage.info('设置维护功能开发中...')
  } catch {
    // 用户取消
  }
}

// 解绑设备
const unbindDevice = async (device) => {
  if (!device.user) {
    ElMessage.warning('设备未绑定用户')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要解绑设备 ${device.device_code} 与用户 ${device.user.phone} 的绑定关系吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ElMessage.info('解绑功能开发中...')
  } catch {
    // 用户取消
  }
}

// 导出设备
const exportDevices = () => {
  ElMessage.info('导出功能开发中...')
}

// 格式化时间
const formatDateTime = (datetime) => {
  if (!datetime) return '-'
  return new Date(datetime).toLocaleString('zh-CN')
}

// 初始化
onMounted(() => {
  loadDevices()
  loadStats()
})
</script>

<style scoped>
.branch-devices-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #303133;
}

.page-description {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.filter-card {
  margin-bottom: 20px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  background: #f5f7fa;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.table-card {
  margin-bottom: 20px;
}

.device-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.device-name {
  font-weight: 500;
  color: #303133;
}

.device-type {
  font-size: 12px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-weight: 500;
  color: #303133;
}

.user-phone {
  font-size: 12px;
  color: #909399;
}

.location-name {
  font-weight: 500;
  color: #303133;
  font-size: 12px;
}

.location-address {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.text-muted {
  color: #c0c4cc;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.device-detail-content {
  padding: 20px;
}

.detail-section {
  margin-bottom: 30px;
}

.detail-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 8px;
}
</style> 