<template>
  <div class="data-upload">
    <!-- 上传区域 -->
    <el-card shadow="hover" class="upload-card">
      <template #header>
        <div class="card-header">
          <span class="title">数据上传</span>
          <el-tag type="info" size="small">支持 Excel/CSV 格式</el-tag>
        </div>
      </template>
      
      <div class="upload-content">
        <!-- 文件上传组件 -->
        <el-upload
          ref="uploadRef"
          class="upload-dragger"
          drag
          :action="uploadUrl"
          :before-upload="beforeUpload"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
          :on-progress="handleUploadProgress"
          :on-change="handleFileChange"
          :show-file-list="false"
          :auto-upload="false"
          accept=".xlsx,.xls,.csv"
          :limit="1"
          multiple="false"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              <p>文件名格式：42083878_YYYY-MM-DD_表名_YYYY-MM-DD[_数字].csv</p>
              <p>示例：42083878_2025-06-01_DETAIL_2025-06-03_46779.csv</p>
              <p>表名必须为：AGENT_MCH_SUM、DETAIL 或 RESELLER_SUM</p>
              <p>只能上传 xlsx/xls/csv 文件，且不超过 10MB</p>
            </div>
          </template>
        </el-upload>

        <!-- 选中的文件信息 -->
        <div v-if="selectedFile" class="file-info">
          <el-card shadow="never" class="file-card">
            <div class="file-details">
              <div class="file-name">
                <el-icon><Document /></el-icon>
                <span>{{ selectedFile.name }}</span>
              </div>
              <div class="file-meta">
                <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
                <span class="file-type">{{ getFileType(selectedFile.name) }}</span>
              </div>
              <div class="file-actions">
                <el-button 
                  type="primary" 
                  :loading="uploading"
                  @click="submitUpload"
                >
                  {{ uploading ? '上传中...' : '开始上传' }}
                </el-button>
                <el-button @click="clearFile">取消</el-button>
              </div>
            </div>
            
            <!-- 上传进度 -->
            <div v-if="uploading" class="upload-progress">
              <el-progress 
                :percentage="uploadProgress" 
                :status="uploadStatus"
                :stroke-width="6"
              />
            </div>
          </el-card>
        </div>
      </div>
    </el-card>

    <!-- 上传历史 -->
    <el-card shadow="hover" class="history-card">
      <template #header>
        <div class="card-header">
          <span class="title">上传历史</span>
          <div class="actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索文件名"
              style="width: 200px; margin-right: 10px;"
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button @click="refreshHistory">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="history-content">
        <el-table 
          :data="uploadHistory" 
          v-loading="historyLoading"
          stripe
          style="width: 100%"
        >
          <el-table-column prop="filename" label="文件名" min-width="300">
            <template #default="scope">
              <div class="filename-cell">
                <el-icon><Document /></el-icon>
                <span>{{ scope.row.filename }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="data_time" label="数据时间" width="120" align="center" />
          
          <el-table-column prop="table_name" label="数据表" width="150" align="center">
            <template #default="scope">
              <el-tag 
                :type="getTableTagType(scope.row.table_name)" 
                size="small"
              >
                {{ scope.row.table_name }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="file_size" label="文件大小" width="100" align="center">
            <template #default="scope">
              {{ formatFileSize(scope.row.file_size) }}
            </template>
          </el-table-column>
          
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="scope">
              <el-tag 
                :type="scope.row.status === 'success' ? 'success' : 'danger'" 
                size="small"
              >
                {{ scope.row.status === 'success' ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="message" label="处理结果" min-width="200">
            <template #default="scope">
              <span class="message-text">{{ scope.row.message }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="created_at" label="上传时间" width="160" align="center" />
          
          <el-table-column label="操作" width="120" align="center">
            <template #default="scope">
              <el-button 
                type="danger" 
                size="small" 
                @click="deleteUploadRecord(scope.row)"
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
            v-model:page-size="pagination.size"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, Document, Search, Refresh } from '@element-plus/icons-vue'
import { uploadData, getUploadLogs, deleteUploadLog } from '@/api/shengfutong'

// 上传相关
const uploadRef = ref(null)
const uploadUrl = '/api/admin/v1/shengfutong/upload'
const selectedFile = ref(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref('')

// 历史记录相关
const uploadHistory = ref([])
const historyLoading = ref(false)
const searchKeyword = ref('')

// 分页
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// 文件变化处理（新增）
const handleFileChange = (file, fileList) => {
  console.log('File changed:', file, fileList)
  
  // 如果文件被移除，清空选中文件
  if (fileList.length === 0) {
    selectedFile.value = null
    return
  }
  
  // 获取实际的文件对象
  const actualFile = file.raw || file
  console.log('Actual file:', actualFile)
  
  // 验证文件
  const isValid = validateFile(actualFile)
  if (isValid) {
    selectedFile.value = actualFile
    console.log('File selected successfully:', selectedFile.value.name, selectedFile.value.size)
    ElMessage.success(`文件 "${actualFile.name}" 选择成功，可以开始上传`)
  } else {
    // 验证失败，清除文件
    uploadRef.value?.clearFiles()
    selectedFile.value = null
  }
}

// 文件验证函数（重构）
const validateFile = (file) => {
  console.log('Validating file:', file)
  
  // 验证文件大小
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('上传文件大小不能超过 10MB!')
    return false
  }

  // 验证文件格式
  const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
                     'application/vnd.ms-excel', 
                     'text/csv']
  const validExtensions = /\.(xlsx|xls|csv)$/i
  
  if (!validTypes.includes(file.type) && !validExtensions.test(file.name)) {
    ElMessage.error('只能上传 Excel 或 CSV 格式的文件!')
    return false
  }

  // 验证文件名格式（支持新格式：DETAIL表可以有后缀数字）
  const filenamePattern = /^42083878_\d{4}-\d{2}-\d{2}_(AGENT_MCH_SUM|DETAIL|RESELLER_SUM)_\d{4}-\d{2}-\d{2}(_\d+)?\.(csv|xlsx|xls)$/i
  if (!filenamePattern.test(file.name)) {
    ElMessage.error('文件名格式不正确！请按照规定格式命名文件：42083878_YYYY-MM-DD_表名_YYYY-MM-DD.csv 或 42083878_YYYY-MM-DD_DETAIL_YYYY-MM-DD_数字.csv')
    console.log('文件名验证失败:', file.name, '期望格式:', filenamePattern)
    return false
  }
  
  console.log('文件验证通过:', file.name)

  return true
}

// 文件验证（保持原有逻辑，但简化）
const beforeUpload = (file) => {
  console.log('Before upload:', file)
  
  // 验证文件
  const isValid = validateFile(file)
  if (!isValid) {
    return false
  }

  // 阻止自动上传，使用手动上传
  console.log('File validation passed, preventing auto upload')
  return false
}

// 手动上传
const submitUpload = async () => {
  if (!selectedFile.value) {
    ElMessage.error('请先选择文件')
    return
  }

  console.log('Starting upload:', selectedFile.value)

  const formData = new FormData()
  formData.append('file', selectedFile.value)

  uploading.value = true
  uploadProgress.value = 0
  uploadStatus.value = ''

  try {
    console.log('Calling uploadData API...')
    const response = await uploadData(formData)
    console.log('Upload response:', response)
    
    if (response.code === 200) {
      uploadProgress.value = 100
      uploadStatus.value = 'success'
      ElMessage.success('文件上传成功！')
      
      // 清除选中的文件
      clearFile()
      
      // 刷新历史记录
      await fetchUploadHistory()
    } else {
      uploadStatus.value = 'exception'
      ElMessage.error(response.message || '上传失败')
    }
  } catch (error) {
    uploadStatus.value = 'exception'
    console.error('Upload error:', error)
    ElMessage.error('上传失败: ' + (error.message || '网络错误'))
  } finally {
    uploading.value = false
  }
}

// 上传进度
const handleUploadProgress = (event) => {
  console.log('Upload progress:', event)
  uploadProgress.value = Math.round((event.loaded / event.total) * 100)
}

// 上传成功
const handleUploadSuccess = (response) => {
  console.log('Upload success:', response)
  ElMessage.success('上传成功！')
  clearFile()
  fetchUploadHistory()
}

// 上传失败
const handleUploadError = (error) => {
  console.error('Upload error:', error)
  ElMessage.error('上传失败')
  uploading.value = false
}

// 清除文件
const clearFile = () => {
  selectedFile.value = null
  uploadProgress.value = 0
  uploadStatus.value = ''
  uploading.value = false
  uploadRef.value?.clearFiles()
}

// 获取上传历史
const fetchUploadHistory = async () => {
  historyLoading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      search: searchKeyword.value
    }
    
    const response = await getUploadLogs(params)
    if (response.code === 200) {
      uploadHistory.value = response.data.list || []
      pagination.total = response.data.total || 0
    } else {
      ElMessage.error(response.message || '获取上传历史失败')
    }
  } catch (error) {
    console.error('Error fetching upload history:', error)
    ElMessage.error('获取上传历史失败')
  } finally {
    historyLoading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchUploadHistory()
}

// 刷新历史
const refreshHistory = () => {
  fetchUploadHistory()
}

// 删除上传记录
const deleteUploadRecord = async (record) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文件 "${record.filename}" 的上传记录吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await deleteUploadLog(record.id)
    if (response.code === 200) {
    ElMessage.success('删除成功')
    await fetchUploadHistory()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete upload record error:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  fetchUploadHistory()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchUploadHistory()
}

// 工具函数
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileType = (filename) => {
  const ext = filename.split('.').pop().toLowerCase()
  const typeMap = {
    'xlsx': 'Excel',
    'xls': 'Excel',
    'csv': 'CSV'
  }
  return typeMap[ext] || '未知'
}

const getTableTagType = (tableName) => {
  const typeMap = {
    'DETAIL': 'primary',
    'AGENT_MCH_SUM': 'success',
    'RESELLER_SUM': 'warning'
  }
  return typeMap[tableName] || 'info'
}

onMounted(() => {
  fetchUploadHistory()
})
</script>

<style scoped>
.data-upload {
  padding: 20px;
}

.upload-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-weight: 600;
  font-size: 16px;
}

.upload-content {
  padding: 20px 0;
}

.upload-dragger {
  width: 100%;
}

.file-info {
  margin-top: 20px;
}

.file-card {
  border: 1px dashed #d9d9d9;
  background-color: #fafafa;
}

.file-details {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 15px;
}

.file-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  flex: 1;
  min-width: 200px;
}

.file-meta {
  display: flex;
  gap: 15px;
  color: #666;
  font-size: 14px;
}

.file-actions {
  display: flex;
  gap: 10px;
}

.upload-progress {
  margin-top: 15px;
}

.history-card {
  margin-bottom: 20px;
}

.history-content {
  padding: 20px 0;
}

.filename-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.message-text {
  color: #666;
  font-size: 14px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.el-upload__tip {
  color: #666;
  font-size: 12px;
  line-height: 1.5;
}

.el-upload__tip p {
  margin: 2px 0;
}
</style> 