<template>
  <div class="ai-knowledge-management">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-item">
            <div class="stats-value">{{ statistics.total_count || 0 }}</div>
            <div class="stats-label">知识库总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-item">
            <div class="stats-value">{{ statistics.active_count || 0 }}</div>
            <div class="stats-label">已启用</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-item">
            <div class="stats-value">{{ statistics.category_count || 0 }}</div>
            <div class="stats-label">分类数量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-item">
            <div class="stats-value">{{ Math.round(statistics.avg_usage || 0) }}</div>
            <div class="stats-label">平均使用次数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 操作工具栏 -->
    <el-card class="toolbar-card">
      <el-row :gutter="20" align="middle">
        <el-col :span="8">
          <el-input
            v-model="searchForm.search"
            placeholder="搜索标题或内容"
            clearable
            @change="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="searchForm.category"
            placeholder="选择分类"
            clearable
            @change="handleSearch"
          >
            <el-option
              v-for="category in categories"
              :key="category.name"
              :label="category.name"
              :value="category.name"
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="searchForm.status"
            placeholder="状态筛选"
            clearable
            @change="handleSearch"
          >
            <el-option label="已启用" :value="1" />
            <el-option label="已禁用" :value="0" />
          </el-select>
        </el-col>
        <el-col :span="8" class="text-right">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增知识库
          </el-button>
          <el-button @click="handleBatchDelete" :disabled="!selectedRows.length">
            <el-icon><Delete /></el-icon>
            批量删除
          </el-button>
          <el-button @click="loadCategories">
            <el-icon><Setting /></el-icon>
            分类管理
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 知识库列表 -->
    <el-card>
      
      <el-table
        v-loading="loading"
        :data="knowledgeList"
        @selection-change="handleSelectionChange"
        stripe
        empty-text="暂无数据"
        :key="tableKey"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.category" size="small">{{ row.category }}</el-tag>
            <span v-else class="text-gray">未分类</span>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.priority === 'high' ? 'danger' : row.priority === 'medium' ? 'warning' : 'info'"
              size="small"
            >
              {{ priorityMap[row.priority] || row.priority }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="usage_count" label="使用次数" width="100" />
        <el-table-column prop="is_active" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.is_active"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.updated_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
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

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入知识库标题" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="formData.category" placeholder="选择分类" style="width: 100%">
            <el-option
              v-for="category in categories"
              :key="category.name"
              :label="category.name"
              :value="category.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="formData.priority">
            <el-radio label="low">低</el-radio>
            <el-radio label="medium">中</el-radio>
            <el-radio label="high">高</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="关键词" prop="keywords">
          <el-tag
            v-for="(keyword, index) in formData.keywords"
            :key="index"
            closable
            @close="removeKeyword(index)"
            style="margin-right: 8px; margin-bottom: 8px;"
          >
            {{ keyword }}
          </el-tag>
          <el-input
            v-if="keywordInputVisible"
            ref="keywordInputRef"
            v-model="keywordInputValue"
            size="small"
            style="width: 120px;"
            @keyup.enter="handleKeywordConfirm"
            @blur="handleKeywordConfirm"
          />
          <el-button v-else size="small" @click="showKeywordInput">+ 添加关键词</el-button>
          <div class="text-gray text-sm mt-1">多个关键词用于提高搜索匹配度</div>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="8"
            placeholder="请输入知识库内容"
          />
        </el-form-item>
        <el-form-item label="状态" prop="is_active">
          <el-switch
            v-model="formData.is_active"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="viewDialogVisible" title="知识库详情" width="700px">
      <div v-if="viewData" class="knowledge-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="标题">{{ viewData.title }}</el-descriptions-item>
          <el-descriptions-item label="分类">{{ viewData.category || '未分类' }}</el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag
              :type="viewData.priority === 'high' ? 'danger' : viewData.priority === 'medium' ? 'warning' : 'info'"
              size="small"
            >
              {{ priorityMap[viewData.priority] || viewData.priority }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="使用次数">{{ viewData.usage_count }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="viewData.is_active ? 'success' : 'danger'" size="small">
              {{ viewData.is_active ? '已启用' : '已禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(viewData.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="关键词" :span="2">
            <el-tag
              v-for="keyword in viewData.keywords"
              :key="keyword"
              size="small"
              style="margin-right: 8px;"
            >
              {{ keyword }}
            </el-tag>
            <span v-if="!viewData.keywords?.length" class="text-gray">无</span>
          </el-descriptions-item>
          <el-descriptions-item label="内容" :span="2">
            <div class="content-preview">{{ viewData.content }}</div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Delete, Setting } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 响应式数据
const knowledgeList = ref([])
const categories = ref([])
const loading = ref(false)
const selectedRows = ref([])
const searchKeyword = ref('')
const selectedCategory = ref('')
const selectedStatus = ref('')
const tableKey = ref(0)

// 统计数据
const statistics = ref({
  total_count: 0,
  active_count: 0,
  category_count: 0,
  avg_usage: 0
})

// 搜索表单
const searchForm = reactive({
  search: '',
  category: '',
  status: ''
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 对话框
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const isEdit = ref(false)
const dialogTitle = ref('')
const viewData = ref(null)
const submitting = ref(false)

// 表单数据
const formRef = ref()
const formData = reactive({
  title: '',
  content: '',
  category: '',
  keywords: [],
  priority: 'medium',
  is_active: true
})

// 关键词输入
const keywordInputVisible = ref(false)
const keywordInputValue = ref('')
const keywordInputRef = ref()

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { max: 255, message: '标题长度不能超过255个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' },
    { max: 2000, message: '内容长度不能超过2000个字符', trigger: 'blur' }
  ]
}

// 优先级映射
const priorityMap = {
  low: '低',
  medium: '中',
  high: '高'
}

// 加载知识库列表 - 最简化版本
const loadKnowledgeList = async () => {
  loading.value = true
  
  try {
    const response = await request({
      url: '/api/admin/v1/ai/knowledge',
      method: 'get',
      params: {
        page: pagination.page,
        limit: pagination.limit
      }
    })
    
    if (response?.code === 0 && response?.data?.items) {
      knowledgeList.value = response.data.items
      pagination.total = response.data.total || 0
      tableKey.value++
    } else {
      ElMessage.error('获取数据失败')
    }
  } catch (error) {
    ElMessage.error('网络错误')
    console.error(error)
  } finally {
    loading.value = false
  }
}


const loadCategories = async () => {
  try {
    const response = await request({
      url: '/api/admin/v1/ai/knowledge-categories',
      method: 'get'
    })
    if (response?.code === 0) {
      categories.value = response.data || []
    }
  } catch (error) {
    console.error(error)
  }
}

const loadStatistics = async () => {
  try {
    const response = await request({
      url: '/api/admin/v1/ai/knowledge/statistics',
      method: 'get'
    })
    if (response?.code === 0 && response?.data?.overview) {
      statistics.value = {
        total_count: response.data.overview.total_count || 0,
        active_count: response.data.overview.active_count || 0,
        category_count: response.data.overview.category_count || 0,
        avg_usage: response.data.overview.avg_usage || 0
      }
    }
  } catch (error) {
    console.error(error)
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadKnowledgeList()
}

const handlePageChange = (page) => {
  pagination.page = page
  loadKnowledgeList()
}

const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  loadKnowledgeList()
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增知识库'
  resetFormData()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  dialogTitle.value = '编辑知识库'
  
  // 处理keywords字段，确保是数组格式
  let keywords = []
  if (row.keywords) {
    if (typeof row.keywords === 'string') {
      try {
        keywords = JSON.parse(row.keywords)
      } catch (e) {
        keywords = row.keywords.split(',').map(k => k.trim()).filter(k => k)
      }
    } else if (Array.isArray(row.keywords)) {
      keywords = row.keywords
    }
  }
  
  Object.assign(formData, {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    keywords: keywords,
    priority: row.priority,
    is_active: Boolean(row.is_active)
  })
  dialogVisible.value = true
}

const handleView = (row) => {
  viewData.value = row
  viewDialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这个知识库条目吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const response = await request({
      url: `/api/admin/v1/ai/knowledge/${row.id}`,
      method: 'delete'
    })
    if (response?.code === 0) {
      ElMessage.success('删除成功')
      loadKnowledgeList()
      loadStatistics()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleBatchDelete = async () => {
  if (!selectedRows.value.length) return
  
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个知识库条目吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const ids = selectedRows.value.map(row => row.id)
    const response = await request({
      url: '/api/admin/v1/ai/knowledge/batch-action',
      method: 'post',
      data: {
        action: 'disable',
        ids: ids
      }
    })
    
    if (response?.code === 0) {
      ElMessage.success('批量删除成功')
      loadKnowledgeList()
      loadStatistics()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

const handleStatusChange = async (row) => {
  try {
    const response = await request({
      url: `/api/admin/v1/ai/knowledge/${row.id}`,
      method: 'put',
      data: {
        title: row.title,
        content: row.content,
        category: row.category,
        keywords: row.keywords,
        priority: row.priority,
        is_active: row.is_active
      }
    })
    
    if (response?.code === 0) {
      ElMessage.success('状态更新成功')
      loadStatistics()
    }
  } catch (error) {
    ElMessage.error('状态更新失败')
    row.is_active = !row.is_active // 回滚状态
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitting.value = true
    
    const data = { ...formData }
    let response
    
    console.log('提交表单数据:', data)
    console.log('是否编辑模式:', isEdit.value)
    console.log('formData.id:', formData.id)
    
    if (isEdit.value) {
      console.log('发送PUT请求到:', `/api/admin/v1/ai/knowledge/${formData.id}`)
      response = await request({
        url: `/api/admin/v1/ai/knowledge/${formData.id}`,
        method: 'put',
        data: data
      })
    } else {
      console.log('发送POST请求到:', '/api/admin/v1/ai/knowledge')
      response = await request({
        url: '/api/admin/v1/ai/knowledge',
        method: 'post',
        data: data
      })
    }
    
    console.log('API响应:', response)
    console.log('响应状态码:', response?.code)
    console.log('响应消息:', response?.message)
    
    if (response && response.code === 0) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      loadKnowledgeList()
      loadStatistics()
    } else {
      console.error('API返回错误:', response)
      console.error('完整错误信息:', JSON.stringify(response, null, 2))
      ElMessage.error(response?.message || (isEdit.value ? '更新失败' : '创建失败'))
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  } finally {
    submitting.value = false
  }
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
  resetFormData()
}

const resetFormData = () => {
  Object.assign(formData, {
    id: null,
    title: '',
    content: '',
    category: '',
    keywords: [],
    priority: 'medium',
    is_active: true
  })
}

// 关键词相关方法
const showKeywordInput = () => {
  keywordInputVisible.value = true
  nextTick(() => {
    keywordInputRef.value?.focus()
  })
}

const handleKeywordConfirm = () => {
  const value = keywordInputValue.value.trim()
  if (value && !formData.keywords.includes(value)) {
    formData.keywords.push(value)
  }
  keywordInputVisible.value = false
  keywordInputValue.value = ''
}

const removeKeyword = (index) => {
  formData.keywords.splice(index, 1)
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}


// 生命周期
onMounted(() => {
  loadKnowledgeList()
  loadCategories()
  loadStatistics()
})
</script>

<style scoped>
.ai-knowledge-management {
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

.text-gray {
  color: #999;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

.knowledge-detail .content-preview {
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
}
</style>
