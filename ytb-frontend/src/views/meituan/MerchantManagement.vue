<template>
  <div class="meituan-merchant-page">
    <div class="content-container">
      <el-card shadow="hover" class="overview-card">
        <template #header>
          <div class="card-header">
            <span>商户概览</span>
            <el-button link type="primary" @click="loadSummary" :loading="loading.summary">
              刷新
            </el-button>
          </div>
        </template>
        <div class="summary-grid">
          <div
            v-for="item in summaryCards"
            :key="item.title"
            class="stat-card"
          >
            <div class="stat-title">{{ item.title }}</div>
            <div class="stat-value">{{ item.value }}</div>
            <div class="stat-extra">{{ item.extra }}</div>
          </div>
        </div>
      </el-card>

      <el-card shadow="hover" class="filter-card">
        <template #header>
          <div class="card-header">
            <span>筛选条件</span>
            <div class="card-actions">
              <el-button @click="resetFilters">重置</el-button>
              <el-button type="primary" @click="handleFilter" :loading="loading.table">查询</el-button>
            </div>
          </div>
        </template>
        <el-form :model="filters" label-width="96px" label-position="left" class="filter-form">
          <el-row :gutter="16">
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="关键字">
                <el-input v-model.trim="filters.keyword" placeholder="商户名 / 编号 / 门店POI" clearable />
              </el-form-item>
            </el-col>
            <el-col :xs="12" :sm="12" :md="6" :lg="4">
              <el-form-item label="所在城市">
                <el-input v-model.trim="filters.city" placeholder="所在城市" clearable />
              </el-form-item>
            </el-col>
            <el-col :xs="12" :sm="12" :md="6" :lg="4">
              <el-form-item label="直属上级">
                <el-input v-model.trim="filters.leader_account" placeholder="直属上级账号" clearable />
              </el-form-item>
            </el-col>
            <el-col :xs="12" :sm="12" :md="6" :lg="4">
              <el-form-item label="销售账号">
                <el-input v-model.trim="filters.salesperson_account" placeholder="销售人员账号" clearable />
              </el-form-item>
            </el-col>
            <el-col :xs="12" :sm="12" :md="6" :lg="4">
              <el-form-item label="经营品类">
                <el-input v-model.trim="filters.business_category" placeholder="经营品类" clearable />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="交易金额">
                <div class="range-box">
                  <el-input-number
                    v-model="filters.min_amount"
                    :min="0"
                    :precision="2"
                    placeholder="最小金额"
                    controls-position="right"
                  />
                  <span class="range-split">~</span>
                  <el-input-number
                    v-model="filters.max_amount"
                    :min="0"
                    :precision="2"
                    placeholder="最大金额"
                    controls-position="right"
                  />
                </div>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="交易日期">
                <el-date-picker
                  v-model="filters.dateRange"
                  type="daterange"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  unlink-panels
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-card>

      <el-card shadow="hover" class="table-card">
        <template #header>
          <div class="card-header">
            <span>商户列表</span>
            <el-select v-model="sort.field" class="sort-select" size="small" @change="handleSortChange">
              <el-option label="按总交易额" value="total_amount" />
              <el-option label="按净入账" value="net_amount" />
              <el-option label="按交易笔数" value="transaction_count" />
              <el-option label="按退款金额" value="refund_amount" />
              <el-option label="按最近交易时间" value="last_transaction_at" />
            </el-select>
            <el-segmented
              v-model="sort.order"
              :options="[
                { label: '降序', value: 'desc' },
                { label: '升序', value: 'asc' }
              ]"
              size="small"
              class="sort-order"
              @change="handleSortChange"
            />
          </div>
        </template>
        <el-table
          v-loading="loading.table"
          :data="merchants"
          border
          size="small"
          :default-sort="{ prop: sort.field, order: sort.order === 'desc' ? 'descending' : 'ascending' }"
        >
          <el-table-column prop="merchant_name" label="商户名称" min-width="180">
            <template #default="scope">
              <div class="merchant-cell">
                <div class="merchant-name">{{ scope.row.merchant_name || '—' }}</div>
                <div class="merchant-code">编号：{{ scope.row.merchant_code }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="store_poi" label="门店POI" min-width="160" show-overflow-tooltip />
          <el-table-column label="所在城市" min-width="160">
            <template #default="scope">
              {{ formatResidence(scope.row) }}
            </template>
          </el-table-column>
          <el-table-column label="销售人员" width="160">
            <template #default="scope">
              <div class="merchant-cell">
                <div>{{ scope.row.salesperson_name || '—' }}</div>
                <div class="muted-text">账号：{{ scope.row.salesperson_account || '--' }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="business_category" label="经营品类" width="140" show-overflow-tooltip />
          <el-table-column label="绑定终端" width="160">
            <template #default="scope">
              POS：{{ scope.row.pos_binding_count }} / 码牌：{{ scope.row.code_binding_count }}<br>
              音箱：{{ scope.row.speaker_binding_count }} / 扫码王：{{ scope.row.scanner_binding_count }}
            </template>
          </el-table-column>
          <el-table-column prop="transaction_count" label="交易笔数" width="120" />
          <el-table-column prop="total_amount" label="总金额(元)" width="140">
            <template #default="scope">{{ formatCurrency(scope.row.total_amount) }}</template>
          </el-table-column>
          <el-table-column prop="net_amount" label="净入账(元)" width="140">
            <template #default="scope">{{ formatCurrency(scope.row.net_amount) }}</template>
          </el-table-column>
          <el-table-column prop="refund_amount" label="退款(元)" width="140">
            <template #default="scope">{{ formatCurrency(scope.row.refund_amount) }}</template>
          </el-table-column>
          <el-table-column prop="active_days" label="活跃天数" width="120" />
          <el-table-column prop="last_transaction_at" label="最近交易日期" width="140" />
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="scope">
              <el-button type="primary" link @click="openDetail(scope.row)">查看</el-button>
              <el-divider direction="vertical" />
              <el-button type="primary" link @click="openEdit(scope.row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-bar">
          <el-pagination
            v-model:current-page="pagination.current"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            layout="prev, pager, next, ->, total"
            @current-change="handlePageChange"
            @size-change="handlePageSizeChange"
          />
        </div>
      </el-card>
      <el-dialog
        v-model="detailDialogVisible"
        title="商户详情"
        width="720px"
        destroy-on-close
        :close-on-click-modal="false"
      >
        <template #default>
          <el-skeleton v-if="detailLoading" :rows="6" animated />
          <div v-else-if="detailData" class="merchant-detail-dialog">
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="商户名称">{{ detailData.merchant_name || '—' }}</el-descriptions-item>
              <el-descriptions-item label="商户编号">{{ detailData.merchant_code || '—' }}</el-descriptions-item>
              <el-descriptions-item label="门店POI">{{ detailData.store_poi || '—' }}</el-descriptions-item>
              <el-descriptions-item label="所在城市">{{ formatResidence(detailData) }}</el-descriptions-item>
              <el-descriptions-item label="销售人员">
                <div class="merchant-cell">
                  <span>{{ detailData.salesperson_name || '—' }}</span>
                  <span class="muted-text">账号：{{ detailData.salesperson_account || '—' }}</span>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="直属上级">
                <div class="merchant-cell">
                  <span>{{ detailData.leader_name || '—' }}</span>
                  <span class="muted-text">账号：{{ detailData.leader_account || '—' }}</span>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="经营品类">{{ detailData.business_category || '—' }}</el-descriptions-item>
              <el-descriptions-item label="激活日期">{{ detailData.activation_date || '—' }}</el-descriptions-item>
            </el-descriptions>
            <el-divider />
            <div class="detail-metrics-grid">
              <div v-for="metric in detailMetrics" :key="metric.label" class="metric-item">
                <div class="metric-label">{{ metric.label }}</div>
                <div class="metric-value">{{ metric.value }}</div>
                <div v-if="metric.extra" class="metric-extra">{{ metric.extra }}</div>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无数据" />
        </template>
        <template #footer>
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </template>
      </el-dialog>

      <el-dialog
        v-model="editDialogVisible"
        title="编辑所在城市"
        width="520px"
        destroy-on-close
        :close-on-click-modal="false"
      >
        <el-form
          ref="editFormRef"
          :model="editForm"
          :rules="editRules"
          label-width="96px"
          class="edit-location-form"
        >
          <el-form-item label="商户名称">
            <div class="form-static">{{ editForm.merchant_name || '—' }}</div>
          </el-form-item>
          <el-form-item label="门店POI">
            <div class="form-static">{{ editForm.store_poi || '—' }}</div>
          </el-form-item>
          <el-form-item label="原合作城市">
            <div class="form-static">{{ editForm.city || '—' }}</div>
          </el-form-item>
          <el-form-item label="所在省份" prop="residence_province_code">
            <el-select
              v-model="locationSelection.provinceId"
              placeholder="请选择省份"
              filterable
              style="width: 100%;"
              :loading="locationLoading.provinces"
              @change="handleProvinceChange"
            >
              <el-option
                v-for="item in provinceOptions"
                :key="item.id"
                :label="item.fullname || item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="所在城市" prop="residence_city_code">
            <el-select
              v-model="locationSelection.cityId"
              placeholder="请选择城市"
              filterable
              style="width: 100%;"
              :disabled="!locationSelection.provinceId"
              :loading="locationLoading.cities"
              @change="handleCityChange"
            >
              <el-option
                v-for="item in cityOptions"
                :key="item.id"
                :label="item.fullname || item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="区县">
            <el-select
              v-model="locationSelection.districtId"
              placeholder="可选"
              clearable
              style="width: 100%;"
              :disabled="!locationSelection.cityId"
              :loading="locationLoading.districts"
              @change="handleDistrictChange"
            >
              <el-option
                v-for="item in districtOptions"
                :key="item.id"
                :label="item.fullname || item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="效果预览">
            <el-tag type="info">{{ formatResidence(editForm) }}</el-tag>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="editSaving" @click="submitEditForm">保存</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  fetchMeituanMerchantSummary,
  fetchMeituanMerchantList,
  fetchMeituanMerchantDetail,
  updateMeituanMerchantLocation
} from '@/api/v1/meituan'
import {
  fetchInstitutionProvinces,
  fetchInstitutionCities,
  fetchInstitutionDistricts
} from '@/api/v1/institution'

const loading = reactive({
  summary: false,
  table: false,
})

const summary = reactive({
  merchant_count: 0,
  total_amount: 0,
  net_amount: 0,
  refund_amount: 0,
  transaction_count: 0,
  active_days: 0,
})

const filters = reactive({
  keyword: '',
  city: '',
  leader_account: '',
  salesperson_account: '',
  business_category: '',
  min_amount: null,
  max_amount: null,
  dateRange: [],
})

const sort = reactive({
  field: 'total_amount',
  order: 'desc',
})

const merchants = ref([])
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
})

const detailDialogVisible = ref(false)
const detailLoading = ref(false)
const detailData = ref(null)

const editDialogVisible = ref(false)
const editSaving = ref(false)
const editFormRef = ref(null)

const getDefaultEditForm = () => ({
  merchant_code: '',
  store_poi: '',
  merchant_name: '',
  city: '',
  residence_province_code: '',
  residence_province: '',
  residence_city_code: '',
  residence_city: '',
  residence_district_code: '',
  residence_district: '',
  match_empty_store_poi: false,
})

const editForm = reactive(getDefaultEditForm())
const locationSelection = reactive({
  provinceId: '',
  cityId: '',
  districtId: '',
})

const editRules = {
  residence_province_code: [{ required: true, message: '请选择所在省份', trigger: 'change' }],
  residence_city_code: [{ required: true, message: '请选择所在城市', trigger: 'change' }],
}

const provinceOptions = ref([])
const cityOptions = ref([])
const districtOptions = ref([])
const locationLoading = reactive({
  provinces: false,
  cities: false,
  districts: false,
})

const summaryCards = computed(() => [
  {
    title: '商户数量',
    value: summary.merchant_count,
    extra: `覆盖 ${summary.active_days} 天`,
  },
  {
    title: '总交易金额(元)',
    value: formatCurrency(summary.total_amount),
    extra: `净入账 ¥${formatCurrency(summary.net_amount)}`,
  },
  {
    title: '交易笔数(笔)',
    value: summary.transaction_count,
    extra: `退款 ¥${formatCurrency(summary.refund_amount)}`,
  },
])

const normalizeRegionOptions = data => {
  return (data || []).map(item => ({
    id: `${item.id}`,
    fullname: item.fullname || item.name || item.label || '',
    name: item.name || item.fullname || item.label || '',
  }))
}

const detailMetrics = computed(() => {
  if (!detailData.value) return []
  const data = detailData.value
  return [
    {
      label: '总交易金额',
      value: `¥${formatCurrency(data.total_amount)}`,
      extra: `净入账 ¥${formatCurrency(data.net_amount)}`,
    },
    {
      label: '交易笔数',
      value: formatInteger(data.transaction_count),
      extra: `活跃天数 ${formatInteger(data.active_days)}`,
    },
    {
      label: '退款金额',
      value: `¥${formatCurrency(data.refund_amount)}`,
      extra: `退款笔数 ${formatInteger(data.refund_count)}`,
    },
    {
      label: '绑定终端',
      value: `POS ${formatInteger(data.pos_binding_count)} / 码牌 ${formatInteger(data.code_binding_count)}`,
      extra: `音箱 ${formatInteger(data.speaker_binding_count)} / 扫码王 ${formatInteger(data.scanner_binding_count)}`,
    },
    {
      label: '最近交易日',
      value: data.last_transaction_at || '—',
      extra: `首次签约 ${data.first_contract_date || '—'}`,
    },
  ]
})

const formatCurrency = value => {
  if (!value || Number.isNaN(+value)) return '0.00'
  return Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatInteger = value => {
  if (value === null || value === undefined || Number.isNaN(+value)) return '0'
  return Number(value).toLocaleString('zh-CN')
}

const formatResidence = (row = {}) => {
  const segments = [row.residence_province, row.residence_city, row.residence_district].filter(Boolean)
  if (segments.length > 0) {
    return segments.join(' / ')
  }
  if (row.city) {
    return row.city
  }
  return '—'
}

const buildQueryParams = () => {
  const params = {
    page: pagination.current,
    per_page: pagination.pageSize,
    sort_field: sort.field,
    sort_order: sort.order,
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (key === 'dateRange') {
      if (value?.length === 2) {
        params.date_start = value[0]
        params.date_end = value[1]
      }
      return
    }

    if (value !== null && value !== undefined && value !== '') {
      params[key] = value
    }
  })

  return params
}

const buildFilterOnlyParams = () => {
  const params = buildQueryParams()
  delete params.page
  delete params.per_page
  delete params.sort_field
  delete params.sort_order
  return params
}

const loadSummary = async () => {
  loading.summary = true
  try {
    const params = buildFilterOnlyParams()
    const response = await fetchMeituanMerchantSummary(params)
    if (response?.code !== 0) {
      throw new Error(response?.message || '获取概览失败')
    }
    Object.assign(summary, response.data || {})
  } catch (error) {
    ElMessage.error(error?.message || '获取概览失败')
  } finally {
    loading.summary = false
  }
}

const loadMerchants = async () => {
  loading.table = true
  try {
    const params = buildQueryParams()
    const response = await fetchMeituanMerchantList(params)
    if (response?.code !== 0) {
      throw new Error(response?.message || '获取商户列表失败')
    }
    const data = response.data || {}
    merchants.value = data.data || []
    pagination.total = data.total || 0
    pagination.pageSize = data.per_page || pagination.pageSize
  } catch (error) {
    ElMessage.error(error?.message || '获取商户列表失败')
  } finally {
    loading.table = false
  }
}

const handleFilter = () => {
  pagination.current = 1
  loadSummary()
  loadMerchants()
}

const resetFilters = () => {
  filters.keyword = ''
  filters.city = ''
  filters.leader_account = ''
  filters.salesperson_account = ''
  filters.business_category = ''
  filters.min_amount = null
  filters.max_amount = null
  filters.dateRange = []
}

const handleSortChange = () => {
  pagination.current = 1
  loadMerchants()
}

const handlePageChange = page => {
  pagination.current = page
  loadMerchants()
}

const handlePageSizeChange = size => {
  pagination.pageSize = size
  pagination.current = 1
  loadMerchants()
}

const ensureProvinces = async () => {
  if (provinceOptions.value.length > 0) return
  locationLoading.provinces = true
  try {
    const response = await fetchInstitutionProvinces()
    if (response?.code === 0) {
      provinceOptions.value = normalizeRegionOptions(response.data)
    }
  } catch (error) {
    console.error('加载省份数据失败', error)
  } finally {
    locationLoading.provinces = false
  }
}

const loadCitiesOptions = async provinceId => {
  if (!provinceId) {
    cityOptions.value = []
    return
  }
  locationLoading.cities = true
  try {
    const response = await fetchInstitutionCities(provinceId)
    cityOptions.value = response?.code === 0 ? normalizeRegionOptions(response.data) : []
  } catch (error) {
    console.error('加载城市数据失败', error)
    cityOptions.value = []
  } finally {
    locationLoading.cities = false
  }
}

const loadDistrictOptions = async cityId => {
  if (!cityId) {
    districtOptions.value = []
    return
  }
  locationLoading.districts = true
  try {
    const response = await fetchInstitutionDistricts(cityId)
    districtOptions.value = response?.code === 0 ? normalizeRegionOptions(response.data) : []
  } catch (error) {
    console.error('加载区县数据失败', error)
    districtOptions.value = []
  } finally {
    locationLoading.districts = false
  }
}

const handleProvinceChange = async value => {
  const normalizedValue = value ? String(value) : ''
  locationSelection.provinceId = normalizedValue
  const province = provinceOptions.value.find(item => item.id === normalizedValue)
  editForm.residence_province_code = normalizedValue
  editForm.residence_province = province?.fullname || province?.name || ''

  locationSelection.cityId = ''
  locationSelection.districtId = ''
  cityOptions.value = []
  districtOptions.value = []
  editForm.residence_city_code = ''
  editForm.residence_city = ''
  editForm.residence_district_code = ''
  editForm.residence_district = ''

  if (normalizedValue) {
    await loadCitiesOptions(normalizedValue)
  }

  editFormRef.value?.clearValidate(['residence_province_code', 'residence_city_code'])
}

const handleCityChange = async value => {
  const normalizedValue = value ? String(value) : ''
  locationSelection.cityId = normalizedValue
  const city = cityOptions.value.find(item => item.id === normalizedValue)
  editForm.residence_city_code = normalizedValue
  editForm.residence_city = city?.fullname || city?.name || ''

  locationSelection.districtId = ''
  districtOptions.value = []
  editForm.residence_district_code = ''
  editForm.residence_district = ''

  if (normalizedValue) {
    await loadDistrictOptions(normalizedValue)
  }

  editFormRef.value?.clearValidate(['residence_city_code'])
}

const handleDistrictChange = value => {
  const normalizedValue = value ? String(value) : ''
  locationSelection.districtId = normalizedValue
  const district = districtOptions.value.find(item => item.id === normalizedValue)
  editForm.residence_district_code = normalizedValue || ''
  editForm.residence_district = district?.fullname || district?.name || ''
}

const findOptionByName = (options, target) => {
  if (!target) return null
  return options.find(item => item.fullname === target || item.name === target) || null
}

const prefillLocationSelection = async () => {
  if (editForm.residence_province_code) {
    locationSelection.provinceId = `${editForm.residence_province_code}`
  } else if (editForm.residence_province) {
    const matchedProvince = findOptionByName(provinceOptions.value, editForm.residence_province)
    if (matchedProvince) {
      locationSelection.provinceId = matchedProvince.id
      editForm.residence_province_code = matchedProvince.id
    }
  }

  if (locationSelection.provinceId) {
    await loadCitiesOptions(locationSelection.provinceId)
  } else {
    cityOptions.value = []
  }

  if (editForm.residence_city_code) {
    locationSelection.cityId = `${editForm.residence_city_code}`
  } else if (editForm.residence_city) {
    const matchedCity = findOptionByName(cityOptions.value, editForm.residence_city)
    if (matchedCity) {
      locationSelection.cityId = matchedCity.id
      editForm.residence_city_code = matchedCity.id
      editForm.residence_city = matchedCity.fullname || matchedCity.name || editForm.residence_city
    }
  }

  if (locationSelection.cityId) {
    await loadDistrictOptions(locationSelection.cityId)
  } else {
    districtOptions.value = []
  }

  if (editForm.residence_district_code) {
    locationSelection.districtId = `${editForm.residence_district_code}`
  } else if (editForm.residence_district) {
    const matchedDistrict = findOptionByName(districtOptions.value, editForm.residence_district)
    if (matchedDistrict) {
      locationSelection.districtId = matchedDistrict.id
      editForm.residence_district_code = matchedDistrict.id
      editForm.residence_district = matchedDistrict.fullname || matchedDistrict.name || editForm.residence_district
    }
  }
}

const resetEditDialog = () => {
  editFormRef.value?.clearValidate()
  Object.assign(editForm, getDefaultEditForm())
  locationSelection.provinceId = ''
  locationSelection.cityId = ''
  locationSelection.districtId = ''
  cityOptions.value = []
  districtOptions.value = []
}

const openDetail = async row => {
  detailDialogVisible.value = true
  detailLoading.value = true
  detailData.value = null
  try {
    const params = buildFilterOnlyParams()
    params.store_poi = row.store_poi ?? ''
    if (row.store_poi_is_empty) {
      params.match_empty_store_poi = 1
    }
    const response = await fetchMeituanMerchantDetail(row.merchant_code, params)
    if (response?.code !== 0) {
      throw new Error(response?.message || '获取商户详情失败')
    }
    detailData.value = response.data || null
  } catch (error) {
    ElMessage.error(error?.message || '获取商户详情失败')
    detailDialogVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

const openEdit = async row => {
  await ensureProvinces()
  resetEditDialog()
  const storePoiIsEmpty = Boolean(row.store_poi_is_empty) || row.store_poi === null || row.store_poi === ''
  Object.assign(editForm, getDefaultEditForm(), {
    merchant_code: row.merchant_code,
    store_poi: row.store_poi ?? '',
    merchant_name: row.merchant_name,
    city: row.city,
    residence_province_code: row.residence_province_code || '',
    residence_province: row.residence_province || '',
    residence_city_code: row.residence_city_code || '',
    residence_city: row.residence_city || '',
    residence_district_code: row.residence_district_code || '',
    residence_district: row.residence_district || '',
    match_empty_store_poi: storePoiIsEmpty,
  })
  editDialogVisible.value = true
  await prefillLocationSelection()
}

const submitEditForm = () => {
  if (!editFormRef.value) return
  editFormRef.value.validate(async valid => {
    if (!valid) return
    editSaving.value = true
    try {
      const payload = {
        store_poi: editForm.store_poi,
        match_empty_store_poi: editForm.match_empty_store_poi ? 1 : 0,
        residence_province_code: editForm.residence_province_code || '',
        residence_province: editForm.residence_province || '',
        residence_city_code: editForm.residence_city_code || '',
        residence_city: editForm.residence_city || '',
        residence_district_code: editForm.residence_district_code || '',
        residence_district: editForm.residence_district || '',
      }
      const response = await updateMeituanMerchantLocation(editForm.merchant_code, payload)
      if (response?.code !== 0) {
        throw new Error(response?.message || '所在城市更新失败')
      }
      ElMessage.success('所在城市已更新')
      editDialogVisible.value = false
      await loadMerchants()
    } catch (error) {
      ElMessage.error(error?.message || '所在城市更新失败')
    } finally {
      editSaving.value = false
    }
  })
}

watch(editDialogVisible, visible => {
  if (!visible) {
    resetEditDialog()
  }
})

watch(detailDialogVisible, visible => {
  if (!visible) {
    detailData.value = null
    detailLoading.value = false
  }
})

onMounted(async () => {
  await Promise.all([ensureProvinces(), loadSummary(), loadMerchants()])
})
</script>

<style scoped>
.meituan-merchant-page {
  padding: 24px 0 48px;
  background: #f4f6fb;
  min-height: 100%;
}

.content-container {
  max-width: 1320px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.card-actions {
  margin-left: auto;
  display: flex;
  gap: 12px;
}

.overview-card {
  border: none;
  border-radius: 18px;
  padding-bottom: 4px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 18px;
  margin-top: 8px;
}

.stat-card {
  padding: 20px 22px;
  border-radius: 16px;
  background: linear-gradient(135deg, #f9fbff, #ffffff);
  border: 1px solid rgba(64, 158, 255, 0.1);
  box-shadow: 0 10px 30px rgba(64, 158, 255, 0.12);
  min-height: 140px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 35px rgba(64, 158, 255, 0.16);
}

.stat-title {
  color: #909399;
  font-size: 14px;
  margin-bottom: 18px;
  letter-spacing: 0.2px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1f2d3d;
  line-height: 1.2;
}

.stat-extra {
  margin-top: 14px;
  color: #67c23a;
  font-size: 13px;
}

.filter-card,
.table-card {
  border: none;
  border-radius: 14px;
}

.filter-form {
  padding-top: 8px;
}

.filter-form .el-input,
.filter-form .el-input-number,
.filter-form .el-select,
.filter-form .el-date-picker {
  width: 100%;
}

.range-box {
  display: flex;
  align-items: center;
  gap: 6px;
}

.merchant-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.merchant-name {
  font-weight: 600;
}

.merchant-code {
  font-size: 12px;
  color: #909399;
}

.muted-text {
  font-size: 12px;
  color: #a0a3a6;
}

.table-card .el-table {
  font-size: 13px;
}

.pagination-bar {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.range-split {
  padding: 0 4px;
  color: #909399;
}

.sort-select {
  margin-left: auto;
  width: 150px;
}

.sort-order {
  margin-left: 12px;
}

.merchant-detail-dialog {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.metric-item {
  padding: 12px 14px;
  border-radius: 10px;
  background: #f9fafc;
  border: 1px solid rgba(64, 158, 255, 0.15);
}

.metric-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 6px;
}

.metric-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.metric-extra {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.edit-location-form .el-form-item {
  margin-bottom: 16px;
}

.form-static {
  color: #606266;
}
</style>
