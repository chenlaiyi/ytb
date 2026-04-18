<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <el-icon><Monitor /></el-icon>
          净水器设备管理
        </h2>
        <p class="page-subtitle">管理七云智联IOT净水器设备，包括滤芯监控、远程控制等功能</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-container">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card total">
            <div class="stat-icon">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.total_devices || 0 }}</div>
              <div class="stat-label">设备总数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card online">
            <div class="stat-icon">
              <el-icon><Connection /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.online_devices || 0 }}</div>
              <div class="stat-label">在线设备</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card warning">
            <div class="stat-icon">
              <el-icon><Filter /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ lowWaterCount }}</div>
              <div class="stat-label">低水量预警</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card offline">
            <div class="stat-icon">
              <el-icon><WarningFilled /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.offline_devices || 0 }}</div>
              <div class="stat-label">离线设备</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-container">
      <el-input
        v-model="listQuery.keyword"
        placeholder="搜索设备编号、IMEI..."
        style="width: 280px;"
        class="filter-item"
        clearable
        @keyup.enter="handleFilter"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <el-select
        v-model="listQuery.status"
        placeholder="设备状态"
        clearable
        style="width: 140px"
        class="filter-item"
      >
        <el-option label="已激活" value="activated" />
        <el-option label="待激活" value="pending" />
        <el-option label="已禁用" value="disabled" />
      </el-select>

      <el-select
        v-model="listQuery.network_status"
        placeholder="在线状态"
        clearable
        style="width: 140px"
        class="filter-item"
      >
        <el-option label="在线" value="1" />
        <el-option label="离线" value="0" />
      </el-select>

      <el-button type="primary" @click="handleFilter">
        <el-icon><Search /></el-icon>
        搜索
      </el-button>
      <el-button @click="resetFilter">
        <el-icon><RefreshRight /></el-icon>
        重置
      </el-button>
    </div>

    <!-- 设备列表 -->
    <el-table
      v-loading="loading"
      :data="list"
      border
      stripe
      style="width: 100%"
    >
      <el-table-column prop="device_number" label="设备编号" width="140" />
      <el-table-column label="品牌/型号" width="140">
        <template #default="{ row }">
          <div class="brand-cell">
            <span class="brand-name">{{ row.brand || '-' }}</span>
            <span class="model-name">{{ row.device_model || '-' }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="imei" label="IMEI" width="150" />
      <el-table-column label="设备状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.network_status === '1' ? 'success' : 'danger'" size="small">
            {{ row.network_status === '1' ? '在线' : '离线' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="滤芯状态" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="row.is_low_water ? 'danger' : 'success'" size="small">
            {{ row.is_low_water ? '水量不足' : '正常' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="surplus_flow" label="剩余流量(L)" width="110" align="right">
        <template #default="{ row }">
          <span :class="{ 'low-water': row.is_low_water }">{{ row.surplus_flow ?? 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column label="套餐类型" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.billing_mode === 'time' ? 'success' : 'primary'" size="small">
            {{ row.billing_mode === 'time' ? '包年' : '流量' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="剩余额度" width="120" align="right">
        <template #default="{ row }">
          <span v-if="row.billing_mode === 'time'">
            {{ row.remaining_days ?? '-' }} 天
          </span>
          <span v-else>
            {{ row.surplus_flow ?? 0 }} L
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="client_name" label="用户" width="100">
        <template #default="{ row }">
          {{ row.client_name || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="渠道商" width="100">
        <template #default="{ row }">
          <span class="dealer-name-cell" v-if="row.dealer_name">{{ row.dealer_name }}</span>
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="address" label="安装地址" min-width="150" show-overflow-tooltip />
      <el-table-column prop="activate_date" label="激活时间" width="150">
        <template #default="{ row }">
          {{ row.activate_date ? row.activate_date.substring(0, 19) : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="showDetail(row)">
            <el-icon><View /></el-icon> 详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="listQuery.page"
        v-model:page-size="listQuery.per_page"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 设备详情抽屉 -->
    <el-drawer
      v-model="detailDrawerVisible"
      title="设备详情"
      size="50%"
      direction="rtl"
    >
      <div v-if="currentDevice" class="device-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备编号">{{ currentDevice.device_number }}</el-descriptions-item>
          <el-descriptions-item label="主板编码">{{ currentDevice.board_code || '-' }}</el-descriptions-item>
          <el-descriptions-item label="IMEI">{{ currentDevice.imei }}</el-descriptions-item>
          <el-descriptions-item label="ICCID">{{ currentDevice.iccid || '-' }}</el-descriptions-item>
          <el-descriptions-item label="品牌">
            <el-tag type="info" size="small">{{ currentDevice.brand || '-' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="型号">
            <span class="model-tag">{{ currentDevice.device_model || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="设备状态">
            <el-tag :type="currentDevice.network_status === '1' ? 'success' : 'danger'">
              {{ currentDevice.network_status === '1' ? '在线' : '离线' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="激活状态">
            <el-tag :type="getStatusType(currentDevice.status)">
              {{ currentDevice.status_text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="原水TDS">
            <span class="tds-value">{{ currentDevice.tds_in ?? '-' }} ppm</span>
          </el-descriptions-item>
          <el-descriptions-item label="净水TDS">
            <span class="tds-value tds-pure">{{ currentDevice.tds_out ?? '-' }} ppm</span>
          </el-descriptions-item>
          <el-descriptions-item label="套餐类型">
            <el-tag :type="currentDevice.billing_mode === 'time' ? 'success' : 'primary'" size="small">
              {{ currentDevice.billing_mode === 'time' ? '包年套餐' : '流量套餐' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="剩余流量">{{ currentDevice.surplus_flow ?? 0 }} L</el-descriptions-item>
          <el-descriptions-item label="累计流量">{{ currentDevice.cumulative_filtration_flow ?? 0 }} L</el-descriptions-item>
          <el-descriptions-item label="用户">{{ currentDevice.client_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentDevice.client_phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="安装地址" :span="2">{{ currentDevice.address || '-' }}</el-descriptions-item>
          <el-descriptions-item label="激活时间">{{ currentDevice.activate_date || '-' }}</el-descriptions-item>
          <el-descriptions-item label="服务到期">{{ currentDevice.service_end_time || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentDevice.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Monitor, Connection, Filter, WarningFilled, Search,
  Refresh, RefreshRight, View
} from '@element-plus/icons-vue'
import request from '@/utils/request'

// API基础路径
const API_BASE = '/api/admin/v1'

// 列表相关
const loading = ref(false)
const list = ref([])
const pagination = ref({ total: 0 })
const listQuery = reactive({
  page: 1,
  per_page: 20,
  keyword: '',
  status: '',
  network_status: ''
})

// 统计数据
const statistics = ref({
  total_devices: 0,
  active_devices: 0,
  online_devices: 0,
  offline_devices: 0
})

// 低水量统计
const lowWaterCount = computed(() => {
  return list.value.filter(d => d.is_low_water).length
})

// 当前设备
const currentDevice = ref(null)

// 抽屉控制
const detailDrawerVisible = ref(false)

// 获取设备列表
const fetchList = async () => {
  loading.value = true
  try {
    const params = { ...listQuery }
    // 移除空值
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key]
      }
    })

    const res = await request.get(API_BASE + '/devices', { params })
    if (res.code === 0) {
      list.value = res.data.data || []
      pagination.value.total = res.data.total || 0
      if (res.data.statistics) {
        statistics.value = res.data.statistics
      }
    }
  } catch (error) {
    console.error('获取设备列表失败:', error)
    ElMessage.error('获取设备列表失败')
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = () => {
  fetchList()
}

// 搜索
const handleFilter = () => {
  listQuery.page = 1
  fetchList()
}

// 重置搜索
const resetFilter = () => {
  listQuery.keyword = ''
  listQuery.status = ''
  listQuery.network_status = ''
  handleFilter()
}

// 分页
const handleSizeChange = (val) => {
  listQuery.per_page = val
  fetchList()
}

const handleCurrentChange = (val) => {
  listQuery.page = val
  fetchList()
}

// 显示设备详情
const showDetail = (row) => {
  currentDevice.value = { ...row }
  detailDrawerVisible.value = true
}

// 状态类型
const getStatusType = (status) => {
  const types = {
    'pending': 'info',
    'assigned': 'warning',
    'installed': 'warning',
    'activated': 'success',
    'disabled': 'danger',
  }
  return types[status] || 'info'
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.stats-container {
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card.clickable {
  cursor: pointer;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-card.total .stat-icon { background: #e6f7ff; color: #1890ff; }
.stat-card.online .stat-icon { background: #f6ffed; color: #52c41a; }
.stat-card.warning .stat-icon { background: #fff7e6; color: #fa8c16; }
.stat-card.offline .stat-icon { background: #fff1f0; color: #f5222d; }

.stat-number {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.filter-container {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-item {
  margin-right: 0;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.device-detail {
  padding: 20px;
}

.tds-value {
  font-weight: 600;
  color: #909399;
}

.tds-value.tds-pure {
  color: #67c23a;
}

.brand-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.brand-name {
  font-weight: 600;
  color: #409eff;
  font-size: 13px;
}

.model-name {
  font-size: 12px;
  color: #909399;
}

.model-tag {
  font-weight: 500;
  color: #606266;
}

.dealer-name-cell {
  color: #409eff;
  font-weight: 500;
}

.text-muted {
  color: #c0c4cc;
}

.low-water {
  color: #f56c6c;
  font-weight: bold;
}
</style>
