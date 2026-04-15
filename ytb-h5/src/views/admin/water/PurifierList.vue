<template>
  <div class="water-purifier-page">
    <van-nav-bar
      title="净水器管理"
      left-arrow
      fixed
      placeholder
      @click-left="onClickBack"
    >
      <template #right>
        <van-icon name="replay" size="18" @click="handleRefresh" />
      </template>
    </van-nav-bar>

    <!-- 统计概览 -->
    <section class="summary-section" v-if="statistics">
      <div class="summary-row">
        <div class="summary-card" v-for="stat in summaryCards" :key="stat.key">
          <div class="summary-card__value">{{ stat.value }}</div>
          <div class="summary-card__label">{{ stat.label }}</div>
        </div>
      </div>
    </section>

    <!-- 筛选面板 -->
    <section class="filter-panel">
      <van-search
        v-model="listQuery.keyword"
        placeholder="搜索设备编号 / IMEI / ICCID"
        show-action
        shape="round"
        clearable
        @search="handleSearch"
      >
        <template #action>
          <van-button size="small" type="primary" round @click="handleSearch">查询</van-button>
        </template>
      </van-search>

      <div class="filter-row">
        <van-dropdown-menu>
          <van-dropdown-item v-model="listQuery.status" :options="statusOptions" @change="handleFiltersChange" />
          <van-dropdown-item v-model="listQuery.is_online" :options="onlineOptions" @change="handleFiltersChange" />
          <van-dropdown-item v-model="listQuery.billing_mode" :options="billingOptions" @change="handleFiltersChange" />
        </van-dropdown-menu>
      </div>

      <div class="alert-row">
        <van-tag
          round
          plain
          :type="listQuery.filter_alert ? 'danger' : 'primary'"
          @click="toggleFilterAlert"
        >
          滤芯预警
          <span v-if="statistics?.filter_alert_count">({{ statistics.filter_alert_count }})</span>
        </van-tag>
      </div>
    </section>

    <!-- 设备列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <div class="device-list">
        <template v-if="loading && !devices.length">
          <div class="skeleton-wrapper">
            <van-skeleton v-for="idx in 3" :key="idx" loading title :row="5" animated />
          </div>
        </template>
        
        <template v-else-if="devices.length">
          <div v-for="device in devices" :key="device.id" class="device-card" @click="openDetail(device)">
            <div class="device-card__header">
              <div class="device-card__title">{{ device.board_code || '未知设备' }}</div>
              <div class="device-card__tags">
                <van-tag round :type="device.is_online ? 'success' : 'default'" size="small">
                  {{ device.is_online ? '在线' : '离线' }}
                </van-tag>
                <van-tag round :type="getStatusTagType(device.status)" size="small">
                  {{ getStatusText(device.status) }}
                </van-tag>
              </div>
            </div>

            <div class="device-card__info">
              <div class="info-item">
                <span class="info-label">用户</span>
                <span class="info-value">{{ device.current_binding?.user?.name || '未绑定' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">计费模式</span>
                <span class="info-value">{{ getBillingModeText(device.billing_mode) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">信号</span>
                <span class="info-value" :class="getSignalClass(device.signal_strength)">
                  {{ device.signal_strength || '-' }}
                </span>
              </div>
            </div>

            <div class="device-card__filters">
              <div class="filter-item" v-for="filter in getFilterSummary(device)" :key="filter.id">
                <div class="filter-name">{{ filter.name }}</div>
                <van-progress
                  :percentage="filter.percent"
                  :color="getProgressColor(filter.percent)"
                  stroke-width="6"
                  :show-pivot="false"
                />
                <div class="filter-percent" :class="getFilterClass(filter.percent)">{{ filter.percent }}%</div>
              </div>
            </div>

            <div class="device-card__footer">
              <div class="footer-info">
                <van-icon name="clock-o" size="14" />
                <span>{{ formatDate(device.last_sync_at) }}</span>
              </div>
              <div class="footer-actions">
                <van-button size="small" round plain type="primary" @click.stop="openControl(device)">
                  控制
                </van-button>
                <van-button size="small" round plain type="primary" @click.stop="openFilterReset(device)">
                  滤芯
                </van-button>
              </div>
            </div>
          </div>
        </template>

        <van-empty v-else-if="!loading" description="暂无设备数据" />
      </div>
    </van-pull-refresh>

    <!-- 分页 -->
    <div class="pagination-wrapper" v-if="meta.total > meta.per_page">
      <van-button size="small" round plain type="primary" :disabled="meta.current_page <= 1" @click="prevPage">
        上一页
      </van-button>
      <div class="pagination-status">
        第 {{ meta.current_page }} / {{ meta.last_page }} 页
      </div>
      <van-button size="small" round type="primary" :disabled="meta.current_page >= meta.last_page" @click="nextPage">
        下一页
      </van-button>
    </div>

    <!-- 设备详情弹窗 -->
    <van-popup v-model:show="detailVisible" position="bottom" round :style="{ height: '85%' }">
      <div class="popup-panel">
        <div class="popup-header">
          <div>
            <div class="popup-title">设备详情</div>
            <div class="popup-subtitle">{{ currentDevice?.board_code }}</div>
          </div>
          <van-icon name="cross" size="18" @click="detailVisible = false" />
        </div>
        <div class="popup-body" v-if="currentDevice">
          <van-cell-group inset title="基本信息">
            <van-cell title="设备编号" :value="currentDevice.board_code" />
            <van-cell title="IMEI" :value="currentDevice.imei || '-'" />
            <van-cell title="ICCID" :value="currentDevice.iccid || '-'" />
            <van-cell title="设备状态" :value="getStatusText(currentDevice.status)" />
            <van-cell title="网络状态" :value="currentDevice.is_online ? '在线' : '离线'" />
            <van-cell title="计费模式" :value="getBillingModeText(currentDevice.billing_mode)" />
            <van-cell title="信号强度" :value="currentDevice.signal_strength || '-'" />
          </van-cell-group>

          <van-cell-group inset title="用水数据">
            <van-cell title="累计水量" :value="`${currentDevice.cumulative_flow || 0} L`" />
            <van-cell title="剩余流量" :value="`${currentDevice.surplus_flow || 0} L`" />
            <van-cell title="原水TDS" :value="`${currentDevice.raw_water_tds || '-'} ppm`" />
            <van-cell title="纯水TDS" :value="`${currentDevice.pure_water_tds || '-'} ppm`" />
          </van-cell-group>

          <van-cell-group inset title="滤芯寿命">
            <div class="filter-detail-grid">
              <div v-for="filter in detailFilters" :key="filter.id" class="filter-detail-card">
                <div class="filter-detail-name">{{ filter.name }}</div>
                <van-circle
                  :rate="filter.percent"
                  :text="`${filter.percent}%`"
                  :color="getProgressColor(filter.percent)"
                  size="70px"
                />
                <div class="filter-detail-info">
                  剩余 {{ filter.remaining }} / {{ filter.total }}
                </div>
                <van-tag :type="filter.status === 'good' ? 'success' : (filter.status === 'warning' ? 'warning' : 'danger')" size="small">
                  {{ filter.status_text }}
                </van-tag>
              </div>
            </div>
          </van-cell-group>

          <van-cell-group inset title="绑定信息" v-if="currentDevice.current_binding">
            <van-cell title="绑定用户" :value="currentDevice.current_binding.user?.name || '-'" />
            <van-cell title="联系电话" :value="currentDevice.current_binding.contact_phone || '-'" />
            <van-cell title="安装地址" :value="currentDevice.current_binding.full_address || '-'" />
          </van-cell-group>
        </div>
      </div>
    </van-popup>

    <!-- 远程控制弹窗 -->
    <van-action-sheet
      v-model:show="controlVisible"
      :actions="controlActions"
      cancel-text="取消"
      @select="handleControlAction"
    />

    <!-- 滤芯管理弹窗 -->
    <van-popup v-model:show="filterResetVisible" position="bottom" round :style="{ height: '70%' }">
      <div class="popup-panel">
        <div class="popup-header">
          <div>
            <div class="popup-title">滤芯管理</div>
            <div class="popup-subtitle">{{ filterDevice?.board_code }}</div>
          </div>
          <van-icon name="cross" size="18" @click="filterResetVisible = false" />
        </div>
        <div class="popup-body">
          <van-cell-group inset title="快捷操作">
            <van-cell title="从本地数据同步" is-link @click="syncFromLocal" />
            <van-cell title="使用包年模板初始化" is-link @click="initWithTemplate('annual')" />
            <van-cell title="使用流量模板初始化" is-link @click="initWithTemplate('flow')" />
          </van-cell-group>

          <van-cell-group inset title="滤芯重置">
            <div class="filter-reset-form">
              <div v-for="(filter, idx) in filterResetForm" :key="idx" class="filter-reset-item">
                <van-checkbox v-model="filter.selected" shape="square">
                  {{ filter.name }}
                </van-checkbox>
                <van-field
                  v-model="filter.maxValue"
                  type="number"
                  placeholder="初始值"
                  :disabled="!filter.selected"
                />
              </div>
            </div>
          </van-cell-group>

          <van-cell-group inset>
            <van-field label="同步到IOT">
              <template #input>
                <van-switch v-model="syncToIot" />
              </template>
            </van-field>
            <van-field v-model="resetReason" label="重置原因" placeholder="选填" />
          </van-cell-group>

          <div class="panel-actions">
            <van-button block type="primary" round :loading="resetLoading" @click="submitFilterReset">
              确认重置
            </van-button>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showLoadingToast, closeToast, showSuccessToast, showFailToast, showConfirmDialog } from 'vant'
import {
  getWaterPurifiers,
  getWaterPurifierDetail,
  controlDevice,
  resetFilters,
  syncFiltersFromLocal,
  initializeDevice,
  getFilterTemplates,
  CONTROL_ACTIONS,
  BILLING_MODE_TEXT
} from '@/api/waterPurifier'

const router = useRouter()

// 状态
const loading = ref(false)
const refreshing = ref(false)
const devices = ref([])
const statistics = ref(null)
const meta = reactive({
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0
})

// 查询条件
const listQuery = reactive({
  keyword: '',
  status: '',
  is_online: '',
  billing_mode: '',
  filter_alert: false
})

// 筛选选项
const statusOptions = [
  { text: '全部状态', value: '' },
  { text: '待激活', value: 'pending' },
  { text: '已安装', value: 'installed' },
  { text: '已激活', value: 'activated' },
  { text: '已锁定', value: 'locked' },
  { text: '故障', value: 'fault' }
]

const onlineOptions = [
  { text: '全部网络', value: '' },
  { text: '在线', value: '1' },
  { text: '离线', value: '0' }
]

const billingOptions = [
  { text: '全部计费', value: '' },
  { text: '时长模式', value: '01' },
  { text: '流量模式', value: '02' },
  { text: '零售模式', value: '03' }
]

// 详情弹窗
const detailVisible = ref(false)
const currentDevice = ref(null)
const detailFilters = ref([])

// 控制弹窗
const controlVisible = ref(false)
const controlDevice_ = ref(null)
const controlActions = [
  { name: '开机', key: CONTROL_ACTIONS.POWER_ON },
  { name: '关机', key: CONTROL_ACTIONS.POWER_OFF },
  { name: '锁定', key: CONTROL_ACTIONS.LOCK },
  { name: '解锁', key: CONTROL_ACTIONS.UNLOCK },
  { name: '冲洗滤芯', key: CONTROL_ACTIONS.FLUSH },
  { name: '查询状态', key: CONTROL_ACTIONS.QUERY }
]

// 滤芯管理弹窗
const filterResetVisible = ref(false)
const filterDevice = ref(null)
const filterResetForm = ref([
  { id: 1, name: 'PP棉', selected: false, maxValue: 365 },
  { id: 2, name: '活性炭', selected: false, maxValue: 365 },
  { id: 3, name: 'RO膜', selected: false, maxValue: 730 },
  { id: 4, name: '后置炭', selected: false, maxValue: 365 },
  { id: 5, name: '矿化球', selected: false, maxValue: 365 }
])
const syncToIot = ref(false)
const resetReason = ref('')
const resetLoading = ref(false)
const filterTemplates = ref(null)

// 统计卡片
const summaryCards = computed(() => {
  if (!statistics.value) return []
  return [
    { key: 'total', label: '设备总数', value: statistics.value.total_devices || 0 },
    { key: 'online', label: '在线设备', value: statistics.value.online_devices || 0 },
    { key: 'activated', label: '已激活', value: statistics.value.activated_devices || 0 },
    { key: 'alert', label: '滤芯预警', value: statistics.value.filter_alert_count || 0 }
  ]
})

// 获取设备列表
async function fetchDevices(reset = false) {
  if (reset) {
    meta.current_page = 1
  }
  
  loading.value = true
  try {
    const params = {
      page: meta.current_page,
      per_page: meta.per_page,
      ...listQuery,
      filter_alert: listQuery.filter_alert ? 1 : 0
    }
    
    const res = await getWaterPurifiers(params)
    if (res.code === 0) {
      devices.value = res.data || []
      Object.assign(meta, res.meta || {})
      if (res.statistics) {
        statistics.value = res.statistics
      }
    }
  } catch (e) {
    console.error('获取设备列表失败:', e)
    showFailToast('获取设备列表失败')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 加载滤芯模板
async function loadFilterTemplates() {
  try {
    const res = await getFilterTemplates()
    if (res.code === 0) {
      filterTemplates.value = res.data
    }
  } catch (e) {
    console.error('加载滤芯模板失败:', e)
  }
}

// 搜索
function handleSearch() {
  fetchDevices(true)
}

function handleFiltersChange() {
  fetchDevices(true)
}

function toggleFilterAlert() {
  listQuery.filter_alert = !listQuery.filter_alert
  fetchDevices(true)
}

function onRefresh() {
  fetchDevices(true)
}

function handleRefresh() {
  fetchDevices(true)
}

function prevPage() {
  if (meta.current_page > 1) {
    meta.current_page--
    fetchDevices()
  }
}

function nextPage() {
  if (meta.current_page < meta.last_page) {
    meta.current_page++
    fetchDevices()
  }
}

function onClickBack() {
  router.push('/admin')
}

// 打开详情
async function openDetail(device) {
  detailVisible.value = true
  currentDevice.value = device
  
  try {
    const res = await getWaterPurifierDetail(device.id)
    if (res.code === 0) {
      currentDevice.value = res.data.device
      detailFilters.value = res.data.filters || []
    }
  } catch (e) {
    console.error('获取设备详情失败:', e)
  }
}

// 打开控制面板
function openControl(device) {
  controlDevice_.value = device
  controlVisible.value = true
}

// 执行控制操作
async function handleControlAction(action) {
  if (!controlDevice_.value) return
  
  const actionNames = {
    power_on: '开机',
    power_off: '关机',
    lock: '锁定',
    unlock: '解锁',
    flush: '冲洗',
    query: '查询'
  }
  
  try {
    await showConfirmDialog({
      title: '确认操作',
      message: `确定要对设备 ${controlDevice_.value.board_code} 执行"${actionNames[action.key]}"操作吗？`
    })
    
    showLoadingToast({ message: '执行中...', forbidClick: true })
    
    const res = await controlDevice(controlDevice_.value.id, action.key)
    closeToast()
    
    if (res.code === 0) {
      showSuccessToast('操作成功')
      fetchDevices()
    } else {
      showFailToast(res.message || '操作失败')
    }
  } catch (e) {
    closeToast()
    if (e !== 'cancel') {
      showFailToast('操作失败')
    }
  }
  
  controlVisible.value = false
}

// 打开滤芯管理
function openFilterReset(device) {
  filterDevice.value = device
  filterResetVisible.value = true
  syncToIot.value = false
  resetReason.value = ''
  
  // 重置表单
  filterResetForm.value.forEach(f => {
    f.selected = false
  })
}

// 从本地数据同步
async function syncFromLocal() {
  if (!filterDevice.value) return
  
  try {
    await showConfirmDialog({
      title: '确认同步',
      message: '将从旧系统数据库同步滤芯数据到当前设备，确定继续？'
    })
    
    showLoadingToast({ message: '同步中...', forbidClick: true })
    
    const res = await syncFiltersFromLocal(filterDevice.value.id)
    closeToast()
    
    if (res.code === 0) {
      showSuccessToast('同步成功')
      filterResetVisible.value = false
      fetchDevices()
    } else {
      showFailToast(res.message || '同步失败')
    }
  } catch (e) {
    closeToast()
    if (e !== 'cancel') {
      showFailToast('同步失败')
    }
  }
}

// 使用模板初始化
async function initWithTemplate(type) {
  if (!filterDevice.value || !filterTemplates.value) return
  
  const template = filterTemplates.value[type]
  if (!template) {
    showFailToast('模板不存在')
    return
  }
  
  const typeName = type === 'annual' ? '包年' : '流量'
  
  try {
    await showConfirmDialog({
      title: '确认初始化',
      message: `将使用${typeName}模板初始化设备滤芯，这将重置所有滤芯数据，确定继续？`
    })
    
    showLoadingToast({ message: '初始化中...', forbidClick: true })
    
    const filters = {}
    Object.keys(template).forEach(key => {
      filters[key] = template[key].max
    })
    
    const res = await initializeDevice(filterDevice.value.id, {
      billing_mode: type === 'annual' ? '01' : '02',
      package_type: type,
      filters,
      sync_to_iot: syncToIot.value
    })
    
    closeToast()
    
    if (res.code === 0) {
      showSuccessToast('初始化成功')
      filterResetVisible.value = false
      fetchDevices()
    } else {
      showFailToast(res.message || '初始化失败')
    }
  } catch (e) {
    closeToast()
    if (e !== 'cancel') {
      showFailToast('初始化失败')
    }
  }
}

// 提交滤芯重置
async function submitFilterReset() {
  const selectedFilters = filterResetForm.value.filter(f => f.selected)
  
  if (selectedFilters.length === 0) {
    showFailToast('请选择要重置的滤芯')
    return
  }
  
  resetLoading.value = true
  
  try {
    const res = await resetFilters(filterDevice.value.id, {
      filters: selectedFilters.map(f => ({
        id: f.id,
        max_value: parseInt(f.maxValue) || 365
      })),
      sync_to_iot: syncToIot.value,
      reason: resetReason.value
    })
    
    if (res.code === 0) {
      showSuccessToast('重置成功')
      filterResetVisible.value = false
      fetchDevices()
    } else {
      showFailToast(res.message || '重置失败')
    }
  } catch (e) {
    showFailToast('重置失败')
  } finally {
    resetLoading.value = false
  }
}

// 辅助函数
function getStatusText(status) {
  const map = {
    pending: '待激活',
    installed: '已安装',
    activated: '已激活',
    locked: '已锁定',
    fault: '故障'
  }
  return map[status] || '未知'
}

function getStatusTagType(status) {
  const map = {
    pending: 'default',
    installed: 'primary',
    activated: 'success',
    locked: 'warning',
    fault: 'danger'
  }
  return map[status] || 'default'
}

function getBillingModeText(mode) {
  return BILLING_MODE_TEXT[mode] || '未知'
}

function getSignalClass(signal) {
  if (!signal) return ''
  if (signal >= 20) return 'signal-good'
  if (signal >= 10) return 'signal-warning'
  return 'signal-danger'
}

function getFilterSummary(device) {
  const filters = []
  const names = ['PP棉', '活性炭', 'RO膜']
  
  for (let i = 1; i <= 3; i++) {
    const flux = device[`f${i}_flux`] || 0
    const fluxMax = device[`f${i}_flux_max`] || 0
    if (fluxMax > 0) {
      const percent = Math.round((flux / fluxMax) * 100)
      filters.push({
        id: i,
        name: names[i - 1],
        percent: Math.min(100, Math.max(0, percent))
      })
    }
  }
  
  return filters
}

function getProgressColor(percent) {
  if (percent > 50) return '#07c160'
  if (percent > 20) return '#ff976a'
  return '#ee0a24'
}

function getFilterClass(percent) {
  if (percent > 50) return 'filter-good'
  if (percent > 20) return 'filter-warning'
  return 'filter-danger'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', { hour12: false })
}

onMounted(() => {
  fetchDevices()
  loadFilterTemplates()
})
</script>

<style scoped>
.water-purifier-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 24px;
}

.summary-section {
  padding: 12px 16px;
}

.summary-row {
  display: flex;
  gap: 12px;
}

.summary-card {
  flex: 1;
  background: linear-gradient(135deg, #fdfbfb, #ebedee);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.summary-card__value {
  font-size: 20px;
  font-weight: 600;
  color: #323233;
}

.summary-card__label {
  font-size: 12px;
  color: #969799;
  margin-top: 4px;
}

.filter-panel {
  margin: 0 16px 12px;
  padding: 12px;
  background: #fff;
  border-radius: 12px;
}

.filter-row {
  margin: 8px 0;
}

.alert-row {
  display: flex;
  gap: 8px;
}

.device-list {
  padding-top: 8px;
  min-height: 200px;
}

.device-card {
  margin: 10px 14px;
  padding: 12px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}

.device-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.device-card__title {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
}

.device-card__tags {
  display: flex;
  gap: 6px;
}

.device-card__info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 10px;
  padding: 8px 0;
  border-top: 1px solid #f5f5f5;
  border-bottom: 1px solid #f5f5f5;
}

.info-item {
  text-align: center;
}

.info-label {
  font-size: 11px;
  color: #969799;
  display: block;
}

.info-value {
  font-size: 13px;
  color: #323233;
  margin-top: 2px;
}

.signal-good { color: #07c160; }
.signal-warning { color: #ff976a; }
.signal-danger { color: #ee0a24; }

.device-card__filters {
  display: flex;
  gap: 12px;
  margin-top: 10px;
}

.filter-item {
  flex: 1;
}

.filter-name {
  font-size: 11px;
  color: #969799;
  margin-bottom: 4px;
}

.filter-percent {
  font-size: 12px;
  font-weight: 500;
  margin-top: 2px;
}

.filter-good { color: #07c160; }
.filter-warning { color: #ff976a; }
.filter-danger { color: #ee0a24; }

.device-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f5f5f5;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #969799;
}

.footer-actions {
  display: flex;
  gap: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 16px;
}

.pagination-status {
  font-size: 13px;
  color: #646566;
}

.popup-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebedf0;
}

.popup-title {
  font-size: 16px;
  font-weight: 600;
}

.popup-subtitle {
  font-size: 12px;
  color: #969799;
  margin-top: 4px;
}

.popup-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.filter-detail-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 12px;
}

.filter-detail-card {
  width: 80px;
  text-align: center;
}

.filter-detail-name {
  font-size: 12px;
  color: #646566;
  margin-bottom: 8px;
}

.filter-detail-info {
  font-size: 11px;
  color: #969799;
  margin: 6px 0;
}

.filter-reset-form {
  padding: 12px;
}

.filter-reset-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.filter-reset-item .van-checkbox {
  flex-shrink: 0;
  width: 80px;
}

.filter-reset-item .van-field {
  flex: 1;
}

.panel-actions {
  margin: 16px 0;
}

.skeleton-wrapper {
  padding: 16px;
}
</style>
