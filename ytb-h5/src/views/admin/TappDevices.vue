<template>
  <div class="tapp-devices-page">
    <van-nav-bar
      title="设备管理"
      left-arrow
      fixed
      placeholder
      @click-left="onClickBack"
    >
      <template #right>
        <van-icon name="replay" size="18" @click="handleRefresh" />
      </template>
    </van-nav-bar>

    <section class="summary-section" v-if="summaryRows.length">
      <div
        v-for="(row, rowIndex) in summaryRows"
        :key="`row-${rowIndex}`"
        class="summary-row"
        :class="{ 'summary-row--first': rowIndex === 0, 'summary-row--second': rowIndex === 1 }"
      >
        <div
          v-for="card in row"
          :key="card.key"
          class="summary-card"
          :class="{
            'summary-card--clickable': clickableSummaryKeys.includes(card.key),
            'summary-card--active': summaryCardStatus[card.key]
          }"
          @click="handleSummaryCardClick(card.key)"
        >
          <div class="summary-card__value">{{ formatCount(card.value) }}</div>
          <div class="summary-card__label">{{ card.label }}</div>
          <div class="summary-card__desc">{{ card.desc }}</div>
        </div>
      </div>
    </section>

    <section class="filter-panel">
      <van-search
        v-model="listQuery.keyword"
        placeholder="搜索设备编号 / IMEI / 用户"
        show-action
        shape="round"
        clearable
        @search="handleSearch"
        @cancel="handleCancelSearch"
      >
        <template #action>
          <van-button size="small" type="primary" round @click="handleSearch">查询</van-button>
        </template>
      </van-search>

      <div class="filter-row">
        <van-dropdown-menu>
          <van-dropdown-item v-model="listQuery.status" :options="statusOptions" @change="handleFiltersChange" />
          <van-dropdown-item v-model="listQuery.network_status" :options="networkOptions" @change="handleFiltersChange" />
          <van-dropdown-item v-model="listQuery.billing_mode" :options="billingOptions" @change="handleFiltersChange" />
          <van-dropdown-item v-model="listQuery.is_self_use" :options="selfUseOptions" @change="handleFiltersChange" />
        </van-dropdown-menu>
      </div>

      <div class="alert-row">
        <van-tag
          v-for="chip in alertChips"
          :key="chip.key"
          round
          plain
          :type="chip.active ? 'danger' : 'primary'"
          @click="toggleAlert(chip.key)"
        >
          {{ chip.label }}
          <span v-if="chip.count">{{ formatCount(chip.count) }}</span>
        </van-tag>
      </div>
    </section>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <div class="device-list">
        <template v-if="listLoading && !initialLoaded">
          <div class="skeleton-wrapper">
            <van-skeleton v-for="idx in 3" :key="idx" loading title :row="5" animated />
          </div>
        </template>
        <template v-else-if="devices.length">
          <div v-for="device in devices" :key="device.id" class="device-card">
            <div class="device-card__header">
              <div class="device-card__title">{{ device.device_number || '未知设备' }}</div>
              <div class="device-card__tags">
                <van-tag round plain :type="statusTagType(device.status)">
                  {{ statusText(device.status) }}
                </van-tag>
                <van-tag round :type="device.is_online ? 'success' : 'default'">
                  {{ device.is_online ? '在线' : '离线' }}
                </van-tag>
              </div>
            </div>

            <div class="device-card__meta">
              <div class="meta-item">
                <div class="meta-label">所属用户</div>
                <div class="meta-value">{{ resolveDeviceOwner(device) }}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">计费模式</div>
                <div class="meta-value">{{ billingText(device.billing_mode) }}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">所属VIP</div>
                <div class="meta-value">{{ resolveVipName(device) }}</div>
              </div>
            </div>

            <div class="device-card__metrics">
              <div class="metric-item">
                <div class="metric-label">剩余流量</div>
                <div class="metric-value" :class="{ warning: device.is_low_water }">
                  {{ formatFlow(device.surplus_flow) }}
                </div>
              </div>
              <div class="metric-item">
                <div class="metric-label">剩余天数</div>
                <div class="metric-value" :class="{ warning: device.is_expire_soon }">
                  {{ formatDays(device.remaining_days) }}
                </div>
              </div>
              <div class="metric-item">
                <div class="metric-label">累计水量</div>
                <div class="metric-value">{{ formatFlow(device.cumulative_filtration_flow) }}</div>
              </div>
            </div>

            <div
              class="device-card__warnings"
              v-if="device.is_low_water || device.is_expire_soon || device.has_filter_alert"
            >
              <van-tag size="mini" type="danger" v-if="device.is_low_water">低水量预警</van-tag>
              <van-tag size="mini" type="warning" v-if="device.is_expire_soon">即将到期</van-tag>
              <van-tag size="mini" type="warning" v-if="device.has_filter_alert">滤芯预警</van-tag>
            </div>

            <div class="device-card__footer">
              <div class="footer-info">
                <van-icon name="clock-o" size="14" />
                <span>{{ formatDate(device.last_sync_time || device.activate_date) }}</span>
              </div>
              <div class="footer-actions">
                <van-button size="small" round plain type="primary" @click="openDetail(device.id)">详情</van-button>
                <van-button size="small" round plain type="primary" @click="openEdit(device)">编辑</van-button>
              </div>
            </div>
          </div>
        </template>
        <div v-else-if="initialLoaded" class="empty-state">
          <van-empty description="暂无设备数据" />
        </div>
      </div>
    </van-pull-refresh>

    <div class="pagination-wrapper" v-if="showPagination">
      <van-button
        size="small"
        round
        plain
        type="primary"
        icon="arrow-left"
        :disabled="!canPrev"
        @click="goPrevPage"
      >上一页</van-button>
      <div class="pagination-status">
        第 <span>{{ pagination.page }}</span> / {{ pagination.lastPage }} 页 · 共 {{ formatNumber(pagination.total) }} 台
      </div>
      <van-button
        size="small"
        round
        type="primary"
        icon="arrow"
        icon-position="right"
        :disabled="!canNext"
        @click="goNextPage"
      >下一页</van-button>
    </div>

    <van-floating-bubble axis="y" icon="more-o" @click="showActionSheet = true" />

    <van-action-sheet
      v-model:show="showActionSheet"
      :actions="actionItems"
      cancel-text="取消"
      close-on-click-action
      @select="handleActionSelect"
    />

    <van-popup
      v-model:show="deviceDetailVisible"
      round
      position="bottom"
      :style="{ height: '85%' }"
    >
      <div class="popup-panel">
        <div class="popup-header">
          <div>
            <div class="popup-title">设备详情</div>
            <div class="popup-subtitle">{{ currentDevice && currentDevice.device_number }}</div>
          </div>
          <van-icon name="cross" size="18" @click="deviceDetailVisible = false" />
        </div>

        <div class="popup-body">
          <van-skeleton v-if="detailLoading" title avatar :row="10" animated />
          <template v-else-if="currentDevice">
            <van-cell-group inset>
              <van-cell title="所属用户" :value="resolveDeviceOwner(currentDevice)" />
              <van-cell title="设备状态" :value="statusText(currentDevice.status)" />
              <van-cell title="网络状态" :value="currentDevice.is_online ? '在线' : '离线'" />
              <van-cell title="计费模式" :value="billingText(currentDevice.billing_mode)" />
              <van-cell title="剩余流量" :value="formatFlow(currentDevice.surplus_flow)" />
              <van-cell title="剩余天数" :value="formatDays(currentDevice.remaining_days)" />
              <van-cell title="累计水量" :value="formatFlow(currentDevice.cumulative_filtration_flow)" />
              <van-cell title="激活时间" :value="formatDate(currentDevice.activate_date)" />
              <van-cell title="最近同步" :value="formatDate(currentDevice.last_sync_time)" />
              <van-cell title="地址" :value="currentDevice.address || '未填写'" />
              <van-cell title="备注" :value="currentDevice.remark || '无'" />
            </van-cell-group>

            <div class="detail-section">
              <div class="section-title">滤芯寿命</div>
              <div class="filter-grid">
                <div v-for="item in filterStatus(currentDevice)" :key="item.key" class="filter-card">
                  <div class="filter-card__label">{{ item.label }}</div>
                  <van-circle :rate="item.percent" :text="item.text" size="70" :color="item.color" />
                </div>
              </div>
            </div>

            <div class="detail-section" v-if="currentDevice.recharge_info">
              <div class="section-title">最近充值</div>
              <van-cell-group inset>
                <van-cell title="订单号" :value="currentDevice.recharge_info.order_number" />
                <van-cell title="金额" :value="formatCurrency(currentDevice.recharge_info.money)" />
                <van-cell title="方式" :value="currentDevice.recharge_info.billing_mode_text" />
                <van-cell title="类型" :value="currentDevice.recharge_info.surrogate_type_text" />
                <van-cell title="充值时间" :value="formatDate(currentDevice.recharge_info.create_date)" />
              </van-cell-group>
            </div>
          </template>
        </div>
      </div>
    </van-popup>

    <van-popup
      v-model:show="editFormVisible"
      round
      position="bottom"
      :style="{ height: '80%' }"
    >
      <div class="popup-panel">
        <div class="popup-header">
          <div>
            <div class="popup-title">编辑设备</div>
            <div class="popup-subtitle">{{ deviceForm.device_number }}</div>
          </div>
          <van-icon name="cross" size="18" @click="editFormVisible = false" />
        </div>

        <div class="popup-body">
          <van-form @submit="submitForm">
            <van-cell-group inset>
              <van-field v-model="deviceForm.device_name" label="设备名称" placeholder="设备名称" />
              <van-field
                v-model="deviceForm.app_user_name"
                label="所属用户"
                placeholder="请选择用户"
                readonly
                clickable
                @click="openUserPicker"
              />
              <van-field label="设备状态">
                <template #input>
                  <van-radio-group v-model="deviceForm.status" direction="horizontal">
                    <van-radio name="E">启用</van-radio>
                    <van-radio name="D">禁用</van-radio>
                    <van-radio name="maintenance">维护</van-radio>
                  </van-radio-group>
                </template>
              </van-field>
              <van-field label="计费模式">
                <template #input>
                  <van-radio-group v-model="deviceForm.billing_mode" direction="horizontal">
                    <van-radio name="1">流量计费</van-radio>
                    <van-radio name="0">包年计费</van-radio>
                  </van-radio-group>
                </template>
              </van-field>
              <van-field label="是否自用">
                <template #input>
                  <van-switch v-model="deviceForm.is_self_use" />
                </template>
              </van-field>
              <van-field v-model="deviceForm.surplus_flow" type="number" label="剩余流量(L)" placeholder="请输入" />
              <van-field v-model="deviceForm.remaining_days" type="number" label="剩余天数" placeholder="请输入" />
              <van-field
                v-model="deviceForm.remark"
                type="textarea"
                rows="2"
                autosize
                label="备注"
                placeholder="设置备注信息"
              />
            </van-cell-group>

            <div class="panel-actions">
              <van-button block type="primary" round native-type="submit" :loading="submitLoading">保存</van-button>
            </div>
          </van-form>
        </div>
      </div>
    </van-popup>

    <van-popup
      v-model:show="showUserPicker"
      round
      position="bottom"
      :style="{ height: '60%' }"
    >
      <div class="popup-panel">
        <div class="popup-header">
          <div class="popup-title">选择用户</div>
          <van-icon name="cross" size="18" @click="showUserPicker = false" />
        </div>
        <div class="popup-body">
          <van-search v-model="userKeyword" placeholder="搜索姓名 / 手机号" show-action @search="loadUsers">
            <template #action>
              <van-button size="small" type="primary" round @click="loadUsers">查询</van-button>
            </template>
          </van-search>
          <van-list v-model:loading="userLoading" :finished="userFinished" finished-text="没有更多用户">
            <van-cell
              v-for="user in userList"
              :key="user.id"
              :title="user.name"
              :label="user.phone || '未填写手机号'"
              clickable
              @click="selectUser(user)"
            />
          </van-list>
        </div>
      </div>
    </van-popup>

    <van-dialog
      v-model:show="syncDialogVisible"
      title="同步设备数据"
      show-cancel-button
      confirm-button-text="开始同步"
      @confirm="confirmSync"
    >
      <van-cell-group inset>
        <van-field label="强制刷新">
          <template #input>
            <van-switch v-model="forceSyncOption" />
          </template>
        </van-field>
      </van-cell-group>
      <div class="sync-tip">强制刷新会重新拉取净水平台实时数据，请在低峰期执行。</div>
    </van-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  getAdminDevices,
  getAdminDeviceDetail,
  updateAdminDevice,
  syncAdminDevices,
  getAdminDeviceUsers
} from '@/api/device'
import {
  closeToast,
  showFailToast,
  showLoadingToast,
  showSuccessToast,
  showToast
} from 'vant'

const router = useRouter()

const defaultSummary = {
  total_devices: 0,
  online_devices: 0,
  offline_devices: 0,
  low_water_devices: 0,
  expire_soon_devices: 0,
  filter_alert_devices: 0,
  flow_billing_devices: 0,
  annual_billing_devices: 0,
  self_use_devices: 0,
  for_sale_devices: 0
}

const summary = ref({ ...defaultSummary })


const pickArrayPayload = (data) => {
  if (!data) return []
  if (Array.isArray(data)) return data

  const candidateKeys = ['data', 'list', 'items', 'records', 'rows']
  for (const key of candidateKeys) {
    if (Array.isArray(data[key])) {
      return data[key]
    }
  }

  if (Array.isArray(data?.data?.data)) {
    return data.data.data
  }

  return []
}

const formatNumber = (value) => {
  const num = Number(value ?? 0)
  if (Number.isNaN(num)) {
    return '0'
  }
  return num.toLocaleString('zh-CN')
}

const formatCount = (value) => formatNumber(value)

const summaryCards = computed(() => {
  const data = summary.value || defaultSummary
  return [
    {
      key: 'total',
      label: '设备总数',
      value: data.total_devices,
      desc: `在线 ${formatNumber(data.online_devices)} · 离线 ${formatNumber(data.offline_devices)}`
    },
    {
      key: 'alert',
      label: '预警设备',
      value: (data.low_water_devices ?? 0) + (data.filter_alert_devices ?? 0),
      desc: `低水量 ${formatNumber(data.low_water_devices)} · 滤芯 ${formatNumber(data.filter_alert_devices)}`
    },
    {
      key: 'expire',
      label: '即将到期',
      value: data.expire_soon_devices,
      desc: '剩余天数少于 30 天'
    },
    {
      key: 'billing',
      label: '流量计费',
      value: data.flow_billing_devices,
      desc: `包年 ${formatNumber(data.annual_billing_devices)}`
    },
    {
      key: 'self_use',
      label: '自用设备',
      value: data.self_use_devices,
      desc: `对外 ${formatNumber(data.for_sale_devices)}`
    }
  ]
})

const summaryRows = computed(() => {
  const cards = summaryCards.value
  if (!cards.length) return []
  const firstRow = cards.slice(0, 3)
  const secondRow = cards.slice(3)
  return [firstRow, secondRow].filter(row => row.length)
})

const devices = ref([])
const listLoading = ref(false)
const refreshing = ref(false)
const initialLoaded = ref(false)

const pagination = reactive({
  page: 1,
  perPage: 5,
  lastPage: 1,
  total: 0
})

const listQuery = reactive({
  keyword: '',
  status: '',
  network_status: '',
  billing_mode: '',
  is_self_use: '',
  low_water_alert: '',
  expire_alert: '',
  filter_alert: '',
  alert_union: '',
  // 后端旧参数兜底
  warning_filter: '',
  water_warning_filter: '',
  filter_warning_filter: ''
})

const clickableSummaryKeys = ['alert', 'expire']
const summaryCardStatus = computed(() => ({
  alert:
    listQuery.alert_union === '1' ||
    listQuery.low_water_alert === '1' ||
    listQuery.filter_alert === '1',
  expire: listQuery.expire_alert === '1'
}))

const clearAlertFilters = () => {
  listQuery.alert_union = ''
  listQuery.low_water_alert = ''
  listQuery.expire_alert = ''
  listQuery.filter_alert = ''
  listQuery.warning_filter = ''
  listQuery.water_warning_filter = ''
  listQuery.filter_warning_filter = ''
}

const showPagination = computed(() => pagination.total > pagination.perPage)
const canPrev = computed(() => pagination.page > 1)
const canNext = computed(() => pagination.page < pagination.lastPage)

const statusOptions = [
  { text: '全部状态', value: '' },
  { text: '启用', value: 'E' },
  { text: '禁用', value: 'D' },
  { text: '维护中', value: 'maintenance' }
]

const networkOptions = [
  { text: '全部网络', value: '' },
  { text: '在线', value: '1' },
  { text: '离线', value: '0' }
]

const billingOptions = [
  { text: '全部计费', value: '' },
  { text: '流量计费', value: '1' },
  { text: '包年计费', value: '0' }
]

const selfUseOptions = [
  { text: '全部用途', value: '' },
  { text: '自用设备', value: '1' },
  { text: '对外销售', value: '0' }
]

const alertChips = computed(() => [
  {
    key: 'low_water_alert',
    label: '低水量预警',
    active: listQuery.low_water_alert === '1',
    count: summary.value.low_water_devices
  },
  {
    key: 'expire_alert',
    label: '即将到期',
    active: listQuery.expire_alert === '1',
    count: summary.value.expire_soon_devices
  },
  {
    key: 'filter_alert',
    label: '滤芯预警',
    active: listQuery.filter_alert === '1',
    count: summary.value.filter_alert_devices
  }
])

const deviceDetailVisible = ref(false)
const detailLoading = ref(false)
const currentDevice = ref(null)

const defaultDeviceForm = {
  id: null,
  device_number: '',
  device_name: '',
  app_user_id: null,
  app_user_name: '',
  status: 'E',
  billing_mode: '1',
  is_self_use: false,
  surplus_flow: '',
  remaining_days: '',
  remark: ''
}

const deviceForm = reactive({ ...defaultDeviceForm })
const editFormVisible = ref(false)
const submitLoading = ref(false)

const showUserPicker = ref(false)
const userKeyword = ref('')
const userList = ref([])
const userLoading = ref(false)
const userFinished = ref(true)
let userSearchTimer = null

const syncDialogVisible = ref(false)
const forceSyncOption = ref(false)
const actionItems = [
  { name: '同步设备数据', key: 'sync' },
  { name: '刷新列表', key: 'refresh' }
]
const showActionSheet = ref(false)

const statusText = (status) => ({ E: '启用', D: '禁用', maintenance: '维护中' }[status] || '未知')
const statusTagType = (status) => ({ E: 'success', D: 'danger', maintenance: 'warning' }[status] || 'default')
const billingText = (mode) => (String(mode) === '1' ? '流量计费' : '包年计费')
const filterColor = (percent) => {
  const value = Number(percent ?? 100)
  if (value <= 20) return '#ee0a24'
  if (value <= 50) return '#ff976a'
  return '#07c160'
}

// 本地预警阈值（需求：滤芯<5%，天数<10天，流量<200L）
const ALERT_THRESHOLDS = {
  filterPercent: 5,
  days: 10,
  flow: 200
}

const matchesAlertFilters = (device) => {
  if (!device) return false

  const flowLow = Number(device.surplus_flow ?? 0) < ALERT_THRESHOLDS.flow
  const daysLow = Number(device.remaining_days ?? 9999) < ALERT_THRESHOLDS.days
  const filterPercents = [
    Number(device.f1_life_percent ?? 100),
    Number(device.f2_life_percent ?? 100),
    Number(device.f3_life_percent ?? 100)
  ]
  const filterLow = filterPercents.some(p => p < ALERT_THRESHOLDS.filterPercent)

  // 联合预警：任一符合即可
  if (listQuery.alert_union === '1') {
    return flowLow || daysLow || filterLow
  }

  // 单独模式
  if (listQuery.low_water_alert === '1' && !flowLow) return false
  if (listQuery.expire_alert === '1' && !daysLow) return false
  if (listQuery.filter_alert === '1' && !filterLow) return false

  // 若未开启任何预警过滤，则认为通过
  if (
    listQuery.low_water_alert !== '1' &&
    listQuery.expire_alert !== '1' &&
    listQuery.filter_alert !== '1'
  ) {
    return true
  }

  // 走到这里说明存在某些过滤已开启并已逐一判断
  return true
}
const resolveDeviceOwner = (device) => {
  if (!device) {
    return '未绑定'
  }
  return (
    device.client_name ||
    device.client?.name ||
    device.customer_name ||
    device.customer?.name ||
    device.app_user_name ||
    '未绑定'
  )
}

const resolveVipName = (device) => {
  if (!device) {
    return '未设置'
  }
  return (
    device.app_user_name ||
    device.vip_name ||
    device.vip?.name ||
    device.app_user?.nickname ||
    device.app_user?.name ||
    '未设置'
  )
}

const formatFlow = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  const num = Number(value)
  if (Number.isNaN(num)) return value
  return `${num.toFixed(0)} L`
}
const formatDays = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  const num = Number(value)
  if (Number.isNaN(num)) return value
  return `${num} 天`
}
const formatDate = (value) => {
  if (!value) return '-'
  const date = typeof value === 'string' ? new Date(value.replace(/-/g, '/')) : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString('zh-CN', { hour12: false })
}
const formatCurrency = (value) => {
  const num = Number(value ?? 0)
  if (Number.isNaN(num)) {
    return value || '¥0.00'
  }
  return `¥${num.toFixed(2)}`
}

const resetDeviceForm = () => {
  Object.assign(deviceForm, { ...defaultDeviceForm })
}

const fetchDevices = async ({ reset = false } = {}) => {
  if (listLoading.value) return false

  if (reset) {
    pagination.page = 1
  }

  listLoading.value = true
  let success = false

  try {
    const params = { page: pagination.page, per_page: pagination.perPage }
    Object.entries(listQuery).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        params[key] = value
      }
    })

    const res = await getAdminDevices(params)
    const payload = res?.data || {}
    const records = pickArrayPayload(payload)

    const metaSource = payload.meta || payload.pagination || payload.page_info || payload.page || {}
    pagination.total = payload.total ?? metaSource.total ?? 0
    pagination.lastPage = payload.last_page ?? metaSource.last_page ?? metaSource.pages ?? 1
    pagination.page = payload.current_page ?? metaSource.current_page ?? metaSource.page ?? pagination.page

    // 本地再过滤一次，保证预警卡片阈值要求
    const filteredRecords = records.filter(matchesAlertFilters)
    devices.value = filteredRecords
    // 若开启预警过滤，使用前端过滤后的数量来更新分页展示，避免“看不见”的设备
    if (listQuery.alert_union === '1' || listQuery.low_water_alert === '1' || listQuery.expire_alert === '1' || listQuery.filter_alert === '1') {
      pagination.total = filteredRecords.length
      pagination.lastPage = Math.max(1, Math.ceil(filteredRecords.length / pagination.perPage))
    }

    const stats = payload.statistics || payload.meta?.statistics || payload.summary || payload.data?.statistics || null
    if (stats) {
      summary.value = { ...defaultSummary, ...stats }
    } else if (pagination.page === 1 && !records.length) {
      summary.value = { ...defaultSummary }
    }

    initialLoaded.value = true
    success = true
  } catch (error) {
    console.error('获取设备列表失败:', error)
    showFailToast(error.message || '获取设备列表失败')
  } finally {
    listLoading.value = false
    refreshing.value = false
  }

  return success
}

const handleSearch = () => {
  listQuery.keyword = (listQuery.keyword || '').trim()
  fetchDevices({ reset: true })
}

const handleCancelSearch = () => {
  if (!listQuery.keyword) return
  listQuery.keyword = ''
  fetchDevices({ reset: true })
}

const handleFiltersChange = () => {
  // 切换下拉筛选时，同时关闭预警过滤，避免叠加导致空列表
  clearAlertFilters()
  fetchDevices({ reset: true })
}

const handleSummaryCardClick = (key) => {
  if (key === 'alert') {
    const shouldEnable = listQuery.alert_union !== '1'
    clearAlertFilters()
    if (shouldEnable) {
      listQuery.alert_union = '1'
      // 兼容后端旧参数，尽量命中接口层过滤
      listQuery.warning_filter = 'true'
    }
    fetchDevices({ reset: true })
    return
  }
  if (key === 'expire') {
    const shouldEnable = listQuery.expire_alert !== '1'
    clearAlertFilters()
    if (shouldEnable) {
      listQuery.expire_alert = '1'
    }
    fetchDevices({ reset: true })
  }
}

const toggleAlert = (key) => {
  const alreadyActive = listQuery[key] === '1'
  clearAlertFilters()

  if (!alreadyActive) {
    listQuery[key] = '1'

    // 兼容旧接口的预警筛选参数
    if (key === 'low_water_alert') {
      listQuery.water_warning_filter = 'true'
    } else if (key === 'filter_alert') {
      listQuery.filter_warning_filter = 'true'
    } else if (key === 'expire_alert') {
      listQuery.expire_alert = '1'
    }
  }

  fetchDevices({ reset: true })
}
const goPrevPage = () => {
  if (!canPrev.value) return
  pagination.page -= 1
  fetchDevices()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const goNextPage = () => {
  if (!canNext.value) return
  pagination.page += 1
  fetchDevices()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const onRefresh = () => {
  refreshing.value = true
  fetchDevices({ reset: true })
}

const onClickBack = () => {
  router.push('/admin')
}

const handleRefresh = () => {
  fetchDevices({ reset: true })
}

const openDetail = async (id) => {
  deviceDetailVisible.value = true
  detailLoading.value = true
  try {
    const res = await getAdminDeviceDetail(id)
    currentDevice.value = res?.data || null
  } catch (error) {
    console.error('获取设备详情失败:', error)
    showFailToast(error.message || '获取设备详情失败')
    deviceDetailVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

const openEdit = (device) => {
  resetDeviceForm()
  deviceForm.id = device.id
  deviceForm.device_number = device.device_number || ''
  deviceForm.device_name = device.device_name || device.device_number || ''
  deviceForm.app_user_id = device.app_user_id || null
  deviceForm.app_user_name = device.app_user_name || ''
  deviceForm.status = device.status || 'E'
  deviceForm.billing_mode = (device.billing_mode ?? '1').toString()
  deviceForm.is_self_use = Number(device.is_self_use) === 1
  deviceForm.surplus_flow = device.surplus_flow ?? ''
  deviceForm.remaining_days = device.remaining_days ?? ''
  deviceForm.remark = device.remark || ''
  editFormVisible.value = true
}

const submitForm = async () => {
  if (!deviceForm.id) {
    showToast('请选择需要编辑的设备')
    return
  }
  submitLoading.value = true
  try {
    const payload = {
      status: deviceForm.status,
      billing_mode: deviceForm.billing_mode,
      is_self_use: deviceForm.is_self_use ? 1 : 0,
      app_user_id: deviceForm.app_user_id,
      app_user_name: deviceForm.app_user_name,
      surplus_flow: deviceForm.surplus_flow === '' ? null : Number(deviceForm.surplus_flow),
      remaining_days: deviceForm.remaining_days === '' ? null : Number(deviceForm.remaining_days),
      remark: deviceForm.remark
    }
    await updateAdminDevice(deviceForm.id, payload)
    showSuccessToast('设备信息已更新')
    editFormVisible.value = false
    fetchDevices({ reset: true })
  } catch (error) {
    console.error('更新设备失败:', error)
    showFailToast(error.message || '更新设备失败')
  } finally {
    submitLoading.value = false
  }
}

const openUserPicker = () => {
  showUserPicker.value = true
}

const loadUsers = async () => {
  if (userLoading.value) return
  userLoading.value = true
  try {
    const res = await getAdminDeviceUsers({ keyword: userKeyword.value || undefined })
    userList.value = Array.isArray(res?.data) ? res.data : []
    userFinished.value = true
  } catch (error) {
    console.error('获取用户失败:', error)
    showFailToast(error.message || '获取用户失败')
  } finally {
    userLoading.value = false
  }
}

const selectUser = (user) => {
  deviceForm.app_user_id = user.id
  deviceForm.app_user_name = user.name
  showUserPicker.value = false
}

const confirmSync = async () => {
  const loading = showLoadingToast({ message: '同步中...', forbidClick: true })
  try {
    await syncAdminDevices({ force: forceSyncOption.value ? 1 : 0 })
    showSuccessToast('同步任务已提交')
    syncDialogVisible.value = false
    forceSyncOption.value = false
    fetchDevices({ reset: true })
  } catch (error) {
    console.error('同步设备失败:', error)
    showFailToast(error.message || '同步设备失败')
  } finally {
    closeToast()
  }
}

const handleActionSelect = (action) => {
  if (action.key === 'sync') {
    syncDialogVisible.value = true
  } else if (action.key === 'refresh') {
    fetchDevices({ reset: true })
  }
  showActionSheet.value = false
}

const filterStatus = (device) => {
  if (!device) {
    return []
  }
  const items = [
    { key: 'f1', label: 'PP棉', value: device.f1_life_percent },
    { key: 'f2', label: '活性炭', value: device.f2_life_percent },
    { key: 'f3', label: 'RO滤芯', value: device.f3_life_percent }
  ]
  return items.map((item) => {
    const percent = Math.max(0, Math.min(100, Number(item.value ?? 100)))
    return {
      key: item.key,
      label: item.label,
      percent,
      text: `${Math.round(percent)}%`,
      color: filterColor(percent)
    }
  })
}

watch(editFormVisible, (visible) => {
  if (!visible) {
    resetDeviceForm()
  }
})

watch(showUserPicker, (visible) => {
  if (visible) {
    userKeyword.value = ''
    loadUsers()
  } else if (userSearchTimer) {
    clearTimeout(userSearchTimer)
    userSearchTimer = null
  }
})

watch(userKeyword, (value) => {
  if (!showUserPicker.value) return
  if (userSearchTimer) {
    clearTimeout(userSearchTimer)
  }
  userSearchTimer = setTimeout(() => {
    loadUsers()
  }, 400)
})

onMounted(() => {
  fetchDevices({ reset: true })
})

onUnmounted(() => {
  if (userSearchTimer) {
    clearTimeout(userSearchTimer)
  }
})
</script>

<style scoped>
.tapp-devices-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 24px;
}
.summary-section {
  padding: 12px 16px 0;
}
.summary-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: nowrap;
}
.summary-row--second {
  justify-content: center;
}
.summary-row:last-child {
  margin-bottom: 4px;
}
.summary-card {
  position: relative;
  background: linear-gradient(135deg, #fdfbfb, #ebedee);
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 8px 20px rgba(50, 55, 66, 0.08);
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
}
.summary-card--clickable {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.summary-card--clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.summary-card--active {
  border: 1px solid #1989fa;
  box-shadow: 0 4px 14px rgba(25, 137, 250, 0.18);
}
.summary-row--first .summary-card {
  flex-basis: calc((100% - 24px) / 3);
}
.summary-row--second .summary-card {
  flex-basis: calc((100% - 12px) / 2);
  max-width: 260px;
}
.summary-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle at top right, rgba(128, 182, 244, 0.25), transparent 55%);
  pointer-events: none;
}
.summary-card__value,
.summary-card__label,
.summary-card__desc {
  position: relative;
  z-index: 1;
}
.summary-card__value {
  font-size: 20px;
  font-weight: 600;
  color: #323233;
}
.summary-card__label {
  margin-top: 4px;
  font-size: 13px;
  color: #646566;
}
.summary-card__desc {
  margin-top: 6px;
  font-size: 12px;
  color: #969799;
}
@media (max-width: 640px) {
  .summary-row {
    flex-wrap: wrap;
    justify-content: center;
  }
  .summary-row .summary-card {
    flex-basis: calc(50% - 10px);
    max-width: none;
  }
}
.filter-panel {
  margin: 12px 16px 0;
  padding: 12px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}
.filter-row {
  margin-bottom: 8px;
}
.alert-row {
  display: flex;
  flex-wrap: wrap;
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
  border-radius: 10px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}
.device-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.device-card__title {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
  word-break: break-all;
}
.device-card__tags {
  display: flex;
  gap: 6px;
}
.device-card__meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px 12px;
  margin-top: 8px;
}
.meta-label {
  font-size: 12px;
  color: #969799;
}
.meta-value {
  margin-top: 2px;
  font-size: 13px;
  color: #323233;
}
.device-card__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px 12px;
  margin-top: 6px;
}
.metric-label {
  font-size: 12px;
  color: #969799;
}
.metric-value {
  margin-top: 2px;
  font-size: 13px;
  font-weight: 500;
  color: #323233;
}
.metric-value.warning {
  color: #ee0a24;
}
.device-card__warnings {
  margin-top: 8px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.device-card__footer {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.footer-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #969799;
}
.pagination-wrapper {
  padding: 8px 16px 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}
.pagination-status {
  font-size: 13px;
  color: #646566;
  display: flex;
  align-items: center;
  gap: 6px;
}
.pagination-status span {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}
.footer-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.empty-state {
  padding: 48px 0;
}
.skeleton-wrapper {
  padding: 16px;
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
  margin-top: 4px;
  font-size: 12px;
  color: #969799;
}
.popup-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
.detail-section {
  margin-top: 16px;
}
.section-title {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #323233;
}
.filter-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.filter-card {
  width: 86px;
  padding: 12px;
  border-radius: 12px;
  background: #f5f6f7;
  text-align: center;
}
.filter-card__label {
  margin-bottom: 6px;
  font-size: 12px;
  color: #646566;
}
.panel-actions {
  margin: 16px 0;
}
.sync-tip {
  padding: 12px 16px 4px;
  font-size: 12px;
  color: #969799;
}
@media (max-width: 480px) {
  .summary-section {
    grid-template-columns: repeat(2, 1fr);
  }
  .footer-actions {
    justify-content: flex-start;
  }
}
</style>
