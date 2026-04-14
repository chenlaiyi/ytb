<template>
  <div class="branch-menus-page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">分支菜单管理</h1>
        <p class="page-description">管理分支机构后台菜单配置</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog" :icon="Plus">
          新增菜单
        </el-button>
        <el-button @click="refreshMenus" :icon="Refresh">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 分支机构选择 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" inline>
        <el-form-item label="分支机构:">
          <el-select 
            v-model="filterForm.branchId" 
            placeholder="选择分支机构"
            clearable
            @change="handleBranchChange"
            style="width: 200px"
          >
            <el-option label="全局模板" :value="null" />
            <el-option 
              v-for="branch in branchOptions" 
              :key="branch.id" 
              :label="branch.name" 
              :value="branch.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadMenus" :icon="Search">
            查询
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 菜单树 -->
    <el-card class="menu-tree-card" shadow="never">
      <div class="card-header">
        <span class="card-title">菜单结构</span>
        <div class="card-actions">
          <el-button 
            v-if="filterForm.branchId && menuList.length === 0"
            type="primary" 
            @click="initializeBranchMenus"
            :icon="Download"
            :loading="initializing"
          >
            初始化菜单
          </el-button>
        </div>
      </div>
      
      <el-tree
        ref="menuTreeRef"
        :data="menuTreeData"
        :props="treeProps"
        node-key="id"
        :expand-on-click-node="false"
        :default-expand-all="true"
        class="menu-tree"
        v-loading="loading"
      >
        <template #default="{ node, data }">
          <div class="tree-node">
            <div class="node-content">
              <el-icon class="node-icon">
                <component :is="data.icon || 'Document'" />
              </el-icon>
              <span class="node-title">{{ data.title }}</span>
              <el-tag 
                v-if="data.is_system" 
                type="warning" 
                size="small"
                class="system-tag"
              >
                系统
              </el-tag>
              <el-tag 
                :type="data.is_enabled ? 'success' : 'danger'" 
                size="small"
                class="status-tag"
              >
                {{ data.is_enabled ? '启用' : '禁用' }}
              </el-tag>
            </div>
            <div class="node-actions">
              <el-button
                type="primary"
                size="small"
                text
                @click="editMenu(data)"
                :icon="Edit"
              >
                编辑
              </el-button>
              <el-button
                type="primary"
                size="small"
                text
                @click="addChildMenu(data)"
                :icon="Plus"
              >
                添加子菜单
              </el-button>
              <el-button
                :type="data.is_enabled ? 'warning' : 'success'"
                size="small"
                text
                @click="toggleMenuStatus(data)"
                :icon="data.is_enabled ? 'Hide' : 'View'"
              >
                {{ data.is_enabled ? '禁用' : '启用' }}
              </el-button>
              <el-button
                v-if="!data.is_system"
                type="danger"
                size="small"
                text
                @click="deleteMenu(data)"
                :icon="Delete"
              >
                删除
              </el-button>
            </div>
          </div>
        </template>
      </el-tree>
    </el-card>

    <!-- 菜单编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="菜单标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入菜单标题" />
        </el-form-item>
        
        <el-form-item label="菜单图标" prop="icon">
          <el-input v-model="formData.icon" placeholder="请输入图标名称">
            <template #prepend>
              <el-icon v-if="formData.icon">
                <component :is="formData.icon" />
              </el-icon>
            </template>
          </el-input>
          <div class="icon-tips">
            常用图标：Menu, Setting, User, Monitor, Wallet, DataAnalysis, Shop, Tools
          </div>
        </el-form-item>
        
        <el-form-item label="菜单路径" prop="path">
          <el-input v-model="formData.path" placeholder="请输入菜单路径" />
        </el-form-item>
        
        <el-form-item label="父级菜单" prop="parent_id">
          <el-select v-model="formData.parent_id" placeholder="选择父级菜单" style="width: 100%">
            <el-option label="顶级菜单" :value="0" />
            <el-option
              v-for="option in parentMenuOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="formData.sort_order" :min="0" :max="999" />
        </el-form-item>
        
        <el-form-item label="菜单类型" prop="menu_type">
          <el-radio-group v-model="formData.menu_type">
            <el-radio :label="1">菜单</el-radio>
            <el-radio :label="2">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="权限标识" prop="permission">
          <el-input v-model="formData.permission" placeholder="请输入权限标识" />
        </el-form-item>
        
        <el-form-item label="菜单描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入菜单描述"
          />
        </el-form-item>
        
        <el-form-item label="启用状态">
          <el-switch v-model="formData.is_enabled" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, 
  Refresh, 
  Search, 
  Edit, 
  Delete, 
  Download,
  Hide,
  View
} from '@element-plus/icons-vue'
import { 
  getBranchMenus, 
  createBranchMenu, 
  updateBranchMenu, 
  deleteBranchMenu,
  updateBranchMenuStatus,
  initializeBranchMenus as initializeBranchMenusAPI,
  getParentMenuOptions
} from '@/api/branchMenu'
import { getBranchOrganizations } from '@/api/branchOrganization'

// 响应式数据
const loading = ref(false)
const initializing = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const menuTreeRef = ref()
const formRef = ref()

const filterForm = reactive({
  branchId: null
})

const formData = reactive({
  id: null,
  branch_id: null,
  parent_id: 0,
  title: '',
  icon: '',
  path: '',
  sort_order: 0,
  is_enabled: true,
  menu_type: 1,
  permission: '',
  description: ''
})

const menuList = ref([])
const branchOptions = ref([])
const parentMenuOptions = ref([])

// 计算属性
const dialogTitle = computed(() => {
  return formData.id ? '编辑菜单' : '新增菜单'
})

const menuTreeData = computed(() => {
  return buildMenuTree(menuList.value)
})

// 树形组件配置
const treeProps = {
  children: 'children',
  label: 'title'
}

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入菜单标题', trigger: 'blur' }
  ],
  path: [
    { required: true, message: '请输入菜单路径', trigger: 'blur' }
  ],
  parent_id: [
    { required: true, message: '请选择父级菜单', trigger: 'change' }
  ],
  sort_order: [
    { required: true, message: '请输入排序值', trigger: 'blur' }
  ],
  menu_type: [
    { required: true, message: '请选择菜单类型', trigger: 'change' }
  ]
}

// 方法
const buildMenuTree = (menus) => {
  const menuMap = {}
  const roots = []
  
  // 创建映射
  menus.forEach(menu => {
    menuMap[menu.id] = { ...menu, children: [] }
  })
  
  // 构建树形结构
  menus.forEach(menu => {
    if (menu.parent_id === 0) {
      roots.push(menuMap[menu.id])
    } else if (menuMap[menu.parent_id]) {
      menuMap[menu.parent_id].children.push(menuMap[menu.id])
    }
  })
  
  return roots
}

const loadMenus = async () => {
  try {
    loading.value = true
    const params = {}
    if (filterForm.branchId) {
      params.branch_id = filterForm.branchId
    }
    
    const response = await getBranchMenus(params)
    if (response.code === 0 || response.code === 200) {
      menuList.value = response.data || []
    } else {
      ElMessage.error(response.message || '获取菜单失败')
    }
  } catch (error) {
    console.error('获取菜单失败:', error)
    ElMessage.error('获取菜单失败')
  } finally {
    loading.value = false
  }
}

const loadBranchOptions = async () => {
  try {
    const response = await getBranchOrganizations()
    if (response.code === 0 || response.code === 200) {
      branchOptions.value = response.data || []
    }
  } catch (error) {
    console.error('获取分支机构列表失败:', error)
  }
}

const loadParentMenuOptions = async () => {
  try {
    const params = {}
    if (filterForm.branchId) {
      params.branch_id = filterForm.branchId
    }
    if (formData.id) {
      params.exclude_id = formData.id
    }
    
    const response = await getParentMenuOptions(params)
    if (response.code === 0 || response.code === 200) {
      parentMenuOptions.value = response.data || []
    }
  } catch (error) {
    console.error('获取父菜单选项失败:', error)
  }
}

const handleBranchChange = () => {
  menuList.value = []
  loadMenus()
}

const refreshMenus = () => {
  loadMenus()
}

const showAddDialog = async () => {
  resetForm()
  formData.branch_id = filterForm.branchId
  await loadParentMenuOptions()
  dialogVisible.value = true
}

const editMenu = async (menu) => {
  resetForm()
  Object.assign(formData, menu)
  await loadParentMenuOptions()
  dialogVisible.value = true
}

const addChildMenu = async (parentMenu) => {
  resetForm()
  formData.branch_id = filterForm.branchId
  formData.parent_id = parentMenu.id
  await loadParentMenuOptions()
  dialogVisible.value = true
}

const toggleMenuStatus = async (menu) => {
  try {
    const action = menu.is_enabled ? '禁用' : '启用'
    await ElMessageBox.confirm(
      `确定要${action}菜单"${menu.title}"吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await updateBranchMenuStatus(menu.id, {
      is_enabled: !menu.is_enabled
    })
    
    if (response.code === 0 || response.code === 200) {
      ElMessage.success(`${action}成功`)
      loadMenus()
    } else {
      ElMessage.error(response.message || `${action}失败`)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('更新菜单状态失败:', error)
      ElMessage.error('操作失败')
    }
  }
}

const deleteMenu = async (menu) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除菜单"${menu.title}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await deleteBranchMenu(menu.id)
    if (response.code === 0 || response.code === 200) {
      ElMessage.success('删除成功')
      loadMenus()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除菜单失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const initializeBranchMenus = async () => {
  if (!filterForm.branchId) {
    ElMessage.warning('请先选择分支机构')
    return
  }
  
  try {
    initializing.value = true
    const response = await initializeBranchMenusAPI({
      branch_id: filterForm.branchId
    })
    
    if (response.code === 0 || response.code === 200) {
      ElMessage.success('初始化菜单成功')
      loadMenus()
    } else {
      ElMessage.error(response.message || '初始化菜单失败')
    }
  } catch (error) {
    console.error('初始化菜单失败:', error)
    ElMessage.error('初始化菜单失败')
  } finally {
    initializing.value = false
  }
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
    submitting.value = true
    
    const isEdit = !!formData.id
    const response = isEdit 
      ? await updateBranchMenu(formData.id, formData)
      : await createBranchMenu(formData)
    
    if (response.code === 0 || response.code === 200 || response.code === 201) {
      ElMessage.success(isEdit ? '更新成功' : '创建成功')
      dialogVisible.value = false
      loadMenus()
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error) {
    console.error('提交表单失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  Object.assign(formData, {
    id: null,
    branch_id: null,
    parent_id: 0,
    title: '',
    icon: '',
    path: '',
    sort_order: 0,
    is_enabled: true,
    menu_type: 1,
    permission: '',
    description: ''
  })
  
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// 生命周期
onMounted(() => {
  loadBranchOptions()
  loadMenus()
})
</script>

<style scoped>
.branch-menus-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-content h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.header-content p {
  margin: 5px 0 0 0;
  color: #909399;
  font-size: 14px;
}

.filter-card {
  margin-bottom: 20px;
}

.menu-tree-card {
  min-height: 500px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.menu-tree {
  margin-top: 10px;
}

.tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 5px 0;
}

.node-content {
  display: flex;
  align-items: center;
  flex: 1;
}

.node-icon {
  margin-right: 8px;
  color: #606266;
}

.node-title {
  margin-right: 10px;
  font-weight: 500;
}

.system-tag,
.status-tag {
  margin-left: 8px;
}

.node-actions {
  display: flex;
  gap: 5px;
}

.icon-tips {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style> 