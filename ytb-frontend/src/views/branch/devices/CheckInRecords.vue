<template>
  <div class="checkin-records-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>取水记录</h1>
      <p>查看所有取水点的用户取水记录</p>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" :inline="true" class="search-form">
        <el-form-item label="用户手机号">
          <el-input
            v-model="searchForm.phone"
            placeholder="请输入手机号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="用户姓名">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入用户姓名"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="取水点">
          <el-select
            v-model="searchForm.water_point_id"
            placeholder="请选择取水点"
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="point in waterPoints"
              :key="point.id"
              :label="point.name"
              :value="point.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="取水方式">
          <el-select
            v-model="searchForm.check_in_method"
            placeholder="请选择取水方式"
            clearable
            style="width: 150px"
          >
            <el-option label="扫码取水" value="qr_code" />
            <el-option label="手动取水" value="manual" />
            <el-option label="自动取水" value="auto" />
          </el-select>
        </el-form-item>
        <el-form-item label="取水时间">
          <el-date-picker
            v-model="searchForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 250px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchRecords" :loading="loading">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
          <el-button type="success" @click="exportRecords" :loading="exportLoading">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计信息 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-number">{{ stats.total || 0 }}</div>
            <div class="stat-label">总取水次数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-number">{{ stats.today || 0 }}</div>
            <div class="stat-label">今日取水次数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-number">{{ stats.total_users || 0 }}</div>
            <div class="stat-label">累计取水用户</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-number">{{ stats.today_users || 0 }}</div>
            <div class="stat-label">今日取水用户</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 取水记录表格 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="records"
        stripe
        style="width: 100%"
        height="600"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="user_name" label="用户姓名" width="120" />
        <el-table-column prop="user_phone" label="手机号" width="130" />
        <el-table-column prop="water_point_name" label="取水点" width="150" />
        <el-table-column label="剩余天数" width="100">
          <template #default="{ row }">
            <el-tag>{{ row.remaining_days || 0 }}天</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="取水时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="位置" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.location_address || row.water_point_address || '未知位置' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="text" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.per_page"
          :page-sizes="[15, 30, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="取水详情"
      width="600px"
    >
      <div v-if="currentRecord" class="detail-content">
        <!-- 用户信息头部 -->
        <div class="user-detail-header">
          <el-avatar 
            :size="60" 
            :src="currentRecord.user_avatar" 
            :icon="UserFilled"
            style="background-color: #f0f0f0;"
          />
          <div class="user-detail-info">
            <h3>{{ currentRecord.user_nickname || currentRecord.user_name || '未知用户' }}</h3>
            <p>{{ currentRecord.user_phone }}</p>
            <p v-if="currentRecord.user_nickname && currentRecord.user_name && currentRecord.user_nickname !== currentRecord.user_name">
              真实姓名：{{ currentRecord.user_name }}
            </p>
            <p v-if="currentRecord.referrer_info" class="referrer-tag">
              推荐人：{{ currentRecord.referrer_info.display_name }}
            </p>
          </div>
        </div>
        
        <el-divider />
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户姓名">{{ currentRecord.user_name || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentRecord.user_phone || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="取水点">{{ currentRecord.water_point_name || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="取水时间">{{ formatDateTime(currentRecord.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="剩余天数">
            <el-tag>{{ currentRecord.remaining_days || 0 }}天</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="取水位置" v-if="currentRecord.location_address">
            {{ currentRecord.location_address }}
          </el-descriptions-item>
          <el-descriptions-item label="IP地址" v-if="currentRecord.ip_address">
            {{ currentRecord.ip_address }}
          </el-descriptions-item>
          <el-descriptions-item label="设备信息" v-if="currentRecord.device_info">
            {{ currentRecord.device_info }}
          </el-descriptions-item>
          <el-descriptions-item label="推荐人" v-if="currentRecord.referrer_info">
            <div class="referrer-detail">
              <el-avatar 
                :size="24" 
                :src="currentRecord.referrer_info.avatar" 
                :icon="UserFilled"
                style="background-color: #f0f0f0; margin-right: 8px;"
              />
              <span>{{ currentRecord.referrer_info.display_name }}</span>
              <span v-if="currentRecord.referrer_info.phone" style="color: #909399; margin-left: 8px;">
                ({{ currentRecord.referrer_info.phone }})
              </span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="备注" v-if="currentRecord.remark">
            {{ currentRecord.remark }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Download, UserFilled } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { formatDateTime } from '@/utils/formatters'

const route = useRoute()
const branchId = route.params.branchId

// 响应式数据
const loading = ref(false)
const exportLoading = ref(false)
const records = ref([])
const waterPoints = ref([])
const stats = ref({})
const detailDialogVisible = ref(false)
const currentRecord = ref(null)

// 搜索表单
const searchForm = reactive({
  phone: '',
  name: '',
  water_point_id: '',
  check_in_method: '',
  date_range: []
})

// 分页信息
const pagination = reactive({
  page: 1,
  per_page: 15,
  total: 0
})

// 页面加载
onMounted(() => {
  fetchWaterPoints()
  fetchRecords()
  fetchStats()
})

// 获取取水点列表
const fetchWaterPoints = async () => {
  try {
    const response = await request.get(`/api/admin/v1/branch-organizations/${branchId}/water-points`)
    if (response.code === 0) {
      waterPoints.value = response.data.data || []
    }
  } catch (error) {
    console.error('获取取水点列表失败:', error)
  }
}

// 获取取水记录
const fetchRecords = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      per_page: pagination.per_page,
      ...searchForm
    }
    
    // 处理日期范围
    if (searchForm.date_range && searchForm.date_range.length === 2) {
      params.start_date = searchForm.date_range[0]
      params.end_date = searchForm.date_range[1]
    }
    delete params.date_range
    
    const response = await request.get(`/api/admin/v1/branch-organizations/${branchId}/check-in-records`, { params })
    
    if (response.code === 0) {
      records.value = response.data.data || []
      pagination.total = response.data.total || 0
    } else {
      ElMessage.error(response.message || '获取取水记录失败')
    }
  } catch (error) {
    console.error('获取取水记录失败:', error)
    ElMessage.error('获取取水记录失败')
  } finally {
    loading.value = false
  }
}

// 获取统计信息
const fetchStats = async () => {
  try {
    const response = await request.get(`/api/admin/v1/branch-organizations/${branchId}/check-in-stats`)
    if (response.code === 0) {
      stats.value = response.data || {}
    }
  } catch (error) {
    console.error('获取统计信息失败:', error)
  }
}

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    phone: '',
    name: '',
    water_point_id: '',
    check_in_method: '',
    date_range: []
  })
  pagination.page = 1
  fetchRecords()
}

// 导出记录
const exportRecords = async () => {
  try {
    await ElMessageBox.confirm('确定要导出取水记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    
    exportLoading.value = true
    
    const params = {
      ...searchForm,
      export: 1
    }
    
    // 处理日期范围
    if (searchForm.date_range && searchForm.date_range.length === 2) {
      params.start_date = searchForm.date_range[0]
      params.end_date = searchForm.date_range[1]
    }
    delete params.date_range
    
    const response = await request.get(`/api/admin/v1/branch-organizations/${branchId}/check-in-records/export`, {
      params,
      responseType: 'blob'
    })
    
    // 创建下载链接
    const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `取水记录_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('导出失败:', error)
      ElMessage.error('导出失败')
    }
  } finally {
    exportLoading.value = false
  }
}

// 查看详情
const viewDetail = (record) => {
  currentRecord.value = record
  detailDialogVisible.value = true
}

// 获取签到方式文本
const getCheckInMethodText = (method) => {
  const methods = {
    qr_code: '扫码取水',
    manual: '手动取水',
    auto: '自动取水'
  }
  return methods[method] || '未知方式'
}

// 获取签到方式标签类型
const getCheckInMethodType = (method) => {
  const types = {
    qr_code: 'primary',
    manual: 'warning',
    auto: 'success'
  }
  return types[method] || 'info'
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.per_page = size
  pagination.page = 1
  fetchRecords()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchRecords()
}
</script>

<style scoped>
.checkin-records-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0 0 5px 0;
  font-size: 24px;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-item {
  padding: 10px;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.table-card {
  margin-bottom: 20px;
}

.water-point-info {
  line-height: 1.4;
}

.point-name {
  font-weight: bold;
  color: #303133;
}

.point-address {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: center;
}

.detail-content {
  margin-top: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  flex-shrink: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.user-name {
  font-weight: bold;
  color: #303133;
  font-size: 14px;
}

.user-phone {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.user-detail-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.user-detail-info h3 {
  margin: 0 0 5px 0;
  font-size: 20px;
  color: #303133;
}

.user-detail-info p {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.referrer-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.referrer-avatar {
  flex-shrink: 0;
}

.referrer-details {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.referrer-name {
  font-weight: 500;
  color: #303133;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.referrer-phone {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-referrer {
  text-align: center;
}

.referrer-tag {
  color: #409eff !important;
  font-size: 13px !important;
}

.referrer-detail {
  display: flex;
  align-items: center;
}
</style> 