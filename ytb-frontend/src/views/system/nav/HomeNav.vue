<template>
  <div class="home-nav-manager">
    <!-- 预览和操作区域 -->
    <div class="preview-action-section">
      <div class="mobile-preview">
        <div class="mobile-frame">
          <div class="mobile-status-bar">
            <div class="time">{{ currentTime }}</div>
            <div class="status-icons"></div>
          </div>
          <div class="mobile-content">
            <div class="header-bar">
              <div class="header-title">首页</div>
              <div class="header-icons">
                <i class="van-icon van-icon-search"></i>
                <i class="van-icon van-icon-chat-o"></i>
              </div>
            </div>

            <div class="mockup-banner">
              <div class="banner-placeholder"></div>
            </div>

            <div class="nav-grid-container">
              <div class="nav-title-bar">
                <div class="nav-title">快捷功能</div>
                <div class="nav-more">全部 <i class="van-icon van-icon-arrow"></i></div>
              </div>
              <div class="nav-grid">
                <template v-if="sortedNavItems.length > 0">
                  <div
                    v-for="(item, index) in sortedNavItems"
                    :key="index"
                    class="nav-item"
                    :class="{'nav-item-disabled': item.status !== 1}"
                    @click="handlePreviewClick(item)"
                  >
                    <div class="nav-icon">
                      <i :class="['van-icon', `van-icon-${item.icon}`]"
                         :style="{backgroundColor: item.status === 1 ? '#409EFF' : '#c8c9cc', fontSize: '28px'}"></i>
                    </div>
                    <div class="nav-text" :class="{'text-disabled': item.status !== 1}">{{ item.nav_name }}</div>
                  </div>
                </template>
                <template v-else>
                  <div class="nav-item">
                    <div class="nav-icon">
                      <i class="van-icon van-icon-cart-o" style="backgroundColor: #409EFF; font-size: 28px;"></i>
                    </div>
                    <div class="nav-text">购水</div>
                  </div>
                  <div class="nav-item">
                    <div class="nav-icon">
                      <i class="van-icon van-icon-gift-o" style="backgroundColor: #409EFF; font-size: 28px;"></i>
                    </div>
                    <div class="nav-text">积分兑换</div>
                  </div>
                  <div class="nav-item">
                    <div class="nav-icon">
                      <i class="van-icon van-icon-location-o" style="backgroundColor: #409EFF; font-size: 28px;"></i>
                    </div>
                    <div class="nav-text">取水地图</div>
                  </div>
                  <div class="nav-item">
                    <div class="nav-icon">
                      <i class="van-icon van-icon-shop-o" style="backgroundColor: #409EFF; font-size: 28px;"></i>
                    </div>
                    <div class="nav-text">附近服务</div>
                  </div>
                  <div class="nav-item">
                    <div class="nav-icon">
                      <i class="van-icon van-icon-coupon-o" style="backgroundColor: #409EFF; font-size: 28px;"></i>
                    </div>
                    <div class="nav-text">优惠券</div>
                  </div>
                </template>
              </div>
            </div>

            <!-- 模拟内容区域 -->
            <div class="mockup-content">
              <div class="mockup-block"></div>
              <div class="mockup-block"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="action-panel">
        <div class="panel-header">
          <h3>首页导航管理</h3>
          <p class="panel-description">拖拽调整导航顺序，点击按钮添加新导航</p>
        </div>

        <div class="panel-actions">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon> 添加导航项
          </el-button>
          <el-button type="success" @click="refreshData">
            <el-icon><Refresh /></el-icon> 刷新数据
          </el-button>
        </div>

        <div class="action-tips">
          <el-alert
            type="info"
            :closable="false"
            show-icon
          >
            <template #title>操作指南</template>
            <ul class="tips-list">
              <li>首页导航建议控制在8个以内，布局为两行</li>
              <li>图标名称使用 Vant 图标库，点击<a href="https://vant-ui.github.io/vant/#/zh-CN/icon" target="_blank">这里</a>查看</li>
              <li>排序数值越小，显示位置越靠前</li>
              <li>手机预览区域可点击交互，查看效果</li>
            </ul>
          </el-alert>
        </div>

        <div class="domain-preview">
          <div class="domain-title">当前域名</div>
          <div class="domain-value">{{ domainName }}</div>
          <div class="domain-tip">修改导航后在移动端访问以上域名即可查看效果</div>
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="data-table-section">
      <el-card shadow="hover" class="table-card">
        <template #header>
          <div class="card-header">
            <span class="header-title">导航项列表</span>
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
                   :style="{color: scope.row.status === 1 ? '#1989fa' : '#c8c9cc', fontSize: '24px'}"></i>
                <span class="icon-name">{{ scope.row.icon }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="nav_name" label="名称" width="150" />
          <el-table-column prop="path" label="链接地址" min-width="180" />
          <el-table-column label="状态" width="100" align="center">
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
      :title="isEditing ? '编辑导航项' : '添加导航项'"
      width="700px"
      destroy-on-close
      @close="resetForm"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" class="nav-form">
        <div class="form-container">
          <div class="form-left">
            <el-form-item label="导航名称" prop="nav_name">
              <el-input v-model="form.nav_name" placeholder="如：购水、充值" maxlength="10" show-word-limit />
            </el-form-item>

            <el-form-item label="图标" prop="icon">
              <div class="icon-input-wrapper">
                <el-input v-model="form.icon" placeholder="如: cart-o">
                  <template #prepend>
                    <div class="icon-preview-box">
                      <i :class="['van-icon', `van-icon-${form.icon}`]"
                         :style="{color: form.icon ? '#1989fa' : '#c8c9cc', fontSize: '22px'}"></i>
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
                     :style="{color: form.icon === icon.name ? '#1989fa' : '#666', fontSize: '24px'}"></i>
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
              <el-input v-model="form.path" placeholder="如：/shop" />
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
              <span class="form-tip">数值越小排序越靠前</span>
            </el-form-item>
          </div>

          <div class="form-right">
            <div class="preview-card">
              <div class="preview-title">预览效果</div>
              <div class="preview-content">
                <div class="nav-preview-item">
                  <div class="nav-preview-icon">
                    <i :class="['van-icon', `van-icon-${form.icon}`]"
                       :style="{color: form.icon ? '#1989fa' : '#c8c9cc', fontSize: '32px'}"></i>
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
import axios from 'axios'

// 组件使用CSS中已定义的van-icon图标

// 数据状态
const loading = ref(true)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEditing = ref(false)
const navItems = ref([])
const searchText = ref('')
const selectedRow = ref(null)
const formRef = ref(null)
const currentTime = ref(formatTime(new Date()))
const domainName = ref('pay.itapgo.com')
const timeInterval = ref(null)

// 表单默认值
const defaultForm = {
  nav_name: '',
  icon: 'apps-o',
  path: '',
  status: 1,
  sort_order: 0
}

// 表单对象
const form = reactive({...defaultForm})

// 表单验证规则
const rules = {
  nav_name: [{ required: true, message: '请输入导航名称', trigger: 'blur' }],
  icon: [{ required: true, message: '请输入图标名称', trigger: 'blur' }],
  path: [{ required: true, message: '请输入链接地址', trigger: 'blur' }],
  sort_order: [{ required: true, message: '请输入排序值', trigger: 'blur' }]
}

// 常用图标列表
const commonIcons = [
  { name: 'home-o', label: '首页' },
  { name: 'cart-o', label: '购物车' },
  { name: 'shop-o', label: '商店' },
  { name: 'gift-o', label: '礼品' },
  { name: 'coupon-o', label: '优惠券' },
  { name: 'location-o', label: '位置' },
  { name: 'gem-o', label: '宝石' },
  { name: 'bag-o', label: '包包' },
  { name: 'gold-coin-o', label: '金币' },
  { name: 'user-o', label: '用户' },
  { name: 'setting-o', label: '设置' },
  { name: 'cluster-o', label: '集群' }
]

// 常用路径列表
const commonPaths = [
  { label: '首页', path: '/' },
  { label: '商城', path: '/shop' },
  { label: '购水', path: '/water' },
  { label: '我的', path: '/user' },
  { label: '取水点', path: '/stations' },
  { label: '积分兑换', path: '/points' },
  { label: '优惠券', path: '/coupons' },
  { label: '充值', path: '/recharge' }
]

// 排序后的导航项
const sortedNavItems = computed(() => {
  return [...navItems.value].sort((a, b) => a.sort_order - b.sort_order)
})

// 根据搜索条件过滤导航项
const filteredNavItems = computed(() => {
  if (!searchText.value) return navItems.value
  return navItems.value.filter(item =>
    item.nav_name.toLowerCase().includes(searchText.value.toLowerCase()) ||
    item.icon.toLowerCase().includes(searchText.value.toLowerCase())
  )
})

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    // 修改为访问管理后台的API
    const response = await axios.get('/api/admin/v1/navs/home')

    if (response.data && response.data.code === 0) {
      // 管理后台API使用的字段已经匹配UI组件，不需要映射
      navItems.value = response.data.data;
    } else {
      console.error('API响应格式错误或获取数据失败:', response.data);
      ElMessage.error('获取数据失败: ' + (response.data?.message || '未知错误'));
    }
  } catch (error) {
    console.error('获取数据失败', error);
    ElMessage.error('获取数据失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

// 刷新数据
const refreshData = () => {
  fetchData()
  ElMessage.success('数据已刷新')
}

// 选择常用路径
const selectPath = (path) => {
  form.path = path
}

// 处理添加导航项
const handleAdd = () => {
  isEditing.value = false
  Object.assign(form, defaultForm)
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.resetFields()
  })
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
  ElMessageBox.confirm('确定要删除此导航项吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await axios.delete(`/api/admin/v1/navs/home/${row.id}`);
      ElMessage.success('删除成功');
      fetchData();
    } catch (error) {
      console.error('删除失败', error);
      ElMessage.error('删除失败，请稍后重试');
    }
  }).catch(() => {})
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      // 管理后台API字段已匹配，直接提交表单数据
      if (isEditing.value) {
        // 编辑现有导航
        await axios.put(`/api/admin/v1/navs/home/${form.id}`, form);
        ElMessage.success('更新成功');
      } else {
        // 添加新导航
        await axios.post('/api/admin/v1/navs/home', form);
        ElMessage.success('添加成功');
      }

      dialogVisible.value = false;
      fetchData(); // 刷新数据
    } catch (error) {
      console.error('提交失败', error);
      ElMessage.error('提交失败，请稍后重试');
    } finally {
      submitting.value = false;
    }
  });
};

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields()
}

// 生命周期钩子
onMounted(() => {
  fetchData()
  startTimeUpdate()
})

onBeforeUnmount(() => {
  if (timeInterval.value) {
    clearInterval(timeInterval.value)
  }
})

// 格式化当前时间
function formatTime(date) {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

// 开始时间更新
function startTimeUpdate() {
  timeInterval.value = setInterval(() => {
    currentTime.value = formatTime(new Date())
  }, 60000) // 每分钟更新一次
}

// 处理导航项点击预览效果
const handlePreviewClick = (item) => {
  if (item.status !== 1) {
    ElMessage.warning('该导航项已禁用，点击无效')
    return
  }

  ElMessage({
    message: `将跳转到: ${item.path}`,
    type: 'info',
    duration: 1500
  })
}
</script>

<style scoped>
.home-nav-manager {
  margin-top: 20px;
}

/* 预览和操作区域样式 */
.preview-action-section {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.mobile-preview {
  flex: 0 0 320px;
}

.mobile-frame {
  width: 320px;
  height: 500px;
  background-color: #fff;
  border-radius: 24px;
  border: 10px solid #333;
  position: relative;
  overflow: hidden;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
}

.mobile-status-bar {
  height: 30px;
  background-color: #f8f8f8;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 12px;
}

.time {
  font-size: 12px;
  color: #909399;
}

.status-icons {
  width: 60px;
  height: 10px;
  background-color: #ccc;
  border-radius: 5px;
}

.mobile-content {
  height: calc(100% - 30px);
  background-color: #f7f8fa;
  overflow: hidden;
  position: relative;
}

.header-bar {
  height: 50px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #eee;
}

.header-icons {
  position: absolute;
  right: 10px;
  top: 10px;
  display: flex;
  gap: 10px;
}

.mockup-banner {
  height: 100px;
  background-color: #f5f7fa;
  position: relative;
  overflow: hidden;
  margin-bottom: 20px;
}

.banner-placeholder {
  width: 100%;
  height: 100%;
  background-color: #fff;
  position: absolute;
  top: 0;
  left: 0;
  transform: skewY(-4deg);
}

.nav-grid-container {
  padding: 20px 15px;
}

.nav-title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.nav-title {
  font-size: 16px;
  font-weight: 600;
}

.nav-more {
  font-size: 14px;
  color: #909399;
  cursor: pointer;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  padding: 10px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  transition: all 0.3s;
}

.nav-item:hover {
  transform: translateY(-2px);
}

.nav-icon {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;

  i {
    width: 28px;
    height: 28px;
    mask-size: cover !important;
    -webkit-mask-size: cover !important;
    mask-repeat: no-repeat;
    -webkit-mask-repeat: no-repeat;
    mask-position: center;
    -webkit-mask-position: center;
  }
}

.nav-text {
  font-size: 12px;
  color: #333;
  text-align: center;
}

.text-disabled {
  color: #c8c9cc;
}

.nav-item-disabled {
  opacity: 0.7;
}

.action-panel {
  flex: 1;
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.panel-header {
  margin-bottom: 20px;
}

.panel-header h3 {
  font-size: 18px;
  margin: 0 0 8px 0;
  color: #303133;
}

.panel-description {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.panel-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.action-tips {
  margin-top: 20px;
}

.tips-list {
  padding-left: 20px;
  margin: 5px 0;
}

.tips-list li {
  margin-bottom: 8px;
  font-size: 13px;
}

.domain-preview {
  margin-top: 20px;
}

.domain-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.domain-value {
  font-size: 14px;
  color: #909399;
}

.domain-tip {
  font-size: 12px;
  color: #909399;
}

/* 数据表格区域样式 */
.data-table-section {
  margin-top: 20px;
}

.table-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
}

.search-input {
  width: 200px;
}

.icon-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.icon-name {
  font-size: 12px;
  color: #909399;
}

/* 表单样式 */
.nav-form {
  padding: 10px;
}

.form-container {
  display: flex;
  gap: 30px;
}

.form-left {
  flex: 3;
}

.form-right {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.icon-input-wrapper {
  margin-bottom: 10px;
}

.help-text {
  font-size: 12px;
  color: #909399;
  margin-bottom: 15px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #f6f8fa;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 5px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.icon-item:hover {
  background-color: #e6f6ff;
}

.icon-item span {
  font-size: 12px;
  margin-top: 5px;
  color: #666;
  text-align: center;
}

.icon-selected {
  background-color: #e6f6ff;
}

.more-icons-link {
  text-align: right;
  margin-top: 10px;
}

.path-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.path-tag {
  cursor: pointer;
  user-select: none;
}

.form-tip {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}

.preview-card {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;
  height: 100%;
}

.preview-title {
  background-color: #f5f7fa;
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  text-align: center;
  border-bottom: 1px solid #ebeef5;
}

.preview-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100% - 46px);
}

.nav-preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.nav-preview-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background-color: #f5f7fa;
  border-radius: 12px;
  margin-bottom: 12px;
}

.nav-preview-text {
  font-size: 14px;
  color: #303133;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .preview-action-section {
    flex-direction: column;
  }

  .mobile-preview {
    margin: 0 auto 20px;
  }

  .icon-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .form-container {
    flex-direction: column;
  }

  .preview-card {
    margin-top: 20px;
  }
}
</style>
