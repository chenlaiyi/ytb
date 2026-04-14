<template>
  <div class="branch-menus-page">
    <div class="page-header">
      <h1>菜单管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog">新增菜单</el-button>
        <el-button @click="refreshMenus">刷新</el-button>
        <el-button @click="initializeMenus" :loading="initializing">初始化菜单</el-button>
      </div>
    </div>

    <el-card>
      <div v-loading="loading">
        <el-table :data="tableData" style="width: 100%">
          <el-table-column prop="title" label="菜单名称" />
          <el-table-column prop="path" label="路径" />
          <el-table-column prop="icon" label="图标" />
          <el-table-column label="类型">
            <template #default="{ row }">
              <el-tag :type="row.menu_type === 1 ? 'primary' : 'info'">
                {{ row.menu_type === 1 ? '菜单' : '按钮' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态">
            <template #default="{ row }">
              <el-switch v-model="row.is_enabled" @change="handleStatusChange(row)" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <el-button size="small" @click="showEditDialog(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 菜单表单对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="菜单名称">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="菜单路径">
          <el-input v-model="form.path" />
        </el-form-item>
        <el-form-item label="菜单图标">
          <el-input v-model="form.icon" />
        </el-form-item>
        <el-form-item label="排序值">
          <el-input-number v-model="form.sort_order" :min="0" />
        </el-form-item>
        <el-form-item label="菜单类型">
          <el-radio-group v-model="form.menu_type">
            <el-radio :label="1">菜单</el-radio>
            <el-radio :label="2">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.is_enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getBranchMenusByBranchId,
  createBranchMenu,
  updateBranchMenu,
  deleteBranchMenu,
  updateBranchMenuStatus,
  initializeBranchMenus
} from '@/api/branchMenu'

const route = useRoute()
const branchId = computed(() => parseInt(route.params.branchId))

const loading = ref(false)
const initializing = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const tableData = ref([])

const form = reactive({
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

onMounted(() => {
  loadMenus()
})

const flattenMenus = (menus) => {
  const result = []
  const flatten = (items, level = 0) => {
    items.forEach(item => {
      result.push({ ...item, level })
      if (item.children && item.children.length > 0) {
        flatten(item.children, level + 1)
      }
    })
  }
  flatten(menus)
  return result
}

const loadMenus = async () => {
  loading.value = true
  try {
    const response = await getBranchMenusByBranchId(branchId.value)
    const menus = response.data || []
    tableData.value = flattenMenus(menus)
  } catch (error) {
    ElMessage.error('加载菜单失败')
  } finally {
    loading.value = false
  }
}

const refreshMenus = () => {
  loadMenus()
  ElMessage.success('菜单已刷新')
}

const initializeMenus = async () => {
  try {
    await ElMessageBox.confirm('确定要初始化菜单吗？', '确认初始化')
    initializing.value = true
    await initializeBranchMenus(branchId.value)
    ElMessage.success('菜单初始化成功')
    loadMenus()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('初始化菜单失败')
    }
  } finally {
    initializing.value = false
  }
}

const showAddDialog = () => {
  resetForm()
  dialogTitle.value = '新增菜单'
  isEdit.value = false
  dialogVisible.value = true
}

const showEditDialog = (menu) => {
  Object.assign(form, { ...menu })
  dialogTitle.value = '编辑菜单'
  isEdit.value = true
  dialogVisible.value = true
}

const resetForm = () => {
  Object.assign(form, {
    id: null,
    branch_id: branchId.value,
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
}

const handleSubmit = async () => {
  try {
    if (isEdit.value) {
      await updateBranchMenu(form.id, form)
      ElMessage.success('菜单更新成功')
    } else {
      await createBranchMenu(form)
      ElMessage.success('菜单创建成功')
    }
    dialogVisible.value = false
    loadMenus()
  } catch (error) {
    ElMessage.error('保存菜单失败')
  }
}

const handleDelete = async (menu) => {
  try {
    await ElMessageBox.confirm(`确定要删除菜单 "${menu.title}" 吗？`, '确认删除')
    await deleteBranchMenu(menu.id)
    ElMessage.success('菜单删除成功')
    loadMenus()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除菜单失败')
    }
  }
}

const handleStatusChange = async (menu) => {
  try {
    await updateBranchMenuStatus(menu.id, menu.is_enabled)
    ElMessage.success(`菜单已${menu.is_enabled ? '启用' : '禁用'}`)
  } catch (error) {
    ElMessage.error('更新菜单状态失败')
    menu.is_enabled = !menu.is_enabled
  }
}
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

.header-actions {
  display: flex;
  gap: 12px;
}
</style> 