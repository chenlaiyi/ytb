<template>
  <div class="branch-admins-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">管理员管理</h1>
        <p class="page-description">管理分支机构的后台管理员账号</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog" :icon="Plus">
          新增管理员
        </el-button>
        <el-button @click="refreshList" :icon="Refresh">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 搜索过滤 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" inline>
        <el-form-item label="用户名:">
          <el-input 
            v-model="filterForm.username" 
            placeholder="请输入用户名"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="姓名:">
          <el-input 
            v-model="filterForm.name" 
            placeholder="请输入姓名"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态:">
          <el-select v-model="filterForm.status" placeholder="选择状态" clearable style="width: 120px">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :icon="Search">
            搜索
          </el-button>
          <el-button @click="resetFilter">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 管理员列表 -->
    <el-card class="table-card" shadow="never">
      <el-table 
        :data="adminList" 
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="role_name" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role_name)" size="small">
              {{ row.role_name || '普通管理员' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_login_at" label="最后登录" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.last_login_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small" 
              @click="showEditDialog(row)"
              :icon="Edit"
            >
              编辑
            </el-button>
            <el-button 
              :type="row.status === 'active' ? 'warning' : 'success'" 
              size="small" 
              @click="toggleStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="resetPassword(row)"
              :icon="Key"
            >
              重置密码
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑管理员对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form 
        :model="adminForm" 
        :rules="adminRules" 
        ref="adminFormRef" 
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="adminForm.username" 
            placeholder="请输入用户名"
            :disabled="isEdit"
          />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="adminForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="adminForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="adminForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="adminForm.role" placeholder="选择角色" style="width: 100%">
            <el-option label="超级管理员" value="super_admin" />
            <el-option label="管理员" value="admin" />
            <el-option label="操作员" value="operator" />
          </el-select>
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input 
            v-model="adminForm.password" 
            type="password" 
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="password_confirmation" v-if="!isEdit">
          <el-input 
            v-model="adminForm.password_confirmation" 
            type="password" 
            placeholder="请再次输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="adminForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, 
  Refresh, 
  Search, 
  Edit, 
  Key 
} from '@element-plus/icons-vue'
import request from '@/utils/request'

const route = useRoute()

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const adminFormRef = ref()

// 分支机构ID
const branchId = computed(() => route.params.branchId)

// 管理员列表
const adminList = ref([])

// 分页信息
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 搜索过滤
const filterForm = reactive({
  username: '',
  name: '',
  status: ''
})

// 管理员表单
const adminForm = reactive({
  username: '',
  name: '',
  email: '',
  phone: '',
  role: 'admin',
  password: '',
  password_confirmation: '',
  status: 'active'
})

// 表单验证规则
const adminRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  password_confirmation: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (value !== adminForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ]
}

// 计算属性
const isEdit = ref(false)
const dialogTitle = computed(() => isEdit.value ? '编辑管理员' : '新增管理员')

// 方法
const fetchAdminList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...filterForm
    }
    
    const response = await request.get(`/api/admin/v1/branch-organizations/${branchId.value}/admins`, { params })
    
    if (response.code === 0) {
      adminList.value = response.data.data
      pagination.total = response.data.total
    } else {
      ElMessage.error(response.message || '获取管理员列表失败')
    }
  } catch (error) {
    console.error('获取管理员列表失败:', error)
    ElMessage.error('获取管理员列表失败')
  } finally {
    loading.value = false
  }
}

const showAddDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const showEditDialog = (admin) => {
  isEdit.value = true
  Object.assign(adminForm, {
    id: admin.id,
    username: admin.username,
    name: admin.name,
    email: admin.email,
    phone: admin.phone,
    role: admin.role || 'admin',
    status: admin.status
  })
  dialogVisible.value = true
}

const resetForm = () => {
  Object.assign(adminForm, {
    id: null,
    username: '',
    name: '',
    email: '',
    phone: '',
    role: 'admin',
    password: '',
    password_confirmation: '',
    status: 'active'
  })
  adminFormRef.value?.clearValidate()
}

const handleSubmit = async () => {
  try {
    await adminFormRef.value.validate()
    
    submitting.value = true
    
    const data = { ...adminForm }
    delete data.id
    
    let response
    if (isEdit.value) {
      delete data.password
      delete data.password_confirmation
      response = await request.put(`/api/admin/v1/branch-organizations/${branchId.value}/admins/${adminForm.id}`, data)
    } else {
      response = await request.post(`/api/admin/v1/branch-organizations/${branchId.value}/admins`, data)
    }
    
    if (response.code === 0) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      fetchAdminList()
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const toggleStatus = async (admin) => {
  try {
    const action = admin.status === 'active' ? '禁用' : '启用'
    await ElMessageBox.confirm(`确定要${action}管理员 "${admin.name}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const response = await request.put(`/api/admin/v1/branch-organizations/${branchId.value}/admins/${admin.id}/status`)
    
    if (response.code === 0) {
      ElMessage.success(`${action}成功`)
      fetchAdminList()
    } else {
      ElMessage.error(response.message || `${action}失败`)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('状态切换失败:', error)
      ElMessage.error('操作失败')
    }
  }
}

const resetPassword = async (admin) => {
  try {
    await ElMessageBox.confirm(`确定要重置管理员 "${admin.name}" 的密码吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const response = await request.post(`/api/admin/v1/branch-organizations/${branchId.value}/admins/${admin.id}/reset-password`)
    
    if (response.code === 0) {
      ElMessage.success(`密码重置成功，新密码：${response.data.password}`)
    } else {
      ElMessage.error(response.message || '密码重置失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('密码重置失败:', error)
      ElMessage.error('操作失败')
    }
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchAdminList()
}

const resetFilter = () => {
  Object.assign(filterForm, {
    username: '',
    name: '',
    status: ''
  })
  pagination.page = 1
  fetchAdminList()
}

const refreshList = () => {
  fetchAdminList()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchAdminList()
}

const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  fetchAdminList()
}

const getRoleTagType = (role) => {
  const roleTypes = {
    'super_admin': 'danger',
    'admin': 'primary',
    'operator': 'info'
  }
  return roleTypes[role] || 'info'
}

const formatDateTime = (datetime) => {
  if (!datetime) return '-'
  return new Date(datetime).toLocaleString('zh-CN')
}

// 组件挂载时获取数据
onMounted(() => {
  fetchAdminList()
})
</script>

<style scoped>
.branch-admins-page {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2329;
}

.header-content p {
  margin: 0;
  color: #86909c;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-card :deep(.el-card__body) {
  padding: 20px;
}

.table-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-card :deep(.el-card__body) {
  padding: 0;
}

.table-card :deep(.el-table) {
  border-radius: 8px 8px 0 0;
}

.pagination-wrapper {
  padding: 20px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #ebeef5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .filter-card :deep(.el-form--inline .el-form-item) {
    display: block;
    margin-right: 0;
    margin-bottom: 16px;
  }
}
</style> 