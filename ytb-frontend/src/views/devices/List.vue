<template>
  <div class="device-list-page">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ statistics.total_devices || 0 }}</div>
          <div class="stat-label">设备总数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-activated">
          <div class="stat-value">{{ statistics.active_devices || 0 }}</div>
          <div class="stat-label">已激活</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-online">
          <div class="stat-value">{{ statistics.online_devices || 0 }}</div>
          <div class="stat-label">在线设备</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-offline">
          <div class="stat-value">{{ statistics.offline_devices || 0 }}</div>
          <div class="stat-label">离线设备</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索筛选 -->
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>设备列表</span>
          <div class="header-actions">
            <el-button @click="loadDevices">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="设备编号/IMEI/客户姓名"
            clearable
            @keyup.enter="loadDevices"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="待激活" value="pending" />
            <el-option label="已分配" value="assigned" />
            <el-option label="已安装" value="installed" />
            <el-option label="已激活" value="activated" />
            <el-option label="已禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item label="网络状态">
          <el-select v-model="searchForm.network_status" placeholder="全部" clearable>
            <el-option label="在线" value="1" />
            <el-option label="离线" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="计费模式">
          <el-select v-model="searchForm.billing_mode" placeholder="全部" clearable>
            <el-option label="流量计费" value="flow" />
            <el-option label="包年计费" value="time" />
            <el-option label="零售" value="retail" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadDevices">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 设备列表 -->
      <el-table :data="devices" v-loading="loading" stripe border>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="device_number" label="设备编号" width="120" />
        <el-table-column prop="imei" label="IMEI" width="150" />
        <el-table-column prop="board_code" label="主板编码" width="120" />
        <el-table-column prop="client_name" label="客户姓名" width="100">
          <template #default="{ row }">
            {{ row.client_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="client_phone" label="客户电话" width="120">
          <template #default="{ row }">
            {{ row.client_phone || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="brand" label="品牌" width="80">
          <template #default="{ row }">
            {{ row.brand || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="device_model" label="型号" width="80">
          <template #default="{ row }">
            {{ row.device_model || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="billing_mode_text" label="计费模式" width="100" />
        <el-table-column prop="status_text" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ row.status_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="network_status_text" label="网络" width="70">
          <template #default="{ row }">
            <el-tag :type="row.network_status === '1' ? 'success' : 'info'" size="small">
              {{ row.network_status_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="surplus_flow" label="剩余流量(L)" width="110">
          <template #default="{ row }">
            <span :class="{ 'low-water': row.is_low_water }">
              {{ row.surplus_flow || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="cumulative_filtration_flow" label="累计流量(L)" width="120">
          <template #default="{ row }">
            {{ row.cumulative_filtration_flow || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="tds_in" label="进水TDS" width="90">
          <template #default="{ row }">
            {{ row.tds_in || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="tds_out" label="出水TDS" width="90">
          <template #default="{ row }">
            {{ row.tds_out || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="activate_date" label="激活日期" width="100">
          <template #default="{ row }">
            {{ row.activate_date ? row.activate_date.substring(0, 10) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewDevice(row)">
              查看
            </el-button>
            <el-button size="small" type="danger" link @click="deleteDevice(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.current_page"
          v-model:page-size="pagination.per_page"
          :total="pagination.total"
          :page-sizes="[15, 30, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadDevices"
          @current-change="loadDevices"
        />
      </div>
    </el-card>

    <!-- 设备详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="设备详情" width="700px">
      <el-descriptions :column="2" border v-if="currentDevice">
        <el-descriptions-item label="设备编号">{{ currentDevice.device_number }}</el-descriptions-item>
        <el-descriptions-item label="主板编码">{{ currentDevice.board_code }}</el-descriptions-item>
        <el-descriptions-item label="IMEI">{{ currentDevice.imei }}</el-descriptions-item>
        <el-descriptions-item label="ICCID">{{ currentDevice.iccid || '-' }}</el-descriptions-item>
        <el-descriptions-item label="品牌">{{ currentDevice.brand || '-' }}</el-descriptions-item>
        <el-descriptions-item label="型号">{{ currentDevice.device_model || '-' }}</el-descriptions-item>
        <el-descriptions-item label="设备类型">{{ currentDevice.device_type }}</el-descriptions-item>
        <el-descriptions-item label="计费模式">{{ currentDevice.billing_mode_text }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ currentDevice.status_text }}</el-descriptions-item>
        <el-descriptions-item label="网络状态">{{ currentDevice.network_status_text }}</el-descriptions-item>
        <el-descriptions-item label="客户姓名">{{ currentDevice.client_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="客户电话">{{ currentDevice.client_phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="安装地址" :span="2">{{ currentDevice.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="剩余流量">{{ currentDevice.surplus_flow || 0 }} L</el-descriptions-item>
        <el-descriptions-item label="累计净化">{{ currentDevice.cumulative_filtration_flow || 0 }} L</el-descriptions-item>
        <el-descriptions-item label="进水TDS">{{ currentDevice.tds_in || '-' }}</el-descriptions-item>
        <el-descriptions-item label="出水TDS">{{ currentDevice.tds_out || '-' }}</el-descriptions-item>
        <el-descriptions-item label="信号强度">{{ currentDevice.signal_strength || '-' }}</el-descriptions-item>
        <el-descriptions-item label="激活日期">{{ currentDevice.activate_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="服务到期">{{ currentDevice.service_end_time || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentDevice.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import request from '@/utils/request'

// API基础路径
const API_BASE = '/api/admin/v1'

// 状态数据
const loading = ref(false)
const devices = ref([])
const statistics = ref({
  total_devices: 0,
  active_devices: 0,
  online_devices: 0,
  offline_devices: 0,
})

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: '',
  network_status: '',
  billing_mode: '',
})

// 分页
const pagination = reactive({
  current_page: 1,
  per_page: 15,
  total: 0,
})

// 对话框
const detailDialogVisible = ref(false)
const currentDevice = ref(null)

// 加载设备列表
const loadDevices = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.current_page,
      per_page: pagination.per_page,
      ...searchForm,
    }
    // 移除空值参数
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key]
      }
    })

    const data = await request.get(API_BASE + '/devices', { params })
    if (data.code === 0) {
      devices.value = data.data.data || []
      pagination.total = data.data.total || 0
      if (data.data.statistics) {
        statistics.value = data.data.statistics
      }
    }
  } catch (error) {
    ElMessage.error('加载设备列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 重置搜索
const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.network_status = ''
  searchForm.billing_mode = ''
  pagination.current_page = 1
  loadDevices()
}

// 查看设备
const viewDevice = (device) => {
  currentDevice.value = device
  detailDialogVisible.value = true
}

// 删除设备
const deleteDevice = async (device) => {
  await ElMessageBox.confirm(
    `确定要删除设备 ${device.device_number} 吗？此操作不可恢复。`,
    '确认删除',
    { type: 'warning' }
  )

  try {
    const data = await request.delete(API_BASE + '/devices/' + device.id)
    if (data.code === 0) {
      ElMessage.success('删除成功')
      loadDevices()
    } else {
      ElMessage.error(data.message || '删除失败')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '删除失败')
  }
}

// 状态相关函数
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

// 初始化
onMounted(() => {
  loadDevices()
})
</script>

<style scoped>
.device-list-page {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.stat-activated .stat-value { color: #67c23a; }
.stat-online .stat-value { color: #409eff; }
.stat-offline .stat-value { color: #909399; }

.main-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 16px;
}

.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.low-water {
  color: #f56c6c;
  font-weight: bold;
}
</style>
