<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><Document /></el-icon>
        操作日志
      </h2>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-container">
      <el-input
        v-model="listQuery.keyword"
        placeholder="搜索设备编号、操作人..."
        style="width: 280px;"
        clearable
        @keyup.enter="handleFilter"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <el-select
        v-model="listQuery.action"
        placeholder="操作类型"
        clearable
        style="width: 160px"
      >
        <el-option label="滤芯重置" value="reset_filter" />
        <el-option label="设备初始化" value="initialize" />
        <el-option label="设备控制" value="control" />
        <el-option label="套餐充值" value="recharge" />
        <el-option label="参数设置" value="set_params" />
      </el-select>
      
      <el-date-picker
        v-model="listQuery.date_range"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        style="width: 260px;"
      />
      
      <el-button type="primary" @click="handleFilter">
        <el-icon><Search /></el-icon>
        搜索
      </el-button>
      <el-button @click="resetFilter">重置</el-button>
    </div>

    <!-- 日志列表 -->
    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="device_id" label="设备编号" width="160" />
      <el-table-column label="操作类型" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="getActionType(row.action)" size="small">
            {{ getActionLabel(row.action) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="操作描述" min-width="250" show-overflow-tooltip />
      <el-table-column label="操作结果" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.success ? 'success' : 'danger'" size="small">
            {{ row.success ? '成功' : '失败' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="operator_name" label="操作人" width="120" />
      <el-table-column prop="ip_address" label="IP地址" width="140" />
      <el-table-column prop="created_at" label="操作时间" width="160" />
      <el-table-column label="详情" width="80" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="showDetail(row)">
            查看
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
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="日志详情" width="600px">
      <div v-if="currentLog">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备编号">{{ currentLog.device_id }}</el-descriptions-item>
          <el-descriptions-item label="操作类型">
            <el-tag :type="getActionType(currentLog.action)">
              {{ getActionLabel(currentLog.action) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作描述" :span="2">{{ currentLog.description }}</el-descriptions-item>
          <el-descriptions-item label="操作结果">
            <el-tag :type="currentLog.success ? 'success' : 'danger'">
              {{ currentLog.success ? '成功' : '失败' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作人">{{ currentLog.operator_name }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ currentLog.ip_address }}</el-descriptions-item>
          <el-descriptions-item label="操作时间">{{ currentLog.created_at }}</el-descriptions-item>
        </el-descriptions>
        
        <div v-if="currentLog.request_data" style="margin-top: 20px;">
          <h4>请求数据</h4>
          <pre class="code-block">{{ JSON.stringify(JSON.parse(currentLog.request_data || '{}'), null, 2) }}</pre>
        </div>
        
        <div v-if="currentLog.response_data" style="margin-top: 20px;">
          <h4>响应数据</h4>
          <pre class="code-block">{{ JSON.stringify(JSON.parse(currentLog.response_data || '{}'), null, 2) }}</pre>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Search } from '@element-plus/icons-vue'
import request from '@/utils/request'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const listQuery = reactive({
  page: 1,
  limit: 20,
  keyword: '',
  action: '',
  date_range: []
})

const currentLog = ref(null)
const detailDialogVisible = ref(false)

const actionMap = {
  reset_filter: { label: '滤芯重置', type: 'warning' },
  initialize: { label: '设备初始化', type: 'danger' },
  control: { label: '设备控制', type: 'primary' },
  recharge: { label: '套餐充值', type: 'success' },
  set_params: { label: '参数设置', type: 'info' }
}

const getActionLabel = (action) => actionMap[action]?.label || action
const getActionType = (action) => actionMap[action]?.type || 'info'

const fetchList = async () => {
  loading.value = true
  try {
    const params = { ...listQuery }
    if (params.date_range?.length === 2) {
      params.start_date = params.date_range[0]
      params.end_date = params.date_range[1]
    }
    delete params.date_range
    
    const res = await request({
      url: '/api/admin/water-purifier/logs',
      method: 'get',
      params
    })
    if (res.success) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    ElMessage.error('获取操作日志失败')
  } finally {
    loading.value = false
  }
}

const handleFilter = () => {
  listQuery.page = 1
  fetchList()
}

const resetFilter = () => {
  listQuery.keyword = ''
  listQuery.action = ''
  listQuery.date_range = []
  handleFilter()
}

const showDetail = (row) => {
  currentLog.value = row
  detailDialogVisible.value = true
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.app-container { padding: 20px; }
.page-header { margin-bottom: 20px; }
.page-title {
  font-size: 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}
.filter-container {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.code-block {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
  max-height: 200px;
}
</style>
