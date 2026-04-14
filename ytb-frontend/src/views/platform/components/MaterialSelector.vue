<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="material-selector">
      <!-- 素材类型切换 -->
      <div class="type-tabs">
        <el-tabs v-model="activeType" @tab-change="onTypeChange">
          <el-tab-pane label="图文消息" name="news" />
          <el-tab-pane label="图片" name="image" />
          <el-tab-pane label="语音" name="voice" />
          <el-tab-pane label="视频" name="video" />
        </el-tabs>
      </div>

      <!-- 搜索筛选 -->
      <div class="search-bar">
        <div class="search-input">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索素材..."
            :prefix-icon="Search"
            @input="onSearch"
            clearable
          />
        </div>
        <div class="filter-options">
          <el-select v-model="dateFilter" placeholder="创建时间" style="width: 120px;">
            <el-option label="全部" value="" />
            <el-option label="今天" value="today" />
            <el-option label="近7天" value="week" />
            <el-option label="近30天" value="month" />
          </el-select>
        </div>
      </div>

      <!-- 素材列表 -->
      <div class="material-list" v-loading="loading">
        <!-- 图文消息列表 -->
        <div v-if="activeType === 'news'" class="news-list">
          <div 
            v-for="item in materialList" 
            :key="item.media_id"
            class="news-item"
            :class="{ 'selected': selectedMaterial?.media_id === item.media_id }"
            @click="selectMaterial(item)"
          >
            <div class="news-cover">
              <img :src="item.thumb_url || '/admin/assets/images/default-news.png'" :alt="item.title" />
            </div>
            <div class="news-content">
              <div class="news-title">{{ item.title }}</div>
              <div class="news-digest">{{ item.digest || '暂无摘要' }}</div>
              <div class="news-meta">
                <span class="create-time">{{ formatTime(item.created_at) }}</span>
                <span class="author">{{ item.author || '未知' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 图片列表 -->
        <div v-if="activeType === 'image'" class="image-list">
          <div 
            v-for="item in materialList" 
            :key="item.media_id"
            class="image-item"
            :class="{ 'selected': selectedMaterial?.media_id === item.media_id }"
            @click="selectMaterial(item)"
          >
            <div class="image-preview">
              <img :src="item.url" :alt="item.name" />
            </div>
            <div class="image-info">
              <div class="image-name">{{ item.name }}</div>
              <div class="image-size">{{ formatFileSize(item.size) }}</div>
              <div class="create-time">{{ formatTime(item.created_at) }}</div>
            </div>
          </div>
        </div>

        <!-- 语音列表 -->
        <div v-if="activeType === 'voice'" class="voice-list">
          <div 
            v-for="item in materialList" 
            :key="item.media_id"
            class="voice-item"
            :class="{ 'selected': selectedMaterial?.media_id === item.media_id }"
            @click="selectMaterial(item)"
          >
            <div class="voice-icon">
              <el-icon><Microphone /></el-icon>
            </div>
            <div class="voice-info">
              <div class="voice-name">{{ item.name }}</div>
              <div class="voice-duration">时长：{{ formatDuration(item.duration) }}</div>
              <div class="create-time">{{ formatTime(item.created_at) }}</div>
            </div>
            <div class="voice-actions">
              <el-button type="text" @click.stop="playVoice(item)">
                <el-icon><VideoPlay /></el-icon>
              </el-button>
            </div>
          </div>
        </div>

        <!-- 视频列表 -->
        <div v-if="activeType === 'video'" class="video-list">
          <div 
            v-for="item in materialList" 
            :key="item.media_id"
            class="video-item"
            :class="{ 'selected': selectedMaterial?.media_id === item.media_id }"
            @click="selectMaterial(item)"
          >
            <div class="video-preview">
              <img :src="item.thumb_url || '/admin/assets/images/default-video.png'" :alt="item.title" />
              <div class="play-btn">
                <el-icon><VideoPlay /></el-icon>
              </div>
            </div>
            <div class="video-info">
              <div class="video-title">{{ item.title }}</div>
              <div class="video-description">{{ item.introduction || '暂无介绍' }}</div>
              <div class="video-meta">
                <span class="duration">{{ formatDuration(item.duration) }}</span>
                <span class="create-time">{{ formatTime(item.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!loading && materialList.length === 0" class="empty-state">
          <el-empty description="暂无素材" />
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrap" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="onPageChange"
          @size-change="onSizeChange"
        />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirmSelect"
          :disabled="!selectedMaterial"
        >
          确定选择
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Microphone, VideoPlay } from '@element-plus/icons-vue'
import { getWechatMaterials } from '@/api/branchWechatMenu'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  materialType: {
    type: String,
    default: 'news'
  },
  branchId: {
    type: [String, Number],
    required: true
  }
})

const emit = defineEmits(['update:visible', 'select'])

// 响应式数据
const dialogVisible = ref(false)
const activeType = ref('news')
const searchKeyword = ref('')
const dateFilter = ref('')
const loading = ref(false)
const materialList = ref([])
const selectedMaterial = ref(null)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 计算属性
const dialogTitle = computed(() => {
  const typeMap = {
    'news': '选择图文消息',
    'image': '选择图片',
    'voice': '选择语音',
    'video': '选择视频'
  }
  return typeMap[activeType.value] || '选择素材'
})

// 监听visible变化
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
  if (newVal) {
    activeType.value = props.materialType || 'news'
    loadMaterials()
  }
})

// 监听dialogVisible变化
watch(dialogVisible, (newVal) => {
  emit('update:visible', newVal)
  if (!newVal) {
    selectedMaterial.value = null
    searchKeyword.value = ''
    dateFilter.value = ''
  }
})

// 方法
const loadMaterials = async () => {
  try {
    loading.value = true
    const params = {
      type: activeType.value,
      keyword: searchKeyword.value,
      date_filter: dateFilter.value,
      page: currentPage.value,
      per_page: pageSize.value
    }
    
    const response = await getWechatMaterials(props.branchId, activeType.value, params)
    
    if (response.code === 0) {
      materialList.value = response.data.list || []
      total.value = response.data.total || 0
    } else {
      ElMessage.error(response.message || '加载素材失败')
    }
  } catch (error) {
    console.error('加载素材失败:', error)
    ElMessage.error('加载素材失败')
  } finally {
    loading.value = false
  }
}

const onTypeChange = (type) => {
  activeType.value = type
  currentPage.value = 1
  selectedMaterial.value = null
  loadMaterials()
}

const onSearch = () => {
  currentPage.value = 1
  loadMaterials()
}

const onPageChange = (page) => {
  currentPage.value = page
  loadMaterials()
}

const onSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  loadMaterials()
}

const selectMaterial = (material) => {
  selectedMaterial.value = material
}

const confirmSelect = () => {
  if (selectedMaterial.value) {
    emit('select', selectedMaterial.value)
    handleClose()
  }
}

const handleClose = () => {
  dialogVisible.value = false
}

const playVoice = (item) => {
  // 播放语音功能
  ElMessage.info('播放语音功能开发中...')
}

const formatTime = (timeString) => {
  if (!timeString) return ''
  const date = new Date(timeString)
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const formatFileSize = (bytes) => {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return size.toFixed(1) + units[unitIndex]
}

const formatDuration = (seconds) => {
  if (!seconds) return ''
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.material-selector {
  height: 500px;
  display: flex;
  flex-direction: column;
}

.type-tabs {
  border-bottom: 1px solid #e5e5e5;
  margin-bottom: 16px;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.search-input {
  flex: 1;
}

.material-list {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  padding: 12px;
}

/* 图文消息样式 */
.news-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.news-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.news-item:hover,
.news-item.selected {
  border-color: #409eff;
  background: #f0f7ff;
}

.news-cover img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.news-content {
  flex: 1;
}

.news-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.4;
}

.news-digest {
  color: #666;
  font-size: 12px;
  line-height: 1.4;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

/* 图片样式 */
.image-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.image-item {
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.image-item:hover,
.image-item.selected {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.image-preview {
  width: 100%;
  height: 100px;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-info {
  padding: 8px;
}

.image-name {
  font-size: 12px;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-size,
.create-time {
  font-size: 11px;
  color: #999;
}

/* 语音样式 */
.voice-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.voice-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.voice-item:hover,
.voice-item.selected {
  border-color: #409eff;
  background: #f0f7ff;
}

.voice-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 50%;
  color: #409eff;
}

.voice-info {
  flex: 1;
}

.voice-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.voice-duration,
.create-time {
  font-size: 12px;
  color: #999;
}

.voice-actions {
  display: flex;
  align-items: center;
}

/* 视频样式 */
.video-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.video-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.video-item:hover,
.video-item.selected {
  border-color: #409eff;
  background: #f0f7ff;
}

.video-preview {
  position: relative;
  width: 120px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
}

.video-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.video-info {
  flex: 1;
}

.video-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.video-description {
  color: #666;
  font-size: 12px;
  line-height: 1.4;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

:deep(.el-tabs__header) {
  margin: 0;
}

:deep(.el-tabs__nav-wrap::after) {
  display: none;
}
</style> 