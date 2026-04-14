<template>
  <div class="menu-page">
    <header class="menu-toolbar">
      <div class="action-line">
        <div class="title-block">
          <el-icon><Menu /></el-icon>
          <span>系统菜单</span>
          <el-tag size="small" effect="plain">共 {{ totalCount }} 个节点</el-tag>
        </div>
        <div class="action-buttons">
          <el-button type="primary" :icon="Plus" @click="handleAddRoot">新增顶级</el-button>
          <el-button
            type="success"
            plain
            :icon="CirclePlus"
            :disabled="!activeMenu"
            @click="handleCreateChildFromActive"
          >
            在当前节点新增
          </el-button>
          <el-button type="warning" plain :icon="MagicStick" :loading="initLoading" @click="initDefaultMenus">
            初始化
          </el-button>
          <el-button plain :icon="RefreshRight" :loading="loading" @click="fetchMenuData">刷新</el-button>
        </div>
      </div>
      <el-form class="filter-line" :model="searchForm" inline>
        <el-form-item label="菜单名称">
          <el-input v-model="searchForm.title" placeholder="支持模糊搜索" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.is_enabled" placeholder="全部" clearable style="width: 140px">
            <el-option label="显示" :value="1" />
            <el-option label="隐藏" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          <el-button :icon="isExpandAll ? FolderOpened : Folder" @click="toggleExpandAll">
            {{ isExpandAll ? '收起全部' : '展开全部' }}
          </el-button>
        </el-form-item>
      </el-form>
    </header>

    <div class="menu-layout">
      <aside class="tree-panel">
        <div class="tree-toolbar">
          <el-input
            v-model="treeFilterText"
            :suffix-icon="Search"
            clearable
            placeholder="过滤菜单"
            size="small"
          />
        </div>
        <el-scrollbar class="tree-scroll">
          <el-tree
            ref="treeRef"
            :data="menuTreeData"
            node-key="id"
            default-expand-all
            highlight-current
            :expand-on-click-node="false"
            :props="{ children: 'children', label: 'title' }"
            :filter-node-method="filterTreeNode"
            @node-click="handleTreeNodeClick"
          >
            <template #default="{ data }">
              <div class="tree-node">
                <div class="tree-node-main">
                  <el-icon v-if="data.icon" class="tree-node-icon">
                    <component :is="getIconComponent(data.icon)" />
                  </el-icon>
                  <span class="tree-node-title">{{ data.title }}</span>
                </div>
                <el-tag size="small" :type="getLevelTagType(data.level)">
                  {{ getLevelLabel(data.level) }}
                </el-tag>
              </div>
            </template>
          </el-tree>
        </el-scrollbar>
      </aside>

      <section class="table-panel">
        <div class="selected-tip" v-if="activeMenu">
          <span class="selected-title">{{ activeMenu.title }}</span>
          <span class="selected-meta">ID #{{ activeMenu.id }}</span>
          <span class="selected-meta">路径 {{ activeMenu.path || '-' }}</span>
          <span class="selected-meta">{{ Number(activeMenu.is_enabled) === 1 ? '显示' : '隐藏' }}</span>
        </div>
        <el-empty v-else description="请选择左侧任一菜单节点" class="selected-placeholder" />

        <el-table
          ref="tableRef"
          v-loading="loading"
          :data="menuTreeData"
          row-key="id"
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
          :default-expand-all="isExpandAll"
          highlight-current-row
          border
          style="width: 100%"
          @expand-change="handleExpandChange"
          @row-click="handleRowClick"
        >
          <el-table-column prop="id" label="ID" width="80" align="center">
            <template #default="{ row }">
              <el-tag size="small">{{ row.id }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="title" label="菜单名称" min-width="220">
            <template #default="{ row }">
              <div class="menu-title">
                <el-icon v-if="row.icon" class="menu-icon">
                  <component :is="getIconComponent(row.icon)" />
                </el-icon>
                <span class="menu-name">{{ row.title }}</span>
                <el-tag v-if="row.level === 0" type="primary" size="small">顶级</el-tag>
                <el-tag v-else-if="row.level === 1" type="success" size="small">二级</el-tag>
                <el-tag v-else-if="row.level === 2" type="warning" size="small">三级</el-tag>
                <el-tag v-else type="info" size="small">{{ row.level + 1 }}级</el-tag>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="path" label="路径" min-width="180">
            <template #default="{ row }">
              <span class="mono" v-if="row.path">{{ row.path }}</span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>

          <el-table-column prop="permission" label="权限标识" min-width="160">
            <template #default="{ row }">
              <span class="mono" v-if="row.permission">{{ row.permission }}</span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>

          <el-table-column prop="sort_order" label="排序" width="100" align="center">
            <template #default="{ row }">
              <el-input-number
                v-model="row.sort_order"
                :min="0"
                :max="999"
                size="small"
                @change="handleSortChange(row)"
                style="width: 80px"
              />
            </template>
          </el-table-column>

          <el-table-column prop="is_enabled" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-switch
                v-model="row.is_enabled"
                :active-value="1"
                :inactive-value="0"
                @change="handleStatusChange(row)"
              />
            </template>
          </el-table-column>

          <el-table-column label="操作" width="280" fixed="right" align="center">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="handleEdit(row)">编辑</el-button>
              <el-button size="small" type="success" link @click="handleAddChild(row)">子菜单</el-button>
              <el-button size="small" type="warning" link @click="handleCopy(row)">复制</el-button>
              <el-button size="small" type="danger" link @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </section>
    </div>

    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="600px"
      @close="resetForm"
      destroy-on-close
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="父级菜单" prop="parent_id">
          <el-tree-select
            v-model="formData.parent_id"
            :data="parentMenuOptions"
            :props="{ value: 'id', label: 'title', children: 'children' }"
            placeholder="请选择父级菜单，不选则为顶级菜单"
            clearable
            check-strictly
            style="width: 100%"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="菜单名称" prop="title">
              <el-input v-model="formData.title" placeholder="请输入菜单名称" maxlength="50" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="菜单图标" prop="icon">
              <el-input v-model="formData.icon" placeholder="请输入图标名称，如：Menu" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="16">
            <el-form-item label="菜单路径" prop="path">
              <el-input v-model="formData.path" placeholder="请输入菜单路径，如：system/menu" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="排序" prop="sort_order">
              <el-input-number v-model="formData.sort_order" :min="0" :max="999" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="菜单类型" prop="menu_type">
              <el-radio-group v-model="formData.menu_type">
                <el-radio :label="1">菜单</el-radio>
                <el-radio :label="2">按钮</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否显示" prop="is_enabled">
              <el-switch v-model="formData.is_enabled" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="权限标识" prop="permission">
          <el-input v-model="formData.permission" placeholder="请输入权限标识，如：system:menu:list" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted, computed, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import {
  Menu,
  Plus,
  CirclePlus,
  MagicStick,
  RefreshRight,
  Search,
  Refresh,
  Edit,
  Delete,
  Folder,
  FolderOpened
} from '@element-plus/icons-vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { 
  getMenuList, 
  createMenu, 
  updateMenu, 
  deleteMenu, 
  getMenuDetail,
  updateMenuStatus,
  updateMenuSort,
  initializeDefaultMenus
} from '@/api/v1/menu'

// 响应式数据
const loading = ref(false)
const initLoading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isExpandAll = ref(false)
const formRef = ref()
const activeMenu = ref(null)
const treeRef = ref()
const treeFilterText = ref('')

// 搜索表单
const searchForm = reactive({
  title: '',
  is_enabled: null
})

// 菜单数据
const menuList = ref([])
const menuTreeData = ref([])
const parentMenuOptions = ref([])

// 表单数据
const formData = reactive({
  id: null,
  parent_id: 0,
  title: '',
  icon: '',
  path: '',
  sort_order: 0,
  is_enabled: 1,
  menu_type: 1,
  permission: ''
})

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' },
    { min: 1, max: 50, message: '菜单名称长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  sort_order: [
    { required: true, message: '请输入排序值', trigger: 'blur' },
    { type: 'number', min: 0, max: 999, message: '排序值必须在 0-999 之间', trigger: 'blur' }
  ]
}

// 计算属性
const totalCount = computed(() => {
  const countMenus = (menus) => {
    let count = 0
    menus.forEach(menu => {
      count++
      if (menu.children && menu.children.length > 0) {
        count += countMenus(menu.children)
      }
    })
    return count
  }
  return countMenus(menuTreeData.value)
})

// 获取图标组件
const getIconComponent = (iconName) => {
  if (!iconName) return null
  return ElementPlusIconsVue[iconName] || null
}

// 构建树形结构
const buildMenuTree = (menus, parentId = 0, level = 0) => {
  const tree = []
  
  menus.forEach(menu => {
    if (parseInt(menu.parent_id) === parentId) {
      const menuItem = { ...menu }
      menuItem.level = level
      
      // 递归构建子菜单
      const children = buildMenuTree(menus, parseInt(menu.id), level + 1)
      if (children.length > 0) {
        menuItem.children = children
        menuItem.hasChildren = true
      } else {
        menuItem.children = []
        menuItem.hasChildren = false
      }
      
      tree.push(menuItem)
    }
  })
  
  // 按排序字段排序
  return tree.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
}

// 构建父级菜单选项
const buildParentOptions = (menus, excludeId = null) => {
  const options = [{ id: 0, title: '顶级菜单', children: [] }]
  
  const buildOptions = (menuList, parentId = 0) => {
    const result = []
    menuList.forEach(menu => {
      if (parseInt(menu.parent_id) === parentId && menu.id !== excludeId) {
        const option = {
          id: menu.id,
          title: menu.title,
          children: buildOptions(menuList, menu.id)
        }
        result.push(option)
      }
    })
    return result.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  }
  
  options[0].children = buildOptions(menus)
  return options
}

const findMenuInTree = (tree, id) => {
  if (!Array.isArray(tree) || id === null || id === undefined) {
    return null
  }
  for (const node of tree) {
    if (Number(node.id) === Number(id)) {
      return node
    }
    if (node.children && node.children.length) {
      const childMatch = findMenuInTree(node.children, id)
      if (childMatch) {
        return childMatch
      }
    }
  }
  return null
}

const syncActiveMenu = () => {
  if (!menuTreeData.value.length) {
    activeMenu.value = null
    return
  }
  if (activeMenu.value) {
    const matched = findMenuInTree(menuTreeData.value, activeMenu.value.id)
    if (matched) {
      activeMenu.value = matched
      nextTick(() => {
        treeRef.value?.setCurrentKey(activeMenu.value?.id ?? null)
        tableRef.value?.setCurrentRow(activeMenu.value)
      })
      return
    }
  }
  activeMenu.value = menuTreeData.value[0]
  nextTick(() => {
    treeRef.value?.setCurrentKey(activeMenu.value?.id ?? null)
    tableRef.value?.setCurrentRow(activeMenu.value)
  })
}

// 过滤菜单数据
const filterMenuData = (tree) => {
  if (!searchForm.title && searchForm.is_enabled === null) {
    return tree
  }
  
  const filtered = []
  tree.forEach(item => {
    let shouldInclude = true
    
    // 标题筛选
    if (searchForm.title) {
      const titleMatch = item.title.toLowerCase().includes(searchForm.title.toLowerCase())
      const hasMatchingChild = item.children && item.children.some(child => 
        child.title.toLowerCase().includes(searchForm.title.toLowerCase())
      )
      shouldInclude = titleMatch || hasMatchingChild
    }
    
    // 状态筛选
    if (searchForm.is_enabled !== null) {
      shouldInclude = shouldInclude && (item.is_enabled === searchForm.is_enabled)
    }
    
    if (shouldInclude) {
      const filteredItem = { ...item }
      if (filteredItem.children && filteredItem.children.length > 0) {
        filteredItem.children = filterMenuData(filteredItem.children)
      }
      filtered.push(filteredItem)
    }
  })
  
  return filtered
}

const filterTreeNode = (value, data) => {
  if (!value) return true
  return data.title?.toLowerCase().includes(value.toLowerCase())
}

const getLevelLabel = (level) => {
  if (level === 0) return '顶级'
  if (level === 1) return '二级'
  if (level === 2) return '三级'
  return `${level + 1}级`
}

const getLevelTagType = (level) => {
  if (level === 0) return 'primary'
  if (level === 1) return 'success'
  if (level === 2) return 'warning'
  return 'info'
}

// 获取菜单数据
const fetchMenuData = async () => {
  loading.value = true
  try {
    const response = await getMenuList()
    if (response && response.code === 0) {
      menuList.value = response.data || []
      menuTreeData.value = buildMenuTree(menuList.value)
      parentMenuOptions.value = buildParentOptions(menuList.value)
      syncActiveMenu()
      
      ElNotification({
        title: '成功',
        message: `已加载 ${totalCount.value} 个菜单`,
        type: 'success'
      })
    } else {
      throw new Error(response?.message || '获取菜单数据失败')
    }
  } catch (error) {
    console.error('获取菜单数据失败:', error)
    ElMessage.error('获取菜单数据失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 初始化默认菜单
const initDefaultMenus = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要初始化默认菜单吗？这将创建系统预设的菜单结构。',
      '确认初始化',
      { type: 'warning' }
    )
    
    initLoading.value = true
    const response = await initializeDefaultMenus()
    if (response && response.code === 0) {
      await fetchMenuData()
      ElMessage.success('默认菜单初始化完成')
    } else {
      throw new Error(response?.message || '初始化失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('初始化失败: ' + error.message)
    }
  } finally {
    initLoading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  menuTreeData.value = filterMenuData(buildMenuTree(menuList.value))
  syncActiveMenu()
}

// 重置搜索
const handleReset = () => {
  searchForm.title = ''
  searchForm.is_enabled = null
  menuTreeData.value = buildMenuTree(menuList.value)
  syncActiveMenu()
}

// 展开/收起全部
const tableRef = ref()
const toggleExpandAll = () => {
  isExpandAll.value = !isExpandAll.value
  
  // 递归展开/收起所有行
  const toggleRows = (data) => {
    data.forEach(row => {
      if (row.children && row.children.length > 0) {
        if (isExpandAll.value) {
          tableRef.value?.toggleRowExpansion(row, true)
        } else {
          tableRef.value?.toggleRowExpansion(row, false)
        }
        toggleRows(row.children)
      }
    })
  }
  
  // 延迟执行，确保表格已渲染
  nextTick(() => {
    toggleRows(menuTreeData.value)
  })
}

watch(treeFilterText, (val) => {
  if (treeRef.value) {
    treeRef.value.filter(val)
  }
})

// 展开变化处理
const handleExpandChange = (row, expandedRows) => {
  // 可以在这里处理展开状态变化
}

// 新增菜单
const handleAddRoot = () => {
  dialogTitle.value = '新增顶级菜单'
  resetFormData()
  formData.parent_id = 0
  parentMenuOptions.value = buildParentOptions(menuList.value)
  dialogVisible.value = true
}

const handleAdd = () => {
  dialogTitle.value = '新增菜单'
  resetFormData()
  parentMenuOptions.value = buildParentOptions(menuList.value)
  dialogVisible.value = true
}

// 编辑菜单
const handleEdit = async (row) => {
  dialogTitle.value = '编辑菜单'
  try {
    const response = await getMenuDetail(row.id)
    if (response && response.code === 0) {
      Object.assign(formData, response.data)
      parentMenuOptions.value = buildParentOptions(menuList.value, row.id)
      dialogVisible.value = true
    } else {
      throw new Error(response?.message || '获取菜单详情失败')
    }
  } catch (error) {
    ElMessage.error('获取菜单详情失败: ' + error.message)
  }
}

// 添加子菜单
const handleAddChild = (row) => {
  dialogTitle.value = '添加子菜单'
  resetFormData()
  formData.parent_id = row.id
  parentMenuOptions.value = buildParentOptions(menuList.value)
  dialogVisible.value = true
}

const handleCreateChildFromActive = () => {
  if (!activeMenu.value) {
    ElMessage.warning('请先选择一个菜单节点')
    return
  }
  handleAddChild(activeMenu.value)
}

const handleRowClick = (row) => {
  activeMenu.value = row
  treeRef.value?.setCurrentKey(row.id)
}

const handleTreeNodeClick = (nodeData) => {
  activeMenu.value = nodeData
  tableRef.value?.setCurrentRow(nodeData)
}

// 复制菜单
const handleCopy = (row) => {
  dialogTitle.value = '复制菜单'
  Object.assign(formData, {
    id: null,
    parent_id: row.parent_id,
    title: row.title + ' - 副本',
    icon: row.icon,
    path: row.path,
    sort_order: row.sort_order,
    is_enabled: row.is_enabled,
    menu_type: row.menu_type,
    permission: row.permission
  })
  parentMenuOptions.value = buildParentOptions(menuList.value)
  dialogVisible.value = true
}

// 删除菜单
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除菜单"${row.title}"吗？删除后不可恢复！`,
      '确认删除',
      { type: 'warning' }
    )
    
    const response = await deleteMenu(row.id)
    if (response && response.code === 0) {
      ElMessage.success('删除成功')
      await fetchMenuData()
    } else {
      throw new Error(response?.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + error.message)
    }
  }
}

// 状态变更
const handleStatusChange = async (row) => {
  try {
    const response = await updateMenuStatus(row.id, row.is_enabled)
    if (response && response.code === 0) {
      ElMessage.success('状态更新成功')
    } else {
      throw new Error(response?.message || '状态更新失败')
    }
  } catch (error) {
    // 恢复原状态
    row.is_enabled = row.is_enabled === 1 ? 0 : 1
    ElMessage.error('状态更新失败: ' + error.message)
  }
}

// 排序变更
const handleSortChange = async (row) => {
  try {
    const response = await updateMenuSort([{ id: row.id, sort_order: row.sort_order }])
    if (response && response.code === 0) {
      ElMessage.success('排序更新成功')
      // 重新排序显示
      menuTreeData.value = buildMenuTree(menuList.value)
    } else {
      throw new Error(response?.message || '排序更新失败')
    }
  } catch (error) {
    ElMessage.error('排序更新失败: ' + error.message)
    await fetchMenuData() // 重新获取数据
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    const isEdit = !!formData.id
    const apiCall = isEdit ? updateMenu(formData.id, formData) : createMenu(formData)
    
    const response = await apiCall
    if (response && response.code === 0) {
      ElMessage.success(isEdit ? '更新成功' : '创建成功')
      dialogVisible.value = false
      await fetchMenuData()
    } else {
      throw new Error(response?.message || '操作失败')
    }
  } catch (error) {
    if (error.errors) {
      // 处理验证错误
      const firstError = Object.values(error.errors)[0]
      ElMessage.error(firstError[0])
    } else {
      ElMessage.error('操作失败: ' + error.message)
    }
  } finally {
    submitLoading.value = false
  }
}

// 重置表单数据
const resetFormData = () => {
  Object.assign(formData, {
    id: null,
    parent_id: 0,
    title: '',
    icon: '',
    path: '',
    sort_order: 0,
    is_enabled: 1,
    menu_type: 1,
    permission: ''
  })
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  resetFormData()
}

// 生命周期
onMounted(() => {
  fetchMenuData()
})
</script>

<style scoped>
.menu-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: #f5f6f9;
  min-height: calc(100vh - 120px);
}

.menu-toolbar {
  background: #fff;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.title-block {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-line {
  margin-top: 4px;
}

.menu-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 16px;
}

.tree-panel,
.table-panel {
  background: #fff;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
}

.tree-toolbar {
  margin-bottom: 8px;
}

.tree-scroll {
  flex: 1;
  min-height: 400px;
}

.tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.tree-node-main {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tree-node-title {
  font-size: 14px;
}

.tree-node-icon {
  color: #409eff;
}

.table-panel {
  gap: 12px;
}

.selected-tip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}

.selected-title {
  font-weight: 600;
  color: #303133;
}

.selected-meta {
  padding: 2px 8px;
  background: #f0f2f5;
  border-radius: 999px;
}

.selected-placeholder {
  margin-bottom: 12px;
}

.menu-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.menu-icon {
  color: #409eff;
}

.menu-name {
  font-weight: 500;
}

.mono {
  font-family: SFMono-Regular, Consolas, monospace;
  font-size: 13px;
}

.text-muted {
  color: #909399;
}

@media (max-width: 1024px) {
  .menu-layout {
    grid-template-columns: 1fr;
  }
  .action-line {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
