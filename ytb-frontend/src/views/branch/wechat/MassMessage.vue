<template>
  <div class="branch-wechat-mass-message">
    <div class="page-header">
      <div class="header-left">
        <h2>消息群发</h2>
        <p>管理分支机构公众号的群发消息</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          创建群发
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section" v-if="stats">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.total_messages || 0 }}</div>
              <div class="stat-label">总群发数</div>
            </div>
            <el-icon class="stat-icon"><ChatDotRound /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.sent_today || 0 }}</div>
              <div class="stat-label">今日群发</div>
            </div>
            <el-icon class="stat-icon"><Promotion /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.total_reach || 0 }}</div>
              <div class="stat-label">总触达人数</div>
            </div>
            <el-icon class="stat-icon"><User /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ (stats.avg_open_rate || 0).toFixed(1) }}%</div>
              <div class="stat-label">平均打开率</div>
            </div>
            <el-icon class="stat-icon"><View /></el-icon>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索筛选 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input 
            v-model="searchForm.keyword" 
            placeholder="群发标题"
            clearable
            style="width: 200px;"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="选择状态" clearable style="width: 120px;">
            <el-option label="全部" value="" />
            <el-option label="草稿" value="draft" />
            <el-option label="已发送" value="sent" />
            <el-option label="发送中" value="sending" />
            <el-option label="发送失败" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item label="消息类型">
          <el-select v-model="searchForm.msg_type" placeholder="消息类型" clearable style="width: 120px;">
            <el-option label="全部" value="" />
            <el-option label="文本" value="text" />
            <el-option label="图文" value="news" />
            <el-option label="图片" value="image" />
            <el-option label="语音" value="voice" />
            <el-option label="视频" value="video" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadMessages">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 消息列表 -->
    <el-card shadow="never" class="messages-card">
      <template #header>
        <div class="card-header">
          <span>群发消息列表</span>
          <el-button size="small" @click="loadMessages">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>
      
      <el-table 
        v-loading="loading"
        :data="messagesList" 
        style="width: 100%"
      >
        <el-table-column label="消息内容" min-width="300">
          <template #default="{ row }">
            <div class="message-content">
              <div class="message-preview">
                <div v-if="row.msg_type === 'text'" class="text-preview">
                  <p>{{ row.content.text || row.content }}</p>
                </div>
                <div v-else-if="row.msg_type === 'news'" class="news-preview">
                  <img :src="row.content.thumb_url" class="news-thumb" />
                  <div class="news-info">
                    <h4>{{ row.content.title }}</h4>
                    <p>{{ row.content.digest }}</p>
                  </div>
                </div>
                <div v-else-if="row.msg_type === 'image'" class="image-preview">
                  <img :src="row.content.url" class="message-image" />
                </div>
                <div v-else class="media-preview">
                  <el-icon size="24"><Document /></el-icon>
                  <span>{{ getMediaTypeName(row.msg_type) }}</span>
                </div>
              </div>
              <div class="message-meta">
                <el-tag :type="getStatusTagType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
                <span class="message-type">{{ getMediaTypeName(row.msg_type) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="目标受众" width="150">
          <template #default="{ row }">
            <div class="target-audience">
              <p>{{ getTargetText(row.target_type, row.target_value) }}</p>
              <span class="audience-count">{{ row.target_count || 0 }} 人</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="发送统计" width="120">
          <template #default="{ row }">
            <div v-if="row.status === 'sent'" class="send-stats">
              <p>成功：{{ row.sent_count || 0 }}</p>
              <p>失败：{{ row.failed_count || 0 }}</p>
            </div>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            <span>{{ formatTime(row.created_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="发送时间" width="160">
          <template #default="{ row }">
            <span>{{ row.sent_at ? formatTime(row.sent_at) : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewMessage(row)">详情</el-button>
            <el-button 
              v-if="row.status === 'draft'" 
              size="small" 
              @click="editMessage(row)"
            >
              编辑
            </el-button>
            <el-button 
              v-if="row.status === 'draft'" 
              size="small" 
              type="primary" 
              @click="sendMessage(row)"
            >
              发送
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deleteMessage(row)"
              :disabled="row.status === 'sending'"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.current_page"
          v-model:page-size="pagination.per_page"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, 
  Refresh,
  ChatDotRound,
  Promotion,
  User,
  View,
  Document
} from '@element-plus/icons-vue'
import * as branchWechatMassMessageApi from '@/api/branchWechatMassMessage'

const route = useRoute()
const branchId = route.params.branchId

// 响应式数据
const loading = ref(false)
const stats = ref(null)
const messagesList = ref([])

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: '',
  msg_type: ''
})

// 分页
const pagination = reactive({
  current_page: 1,
  per_page: 20,
  total: 0
})

// 对话框状态
const showCreateDialog = ref(false)

// 生命周期
onMounted(() => {
  loadStats()
  loadMessages()
})

// 方法
const loadStats = async () => {
  try {
    const response = await branchWechatMassMessageApi.getMassMessageStats(branchId)
    if (response.code === 0) {
      stats.value = response.data
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const loadMessages = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.current_page,
      per_page: pagination.per_page,
      ...searchForm
    }
    
    const response = await branchWechatMassMessageApi.getMassMessageList(branchId, params)
    if (response.code === 0) {
      messagesList.value = response.data.data || []
      pagination.total = response.data.total || 0
      pagination.current_page = response.data.current_page || 1
      pagination.per_page = response.data.per_page || 20
    } else {
      ElMessage.error(response.message || '加载消息列表失败')
    }
  } catch (error) {
    console.error('加载消息列表失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  Object.assign(searchForm, {
    keyword: '',
    status: '',
    msg_type: ''
  })
  pagination.current_page = 1
  loadMessages()
}

const getStatusText = (status) => {
  const statusMap = {
    'draft': '草稿',
    'sending': '发送中',
    'sent': '已发送',
    'failed': '发送失败'
  }
  return statusMap[status] || '未知'
}

const getStatusTagType = (status) => {
  const typeMap = {
    'draft': 'info',
    'sending': 'warning',
    'sent': 'success',
    'failed': 'danger'
  }
  return typeMap[status] || 'info'
}

const getMediaTypeName = (type) => {
  const typeMap = {
    'text': '文本',
    'news': '图文',
    'image': '图片',
    'voice': '语音',
    'video': '视频'
  }
  return typeMap[type] || type
}

const getTargetText = (type, value) => {
  if (type === 'all') return '全部粉丝'
  if (type === 'group') return `分组：${value}`
  if (type === 'tag') return `标签：${value}`
  return '自定义'
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const viewMessage = (message) => {
  console.log('查看消息详情:', message)
}

const editMessage = (message) => {
  console.log('编辑消息:', message)
}

const sendMessage = async (message) => {
  try {
    await ElMessageBox.confirm('确定要发送这条群发消息吗？', '确认发送', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const response = await branchWechatMassMessageApi.sendMassMessage(branchId, message.id)
    if (response.code === 0) {
      ElMessage.success('发送成功')
      loadMessages()
      loadStats()
    } else {
      ElMessage.error(response.message || '发送失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('发送群发消息失败:', error)
      ElMessage.error('发送失败')
    }
  }
}

const deleteMessage = async (message) => {
  try {
    await ElMessageBox.confirm('确定要删除这条群发消息吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const response = await branchWechatMassMessageApi.deleteMassMessage(branchId, message.id)
    if (response.code === 0) {
      ElMessage.success('删除成功')
      loadMessages()
      loadStats()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除群发消息失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const handlePageChange = (page) => {
  pagination.current_page = page
  loadMessages()
}
</script>

<style scoped>
.branch-wechat-mass-message {
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

.header-right {
  display: flex;
  gap: 12px;
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

.search-card {
  margin-bottom: 20px;
}

.messages-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-preview {
  display: flex;
  align-items: center;
  gap: 12px;
}

.text-preview p {
  margin: 0;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.news-preview {
  display: flex;
  align-items: center;
  gap: 8px;
}

.news-thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}

.news-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #303133;
}

.news-info p {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.image-preview .message-image {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}

.media-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.message-type {
  font-size: 12px;
  color: #909399;
}

.target-audience p {
  margin: 0 0 2px 0;
  font-size: 14px;
}

.audience-count {
  font-size: 12px;
  color: #909399;
}

.send-stats p {
  margin: 0;
  font-size: 12px;
}

.text-gray {
  color: #909399;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style> 