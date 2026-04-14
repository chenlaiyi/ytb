<template>
  <div class="branch-vip-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">VIP管理</h1>
        <p class="page-description">管理分支机构的VIP用户和分红</p>
      </div>
      <div class="header-actions">
        <el-button @click="refreshData" :icon="Refresh">
          刷新
        </el-button>
        <el-button type="primary" @click="exportVipData" :icon="Download">
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
            placeholder="手机号/昵称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="VIP等级:">
          <el-select 
            v-model="filterForm.vip_level" 
            placeholder="选择等级"
            clearable
            style="width: 120px"
          >
            <el-option label="普通VIP" value="normal" />
            <el-option label="高级VIP" value="premium" />
            <el-option label="钻石VIP" value="diamond" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态:">
          <el-select 
            v-model="filterForm.status" 
            placeholder="选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="有效" value="active" />
            <el-option label="已过期" value="expired" />
            <el-option label="暂停" value="suspended" />
          </el-select>
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

    <!-- VIP统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon color="#f56c6c"><Trophy /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.total_vip || 0 }}</div>
          <div class="stat-label">VIP总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon color="#67c23a"><Money /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">¥{{ (stats.total_dividend || 0).toFixed(2) }}</div>
          <div class="stat-label">累计分红</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon color="#e6a23c"><Calendar /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">¥{{ (stats.month_dividend || 0).toFixed(2) }}</div>
          <div class="stat-label">本月分红</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon color="#409eff"><UserFilled /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.month_new_vip || 0 }}</div>
          <div class="stat-label">本月新增</div>
        </div>
      </div>
    </div>

    <!-- VIP列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="vipList"
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
                  <el-tag :type="getVipLevelColor(row.vip_level)" size="small">
                    {{ getVipLevelName(row.vip_level) }}
                  </el-tag>
                </div>
                <div class="user-phone">{{ row.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="VIP信息" width="180">
          <template #default="{ row }">
            <div class="vip-info">
              <div class="vip-period">
                {{ formatDate(row.vip_start_time) }} - {{ formatDate(row.vip_end_time) }}
              </div>
              <div class="vip-days">
                剩余{{ calculateRemainingDays(row.vip_end_time) }}天
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="累计分红" width="120">
          <template #default="{ row }">
            <span class="dividend-amount">¥{{ (row.total_dividend || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="本月分红" width="120">
          <template #default="{ row }">
            <span class="dividend-amount">¥{{ (row.month_dividend || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="推荐用户" width="80">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.referral_count || 0 }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag 
              :type="getStatusColor(row.vip_status)" 
              size="small"
            >
              {{ getStatusName(row.vip_status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="开通时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.vip_start_time) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="viewVip(row)"
            >
              查看
            </el-button>
            <el-button
              type="warning"
              size="small"
              @click="editVip(row)"
            >
              编辑
            </el-button>
            <el-dropdown @command="(command) => handleVipAction(command, row)">
              <el-button size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="extend">
                    延期
                  </el-dropdown-item>
                  <el-dropdown-item command="upgrade">
                    升级
                  </el-dropdown-item>
                  <el-dropdown-item command="dividend-history">
                    分红记录
                  </el-dropdown-item>
                  <el-dropdown-item command="suspend" divided>
                    暂停
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

    <!-- VIP详情对话框 -->
    <el-drawer
      v-model="vipDetailVisible"
      title="VIP详情"
      direction="rtl"
      size="600px"
    >
      <div v-if="currentVip" class="vip-detail-content">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h3>基本信息</h3>
          <div class="vip-profile">
            <el-avatar :size="80" :src="currentVip.avatar">
              {{ currentVip.nickname?.charAt(0) || currentVip.phone?.charAt(-2) }}
            </el-avatar>
            <div class="profile-info">
              <h4>{{ currentVip.nickname || '未设置昵称' }}</h4>
              <p>手机号：{{ currentVip.phone }}</p>
              <div class="vip-tags">
                <el-tag :type="getVipLevelColor(currentVip.vip_level)">
                  {{ getVipLevelName(currentVip.vip_level) }}
                </el-tag>
                <el-tag :type="getStatusColor(currentVip.vip_status)">
                  {{ getStatusName(currentVip.vip_status) }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- VIP详情 -->
        <div class="detail-section">
          <h3>VIP详情</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="VIP等级">
              {{ getVipLevelName(currentVip.vip_level) }}
            </el-descriptions-item>
            <el-descriptions-item label="开通时间">
              {{ formatDateTime(currentVip.vip_start_time) }}
            </el-descriptions-item>
            <el-descriptions-item label="到期时间">
              {{ formatDateTime(currentVip.vip_end_time) }}
            </el-descriptions-item>
            <el-descriptions-item label="剩余天数">
              {{ calculateRemainingDays(currentVip.vip_end_time) }} 天
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 分红信息 -->
        <div class="detail-section">
          <h3>分红信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="累计分红">
              ¥{{ (currentVip.total_dividend || 0).toFixed(2) }}
            </el-descriptions-item>
            <el-descriptions-item label="本月分红">
              ¥{{ (currentVip.month_dividend || 0).toFixed(2) }}
            </el-descriptions-item>
            <el-descriptions-item label="推荐用户数">
              {{ currentVip.referral_count || 0 }} 人
            </el-descriptions-item>
            <el-descriptions-item label="下级VIP数">
              {{ currentVip.sub_vip_count || 0 }} 人
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 设备信息 -->
        <div class="detail-section">
          <h3>设备信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="设备总数">
              {{ currentVip.device_count || 0 }} 台
            </el-descriptions-item>
            <el-descriptions-item label="活跃设备">
              {{ currentVip.active_device_count || 0 }} 台
            </el-descriptions-item>
            <el-descriptions-item label="本月收入">
              ¥{{ (currentVip.month_income || 0).toFixed(2) }}
            </el-descriptions-item>
            <el-descriptions-item label="累计收入">
              ¥{{ (currentVip.total_income || 0).toFixed(2) }}
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
  Trophy, 
  Money, 
  Calendar, 
  UserFilled,
  ArrowDown
} from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import { getBranchVipUsers, getBranchVipStats } from '@/api/v1/branchManagement'

const route = useRoute()
const branchId = computed(() => route.params.branchId)

// 响应式数据
const loading = ref(false)
const vipList = ref([])
const stats = ref({})
const vipDetailVisible = ref(false)
const currentVip = ref(null)

// 搜索表单
const filterForm = reactive({
  keyword: '',
  vip_level: '',
  status: ''
})

// 分页数据
const pagination = reactive({
  current_page: 1,
  per_page: 20,
  total: 0
})

// VIP等级映射
const vipLevelMap = {
  normal: '普通VIP',
  premium: '高级VIP',
  diamond: '钻石VIP'
}

// 状态映射
const statusMap = {
  active: '有效',
  expired: '已过期',
  suspended: '暂停'
}

// 获取VIP等级名称
const getVipLevelName = (level) => {
  return vipLevelMap[level] || '未知'
}

// 获取VIP等级颜色
const getVipLevelColor = (level) => {
  const colorMap = {
    normal: 'warning',
    premium: 'success',
    diamond: 'danger'
  }
  return colorMap[level] || 'info'
}

// 获取状态名称
const getStatusName = (status) => {
  return statusMap[status] || '未知'
}

// 获取状态颜色
const getStatusColor = (status) => {
  const colorMap = {
    active: 'success',
    expired: 'danger',
    suspended: 'warning'
  }
  return colorMap[status] || 'info'
}

// 计算剩余天数
const calculateRemainingDays = (endTime) => {
  if (!endTime) return 0
  const end = new Date(endTime)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// 加载VIP列表
const loadVipUsers = async () => {
  try {
    loading.value = true
    
    const params = {
      page: pagination.current_page,
      per_page: pagination.per_page,
      ...filterForm
    }
    
    const response = await getBranchVipUsers(branchId.value, params)
    
    if (response.code === 200) {
      vipList.value = response.data.data || []
      pagination.total = response.data.total || 0
      pagination.current_page = response.data.current_page || 1
      pagination.per_page = response.data.per_page || 20
    } else {
      ElMessage.error(response.message || '获取VIP列表失败')
    }
  } catch (error) {
    console.error('获取VIP列表失败:', error)
    ElMessage.error('获取VIP列表失败')
  } finally {
    loading.value = false
  }
}

// 加载统计数据
const loadStats = async () => {
  try {
    const response = await getBranchVipStats(branchId.value)
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
  loadVipUsers()
}

// 重置搜索
const resetSearch = () => {
  Object.assign(filterForm, {
    keyword: '',
    vip_level: '',
    status: ''
  })
  pagination.current_page = 1
  loadVipUsers()
}

// 刷新
const refreshData = () => {
  loadVipUsers()
  loadStats()
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.per_page = size
  pagination.current_page = 1
  loadVipUsers()
}

const handleCurrentChange = (page) => {
  pagination.current_page = page
  loadVipUsers()
}

// 查看VIP详情
const viewVip = (vip) => {
  currentVip.value = vip
  vipDetailVisible.value = true
}

// 编辑VIP
const editVip = (vip) => {
  ElMessage.info('编辑功能开发中...')
}

// VIP操作
const handleVipAction = async (command, vip) => {
  switch (command) {
    case 'extend':
      ElMessage.info('延期功能开发中...')
      break
    case 'upgrade':
      ElMessage.info('升级功能开发中...')
      break
    case 'dividend-history':
      ElMessage.info('分红记录功能开发中...')
      break
    case 'suspend':
      await suspendVip(vip)
      break
  }
}

// 暂停VIP
const suspendVip = async (vip) => {
  try {
    await ElMessageBox.confirm(
      `确定要暂停用户 ${vip.nickname || vip.phone} 的VIP服务吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ElMessage.info('暂停功能开发中...')
  } catch {
    // 用户取消
  }
}

// 导出VIP数据
const exportVipData = () => {
  ElMessage.info('导出功能开发中...')
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

// 格式化时间
const formatDateTime = (datetime) => {
  if (!datetime) return '-'
  return new Date(datetime).toLocaleString('zh-CN')
}

// 初始化
onMounted(() => {
  loadVipUsers()
  loadStats()
})
</script>

<style scoped>
.branch-vip-page {
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

.vip-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vip-period {
  font-size: 12px;
  color: #303133;
}

.vip-days {
  font-size: 11px;
  color: #909399;
}

.dividend-amount {
  font-weight: 500;
  color: #67c23a;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.vip-detail-content {
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

.vip-profile {
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

.vip-tags {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}
</style> 