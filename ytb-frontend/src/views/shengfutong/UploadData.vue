<template>
  <div class="upload-data-container">
    <div class="page-header">
      <h2>数据上传</h2>
      <p class="description">上传盛付通数据文件，支持CSV格式</p>
    </div>

    <!-- 上传区域 -->
    <div class="upload-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>文件上传</span>
          </div>
        </template>
        
        <div class="upload-area">
          <el-upload
            ref="uploadRef"
            class="upload-dragger"
            drag
            :action="uploadUrl"
            :headers="uploadHeaders"
            :before-upload="beforeUpload"
            :on-success="onUploadSuccess"
            :on-error="onUploadError"
            :show-file-list="false"
            accept=".csv,.xlsx,.xls"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                <p>文件名格式：42083878_YYYY-MM-DD_表名_YYYY-MM-DD.csv</p>
                <p>表名支持：AGENT_MCH_SUM（代理商户汇总）、DETAIL（交易明细）、RESELLER_SUM（渠道商汇总）</p>
                <p>只能上传 csv/xlsx/xls 文件，且不超过 50MB</p>
              </div>
            </template>
          </el-upload>
        </div>
      </el-card>
    </div>

    <!-- 上传日志 -->
    <div class="logs-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>上传日志</span>
            <div class="header-actions">
              <el-input
                v-model="searchText"
                placeholder="搜索文件名"
                style="width: 200px; margin-right: 10px;"
                clearable
                @input="handleSearch"
              />
              <el-select
                v-model="statusFilter"
                placeholder="状态筛选"
                style="width: 120px; margin-right: 10px;"
                clearable
                @change="handleSearch"
              >
                <el-option label="全部" value="" />
                <el-option label="成功" value="success" />
                <el-option label="失败" value="failed" />
                <el-option label="处理中" value="processing" />
              </el-select>
              <el-select
                v-model="tableFilter"
                placeholder="表名筛选"
                style="width: 150px; margin-right: 10px;"
                clearable
                @change="handleSearch"
              >
                <el-option label="全部" value="" />
                <el-option label="代理商户汇总" value="ddg_sft_agent_mch_sum" />
                <el-option label="交易明细" value="ddg_sft_detail" />
                <el-option label="渠道商汇总" value="ddg_sft_reseller_sum" />
              </el-select>
              <el-button @click="refreshLogs" :icon="Refresh">刷新</el-button>
            </div>
          </div>
        </template>

        <el-table
          v-loading="loading"
          :data="uploadLogs"
          style="width: 100%"
          stripe
        >
          <el-table-column prop="filename" label="文件名" min-width="200" />
          <el-table-column prop="data_time" label="数据时间" width="100" />
          <el-table-column prop="table_name_text" label="表名" width="120" />
          <el-table-column prop="file_size_formatted" label="文件大小" width="100" />
          <el-table-column prop="processed_rows" label="处理行数" width="100" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag
                :type="getStatusType(scope.row.status)"
                size="small"
              >
                {{ scope.row.status_text }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="uploader_name" label="上传者" width="100" />
          <el-table-column prop="created_at" label="上传时间" width="160" />
          <el-table-column prop="message" label="消息" min-width="200" show-overflow-tooltip />
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="scope">
              <el-button
                type="danger"
                size="small"
                @click="deleteLog(scope.row)"
                :icon="Delete"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, Refresh, Delete } from '@element-plus/icons-vue'
import { uploadFile, getUploadLogs, deleteUploadLog } from '@/api/shengfutong'
import { getToken } from '@/utils/auth'

// 响应式数据
const uploadRef = ref()
const loading = ref(false)
const uploadLogs = ref([])
const searchText = ref('')
const statusFilter = ref('')
const tableFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 上传配置
const uploadUrl = ref('/api/admin/v1/shengfutong/upload')
const uploadHeaders = reactive({
  'Authorization': `Bearer ${getToken()}`
})

// 生命周期
onMounted(() => {
  fetchUploadLogs()
})

// 方法
const beforeUpload = (file) => {
  // 检查文件类型
  const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
    ElMessage.error('只能上传 CSV、Excel 文件!')
    return false
  }

  // 检查文件大小
  const isLt50M = file.size / 1024 / 1024 < 50
  if (!isLt50M) {
    ElMessage.error('上传文件大小不能超过 50MB!')
    return false
  }

  // 检查文件名格式（支持新格式：DETAIL表可以有后缀数字）
  const filenamePattern = /^42083878_\d{4}-\d{2}-\d{2}_(AGENT_MCH_SUM|DETAIL|RESELLER_SUM)_\d{4}-\d{2}-\d{2}(_\d+)?\.(csv|xlsx|xls)$/i
  if (!filenamePattern.test(file.name)) {
    ElMessage.error('文件名格式不正确！请按照规定格式命名文件：42083878_YYYY-MM-DD_表名_YYYY-MM-DD.csv 或 42083878_YYYY-MM-DD_DETAIL_YYYY-MM-DD_数字.csv')
    return false
  }

  return true
}

const onUploadSuccess = (response, file) => {
  if (response.code === 200) {
    ElMessage.success(response.message || '上传成功')
    fetchUploadLogs() // 刷新日志列表
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

const onUploadError = (error, file) => {
  console.error('Upload error:', error)
  ElMessage.error('上传失败，请重试')
}

const fetchUploadLogs = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      search: searchText.value,
      status: statusFilter.value,
      table_name: tableFilter.value
    }

    const response = await getUploadLogs(params)
    if (response.code === 200) {
      uploadLogs.value = response.data.list
      total.value = response.data.total
    } else {
      ElMessage.error(response.message || '获取上传日志失败')
    }
  } catch (error) {
    console.error('Fetch upload logs error:', error)
    ElMessage.error('获取上传日志失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchUploadLogs()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  fetchUploadLogs()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchUploadLogs()
}

const refreshLogs = () => {
  fetchUploadLogs()
}

const deleteLog = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文件 "${row.filename}" 的上传日志吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const response = await deleteUploadLog(row.id)
    if (response.code === 200) {
      ElMessage.success('删除成功')
      fetchUploadLogs()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete log error:', error)
      ElMessage.error('删除失败')
    }
  }
}

const getStatusType = (status) => {
  const statusMap = {
    'success': 'success',
    'failed': 'danger',
    'processing': 'warning'
  }
  return statusMap[status] || 'info'
}
</script>

<style scoped>
.upload-data-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.description {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.upload-section {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
}

.upload-area {
  padding: 20px 0;
}

.upload-dragger {
  width: 100%;
}

.logs-section {
  margin-top: 20px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: 180px;
}

:deep(.el-upload__tip) {
  margin-top: 10px;
  color: #606266;
  font-size: 12px;
  line-height: 1.5;
}

:deep(.el-upload__tip p) {
  margin: 4px 0;
}
</style> 