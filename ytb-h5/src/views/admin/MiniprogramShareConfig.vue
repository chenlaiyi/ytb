<template>
  <div class="miniprogram-share-config-page">
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索页面名称/标识"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
            style="width: 200px"
          >
            <template #append>
              <el-button icon="Search" @click="handleSearch" />
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-select
            v-model="filters.is_active"
            placeholder="全部状态"
            clearable
            @change="handleSearch"
            style="width: 120px"
          >
            <el-option label="全部" :value="null" />
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" icon="Plus" @click="handleAdd">
            新增配置
          </el-button>
          <el-button icon="Refresh" @click="handleRefresh">
            刷新
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" />
        
        <el-table-column prop="page_name" label="页面名称" min-width="150">
          <template #default="{ row }">
            <div>
              <div style="font-weight: 500">{{ row.page_name }}</div>
              <div style="font-size: 12px; color: #909399; margin-top: 4px">
                {{ row.page_key }}
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="page_path" label="页面路径" min-width="200" show-overflow-tooltip />
        
        <el-table-column prop="title" label="分享标题" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <el-text v-if="row.title" type="primary">{{ row.title }}</el-text>
            <el-text v-else type="info">-</el-text>
          </template>
        </el-table-column>
        
        <el-table-column label="分享功能" width="120" align="center">
          <template #default="{ row }">
            <div>
              <el-tag v-if="row.enable_share" type="success" size="small">好友分享</el-tag>
              <el-tag v-if="row.enable_timeline" type="warning" size="small" style="margin-top: 4px">
                朋友圈
              </el-tag>
              <el-text v-if="!row.enable_share && !row.enable_timeline" type="info">-</el-text>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.is_active"
              @change="handleToggleStatus(row)"
              :loading="row.statusLoading"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button link type="primary" size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > 0"
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.per_page"
        :total="total"
        :page-sizes="[10, 15, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <!-- 编辑/新增对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="页面标识" prop="page_key">
          <el-input
            v-model="form.page_key"
            placeholder="如: merchant_qrcode"
            :disabled="isEdit"
          />
          <div style="font-size: 12px; color: #909399; margin-top: 4px">
            唯一标识，创建后不可修改
          </div>
        </el-form-item>
        
        <el-form-item label="页面名称" prop="page_name">
          <el-input v-model="form.page_name" placeholder="如: 商户收款码" />
        </el-form-item>
        
        <el-form-item label="页面路径" prop="page_path">
          <el-input v-model="form.page_path" placeholder="如: /pages/merchant/qrcode/index" />
        </el-form-item>
        
        <el-form-item label="分享标题" prop="title">
          <el-input
            v-model="form.title"
            placeholder="支持变量，如: ${merchantName}收款码"
          />
          <div style="font-size: 12px; color: #909399; margin-top: 4px">
            可使用变量占位符，格式: ${变量名}
          </div>
        </el-form-item>
        
        <el-form-item label="分享图片URL" prop="image_url">
          <el-input
            v-model="form.image_url"
            placeholder="支持变量，如: ${qrcodeUrl}"
          />
        </el-form-item>
        
        <el-form-item label="分享描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="输入分享描述"
          />
        </el-form-item>
        
        <el-form-item label="启用好友分享" prop="enable_share">
          <el-switch v-model="form.enable_share" />
        </el-form-item>
        
        <el-form-item label="启用朋友圈" prop="enable_timeline">
          <el-switch v-model="form.enable_timeline" />
          <div style="font-size: 12px; color: #909399; margin-top: 4px">
            仅部分页面支持朋友圈分享
          </div>
        </el-form-item>
        
        <el-form-item label="自定义选项" prop="share_options">
          <el-input
            v-model="shareOptionsText"
            type="textarea"
            :rows="4"
            placeholder='[{"name": "保存图片", "icon": "photo-o"}]'
          />
          <div style="font-size: 12px; color: #909399; margin-top: 4px">
            JSON格式，如: [{"name": "保存图片", "icon": "photo-o"}]
          </div>
        </el-form-item>
        
        <el-form-item label="可用变量" prop="variables">
          <el-input
            v-model="variablesText"
            type="textarea"
            :rows="4"
            placeholder='{"merchantName": "商户名称", "qrcodeUrl": "收款码URL"}'
          />
          <div style="font-size: 12px; color: #909399; margin-top: 4px">
            JSON格式，如: {"merchantName": "商户名称"}
          </div>
        </el-form-item>
        
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
        </el-form-item>
        
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="2"
            placeholder="输入备注说明"
          />
        </el-form-item>
        
        <el-form-item label="启用状态" prop="is_active">
          <el-switch v-model="form.is_active" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="配置详情"
      width="700px"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="页面标识">{{ viewData.page_key }}</el-descriptions-item>
        <el-descriptions-item label="页面名称">{{ viewData.page_name }}</el-descriptions-item>
        <el-descriptions-item label="页面路径">{{ viewData.page_path }}</el-descriptions-item>
        <el-descriptions-item label="分享标题">{{ viewData.title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="分享图片">{{ viewData.image_url || '-' }}</el-descriptions-item>
        <el-descriptions-item label="分享描述">{{ viewData.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="好友分享">
          <el-tag v-if="viewData.enable_share" type="success">启用</el-tag>
          <el-tag v-else type="info">禁用</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="朋友圈分享">
          <el-tag v-if="viewData.enable_timeline" type="success">启用</el-tag>
          <el-tag v-else type="info">禁用</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="自定义选项">
          <pre style="margin: 0">{{ JSON.stringify(viewData.share_options, null, 2) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="可用变量">
          <pre style="margin: 0">{{ JSON.stringify(viewData.variables, null, 2) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="排序">{{ viewData.sort }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ viewData.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag v-if="viewData.is_active" type="success">启用</el-tag>
          <el-tag v-else type="info">禁用</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ viewData.created_at }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ viewData.updated_at }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import axios from 'axios'

// 数据状态
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const submitLoading = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

// 分页
const pagination = reactive({
  page: 1,
  per_page: 15
})

// 筛选条件
const filters = reactive({
  keyword: '',
  is_active: null
})

// 表单数据
const form = reactive({
  page_key: '',
  page_name: '',
  page_path: '',
  title: '',
  image_url: '',
  description: '',
  enable_share: true,
  enable_timeline: false,
  share_options: null,
  variables: null,
  remark: '',
  sort: 0,
  is_active: true
})

// JSON字符串
const shareOptionsText = ref('')
const variablesText = ref('')

// 查看数据
const viewData = ref({})

// 对话框标题
const dialogTitle = computed(() => isEdit.value ? '编辑配置' : '新增配置')

// 表单验证规则
const rules = {
  page_key: [
    { required: true, message: '请输入页面标识', trigger: 'blur' }
  ],
  page_name: [
    { required: true, message: '请输入页面名称', trigger: 'blur' }
  ],
  page_path: [
    { required: true, message: '请输入页面路径', trigger: 'blur' }
  ]
}

// 获取列表数据
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      per_page: pagination.per_page,
      ...filters
    }
    
    const response = await axios.get('/api/admin/v1/miniprogram-share-configs', { params })
    
    if (response.data.code === 0) {
      tableData.value = response.data.data.data || []
      total.value = response.data.data.total || 0
    } else {
      message.error(response.data.message || '获取数据失败')
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    message.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

// 刷新
const handleRefresh = () => {
  filters.keyword = ''
  filters.is_active = null
  pagination.page = 1
  fetchData()
}

// 分页变化
const handlePageChange = (page) => {
  pagination.page = page
  fetchData()
}

const handleSizeChange = (size) => {
  pagination.per_page = size
  pagination.page = 1
  fetchData()
}

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    page_key: '',
    page_name: '',
    page_path: '',
    title: '',
    image_url: '',
    description: '',
    enable_share: true,
    enable_timeline: false,
    share_options: null,
    variables: null,
    remark: '',
    sort: 0,
    is_active: true
  })
  shareOptionsText.value = ''
  variablesText.value = ''
}

// 新增
const handleAdd = () => {
  resetForm()
  isEdit.value = false
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  Object.assign(form, { ...row })
  shareOptionsText.value = row.share_options ? JSON.stringify(row.share_options, null, 2) : ''
  variablesText.value = row.variables ? JSON.stringify(row.variables, null, 2) : ''
  isEdit.value = true
  dialogVisible.value = true
}

// 查看
const handleView = (row) => {
  viewData.value = { ...row }
  viewDialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      // 解析JSON字符串
      let shareOptions = null
      let variables = null
      
      if (shareOptionsText.value.trim()) {
        try {
          shareOptions = JSON.parse(shareOptionsText.value)
        } catch (e) {
          message.error('自定义选项JSON格式错误')
          submitLoading.value = false
          return
        }
      }
      
      if (variablesText.value.trim()) {
        try {
          variables = JSON.parse(variablesText.value)
        } catch (e) {
          message.error('可用变量JSON格式错误')
          submitLoading.value = false
          return
        }
      }
      
      const data = {
        ...form,
        share_options: shareOptions,
        variables: variables
      }
      
      let response
      if (isEdit.value) {
        response = await axios.put(`/api/admin/v1/miniprogram-share-configs/${form.id}`, data)
      } else {
        response = await axios.post('/api/admin/v1/miniprogram-share-configs', data)
      }
      
      if (response.data.code === 0) {
        message.success(isEdit.value ? '更新成功' : '创建成功')
        dialogVisible.value = false
        fetchData()
      } else {
        message.error(response.data.message || '操作失败')
      }
    } catch (error) {
      console.error('提交失败:', error)
      message.error(error.response?.data?.message || '操作失败')
    } finally {
      submitLoading.value = false
    }
  })
}

// 切换状态
const handleToggleStatus = async (row) => {
  row.statusLoading = true
  try {
    const response = await axios.put(`/api/admin/v1/miniprogram-share-configs/${row.id}/toggle-status`)
    
    if (response.data.code === 0) {
      message.success('状态切换成功')
    } else {
      row.is_active = !row.is_active
      message.error(response.data.message || '操作失败')
    }
  } catch (error) {
    row.is_active = !row.is_active
    console.error('状态切换失败:', error)
    message.error('操作失败')
  } finally {
    row.statusLoading = false
  }
}

// 删除
const handleDelete = async (row) => {
  try {
    await Modal.confirm(
      `确定要删除配置"${row.page_name}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await axios.delete(`/api/admin/v1/miniprogram-share-configs/${row.id}`)
    
    if (response.data.code === 0) {
      message.success('删除成功')
      fetchData()
    } else {
      message.error(response.data.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      message.error('删除失败')
    }
  }
}

// 初始化
onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.miniprogram-share-config-page {
  padding: 20px;
  
  .filter-card {
    margin-bottom: 20px;
  }
  
  .filter-form {
    .el-form-item {
      margin-bottom: 0;
    }
  }
  
  .table-card {
    :deep(.el-table) {
      .el-table__header th {
        background-color: #f5f7fa;
      }
    }
  }
}
</style>
