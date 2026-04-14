<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <el-icon><Warning /></el-icon>
          故障预警管理
        </h2>
        <p class="page-subtitle">实时监控设备故障，快速响应处理</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-container">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card critical">
            <div class="stat-icon">
              <el-icon><CircleClose /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.critical || 0 }}</div>
              <div class="stat-label">紧急故障</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card high">
            <div class="stat-icon">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.high || 0 }}</div>
              <div class="stat-label">重要故障</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card medium">
            <div class="stat-icon">
              <el-icon><InfoFilled /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.medium || 0 }}</div>
              <div class="stat-label">一般故障</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card total">
            <div class="stat-icon">
              <el-icon><List /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.total || 0 }}</div>
              <div class="stat-label">故障总数</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 故障类型标签页 -->
    <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="fault-tabs">
      <el-tab-pane label="不出水报警" name="no_water">
        <template #label>
          <el-badge :value="statistics.no_water || 0" :max="99" class="tab-badge">
            <el-icon><CircleClose /></el-icon> 不出水报警
          </el-badge>
        </template>
      </el-tab-pane>
      <el-tab-pane label="TDS异常" name="high_tds">
        <template #label>
          <el-badge :value="statistics.high_tds || 0" :max="99" class="tab-badge">
            <el-icon><DataLine /></el-icon> TDS异常
          </el-badge>
        </template>
      </el-tab-pane>
      <el-tab-pane label="长期离线" name="offline_long">
        <template #label>
          <el-badge :value="statistics.offline_long || 0" :max="99" class="tab-badge">
            <el-icon><SwitchButton /></el-icon> 断网超3天
          </el-badge>
        </template>
      </el-tab-pane>
    </el-tabs>

    <!-- 提示信息 -->
    <div class="alert-container" v-if="activeTab === 'no_water'">
      <el-alert
        title="⚠️ 不出水是严重故障，可能直接影响用户体验"
        type="error"
        :closable="false"
        show-icon
      >
        <template #default>
          <div class="alert-content">
            <p><strong>包含范围：</strong></p>
            <ul>
              <li>🔴 <strong>已锁定</strong>：管理员主动停机，应立即处理</li>
              <li>🟠 <strong>服务过期/流量耗尽</strong>：业务停机，需联系续费或充值</li>
              <li>🟡 <strong>滤芯耗尽</strong>：硬件问题，需更换滤芯</li>
            </ul>
            <p><strong>处理建议：</strong></p>
            <ul>
              <li>📞 <strong>紧急故障</strong>：立即电话联系用户确认情况</li>
              <li>🔧 <strong>硬件故障</strong>：安排工程师上门检修</li>
              <li>💰 <strong>业务停机</strong>：引导用户续费或充值</li>
            </ul>
          </div>
        </template>
      </el-alert>
    </div>

    <!-- 故障设备列表 -->
    <el-table
      v-loading="listLoading"
      :data="list"
      border
      stripe
      highlight-current-row
      :row-class-name="getRowClassName"
      style="width: 100%"
    >
      <!-- 紧急程度标识 -->
      <el-table-column label="优先级" width="90" align="center" fixed="left">
        <template #default="{ row }">
          <el-tag
            :type="getSeverityType(row.severity)"
            :effect="row.needs_urgent_attention ? 'dark' : 'light'"
            size="small"
            class="severity-tag"
          >
            {{ getSeverityText(row.severity) }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 设备编号 -->
      <el-table-column label="设备编号" width="140" align="center">
        <template #default="{ row }">
          <span class="link-type" @click="handleViewDetail(row)">{{ row.board_code }}</span>
        </template>
      </el-table-column>

      <!-- 故障原因 -->
      <el-table-column label="故障原因" min-width="200" align="center">
        <template #default="{ row }">
          <div class="fault-reasons">
            <el-tag
              v-for="reason in row.fault_reasons"
              :key="reason"
              :type="getReasonTagType(reason)"
              effect="dark"
              size="small"
              style="margin-right: 5px; margin-bottom: 3px;"
            >
              {{ reason }}
            </el-tag>
          </div>
        </template>
      </el-table-column>

      <!-- 故障类型 -->
      <el-table-column label="类型" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.fault_category === '硬件故障' ? 'danger' : 'warning'" size="small">
            {{ row.fault_category }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 用户信息 -->
      <el-table-column label="用户" width="120" align="center">
        <template #default="{ row }">
          <div class="user-info">
            <div class="user-name">{{ row.user_name || '未绑定' }}</div>
            <div v-if="row.user_phone" class="user-phone">{{ row.user_phone }}</div>
          </div>
        </template>
      </el-table-column>

      <!-- 安装地址 -->
      <el-table-column label="地址" min-width="150" align="center" show-overflow-tooltip>
        <template #default="{ row }">
          <span>{{ row.address || '-' }}</span>
        </template>
      </el-table-column>

      <!-- TDS值 -->
      <el-table-column label="TDS(净)" width="80" align="center">
        <template #default="{ row }">
          <span :class="{ 'text-danger': row.pure_water_tds > 10 }">
            {{ row.pure_water_tds ?? '-' }}
          </span>
        </template>
      </el-table-column>

      <!-- 状态 -->
      <el-table-column label="设备状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.is_online ? 'success' : 'info'" size="small">
            {{ row.is_online ? '在线' : '离线' }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 套餐类型 -->
      <el-table-column label="套餐" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.billing_mode === 'time' ? 'primary' : 'success'" size="small">
            {{ row.billing_mode === 'time' ? '包年' : '流量' }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 最后同步 -->
      <el-table-column label="最后活动" width="150" align="center">
        <template #default="{ row }">
          <span class="last-sync">{{ row.last_active_at || '-' }}</span>
        </template>
      </el-table-column>

      <!-- 操作按钮 -->
      <el-table-column label="快速处理" align="center" width="280" fixed="right">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-button
              v-if="row.user_phone"
              type="danger"
              size="small"
              @click="handleCallUser(row)"
              :disabled="!row.user_phone"
            >
              <el-icon><Phone /></el-icon> 电话联系
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="handleViewDetail(row)"
            >
              <el-icon><View /></el-icon> 查看详情
            </el-button>
            <el-dropdown @command="(cmd) => handleMoreAction(cmd, row)">
              <el-button type="info" size="small">
                更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="control">
                    <el-icon><Operation /></el-icon> 远程控制
                  </el-dropdown-item>
                  <el-dropdown-item command="filter">
                    <el-icon><Filter /></el-icon> 滤芯管理
                  </el-dropdown-item>
                  <el-dropdown-item command="log">
                    <el-icon><Document /></el-icon> 查看日志
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="listQuery.page"
        v-model:page-size="listQuery.limit"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 设备详情抽屉 -->
    <el-drawer
      v-model="detailDrawerVisible"
      title="设备详情"
      size="60%"
      direction="rtl"
    >
      <div v-if="currentDevice" class="device-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备编号">{{ currentDevice.board_code }}</el-descriptions-item>
          <el-descriptions-item label="IMEI">{{ currentDevice.imei }}</el-descriptions-item>
          <el-descriptions-item label="品牌">{{ currentDevice.brand || '-' }}</el-descriptions-item>
          <el-descriptions-item label="型号">{{ currentDevice.device_model || '-' }}</el-descriptions-item>
          <el-descriptions-item label="故障类型">
            <el-tag :type="currentDevice.fault_category === '硬件故障' ? 'danger' : 'warning'">
              {{ currentDevice.fault_category }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="紧急程度">
            <el-tag :type="getSeverityType(currentDevice.severity)" :effect="currentDevice.needs_urgent_attention ? 'dark' : 'light'">
              {{ getSeverityText(currentDevice.severity) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="故障原因">
            <div class="fault-reasons-detail">
              <el-tag
                v-for="reason in currentDevice.fault_reasons"
                :key="reason"
                type="danger"
                effect="dark"
                size="small"
                style="margin-right: 5px;"
              >
                {{ reason }}
              </el-tag>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="用户姓名">{{ currentDevice.user_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">
            <span v-if="currentDevice.user_phone">{{ currentDevice.user_phone }}</span>
            <el-button v-else type="text" size="small" disabled>未绑定用户</el-button>
          </el-descriptions-item>
          <el-descriptions-item label="安装地址" :span="2">{{ currentDevice.address || '-' }}</el-descriptions-item>
          <el-descriptions-item label="套餐类型">
            <el-tag :type="currentDevice.billing_mode === 'time' ? 'primary' : 'success'" size="small">
              {{ currentDevice.billing_mode === 'time' ? '包年套餐' : '流量套餐' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="剩余额度">
            <span v-if="currentDevice.billing_mode === 'time'">
              {{ currentDevice.remaining_days ?? '-' }} 天
            </span>
            <span v-else>
              {{ currentDevice.surplus_flow ?? 0 }} L
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="用户已用">{{ currentDevice.actual_usage ?? 0 }} L</el-descriptions-item>
          <el-descriptions-item label="剩余流量">{{ currentDevice.surplus_flow ?? 0 }} L</el-descriptions-item>
          <el-descriptions-item label="净水TDS">
            <span :class="{ 'text-danger': currentDevice.pure_water_tds > 10 }">
              {{ currentDevice.pure_water_tds ?? '-' }} ppm
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="设备状态">
            <el-tag :type="currentDevice.is_online ? 'success' : 'danger'">
              {{ currentDevice.is_online ? '在线' : '离线' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="最后活动">{{ currentDevice.last_active_at || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 快速操作区域 -->
        <div class="quick-actions" v-if="currentDevice.user_phone">
          <h4>快速处理</h4>
          <el-space wrap>
            <el-button type="danger" :icon="Phone" @click="handleCallUser(currentDevice)">
              电话联系用户 ({{ currentDevice.user_phone }})
            </el-button>
            <el-button type="primary" :icon="Operation" @click="handleControlDevice(currentDevice)">
              远程控制设备
            </el-button>
            <el-button type="warning" :icon="Filter" @click="handleManageFilter(currentDevice)">
              滤芯管理
            </el-button>
          </el-space>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Warning, CircleClose, InfoFilled, List, DataLine, SwitchButton,
  Refresh, Phone, View, ArrowDown, Operation, Filter, Document
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()

// 标签页
const activeTab = ref('no_water')
const list = ref([])
const total = ref(0)
const listLoading = ref(true)
const listQuery = reactive({
  page: 1,
  limit: 20,
  type: 'no_water'
})

// 统计数据
const statistics = ref({
  critical: 0,
  high: 0,
  medium: 0,
  total: 0,
  no_water: 0,
  high_tds: 0,
  offline_long: 0
})

// 当前设备
const currentDevice = ref(null)
const detailDrawerVisible = ref(false)

// 获取列表数据
const getList = async () => {
  listLoading.value = true
  try {
    const response = await request({
      url: '/api/admin/water-purifier/faults',
      method: 'get',
      params: listQuery
    })

    if (response.code === 0) {
      list.value = response.data || []
      total.value = response.meta?.total || 0

      // 计算统计数据
      updateStatistics()
    }
  } catch (error) {
    console.error('获取故障设备列表失败:', error)
    ElMessage.error('获取故障设备列表失败')
  } finally {
    listLoading.value = false
  }
}

// 更新统计数据
const updateStatistics = () => {
  const stats = {
    critical: 0,
    high: 0,
    medium: 0,
    total: list.value.length
  }

  list.value.forEach(item => {
    if (item.severity === 'critical') stats.critical++
    else if (item.severity === 'high') stats.high++
    else if (item.severity === 'medium') stats.medium++
  })

  statistics.value = {
    critical: stats.critical,
    high: stats.high,
    medium: stats.medium,
    total: total.value, // 使用API返回的总数，而不是当前页面数量
    no_water: activeTab.value === 'no_water' ? total.value : 0,
    high_tds: activeTab.value === 'high_tds' ? total.value : 0,
    offline_long: activeTab.value === 'offline_long' ? total.value : 0
  }
}

// 切换标签页
const handleTabClick = (tab) => {
  listQuery.type = tab.paneName
  listQuery.page = 1
  getList()
}

// 分页
const handleSizeChange = (val) => {
  listQuery.limit = val
  getList()
}

const handleCurrentChange = (val) => {
  listQuery.page = val
  getList()
}

// 刷新数据
const refreshData = () => {
  getList()
}

// 获取紧急程度标签类型
const getSeverityType = (severity) => {
  const types = {
    critical: 'danger',
    high: 'warning',
    medium: 'info',
    low: 'success'
  }
  return types[severity] || 'info'
}

// 获取紧急程度文本
const getSeverityText = (severity) => {
  const texts = {
    critical: '🔴 紧急',
    high: '🟠 重要',
    medium: '🟡 一般',
    low: '🟢 轻微'
  }
  return texts[severity] || '未知'
}

// 获取故障原因标签类型
const getReasonTagType = (reason) => {
  if (reason.includes('锁定') || reason.includes('耗尽')) return 'danger'
  if (reason.includes('过期') || reason.includes('流量')) return 'warning'
  return 'info'
}

// 行样式类名
const getRowClassName = ({ row }) => {
  if (row.severity === 'critical') return 'critical-row'
  if (row.needs_urgent_attention) return 'urgent-row'
  return ''
}

// 电话联系用户
const handleCallUser = (row) => {
  if (!row.user_phone) {
    ElMessage.warning('该设备未绑定用户或用户无电话')
    return
  }

  ElMessageBox.confirm(
    `即将拨打用户电话：${row.user_phone}\n\n请确认已准备好处理方案`,
    '电话联系用户',
    {
      confirmButtonText: '拨打',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 实际项目中可以调用电话API或显示拨号界面
    window.location.href = `tel:${row.user_phone}`
    ElMessage.success('正在拨打电话...')
  }).catch(() => {})
}

// 查看设备详情
const handleViewDetail = async (row) => {
  try {
    const res = await request({
      url: `/api/admin/water-purifier/${row.id}`,
      method: 'get'
    })

    if (res.code === 0) {
      const deviceData = res.data.device || res.data
      const filtersData = res.data.filters || []

      currentDevice.value = {
        ...deviceData,
        device_id: deviceData.board_code,
        filters: filtersData.map(f => ({
          ...f,
          filter_index: f.id,
          life_percent: f.percent || 0,
          used: f.used || 0,
          total: f.total || 0
        }))
      }

      // 合并故障信息
      currentDevice.value.fault_reasons = row.fault_reasons
      currentDevice.value.fault_category = row.fault_category
      currentDevice.value.severity = row.severity
      currentDevice.value.needs_urgent_attention = row.needs_urgent_attention
      currentDevice.value.user_phone = row.user_phone
      currentDevice.value.user_name = row.user_name
      currentDevice.value.address = row.address

      detailDrawerVisible.value = true
    }
  } catch (error) {
    console.error('获取设备详情失败:', error)
    ElMessage.error('获取设备详情失败')
  }
}

// 更多操作
const handleMoreAction = (command, row) => {
  switch (command) {
    case 'control':
      handleControlDevice(row)
      break
    case 'filter':
      handleManageFilter(row)
      break
    case 'log':
      handleViewLog(row)
      break
  }
}

// 远程控制
const handleControlDevice = (row) => {
  detailDrawerVisible.value = false
  router.push({
    path: '/water-purifier/devices',
    query: { keyword: row.board_code, action: 'control' }
  })
}

// 滤芯管理
const handleManageFilter = (row) => {
  detailDrawerVisible.value = false
  router.push({
    path: '/water-purifier/devices',
    query: { keyword: row.board_code, action: 'filter' }
  })
}

// 查看日志
const handleViewLog = (row) => {
  ElMessage.info('日志功能开发中...')
}

onMounted(() => {
  getList()
})
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

/* 统计卡片 */
.stats-container {
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-card.critical .stat-icon { background: #fee; color: #f56c6c; }
.stat-card.high .stat-icon { background: #fff7e6; color: #e6a23c; }
.stat-card.medium .stat-icon { background: #f4f4f5; color: #909399; }
.stat-card.total .stat-icon { background: #e6f7ff; color: #409eff; }

.stat-number {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

/* 标签页 */
.fault-tabs {
  margin-bottom: 20px;
}

.tab-badge {
  margin-right: 8px;
}

/* 提示信息 */
.alert-container {
  margin-bottom: 20px;
}

.alert-content ul {
  margin: 8px 0;
  padding-left: 20px;
}

.alert-content li {
  margin: 4px 0;
}

/* 表格样式 */
.severity-tag {
  font-weight: 600;
}

.fault-reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.user-info {
  text-align: left;
}

.user-name {
  font-weight: 500;
  color: #303133;
}

.user-phone {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.link-type {
  color: #409EFF;
  cursor: pointer;
  font-weight: 500;
}

.link-type:hover {
  text-decoration: underline;
}

.text-danger {
  color: #f56c6c;
  font-weight: bold;
}

.last-sync {
  font-size: 12px;
  color: #606266;
}

.action-buttons {
  display: flex;
  gap: 5px;
  justify-content: center;
}

/* 表格行样式 */
:deep(.critical-row) {
  background-color: #fee !important;
}

:deep(.urgent-row) {
  background-color: #fff7e6 !important;
}

/* 分页 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 设备详情 */
.device-detail {
  padding: 20px;
}

.fault-reasons-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.quick-actions {
  margin-top: 30px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.quick-actions h4 {
  margin: 0 0 15px 0;
  color: #303133;
}
</style>
