<template>
  <div class="branch-users-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">用户管理</h1>
        <p class="page-description">管理分支机构的APP用户</p>
      </div>
      <div class="header-actions">
        <el-button @click="refreshUsers" :icon="Refresh">
          刷新
        </el-button>
        <el-button type="primary" @click="exportUsers" :icon="Download">
          导出
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" inline>
        <el-form-item label="关键词:">
          <el-input
            v-model="filterForm.keyword"
            placeholder="手机号/昵称/登录名"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="用户类型:">
          <el-select 
            v-model="filterForm.user_type" 
            placeholder="选择类型"
            clearable
            style="width: 120px"
          >
            <el-option label="普通用户" value="normal" />
            <el-option label="CP用户" value="vip" />
            <el-option label="业务员" value="salesman" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态:">
          <el-select 
            v-model="filterForm.status" 
            placeholder="选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item label="注册时间:">
          <el-date-picker
            v-model="filterForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :icon="Search">
            搜索
          </el-button>
          <el-button @click="resetSearch">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据统计 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon color="#409eff"><User /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.total_users || 0 }}</div>
          <div class="stat-label">总用户数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon color="#f56c6c"><Trophy /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.vip_users || 0 }}</div>
          <div class="stat-label">CP用户</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon color="#67c23a"><UserFilled /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.today_new || 0 }}</div>
          <div class="stat-label">今日新增</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon color="#e6a23c"><TrendCharts /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.month_new || 0 }}</div>
          <div class="stat-label">本月新增</div>
        </div>
      </div>
    </div>

    <!-- 用户列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="userList"
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="#" width="60" />
        
        <el-table-column label="用户信息" min-width="200">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="40" :src="row.avatar">
                {{ row.nickname?.charAt(0) || row.phone?.charAt(-2) }}
              </el-avatar>
              <div class="user-details">
                <div class="user-name">
                  {{ row.nickname || '未设置昵称' }}
                  <el-tag v-if="row.is_vip" type="warning" size="small">VIP</el-tag>
                  <el-tag v-if="row.is_salesman" type="success" size="small">业务员</el-tag>
                </div>
                <div class="user-phone">{{ row.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="login_name" label="登录名" width="120" />
        
        <el-table-column label="余额" width="100">
          <template #default="{ row }">
            <span class="balance-amount">¥{{ (row.balance || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="设备数" width="80">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.device_count || 0 }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="推荐人" width="120">
          <template #default="{ row }">
            <span v-if="row.inviter">{{ row.inviter.nickname || row.inviter.phone }}</span>
            <span v-else class="text-muted">无</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag 
              :type="row.status === 'active' ? 'success' : 'danger'" 
              size="small"
            >
              {{ row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="viewUser(row)"
            >
              查看
            </el-button>
            <el-button
              type="warning"
              size="small"
              @click="editUser(row)"
            >
              编辑
            </el-button>
            <el-dropdown @command="(command) => handleUserAction(command, row)">
              <el-button size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="toggle-status">
                    {{ row.status === 'active' ? '禁用' : '启用' }}
                  </el-dropdown-item>
                  <el-dropdown-item command="reset-password">
                    重置密码
                  </el-dropdown-item>
                  <el-dropdown-item command="view-devices">
                    查看设备
                  </el-dropdown-item>
                  <el-dropdown-item command="view-orders">
                    查看订单
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.current_page"
          v-model:page-size="pagination.per_page"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 用户详情对话框 -->
    <el-drawer
      v-model="userDetailVisible"
      title="用户详情"
      direction="rtl"
      size="600px"
    >
      <div v-if="currentUser" class="user-detail-content">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h3>基本信息</h3>
          <div class="user-profile">
            <el-avatar :size="80" :src="currentUser.avatar">
              {{ currentUser.nickname?.charAt(0) || currentUser.phone?.charAt(-2) }}
            </el-avatar>
            <div class="profile-info">
              <h4>{{ currentUser.nickname || '未设置昵称' }}</h4>
              <p>手机号：{{ currentUser.phone }}</p>
              <p>登录名：{{ currentUser.login_name }}</p>
              <div class="user-tags">
                <el-tag v-if="currentUser.is_vip" type="warning">CP用户</el-tag>
                <el-tag v-if="currentUser.is_salesman" type="success">业务员</el-tag>
                <el-tag :type="currentUser.status === 'active' ? 'success' : 'danger'">
                  {{ currentUser.status === 'active' ? '正常' : '禁用' }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 账户信息 -->
        <div class="detail-section">
          <h3>账户信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="账户余额">
              ¥{{ (currentUser.balance || 0).toFixed(2) }}
            </el-descriptions-item>
            <el-descriptions-item label="设备数量">
              {{ currentUser.device_count || 0 }} 台
            </el-descriptions-item>
            <el-descriptions-item label="推荐人">
              {{ currentUser.inviter?.nickname || currentUser.inviter?.phone || '无' }}
            </el-descriptions-item>
            <el-descriptions-item label="注册时间">
              {{ formatDateTime(currentUser.created_at) }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- CP信息 -->
        <div v-if="currentUser.is_vip" class="detail-section">
          <h3>CP信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="CP等级">
              {{ currentUser.vip_level || '普通CP' }}
            </el-descriptions-item>
            <el-descriptions-item label="开通时间">
              {{ formatDateTime(currentUser.vip_start_time) }}
            </el-descriptions-item>
            <el-descriptions-item label="到期时间">
              {{ formatDateTime(currentUser.vip_end_time) }}
            </el-descriptions-item>
            <el-descriptions-item label="累计分红">
              ¥{{ (currentUser.total_dividend || 0).toFixed(2) }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Search, 
  Refresh, 
  Download, 
  User, 
  Trophy, 
  UserFilled, 
  TrendCharts,
  ArrowDown
} from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import { getBranchUsers, getBranchUserStats } from '@/api/v1/branchManagement'

const route = useRoute()
const branchId = computed(() => route.params.branchId)

// 响应式数据
const loading = ref(false)
const userList = ref([])
const stats = ref({})
const userDetailVisible = ref(false)
const currentUser = ref(null)

// 搜索表单
const filterForm = reactive({
  keyword: '',
  user_type: '',
  status: '',
  date_range: null
})

// 分页数据
const pagination = reactive({
  current_page: 1,
  per_page: 20,
  total: 0
})

// 加载用户列表
const loadUsers = async () => {
  try {
    loading.value = true
    
    const params = {
      page: pagination.current_page,
      per_page: pagination.per_page,
      ...filterForm
    }
    
    // 处理日期范围
    if (filterForm.date_range && filterForm.date_range.length === 2) {
      params.start_date = filterForm.date_range[0]
      params.end_date = filterForm.date_range[1]
    }
    
    const response = await getBranchUsers(branchId.value, params)
    
    if (response.code === 200) {
      userList.value = response.data.data || []
      pagination.total = response.data.total || 0
      pagination.current_page = response.data.current_page || 1
      pagination.per_page = response.data.per_page || 20
    } else {
      ElMessage.error(response.message || '获取用户列表失败')
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 加载统计数据
const loadStats = async () => {
  try {
    const response = await getBranchUserStats(branchId.value)
    if (response.code === 200) {
      stats.value = response.data || {}
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.current_page = 1
  loadUsers()
}

// 重置搜索
const resetSearch = () => {
  Object.assign(filterForm, {
    keyword: '',
    user_type: '',
    status: '',
    date_range: null
  })
  pagination.current_page = 1
  loadUsers()
}

// 刷新
const refreshUsers = () => {
  loadUsers()
  loadStats()
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.per_page = size
  pagination.current_page = 1
  loadUsers()
}

const handleCurrentChange = (page) => {
  pagination.current_page = page
  loadUsers()
}

// 查看用户详情
const viewUser = (user) => {
  currentUser.value = user
  userDetailVisible.value = true
}

// 编辑用户
const editUser = (user) => {
  ElMessage.info('编辑功能开发中...')
}

// 用户操作
const handleUserAction = async (command, user) => {
  switch (command) {
    case 'toggle-status':
      await toggleUserStatus(user)
      break
    case 'reset-password':
      await resetUserPassword(user)
      break
    case 'view-devices':
      ElMessage.info('查看设备功能开发中...')
      break
    case 'view-orders':
      ElMessage.info('查看订单功能开发中...')
      break
  }
}

// 切换用户状态
const toggleUserStatus = async (user) => {
  const action = user.status === 'active' ? '禁用' : '启用'
  
  try {
    await ElMessageBox.confirm(
      `确定要${action}用户 ${user.nickname || user.phone} 吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ElMessage.info('状态切换功能开发中...')
  } catch {
    // 用户取消
  }
}

// 重置用户密码
const resetUserPassword = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要重置用户 ${user.nickname || user.phone} 的密码吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ElMessage.info('重置密码功能开发中...')
  } catch {
    // 用户取消
  }
}

// 导出用户
const exportUsers = () => {
  ElMessage.info('导出功能开发中...')
}

// 格式化时间
const formatDateTime = (datetime) => {
  if (!datetime) return '-'
  return new Date(datetime).toLocaleString('zh-CN')
}

// 初始化
onMounted(() => {
  loadUsers()
  loadStats()
})
</script>

<style scoped>
.branch-users-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #303133;
}

.page-description {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.filter-card {
  margin-bottom: 20px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  background: #f5f7fa;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.table-card {
  margin-bottom: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: 500;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-phone {
  font-size: 12px;
  color: #909399;
}

.balance-amount {
  font-weight: 500;
  color: #67c23a;
}

.text-muted {
  color: #c0c4cc;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.user-detail-content {
  padding: 20px;
}

.detail-section {
  margin-bottom: 30px;
}

.detail-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 8px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.profile-info h4 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #303133;
}

.profile-info p {
  margin: 4px 0;
  color: #606266;
  font-size: 14px;
}

.user-tags {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}
</style> 