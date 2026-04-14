<template>
  <div class="home-nav-manager">
    <!-- 操作栏 -->
    <div class="action-bar">
      <div class="action-left">
        <h3 class="section-title">首页导航设置</h3>
        <p class="section-desc">管理APP首页的快捷导航图标</p>
      </div>
      <div class="action-right">
        <el-button type="primary" @click="handleAddNav">
          <el-icon><Plus /></el-icon>
          添加导航
        </el-button>
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 导航网格预览 -->
    <div class="nav-preview-section">
      <div class="preview-header">
        <span class="preview-title">导航预览</span>
        <el-tag size="small" type="info">共 {{ navItems.length }} 个导航项</el-tag>
      </div>
      <div class="nav-grid-preview">
        <div 
          v-for="item in sortedNavItems" 
          :key="item.id" 
          class="nav-preview-item"
          :class="{ 'disabled': item.status !== 1 }"
          @click="handleEdit(item)"
        >
          <div class="nav-icon">
            <i :class="['van-icon', `van-icon-${item.icon}`]"></i>
          </div>
          <span class="nav-name">{{ item.nav_name }}</span>
          <div class="nav-status">
            <el-tag 
              :type="item.status === 1 ? 'success' : 'info'" 
              size="small"
              effect="plain"
            >
              {{ item.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </div>
        </div>
        <div 
          class="nav-preview-item add-item"
          @click="handleAddNav"
          v-if="navItems.length < 8"
        >
          <div class="nav-icon">
            <el-icon><Plus /></el-icon>
          </div>
          <span class="nav-name">添加导航</span>
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <div class="table-header">
        <span class="table-title">导航列表</span>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索导航名称"
          prefix-icon="Search"
          clearable
          class="search-input"
        />
      </div>
      
      <el-table
        :data="filteredNavItems"
        border
        stripe
        v-loading="loading"
        row-key="id"
        @row-click="handleEdit"
        class="nav-table"
      >
        <el-table-column prop="id" label="ID" width="60" align="center" />
        <el-table-column label="图标" width="80" align="center">
          <template #default="scope">
            <i :class="['van-icon', `van-icon-${scope.row.icon}`]" 
               style="font-size: 20px; color: #409eff;"></i>
          </template>
        </el-table-column>
        <el-table-column prop="nav_name" label="导航名称" width="120" />
        <el-table-column prop="icon" label="图标名称" width="120" />
        <el-table-column prop="path" label="链接地址" min-width="150" show-overflow-tooltip />
        <el-table-column label="状态" width="80" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'" size="small">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="80" align="center" />
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" link @click.stop="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button size="small" type="danger" link @click.stop="handleDelete(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑导航' : '添加导航'"
      width="500px"
      destroy-on-close
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="导航名称" prop="nav_name">
          <el-input v-model="form.nav_name" placeholder="请输入导航名称" maxlength="6" />
        </el-form-item>
        
        <el-form-item label="图标" prop="icon">
          <div class="icon-selector">
            <el-input v-model="form.icon" placeholder="请选择图标">
              <template #prepend>
                <i :class="['van-icon', `van-icon-${form.icon}`]" style="font-size: 18px;"></i>
              </template>
            </el-input>
            <div class="icon-grid">
              <div 
                v-for="icon in commonIcons" 
                :key="icon.name"
                class="icon-option"
                :class="{ 'selected': form.icon === icon.name }"
                @click="form.icon = icon.name"
              >
                <i :class="['van-icon', `van-icon-${icon.name}`]"></i>
                <span>{{ icon.label }}</span>
              </div>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="链接地址" prop="path">
          <el-input v-model="form.path" placeholder="请输入链接地址" />
          <div class="path-suggestions">
            <el-tag 
              v-for="path in commonPaths" 
              :key="path.value"
              size="small"
              @click="form.path = path.value"
              style="cursor: pointer; margin: 2px;"
            >
              {{ path.label }}
            </el-tag>
          </div>
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="form.sort_order" :min="0" :max="99" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import axios from 'axios'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEditing = ref(false)
const navItems = ref([])
const searchKeyword = ref('')
const formRef = ref(null)

// 表单数据
const form = reactive({
  id: null,
  nav_name: '',
  icon: 'apps-o',
  path: '',
  status: 1,
  sort_order: 0,
  highlight: 0
})

// 验证规则
const rules = {
  nav_name: [{ required: true, message: '请输入导航名称', trigger: 'blur' }],
  icon: [{ required: true, message: '请选择图标', trigger: 'blur' }],
  path: [{ required: true, message: '请输入链接地址', trigger: 'blur' }]
}

// 常用图标
const commonIcons = [
  { name: 'home-o', label: '首页' },
  { name: 'cart-o', label: '购物车' },
  { name: 'shop-o', label: '商店' },
  { name: 'gift-o', label: '礼品' },
  { name: 'coupon-o', label: '优惠券' },
  { name: 'location-o', label: '位置' },
  { name: 'gold-coin-o', label: '金币' },
  { name: 'user-o', label: '用户' },
  { name: 'setting-o', label: '设置' },
  { name: 'service-o', label: '客服' },
  { name: 'balance-o', label: '钱包' },
  { name: 'orders-o', label: '订单' }
]

// 常用路径
const commonPaths = [
  { label: '首页', value: '/' },
  { label: '商城', value: '/mall' },
  { label: '购水', value: '/water' },
  { label: '我的', value: '/user' },
  { label: '取水点', value: '/stations' },
  { label: '积分兑换', value: '/points' },
  { label: '优惠券', value: '/coupons' },
  { label: '充值', value: '/recharge' }
]

// 计算属性
const sortedNavItems = computed(() => {
  return [...navItems.value].sort((a, b) => a.sort_order - b.sort_order)
})

const filteredNavItems = computed(() => {
  if (!searchKeyword.value) return navItems.value
  
  const keyword = searchKeyword.value.toLowerCase()
  return navItems.value.filter(item =>
    item.nav_name.toLowerCase().includes(keyword) ||
    item.icon.toLowerCase().includes(keyword) ||
    item.path.toLowerCase().includes(keyword)
  )
})

// 方法
const fetchData = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/admin/v1/navs/home')
    if (response.data && response.data.code === 0) {
      navItems.value = response.data.data || []
    } else {
      ElMessage.error('获取数据失败')
    }
  } catch (error) {
    console.error('获取数据失败', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  fetchData()
  ElMessage.success('数据已刷新')
}

const handleAddNav = () => {
  isEditing.value = false
  Object.assign(form, {
    id: null,
    nav_name: '',
    icon: 'apps-o',
    path: '',
    status: 1,
    sort_order: navItems.value.length + 1,
    highlight: 0
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEditing.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除此导航项吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await axios.delete(`/api/admin/v1/navs/home/${row.id}`)
      ElMessage.success('删除成功')
      fetchData()
    } catch (error) {
      console.error('删除失败', error)
      ElMessage.error('删除失败')
    }
  })
}

const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (isEditing.value) {
      await axios.put(`/api/admin/v1/navs/home/${form.id}`, form)
      ElMessage.success('更新成功')
    } else {
              await axios.post('/api/admin/v1/navs/home', form)
      ElMessage.success('添加成功')
    }
    
    dialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error('提交失败', error)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

// 生命周期
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.home-nav-manager {
  padding: 0;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.action-left {
  flex: 1;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 4px 0;
}

.section-desc {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.action-right {
  display: flex;
  gap: 12px;
}

.nav-preview-section {
  margin-bottom: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.preview-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.nav-grid-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  padding: 20px 24px;
}

.nav-preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px;
  border: 2px solid #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.nav-preview-item:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.nav-preview-item.disabled {
  opacity: 0.5;
}

.nav-preview-item.add-item {
  border-style: dashed;
  color: #909399;
}

.nav-preview-item.add-item:hover {
  color: #409eff;
}

.nav-icon {
  font-size: 32px;
  color: #409eff;
  margin-bottom: 8px;
}

.nav-name {
  font-size: 12px;
  color: #606266;
  text-align: center;
  margin-bottom: 8px;
}

.nav-status {
  position: absolute;
  top: 4px;
  right: 4px;
}

.table-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.search-input {
  width: 200px;
}

.nav-table {
  border: none;
}

.icon-selector {
  width: 100%;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.icon-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.icon-option:hover,
.icon-option.selected {
  border-color: #409eff;
  background: #f0f9ff;
}

.icon-option i {
  font-size: 20px;
  color: #409eff;
  margin-bottom: 4px;
}

.icon-option span {
  font-size: 12px;
  color: #606266;
}

.path-suggestions {
  margin-top: 8px;
}

:deep(.el-table) {
  border: none;
}

:deep(.el-table th) {
  background: #fafafa;
}
</style> 