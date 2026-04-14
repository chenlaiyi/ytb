<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <el-icon><Warning /></el-icon>
          滤芯预警
        </h2>
        <p class="page-subtitle">显示所有滤芯寿命低于阈值的设备，及时更换滤芯保证水质</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
        <el-button type="success" @click="exportData">
          <el-icon><Download /></el-icon>
          导出Excel
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-container">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card danger">
            <div class="stat-icon">
              <el-icon><WarningFilled /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.critical || 0 }}</div>
              <div class="stat-label">紧急更换（≤10%）</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card warning">
            <div class="stat-icon">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.warning || 0 }}</div>
              <div class="stat-label">预警中（11%-20%）</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card info">
            <div class="stat-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.pending || 0 }}</div>
              <div class="stat-label">待处理</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card success">
            <div class="stat-icon">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.processed || 0 }}</div>
              <div class="stat-label">已处理</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-container">
      <el-input
        v-model="listQuery.keyword"
        placeholder="搜索设备编号、用户名..."
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
        v-model="listQuery.level"
        placeholder="预警级别"
        clearable
        style="width: 140px"
        class="filter-item"
      >
        <el-option label="紧急更换" value="critical">
          <span style="color: #f56c6c;">● 紧急更换</span>
        </el-option>
        <el-option label="预警中" value="warning">
          <span style="color: #e6a23c;">● 预警中</span>
        </el-option>
      </el-select>

      <el-select
        v-model="listQuery.status"
        placeholder="处理状态"
        clearable
        style="width: 140px"
        class="filter-item"
      >
        <el-option label="待处理" value="pending" />
        <el-option label="已处理" value="processed" />
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

    <!-- 预警列表 -->
    <el-table
      v-loading="loading"
      :data="list"
      border
      stripe
      style="width: 100%"
      row-class-name="alert-row"
    >
      <el-table-column prop="device_id" label="设备编号" width="160" />
      <el-table-column prop="user_name" label="用户" width="120" />
      <el-table-column prop="user_phone" label="手机号" width="130" />
      <el-table-column label="套餐类型" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.billing_mode === 'time' ? 'success' : 'primary'" size="small">
            {{ row.billing_mode === 'time' ? '包年' : '流量' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="filter_name" label="滤芯名称" width="120" />
      <el-table-column label="剩余寿命" width="200" align="center">
        <template #default="{ row }">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <el-progress
                :percentage="row.life_percent || 0"
                :status="getProgressStatus(row.life_percent)"
                :stroke-width="16"
                :format="() => ''"
                style="flex: 1;"
              />
              <span style="font-size: 14px; color: #606266; min-width: 45px; text-align: right;">
                {{ row.life_percent || 0 }}%
              </span>
            </div>
            <div style="font-size: 12px; color: #909399;">
              {{ row.remaining }}{{ row.billing_mode === 'time' ? '天' : 'L' }} / {{ row.total }}{{ row.billing_mode === 'time' ? '天' : 'L' }}
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="预警级别" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.life_percent <= 10 ? 'danger' : 'warning'" size="default">
            {{ row.life_percent <= 10 ? '紧急' : '预警' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="address" label="安装地址" min-width="180" show-overflow-tooltip />
      <el-table-column prop="alert_time" label="预警时间" width="160" />
      <el-table-column label="处理状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.is_processed ? 'success' : 'info'" size="small">
            {{ row.is_processed ? '已处理' : '待处理' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="showDetail(row)">
            <el-icon><View /></el-icon> 详情
          </el-button>
          <el-button 
            v-if="!row.is_processed"
            type="warning" 
            link 
            size="small" 
            @click="resetFilter(row)"
          >
            <el-icon><Refresh /></el-icon> 重置滤芯
          </el-button>
          <el-button 
            v-if="!row.is_processed"
            type="success" 
            link 
            size="small" 
            @click="markAsProcessed(row)"
          >
            <el-icon><Check /></el-icon> 标记处理
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

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="预警详情"
      width="600px"
    >
      <div v-if="currentAlert" class="alert-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备编号">{{ currentAlert.device_id }}</el-descriptions-item>
          <el-descriptions-item label="滤芯名称">{{ currentAlert.filter_name }}</el-descriptions-item>
          <el-descriptions-item label="剩余寿命">
            <el-progress 
              :percentage="currentAlert.life_percent || 0" 
              :status="getProgressStatus(currentAlert.life_percent)"
              style="width: 150px;"
            />
          </el-descriptions-item>
          <el-descriptions-item label="预警级别">
            <el-tag :type="currentAlert.life_percent <= 10 ? 'danger' : 'warning'">
              {{ currentAlert.life_percent <= 10 ? '紧急更换' : '预警中' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="用户">{{ currentAlert.user_name }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentAlert.user_phone }}</el-descriptions-item>
          <el-descriptions-item label="安装地址" :span="2">{{ currentAlert.address }}</el-descriptions-item>
          <el-descriptions-item label="预警时间">{{ currentAlert.alert_time }}</el-descriptions-item>
          <el-descriptions-item label="处理状态">
            <el-tag :type="currentAlert.is_processed ? 'success' : 'info'">
              {{ currentAlert.is_processed ? '已处理' : '待处理' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="!currentAlert.is_processed" style="margin-top: 20px; text-align: right;">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button type="warning" @click="resetFilter(currentAlert)" :loading="resetLoading">
            重置滤芯
          </el-button>
          <el-button type="success" @click="markAsProcessed(currentAlert)" :loading="processLoading">
            标记为已处理
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Warning, WarningFilled, Search, Refresh, RefreshRight, 
  Download, View, Check, Clock, CircleCheck 
} from '@element-plus/icons-vue'
import request from '@/utils/request'

// 列表相关
const loading = ref(false)
const list = ref([])
const total = ref(0)
const listQuery = reactive({
  page: 1,
  limit: 20,
  keyword: '',
  level: '',
  status: ''
})

// 统计数据
const statistics = ref({
  critical: 0,
  warning: 0,
  pending: 0,
  processed: 0
})

// 当前预警
const currentAlert = ref(null)
const detailDialogVisible = ref(false)
const resetLoading = ref(false)
const processLoading = ref(false)

// 获取预警列表
const fetchList = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/api/admin/water-purifier/filter-alerts',
      method: 'get',
      params: listQuery
    })
    if (res.success || res.code === 0) {
      list.value = res.data?.list || res.data || []
      total.value = res.data?.total || 0
      statistics.value = res.data?.statistics || {}
    }
  } catch (error) {
    console.error('获取预警列表失败:', error)
    ElMessage.error('获取预警列表失败')
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = () => {
  fetchList()
}

// 导出数据
const exportData = async () => {
  try {
    ElMessage.info('正在导出...')
    const res = await request({
      url: '/api/admin/water-purifier/filter-alerts/export',
      method: 'get',
      params: listQuery,
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([res]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `滤芯预警_${new Date().toISOString().split('T')[0]}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 搜索
const handleFilter = () => {
  listQuery.page = 1
  fetchList()
}

// 重置搜索
const resetFilterQuery = () => {
  listQuery.keyword = ''
  listQuery.level = ''
  listQuery.status = ''
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

// 显示详情
const showDetail = (row) => {
  currentAlert.value = row
  detailDialogVisible.value = true
}

// 重置滤芯
const resetFilter = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要重置设备 ${row.device_id} 的滤芯"${row.filter_name}"吗？`,
      '确认重置',
      { type: 'warning' }
    )

    resetLoading.value = true
    const res = await request({
      url: `/api/admin/water-purifier/${row.device_db_id}/reset-filter`,
      method: 'post',
      data: {
        filters: [
          { id: row.filter_index, max_value: row.total }
        ],
        sync_to_iot: true,
        reason: '后台管理员重置滤芯'
      }
    })

    if (res.success || res.code === 0) {
      ElMessage.success('滤芯重置成功')
      detailDialogVisible.value = false
      fetchList()
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

// 标记为已处理
const markAsProcessed = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要将此预警标记为已处理吗？',
      '确认操作',
      { type: 'info' }
    )
    
    processLoading.value = true
    const res = await request({
      url: `/api/admin/water-purifier/filter-alerts/${row.id}/process`,
      method: 'post'
    })
    
    if (res.success) {
      ElMessage.success('已标记为处理')
      detailDialogVisible.value = false
      fetchList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('操作失败:', error)
      ElMessage.error(error.message || '操作失败')
    }
  } finally {
    processLoading.value = false
  }
}

// 获取进度条状态
const getProgressStatus = (percent) => {
  if (percent <= 10) return 'exception'
  if (percent <= 20) return 'warning'
  return 'success'
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

.header-right {
  display: flex;
  gap: 12px;
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

.stat-card.danger .stat-icon { background: #fef0f0; color: #f56c6c; }
.stat-card.warning .stat-icon { background: #fdf6ec; color: #e6a23c; }
.stat-card.info .stat-icon { background: #f4f4f5; color: #909399; }
.stat-card.success .stat-icon { background: #f0f9eb; color: #67c23a; }

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

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.life-progress {
  width: 100%;
}

.alert-detail {
  padding: 10px;
}

:deep(.alert-row) {
  transition: background-color 0.3s;
}

:deep(.alert-row:hover) {
  background-color: #fef0f0;
}
</style>
