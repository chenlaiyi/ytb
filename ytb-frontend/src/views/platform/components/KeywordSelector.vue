<template>
  <el-dialog
    v-model="dialogVisible"
    title="选择关键字回复"
    width="700px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="keyword-selector">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <div class="search-input">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索关键字..."
            :prefix-icon="Search"
            @input="onSearch"
            clearable
          />
        </div>
        <div class="search-filters">
          <el-select v-model="statusFilter" placeholder="状态" style="width: 100px;">
            <el-option label="全部" value="" />
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
          <el-select v-model="typeFilter" placeholder="类型" style="width: 120px;">
            <el-option label="全部" value="" />
            <el-option label="完全匹配" value="1" />
            <el-option label="包含匹配" value="2" />
            <el-option label="正则匹配" value="3" />
          </el-select>
        </div>
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          新建关键字
        </el-button>
      </div>

      <!-- 关键字列表 -->
      <div class="keyword-list" v-loading="loading">
        <el-table 
          :data="keywordList" 
          stripe
          style="width: 100%"
          max-height="400"
          @row-click="selectKeyword"
          :row-class-name="getRowClassName"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="keyword" label="关键字" min-width="120">
            <template #default="{ row }">
              <div class="keyword-cell">
                <span class="keyword-text">{{ row.keyword }}</span>
                <el-tag 
                  v-if="row.type === 1" 
                  type="success" 
                  size="small" 
                  effect="plain"
                >
                  完全匹配
                </el-tag>
                <el-tag 
                  v-else-if="row.type === 2" 
                  type="warning" 
                  size="small" 
                  effect="plain"
                >
                  包含匹配
                </el-tag>
                <el-tag 
                  v-else-if="row.type === 3" 
                  type="info" 
                  size="small" 
                  effect="plain"
                >
                  正则匹配
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="content" label="回复内容" min-width="200">
            <template #default="{ row }">
              <div class="content-preview">
                <div v-if="row.msgtype === 'text'" class="text-content">
                  {{ truncateText(row.content, 80) }}
                </div>
                <div v-else-if="row.msgtype === 'news'" class="news-content">
                  <el-icon><Document /></el-icon>
                  图文消息 ({{ row.news?.length || 0 }}条)
                </div>
                <div v-else-if="row.msgtype === 'image'" class="media-content">
                  <el-icon><Picture /></el-icon>
                  图片
                </div>
                <div v-else-if="row.msgtype === 'voice'" class="media-content">
                  <el-icon><Microphone /></el-icon>
                  语音
                </div>
                <div v-else-if="row.msgtype === 'video'" class="media-content">
                  <el-icon><VideoCamera /></el-icon>
                  视频
                </div>
                <div v-else class="other-content">
                  {{ row.msgtype }}
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              <el-tag 
                :type="row.status === 1 ? 'success' : 'danger'" 
                size="small"
              >
                {{ row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="150">
            <template #default="{ row }">
              {{ formatTime(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button 
                type="text" 
                size="small" 
                @click.stop="editKeyword(row)"
              >
                编辑
              </el-button>
              <el-button 
                type="text" 
                size="small" 
                @click.stop="deleteKeyword(row)"
                style="color: #f56c6c;"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 空状态 -->
        <div v-if="!loading && keywordList.length === 0" class="empty-state">
          <el-empty description="暂无关键字回复" />
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrap" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next"
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
          :disabled="!selectedKeyword"
        >
          确定选择
        </el-button>
      </div>
    </template>

    <!-- 新建/编辑关键字对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      :title="editingKeyword ? '编辑关键字' : '新建关键字'"
      width="500px"
      append-to-body
    >
      <el-form 
        :model="keywordForm" 
        :rules="keywordRules" 
        ref="keywordFormRef"
        label-width="100px"
      >
        <el-form-item label="关键字" prop="keyword">
          <el-input 
            v-model="keywordForm.keyword" 
            placeholder="输入关键字"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="匹配类型" prop="type">
          <el-radio-group v-model="keywordForm.type">
            <el-radio :label="1">完全匹配</el-radio>
            <el-radio :label="2">包含匹配</el-radio>
            <el-radio :label="3">正则匹配</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="回复类型" prop="msgtype">
          <el-select v-model="keywordForm.msgtype" @change="onMsgtypeChange">
            <el-option label="文本消息" value="text" />
            <el-option label="图文消息" value="news" />
            <el-option label="图片" value="image" />
            <el-option label="语音" value="voice" />
            <el-option label="视频" value="video" />
          </el-select>
        </el-form-item>
        
        <el-form-item 
          v-if="keywordForm.msgtype === 'text'" 
          label="回复内容" 
          prop="content"
        >
          <el-input 
            v-model="keywordForm.content" 
            type="textarea" 
            :rows="4"
            placeholder="输入回复内容"
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item 
          v-if="['news', 'image', 'voice', 'video'].includes(keywordForm.msgtype)" 
          label="选择素材"
        >
          <div style="display: flex; gap: 10px; width: 100%;">
            <el-input 
              v-model="selectedMaterialName" 
              placeholder="选择素材"
              readonly
            />
            <el-button @click="selectMaterialForKeyword">选择素材</el-button>
          </div>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-switch 
            v-model="keywordForm.status" 
            :active-value="1" 
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveKeyword" :loading="saveLoading">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 素材选择器 -->
    <MaterialSelector
      v-model:visible="materialSelectorVisible"
      :material-type="keywordForm.msgtype"
      :branch-id="branchId"
      @select="onMaterialSelectForKeyword"
    />
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Search, 
  Plus, 
  Document, 
  Picture, 
  Microphone, 
  VideoCamera 
} from '@element-plus/icons-vue'
import MaterialSelector from './MaterialSelector.vue'
import { getKeywordReplies } from '@/api/branchWechatMenu'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  branchId: {
    type: [String, Number],
    required: true
  }
})

const emit = defineEmits(['update:visible', 'select'])

// 响应式数据
const dialogVisible = ref(false)
const loading = ref(false)
const searchKeyword = ref('')
const statusFilter = ref('')
const typeFilter = ref('')
const keywordList = ref([])
const selectedKeyword = ref(null)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 新建/编辑关键字
const createDialogVisible = ref(false)
const editingKeyword = ref(null)
const keywordFormRef = ref()
const saveLoading = ref(false)
const selectedMaterialName = ref('')
const materialSelectorVisible = ref(false)

const keywordForm = reactive({
  keyword: '',
  type: 1,
  msgtype: 'text',
  content: '',
  media_id: '',
  status: 1
})

// 表单验证规则
const keywordRules = {
  keyword: [
    { required: true, message: '请输入关键字', trigger: 'blur' },
    { min: 1, max: 50, message: '关键字长度在1到50个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择匹配类型', trigger: 'change' }
  ],
  msgtype: [
    { required: true, message: '请选择回复类型', trigger: 'change' }
  ],
  content: [
    { 
      required: true, 
      message: '请输入回复内容', 
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (keywordForm.msgtype === 'text' && !value) {
          callback(new Error('请输入回复内容'))
        } else {
          callback()
        }
      }
    }
  ]
}

// 监听visible变化
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
  if (newVal) {
    loadKeywords()
  }
})

// 监听dialogVisible变化
watch(dialogVisible, (newVal) => {
  emit('update:visible', newVal)
  if (!newVal) {
    selectedKeyword.value = null
    searchKeyword.value = ''
    statusFilter.value = ''
    typeFilter.value = ''
  }
})

// 方法
const loadKeywords = async () => {
  try {
    loading.value = true
    const params = {
      keyword: searchKeyword.value,
      status: statusFilter.value,
      type: typeFilter.value,
      page: currentPage.value,
      per_page: pageSize.value
    }
    
    const response = await getKeywordReplies(props.branchId, params)
    
    if (response.code === 0) {
      keywordList.value = response.data.list || []
      total.value = response.data.total || 0
    } else {
      ElMessage.error(response.message || '加载关键字失败')
    }
  } catch (error) {
    console.error('加载关键字失败:', error)
    ElMessage.error('加载关键字失败')
  } finally {
    loading.value = false
  }
}

const onSearch = () => {
  currentPage.value = 1
  loadKeywords()
}

const onPageChange = (page) => {
  currentPage.value = page
  loadKeywords()
}

const onSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  loadKeywords()
}

const selectKeyword = (keyword) => {
  selectedKeyword.value = keyword
}

const getRowClassName = ({ row }) => {
  return selectedKeyword.value?.id === row.id ? 'selected-row' : ''
}

const confirmSelect = () => {
  if (selectedKeyword.value) {
    emit('select', selectedKeyword.value)
    handleClose()
  }
}

const handleClose = () => {
  dialogVisible.value = false
}

const showCreateDialog = () => {
  editingKeyword.value = null
  resetKeywordForm()
  createDialogVisible.value = true
}

const editKeyword = (keyword) => {
  editingKeyword.value = keyword
  Object.assign(keywordForm, {
    keyword: keyword.keyword,
    type: keyword.type,
    msgtype: keyword.msgtype,
    content: keyword.content || '',
    media_id: keyword.media_id || '',
    status: keyword.status
  })
  
  if (keyword.msgtype !== 'text' && keyword.material_name) {
    selectedMaterialName.value = keyword.material_name
  }
  
  createDialogVisible.value = true
}

const deleteKeyword = (keyword) => {
  ElMessageBox.confirm(
    `确定要删除关键字"${keyword.keyword}"吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 调用删除API
      // const response = await deleteKeywordReply(props.branchId, keyword.id)
      ElMessage.success('删除成功')
      loadKeywords()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  })
}

const resetKeywordForm = () => {
  Object.assign(keywordForm, {
    keyword: '',
    type: 1,
    msgtype: 'text',
    content: '',
    media_id: '',
    status: 1
  })
  selectedMaterialName.value = ''
}

const onMsgtypeChange = () => {
  keywordForm.content = ''
  keywordForm.media_id = ''
  selectedMaterialName.value = ''
}

const selectMaterialForKeyword = () => {
  materialSelectorVisible.value = true
}

const onMaterialSelectForKeyword = (material) => {
  keywordForm.media_id = material.media_id
  selectedMaterialName.value = material.title || material.name
}

const saveKeyword = async () => {
  try {
    await keywordFormRef.value.validate()
    
    saveLoading.value = true
    
    // 构建保存数据
    const saveData = { ...keywordForm }
    
    // 调用保存API
    // const response = editingKeyword.value 
    //   ? await updateKeywordReply(props.branchId, editingKeyword.value.id, saveData)
    //   : await createKeywordReply(props.branchId, saveData)
    
    ElMessage.success(editingKeyword.value ? '更新成功' : '创建成功')
    createDialogVisible.value = false
    loadKeywords()
  } catch (error) {
    if (error !== false) { // 验证失败时error为false
      console.error('保存关键字失败:', error)
      ElMessage.error('保存失败')
    }
  } finally {
    saveLoading.value = false
  }
}

const truncateText = (text, maxLength) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const formatTime = (timeString) => {
  if (!timeString) return ''
  const date = new Date(timeString)
  return date.toLocaleDateString('zh-CN') + ' ' + 
         date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 生命周期
onMounted(() => {
  // 可以在这里加载初始数据
})
</script>

<style scoped>
.keyword-selector {
  height: 500px;
  display: flex;
  flex-direction: column;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
}

.search-input {
  flex: 1;
}

.search-filters {
  display: flex;
  gap: 8px;
}

.keyword-list {
  flex: 1;
  overflow: hidden;
}

.keyword-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.keyword-text {
  font-weight: 500;
}

.content-preview {
  display: flex;
  align-items: center;
  gap: 6px;
}

.text-content {
  color: #333;
  line-height: 1.4;
}

.news-content,
.media-content,
.other-content {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
  font-size: 12px;
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

:deep(.el-table .selected-row) {
  background-color: #f0f7ff;
}

:deep(.el-table .selected-row:hover > td) {
  background-color: #f0f7ff !important;
}

:deep(.el-table__row:hover > td) {
  background-color: #f5f7fa;
}

:deep(.el-table tbody tr) {
  cursor: pointer;
}
</style> 