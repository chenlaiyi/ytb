<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="800px"
    @close="handleClose"
  >
    <!-- 素材类型选择 -->
    <div class="material-type-tabs">
      <el-tabs v-model="activeType" @tab-change="handleTypeChange">
        <el-tab-pane label="图文消息" name="news" />
        <el-tab-pane label="图片" name="image" />
        <el-tab-pane label="语音" name="voice" />
        <el-tab-pane label="视频" name="video" />
      </el-tabs>
    </div>

    <!-- 素材列表 -->
    <div class="material-content" v-loading="loading">
      <div class="material-grid">
        <div
          v-for="material in materialsList"
          :key="material.media_id"
          class="material-item"
          :class="{ active: selectedMaterial?.media_id === material.media_id }"
          @click="selectMaterial(material)"
        >
          <!-- 图文消息 -->
          <template v-if="activeType === 'news'">
            <img :src="material.thumb_url" class="material-thumb" />
            <div class="material-info">
              <h4>{{ material.title }}</h4>
              <p>{{ material.digest }}</p>
              <span class="material-date">{{ formatTime(material.created_at) }}</span>
            </div>
          </template>

          <!-- 图片 -->
          <template v-else-if="activeType === 'image'">
            <img :src="material.url" class="material-image" />
            <div class="material-overlay">
              <span class="material-name">{{ material.name || '图片' }}</span>
            </div>
          </template>

          <!-- 语音 -->
          <template v-else-if="activeType === 'voice'">
            <div class="voice-item">
              <el-icon size="32"><Microphone /></el-icon>
              <div class="voice-info">
                <h4>{{ material.name || '语音消息' }}</h4>
                <p>时长：{{ material.duration || 0 }}秒</p>
                <span class="material-date">{{ formatTime(material.created_at) }}</span>
              </div>
            </div>
          </template>

          <!-- 视频 -->
          <template v-else-if="activeType === 'video'">
            <div class="video-item">
              <div class="video-thumb">
                <img v-if="material.thumb_url" :src="material.thumb_url" />
                <el-icon v-else size="40"><VideoPlay /></el-icon>
              </div>
              <div class="video-info">
                <h4>{{ material.title || '视频消息' }}</h4>
                <p>{{ material.description }}</p>
                <span class="material-date">{{ formatTime(material.created_at) }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && materialsList.length === 0" class="empty-state">
        <el-icon size="48"><Document /></el-icon>
        <p>暂无{{ getTypeText(activeType) }}素材</p>
        <el-button type="primary" @click="$emit('upload', activeType)">
          上传{{ getTypeText(activeType) }}
        </el-button>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper" v-if="pagination.total > 0">
      <el-pagination
        v-model:current-page="pagination.current_page"
        v-model:page-size="pagination.per_page"
        :page-sizes="[12, 24, 48]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @size-change="loadMaterials"
        @current-change="loadMaterials"
      />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="confirmSelect" :disabled="!selectedMaterial">
          确定选择
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Microphone, VideoPlay, Document } from '@element-plus/icons-vue'
import branchWechatMenuApi from '@/api/branchWechatMenu'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  branchId: {
    type: [String, Number],
    required: true
  },
  title: {
    type: String,
    default: '选择素材'
  },
  defaultType: {
    type: String,
    default: 'news'
  },
  allowedTypes: {
    type: Array,
    default: () => ['news', 'image', 'voice', 'video']
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'select', 'upload'])

// 响应式数据
const loading = ref(false)
const activeType = ref(props.defaultType)
const materialsList = ref([])
const selectedMaterial = ref(null)

// 分页
const pagination = reactive({
  current_page: 1,
  per_page: 12,
  total: 0
})

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 方法
const loadMaterials = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.current_page,
      per_page: pagination.per_page
    }
    
    const response = await branchWechatMenuApi.getWechatMaterials(props.branchId, activeType.value, params)
    if (response.code === 0) {
      materialsList.value = response.data.data || []
      pagination.total = response.data.total || 0
      pagination.current_page = response.data.current_page || 1
      pagination.per_page = response.data.per_page || 12
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

const handleTypeChange = (type) => {
  activeType.value = type
  selectedMaterial.value = null
  pagination.current_page = 1
  loadMaterials()
}

const selectMaterial = (material) => {
  selectedMaterial.value = material
}

const confirmSelect = () => {
  if (selectedMaterial.value) {
    emit('select', {
      type: activeType.value,
      material: selectedMaterial.value
    })
    handleClose()
  }
}

const handleClose = () => {
  selectedMaterial.value = null
  visible.value = false
}

const getTypeText = (type) => {
  const typeMap = {
    'news': '图文',
    'image': '图片',
    'voice': '语音',
    'video': '视频'
  }
  return typeMap[type] || '素材'
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

// 监听对话框打开
watch(visible, (newVal) => {
  if (newVal) {
    activeType.value = props.defaultType
    selectedMaterial.value = null
    pagination.current_page = 1
    loadMaterials()
  }
})
</script>

<style scoped>
.material-type-tabs {
  margin-bottom: 20px;
}

.material-content {
  min-height: 300px;
}

.material-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.material-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.material-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.material-item.active {
  border-color: #409eff;
  background-color: #ecf5ff;
}

/* 图文消息样式 */
.material-thumb {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 8px;
}

.material-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-info p {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #909399;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.material-date {
  font-size: 11px;
  color: #c0c4cc;
}

/* 图片样式 */
.material-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
}

.material-overlay {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
}

.material-name {
  font-size: 12px;
}

/* 语音样式 */
.voice-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.voice-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #303133;
}

.voice-info p {
  margin: 0 0 4px 0;
  font-size: 12px;
  color: #909399;
}

/* 视频样式 */
.video-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.video-thumb {
  width: 100%;
  height: 120px;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.video-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-info p {
  margin: 0 0 4px 0;
  font-size: 12px;
  color: #909399;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #909399;
}

.empty-state p {
  margin: 16px 0;
  font-size: 14px;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style> 