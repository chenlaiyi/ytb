<template>
  <div class="wechat-work-customers">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">企业微信客户管理</h1>
        <p class="page-description">管理企业微信客户数据，支持同步、筛选、清理等功能</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleFullSync" :loading="syncing">
          <el-icon><Refresh /></el-icon>
          全量同步
        </el-button>
        <el-button type="warning" @click="handleCleanTemp">
          <el-icon><Delete /></el-icon>
          清理临时数据
        </el-button>
        <el-button type="danger" @click="handleCleanInactive">
          <el-icon><Clock /></el-icon>
          清理长期未联系
        </el-button>
        <el-dropdown @command="handleDeduplicate" trigger="click">
          <el-button type="info" :loading="dedupLoading">
            <el-icon><MagicStick /></el-icon>
            数据修复
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="customers">去重重复客户</el-dropdown-item>
              <el-dropdown-item command="relations">去重客户-员工关联</el-dropdown-item>
              <el-dropdown-item command="orphans">清理孤立客户/关联</el-dropdown-item>
              <el-dropdown-item divided command="all">综合修复（推荐）</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-number">{{ stats.total_customers || 0 }}</div>
              <div class="stats-label">总客户数</div>
            </div>
            <div class="stats-icon">
              <el-icon><User /></el-icon>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-number">{{ stats.has_real_name || 0 }}</div>
              <div class="stats-label">真实姓名客户</div>
            </div>
            <div class="stats-icon">
              <el-icon><UserFilled /></el-icon>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card clickable" @click="quickFilterNoContact">
            <div class="stats-content">
              <div class="stats-number text-warning">
                {{ (stats.never_contacted || 0) + (stats.no_contact_90_days || 0) }}
              </div>
              <div class="stats-label">长期未联系</div>
              <div class="stats-sublabel">从未联系 {{ stats.never_contacted || 0 }} | 90天+ {{ stats.no_contact_90_days || 0 }}</div>
            </div>
            <div class="stats-icon text-warning">
              <el-icon><Clock /></el-icon>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-number">{{ stats.data_quality_rate || 0 }}%</div>
              <div class="stats-label">数据质量</div>
            </div>
            <div class="stats-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 同步概览 -->
    <el-card class="sync-summary-card" shadow="never">
      <div class="summary-header">
        <div>
          <div class="summary-title">同步概览</div>
          <div class="summary-subtitle">
            最后全量同步：{{ formatDateTimeDisplay(syncSummary.last_synced_at) }}
          </div>
        </div>
        <el-tag v-if="stats.sync_status?.data_source" size="small" effect="plain">
          数据来源：{{ stats.sync_status.data_source === 'sync_log' ? '同步日志' : '实时接口' }}
        </el-tag>
      </div>
      <div class="sync-summary-grid">
        <div class="summary-item">
          <div class="summary-label">企业微信客户数</div>
          <div class="summary-value">{{ formatNumber(summaryRemoteCustomers) }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">本地客户数</div>
          <div class="summary-value">{{ formatNumber(stats.total_customers || 0) }}</div>
        </div>
        <div
          class="summary-item"
          :class="{
            'summary-item--warn': summaryDifference !== null && summaryDifference > 0,
            'summary-item--positive': summaryDifference !== null && summaryDifference < 0
          }"
        >
          <div class="summary-label">差异（企微 - 本地）</div>
          <div class="summary-value">{{ summaryDifferenceLabel }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">参与同步员工</div>
          <div class="summary-value">
            {{ formatNumber(summaryEmployees) }}
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-label">权限受限员工</div>
          <div class="summary-value">
            <el-tag v-if="permissionIssues.length" type="warning" size="small">
              {{ permissionIssues.length }}
            </el-tag>
            <span v-else>0</span>
          </div>
        </div>
      </div>
      <el-alert
        v-if="permissionIssues.length"
        class="permission-alert"
        type="warning"
        :closable="false"
        show-icon
      >
        <template #default>
          <div class="permission-alert-title">
            <el-icon><WarningFilled /></el-icon>
            <span>以下员工无法访问客户，请在企业微信「客户联系」应用中为其开通权限：</span>
          </div>
          <div class="permission-tags">
            <el-tag
              v-for="employee in permissionPreview"
              :key="employee.userid"
              type="danger"
              size="small"
              effect="dark"
            >
              {{ employee.name || employee.userid }}
            </el-tag>
            <span v-if="permissionIssues.length > permissionPreview.length" class="permission-more">
              等 {{ permissionIssues.length }} 人
            </span>
          </div>
        </template>
      </el-alert>
    </el-card>

    <!-- 搜索和筛选 -->
    <el-card class="search-card">
      <div class="search-form">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input
              v-model="searchForm.search"
              placeholder="搜索客户姓名、备注、员工"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="4">
            <el-select v-model="searchForm.employee_id" placeholder="选择员工" clearable>
              <el-option
                v-for="employee in employees"
                :key="employee.employee_id"
                :label="`${employee.employee_name} (${employee.customer_count})`"
                :value="employee.employee_id"
              />
            </el-select>
          </el-col>
          <el-col :span="3">
            <el-select v-model="searchForm.has_real_name" placeholder="真实姓名" clearable>
              <el-option label="有真实姓名" value="1" />
              <el-option label="无真实姓名" value="0" />
            </el-select>
          </el-col>
          <el-col :span="3">
            <el-select v-model="searchForm.has_avatar" placeholder="头像" clearable>
              <el-option label="有头像" value="1" />
              <el-option label="无头像" value="0" />
            </el-select>
          </el-col>
          <el-col :span="3">
            <el-select v-model="searchForm.no_contact_days" placeholder="未联系天数" clearable>
              <el-option label="30天未联系" value="30" />
              <el-option label="60天未联系" value="60" />
              <el-option label="90天未联系" value="90" />
              <el-option label="180天未联系" value="180" />
              <el-option label="从未联系" value="-1" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="handleReset">
              <el-icon><RefreshLeft /></el-icon>
              重置
            </el-button>
          </el-col>
          <el-col :span="4">
            <el-button 
              type="danger" 
              @click="handleBatchDelete" 
              :disabled="selectedRows.length === 0"
            >
              <el-icon><Delete /></el-icon>
              批量删除 ({{ selectedRows.length }})
            </el-button>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 客户列表 -->
    <el-card class="table-card">
      <div class="table-header">
        <div class="table-title">客户列表</div>
        <div class="table-actions">
          <el-button size="small" @click="fetchData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>

      <el-table
        :data="tableData"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        stripe
        border
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="头像" width="80">
          <template #default="scope">
            <el-avatar
              :size="40"
              :src="scope.row.avatar"
              :alt="scope.row.name"
            >
              <el-icon><User /></el-icon>
            </el-avatar>
          </template>
        </el-table-column>

        <el-table-column label="客户信息" min-width="200">
          <template #default="scope">
            <div class="customer-info">
              <div class="customer-name">
                {{ scope.row.name || '未知客户' }}
                <el-tag v-if="scope.row.name && scope.row.name.startsWith('客户_')" type="warning" size="small">临时</el-tag>
              </div>
              <div class="customer-id">ID: {{ scope.row.external_userid }}</div>
              <div v-if="scope.row.corp_name" class="customer-corp">{{ scope.row.corp_name }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="所属员工" width="200">
          <template #default="scope">
            <div class="employee-info">
              <div class="employee-name">
                {{ primaryEmployee(scope.row) }}
                <el-tag
                  v-if="scope.row.employee_count > 1"
                  size="small"
                  type="info"
                  class="employee-count-tag"
                >
                  {{ scope.row.employee_count }} 人
                </el-tag>
              </div>
              <div v-if="scope.row.employee_department" class="employee-dept">{{ scope.row.employee_department }}</div>
              <div
                v-if="scope.row.employee_names && scope.row.employee_names.length > 1"
                class="employee-extra"
              >
                <el-tooltip placement="top">
                  <template #content>
                    {{ scope.row.employee_names.join('、') }}
                  </template>
                  <span class="employee-extra-names">
                    {{ scope.row.employee_names.slice(0, 2).join('、') }}
                    <span v-if="scope.row.employee_names.length > 2">等</span>
                  </span>
                </el-tooltip>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="性别" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.gender === 1 ? 'primary' : scope.row.gender === 2 ? 'danger' : 'info'" size="small">
              {{ scope.row.gender === 1 ? '男' : scope.row.gender === 2 ? '女' : '未知' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="职位" width="120">
          <template #default="scope">
            {{ scope.row.position || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="添加时间" width="160">
          <template #default="scope">
            {{ formatTime(scope.row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column label="最后联系" width="160">
          <template #default="scope">
            <div v-if="scope.row.last_contact_time">
              <div :class="{'text-danger': isLongNoContact(scope.row.last_contact_time)}">
                {{ formatTime(scope.row.last_contact_time) }}
              </div>
              <div class="text-muted" style="font-size: 12px;">
                {{ getDaysAgo(scope.row.last_contact_time) }}
              </div>
            </div>
            <el-tag v-else type="info" size="small">从未联系</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 同步进度对话框 -->
    <el-dialog
      v-model="syncDialogVisible"
      title="同步进度"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="sync-progress">
        <el-progress
          :percentage="syncProgress.percentage"
          :status="syncProgress.status"
          :indeterminate="syncing && syncProgress.percentage < 100"
          stroke-width="12"
        />
        <div class="sync-meta">
          <p><strong>当前阶段：</strong>{{ syncStatus }}</p>
          <p><strong>已用时：</strong>{{ syncElapsed }}</p>
          <p><strong>开始时间：</strong>{{ formatDateTime(syncProgress.startedAt) }}</p>
          <p v-if="syncProgress.finishedAt"><strong>完成时间：</strong>{{ formatDateTime(syncProgress.finishedAt) }}</p>
        </div>
        <div class="sync-stats">
          <div class="stat-item">
            <span class="stat-label">同步客户</span>
            <span class="stat-value">{{ syncProgress.synced }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">错误</span>
            <span class="stat-value">{{ syncProgress.errors }}</span>
          </div>
          <div class="stat-item" v-if="syncProgress.detached_relations">
            <span class="stat-label">移除关系</span>
            <span class="stat-value">{{ syncProgress.detached_relations }}</span>
          </div>
          <div class="stat-item" v-if="syncProgress.deactivated_customers">
            <span class="stat-label">停用客户</span>
            <span class="stat-value">{{ syncProgress.deactivated_customers }}</span>
          </div>
          <div v-if="syncProgress.current_employee" class="stat-item full-width">
            <span class="stat-label">当前处理</span>
            <span class="stat-value">{{ syncProgress.current_employee }}</span>
          </div>
        </div>
        <div v-if="syncProgress.log.length > 0" class="sync-log">
          <h4>同步日志</h4>
          <div class="log-container">
            <div v-for="(log, index) in syncProgress.log" :key="index" class="log-item">
              <el-tag :type="logTagType(log.status)" size="small">
                {{ logStatusLabel(log.status) }}
              </el-tag>
              <span>{{ formatLogMessage(log) }}</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="syncDialogVisible = false" :disabled="syncing">
          {{ syncing ? '同步中...' : '关闭' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User, UserFilled, Avatar, TrendCharts, Search, Refresh,
  Delete, RefreshLeft, MagicStick, ArrowDown, WarningFilled, Clock
} from '@element-plus/icons-vue'
import { wechatWorkCustomerApi } from '@/api/wechatWorkCustomer'

// 响应式数据
const loading = ref(false)
const syncing = ref(false)
const syncDialogVisible = ref(false)
const tableData = ref([])
const selectedRows = ref([])
const employees = ref([])
const stats = ref({})
const createEmptySummary = () => ({
  remote_unique_customers: null,
  permission_denied_employees: [],
  last_synced_at: null,
  total_employees: null,
  processed_employees: null,
  difference: null
})
const syncSummary = ref(createEmptySummary())
const syncTaskId = ref(null)
const statusTimer = ref(null)
const statusPollInterval = 5000
const dedupLoading = ref(false)

const dedupActionLabels = {
  customers: '重复客户去重',
  relations: '客户-员工关联去重',
  orphans: '孤立数据清理',
  all: '综合修复'
}

const cleanupLabelMap = {
  duplicate_customers_removed: '重复客户',
  duplicate_relations_removed: '重复关联',
  orphan_customers_removed: '孤立客户',
  orphan_relations_removed: '孤立关联'
}

const numberFormatter = new Intl.NumberFormat('zh-CN')
const formatNumber = (value) => {
  if (value === null || value === undefined) {
    return '--'
  }
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return '--'
  }
  return numberFormatter.format(Math.trunc(numeric))
}

const formatDateTimeDisplay = (value) => {
  if (!value) return '暂无记录'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '暂无记录'
  }
  return date.toLocaleString()
}

const summaryRemoteCustomers = computed(() => syncSummary.value.remote_unique_customers ?? null)
const summaryDifference = computed(() => {
  if (summaryRemoteCustomers.value === null || stats.value?.total_customers === undefined) {
    return null
  }
  return summaryRemoteCustomers.value - (stats.value.total_customers || 0)
})
const summaryDifferenceLabel = computed(() => {
  if (summaryDifference.value === null) {
    return '--'
  }
  const value = summaryDifference.value
  const sign = value > 0 ? '+' : value < 0 ? '' : ''
  return `${sign}${formatNumber(value)}`
})
const permissionIssues = computed(() => syncSummary.value.permission_denied_employees || [])
const permissionPreview = computed(() => permissionIssues.value.slice(0, 12))
const summaryEmployees = computed(() => {
  if (syncSummary.value.total_employees !== null && syncSummary.value.total_employees !== undefined) {
    return syncSummary.value.total_employees
  }
  return stats.value?.details?.wechat_employees ?? null
})

const extractEmployeeNames = (row = {}) => {
  if (Array.isArray(row.employee_names)) {
    return row.employee_names.filter(Boolean)
  }

  const source = typeof row.employee_names === 'string' && row.employee_names.trim() !== ''
    ? row.employee_names
    : typeof row.employee_names_text === 'string'
      ? row.employee_names_text
      : ''

  if (!source) {
    return []
  }

  return source
    .split(/[、,]/)
    .map(name => name.trim())
    .filter(Boolean)
}

const normalizeRow = (row = {}) => {
  const employeeNames = extractEmployeeNames(row)
  const employeeUserids = Array.isArray(row.employee_userids)
    ? row.employee_userids.filter(Boolean)
    : typeof row.employee_userids === 'string' && row.employee_userids.trim() !== ''
      ? row.employee_userids.split(',').map(id => id.trim()).filter(Boolean)
      : []

  const numericCount = Number(row.employee_count)
  const employeeCount = Number.isFinite(numericCount) && numericCount >= 0
    ? Math.trunc(numericCount)
    : employeeNames.length

  return {
    ...row,
    employee_names: employeeNames,
    employee_names_text: row.employee_names_text || employeeNames.join('、'),
    employee_userids: employeeUserids,
    employee_count: employeeCount
  }
}

const primaryEmployee = (row = {}) => {
  if (row.employee_name) {
    return row.employee_name
  }
  if (Array.isArray(row.employee_names) && row.employee_names.length > 0) {
    return row.employee_names[0]
  }
  return '未分配'
}

// 搜索表单
const searchForm = reactive({
  search: '',
  employee_id: '',
  has_real_name: '',
  has_avatar: '',
  no_contact_days: ''
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 同步状态
const syncStatus = ref('等待同步')
const syncElapsed = ref('00:00')
const syncTimer = ref(null)
const progressTicker = ref(null)

// 同步进度
const syncProgress = reactive({
  percentage: 0,
  status: '',
  synced: 0,
  errors: 0,
  detached_relations: 0,
  deactivated_customers: 0,
  current_employee: '',
  startedAt: null,
  finishedAt: null,
  log: []
})

// 初始化
onMounted(() => {
  fetchData()
  fetchStats()
  fetchEmployees()
})

onBeforeUnmount(() => {
  stopSyncTimer()
  stopProgressTicker()
  stopStatusPolling()
})

watch(syncDialogVisible, value => {
  if (!value) {
    stopStatusPolling()
    stopSyncTimer()
  }
})

const padNumber = (value) => String(value).padStart(2, '0')

const formatDuration = (ms) => {
  if (!ms || ms < 0) return '00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(seconds)}`
  }
  return `${padNumber(minutes)}:${padNumber(seconds)}`
}

const updateElapsed = () => {
  if (!syncProgress.startedAt) {
    syncElapsed.value = '00:00'
    return
  }
  const endPoint = syncProgress.finishedAt ?? new Date()
  syncElapsed.value = formatDuration(endPoint - syncProgress.startedAt)
}

const startProgressTicker = () => {
  stopProgressTicker()
  progressTicker.value = setInterval(() => {
    if (syncProgress.percentage < 90) {
      syncProgress.percentage = Math.min(syncProgress.percentage + 2, 90)
    } else {
      stopProgressTicker()
    }
  }, 1500)
}

const stopProgressTicker = () => {
  if (progressTicker.value) {
    clearInterval(progressTicker.value)
    progressTicker.value = null
  }
}

const stopStatusPolling = () => {
  if (statusTimer.value) {
    clearInterval(statusTimer.value)
    statusTimer.value = null
  }
  syncTaskId.value = null
}

const startSyncTimer = () => {
  stopSyncTimer()
  syncProgress.startedAt = new Date()
  syncProgress.finishedAt = null
  updateElapsed()
  syncTimer.value = setInterval(updateElapsed, 1000)
  startProgressTicker()
}

const stopSyncTimer = () => {
  if (syncTimer.value) {
    clearInterval(syncTimer.value)
    syncTimer.value = null
  }
  if (!syncProgress.finishedAt && syncProgress.startedAt) {
    syncProgress.finishedAt = new Date()
  }
  updateElapsed()
  stopProgressTicker()
}

const calculatePercentage = (processed, total) => {
  if (!total || total === 0) {
    return Math.max(syncProgress.percentage, 5)
  }
  const ratio = Math.min(processed / total, 1)
  return Math.min(95, Math.round(5 + ratio * 90))
}

const startStatusPolling = (taskId) => {
  stopStatusPolling()
  syncTaskId.value = taskId
  fetchSyncStatus()
  statusTimer.value = setInterval(fetchSyncStatus, statusPollInterval)
}

const fetchSyncStatus = async () => {
  if (!syncTaskId.value) return
  try {
    const response = await wechatWorkCustomerApi.getFullSyncStatus(syncTaskId.value)
    if (response.code !== 0) {
      throw new Error(response.message || '状态查询失败')
    }

    const data = response.data || {}
    const status = data.status || 'running'

    if (status === 'queued') {
      syncStatus.value = '任务排队中，请稍候...'
      syncProgress.percentage = Math.max(syncProgress.percentage, 5)
      syncProgress.detached_relations = 0
      syncProgress.deactivated_customers = 0
      syncProgress.log = normalizeLogEntries([
        { status: 'info', message: syncStatus.value }
      ])
    } else if (status === 'running') {
      const processed = data.processed_employees ?? 0
      const total = data.total_employees ?? 0
      syncProgress.percentage = calculatePercentage(processed, total)
      syncProgress.synced = data.synced_customers ?? syncProgress.synced
      syncProgress.errors = data.skipped_customers ?? syncProgress.errors
      syncProgress.detached_relations = data.detached_relations ?? syncProgress.detached_relations
      syncProgress.deactivated_customers = data.deactivated_customers ?? syncProgress.deactivated_customers
      syncProgress.current_employee = data.current_employee || ''
      syncStatus.value = `正在同步：已处理 ${processed}/${total || '?'} 个员工`
      syncProgress.log = normalizeLogEntries([
        { status: 'info', message: syncStatus.value }
      ])
    } else if (status === 'success') {
      syncProgress.percentage = 100
      syncProgress.status = 'success'
      syncProgress.synced = data.result?.total_synced ?? data.synced_customers ?? 0
      syncProgress.errors = data.result?.total_errors ?? data.skipped_customers ?? 0
      syncProgress.detached_relations = data.result?.detached_relations ?? data.detached_relations ?? 0
      syncProgress.deactivated_customers = data.result?.deactivated_customers ?? data.deactivated_customers ?? 0
      syncProgress.current_employee = ''
      syncProgress.log = normalizeLogEntries(data.result?.sync_log)
      syncStatus.value = '同步完成'
      stopStatusPolling()
      stopSyncTimer()
      fetchData()
      fetchStats()
      ElMessage.success(`同步完成！共同步 ${syncProgress.synced} 个客户`)
    } else if (status === 'failed') {
      syncProgress.status = 'exception'
      syncProgress.current_employee = ''
      syncProgress.detached_relations = data.detached_relations ?? 0
      syncProgress.deactivated_customers = data.deactivated_customers ?? 0
      syncProgress.log = normalizeLogEntries([
        { status: 'danger', message: data.message || '同步失败，请查看日志。' }
      ])
      syncStatus.value = '同步失败'
      stopStatusPolling()
      stopSyncTimer()
      if (data.message) {
        ElMessage.error(data.message)
      }
    }
  } catch (error) {
    console.error('查询同步状态失败:', error)
    stopStatusPolling()
    stopSyncTimer()
    syncProgress.status = 'exception'
    syncProgress.detached_relations = 0
    syncProgress.deactivated_customers = 0
    syncProgress.log = normalizeLogEntries([
      { status: 'danger', message: error.message || '同步失败，请稍后重试。' }
    ])
    syncStatus.value = '同步失败'
    ElMessage.error(error.message || '同步失败')
  }
}

const formatDateTime = (date) => {
  if (!date) return '—'
  const instance = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(instance.getTime())) return '—'
  return `${instance.getFullYear()}-${padNumber(instance.getMonth() + 1)}-${padNumber(instance.getDate())} ${padNumber(instance.getHours())}:${padNumber(instance.getMinutes())}:${padNumber(instance.getSeconds())}`
}

const logStatusLabel = (status) => {
  const map = {
    success: '成功',
    danger: '失败',
    warning: '警告',
    info: '提示'
  }
  return map[status] || '信息'
}

const logTagType = (status) => {
  switch (status) {
    case 'success':
      return 'success'
    case 'danger':
      return 'danger'
    case 'warning':
      return 'warning'
    case 'info':
      return 'info'
    default:
      return 'info'
  }
}

const formatLogMessage = (log) => {
  if (!log) return ''
  if (log.message) return log.message
  if (log.employee_name && log.synced_count !== undefined) {
    return `${log.employee_name} 同步 ${log.synced_count} 个客户`
  }
  if (log.employee_name && log.error) {
    return `${log.employee_name}：${log.error}`
  }
  if (log.error) {
    return log.error
  }
  if (log.synced_count !== undefined) {
    return `同步 ${log.synced_count} 个客户`
  }
  return JSON.stringify(log)
}

const normalizeLogEntries = (rawLogs) => {
  if (!Array.isArray(rawLogs) || rawLogs.length === 0) {
    return [{
      status: 'success',
      message: `同步完成，共 ${syncProgress.synced} 个客户`
    }]
  }

  return rawLogs.map(item => {
    const normalized = {
      status: item.status || (item.error ? 'danger' : 'success'),
      employee_name: item.employee_name,
      synced_count: item.synced_count,
      error: item.error,
      message: item.message
    }

    if (!normalized.message) {
      if (normalized.employee_name && normalized.synced_count !== undefined) {
        normalized.message = `${normalized.employee_name} 同步 ${normalized.synced_count} 个客户`
      } else if (normalized.employee_name && normalized.error) {
        normalized.message = `${normalized.employee_name}：${normalized.error}`
      } else if (normalized.error) {
        normalized.message = normalized.error
      } else if (normalized.synced_count !== undefined) {
        normalized.message = `同步 ${normalized.synced_count} 个客户`
      }
    }

    return normalized
  })
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.pageSize,
      ...searchForm
    }
    
    const response = await wechatWorkCustomerApi.getList(params)
    if (response.code === 0) {
      const rows = Array.isArray(response.data.list) ? response.data.list : []
      console.log(
        '[WechatWorkCustomers] fetched rows:',
        rows.length,
        'total:',
        response.data?.total,
        'filters:',
        { ...searchForm }
      )
      tableData.value = rows.map(normalizeRow)
      pagination.total = Number(response.data?.total ?? rows.length ?? 0)
      window.__WECHAT_WORK_CUSTOMERS__ = {
        rows: tableData.value,
        pagination: { ...pagination },
        raw: response.data
      }
    } else {
      ElMessage.error(response.message)
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 获取统计数据
const refreshSyncSummary = async () => {
  try {
    const response = await wechatWorkCustomerApi.getSyncSummary()
    if (response.code === 0) {
      syncSummary.value = {
        ...createEmptySummary(),
        ...(response.data || {})
      }
    }
  } catch (error) {
    console.error('获取同步摘要失败:', error)
  }
}

const fetchStats = async () => {
  try {
    const response = await wechatWorkCustomerApi.getStats()
    if (response.code === 0) {
      stats.value = response.data
      if (response.data?.sync_summary) {
        syncSummary.value = {
          ...createEmptySummary(),
          ...(response.data.sync_summary || {})
        }
      }
      await refreshSyncSummary()
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 获取员工列表
const fetchEmployees = async () => {
  try {
    const response = await wechatWorkCustomerApi.getEmployees()
    if (response.code === 0) {
      employees.value = response.data
    }
  } catch (error) {
    console.error('获取员工列表失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

// 重置
const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  pagination.page = 1
  fetchData()
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 分页变化
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchData()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchData()
}

// 全量同步
const handleFullSync = async () => {
  try {
    await ElMessageBox.confirm(
      '全量同步将从企业微信服务器获取最新的客户数据，可能需要较长时间，是否继续？',
      '确认同步',
      { type: 'warning' }
    )

    syncing.value = true
    syncDialogVisible.value = true
    stopStatusPolling()
    syncTaskId.value = null

    Object.assign(syncProgress, {
      percentage: 5,
      status: '',
      synced: 0,
      errors: 0,
      detached_relations: 0,
      deactivated_customers: 0,
      current_employee: '企业微信接口请求中...',
      startedAt: null,
      finishedAt: null,
      log: [{
        status: 'info',
        message: '正在请求企业微信接口，这可能持续 1-3 分钟，请保持页面开启。'
      }]
    })

    syncElapsed.value = '00:00'
    startSyncTimer()
    syncStatus.value = '企业微信正在同步客户数据，请不要关闭窗口'

    const response = await wechatWorkCustomerApi.fullSync()

    if (response.code === 0) {
      if (response.data?.task_id) {
        syncTaskId.value = response.data.task_id
        syncProgress.current_employee = '后台任务正在执行'
        syncProgress.log = normalizeLogEntries([
          { status: 'info', message: '同步任务已在后台启动，请稍候…' }
        ])
        syncStatus.value = '后台任务已启动，正在同步客户数据...'
        startStatusPolling(syncTaskId.value)
        ElMessage.success('同步任务已在后台启动，正在执行…')
      } else {
        stopProgressTicker()
        syncProgress.percentage = 100
        syncProgress.status = 'success'
        syncProgress.synced = response.data?.total_synced ?? 0
        syncProgress.errors = response.data?.total_errors ?? 0
        syncProgress.detached_relations = response.data?.detached_relations ?? 0
        syncProgress.deactivated_customers = response.data?.deactivated_customers ?? 0
        syncProgress.current_employee = ''
        syncProgress.log = normalizeLogEntries(response.data?.sync_log)
        syncStatus.value = '同步完成'
        ElMessage.success(`同步完成！共同步 ${syncProgress.synced} 个客户`)
        fetchData()
        fetchStats()
        stopSyncTimer()
      }
    } else {
      stopProgressTicker()
      syncProgress.status = 'exception'
      syncStatus.value = '同步失败'
      syncProgress.errors = response.data?.total_errors ?? 0
      syncProgress.detached_relations = response.data?.detached_relations ?? 0
      syncProgress.deactivated_customers = response.data?.deactivated_customers ?? 0
      syncProgress.current_employee = '已停止（出现错误）'
      syncProgress.log = normalizeLogEntries(response.data?.sync_log)
      syncProgress.log.unshift({
        status: 'danger',
        message: response.message || '同步失败，请稍后重试。'
      })
      ElMessage.error(response.message)
      stopSyncTimer()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('同步失败:', error)
      stopProgressTicker()
      ElMessage.error('同步失败')
      syncProgress.status = 'exception'
      syncStatus.value = '同步失败'
      syncProgress.detached_relations = 0
      syncProgress.deactivated_customers = 0
      syncProgress.current_employee = '已停止（出现错误）'
      syncProgress.log = [
        {
          status: 'danger',
          message: error?.message || '同步失败，请稍后重试。'
        },
        ...syncProgress.log
      ]
      stopSyncTimer()
    }
  } finally {
    if (!syncTaskId.value) {
      stopStatusPolling()
      stopSyncTimer()
    }
    syncing.value = false
  }
}

// 清理临时数据
const handleCleanTemp = async () => {
  try {
    // 先预览
    const previewResponse = await wechatWorkCustomerApi.cleanTempCustomers({ dry_run: true })
    if (previewResponse.code !== 0) {
      ElMessage.error(previewResponse.message)
      return
    }

    const tempCount = previewResponse.data.temp_customers_count
    if (tempCount === 0) {
      ElMessage.info('没有需要清理的临时数据')
      return
    }

    await ElMessageBox.confirm(
      `发现 ${tempCount} 个临时客户数据，这些数据没有真实姓名和头像。确认清理吗？`,
      '确认清理',
      { type: 'warning' }
    )

    // 执行清理
    const response = await wechatWorkCustomerApi.cleanTempCustomers({ dry_run: false })
    if (response.code === 0) {
      ElMessage.success(`清理完成！删除了 ${response.data.deleted_count} 个临时客户`)
      fetchData()
      fetchStats()
    } else {
      ElMessage.error(response.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清理失败:', error)
      ElMessage.error('清理失败')
    }
  }
}

// 清理长期未联系的客户
const handleCleanInactive = async () => {
  try {
    // 先预览
    const previewResponse = await wechatWorkCustomerApi.cleanInactiveCustomers({ 
      days: 90, 
      dry_run: true 
    })
    if (previewResponse.code !== 0) {
      ElMessage.error(previewResponse.message)
      return
    }

    const data = previewResponse.data
    const totalInactive = data.total_inactive || 0
    
    if (totalInactive === 0) {
      ElMessage.info('没有需要清理的长期未联系客户')
      return
    }

    const neverContacted = data.never_contacted || 0
    const overDays = data.over_days || 0
    
    let message = `<p>发现 <strong>${totalInactive}</strong> 个 90 天以上未联系的客户：</p>`
    message += '<ul style="margin-top: 8px; padding-left: 20px;">'
    if (neverContacted > 0) {
      message += `<li>从未联系：${neverContacted} 人</li>`
    }
    if (overDays > 0) {
      message += `<li>超过90天未联系：${overDays} 人</li>`
    }
    message += '</ul>'
    message += '<p style="margin-top: 12px; color: #f56c6c;"><strong>注意：</strong>此操作将同时从企业微信官方删除这些客户的跟进关系！</p>'

    await ElMessageBox.confirm(
      message,
      '确认清理长期未联系客户',
      {
        type: 'warning',
        dangerouslyUseHTMLString: true,
        confirmButtonText: '确认清理',
        cancelButtonText: '取消'
      }
    )

    // 执行清理
    const response = await wechatWorkCustomerApi.cleanInactiveCustomers({
      days: 90,
      dry_run: false,
      delete_from_wechat: true
    })
    
    if (response.code === 0) {
      const result = response.data
      let successMsg = `清理完成！删除了 ${result.deleted_count} 个长期未联系的客户`
      if (result.wechat_delete_stats && result.wechat_delete_stats.total_relations_deleted > 0) {
        successMsg += `（企微跟进关系删除 ${result.wechat_delete_stats.total_relations_deleted} 个）`
      }
      ElMessage.success(successMsg)
      fetchData()
      fetchStats()
    } else {
      ElMessage.error(response.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清理失败:', error)
      ElMessage.error('清理失败')
    }
  }
}

const sumCleanupStats = (statsObj = {}) => {
  return Object.values(statsObj).reduce((total, value) => total + Number(value || 0), 0)
}

const formatCleanupSummary = (statsObj = {}) => {
  return Object.entries(statsObj)
    .filter(([, value]) => Number(value || 0) > 0)
    .map(([key, value]) => {
      const label = cleanupLabelMap[key] || key
      return `${label}: ${value}`
    })
    .join('<br>')
}

const handleDeduplicate = async (command) => {
  dedupLoading.value = true
  const actionLabel = dedupActionLabels[command] || '数据修复'

  try {
    const previewResp = await wechatWorkCustomerApi.cleanDuplicates({
      type: command,
      dry_run: true
    })

    if (previewResp.code !== 0) {
      throw new Error(previewResp.message || '预检查失败')
    }

    const previewStats = previewResp.data?.stats || {}
    const totalImpacted = sumCleanupStats(previewStats)

    if (totalImpacted === 0) {
      ElMessage.info(`${actionLabel}：无需处理`)
      return
    }

    const summaryHtml = formatCleanupSummary(previewStats) || '即将执行数据修复操作。'

    await ElMessageBox.confirm(
      `<p>即将执行：<strong>${actionLabel}</strong></p><p>${summaryHtml}</p><p>是否继续？</p>`,
      '确认数据修复',
      {
        type: 'warning',
        dangerouslyUseHTMLString: true,
        confirmButtonText: '立即修复',
        cancelButtonText: '取消'
      }
    )

    const execResp = await wechatWorkCustomerApi.cleanDuplicates({
      type: command,
      dry_run: false
    })

    if (execResp.code !== 0) {
      throw new Error(execResp.message || '修复失败')
    }

    const resultStats = execResp.data?.stats || {}
    const resultSummary = formatCleanupSummary(resultStats)

    ElMessage.success(execResp.data?.message || `${actionLabel}完成`)
    if (resultSummary) {
      ElMessage.success(resultSummary.replace(/<br>/g, '；'))
    }

    fetchData()
    fetchStats()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('数据修复失败:', error)
      ElMessage.error(error.message || '数据修复失败')
    }
  } finally {
    dedupLoading.value = false
  }
}

// 删除客户
const handleDelete = async (row) => {
  let message = `确认删除客户 "${row.name || '未知客户'}" 吗？`

  // 如果长期未联系，添加警告
  if (!row.last_contact_time) {
    message += '<br><small style="color: #f56c6c;">（该客户从未联系过）</small>'
  } else {
    const days = Math.floor((new Date() - new Date(row.last_contact_time)) / (1000 * 60 * 60 * 24))
    if (days > 90) {
      message += `<br><small style="color: #e6a23c;">（已 ${days} 天未联系）</small>`
    }
  }

  message += '<br><br><small style="color: #909399;">此操作将同时从企业微信官方删除该客户的跟进关系</small>'

  try {
    await ElMessageBox.confirm(
      message,
      '确认删除',
      {
        type: 'warning',
        dangerouslyUseHTMLString: true
      }
    )

    const response = await wechatWorkCustomerApi.deleteCustomer(row.id, true)
    if (response.code === 0) {
      const stats = response.data?.wechat_delete_details
      let successMsg = '删除成功'
      if (stats && stats.deleted_count > 0) {
        successMsg += `（企微跟进关系删除 ${stats.deleted_count} 个）`
      }
      ElMessage.success(successMsg)
      fetchData()
      fetchStats()
    } else {
      ElMessage.error(response.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要删除的客户')
    return
  }

  // 统计信息
  const stats = {
    total: selectedRows.value.length,
    neverContact: 0,
    over90Days: 0,
    over180Days: 0
  }

  selectedRows.value.forEach(row => {
    if (!row.last_contact_time) {
      stats.neverContact++
    } else {
      const days = Math.floor((new Date() - new Date(row.last_contact_time)) / (1000 * 60 * 60 * 24))
      if (days > 180) stats.over180Days++
      else if (days > 90) stats.over90Days++
    }
  })

  // 构建确认消息
  let message = `<p>确认删除选中的 <strong>${stats.total}</strong> 个客户吗？</p>`
  if (stats.neverContact > 0 || stats.over90Days > 0 || stats.over180Days > 0) {
    message += '<ul style="margin-top: 10px; padding-left: 20px;">'
    if (stats.neverContact > 0) message += `<li>从未联系：${stats.neverContact} 人</li>`
    if (stats.over180Days > 0) message += `<li>超过180天未联系：${stats.over180Days} 人</li>`
    else if (stats.over90Days > 0) message += `<li>超过90天未联系：${stats.over90Days} 人</li>`
    message += '</ul>'
  }
  message += '<p style="margin-top: 10px; color: #909399; font-size: 12px;">此操作将同时从企业微信官方删除这些客户的跟进关系</p>'

  try {
    await ElMessageBox.confirm(
      message,
      '确认批量删除',
      {
        type: 'warning',
        dangerouslyUseHTMLString: true,
        confirmButtonText: '确认删除',
        cancelButtonText: '取消'
      }
    )

    const ids = selectedRows.value.map(row => row.id)
    const response = await wechatWorkCustomerApi.batchDelete({ ids, delete_from_wechat: true })

    if (response.code === 0) {
      let successMsg = `批量删除成功！删除了 ${response.data.deleted_count} 个客户`
      if (response.data.wechat_delete_stats && response.data.wechat_delete_stats.total_relations_deleted > 0) {
        successMsg += `（企微跟进关系删除 ${response.data.wechat_delete_stats.total_relations_deleted} 个）`
      }
      ElMessage.success(successMsg)
      selectedRows.value = []
      fetchData()
      fetchStats()
    } else {
      ElMessage.error(response.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

// 快速筛选长期未联系的客户
const quickFilterNoContact = () => {
  searchForm.no_contact_days = '90'
  handleSearch()
  ElMessage.info('已筛选90天以上未联系的客户')
}


// 格式化时间
const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

// 判断是否长期未联系（超过90天）
const isLongNoContact = (lastContactTime) => {
  if (!lastContactTime) return true
  const days = Math.floor((new Date() - new Date(lastContactTime)) / (1000 * 60 * 60 * 24))
  return days > 90
}

// 计算距离现在的天数
const getDaysAgo = (time) => {
  if (!time) return ''
  const days = Math.floor((new Date() - new Date(time)) / (1000 * 60 * 60 * 24))
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  if (days < 365) return `${Math.floor(days / 30)}个月前`
  return `${Math.floor(days / 365)}年前`
}

</script>

<style scoped>
.wechat-work-customers {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #303133;
}

.page-description {
  color: #909399;
  margin: 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

.stats-cards {
  margin-bottom: 20px;
}

.sync-summary-card {
  margin-bottom: 20px;
  border: 1px solid #ebeef5;
}

.summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.summary-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.summary-subtitle {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.sync-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}

.summary-item {
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  background-color: #f8fafc;
}

.summary-item--warn {
  border-color: #f56c6c;
  background-color: #fef0f0;
  color: #f56c6c;
}

.summary-item--positive {
  border-color: #67c23a;
  background-color: #f0f9eb;
  color: #409EFF;
}

.summary-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.summary-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.permission-alert {
  margin-top: 16px;
}

.permission-alert-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #e6a23c;
}

.permission-alert-title .el-icon {
  font-size: 16px;
}

.permission-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.permission-more {
  font-size: 12px;
  color: #e6a23c;
  align-self: center;
}

.stats-card {
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.stats-card.clickable {
  cursor: pointer;
  transition: all 0.3s;
}

.stats-card.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
}

.stats-card :deep(.el-card__body) {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-content {
  flex: 1;
}

.stats-number {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
  margin-bottom: 8px;
}

.stats-label {
  font-size: 14px;
  color: #909399;
}

.stats-sublabel {
  font-size: 11px;
  color: #c0c4cc;
  margin-top: 4px;
}

.text-warning {
  color: #e6a23c;
}

.stats-icon {
  font-size: 32px;
  color: #409EFF;
  opacity: 0.8;
}

.stats-icon.text-warning {
  color: #e6a23c;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  padding: 10px 0;
}

.table-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.customer-info {
  line-height: 1.4;
}

.customer-name {
  font-weight: 500;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.customer-id {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.customer-corp {
  font-size: 12px;
  color: #606266;
  margin-top: 2px;
}

.employee-info {
  line-height: 1.4;
}

.employee-name {
  font-weight: 500;
  color: #303133;
}

.employee-count-tag {
  margin-left: 6px;
}

.employee-dept {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.employee-extra {
  margin-top: 4px;
  font-size: 12px;
  color: #606266;
}

.employee-extra-names {
  color: #409EFF;
  cursor: help;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.sync-progress {
  padding: 20px 0;
}

.sync-meta {
  margin-top: 12px;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.sync-meta p {
  margin: 2px 0;
}

.sync-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin: 16px 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  padding: 12px;
  border: 1px solid #EBEEF5;
  border-radius: 6px;
  background: #F5F7FA;
}

.stat-item.full-width {
  grid-column: 1 / -1;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  word-break: break-all;
}

.sync-log {
  margin-top: 20px;
}

.sync-log h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #303133;
}

.log-container {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  padding: 8px;
}

.log-item {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px 0;
  font-size: 12px;
  color: #606266;
}

.text-danger {
  color: #f56c6c;
  font-weight: 500;
}

.text-muted {
  color: #909399;
}
</style>
