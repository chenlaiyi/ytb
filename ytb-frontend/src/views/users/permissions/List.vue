<template>
  <div class="permissions-list">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>权限管理</span>
          <el-button type="primary" @click="handleCreate">创建权限</el-button>
        </div>
      </template>
      
      <div class="search-bar">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-select
              v-model="searchModule"
              placeholder="选择模块"
              clearable
              @change="handleSearch"
              style="width: 100%"
            >
              <el-option
                v-for="module in modules"
                :key="module"
                :label="module"
                :value="module"
              />
            </el-select>
          </el-col>
          <el-col :span="18">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索权限名称或描述"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            >
              <template #append>
                <el-button @click="handleSearch">
                  <el-icon><Search /></el-icon>
                </el-button>
              </template>
            </el-input>
          </el-col>
        </el-row>
      </div>
      
      <el-table
        v-loading="loading"
        :data="permissions"
        style="width: 100%"
        border
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="权限标识" width="180" />
        <el-table-column prop="display_name" label="权限名称" width="150" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="module" label="所属模块" width="120" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button
              size="small"
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 权限表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '创建权限' : '编辑权限'"
      width="500px"
    >
      <el-form
        ref="permissionFormRef"
        :model="permissionForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="权限标识" prop="name">
          <el-input v-model="permissionForm.name" />
          <div class="form-tip">格式建议：模块.操作，如：users.create</div>
        </el-form-item>
        <el-form-item label="权限名称" prop="display_name">
          <el-input v-model="permissionForm.display_name" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="permissionForm.description" type="textarea" rows="3" />
        </el-form-item>
        <el-form-item label="所属模块" prop="module">
          <el-select
            v-model="permissionForm.module"
            placeholder="选择模块"
            style="width: 100%"
            filterable
            allow-create
            default-first-option
          >
            <el-option
              v-for="module in modules"
              :key="module"
              :label="module"
              :value="module"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import axios from 'axios'

// 数据加载状态
const loading = ref(false)

// 权限列表数据
const permissions = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchKeyword = ref('')
const searchModule = ref('')

// 模块列表
const modules = ref([])

// 对话框相关
const dialogVisible = ref(false)
const dialogType = ref('create') // 'create' 或 'edit'
const permissionFormRef = ref(null)
const permissionForm = reactive({
  id: null,
  name: '',
  display_name: '',
  description: '',
  module: ''
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入权限标识', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
    { pattern: /^[a-z0-9\-\.]+$/, message: '只能包含小写字母、数字、短横线和点', trigger: 'blur' }
  ],
  display_name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  module: [
    { required: true, message: '请选择或输入所属模块', trigger: 'change' }
  ]
}

// 获取模块列表
const fetchModules = async () => {
  try {
    const response = await axios.get('/api/admin/permissions/modules')
    if (response.code === 0) {
      modules.value = response.data
    }
  } catch (error) {
    console.error('获取模块列表失败:', error)
    ElMessage.error('获取模块列表失败')
  }
}

// 获取权限列表
const fetchPermissions = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      per_page: pageSize.value
    }
    
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    
    if (searchModule.value) {
      params.module = searchModule.value
    }
    
    const response = await axios.get('/api/admin/permissions', { params })
    if (response.code === 0) {
      permissions.value = response.data.data
      total.value = response.data.total
    }
  } catch (error) {
    console.error('获取权限列表失败:', error)
    ElMessage.error('获取权限列表失败')
  } finally {
    loading.value = false
  }
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchPermissions()
}

// 处理分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchPermissions()
}

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchPermissions()
}

// 重置表单
const resetForm = () => {
  permissionForm.id = null
  permissionForm.name = ''
  permissionForm.display_name = ''
  permissionForm.description = ''
  permissionForm.module = ''
  
  if (permissionFormRef.value) {
    permissionFormRef.value.resetFields()
  }
}

// 处理创建权限
const handleCreate = () => {
  resetForm()
  dialogType.value = 'create'
  dialogVisible.value = true
}

// 处理编辑权限
const handleEdit = async (row) => {
  resetForm()
  dialogType.value = 'edit'
  
  try {
    const response = await axios.get(`/api/admin/permissions/${row.id}`)
    if (response.code === 0) {
      const permission = response.data
      permissionForm.id = permission.id
      permissionForm.name = permission.name
      permissionForm.display_name = permission.display_name
      permissionForm.description = permission.description
      permissionForm.module = permission.module
      
      dialogVisible.value = true
    }
  } catch (error) {
    console.error('获取权限详情失败:', error)
    ElMessage.error('获取权限详情失败')
  }
}

// 处理删除权限
const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除该权限吗？删除后无法恢复，且可能影响已分配该权限的角色。',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await axios.delete(`/api/admin/permissions/${row.id}`)
      if (response.code === 0) {
        ElMessage.success('删除成功')
        fetchPermissions()
      } else {
        ElMessage.error(response.data.message || '删除失败')
      }
    } catch (error) {
      console.error('删除权限失败:', error)
      ElMessage.error(error.response?.data?.message || '删除权限失败')
    }
  }).catch(() => {
    // 取消删除
  })
}

// 提交表单
const submitForm = async () => {
  if (!permissionFormRef.value) return
  
  await permissionFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let response
        const formData = {
          name: permissionForm.name,
          display_name: permissionForm.display_name,
          description: permissionForm.description,
          module: permissionForm.module
        }
        
        if (dialogType.value === 'create') {
          response = await axios.post('/api/admin/permissions', formData)
        } else {
          response = await axios.put(`/api/admin/permissions/${permissionForm.id}`, formData)
        }
        
        if (response.code === 0) {
          ElMessage.success(dialogType.value === 'create' ? '创建成功' : '更新成功')
          dialogVisible.value = false
          fetchPermissions()
          fetchModules() // 刷新模块列表
        } else {
          ElMessage.error(response.data.message || (dialogType.value === 'create' ? '创建失败' : '更新失败'))
        }
      } catch (error) {
        console.error(dialogType.value === 'create' ? '创建权限失败:' : '更新权限失败:', error)
        ElMessage.error(error.response?.data?.message || (dialogType.value === 'create' ? '创建权限失败' : '更新权限失败'))
      }
    }
  })
}

// 生命周期钩子
onMounted(() => {
  fetchPermissions()
  fetchModules()
})
</script>

<style scoped>
.permissions-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-bar {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style>
