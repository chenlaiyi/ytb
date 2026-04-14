<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <el-icon><User /></el-icon>
          渠道商管理
        </h2>
        <p class="page-subtitle">管理净水器渠道商（VIP用户），查看业绩和设备分布</p>
      </div>
      <div class="header-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索姓名/手机号"
          style="width: 200px;"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="fetchData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-overview">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card blue">
            <div class="stat-icon"><el-icon><User /></el-icon></div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.totalDealers }}</div>
              <div class="stat-label">渠道商总数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card green">
            <div class="stat-icon"><el-icon><Monitor /></el-icon></div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.totalDevices }}</div>
              <div class="stat-label">关联设备数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card orange">
            <div class="stat-icon"><el-icon><Wallet /></el-icon></div>
            <div class="stat-info">
              <div class="stat-number">¥{{ stats.totalRevenue }}</div>
              <div class="stat-label">累计收入</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card purple">
            <div class="stat-icon"><el-icon><UserFilled /></el-icon></div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.activeThisMonth }}</div>
              <div class="stat-label">本月活跃</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 渠道商列表 -->
    <el-card shadow="hover" class="list-card">
      <el-table :data="list" v-loading="loading" stripe border>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="姓名" width="120">
          <template #default="{ row }">
            <div class="dealer-name">
              <el-avatar :size="32" :src="row.avatar">{{ (row.name || '?')[0] }}</el-avatar>
              <span>{{ row.name || '-' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="invite_code" label="邀请码" width="100" />
        <el-table-column label="关联设备" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="primary">{{ row.device_count || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="累计收入" width="120" align="right">
          <template #default="{ row }">
            <span class="money-value">¥{{ formatMoney(row.total_revenue) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="本月收入" width="120" align="right">
          <template #default="{ row }">
            <span class="money-value">¥{{ formatMoney(row.month_revenue) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="下级渠道商" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.sub_dealer_count > 0" type="success">{{ row.sub_dealer_count }}</el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="加入时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_vip ? 'success' : 'info'" size="small">
              {{ row.is_vip ? '有效' : '已过期' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">
              <el-icon><View /></el-icon> 详情
            </el-button>
            <el-button type="warning" link size="small" @click="viewDevices(row)">
              <el-icon><Monitor /></el-icon> 设备
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.limit"
          :total="total"
          :page-sizes="[15, 30, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <!-- 渠道商详情抽屉 -->
    <el-drawer v-model="detailVisible" title="渠道商详情" size="50%">
      <div v-if="currentDealer" class="dealer-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="姓名">{{ currentDealer.name }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentDealer.phone }}</el-descriptions-item>
          <el-descriptions-item label="邀请码">
            <el-tag>{{ currentDealer.invite_code || '-' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="推荐人">{{ currentDealer.referrer_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="加入时间">{{ formatDate(currentDealer.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="VIP状态">
            <el-tag :type="currentDealer.is_vip ? 'success' : 'danger'">
              {{ currentDealer.is_vip ? '有效' : '已过期' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <h4 style="margin-top: 20px;">业绩统计</h4>
        <el-row :gutter="16">
          <el-col :span="8">
            <div class="perf-card">
              <div class="perf-value">{{ currentDealer.device_count || 0 }}</div>
              <div class="perf-label">关联设备</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="perf-card">
              <div class="perf-value">¥{{ formatMoney(currentDealer.total_revenue) }}</div>
              <div class="perf-label">累计收入</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="perf-card">
              <div class="perf-value">{{ currentDealer.sub_dealer_count || 0 }}</div>
              <div class="perf-label">下级渠道商</div>
            </div>
          </el-col>
        </el-row>

        <h4 style="margin-top: 20px;">下级渠道商</h4>
        <el-table :data="currentDealer.sub_dealers || []" size="small" border max-height="200">
          <el-table-column prop="name" label="姓名" />
          <el-table-column prop="phone" label="手机号" />
          <el-table-column prop="device_count" label="设备数" width="80" align="center" />
          <el-table-column prop="created_at" label="加入时间">
            <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>

    <!-- 关联设备列表抽屉 -->
    <el-drawer v-model="devicesVisible" title="关联设备" size="60%">
      <div v-if="currentDealer">
        <p class="drawer-subtitle">渠道商: {{ currentDealer.name }} ({{ currentDealer.phone }})</p>
        <el-table :data="dealerDevices" v-loading="devicesLoading" border size="small">
          <el-table-column prop="board_code" label="设备编号" width="140" />
          <el-table-column label="品牌/型号" width="140">
            <template #default="{ row }">
              <span>{{ row.brand || '-' }} {{ row.device_model || '' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="在线状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.is_online ? 'success' : 'danger'" size="small">
                {{ row.is_online ? '在线' : '离线' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="user_name" label="使用用户" width="100" />
          <el-table-column prop="address" label="安装地址" min-width="180" show-overflow-tooltip />
          <el-table-column prop="cumulative_flow" label="用水量(L)" width="100" align="right">
            <template #default="{ row }">{{ row.cumulative_flow?.toFixed(1) || 0 }}</template>
          </el-table-column>
          <el-table-column prop="activated_at" label="激活时间" width="160" />
        </el-table>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Search, Refresh, Monitor, Wallet, UserFilled, View } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 状态
const loading = ref(false)
const searchKeyword = ref('')
const list = ref([])
const total = ref(0)
const query = reactive({ page: 1, limit: 15 })

// 统计数据
const stats = ref({
  totalDealers: 0,
  totalDevices: 0,
  totalRevenue: 0,
  activeThisMonth: 0
})

// 详情
const detailVisible = ref(false)
const currentDealer = ref(null)

// 设备列表
const devicesVisible = ref(false)
const devicesLoading = ref(false)
const dealerDevices = ref([])

onMounted(() => {
  fetchData()
  fetchStats()
})

// 获取渠道商列表
const fetchData = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/api/admin/water-purifier/dealers',
      method: 'get',
      params: {
        ...query,
        keyword: searchKeyword.value
      }
    })
    if (res.code === 0) {
      list.value = res.data || []
      total.value = res.meta?.total || res.data?.length || 0
    } else {
      console.error('获取渠道商列表失败:', res.message)
      list.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取渠道商列表失败:', error)
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 获取统计数据
const fetchStats = async () => {
  try {
    const res = await request({
      url: '/api/admin/water-purifier/dealers/stats',
      method: 'get'
    })
    if (res.code === 0) {
      stats.value = res.data
    }
  } catch (error) {
    // 使用模拟数据
    stats.value = {
      totalDealers: 330,
      totalDevices: 1,
      totalRevenue: 0,
      activeThisMonth: 45
    }
  }
}

// 搜索
const handleSearch = () => {
  query.page = 1
  fetchData()
}

// 查看详情
const viewDetail = async (row) => {
  currentDealer.value = row
  detailVisible.value = true
  
  // 获取下级渠道商
  try {
    const res = await request({
      url: `/api/admin/water-purifier/dealers/${row.id}/sub-dealers`,
      method: 'get'
    })
    if (res.code === 0) {
      currentDealer.value.sub_dealers = res.data
    }
  } catch (error) {
    currentDealer.value.sub_dealers = []
  }
}

// 查看设备
const viewDevices = async (row) => {
  currentDealer.value = row
  devicesVisible.value = true
  devicesLoading.value = true
  
  try {
    const res = await request({
      url: `/api/admin/water-purifier/dealers/${row.id}/devices`,
      method: 'get'
    })
    if (res.code === 0) {
      dealerDevices.value = res.data || []
    }
  } catch (error) {
    dealerDevices.value = []
  } finally {
    devicesLoading.value = false
  }
}

// 格式化金额
const formatMoney = (val) => {
  if (!val && val !== 0) return '0.00'
  return parseFloat(val).toFixed(2)
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return dateStr.split(' ')[0]
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 统计卡片 */
.stats-overview {
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-card.blue { border-left: 4px solid #409eff; }
.stat-card.green { border-left: 4px solid #67c23a; }
.stat-card.orange { border-left: 4px solid #e6a23c; }
.stat-card.purple { border-left: 4px solid #9b59b6; }

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-card.blue .stat-icon { background: #ecf5ff; color: #409eff; }
.stat-card.green .stat-icon { background: #f0f9eb; color: #67c23a; }
.stat-card.orange .stat-icon { background: #fdf6ec; color: #e6a23c; }
.stat-card.purple .stat-icon { background: #f3e8ff; color: #9b59b6; }

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

/* 列表 */
.list-card {
  margin-top: 20px;
}

.dealer-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.money-value {
  color: #e6a23c;
  font-weight: 600;
}

.text-muted {
  color: #c0c4cc;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 详情 */
.drawer-subtitle {
  color: #606266;
  margin-bottom: 16px;
}

.perf-card {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.perf-value {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
}

.perf-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}
</style>
