<template>
  <div class="ai-chat-monitor">
    <!-- 统计概览 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-item">
            <div class="stats-value">{{ statistics.total_sessions || 0 }}</div>
            <div class="stats-label">总会话数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-item">
            <div class="stats-value">{{ statistics.active_sessions || 0 }}</div>
            <div class="stats-label">活跃会话</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-item">
            <div class="stats-value">{{ statistics.total_messages || 0 }}</div>
            <div class="stats-label">总消息数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-item">
            <div class="stats-value">{{ Math.round(statistics.avg_messages_per_session || 0) }}</div>
            <div class="stats-label">平均消息数/会话</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选工具栏 -->
    <el-card class="toolbar-card">
      <el-row :gutter="20" align="middle">
        <el-col :span="4">
          <el-select
            v-model="searchForm.user_type"
            placeholder="用户类型"
            clearable
            @change="handleSearch"
          >
            <el-option label="会员" value="member" />
            <el-option label="游客" value="guest" />
            <el-option label="VIP" value="vip" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="searchForm.status"
            placeholder="会话状态"
            clearable
            @change="handleSearch"
          >
            <el-option label="活跃" value="active" />
            <el-option label="已结束" value="ended" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="handleDateChange"
            style="width: 100%"
          />
        </el-col>
        <el-col :span="6">
          <el-input
            v-model="searchForm.search"
            placeholder="搜索会话ID或用户ID"
            clearable
            @change="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4" class="text-right">
          <el-button @click="handleExport" :loading="exporting">
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 会话列表 -->
    <el-card>
      <template #header>
        <span>聊天会话列表</span>
      </template>
      
      <el-table
        v-loading="loading"
        :data="sessionList"
        :key="tableKey"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column prop="session_id" label="会话ID" width="200" show-overflow-tooltip />
        <el-table-column prop="user_id" label="用户ID" width="100" />
        <el-table-column prop="user_type" label="用户类型" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.user_type === 'vip' ? 'warning' : row.user_type === 'member' ? 'success' : 'info'"
              size="small"
            >
              {{ userTypeMap[row.user_type] || row.user_type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message_count" label="消息数" width="100" />
        <el-table-column prop="is_active" label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.is_active ? 'success' : 'info'"
              size="small"
            >
              {{ row.is_active ? '活跃' : '已结束' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="开始时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="last_activity" label="最后活动" width="160">
          <template #default="{ row }">
            {{ formatDate(row.last_activity) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click.stop="handleViewMessages(row)">查看消息</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 消息详情对话框 -->
    <el-dialog
      v-model="messageDialogVisible"
      :title="`会话消息 - ${selectedSession?.session_id}`"
      width="800px"
      top="5vh"
    >
      <div v-loading="messageLoading" class="message-container">
        <div
          v-for="message in messageList"
          :key="message.id"
          :class="['message-item', message.message_type]"
        >
          <div class="message-header">
            <span class="message-role">
              {{ message.message_type === 'user' ? '用户' : 'AI助手' }}
            </span>
            <span class="message-time">{{ formatDate(message.created_at) }}</span>
          </div>
          <div class="message-content">{{ message.message_content }}</div>
          <div v-if="message.response_time" class="message-metadata">
            <el-tag size="small">响应时间: {{ message.response_time }}s</el-tag>
          </div>
        </div>
        <div v-if="!messageList.length && !messageLoading" class="empty-messages">
          暂无消息记录
        </div>
      </div>
      <template #footer>
        <el-button @click="messageDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleExportSession">导出此会话</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Download } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getAdminToken } from '@/utils/admin-token-bridge'


// 响应式数据
const loading = ref(false)
const messageLoading = ref(false)
const exporting = ref(false)
const sessionList = ref([])
const messageList = ref([])
const statistics = ref({
  total_sessions: 0,
  active_sessions: 0,
  total_messages: 0
})
const messageDialogVisible = ref(false)
const selectedSession = ref(null)
const tableKey = ref(0)

console.log('初始化sessionList:', sessionList.value)

// 搜索表单
const searchForm = reactive({
  user_type: '',
  status: '',
  search: '',
  start_date: '',
  end_date: ''
})

// 分页信息
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

// 映射
const userTypeMap = {
  member: '会员',
  guest: '游客',
  vip: 'VIP'
}

const roleMap = {
  user: '用户',
  assistant: 'AI助手',
  system: '系统'
}

// 方法
const loadSessionList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm
    }
    console.log('发送会话列表请求:', params)
    console.log('请求URL:', '/api/admin/v1/ai/chat-sessions')
    
    // 直接测试API调用
    try {
      const testResponse = await fetch('/api/admin/v1/ai/chat-sessions?page=1&limit=5', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAdminToken()}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      console.log('直接fetch响应状态:', testResponse.status)
      const testData = await testResponse.text()
      console.log('直接fetch响应内容:', testData)
      
      // 尝试解析JSON
      try {
        const jsonData = JSON.parse(testData)
        console.log('解析后的JSON数据:', jsonData)
        console.log('JSON数据code:', jsonData.code)
        console.log('JSON数据items:', jsonData.data?.items)
        console.log('JSON数据items长度:', jsonData.data?.items?.length)
        
        // 如果fetch成功获取到数据，直接使用
        if (jsonData.code === 0 && jsonData.data && jsonData.data.items) {
          console.log('直接使用fetch获取的数据')
          sessionList.value = jsonData.data.items
          pagination.total = jsonData.data.total || 0
          tableKey.value = Date.now()
          console.log('直接赋值后sessionList:', sessionList.value.length, '条')
          loading.value = false
          return
        }
      } catch (parseError) {
        console.error('JSON解析失败:', parseError)
      }
    } catch (fetchError) {
      console.error('直接fetch失败:', fetchError)
    }
    
    const response = await request({
      url: '/api/admin/v1/ai/chat-sessions',
      method: 'get',
      params
    })
    console.log('会话列表API响应:', response)
    console.log('响应类型:', typeof response)
    console.log('响应code:', response?.code)
    console.log('响应data:', response?.data)
    console.log('响应data.items:', response?.data?.items)
    console.log('响应data.items类型:', typeof response?.data?.items)
    console.log('响应data.items长度:', response?.data?.items?.length)
    
    if (response && response.code === 0) {
      console.log('API成功响应，开始处理数据')
      console.log('response.data:', response.data)
      
      if (response.data && response.data.items) {
        const items = response.data.items
        console.log('获取到items:', items)
        console.log('items长度:', items.length)
        console.log('items是否为数组:', Array.isArray(items))
        
        // 直接赋值并强制更新
        sessionList.value = [...items]
        pagination.total = response.data.total || 0
        
        console.log('赋值后sessionList长度:', sessionList.value.length)
        console.log('赋值后sessionList内容:', sessionList.value)
        
        // 强制重新渲染表格
        tableKey.value = Date.now()
        
        nextTick(() => {
          console.log('nextTick后sessionList:', sessionList.value)
          console.log('nextTick后表格key:', tableKey.value)
        })
      } else {
        console.error('API响应中没有items数据:', response.data)
        sessionList.value = []
      }
    } else {
      console.error('API返回错误或code不为0:', response)
      sessionList.value = []
    }
  } catch (error) {
    console.error('获取会话列表失败:', error)
    console.error('错误详情:', error.message)
    console.error('错误堆栈:', error.stack)
    ElMessage.error('获取会话列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const loadStatistics = async () => {
  try {
    const params = {
      start_date: searchForm.start_date,
      end_date: searchForm.end_date
    }
    const response = await request({
      url: '/api/admin/v1/ai/chat-sessions/statistics',
      method: 'get',
      params
    })
    if (response?.code === 0) {
      statistics.value = {
        total_sessions: response.data?.total_sessions || 0,
        active_sessions: response.data?.active_sessions || 0,
        total_messages: response.data?.total_messages || 0,
        avg_messages_per_session: response.data?.total_sessions > 0 ? 
          Math.round(response.data?.total_messages / response.data?.total_sessions) : 0
      }
    }
  } catch (error) {
    console.error('获取统计信息失败:', error)
  }
}

const loadMessages = async (sessionId) => {
  messageLoading.value = true
  try {
    console.log('加载消息，sessionId:', sessionId)
    const response = await request({
      url: `/api/admin/v1/ai/chat-sessions/${sessionId}/messages`,
      method: 'get'
    })
    console.log('消息API响应:', response)
    if (response?.code === 0) {
      messageList.value = response.data?.messages || []
      console.log('消息列表:', messageList.value)
      console.log('消息数量:', messageList.value.length)
    } else {
      console.error('消息API返回错误:', response)
      ElMessage.error(response?.message || '获取消息列表失败')
    }
  } catch (error) {
    console.error('获取消息列表异常:', error)
    ElMessage.error('获取消息列表失败: ' + error.message)
  } finally {
    messageLoading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadSessionList()
  loadStatistics()
}

const handleDateChange = (dates) => {
  if (dates && dates.length === 2) {
    searchForm.start_date = dates[0].toISOString().split('T')[0]
    searchForm.end_date = dates[1].toISOString().split('T')[0]
  } else {
    searchForm.start_date = ''
    searchForm.end_date = ''
  }
  handleSearch()
}

const handlePageChange = (page) => {
  pagination.page = page
  loadSessionList()
}

const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  loadSessionList()
}

const handleRowClick = (row) => {
  handleViewMessages(row)
}

const handleViewMessages = (session) => {
  selectedSession.value = session
  messageDialogVisible.value = true
  loadMessages(session.session_id)
}

const handleExport = async () => {
  try {
    await ElMessageBox.confirm('确定要导出聊天数据吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    
    exporting.value = true
    const params = {
      format: 'csv',
      ...searchForm
    }
    
    const response = await api.get('/admin/v1/ai/chat-monitor/export', {
      params,
      responseType: 'blob'
    })
    
    // 创建下载链接
    const blob = new Blob([response.data], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `chat_sessions_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('导出失败')
    }
  } finally {
    exporting.value = false
  }
}

const handleExportSession = async () => {
  if (!selectedSession.value) return
  
  try {
    const params = {
      session_id: selectedSession.value.session_id,
      format: 'json'
    }
    
    const response = await api.get('/admin/v1/ai/chat-monitor/export', {
      params,
      responseType: 'blob'
    })
    
    const blob = new Blob([response.data], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `session_${selectedSession.value.session_id}.json`
    link.click()
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('会话导出成功')
  } catch (error) {
    ElMessage.error('会话导出失败')
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadSessionList()
  loadStatistics()
})
</script>

<style scoped>
.ai-chat-monitor {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stats-card {
  text-align: center;
}

.stats-item {
  padding: 10px;
}

.stats-value {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stats-label {
  font-size: 14px;
  color: #666;
}

.toolbar-card {
  margin-bottom: 20px;
}

.text-right {
  text-align: right;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

.message-container {
  max-height: 500px;
  overflow-y: auto;
  padding: 10px;
}

.message-item {
  margin-bottom: 15px;
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid #ddd;
}

.message-item.user {
  background: #f0f9ff;
  border-left-color: #3b82f6;
}

.message-item.assistant {
  background: #f0fdf4;
  border-left-color: #10b981;
}

.message-item.system {
  background: #fefce8;
  border-left-color: #eab308;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.message-role {
  font-weight: bold;
  font-size: 14px;
}

.message-time {
  font-size: 12px;
  color: #666;
}

.message-content {
  line-height: 1.5;
  white-space: pre-wrap;
  margin-bottom: 8px;
}

.message-metadata {
  font-size: 12px;
}

.empty-messages {
  text-align: center;
  color: #999;
  padding: 40px;
}
</style>
