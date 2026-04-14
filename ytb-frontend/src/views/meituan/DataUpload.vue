<template>
  <div class="meituan-upload-page">
    <el-row :gutter="20" class="mt-section">
      <el-col :span="14">
        <el-card shadow="hover" class="mt-card calendar-card">
          <template #header>
            <div class="card-header">
              <span>数据上传日历</span>
              <div class="calendar-meta">
                <el-tag type="success" size="small" effect="plain">{{ calendarRangeText }}</el-tag>
                <el-tag type="info" size="small" effect="plain">近 30 天</el-tag>
                <el-button link type="primary" :loading="calendarLoading" @click="loadCalendarData">刷新</el-button>
              </div>
            </div>
          </template>
          <div class="calendar-section" v-loading="calendarLoading">
            <div class="calendar-wrapper">
              <div class="calendar-grid" :style="calendarGridStyle">
                <div class="calendar-header type-header">数据类型</div>
                <div
                  v-for="date in calendarDates"
                  :key="`head-${date}`"
                  class="calendar-header date-header"
                >
                  <span class="date-primary">{{ formatDate(date) }}</span>
                  <span class="date-secondary">{{ formatWeekday(date) }}</span>
                </div>
                <template v-for="row in calendarRows" :key="row.value">
                  <div class="type-cell">
                    <el-icon><component :is="row.icon" /></el-icon>
                    <div class="type-info">
                      <span class="type-label">{{ row.label }}</span>
                      <span class="type-coverage">{{ row.coverage }} / {{ row.total }}</span>
                    </div>
                  </div>
                  <div
                    v-for="cell in row.calendar"
                    :key="`${row.value}-${cell.date}`"
                    class="calendar-cell"
                    :class="`status-${cell.status}`"
                  >
                    <el-tooltip :content="cell.tooltip" placement="top">
                      <span class="status-dot"></span>
                    </el-tooltip>
                  </div>
                </template>
              </div>
            </div>
            <div class="calendar-legend">
              <div
                v-for="item in legendItems"
                :key="item.status"
                class="legend-item"
              >
                <span class="legend-dot" :class="`status-${item.status}`"></span>
                <span>{{ item.label }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="hover" class="mt-card upload-card">
          <template #header>
            <div class="card-header">
              <span>上传美团 Excel 文件</span>
              <small>仅支持官方导出的 .xlsx/.xls</small>
            </div>
          </template>
          <div class="upload-form">
            <el-form :model="uploadForm" label-width="96px">
              <el-form-item label="数据类型">
                <el-select v-model="uploadForm.type" placeholder="请选择数据类型" class="type-select">
                  <el-option
                    v-for="item in uploadTypes"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="Excel 文件">
                <el-upload
                  ref="uploadRef"
                  class="upload-block"
                  drag
                  :auto-upload="false"
                  :show-file-list="false"
                  :disabled="uploading"
                  :before-upload="stopAutoUpload"
                  :on-change="handleFileChange"
                  accept=".xls,.xlsx"
                >
                  <el-icon class="upload-icon"><UploadFilled /></el-icon>
                  <div class="el-upload__text">
                    拖拽文件至此，或 <em>点击上传</em>
                  </div>
                  <div class="el-upload__tip">
                    支持单个文件，最大 50MB，需与美团原始模板一致。
                  </div>
                  <div v-if="selectedFileName" class="selected-file">
                    已选择：{{ selectedFileName }}
                  </div>
                </el-upload>
              </el-form-item>
              <el-form-item label="上传说明">
                <ul class="hint-list">
                  <li>系统按唯一键去重，重复记录不会再次写入。</li>
                  <li>支持连续上传拆分文件，自动记录覆盖的日期区间。</li>
                  <li>请确保选择正确的数据类型，以免字段匹配失败。</li>
                </ul>
              </el-form-item>
              <el-form-item>
                <el-button
                  type="primary"
                  :loading="uploading"
                  :disabled="!uploadForm.file"
                  @click="triggerUpload"
                >
                  {{ uploading ? '上传中...' : '开始上传' }}
                </el-button>
                <el-button @click="resetUpload" :disabled="uploading">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
          <el-alert
            v-if="lastResult"
            class="result-alert"
            type="success"
            show-icon
            :closable="false"
          >
            <p class="result-title">最新导入结果</p>
            <ul class="result-list">
              <li>文件：{{ lastResult.original_filename }}</li>
              <li>日期范围：{{ lastResult.date_start || '--' }} ~ {{ lastResult.date_end || '--' }}</li>
              <li>总行数：{{ lastResult.total_rows }}</li>
              <li>插入成功：{{ lastResult.inserted_rows }}</li>
              <li>重复跳过：{{ lastResult.duplicate_rows }}</li>
              <li>无效跳过：{{ lastResult.skipped_rows }}</li>
              <li v-if="lastResult.message">说明：{{ lastResult.message }}</li>
            </ul>
          </el-alert>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover" class="mt-card record-card">
      <template #header>
        <div class="card-header">
          <span>上传记录</span>
          <div class="record-filters">
            <el-select v-model="filters.type" placeholder="类型" clearable @change="handleFilter">
              <el-option
                v-for="item in uploadTypes"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-select v-model="filters.status" placeholder="状态" clearable @change="handleFilter">
              <el-option label="成功" value="success" />
              <el-option label="失败" value="failed" />
            </el-select>
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              start-placeholder="起始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleFilter"
            />
            <el-button type="primary" link @click="loadRecords">刷新</el-button>
          </div>
        </div>
      </template>
      <el-table
        v-loading="recordLoading"
        :data="records"
        border
        size="small"
      >
        <el-table-column prop="type_label" label="数据类型" width="140" />
        <el-table-column prop="original_filename" label="文件名" min-width="240" show-overflow-tooltip />
        <el-table-column label="日期范围" width="200">
          <template #default="scope">
            <span v-if="scope.row.date_start && scope.row.date_end">
              {{ scope.row.date_start }} ~ {{ scope.row.date_end }}
            </span>
            <span v-else class="text-muted">--</span>
          </template>
        </el-table-column>
        <el-table-column label="行数" width="200">
          <template #default="scope">
            <div class="count-wrap">
              <span>总计：{{ scope.row.total_rows }}</span>
              <span class="text-success">插入：{{ scope.row.inserted_rows }}</span>
              <span class="text-warning">重复：{{ scope.row.duplicate_rows }}</span>
              <span class="text-warning">跳过：{{ scope.row.skipped_rows }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="scope">
            <el-tag :type="statusTag(scope.row.status)">
              {{ scope.row.status_label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="处理信息" min-width="220" show-overflow-tooltip />
        <el-table-column label="操作人" width="120">
          <template #default="scope">{{ scope.row.operator_name || '--' }}</template>
        </el-table-column>
        <el-table-column prop="created_at" label="上传时间" width="180" />
      </el-table>
      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          layout="prev, pager, next, ->, total"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { UploadFilled, TrendCharts, Monitor, Shop, User } from '@element-plus/icons-vue'
import { uploadMeituanData, fetchMeituanUploadRecords } from '@/api/v1/meituanUpload'

const CALENDAR_PAGE_SIZE = 100
const MAX_CALENDAR_PAGES = 5
const WEEK_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const STATUS_PRIORITY = {
  success: 4,
  skipped: 3,
  processing: 2,
  failed: 1
}
const STATUS_LABELS = {
  success: '上传成功',
  skipped: '数据无新增',
  processing: '处理中',
  failed: '上传失败',
  missing: '未上传'
}
const POSITIVE_STATUS = new Set(['success', 'skipped'])

const uploadTypes = [
  { value: 'employee_sales', label: '员工销售数据', icon: User },
  { value: 'merchant_transactions', label: '商户交易明细', icon: Shop },
  { value: 'terminal_transactions', label: '终端交易明细', icon: Monitor },
  { value: 'order_transactions', label: '订单交易明细', icon: TrendCharts }
]

const uploadForm = reactive({
  type: uploadTypes[0]?.value || '',
  file: null
})

const filters = reactive({
  type: '',
  status: '',
  dateRange: []
})

const uploading = ref(false)
const recordLoading = ref(false)
const calendarLoading = ref(false)
const records = ref([])
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0
})
const selectedFileName = ref('')
const lastResult = ref(null)
const uploadRef = ref(null)
const calendarRecords = ref([])

const legendItems = [
  { status: 'success', label: STATUS_LABELS.success },
  { status: 'skipped', label: STATUS_LABELS.skipped },
  { status: 'processing', label: STATUS_LABELS.processing },
  { status: 'failed', label: STATUS_LABELS.failed },
  { status: 'missing', label: STATUS_LABELS.missing }
]

const calendarRange = computed(() => {
  const end = dayjs().startOf('day')
  const start = end.subtract(29, 'day')
  return { start, end }
})

const calendarRangeText = computed(() => {
  const { start, end } = calendarRange.value
  return `${start.format('YYYY-MM-DD')} ~ ${end.format('YYYY-MM-DD')}`
})

const calendarDates = computed(() => {
  const dates = []
  const { start, end } = calendarRange.value
  let cursor = start.clone()
  while (cursor.isBefore(end) || cursor.isSame(end, 'day')) {
    dates.push(cursor.format('YYYY-MM-DD'))
    cursor = cursor.add(1, 'day')
  }
  return dates.reverse()
})

const calendarGridStyle = computed(() => {
  const columns = Math.max(calendarDates.value.length, 1)
  return {
    gridTemplateColumns: `180px repeat(${columns}, minmax(32px, 1fr))`
  }
})

const statusTag = status => {
  if (status === 'success') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'processing') return 'warning'
  if (status === 'skipped') return 'info'
  return 'info'
}

const stopAutoUpload = () => false

const toDay = value => {
  if (!value) return null
  const parsed = dayjs(value).startOf('day')
  return parsed.isValid() ? parsed : null
}

const normalizeStatus = status => {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'success') return 'success'
  if (normalized === 'skipped') return 'skipped'
  if (normalized === 'processing') return 'processing'
  if (normalized === 'failed') return 'failed'
  return 'failed'
}

const resolveRecordRange = record => {
  let start = toDay(record?.date_start)
  let end = toDay(record?.date_end)
  if (!start && end) start = end
  if (!end && start) end = start
  if (!start && !end) {
    const created = toDay(record?.created_at)
    if (!created) return null
    start = created
    end = created
  }
  return { start, end }
}

const calendarStatusMap = computed(() => {
  const result = {}
  const { start: rangeStart, end: rangeEnd } = calendarRange.value
  for (const record of calendarRecords.value) {
    const type = record?.type
    if (!type) continue
    const range = resolveRecordRange(record)
    if (!range) continue
    let { start, end } = range
    if (!start || !end) continue
    if (end.isBefore(start)) {
      const temp = start
      start = end
      end = temp
    }
    if (end.isBefore(rangeStart) || start.isAfter(rangeEnd)) continue
    const status = normalizeStatus(record?.status)
    if (!result[type]) {
      result[type] = {}
    }
    let cursor = start.isBefore(rangeStart) ? rangeStart : start
    const limitEnd = end.isAfter(rangeEnd) ? rangeEnd : end
    while (cursor.isBefore(limitEnd) || cursor.isSame(limitEnd, 'day')) {
      const key = cursor.format('YYYY-MM-DD')
      const current = result[type][key]
      const currentPriority = current ? STATUS_PRIORITY[current] ?? 0 : 0
      const nextPriority = STATUS_PRIORITY[status] ?? 0
      if (nextPriority >= currentPriority) {
        result[type][key] = status
      }
      cursor = cursor.add(1, 'day')
    }
  }
  return result
})

const calendarRows = computed(() => {
  const map = calendarStatusMap.value
  return uploadTypes.map(item => {
    const cells = calendarDates.value.map(date => {
      const status = map[item.value]?.[date] ?? 'missing'
      return {
        date,
        status,
        tooltip: `${date} ${item.label}：${STATUS_LABELS[status] || status}`
      }
    })
    const coverage = cells.filter(cell => POSITIVE_STATUS.has(cell.status)).length
    return {
      ...item,
      calendar: cells,
      coverage,
      total: cells.length
    }
  })
})

const handleFileChange = uploadFile => {
  if (!uploadFile || !uploadFile.raw) {
    uploadForm.file = null
    selectedFileName.value = ''
    return
  }
  uploadForm.file = uploadFile.raw
  selectedFileName.value = uploadFile.name
}

const triggerUpload = async () => {
  if (!uploadForm.type) {
    ElMessage.warning('请先选择数据类型')
    return
  }
  if (!uploadForm.file) {
    ElMessage.warning('请先选择 Excel 文件')
    return
  }

  const formData = new FormData()
  formData.append('type', uploadForm.type)
  formData.append('file', uploadForm.file)

  uploading.value = true
  try {
    const response = await uploadMeituanData(formData)
    if (response?.code !== 0) {
      throw new Error(response?.message || '上传失败')
    }
    const payload = response?.data
    lastResult.value = payload || null
    ElMessage.success(response?.message || '上传成功，已写入数据库')
    resetUpload()
    pagination.current = 1
    await loadRecords()
    await loadCalendarData()
  } catch (error) {
    ElMessage.error(error?.message || '上传失败，请检查文件内容')
  } finally {
    uploading.value = false
  }
}

const resetUpload = () => {
  uploadForm.file = null
  selectedFileName.value = ''
  uploadRef.value?.clearFiles?.()
}

const handleFilter = () => {
  pagination.current = 1
  loadRecords()
}

const handlePageChange = page => {
  pagination.current = page
  loadRecords()
}

const loadRecords = async () => {
  recordLoading.value = true
  try {
    const params = {
      page: pagination.current,
      per_page: pagination.pageSize,
      type: filters.type || undefined,
      status: filters.status || undefined,
      date_start: filters.dateRange?.[0] || undefined,
      date_end: filters.dateRange?.[1] || undefined
    }
    const response = await fetchMeituanUploadRecords(params)
    if (response?.code !== 0) {
      throw new Error(response?.message || '获取失败')
    }
    const data = response.data || {}
    records.value = data.data || []
    pagination.total = data.total || 0
    pagination.pageSize = data.per_page || pagination.pageSize
  } catch (error) {
    ElMessage.error(error?.message || '记录获取失败')
  } finally {
    recordLoading.value = false
  }
}

const loadCalendarData = async () => {
  calendarLoading.value = true
  try {
    const startBoundary = calendarRange.value.start
    const boundaryThreshold = startBoundary.subtract(2, 'day')
    const collected = []
    let page = 1
    while (page <= MAX_CALENDAR_PAGES) {
      const response = await fetchMeituanUploadRecords({ page, per_page: CALENDAR_PAGE_SIZE })
      if (response?.code !== 0) {
        throw new Error(response?.message || '上传记录获取失败')
      }
      const data = response.data || {}
      const list = data.data || []
      if (!list.length) {
        break
      }
      collected.push(...list)
      const oldest = list[list.length - 1]
      const oldestDay = toDay(oldest?.created_at)
      if (oldestDay && oldestDay.isBefore(boundaryThreshold)) {
        break
      }
      const total = data.total || 0
      const perPage = data.per_page || CALENDAR_PAGE_SIZE
      if (perPage <= 0 || page * perPage >= total) {
        break
      }
      page += 1
    }
    const unique = []
    const seen = new Set()
    for (const item of collected) {
      const key = item?.id ?? `${item?.type}-${item?.created_at}-${item?.original_filename}`
      if (seen.has(key)) {
        continue
      }
      seen.add(key)
      unique.push(item)
    }
    calendarRecords.value = unique
  } catch (error) {
    ElMessage.error(error?.message || '上传日历加载失败')
  } finally {
    calendarLoading.value = false
  }
}

onMounted(() => {
  uploadForm.type = uploadTypes[0]?.value || ''
  loadRecords()
  loadCalendarData()
})

const formatDate = date => dayjs(date).format('MM-DD')
const formatWeekday = date => WEEK_LABELS[dayjs(date).day()]
</script>

<style scoped>
.meituan-upload-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100%;
}

.mt-card {
  background: #fff;
}

.mt-section {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 15px;
  font-weight: 600;
}

.card-header small {
  font-weight: normal;
  color: #909399;
}

.calendar-card {
  min-height: 360px;
}

.calendar-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.calendar-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.calendar-wrapper {
  width: 100%;
  overflow-x: auto;
}

.calendar-grid {
  display: grid;
  gap: 8px;
  align-items: stretch;
  grid-auto-rows: minmax(56px, auto);
}

.calendar-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  background: #f3f5fb;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.type-header {
  align-items: center;
  background: #eef2ff;
}

.date-header {
  min-width: 72px;
}

.date-primary {
  font-weight: 600;
}

.date-secondary {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.type-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #f9fbff;
  border-radius: 10px;
  border: 1px solid #e4e7ed;
}

.type-info {
  display: flex;
  flex-direction: column;
}

.type-label {
  font-weight: 600;
  color: #303133;
}

.type-coverage {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.calendar-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
  min-width: 60px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #edf0f4;
}

.status-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: inline-block;
  background: #dcdfe6;
}

.calendar-cell.status-success .status-dot {
  background: #67c23a;
}

.calendar-cell.status-skipped .status-dot {
  background: #409eff;
}

.calendar-cell.status-processing .status-dot {
  background: #e6a23c;
}

.calendar-cell.status-failed .status-dot {
  background: #f56c6c;
}

.calendar-cell.status-missing .status-dot {
  background: #c0c4cc;
}

.calendar-legend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: #606266;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #dcdfe6;
  display: inline-block;
}

.legend-dot.status-success {
  background: #67c23a;
}

.legend-dot.status-skipped {
  background: #409eff;
}

.legend-dot.status-processing {
  background: #e6a23c;
}

.legend-dot.status-failed {
  background: #f56c6c;
}

.legend-dot.status-missing {
  background: #c0c4cc;
}

.upload-form {
  padding: 10px 4px;
}

.type-select {
  width: 260px;
}

.upload-block {
  width: 100%;
}

.upload-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 12px;
}

.selected-file {
  margin-top: 8px;
  color: #409eff;
  font-size: 13px;
}

.hint-list {
  margin: 0;
  padding-left: 18px;
  color: #606266;
  line-height: 1.6;
}

.record-filters {
  display: flex;
  align-items: center;
  gap: 12px;
}

.count-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.text-muted {
  color: #c0c4cc;
}

.text-success {
  color: #67c23a;
}

.text-warning {
  color: #e6a23c;
}

.pagination-bar {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.record-card {
  margin-top: 20px;
}

.result-alert {
  margin-top: 16px;
}

.result-title {
  margin: 0 0 4px;
  font-weight: 600;
}

.result-list {
  padding-left: 18px;
  margin: 0;
  line-height: 1.5;
  color: #606266;
}
</style>
