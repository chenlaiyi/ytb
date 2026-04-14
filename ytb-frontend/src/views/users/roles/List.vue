<template>
  <div class="roles-list">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>角色管理</span>
          <el-button type="primary" @click="handleCreate">创建角色</el-button>
        </div>
      </template>
      
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索角色名称或描述"
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
      </div>
      
      <el-table
        v-loading="loading"
        :data="roles"
        style="width: 100%"
        border
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色标识" width="150" />
        <el-table-column prop="display_name" label="角色名称" width="150" />
        <el-table-column prop="description" label="描述" />
        <el-table-column label="系统角色" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.is_system" type="success">是</el-tag>
            <el-tag v-else type="info">否</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button
              size="small"
              @click="handleEdit(scope.row)"
              :disabled="scope.row.is_system"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDelete(scope.row)"
              :disabled="scope.row.is_system"
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
    
    <!-- 角色表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '创建角色' : '编辑角色'"
      width="600px"
    >
      <el-form
        ref="roleFormRef"
        :model="roleForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="角色标识" prop="name">
          <el-input v-model="roleForm.name" :disabled="dialogType === 'edit' && roleForm.is_system" />
        </el-form-item>
        <el-form-item label="角色名称" prop="display_name">
          <el-input v-model="roleForm.display_name" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="roleForm.description" type="textarea" rows="3" />
        </el-form-item>
        <el-form-item label="权限" prop="permissions">
          <div class="permissions-container">
            <div v-for="(perms, module) in groupedPermissions" :key="module" class="permission-module">
              <div class="module-title">
                <el-checkbox
                  v-model="moduleChecked[module]"
                  :indeterminate="isModuleIndeterminate(module)"
                  @change="handleModuleCheckChange(module)"
                >
                  {{ module }}
                </el-checkbox>
              </div>
              <div class="permissions-list">
                <el-checkbox
                  v-for="perm in perms"
                  :key="perm.id"
                  v-model="permissionChecked[perm.id]"
                  @change="handlePermissionChange"
                >
                  {{ perm.display_name }}
                </el-checkbox>
              </div>
            </div>
          </div>
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
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import axios from 'axios'

// 数据加载状态
const loading = ref(false)

// 角色列表数据
const roles = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchKeyword = ref('')

// 对话框相关
const dialogVisible = ref(false)
const dialogType = ref('create') // 'create' 或 'edit'
const roleFormRef = ref(null)
const roleForm = reactive({
  id: null,
  name: '',
  display_name: '',
  description: '',
  is_system: false,
  permissions: []
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入角色标识', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  display_name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

// 权限数据
const allPermissions = ref([])
const groupedPermissions = ref({})
const permissionChecked = ref({})
const moduleChecked = ref({})

// 获取所有权限
const fetchAllPermissions = async () => {
  try {
    const response = await axios.get('/api/admin/roles/permissions/all')
    if (response.code === 0) {
      groupedPermissions.value = response.data
      
      // 初始化权限选中状态
      allPermissions.value = []
      Object.keys(groupedPermissions.value).forEach(module => {
        groupedPermissions.value[module].forEach(perm => {
          allPermissions.value.push(perm)
          permissionChecked.value[perm.id] = false
        })
      })
      
      // 初始化模块选中状态
      Object.keys(groupedPermissions.value).forEach(module => {
        moduleChecked.value[module] = false
      })
    }
  } catch (error) {
    console.error('获取权限列表失败:', error)
    ElMessage.error('获取权限列表失败')
  }
}

// 判断模块是否部分选中
const isModuleIndeterminate = (module) => {
  const modulePerms = groupedPermissions.value[module]
  if (!modulePerms || modulePerms.length === 0) return false
  
  const checkedCount = modulePerms.filter(perm => permissionChecked.value[perm.id]).length
  return checkedCount > 0 && checkedCount < modulePerms.length
}

// 处理模块选中状态变化
const handleModuleCheckChange = (module) => {
  const modulePerms = groupedPermissions.value[module]
  modulePerms.forEach(perm => {
    permissionChecked.value[perm.id] = moduleChecked.value[module]
  })
  handlePermissionChange()
}

// 处理权限选中状态变化
const handlePermissionChange = () => {
  // 更新模块选中状态
  Object.keys(groupedPermissions.value).forEach(module => {
    const modulePerms = groupedPermissions.value[module]
    const checkedCount = modulePerms.filter(perm => permissionChecked.value[perm.id]).length
    moduleChecked.value[module] = checkedCount === modulePerms.length
  })
  
  // 更新表单中的权限数组
  roleForm.permissions = allPermissions.value
    .filter(perm => permissionChecked.value[perm.id])
    .map(perm => perm.id)
}

// 获取角色列表
const fetchRoles = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      per_page: pageSize.value
    }
    
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    
    const response = await axios.get('/api/admin/roles', { params })
    if (response.code === 0) {
      roles.value = response.data.data
      total.value = response.data.total
    }
  } catch (error) {
    console.error('获取角色列表失败:', error)
    ElMessage.error('获取角色列表失败')
  } finally {
    loading.value = false
  }
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchRoles()
}

// 处理分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchRoles()
}

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchRoles()
}

// 重置表单
const resetForm = () => {
  roleForm.id = null
  roleForm.name = ''
  roleForm.display_name = ''
  roleForm.description = ''
  roleForm.is_system = false
  roleForm.permissions = []
  
  // 重置权限选中状态
  Object.keys(permissionChecked.value).forEach(id => {
    permissionChecked.value[id] = false
  })
  
  // 重置模块选中状态
  Object.keys(moduleChecked.value).forEach(module => {
    moduleChecked.value[module] = false
  })
  
  if (roleFormRef.value) {
    roleFormRef.value.resetFields()
  }
}

// 处理创建角色
const handleCreate = () => {
  resetForm()
  dialogType.value = 'create'
  dialogVisible.value = true
}

// 处理编辑角色
const handleEdit = async (row) => {
  resetForm()
  dialogType.value = 'edit'
  
  try {
    const response = await axios.get(`/api/admin/roles/${row.id}`)
    if (response.code === 0) {
      const role = response.data
      roleForm.id = role.id
      roleForm.name = role.name
      roleForm.display_name = role.display_name
      roleForm.description = role.description
      roleForm.is_system = role.is_system
      
      // 设置权限选中状态
      const rolePermissions = role.permissions || []
      rolePermissions.forEach(perm => {
        permissionChecked.value[perm.id] = true
      })
      
      // 更新模块选中状态
      Object.keys(groupedPermissions.value).forEach(module => {
        const modulePerms = groupedPermissions.value[module]
        const checkedCount = modulePerms.filter(perm => permissionChecked.value[perm.id]).length
        moduleChecked.value[module] = checkedCount === modulePerms.length
      })
      
      // 更新表单中的权限数组
      roleForm.permissions = rolePermissions.map(perm => perm.id)
      
      dialogVisible.value = true
    }
  } catch (error) {
    console.error('获取角色详情失败:', error)
    ElMessage.error('获取角色详情失败')
  }
}

// 处理删除角色
const handleDelete = (row) => {
  if (row.is_system) {
    ElMessage.warning('系统角色不允许删除')
    return
  }
  
  ElMessageBox.confirm(
    '确定要删除该角色吗？删除后无法恢复。',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await axios.delete(`/api/admin/roles/${row.id}`)
      if (response.code === 0) {
        ElMessage.success('删除成功')
        fetchRoles()
      } else {
        ElMessage.error(response.data.message || '删除失败')
      }
    } catch (error) {
      console.error('删除角色失败:', error)
      ElMessage.error(error.response?.data?.message || '删除角色失败')
    }
  }).catch(() => {
    // 取消删除
  })
}

// 提交表单
const submitForm = async () => {
  if (!roleFormRef.value) return
  
  await roleFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let response
        const formData = {
          name: roleForm.name,
          display_name: roleForm.display_name,
          description: roleForm.description,
          permissions: roleForm.permissions
        }
        
        if (dialogType.value === 'create') {
          response = await axios.post('/api/admin/roles', formData)
        } else {
          response = await axios.put(`/api/admin/roles/${roleForm.id}`, formData)
        }
        
        if (response.code === 0) {
          ElMessage.success(dialogType.value === 'create' ? '创建成功' : '更新成功')
          dialogVisible.value = false
          fetchRoles()
        } else {
          ElMessage.error(response.data.message || (dialogType.value === 'create' ? '创建失败' : '更新失败'))
        }
      } catch (error) {
        console.error(dialogType.value === 'create' ? '创建角色失败:' : '更新角色失败:', error)
        ElMessage.error(error.response?.data?.message || (dialogType.value === 'create' ? '创建角色失败' : '更新角色失败'))
      }
    }
  })
}

// 生命周期钩子
onMounted(() => {
  fetchRoles()
  fetchAllPermissions()
})
</script>

<style scoped>
.roles-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-bar {
  margin-bottom: 20px;
  max-width: 500px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.permissions-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 10px;
}

.permission-module {
  margin-bottom: 15px;
}

.module-title {
  font-weight: bold;
  margin-bottom: 8px;
  padding-bottom: 5px;
  border-bottom: 1px solid #ebeef5;
}

.permissions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
