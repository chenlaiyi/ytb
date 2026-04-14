<template>
  <div class="ai-service-config">
    <!-- 配置列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>AI服务配置管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增配置
          </el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="configList" stripe>
        <el-table-column prop="config_key" label="配置键" width="200" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="config_value" label="配置值" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="config-value-preview">
              {{ getConfigPreview(row.config_value) }}
            </div>
          </template>
        </el-table-column>
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
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" @click="handleTest(row)" :loading="testing">测试</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 配置模板 -->
    <el-card style="margin-top: 20px;">
      <template #header>
        <span>预设配置模板</span>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="8" v-for="template in templates" :key="template.key">
          <el-card class="template-card" @click="handleUseTemplate(template)">
            <div class="template-header">
              <h4>{{ template.name }}</h4>
              <el-tag size="small">{{ template.type }}</el-tag>
            </div>
            <p class="template-desc">{{ template.description }}</p>
            <el-button size="small" type="primary">使用模板</el-button>
          </el-card>
        </el-col>
      </el-row>
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
        label-width="120px"
      >
        <el-form-item label="配置键" prop="config_key">
          <el-input 
            v-model="formData.config_key" 
            placeholder="请输入配置键"
            :disabled="isEdit"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="2"
            placeholder="请输入配置描述"
          />
        </el-form-item>
        <el-form-item label="配置类型" prop="config_type">
          <el-radio-group v-model="formData.config_type" @change="handleTypeChange">
            <el-radio label="string">字符串</el-radio>
            <el-radio label="number">数字</el-radio>
            <el-radio label="boolean">布尔值</el-radio>
            <el-radio label="json">JSON对象</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="配置值" prop="config_value">
          <!-- 字符串类型 -->
          <el-input
            v-if="formData.config_type === 'string'"
            v-model="formData.config_value"
            type="textarea"
            :rows="3"
            placeholder="请输入配置值"
          />
          <!-- 数字类型 -->
          <el-input-number
            v-else-if="formData.config_type === 'number'"
            v-model="formData.config_value"
            style="width: 100%"
          />
          <!-- 布尔值类型 -->
          <el-switch
            v-else-if="formData.config_type === 'boolean'"
            v-model="formData.config_value"
            active-text="启用"
            inactive-text="禁用"
          />
          <!-- JSON类型 -->
          <el-input
            v-else
            v-model="formData.config_value"
            type="textarea"
            :rows="8"
            placeholder="请输入JSON格式的配置值"
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
    <el-dialog v-model="viewDialogVisible" title="配置详情" width="700px">
      <div v-if="viewData" class="config-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="配置键">{{ viewData.config_key }}</el-descriptions-item>
          <el-descriptions-item label="描述">{{ viewData.description }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="viewData.is_active ? 'success' : 'danger'" size="small">
              {{ viewData.is_active ? '已启用' : '已禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(viewData.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDate(viewData.updated_at) }}</el-descriptions-item>
          <el-descriptions-item label="配置值">
            <div class="config-value-detail">
              <pre>{{ formatConfigValue(viewData.config_value) }}</pre>
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'

// API调用封装
const api = {
  get: (url, config = {}) => request({ url, method: 'get', ...config }),
  post: (url, data = {}, config = {}) => request({ url, method: 'post', data, ...config }),
  put: (url, data = {}, config = {}) => request({ url, method: 'put', data, ...config }),
  delete: (url, config = {}) => request({ url, method: 'delete', ...config })
}

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const testing = ref(false)
const configList = ref([])
const templates = ref([])

// 对话框
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const isEdit = ref(false)
const dialogTitle = ref('')
const viewData = ref(null)

// 表单数据
const formRef = ref()
const formData = reactive({
  config_key: '',
  description: '',
  config_value: '',
  config_type: 'string',
  is_active: true
})

// 表单验证规则
const formRules = {
  config_key: [
    { required: true, message: '请输入配置键', trigger: 'blur' },
    { max: 100, message: '配置键长度不能超过100个字符', trigger: 'blur' }
  ],
  config_value: [
    { required: true, message: '请输入配置值', trigger: 'blur' }
  ]
}

// 方法
const loadConfigList = async () => {
  loading.value = true
  try {
    console.log('加载AI配置列表...')
    const response = await request.get('/api/admin/v1/ai/config')
    console.log('AI配置API响应:', response)
    if (response && response.code === 0 && response.data) {
      configList.value = response.data || []
      console.log('配置列表:', configList.value)
    } else {
      console.error('API返回错误:', response)
      ElMessage.error(response?.message || '获取配置列表失败')
    }
  } catch (error) {
    console.error('获取配置列表异常:', error)
    ElMessage.error('获取配置列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const loadTemplates = async () => {
  try {
    const response = await request.get('/api/admin/v1/app-management/diandian/smart-service/templates')
    if (response && response.code === 0) {
      templates.value = response.data || []
    }
  } catch (error) {
    console.error('获取模板失败:', error)
  }
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增配置'
  resetFormData()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  dialogTitle.value = '编辑配置'
  
  let configValue = row.config_value
  let configType = 'string'
  
  // 尝试解析配置值类型
  try {
    const parsed = JSON.parse(configValue)
    if (typeof parsed === 'object') {
      configType = 'json'
    } else if (typeof parsed === 'boolean') {
      configType = 'boolean'
      configValue = parsed
    } else if (typeof parsed === 'number') {
      configType = 'number'
      configValue = parsed
    }
  } catch (e) {
    // 如果解析失败，检查是否是数字
    if (!isNaN(configValue) && !isNaN(parseFloat(configValue))) {
      configType = 'number'
      configValue = parseFloat(configValue)
    }
  }
  
  Object.assign(formData, {
    config_key: row.config_key,
    description: row.description,
    config_value: configValue,
    config_type: configType,
    is_active: Boolean(row.is_active)
  })
  dialogVisible.value = true
}

const handleView = (row) => {
  viewData.value = row
  viewDialogVisible.value = true
}

const handleTest = async (row) => {
  testing.value = true
  try {
    const response = await request.post('/api/admin/v1/app-management/diandian/smart-service/test', {
      config_key: row.config_key
    })
    
    if (response && response.code === 0) {
      ElMessage.success('连接测试成功')
    } else {
      ElMessage.error(`连接测试失败: ${response?.message || '未知错误'}`)
    }
  } catch (error) {
    ElMessage.error('连接测试失败')
  } finally {
    testing.value = false
  }
}

const handleStatusChange = async (row) => {
  try {
    const response = await request.put(`/api/admin/v1/app-management/diandian/smart-service/${row.config_key}`, {
      config_key: row.config_key,
      description: row.description,
      config_value: row.config_value,
      is_active: row.is_active
    })
    
    if (response && response.code === 0) {
      ElMessage.success('状态更新成功')
    }
  } catch (error) {
    ElMessage.error('状态更新失败')
    row.is_active = !row.is_active // 回滚状态
  }
}

const handleUseTemplate = (template) => {
  Object.assign(formData, {
    config_key: template.key,
    description: template.description,
    config_value: JSON.stringify(template.value, null, 2),
    config_type: 'json',
    is_active: true
  })
  isEdit.value = false
  dialogTitle.value = '使用模板创建配置'
  dialogVisible.value = true
}

const handleTypeChange = () => {
  // 当类型改变时，重置配置值
  if (formData.config_type === 'boolean') {
    formData.config_value = false
  } else if (formData.config_type === 'number') {
    formData.config_value = 0
  } else {
    formData.config_value = ''
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitting.value = true
    
    let configValue = formData.config_value
    
    // 根据类型处理配置值
    if (formData.config_type === 'json') {
      try {
        JSON.parse(configValue) // 验证JSON格式
      } catch (e) {
        ElMessage.error('JSON格式不正确')
        return
      }
    } else if (formData.config_type === 'boolean' || formData.config_type === 'number') {
      configValue = JSON.stringify(configValue)
    }
    
    const data = {
      config_key: formData.config_key,
      description: formData.description,
      config_value: configValue,
      is_active: formData.is_active
    }
    
    let response
    if (isEdit.value) {
      response = await request.put(`/api/admin/v1/ai/config/${formData.config_key}`, data)
    } else {
      response = await request.post('/api/admin/v1/ai/config', data)
    }
    
    if (response && response.code === 0) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      loadConfigList()
    }
  } catch (error) {
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
    config_key: '',
    description: '',
    config_value: '',
    config_type: 'string',
    is_active: true
  })
}

const getConfigPreview = (value) => {
  if (!value) return ''
  if (value.length > 100) {
    return value.substring(0, 100) + '...'
  }
  return value
}

const formatConfigValue = (value) => {
  try {
    const parsed = JSON.parse(value)
    return JSON.stringify(parsed, null, 2)
  } catch (e) {
    return value
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadConfigList()
  loadTemplates()
})
</script>

<style scoped>
.ai-service-config {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-value-preview {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-card {
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 16px;
}

.template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.15);
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.template-header h4 {
  margin: 0;
  font-size: 16px;
}

.template-desc {
  color: #666;
  font-size: 14px;
  margin-bottom: 15px;
  line-height: 1.4;
}

.config-detail .config-value-detail {
  max-height: 300px;
  overflow-y: auto;
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
}

.config-detail .config-value-detail pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
