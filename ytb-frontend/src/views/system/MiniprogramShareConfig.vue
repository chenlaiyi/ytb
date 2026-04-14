<template>
  <div class="miniprogram-share-config">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>小程序分享配置</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增配置
          </el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="页面名称">
          <el-input v-model="searchForm.keyword" placeholder="搜索页面名称或标识" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.is_active" placeholder="全部" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="page_key" label="页面标识" width="180" />
        <el-table-column prop="page_name" label="页面名称" width="150" />
        <el-table-column prop="page_path" label="页面路径" min-width="200" show-overflow-tooltip />
        <el-table-column prop="title" label="分享标题" min-width="180" show-overflow-tooltip />
        <el-table-column label="分享图片" width="100">
          <template #default="{ row }">
            <el-image
              v-if="row.image_url && !row.image_url.includes('${')"
              :src="row.image_url"
              :preview-src-list="[row.image_url]"
              fit="cover"
              style="width: 60px; height: 60px;"
            />
            <span v-else class="text-gray-400">{{ row.image_url || '无' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="分享设置" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.enable_share" type="success" size="small">好友</el-tag>
            <el-tag v-if="row.enable_timeline" type="warning" size="small" style="margin-left: 4px;">朋友圈</el-tag>
            <span v-if="!row.enable_share && !row.enable_timeline" class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.is_active"
              :active-value="1"
              :inactive-value="0"
              @change="handleToggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.per_page"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增分享配置' : '编辑分享配置'"
      width="700px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="config-form"
      >
        <el-form-item label="页面标识" prop="page_key">
          <el-input v-model="form.page_key" placeholder="如: merchant_qrcode, mall_detail" :disabled="dialogType === 'edit'" />
          <div class="form-tip">唯一标识符，用于小程序端获取配置，创建后不可修改</div>
        </el-form-item>

        <el-form-item label="页面名称" prop="page_name">
          <el-input v-model="form.page_name" placeholder="如: 商户收款码" />
        </el-form-item>

        <el-form-item label="页面路径" prop="page_path">
          <el-input v-model="form.page_path" placeholder="如: /pages/merchant/qrcode/index" />
        </el-form-item>

        <el-divider content-position="left">分享内容</el-divider>

        <el-form-item label="分享标题" prop="title">
          <el-input v-model="form.title" placeholder="支持变量如 ${merchantName}" />
          <div class="form-tip">支持使用 ${变量名} 格式的动态变量</div>
        </el-form-item>

        <el-form-item label="分享图片" prop="image_url">
          <el-input v-model="form.image_url" placeholder="图片URL或变量如 ${qrcodeUrl}" />
        </el-form-item>

        <el-form-item label="分享描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="分享描述文字" />
        </el-form-item>

        <el-divider content-position="left">分享开关</el-divider>

        <el-form-item label="好友分享">
          <el-switch v-model="form.enable_share" :active-value="true" :inactive-value="false" />
          <span class="switch-label">{{ form.enable_share ? '已启用' : '已禁用' }}</span>
        </el-form-item>

        <el-form-item label="朋友圈分享">
          <el-switch v-model="form.enable_timeline" :active-value="true" :inactive-value="false" />
          <span class="switch-label">{{ form.enable_timeline ? '已启用' : '已禁用' }}</span>
        </el-form-item>

        <el-divider content-position="left">高级配置</el-divider>

        <el-form-item label="分享选项">
          <el-input
            v-model="form.share_options_str"
            type="textarea"
            :rows="3"
            placeholder='JSON格式，如: [{"name":"保存图片","icon":"photo-o"}]'
          />
          <div class="form-tip">自定义分享面板选项，JSON数组格式</div>
        </el-form-item>

        <el-form-item label="可用变量">
          <el-input
            v-model="form.variables_str"
            type="textarea"
            :rows="3"
            placeholder='JSON格式，如: {"merchantName":"商户名称"}'
          />
          <div class="form-tip">定义可用的动态变量及其说明</div>
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注说明" />
        </el-form-item>

        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
        </el-form-item>

        <el-form-item label="启用状态">
          <el-switch v-model="form.is_active" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 搜索表单
const searchForm = reactive({
  keyword: '',
  is_active: ''
})

// 表格数据
const tableData = ref([])
const loading = ref(false)

// 分页
const pagination = reactive({
  page: 1,
  per_page: 10,
  total: 0
})

// 弹窗
const dialogVisible = ref(false)
const dialogType = ref('add')
const submitLoading = ref(false)
const formRef = ref(null)

// 表单数据
const form = reactive({
  id: null,
  page_key: '',
  page_name: '',
  page_path: '',
  title: '',
  image_url: '',
  description: '',
  enable_share: true,
  enable_timeline: false,
  share_options_str: '',
  variables_str: '',
  remark: '',
  sort: 0,
  is_active: 1
})

// 表单验证规则
const rules = {
  page_key: [
    { required: true, message: '请输入页面标识', trigger: 'blur' },
    { pattern: /^[a-z][a-z0-9_]*$/, message: '只能包含小写字母、数字和下划线，且以字母开头', trigger: 'blur' }
  ],
  page_name: [
    { required: true, message: '请输入页面名称', trigger: 'blur' }
  ],
  page_path: [
    { required: true, message: '请输入页面路径', trigger: 'blur' }
  ]
}

// 获取列表数据
const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      per_page: pagination.per_page,
      keyword: searchForm.keyword,
      is_active: searchForm.is_active
    }
    const res = await request.get('/api/admin/v1/miniprogram-share-configs', { params })
    if (res.code === 0 || res.success) {
      tableData.value = res.data?.data || res.data || []
      pagination.total = res.data?.total || tableData.value.length
    } else {
      ElMessage.error(res.message || '获取数据失败')
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchList()
}

// 重置
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.is_active = ''
  pagination.page = 1
  fetchList()
}

// 分页
const handleSizeChange = (size) => {
  pagination.per_page = size
  fetchList()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchList()
}

// 重置表单
const resetForm = () => {
  form.id = null
  form.page_key = ''
  form.page_name = ''
  form.page_path = ''
  form.title = ''
  form.image_url = ''
  form.description = ''
  form.enable_share = true
  form.enable_timeline = false
  form.share_options_str = ''
  form.variables_str = ''
  form.remark = ''
  form.sort = 0
  form.is_active = 1
}

// 新增
const handleAdd = () => {
  resetForm()
  dialogType.value = 'add'
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  resetForm()
  dialogType.value = 'edit'
  Object.assign(form, {
    id: row.id,
    page_key: row.page_key,
    page_name: row.page_name,
    page_path: row.page_path,
    title: row.title || '',
    image_url: row.image_url || '',
    description: row.description || '',
    enable_share: row.enable_share,
    enable_timeline: row.enable_timeline,
    share_options_str: row.share_options ? JSON.stringify(row.share_options, null, 2) : '',
    variables_str: row.variables ? JSON.stringify(row.variables, null, 2) : '',
    remark: row.remark || '',
    sort: row.sort || 0,
    is_active: row.is_active
  })
  dialogVisible.value = true
}

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      // 解析 JSON 字段
      let share_options = null
      let variables = null
      
      if (form.share_options_str) {
        try {
          share_options = JSON.parse(form.share_options_str)
        } catch (e) {
          ElMessage.error('分享选项 JSON 格式错误')
          submitLoading.value = false
          return
        }
      }
      
      if (form.variables_str) {
        try {
          variables = JSON.parse(form.variables_str)
        } catch (e) {
          ElMessage.error('可用变量 JSON 格式错误')
          submitLoading.value = false
          return
        }
      }
      
      const data = {
        page_key: form.page_key,
        page_name: form.page_name,
        page_path: form.page_path,
        title: form.title,
        image_url: form.image_url,
        description: form.description,
        enable_share: form.enable_share,
        enable_timeline: form.enable_timeline,
        share_options,
        variables,
        remark: form.remark,
        sort: form.sort,
        is_active: form.is_active
      }
      
      let res
      if (dialogType.value === 'edit') {
        res = await request.put(`/api/admin/v1/miniprogram-share-configs/${form.id}`, data)
      } else {
        res = await request.post('/api/admin/v1/miniprogram-share-configs', data)
      }
      
      if (res.code === 0 || res.success) {
        ElMessage.success(dialogType.value === 'edit' ? '更新成功' : '创建成功')
        dialogVisible.value = false
        fetchList()
      } else {
        ElMessage.error(res.message || '操作失败')
      }
    } catch (error) {
      console.error('提交失败:', error)
      ElMessage.error(error.response?.data?.message || '操作失败')
    } finally {
      submitLoading.value = false
    }
  })
}

// 切换状态
const handleToggleStatus = async (row) => {
  try {
    const res = await request.put(`/api/admin/v1/miniprogram-share-configs/${row.id}/toggle-status`)
    if (res.code === 0 || res.success) {
      ElMessage.success('状态更新成功')
    } else {
      // 恢复原状态
      row.is_active = row.is_active === 1 ? 0 : 1
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error) {
    // 恢复原状态
    row.is_active = row.is_active === 1 ? 0 : 1
    ElMessage.error('状态更新失败')
  }
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除「${row.page_name}」的分享配置吗？`, '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await request.delete(`/api/admin/v1/miniprogram-share-configs/${row.id}`)
      if (res.code === 0 || res.success) {
        ElMessage.success('删除成功')
        fetchList()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.miniprogram-share-config {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.config-form {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 20px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.switch-label {
  margin-left: 10px;
  color: #606266;
}

.text-gray-400 {
  color: #c0c4cc;
}
</style>
