<template>
  <div class="bottom-nav-manager">
    <!-- 预览和操作区域 -->
    <div class="preview-action-section">
      <div class="mobile-preview">
        <div class="mobile-frame">
          <div class="mobile-status-bar">
            <div class="time">12:00</div>
            <div class="status-icons"></div>
          </div>
          <div class="mobile-content">
            <div class="content-area">
              <div class="header-bar">APP页面</div>
              <div class="content-placeholder">
                <div class="nav-placeholder">内容区域</div>
              </div>
            </div>
            <div class="bottom-nav-bar">
              <div
                v-for="(item, index) in sortedNavItems.slice(0, 5)"
                :key="index"
                class="nav-item-container"
                :class="{ 'active': index === 0, 'disabled': item.status !== 1 }"
                @click="handleRowClick(item)"
              >
                <div class="nav-icon">
                  <i :class="['van-icon', `van-icon-${item.icon}`]"
                     :style="{color: index === 0 ? '#1989fa' : (item.status === 1 ? '#7d7e80' : '#c8c9cc'), fontSize: '22px'}"></i>
                </div>
                <div class="nav-text" :class="{'text-active': index === 0, 'text-disabled': item.status !== 1}">{{ item.nav_name }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="action-panel">
        <div class="panel-header">
          <h3>底部导航管理</h3>
          <p class="panel-description">为应用添加底部导航，最多支持5个菜单项</p>
        </div>

        <div class="panel-actions">
          <el-button
            type="primary"
            @click="handleAdd"
            :disabled="navItems.length >= 5"
          >
            <el-icon><Plus /></el-icon> 添加导航项
          </el-button>

          <el-button type="success" @click="refreshData">
            <el-icon><Refresh /></el-icon> 刷新数据
          </el-button>
        </div>

        <div v-if="navItems.length >= 5" class="max-items-warning">
          <el-alert
            title="底部导航最多支持5个菜单项"
            type="warning"
            :closable="false"
            show-icon
          />
        </div>

        <div class="action-tips">
          <el-alert
            title=""
            type="info"
            :closable="false"
            show-icon
          >
            <ul class="tips-list">
              <li>底部导航最多支持5个菜单项，超出部分将不会显示</li>
              <li>排序值越小，显示位置越靠左</li>
              <li>高亮选项表示当前页面路径与链接匹配时会高亮显示</li>
            </ul>
          </el-alert>
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="data-table-section">
      <el-card shadow="hover" class="table-card">
        <template #header>
          <div class="card-header">
            <span class="header-title">底部导航列表</span>
            <el-input
              v-model="searchText"
              placeholder="搜索导航名称"
              class="search-input"
              clearable
              prefix-icon="Search"
            />
          </div>
        </template>

        <el-table
          :data="filteredNavItems"
          border
          stripe
          row-key="id"
          v-loading="loading"
          :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
          highlight-current-row
          @row-click="handleRowClick"
        >
          <el-table-column prop="id" label="ID" width="80" align="center" />
          <el-table-column label="图标" width="120" align="center">
            <template #default="scope">
              <div class="icon-preview">
                <i :class="['van-icon', `van-icon-${scope.row.icon}`]"
                   :style="{color: scope.row.status === 1 ? '#7d7e80' : '#c8c9cc', fontSize: '22px'}"></i>
                <span class="icon-name">{{ scope.row.icon }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="nav_name" label="名称" width="150" />
          <el-table-column prop="path" label="链接地址" min-width="180" />
          <el-table-column label="高亮" width="80" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.highlight === 1 ? 'success' : 'info'" size="small" effect="light">
                {{ scope.row.highlight === 1 ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="small" effect="light">
                {{ scope.row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sort_order" label="排序" width="100" align="center" sortable />
          <el-table-column label="操作" width="200" fixed="right" align="center">
            <template #default="scope">
              <el-button size="small" type="primary" text bg @click.stop="handleEdit(scope.row)">
                <el-icon><Edit /></el-icon> 编辑
              </el-button>
              <el-button size="small" type="danger" text bg @click.stop="handleDelete(scope.row)">
                <el-icon><Delete /></el-icon> 删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑底部导航项' : '添加底部导航项'"
      width="700px"
      destroy-on-close
      @close="resetForm"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" class="nav-form">
        <div class="form-container">
          <div class="form-left">
            <el-form-item label="导航名称" prop="nav_name">
              <el-input v-model="form.nav_name" placeholder="如：首页、我的" maxlength="10" show-word-limit />
            </el-form-item>

            <el-form-item label="图标" prop="icon">
              <div class="icon-input-wrapper">
                <el-input v-model="form.icon" placeholder="如: home-o">
                  <template #prepend>
                    <div class="icon-preview-box">
                      <i :class="['van-icon', `van-icon-${form.icon}`]"
                         :style="{color: form.status === 1 ? '#7d7e80' : '#c8c9cc', fontSize: '22px'}"></i>
                    </div>
                  </template>
                </el-input>
              </div>

              <div class="help-text">输入Vant图标名称，无需包含"van-icon-"前缀</div>

              <div class="icon-grid">
                <div
                  v-for="(icon, index) in commonIcons"
                  :key="index"
                  class="icon-item"
                  :class="{'icon-selected': form.icon === icon.name}"
                  @click="form.icon = icon.name"
                >
                  <i :class="['van-icon', `van-icon-${icon.name}`]"
                     :style="{color: icon.name === form.icon ? '#1989fa' : (form.status === 1 ? '#7d7e80' : '#c8c9cc'), fontSize: '22px'}"></i>
                  <span>{{ icon.label }}</span>
                </div>
              </div>

              <div class="more-icons-link">
                <el-link type="primary" href="https://vant-ui.github.io/vant/#/zh-CN/icon" target="_blank">
                  查看更多图标 <el-icon><Right /></el-icon>
                </el-link>
              </div>
            </el-form-item>

            <el-form-item label="链接地址" prop="path">
              <el-input v-model="form.path" placeholder="如：/" />
            </el-form-item>

            <el-form-item label="常用路径">
              <div class="path-tag-list">
                <el-tag
                  v-for="path in commonPaths"
                  :key="path.path"
                  class="path-tag"
                  :effect="form.path === path.path ? 'dark' : 'plain'"
                  @click="selectPath(path.path)"
                >
                  {{ path.label }}
                </el-tag>
              </div>
            </el-form-item>

            <el-form-item label="高亮" prop="highlight">
              <el-switch
                v-model="form.highlight"
                :active-value="1"
                :inactive-value="0"
                active-text="启用"
                inactive-text="禁用"
              />
              <span class="form-tip">启用时，当前页面路径与链接匹配时会高亮</span>
            </el-form-item>

            <el-form-item label="状态" prop="status">
              <el-switch
                v-model="form.status"
                :active-value="1"
                :inactive-value="0"
                active-text="启用"
                inactive-text="禁用"
              />
            </el-form-item>

            <el-form-item label="排序" prop="sort_order">
              <el-input-number v-model="form.sort_order" :min="0" :max="999" />
              <span class="form-tip">数值越小排序越靠左</span>
            </el-form-item>
          </div>

          <div class="form-right">
            <div class="preview-card">
              <div class="preview-title">预览效果</div>
              <div class="preview-content">
                <div class="nav-preview-item">
                  <div class="nav-preview-icon">
                    <i :class="['van-icon', `van-icon-${form.icon}`]"
                       :style="{color: form.status === 1 ? '#7d7e80' : '#c8c9cc', fontSize: '22px'}"></i>
                  </div>
                  <div class="nav-preview-text">{{ form.nav_name || '导航名称' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete, Search, Plus, Refresh, Right } from '@element-plus/icons-vue'
import IconSelector from './components/IconSelector.vue'
import axios from 'axios'

// 数据状态
const loading = ref(true)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEditing = ref(false)
const navItems = ref([])
const searchText = ref('')
const selectedRow = ref(null)
const formRef = ref(null)
const domainName = ref('pay.itapgo.com')

// 表单默认值
const defaultForm = {
  nav_name: '',
  icon: 'home-o',
  path: '/',
  highlight: 1,
  status: 1,
  sort_order: 0
}

// 表单对象
const form = reactive({...defaultForm})

// 表单验证规则
const rules = {
  nav_name: [
    { required: true, message: '请输入导航名称', trigger: 'blur' },
    { max: 6, message: '底部导航名称不能超过6个字符', trigger: 'blur' }
  ],
  icon: [
    { required: true, message: '请选择图标', trigger: 'blur' }
  ],
  path: [
    { required: true, message: '请输入链接地址', trigger: 'blur' }
  ],
  sort_order: [
    { required: true, message: '请输入排序值', trigger: 'change' }
  ]
}

// 常用图标列表
const commonIcons = [
  { name: 'home-o', label: '首页' },
  { name: 'apps-o', label: '应用' },
  { name: 'cart-o', label: '购物车' },
  { name: 'shop-o', label: '商店' },
  { name: 'location-o', label: '位置' },
  { name: 'user-o', label: '用户' },
  { name: 'setting-o', label: '设置' },
  { name: 'cluster-o', label: '集群' },
  { name: 'star-o', label: '星星' },
  { name: 'chat-o', label: '消息' },
  { name: 'service-o', label: '服务' },
  { name: 'friends-o', label: '好友' }
]

// 常用路径列表
const commonPaths = [
  { label: '首页', path: '/' },
  { label: '设备', path: '/devices' },
  { label: '商城', path: '/shop' },
  { label: '个人中心', path: '/user' },
  { label: '取水地图', path: '/water-map' },
  { label: '积分商城', path: '/points-mall' }
]

// 排序后的导航项
const sortedNavItems = computed(() => {
  if (!navItems.value.length) {
    return [
      { icon: 'home-o', nav_name: '首页', status: 1 },
      { icon: 'apps-o', nav_name: '设备', status: 1 },
      { icon: 'location-o', nav_name: '取水点', status: 1 },
      { icon: 'user-o', nav_name: '我的', status: 1 }
    ]
  }
  return [...navItems.value].sort((a, b) => a.sort_order - b.sort_order)
})

// 根据搜索条件过滤导航项
const filteredNavItems = computed(() => {
  if (!searchText.value) return navItems.value

  const keyword = searchText.value.toLowerCase()
  return navItems.value.filter(item =>
    item.nav_name.toLowerCase().includes(searchText.value.toLowerCase()) ||
    item.icon.toLowerCase().includes(searchText.value.toLowerCase())
  )
})

// 获取导航项数据
const fetchNavItems = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/admin/navs/tabbar')
    if (response.code === 0) {
      navItems.value = response.data || []
      
    } else {
      ElMessage.error(response.data.message || '获取导航项失败')
    }
  } catch (error) {
    console.error('获取导航项失败:', error)
    ElMessage.error('网络错误，获取导航项失败')
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = () => {
  fetchNavItems()
  ElMessage.success('数据已刷新')
}

// 选择常用路径
const selectPath = (path) => {
  form.path = path
}

// 处理添加导航项
const handleAdd = () => {
  // 检查是否已达到最大导航项数量
  if (navItems.value.length >= 5) {
    ElMessage.warning({
      message: '底部导航栏最多支持5个菜单项，请先删除现有项再添加',
      type: 'warning',
      duration: 3000
    })
    return
  }

  isEditing.value = false
  form.value = {
    nav_name: '',
    icon: '',
    path: '',
    status: 1,
    sort_order: navItems.value.length > 0 ? Math.max(...navItems.value.map(item => item.sort_order)) + 1 : 0
  }
  dialogVisible.value = true
}

// 处理编辑导航项
const handleEdit = (row) => {
  isEditing.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

// 处理点击行
const handleRowClick = (row) => {
  selectedRow.value = row
}

// 处理删除导航项
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除底部导航项 "${row.nav_name}" 吗？删除后APP底部导航将立即受影响。`,
    '警告',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
      draggable: true
    }
  ).then(async () => {
    try {
      const response = await axios.delete(`/api/admin/navs/tabbar/${row.id}`)
      if (response.code === 0) {
        ElMessage.success('删除成功')
        fetchNavItems()
      } else {
        ElMessage.error(response.data.message || '删除失败')
      }
    } catch (error) {
      console.error('删除导航项失败:', error)
      ElMessage.error('网络错误，删除失败')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    // 检查名称长度
    if (form.value.nav_name.length > 6) {
      ElMessage.warning('底部导航名称不能超过6个字符')
      return
    }

    submitting.value = true

    let response
    if (isEditing.value) {
      response = await axios.put(`/api/admin/navs/tabbar/${form.value.id}`, form.value)
    } else {
      response = await axios.post('/api/admin/navs/tabbar', form.value)
    }

    if (response.code === 0) {
      ElMessage.success(isEditing.value ? '更新成功' : '添加成功')
      dialogVisible.value = false
      fetchNavItems()
    } else {
      ElMessage.error(response.data.message || (isEditing.value ? '更新失败' : '添加失败'))
    }
  } catch (error) {
    console.error('提交表单失败:', error)
    if (error.response && error.response.data.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error('表单验证失败或网络错误')
    }
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields()
}

// 生命周期钩子
onMounted(() => {
  fetchNavItems()
})
</script>

<style scoped>
/* 主容器样式 */
.bottom-nav-manager {
  padding: 20px 0;
}

/* 预览和操作区域布局 */
.preview-action-section {
  display: flex;
  gap: 30px;
  margin-bottom: 30px;
}

.mobile-preview {
  flex: 0 0 320px;
}

.mobile-frame {
  width: 320px;
  height: 580px;
  border: 10px solid #333;
  border-radius: 30px;
  overflow: hidden;
  position: relative;
  background-color: #f7f8fa;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.mobile-frame:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.mobile-status-bar {
  height: 30px;
  background-color: #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
}

.time {
  font-size: 12px;
  color: #fff;
}

.status-icons {
  width: 60px;
  height: 10px;
  background-color: #666;
  border-radius: 5px;
}

.mobile-content {
  height: calc(100% - 30px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.content-area {
  flex: 1;
  background-color: #f5f7fa;
  padding: 15px;
  overflow-y: auto;
  position: relative;
}

.content-placeholder {
  width: 100%;
  height: 120px;
  background-color: #fff;
  border-radius: 8px;
  margin-bottom: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.nav-placeholder {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 14px;
  text-align: center;
  line-height: 1.6;
}

.bottom-nav-bar {
  height: 60px;
  background-color: #fff;
  border-top: 1px solid #ebedf0;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 10px;
  box-shadow: 0 -1px 5px rgba(0, 0, 0, 0.05);
}

.nav-item-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  cursor: pointer;
  position: relative;
  padding: 5px 0;
  transition: all 0.2s;
}

.nav-item-container:hover {
  transform: translateY(-2px);
}

.nav-item-container.active {
  color: #409EFF;
}

.nav-item-container.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-item-container.active .nav-icon {
  color: #409EFF;
}

.nav-icon {
  font-size: 22px;
  margin-bottom: 4px;
  color: #323233;
}

.nav-text {
  font-size: 12px;
  color: #646566;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.active .nav-text {
  color: #409EFF;
}

.disabled .nav-icon,
.disabled .nav-text {
  color: #c8c9cc;
}

.action-panel {
  flex: 1;
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.panel-header {
  margin-bottom: 20px;
}

.panel-header h3 {
  font-size: 20px;
  margin: 0 0 10px 0;
  color: #303133;
  font-weight: 600;
}

.panel-description {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.panel-actions {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.tips-list {
  padding-left: 20px;
  margin: 10px 0;
}

.tips-list li {
  margin-bottom: 8px;
  line-height: 1.6;
  color: #606266;
}

.domain-preview {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 6px;
  border-left: 3px solid #409EFF;
}

.domain-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}

.domain-value {
  font-size: 14px;
  color: #409EFF;
  font-weight: 500;
  margin-bottom: 5px;
}

.domain-tip {
  font-size: 12px;
  color: #909399;
}

/* 数据表格区域样式 */
.data-table-section {
  margin-top: 30px;
}

.table-card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.table-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.search-input {
  width: 250px;
}

.icon-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.icon-name {
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
}

/* 表单样式 */
.nav-form {
  padding: 0 20px;
}

.form-container {
  display: flex;
  gap: 30px;
}

.form-left {
  flex: 3;
}

.form-right {
  flex: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-input-wrapper {
  margin-bottom: 6px;
}

.help-text {
  font-size: 12px;
  color: #909399;
  margin-bottom: 10px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-bottom: 15px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 5px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-item:hover {
  background-color: #f5f7fa;
}

.icon-selected {
  background-color: #ecf5ff;
  border: 1px solid #d9ecff;
}

.icon-item span {
  font-size: 12px;
  color: #606266;
  margin-top: 5px;
  text-align: center;
}

.more-icons-link {
  margin-top: 10px;
  text-align: right;
}

.preview-card {
  width: 100%;
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.preview-title {
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 500;
  color: #606266;
}

.preview-content {
  display: flex;
  justify-content: center;
}

.nav-preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
}

.nav-preview-icon {
  margin-bottom: 8px;
}

.nav-preview-text {
  font-size: 14px;
  color: #303133;
  max-width: 100px;
  text-align: center;
}

.form-tip {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}

.path-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.path-tag {
  cursor: pointer;
}

.max-count-warning {
  color: #E6A23C;
  font-size: 12px;
  display: flex;
  align-items: center;
  margin-left: 10px;
}

.max-count-warning .el-icon {
  margin-right: 4px;
}

.bottom-nav-tip {
  display: inline-flex;
  align-items: center;
  margin-left: 10px;
  padding: 2px 8px;
  background-color: #ecf5ff;
  color: #409EFF;
  border-radius: 4px;
  font-size: 12px;
}

.bottom-nav-tip .el-icon {
  margin-right: 4px;
  font-size: 14px;
}

.nav-item-badge {
  position: absolute;
  top: 0;
  right: 0;
  background-color: #F56C6C;
  color: #fff;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate(30%, -30%);
}
</style>
