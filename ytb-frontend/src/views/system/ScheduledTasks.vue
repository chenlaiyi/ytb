<template>
  <div class="scheduled-tasks-container">
    <!-- 页面标题和操作按钮 -->
    <div class="page-header">
      <div class="header-left">
        <h2>定时任务管理</h2>
        <p class="page-description">管理系统中的所有定时任务，支持增删改查和手动执行</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showCreateDialog" icon="Plus">
          新增任务
        </el-button>
        <el-button @click="refreshTasks" icon="Refresh">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon total">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ stats.total_tasks }}</div>
                <div class="stats-label">总任务数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon enabled">
                <el-icon><Check /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ stats.enabled_tasks }}</div>
                <div class="stats-label">启用任务</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon success">
                <el-icon><SuccessFilled /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ stats.overall_success_rate }}%</div>
                <div class="stats-label">成功率</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon runs">
                <el-icon><DataAnalysis /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ stats.total_runs }}</div>
                <div class="stats-label">总执行次数</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="任务名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入任务名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.is_enabled" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="启用" :value="true" />
            <el-option label="禁用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行状态">
          <el-select v-model="searchForm.last_run_status" placeholder="请选择执行状态" clearable style="width: 120px">
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
            <el-option label="运行中" value="running" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchTasks" icon="Search">
            搜索
          </el-button>
          <el-button @click="resetSearch" icon="Refresh">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 任务列表 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="tasks"
        stripe
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="任务名称" min-width="150" />
        <el-table-column prop="command" label="执行命令" min-width="200" show-overflow-tooltip />
        <el-table-column prop="schedule_description" label="调度描述" width="120" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_enabled ? 'success' : 'danger'">
              {{ row.is_enabled ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="执行状态" width="100">
          <template #default="{ row }">
            <el-tag
              v-if="row.last_run_status"
              :type="getStatusType(row.last_run_status)"
            >
              {{ getStatusText(row.last_run_status) }}
            </el-tag>
            <span v-else class="text-gray-400">未执行</span>
          </template>
        </el-table-column>
        <el-table-column label="成功率" width="80">
          <template #default="{ row }">
            <span :class="getSuccessRateClass(row.success_rate)">
              {{ row.success_rate }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="run_count" label="执行次数" width="80" />
        <el-table-column label="最后执行" width="120">
          <template #default="{ row }">
            <span v-if="row.last_run_at" :title="row.last_run_at">
              {{ row.last_run_human }}
            </span>
            <span v-else class="text-gray-400">从未执行</span>
          </template>
        </el-table-column>
        <el-table-column label="下次执行" width="120">
          <template #default="{ row }">
            <span v-if="row.next_run_at && row.is_enabled" :title="row.next_run_at">
              {{ row.next_run_human }}
            </span>
            <span v-else class="text-gray-400">未设置</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="runTask(row)"
              :loading="row.running"
              icon="VideoPlay"
            >
              执行
            </el-button>
            <el-button
              :type="row.is_enabled ? 'warning' : 'success'"
              size="small"
              @click="toggleTaskStatus(row)"
              :icon="row.is_enabled ? 'VideoPause' : 'VideoPlay'"
            >
              {{ row.is_enabled ? '禁用' : '启用' }}
            </el-button>
            <el-dropdown @command="handleCommand" trigger="click">
              <el-button size="small" icon="More" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="{action: 'edit', row}">编辑</el-dropdown-item>
                  <el-dropdown-item :command="{action: 'logs', row}" v-if="row.log_file">查看日志</el-dropdown-item>
                  <el-dropdown-item :command="{action: 'delete', row}" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.current_page"
          v-model:page-size="pagination.per_page"
          :page-sizes="[10, 15, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 创建/编辑任务对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="执行命令" prop="command">
          <el-input v-model="form.command" placeholder="请输入执行命令，如：tapp:sync-devices" />
        </el-form-item>
        <el-form-item label="任务描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入任务描述"
          />
        </el-form-item>
        <el-form-item label="调度表达式" prop="schedule_expression">
          <el-select v-model="form.schedule_expression" placeholder="请选择调度表达式" style="width: 100%">
            <el-option label="每小时执行" value="hourly" />
            <el-option label="每天执行" value="daily" />
            <el-option label="每天凌晨1点" value="dailyAt:01:00" />
            <el-option label="每天凌晨2点" value="dailyAt:02:00" />
            <el-option label="每天凌晨3点" value="dailyAt:03:00" />
            <el-option label="每月1日凌晨3点" value="monthlyOn:1:03:00" />
            <el-option label="每月1日凌晨4点" value="monthlyOn:1:04:00" />
          </el-select>
        </el-form-item>
        <el-form-item label="调度描述" prop="schedule_description">
          <el-input v-model="form.schedule_description" placeholder="请输入调度描述，如：每小时执行一次" />
        </el-form-item>
        <el-form-item label="日志文件" prop="log_file">
          <el-input v-model="form.log_file" placeholder="可选，如：logs/task.log" />
        </el-form-item>
        <el-form-item label="防止重叠">
          <el-switch v-model="form.without_overlapping" />
          <span class="form-tip">开启后，如果上次任务还在执行，则跳过本次执行</span>
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="form.is_enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 日志查看对话框 -->
    <el-dialog
      v-model="logDialogVisible"
      title="任务执行日志"
      width="800px"
    >
      <div class="log-container">
        <div class="log-header">
          <span>日志文件：{{ currentTask?.log_file }}</span>
          <el-button size="small" @click="refreshLogs" icon="Refresh">刷新</el-button>
        </div>
        <div class="log-content" v-loading="logLoading">
          <pre v-if="logs.length > 0">{{ logs.join('\n') }}</pre>
          <div v-else class="no-logs">暂无日志数据</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Clock,
  Check,
  SuccessFilled,
  DataAnalysis,
  Plus,
  Refresh,
  Search,
  VideoPlay,
  VideoPause,
  More
} from '@element-plus/icons-vue'
import axios from 'axios'

// 响应式数据
const loading = ref(false)
const tasks = ref([])
const stats = ref({
  total_tasks: 0,
  enabled_tasks: 0,
  disabled_tasks: 0,
  success_tasks: 0,
  failed_tasks: 0,
  never_run_tasks: 0,
  total_runs: 0,
  total_success: 0,
  total_failures: 0,
  overall_success_rate: 0
})

// 搜索表单
const searchForm = reactive({
  name: '',
  is_enabled: null,
  last_run_status: ''
})

// 分页
const pagination = reactive({
  current_page: 1,
  per_page: 15,
  total: 0
})

// 排序
const sortBy = ref('created_at')
const sortOrder = ref('desc')

// 对话框
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref()

// 表单数据
const form = reactive({
  id: null,
  name: '',
  command: '',
  description: '',
  schedule_expression: '',
  schedule_description: '',
  log_file: '',
  without_overlapping: false,
  is_enabled: true
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入任务名称', trigger: 'blur' }
  ],
  command: [
    { required: true, message: '请输入执行命令', trigger: 'blur' }
  ],
  schedule_expression: [
    { required: true, message: '请选择调度表达式', trigger: 'change' }
  ],
  schedule_description: [
    { required: true, message: '请输入调度描述', trigger: 'blur' }
  ]
}

// 日志对话框
const logDialogVisible = ref(false)
const logLoading = ref(false)
const logs = ref([])
const currentTask = ref(null)

// 计算属性
const dialogTitle = computed(() => isEdit.value ? '编辑任务' : '新增任务')

// 方法
const fetchTasks = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.current_page,
      per_page: pagination.per_page,
      sort_by: sortBy.value,
      sort_order: sortOrder.value,
      ...searchForm
    }
    
    const response = await axios.get('/api/admin/v1/scheduled-tasks', { params })
    
    if (response.data.code === 200) {
      tasks.value = response.data.data.data
      pagination.total = response.data.data.total
      pagination.current_page = response.data.data.current_page
    }
  } catch (error) {
    ElMessage.error('获取任务列表失败：' + error.message)
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const response = await axios.get('/api/admin/v1/scheduled-tasks/stats')
    if (response.data.code === 200) {
      stats.value = response.data.data
    }
  } catch (error) {
    console.error('获取统计信息失败：', error)
  }
}

const searchTasks = () => {
  pagination.current_page = 1
  fetchTasks()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    name: '',
    is_enabled: null,
    last_run_status: ''
  })
  searchTasks()
}

const refreshTasks = () => {
  fetchTasks()
  fetchStats()
}

const handleSortChange = ({ prop, order }) => {
  sortBy.value = prop
  sortOrder.value = order === 'ascending' ? 'asc' : 'desc'
  fetchTasks()
}

const handleSizeChange = (size) => {
  pagination.per_page = size
  pagination.current_page = 1
  fetchTasks()
}

const handleCurrentChange = (page) => {
  pagination.current_page = page
  fetchTasks()
}

const showCreateDialog = () => {
  isEdit.value = false
  dialogVisible.value = true
}

const showEditDialog = (task) => {
  isEdit.value = true
  Object.assign(form, task)
  dialogVisible.value = true
}

const resetForm = () => {
  Object.assign(form, {
    id: null,
    name: '',
    command: '',
    description: '',
    schedule_expression: '',
    schedule_description: '',
    log_file: '',
    without_overlapping: false,
    is_enabled: true
  })
  formRef.value?.resetFields()
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
    submitting.value = true
    
    const url = isEdit.value 
      ? `/api/admin/v1/scheduled-tasks/${form.id}`
      : '/api/admin/v1/scheduled-tasks'
    
    const method = isEdit.value ? 'put' : 'post'
    
    const response = await axios[method](url, form)
    
    if (response.data.code === 200) {
      ElMessage.success(isEdit.value ? '任务更新成功' : '任务创建成功')
      dialogVisible.value = false
      refreshTasks()
    } else {
      ElMessage.error(response.data.message)
    }
  } catch (error) {
    if (error.response?.data?.errors) {
      const errors = Object.values(error.response.data.errors).flat()
      ElMessage.error(errors[0])
    } else {
      ElMessage.error('操作失败：' + error.message)
    }
  } finally {
    submitting.value = false
  }
}

const runTask = async (task) => {
  try {
    task.running = true
    const response = await axios.post(`/api/admin/v1/scheduled-tasks/${task.id}/run`)
    
    if (response.data.code === 200) {
      ElMessage.success('任务执行成功')
      refreshTasks()
    } else {
      ElMessage.error(response.data.message)
    }
  } catch (error) {
    ElMessage.error('执行任务失败：' + error.message)
  } finally {
    task.running = false
  }
}

const toggleTaskStatus = async (task) => {
  try {
    const action = task.is_enabled ? '禁用' : '启用'
    await ElMessageBox.confirm(`确定要${action}任务"${task.name}"吗？`, '确认操作')
    
    const response = await axios.post(`/api/admin/v1/scheduled-tasks/${task.id}/toggle`, {
      is_enabled: !task.is_enabled
    })
    
    if (response.data.code === 200) {
      ElMessage.success(`任务${action}成功`)
      refreshTasks()
    } else {
      ElMessage.error(response.data.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败：' + error.message)
    }
  }
}

const deleteTask = async (task) => {
  try {
    await ElMessageBox.confirm(`确定要删除任务"${task.name}"吗？此操作不可恢复！`, '确认删除', {
      type: 'warning'
    })
    
    const response = await axios.delete(`/api/admin/v1/scheduled-tasks/${task.id}`)
    
    if (response.data.code === 200) {
      ElMessage.success('任务删除成功')
      refreshTasks()
    } else {
      ElMessage.error(response.data.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + error.message)
    }
  }
}

const showLogs = async (task) => {
  currentTask.value = task
  logDialogVisible.value = true
  await refreshLogs()
}

const refreshLogs = async () => {
  if (!currentTask.value) return
  
  logLoading.value = true
  try {
    const response = await axios.get(`/api/admin/v1/scheduled-tasks/${currentTask.value.id}/logs`)
    
    if (response.data.code === 200) {
      logs.value = response.data.data.logs
    } else {
      logs.value = []
      ElMessage.warning(response.data.message)
    }
  } catch (error) {
    logs.value = []
    ElMessage.error('获取日志失败：' + error.message)
  } finally {
    logLoading.value = false
  }
}

const handleCommand = ({ action, row }) => {
  switch (action) {
    case 'edit':
      showEditDialog(row)
      break
    case 'logs':
      showLogs(row)
      break
    case 'delete':
      deleteTask(row)
      break
  }
}

// 辅助方法
const getStatusType = (status) => {
  const types = {
    success: 'success',
    failed: 'danger',
    running: 'warning'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    success: '成功',
    failed: '失败',
    running: '运行中'
  }
  return texts[status] || '未知'
}

const getSuccessRateClass = (rate) => {
  if (rate >= 90) return 'text-green-600'
  if (rate >= 70) return 'text-yellow-600'
  return 'text-red-600'
}

// 生命周期
onMounted(() => {
  refreshTasks()
})
</script>

<style scoped>
.scheduled-tasks-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left h2 {
  margin: 0 0 5px 0;
  color: #ffffff;
}

.page-description {
  margin: 0;
  color: #ffffff;
  font-size: 14px;
  opacity: 0.8;
}

.header-right {
  display: flex;
  gap: 10px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stats-card {
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.stats-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stats-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stats-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stats-icon.enabled {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stats-icon.success {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stats-icon.runs {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stats-info {
  flex: 1;
}

.stats-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stats-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.search-card,
.table-card {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.form-tip {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}

.log-container {
  height: 400px;
  display: flex;
  flex-direction: column;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 10px;
}

.log-content {
  flex: 1;
  overflow-y: auto;
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}

.log-content pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.no-logs {
  text-align: center;
  color: #909399;
  padding: 50px 0;
}

.text-gray-400 {
  color: #c0c4cc;
}

.text-green-600 {
  color: #67c23a;
  font-weight: bold;
}

.text-yellow-600 {
  color: #e6a23c;
  font-weight: bold;
}

.text-red-600 {
  color: #f56c6c;
  font-weight: bold;
}
</style> 