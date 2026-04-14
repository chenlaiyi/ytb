<template>
  <div class="ytb-installations-page">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ stats.total_installations || 0 }}</div>
            <div class="stat-label">安装总数</div>
          </div>
          <el-icon class="stat-icon"><Box /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-reward">
          <div class="stat-content">
            <div class="stat-value">¥{{ formatMoney(stats.total_rewards) }}</div>
            <div class="stat-label">总分佣</div>
          </div>
          <el-icon class="stat-icon"><Money /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-refund">
          <div class="stat-content">
            <div class="stat-value">¥{{ formatMoney(stats.total_boss_refunds) }}</div>
            <div class="stat-label">BossCP回款</div>
          </div>
          <el-icon class="stat-icon"><CreditCard /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-month">
          <div class="stat-content">
            <div class="stat-value">{{ stats.this_month_count || 0 }}</div>
            <div class="stat-label">本月安装</div>
          </div>
          <el-icon class="stat-icon"><Calendar /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索和筛选 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="设备编号/推广人/客户"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable>
            <el-option label="待激活" value="pending" />
            <el-option label="已激活" value="activated" />
            <el-option label="已结算" value="settled" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
          <el-button 
            type="success" 
            @click="handleBatchSettle"
            :disabled="!selectedIds.length"
          >
            批量结算 ({{ selectedIds.length }})
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 安装记录列表 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="installations"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="device_number" label="设备编号" width="140" />
        <el-table-column label="推广人" min-width="160">
          <template #default="{ row }">
            <div v-if="row.promoter" class="user-info">
              <el-avatar :size="32" :src="row.promoter?.avatar">
                {{ row.promoter?.nickname?.charAt(0) || 'P' }}
              </el-avatar>
              <div class="user-detail">
                <div class="nickname">{{ row.promoter?.nickname || '未知' }}</div>
                <div class="role">
                  <el-tag size="small" :type="getRoleTagType(row.promoter?.role)">
                    {{ row.promoter?.role_name }}
                  </el-tag>
                </div>
              </div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="client_name" label="客户" width="100">
          <template #default="{ row }">
            {{ row.client_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="分佣明细" min-width="180">
          <template #default="{ row }">
            <div class="reward-detail">
              <div v-if="row.promoter_reward > 0">
                推广人: <span class="amount">+¥{{ row.promoter_reward }}</span>
              </div>
              <div v-if="row.level1_reward > 0">
                一级上级: <span class="amount">+¥{{ row.level1_reward }}</span>
              </div>
              <div v-if="row.level2_reward > 0">
                二级上级: <span class="amount">+¥{{ row.level2_reward }}</span>
              </div>
              <div v-if="row.boss_refund > 0">
                BossCP回款: <span class="boss-refund">+¥{{ row.boss_refund }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ row.status_name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="installed_at" label="安装时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.installed_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="activated_at" label="激活时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.activated_at) || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">
              详情
            </el-button>
            <el-button 
              v-if="row.status === 'activated'"
              type="success" 
              link 
              size="small" 
              @click="handleSettle(row)"
            >
              结算
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.perPage"
          :page-sizes="[15, 30, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="安装详情" width="800px">
      <div v-if="currentInstallation" class="installation-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="记录ID">{{ currentInstallation.id }}</el-descriptions-item>
          <el-descriptions-item label="设备编号">{{ currentInstallation.device_number }}</el-descriptions-item>
          <el-descriptions-item label="客户姓名">{{ currentInstallation.client_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="客户电话">{{ currentInstallation.client_phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="安装地址" :span="2">{{ currentInstallation.install_address || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(currentInstallation.status)">
              {{ currentInstallation.status_name }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="安装时间">{{ formatDate(currentInstallation.installed_at) }}</el-descriptions-item>
          <el-descriptions-item label="激活时间">{{ formatDate(currentInstallation.activated_at) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="结算时间">{{ formatDate(currentInstallation.settled_at) || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="section-title">分佣信息</div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="推广人">
            {{ currentInstallation.promoter?.nickname }} 
            ({{ currentInstallation.promoter?.role_name }})
          </el-descriptions-item>
          <el-descriptions-item label="推广人奖励">
            ¥{{ currentInstallation.promoter_reward || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="一级上级">
            {{ currentInstallation.level1_user?.nickname || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="一级奖励">
            ¥{{ currentInstallation.level1_reward || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="二级上级">
            {{ currentInstallation.level2_user?.nickname || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="二级奖励">
            ¥{{ currentInstallation.level2_reward || 0 }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="currentInstallation.boss_refund > 0" class="section-title">BossCP回款</div>
        <el-descriptions v-if="currentInstallation.boss_refund > 0" :column="2" border>
          <el-descriptions-item label="回款BossCP">
            {{ currentInstallation.boss_user?.nickname || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="回款金额">
            <span class="boss-refund">¥{{ currentInstallation.boss_refund }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Box, Money, CreditCard, Calendar, Search, Refresh } from '@element-plus/icons-vue'
import {
  getInstallations,
  getInstallationDetail,
  getInstallationStatistics,
  settleInstallation,
  batchSettleInstallations
} from '@/api/v1/ytb'

// 状态
const loading = ref(false)
const installations = ref([])
const stats = ref({})
const currentInstallation = ref(null)
const detailVisible = ref(false)
const selectedIds = ref([])

// 筛选条件
const filters = reactive({
  keyword: '',
  status: '',
  dateRange: null
})

// 分页
const pagination = reactive({
  page: 1,
  perPage: 15,
  total: 0
})

// 初始化
onMounted(() => {
  loadStats()
  loadInstallations()
})

// 加载统计数据
const loadStats = async () => {
  try {
    const res = await getInstallationStatistics()
    if (res.code === 0) {
      stats.value = res.data
    }
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

// 加载安装列表
const loadInstallations = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      per_page: pagination.perPage,
      keyword: filters.keyword,
      status: filters.status
    }
    if (filters.dateRange) {
      params.start_date = filters.dateRange[0]
      params.end_date = filters.dateRange[1]
    }
    
    const res = await getInstallations(params)
    if (res.code === 0) {
      installations.value = res.data.items || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('加载安装列表失败:', error)
    ElMessage.error('加载安装列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadInstallations()
}

// 重置
const handleReset = () => {
  filters.keyword = ''
  filters.status = ''
  filters.dateRange = null
  pagination.page = 1
  loadInstallations()
}

// 分页
const handleSizeChange = (size) => {
  pagination.perPage = size
  pagination.page = 1
  loadInstallations()
}

const handlePageChange = (page) => {
  pagination.page = page
  loadInstallations()
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedIds.value = selection
    .filter(item => item.status === 'activated')
    .map(item => item.id)
}

// 查看详情
const handleView = async (row) => {
  try {
    const res = await getInstallationDetail(row.id)
    if (res.code === 0) {
      currentInstallation.value = res.data
      detailVisible.value = true
    }
  } catch (error) {
    ElMessage.error('获取详情失败')
  }
}

// 单个结算
const handleSettle = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定结算安装记录 #${row.id} 的分佣吗？`,
      '确认结算',
      { type: 'warning' }
    )
    
    const res = await settleInstallation(row.id)
    if (res.code === 0) {
      ElMessage.success('结算成功')
      loadInstallations()
      loadStats()
    } else {
      ElMessage.error(res.message || '结算失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('结算失败')
    }
  }
}

// 批量结算
const handleBatchSettle = async () => {
  if (!selectedIds.value.length) {
    ElMessage.warning('请选择待结算的记录')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定批量结算选中的 ${selectedIds.value.length} 条记录吗？`,
      '批量结算',
      { type: 'warning' }
    )
    
    const res = await batchSettleInstallations(selectedIds.value)
    if (res.code === 0) {
      ElMessage.success(`成功结算 ${res.data.settled_count || selectedIds.value.length} 条记录`)
      loadInstallations()
      loadStats()
    } else {
      ElMessage.error(res.message || '批量结算失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量结算失败')
    }
  }
}

// 工具函数
const formatMoney = (value) => {
  return parseFloat(value || 0).toFixed(2)
}

const formatDate = (dateStr) => {
  if (!dateStr) return null
  return dateStr.replace('T', ' ').substring(0, 19)
}

const getStatusTagType = (status) => {
  switch (status) {
    case 'pending': return 'warning'
    case 'activated': return 'primary'
    case 'settled': return 'success'
    default: return 'info'
  }
}

const getRoleTagType = (role) => {
  switch (role) {
    case 'scp': return 'warning'
    case 'team_cp': return 'danger'
    case 'boss_cp': return ''
    default: return 'info'
  }
}
</script>

<style scoped>
.ytb-installations-page {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-card .stat-content {
  position: relative;
  z-index: 1;
}

.stat-card .stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
}

.stat-card.stat-reward .stat-value {
  color: #67c23a;
}

.stat-card.stat-refund .stat-value {
  color: #e6a23c;
}

.stat-card.stat-month .stat-value {
  color: #909399;
}

.stat-card .stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.stat-card .stat-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 48px;
  color: #f0f0f0;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.table-card {
  margin-bottom: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-detail .nickname {
  font-weight: 500;
  font-size: 13px;
}

.user-detail .role {
  margin-top: 2px;
}

.reward-detail {
  font-size: 12px;
  line-height: 1.6;
}

.amount {
  color: #67c23a;
  font-weight: 500;
}

.boss-refund {
  color: #e6a23c;
  font-weight: bold;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.installation-detail .section-title {
  margin: 20px 0 10px;
  font-weight: bold;
  color: #303133;
}
</style>
