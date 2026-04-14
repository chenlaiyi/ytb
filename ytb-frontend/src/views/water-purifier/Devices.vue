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
              <div class="stat-number">{{ statistics.total || 0 }}</div>
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
              <div class="stat-number">{{ statistics.online || 0 }}</div>
              <div class="stat-label">在线设备</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card warning clickable" @click="goToFilterAlerts">
            <div class="stat-icon">
              <el-icon><Filter /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.filter_alert || 0 }}</div>
              <div class="stat-label">滤芯预警</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card offline">
            <div class="stat-icon">
              <el-icon><WarningFilled /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.offline || 0 }}</div>
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
        <el-option label="在线" value="online" />
        <el-option label="离线" value="offline" />
      </el-select>

      <el-select
        v-model="listQuery.filter_alert"
        placeholder="滤芯状态"
        clearable
        style="width: 140px"
        class="filter-item"
      >
        <el-option label="正常" value="normal" />
        <el-option label="预警" value="alert" />
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
      <el-table-column prop="device_id" label="设备编号" width="140" />
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
          <el-tag :type="row.is_online ? 'success' : 'danger'" size="small">
            {{ row.is_online ? '在线' : '离线' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="滤芯状态" width="140" align="center">
        <template #default="{ row }">
          <el-tooltip v-if="row.filter_alerts && row.filter_alerts.length > 0" :content="'需更换: ' + row.filter_alerts.join(', ')" placement="top">
            <el-tag type="danger" size="small">
              {{ row.filter_alerts.join('/') }}需更换
            </el-tag>
          </el-tooltip>
          <el-tag v-else :type="getFilterStatusType(row.filter_status)" size="small">
            {{ getFilterStatusText(row.filter_status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="actual_usage" label="用户已用(L)" width="110" align="right">
        <template #default="{ row }">
          <span class="actual-usage">{{ row.actual_usage ?? 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="surplus_flow" label="剩余流量(L)" width="110" align="right">
        <template #default="{ row }">
          <span>{{ row.surplus_flow ?? 0 }}</span>
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
      <el-table-column prop="user_name" label="用户" width="100" />
      <el-table-column label="渠道商" width="100">
        <template #default="{ row }">
          <span class="dealer-name-cell" v-if="row.dealer_name">{{ row.dealer_name }}</span>
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="address" label="安装地址" min-width="150" show-overflow-tooltip />
      <el-table-column prop="last_active_at" label="最后活动" width="150" />
      <el-table-column label="操作" width="260" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="showDetail(row)">
            <el-icon><View /></el-icon> 详情
          </el-button>
          <el-button type="warning" link size="small" @click="showFilterManage(row)">
            <el-icon><Filter /></el-icon> 滤芯
          </el-button>
          <el-button type="success" link size="small" @click="showControlPanel(row)">
            <el-icon><Operation /></el-icon> 控制
          </el-button>
          <el-button 
            v-if="row.user_name || row.user_id"
            type="danger" 
            link 
            size="small" 
            @click="unbindDevice(row)"
          >
            <el-icon><CircleClose /></el-icon> 解绑
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="listQuery.page"
        v-model:page-size="listQuery.limit"
        :total="total"
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
          <el-descriptions-item label="设备编号">{{ currentDevice.device_id || currentDevice.board_code }}</el-descriptions-item>
          <el-descriptions-item label="IMEI">{{ currentDevice.imei }}</el-descriptions-item>
          <el-descriptions-item label="品牌">
            <el-tag type="info" size="small">{{ currentDevice.brand || '-' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="型号">
            <span class="model-tag">{{ currentDevice.device_model || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="设备状态">
            <el-tag :type="currentDevice.is_online ? 'success' : 'danger'">
              {{ currentDevice.is_online ? '在线' : '离线' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="电源状态">
            <el-tag :type="currentDevice.is_power_on ? 'success' : 'info'">
              {{ currentDevice.is_power_on ? '已开机' : '已关机' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="原水TDS">
            <span class="tds-value">{{ currentDevice.raw_water_tds ?? '-' }} ppm</span>
          </el-descriptions-item>
          <el-descriptions-item label="净水TDS">
            <span class="tds-value tds-pure">{{ currentDevice.pure_water_tds ?? '-' }} ppm</span>
          </el-descriptions-item>
          <el-descriptions-item label="滤芯状态">
            <el-tag :type="getFilterStatusType(currentDevice.filter_status)">
              {{ getFilterStatusText(currentDevice.filter_status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="信号强度">
            <span>{{ currentDevice.signal_strength ?? '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="套餐类型">
            <el-tag :type="currentDevice.billing_mode === 'time' ? 'success' : 'primary'" size="small">
              {{ currentDevice.billing_mode === 'time' ? '包年套餐' : '流量套餐' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="剩余额度">
            <span v-if="currentDevice.billing_mode === 'time'">
              {{ currentDevice.remaining_days ?? '-' }} 天
            </span>
            <span v-else>
              {{ currentDevice.surplus_flow ?? 0 }} L
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="总流量">{{ currentDevice.cumulative_flow || currentDevice.total_flow || 0 }} L</el-descriptions-item>
          <el-descriptions-item label="剩余流量">{{ currentDevice.surplus_flow ?? 0 }} L</el-descriptions-item>
          <el-descriptions-item label="用户">{{ currentDevice.user_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentDevice.user_phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="安装地址" :span="2">{{ currentDevice.address || '-' }}</el-descriptions-item>
          <el-descriptions-item label="激活时间">{{ currentDevice.activated_at || '-' }}</el-descriptions-item>
          <el-descriptions-item label="最后活动">{{ currentDevice.last_active_at || currentDevice.last_sync_at || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 滤芯信息 -->
        <h4 style="margin-top: 20px;">滤芯信息</h4>
        <el-table :data="currentDevice.filters || []" border size="small">
          <el-table-column prop="name" label="滤芯名称" width="120" />
          <el-table-column prop="life_percent" label="剩余寿命" width="120" align="center">
            <template #default="{ row }">
              <el-progress 
                :percentage="row.life_percent || 0" 
                :status="getProgressStatus(row.life_percent)"
                :stroke-width="12"
              />
            </template>
          </el-table-column>
          <el-table-column prop="used" label="已用流量(L)" width="120" align="center">
            <template #default="{ row }">
              {{ Math.round(row.used) }}L
            </template>
          </el-table-column>
          <el-table-column prop="total" label="总寿命(L)" width="100" align="center">
            <template #default="{ row }">
              {{ row.total }}L
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button 
                type="warning" 
                size="small" 
                @click="resetFilter(row)"
                :loading="resetLoading"
              >
                重置
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>

    <!-- 滤芯管理弹窗 -->
    <el-dialog
      v-model="filterDialogVisible"
      title="滤芯管理"
      width="600px"
    >
      <div v-if="currentDevice" class="filter-manage">
        <el-alert 
          title="滤芯重置说明" 
          type="info" 
          :closable="false"
          style="margin-bottom: 20px;"
        >
          <template #default>
            重置滤芯会将对应滤芯的使用量清零（升），请在更换滤芯后执行此操作。
          </template>
        </el-alert>

        <el-table :data="currentDevice.filters || []" border>
          <el-table-column prop="filter_index" label="编号" width="80" align="center" />
          <el-table-column prop="name" label="滤芯名称" />
          <el-table-column prop="life_percent" label="剩余寿命" width="150" align="center">
            <template #default="{ row }">
              <el-progress 
                :percentage="row.life_percent || 0" 
                :status="getProgressStatus(row.life_percent)"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                size="small" 
                @click="resetSingleFilter(row)"
                :loading="resetLoading"
              >
                重置
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div style="margin-top: 20px; text-align: right;">
          <el-button @click="filterDialogVisible = false">关闭</el-button>
          <el-button 
            type="danger" 
            @click="resetAllFilters"
            :loading="resetLoading"
          >
            重置全部滤芯
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 设备控制面板 -->
    <DeviceControlPanel
      v-model="controlDialogVisible"
      :device="currentDevice"
      @close="controlDialogVisible = false"
      @refresh="fetchList"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Monitor, Connection, Filter, WarningFilled, Search, 
  Refresh, RefreshRight, View, Operation, CircleClose 
} from '@element-plus/icons-vue'
import request from '@/utils/request'
import DeviceControlPanel from './components/DeviceControlPanel.vue'

const router = useRouter()

// 列表相关
const loading = ref(false)
const list = ref([])
const total = ref(0)
const listQuery = reactive({
  page: 1,
  limit: 20,
  keyword: '',
  status: '',
  filter_alert: ''
})

// 统计数据
const statistics = ref({
  total: 0,
  online: 0,
  offline: 0,
  filter_alert: 0
})

// 当前设备
const currentDevice = ref(null)

// 抽屉和弹窗控制
const detailDrawerVisible = ref(false)
const filterDialogVisible = ref(false)
const controlDialogVisible = ref(false)

// 加载状态
const resetLoading = ref(false)

// 获取设备列表
const fetchList = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/api/admin/water-purifier',
      method: 'get',
      params: listQuery
    })
    if (res.code === 0) {
      list.value = res.data || []
      total.value = res.meta?.total || 0
      statistics.value = res.statistics || {}
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
  listQuery.filter_alert = ''
  handleFilter()
}

// 分页
const handleSizeChange = (val) => {
  listQuery.limit = val
  fetchList()
}

const handleCurrentChange = (val) => {
  listQuery.page = val
  fetchList()
}

// 跳转滤芯预警页
const goToFilterAlerts = () => {
  router.push('/water-purifier/filter-alerts')
}

// 显示设备详情
const showDetail = async (row) => {
  try {
    const res = await request({
      url: `/api/admin/water-purifier/${row.id}`,
      method: 'get'
    })
    if (res.code === 0) {
      // 后端返回 { device, filters, iot_sync, iot_data }
      const deviceData = res.data.device || res.data
      const filtersData = res.data.filters || []
      // 合并设备信息和滤芯信息，处理字段映射
      // 后端字段：percent(剩余百分比), remaining(剩余流量L), total(总流量L), used(已使用流量L)
      currentDevice.value = {
        ...deviceData,
        device_id: deviceData.board_code,
        filters: filtersData.map(f => ({
          ...f,
          filter_index: f.id,
          life_percent: f.percent || 0,  // 剩余百分比
          used: f.used || 0,              // 已使用流量（升）
          total: f.total || 0             // 总流量（升）
        }))
      }
      detailDrawerVisible.value = true
    }
  } catch (error) {
    console.error('获取设备详情失败:', error)
    ElMessage.error('获取设备详情失败')
  }
}

// 显示滤芯管理
const showFilterManage = async (row) => {
  try {
    const res = await request({
      url: `/api/admin/water-purifier/${row.id}`,
      method: 'get'
    })
    if (res.code === 0) {
      // 后端返回 { device, filters }
      const deviceData = res.data.device || res.data
      const filtersData = res.data.filters || []
      currentDevice.value = {
        ...deviceData,
        id: deviceData.id || row.id,
        filters: filtersData.map(f => ({
          ...f,
          filter_index: f.id,
          life_percent: f.percent || 0,  // 剩余百分比
          used: f.used || 0,              // 已使用流量（升）
          total: f.total || 0             // 总流量（升）
        }))
      }
      filterDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取设备详情失败:', error)
    ElMessage.error('获取设备详情失败')
  }
}

// 显示控制面板
const showControlPanel = async (row) => {
  try {
    const res = await request({
      url: `/api/admin/water-purifier/${row.id}`,
      method: 'get'
    })
    if (res.code === 0) {
      // 后端返回 { device, filters }
      const deviceData = res.data.device || res.data
      currentDevice.value = {
        ...deviceData,
        id: deviceData.id || row.id,
        filters: res.data.filters || []
      }
      controlDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取设备详情失败:', error)
    ElMessage.error('获取设备详情失败')
  }
}

// 重置单个滤芯
const resetSingleFilter = async (filter) => {
  try {
    await ElMessageBox.confirm(
      `确定要重置滤芯"${filter.name}"吗？重置后使用量将清零（升）。`,
      '确认重置',
      { type: 'warning' }
    )
    
    resetLoading.value = true
    const res = await request({
      url: `/api/admin/water-purifier/${currentDevice.value.id}/reset-filter`,
      method: 'post',
      data: { filter_index: filter.filter_index }
    })
    
    if (res.code === 0) {
      ElMessage.success('滤芯重置成功')
      // 刷新设备信息
      showFilterManage(currentDevice.value)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重置滤芯失败:', error)
      ElMessage.error(error.message || '重置滤芯失败')
    }
  } finally {
    resetLoading.value = false
  }
}

// 重置全部滤芯
const resetAllFilters = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重置所有滤芯吗？此操作将重置设备上所有滤芯的使用量（升）。',
      '确认重置全部',
      { type: 'warning' }
    )
    
    resetLoading.value = true
    // 构建所有滤芯的重置数据
    const allFilters = (currentDevice.value.filters || []).map(f => ({
      id: f.filter_index || f.id,
      max_value: f.total || 365  // 总流量（升）
    }))
    // 如果没有滤芯数据，使用默认5个滤芯
    const filtersToReset = allFilters.length > 0 ? allFilters : [
      { id: 1, max_value: 365 },
      { id: 2, max_value: 365 },
      { id: 3, max_value: 730 },
      { id: 4, max_value: 365 },
      { id: 5, max_value: 365 }
    ]
    
    const res = await request({
      url: `/api/admin/water-purifier/${currentDevice.value.id}/reset-filter`,
      method: 'post',
      data: { 
        filters: filtersToReset,
        sync_to_iot: true,
        reason: '管理员重置全部滤芯'
      }
    })
    
    if (res.code === 0) {
      ElMessage.success('所有滤芯重置成功')
      filterDialogVisible.value = false
      fetchList()
    } else {
      ElMessage.error(res.message || '滤芯重置失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重置滤芯失败:', error)
      ElMessage.error(error.message || '重置滤芯失败')
    }
  } finally {
    resetLoading.value = false
  }
}

// 获取滤芯状态类型
const getFilterStatusType = (status) => {
  if (!status) return 'info'
  if (status === 'alert' || status === 'warning') return 'danger'
  if (status === 'normal') return 'success'
  return 'info'
}

// 获取滤芯状态文本
const getFilterStatusText = (status) => {
  if (!status) return '未知'
  if (status === 'alert' || status === 'warning') return '需更换'
  if (status === 'normal') return '正常'
  return status
}

// 获取进度条状态
const getProgressStatus = (percent) => {
  if (percent <= 20) return 'exception'
  if (percent <= 50) return 'warning'
  return 'success'
}

// 解绑设备
const unbindDevice = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要解除设备 ${row.device_id || row.board_code} 与用户 ${row.user_name || ''} 的绑定关系吗？\n\n解绑后该设备将可以被其他用户绑定使用。`,
      '确认解绑',
      { 
        type: 'warning',
        confirmButtonText: '确认解绑',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    loading.value = true
    const res = await request({
      url: `/api/admin/water-purifier/${row.id}/unbind`,
      method: 'post'
    })
    
    if (res.code === 0) {
      ElMessage.success('设备解绑成功')
      fetchList() // 刷新列表
    } else {
      ElMessage.error(res.message || '解绑失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('解绑设备失败:', error)
      ElMessage.error(error.response?.data?.message || '解绑失败')
    }
  } finally {
    loading.value = false
  }
}

const route = useRoute()

onMounted(() => {
  if (route.query.keyword) {
    listQuery.keyword = route.query.keyword
  }
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

.filter-manage, .device-control {
  padding: 10px;
}

/* 品牌型号显示 */
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
</style>
