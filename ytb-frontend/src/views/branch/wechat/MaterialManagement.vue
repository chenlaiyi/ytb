<template>
  <div class="branch-wechat-material">
    <div class="page-header">
      <div class="header-left">
        <h2>素材管理</h2>
        <p>管理分支机构公众号的多媒体素材</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showUploadDialog = true">
          <el-icon><Upload /></el-icon>
          上传素材
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section" v-if="stats">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.total_materials || 0 }}</div>
              <div class="stat-label">总素材数</div>
            </div>
            <el-icon class="stat-icon"><Picture /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.image_count || 0 }}</div>
              <div class="stat-label">图片素材</div>
            </div>
            <el-icon class="stat-icon"><Picture /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.voice_count || 0 }}</div>
              <div class="stat-label">语音素材</div>
            </div>
            <el-icon class="stat-icon"><Microphone /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.video_count || 0 }}</div>
              <div class="stat-label">视频素材</div>
            </div>
            <el-icon class="stat-icon"><VideoPlay /></el-icon>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 筛选标签 -->
    <el-card shadow="never" class="filter-card">
      <div class="filter-tabs">
        <el-radio-group v-model="activeType" @change="handleTypeChange">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button label="image">图片</el-radio-button>
          <el-radio-button label="voice">语音</el-radio-button>
          <el-radio-button label="video">视频</el-radio-button>
          <el-radio-button label="thumb">缩略图</el-radio-button>
        </el-radio-group>
        
        <div class="filter-actions">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索素材名称"
            clearable
            style="width: 200px;"
            @keyup.enter="loadMaterials"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button @click="loadMaterials">搜索</el-button>
        </div>
      </div>
    </el-card>

    <!-- 素材列表 -->
    <el-card shadow="never" class="materials-card">
      <template #header>
        <div class="card-header">
          <span>素材列表</span>
          <div class="view-controls">
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button label="grid">网格</el-radio-button>
              <el-radio-button label="list">列表</el-radio-button>
            </el-radio-group>
            <el-button size="small" @click="loadMaterials">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 网格视图 -->
      <div v-if="viewMode === 'grid'" v-loading="loading" class="grid-view">
        <div v-if="materialsList.length === 0" class="empty-state">
          <el-empty description="暂无素材" />
        </div>
        <div v-else class="materials-grid">
          <div 
            v-for="material in materialsList" 
            :key="material.media_id"
            class="material-card"
            @click="previewMaterial(material)"
          >
            <div class="material-preview">
              <img 
                v-if="material.type === 'image' || material.type === 'thumb'"
                :src="material.url || material.thumb_url" 
                :alt="material.name"
                class="material-image"
              />
              <div v-else-if="material.type === 'voice'" class="voice-preview">
                <el-icon size="48"><Microphone /></el-icon>
                <p>{{ material.name }}</p>
              </div>
              <div v-else-if="material.type === 'video'" class="video-preview">
                <video 
                  :src="material.url" 
                  :poster="material.thumb_url"
                  class="material-video"
                  controls
                  preload="metadata"
                ></video>
              </div>
              <div v-else class="unknown-preview">
                <el-icon size="48"><Document /></el-icon>
                <p>{{ material.name }}</p>
              </div>
            </div>
            
            <div class="material-info">
              <div class="material-name" :title="material.name">
                {{ material.name || '未命名' }}
              </div>
              <div class="material-meta">
                <el-tag size="small" :type="getTypeTagType(material.type)">
                  {{ getTypeName(material.type) }}
                </el-tag>
                <span class="material-time">{{ formatTime(material.update_time) }}</span>
              </div>
            </div>
            
            <div class="material-actions">
              <el-button size="small" @click.stop="downloadMaterial(material)">
                <el-icon><Download /></el-icon>
              </el-button>
              <el-button size="small" type="danger" @click.stop="deleteMaterial(material)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-else v-loading="loading">
        <el-table :data="materialsList" style="width: 100%">
          <el-table-column label="预览" width="80">
            <template #default="{ row }">
              <div class="table-preview">
                <img 
                  v-if="row.type === 'image' || row.type === 'thumb'"
                  :src="row.url || row.thumb_url" 
                  class="table-thumb"
                  @click="previewMaterial(row)"
                />
                <el-icon v-else-if="row.type === 'voice'" size="24"><Microphone /></el-icon>
                <el-icon v-else-if="row.type === 'video'" size="24"><VideoPlay /></el-icon>
                <el-icon v-else size="24"><Document /></el-icon>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="素材名称" min-width="200">
            <template #default="{ row }">
              <div class="material-name-cell">
                <span>{{ row.name || '未命名' }}</span>
                <div class="material-id">ID: {{ row.media_id }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getTypeTagType(row.type)" size="small">
                {{ getTypeName(row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="大小" width="100">
            <template #default="{ row }">
              <span>{{ formatFileSize(row.size) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="更新时间" width="160">
            <template #default="{ row }">
              <span>{{ formatTime(row.update_time) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="previewMaterial(row)">预览</el-button>
              <el-button size="small" @click="downloadMaterial(row)">下载</el-button>
              <el-button size="small" type="danger" @click="deleteMaterial(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.current_page"
          v-model:page-size="pagination.per_page"
          :total="pagination.total"
          :page-sizes="[20, 40, 60, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 上传对话框 -->
    <el-dialog v-model="showUploadDialog" title="上传素材" width="600px">
      <el-form :model="uploadForm" label-width="80px">
        <el-form-item label="素材类型">
          <el-radio-group v-model="uploadForm.type">
            <el-radio label="image">图片</el-radio>
            <el-radio label="voice">语音</el-radio>
            <el-radio label="video">视频</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="选择文件">
          <el-upload
            ref="uploadRef"
            :action="uploadAction"
            :headers="uploadHeaders"
            :data="uploadData"
            :before-upload="beforeUpload"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :file-list="fileList"
            :accept="getAcceptTypes()"
            drag
            multiple
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                {{ getUploadTip() }}
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmUpload">确定上传</el-button>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog v-model="showPreviewDialog" :title="previewMaterial?.name" width="800px">
      <div v-if="previewMaterial" class="preview-content">
        <img 
          v-if="previewMaterial.type === 'image' || previewMaterial.type === 'thumb'"
          :src="previewMaterial.url" 
          class="preview-image"
        />
        <audio 
          v-else-if="previewMaterial.type === 'voice'"
          :src="previewMaterial.url"
          controls
          class="preview-audio"
        ></audio>
        <video 
          v-else-if="previewMaterial.type === 'video'"
          :src="previewMaterial.url"
          controls
          class="preview-video"
        ></video>
        
        <div class="preview-info">
          <p><strong>素材ID:</strong> {{ previewMaterial.media_id }}</p>
          <p><strong>类型:</strong> {{ getTypeName(previewMaterial.type) }}</p>
          <p><strong>大小:</strong> {{ formatFileSize(previewMaterial.size) }}</p>
          <p><strong>更新时间:</strong> {{ formatTime(previewMaterial.update_time) }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Upload,
  UploadFilled,
  Download,
  Delete,
  Search,
  Refresh,
  Picture,
  Microphone,
  VideoPlay,
  Document
} from '@element-plus/icons-vue'
import * as branchWechatMaterialsApi from '@/api/branchWechatMaterials'
import { getAdminToken } from '@/utils/admin-token-bridge'

const route = useRoute()
const branchId = route.params.branchId

// 响应式数据
const loading = ref(false)
const stats = ref(null)
const materialsList = ref([])
const activeType = ref('')
const searchKeyword = ref('')
const viewMode = ref('grid')

// 分页
const pagination = reactive({
  current_page: 1,
  per_page: 20,
  total: 0
})

// 上传相关
const showUploadDialog = ref(false)
const uploadForm = reactive({
  type: 'image'
})
const fileList = ref([])
const uploadRef = ref()

// 预览相关
const showPreviewDialog = ref(false)
const previewMaterialData = ref(null)

// 计算属性
const uploadAction = computed(() => {
  return `/admin/api/branch/${branchId}/wechat/materials/upload`
})

const uploadHeaders = computed(() => {
  return {
    'Authorization': `Bearer ${getAdminToken()}`,
    'X-Requested-With': 'XMLHttpRequest'
  }
})

const uploadData = computed(() => {
  return {
    type: uploadForm.type
  }
})

// 生命周期
onMounted(() => {
  loadStats()
  loadMaterials()
})

// 方法
const loadStats = async () => {
  try {
    const response = await branchWechatMaterialsApi.getMaterialStats(branchId)
    if (response.code === 0) {
      stats.value = response.data
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const loadMaterials = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.current_page,
      per_page: pagination.per_page,
      type: activeType.value,
      keyword: searchKeyword.value
    }
    
    const response = await branchWechatMaterialsApi.getMaterialList(branchId, params)
    if (response.code === 0) {
      materialsList.value = response.data.data || []
      pagination.total = response.data.total || 0
      pagination.current_page = response.data.current_page || 1
      pagination.per_page = response.data.per_page || 20
    } else {
      ElMessage.error(response.message || '加载素材列表失败')
    }
  } catch (error) {
    console.error('加载素材列表失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const handleTypeChange = () => {
  pagination.current_page = 1
  loadMaterials()
}

const getTypeName = (type) => {
  const typeMap = {
    'image': '图片',
    'voice': '语音',
    'video': '视频',
    'thumb': '缩略图'
  }
  return typeMap[type] || type
}

const getTypeTagType = (type) => {
  const typeMap = {
    'image': 'success',
    'voice': 'warning',
    'video': 'primary',
    'thumb': 'info'
  }
  return typeMap[type] || 'info'
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time * 1000).toLocaleString('zh-CN')
}

const formatFileSize = (size) => {
  if (!size) return '-'
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  return (size / (1024 * 1024)).toFixed(1) + ' MB'
}

const previewMaterial = (material) => {
  previewMaterialData.value = material
  showPreviewDialog.value = true
}

const downloadMaterial = async (material) => {
  try {
    const response = await branchWechatMaterialsApi.downloadMaterial(branchId, material.media_id)
    if (response.code === 0) {
      // 创建下载链接
      const link = document.createElement('a')
      link.href = response.data.download_url
      link.download = material.name || `material_${material.media_id}`
      link.click()
    } else {
      ElMessage.error(response.message || '下载失败')
    }
  } catch (error) {
    console.error('下载素材失败:', error)
    ElMessage.error('下载失败')
  }
}

const deleteMaterial = async (material) => {
  try {
    await ElMessageBox.confirm('确定要删除这个素材吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const response = await branchWechatMaterialsApi.deleteMaterial(branchId, material.media_id)
    if (response.code === 0) {
      ElMessage.success('删除成功')
      loadMaterials()
      loadStats()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除素材失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const getAcceptTypes = () => {
  const typeMap = {
    'image': 'image/*',
    'voice': 'audio/*',
    'video': 'video/*'
  }
  return typeMap[uploadForm.type] || '*/*'
}

const getUploadTip = () => {
  const tipMap = {
    'image': '支持jpg、png、gif格式，大小不超过10MB',
    'voice': '支持mp3、wma、wav、amr格式，大小不超过2MB，时长不超过60s',
    'video': '支持mp4格式，大小不超过10MB'
  }
  return tipMap[uploadForm.type] || ''
}

const beforeUpload = (file) => {
  const sizeLimit = uploadForm.type === 'voice' ? 2 : 10
  const isLt = file.size / 1024 / 1024 < sizeLimit
  
  if (!isLt) {
    ElMessage.error(`文件大小不能超过 ${sizeLimit}MB!`)
    return false
  }
  
  return true
}

const handleUploadSuccess = (response, file) => {
  if (response.code === 0) {
    ElMessage.success('上传成功')
    loadMaterials()
    loadStats()
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

const handleUploadError = (error) => {
  console.error('上传失败:', error)
  ElMessage.error('上传失败')
}

const confirmUpload = () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先选择要上传的文件')
    return
  }
  
  uploadRef.value?.submit()
  showUploadDialog.value = false
}

const handlePageChange = (page) => {
  pagination.current_page = page
  loadMaterials()
}
</script>

<style scoped>
.branch-wechat-material {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left h2 {
  margin: 0 0 4px 0;
  color: #303133;
}

.header-left p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.stats-section {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.stat-icon {
  font-size: 32px;
  color: #409eff;
  margin-top: 8px;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-tabs {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.materials-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.view-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.grid-view {
  min-height: 400px;
}

.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.material-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.material-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.material-card:hover .material-actions {
  opacity: 1;
}

.material-preview {
  width: 100%;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  overflow: hidden;
}

.material-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.material-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.voice-preview,
.video-preview,
.unknown-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #909399;
}

.voice-preview p,
.unknown-preview p {
  margin: 0;
  font-size: 12px;
  text-align: center;
  padding: 0 8px;
}

.material-info {
  padding: 12px;
}

.material-name {
  font-size: 14px;
  color: #303133;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.material-time {
  font-size: 12px;
  color: #909399;
}

.material-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s;
}

.table-preview {
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}

.material-name-cell .material-id {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.preview-content {
  text-align: center;
}

.preview-image {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
}

.preview-audio,
.preview-video {
  width: 100%;
  max-width: 600px;
  margin-bottom: 16px;
}

.preview-info {
  text-align: left;
  margin-top: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.preview-info p {
  margin: 8px 0;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
}
</style> 
