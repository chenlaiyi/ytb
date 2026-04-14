<template>
  <div class="api-list">
    <el-table 
      :data="paginatedApis" 
      stripe 
      border
      style="width: 100%"
      :loading="loading"
      empty-text="暂无API接口"
    >
      <el-table-column prop="name" label="接口名称" min-width="200">
        <template #default="{ row }">
          <div class="api-name">
            <el-tag :type="getApiTypeTag(row.type)" size="small" style="margin-right: 8px">
              {{ getApiTypeLabel(row.type) }}
            </el-tag>
            <span>{{ row.name }}</span>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column prop="path" label="路径" min-width="250">
        <template #default="{ row }">
          <el-text class="api-path" type="primary">{{ row.path }}</el-text>
        </template>
      </el-table-column>
      
      <el-table-column prop="methods" label="请求方法" width="120">
        <template #default="{ row }">
          <div class="method-tags">
            <el-tag 
              v-for="method in row.methods" 
              :key="method"
              :type="getMethodTagType(method)"
              size="small"
              style="margin-right: 4px; margin-bottom: 4px;"
            >
              {{ method }}
            </el-tag>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column prop="controller" label="控制器" width="150">
        <template #default="{ row }">
          <el-text class="controller-name">{{ row.controller }}</el-text>
        </template>
      </el-table-column>
      
      <el-table-column prop="description" label="描述" min-width="150">
        <template #default="{ row }">
          <el-text class="api-description">{{ row.description }}</el-text>
        </template>
      </el-table-column>
      
      <el-table-column prop="middleware" label="中间件" width="120">
        <template #default="{ row }">
          <div v-if="row.middleware && row.middleware.length > 0">
            <el-tag 
              v-for="middleware in row.middleware.slice(0, 2)" 
              :key="middleware"
              type="info"
              size="small"
              style="margin-right: 4px; margin-bottom: 2px;"
            >
              {{ middleware }}
            </el-tag>
            <el-text v-if="row.middleware.length > 2" type="info" size="small">
              +{{ row.middleware.length - 2 }}
            </el-text>
          </div>
          <el-text v-else type="info" size="small">无</el-text>
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-button 
              type="primary" 
              size="small" 
              @click="handleTestApi(row)"
              :icon="VideoPlay"
            >
              测试
            </el-button>
            <el-button 
              type="info" 
              size="small" 
              @click="handleViewDetail(row)"
              :icon="View"
            >
              详情
            </el-button>
            <el-button 
              type="success" 
              size="small" 
              @click="copyApiUrl(row)"
              :icon="DocumentCopy"
            >
              复制
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 分页 -->
    <div class="pagination-wrapper" v-if="apis.length > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="apis.length"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay, View, DocumentCopy } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  apis: {
    type: Array,
    default: () => []
  },
  type: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['test-api', 'view-detail'])

// 响应式数据
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)

// 计算属性
const paginatedApis = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return props.apis.slice(start, end)
})

// 方法
const getApiTypeLabel = (type) => {
  const labels = {
    'admin_v1': '管理端',
    'mobile_v1': '移动端',
    'legacy_php': 'PHP'
  }
  return labels[type] || type
}

const getApiTypeTag = (type) => {
  const tags = {
    'admin_v1': 'primary',
    'mobile_v1': 'success',
    'legacy_php': 'warning'
  }
  return tags[type] || 'info'
}

const getMethodTagType = (method) => {
  const types = {
    'GET': 'success',
    'POST': 'primary',
    'PUT': 'warning',
    'DELETE': 'danger',
    'PATCH': 'info'
  }
  return types[method] || 'info'
}

const handleTestApi = (api) => {
  emit('test-api', api)
}

const handleViewDetail = (api) => {
  emit('view-detail', api)
}

const copyApiUrl = async (api) => {
  try {
    await navigator.clipboard.writeText(api.full_url)
    ElMessage.success('API地址已复制到剪贴板')
  } catch (error) {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = api.full_url
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    ElMessage.success('API地址已复制到剪贴板')
  }
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

// 监听APIs变化，重置分页
watch(() => props.apis, () => {
  currentPage.value = 1
}, { deep: true })
</script>

<style scoped>
.api-list {
  width: 100%;
}

.api-name {
  display: flex;
  align-items: center;
}

.api-path {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  word-break: break-all;
}

.method-tags {
  display: flex;
  flex-wrap: wrap;
}

.controller-name {
  font-size: 12px;
  color: #606266;
}

.api-description {
  font-size: 12px;
  color: #909399;
}

.action-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.action-buttons .el-button {
  margin: 0;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-table .cell) {
  padding: 8px 12px;
}

:deep(.el-table__row) {
  height: auto;
}

:deep(.el-table__cell) {
  padding: 12px 0;
}
</style> 