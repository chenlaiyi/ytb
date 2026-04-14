<template>
  <div class="merchant-list">
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filters" @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model.trim="filters.keyword"
            clearable
            placeholder="商户名称 / 法人 / 联系电话"
            @keyup.enter.native="handleSearch"
          />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-select v-model="filters.status" clearable placeholder="全部" style="width: 160px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="filters.audit_status" clearable placeholder="全部" style="width: 180px">
            <el-option label="全部" :value="''" />
            <el-option label="已通过" :value="1" />
            <el-option label="审核中" :value="3" />
            <el-option label="待审核" :value="2" />
            <el-option label="已拒绝" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="注册时间">
          <el-date-picker
            v-model="filters.dateRange"
            value-format="YYYY-MM-DD"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="table-header">
          <div>
            共 <strong>{{ pagination.total }}</strong> 个商户
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="list"
        border
        stripe
        empty-text="暂无商户数据"
      >
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column label="商户信息" min-width="220">
          <template #default="{ row }">
            <div class="merchant-info">
              <div class="merchant-name">
                <span>{{ row.mch_name || '—' }}</span>
                <el-tag v-if="row.mch_short_name" size="small" type="info">
                  {{ row.mch_short_name }}
                </el-tag>
              </div>
              <div class="merchant-id">商户号：{{ row.merchant_id || '—' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="180">
          <template #default="{ row }">
            <el-space wrap>
              <el-tag v-if="getMerchantStatusText(row)" :type="getMerchantStatusType(row)">
                {{ getMerchantStatusText(row) }}
              </el-tag>
              <el-tag v-if="getAuditStatusText(row)" :type="getAuditStatusType(row)">
                {{ getAuditStatusText(row) }}
              </el-tag>
            </el-space>
            <div v-if="row.audit_reason" class="status-reason">原因：{{ row.audit_reason }}</div>
          </template>
        </el-table-column>
        <el-table-column label="邀约信息" min-width="240">
          <template #default="{ row }">
            <div class="invite-info">
              <div class="invite-info-line">
                <span>邀请码：{{ getInviteCodeDisplay(row) }}</span>
                <el-tag
                  v-if="getInviteOwnerLabel(row)"
                  class="invite-source-tag"
                  size="small"
                  :type="getInviteOwnerTagType(row)"
                >
                  {{ getInviteOwnerLabel(row) }}
                </el-tag>
              </div>
              <span>业务员：{{ getInviteSalesmanDisplay(row) }}</span>
              <span>机构：{{ getInviteInstitutionDisplay(row) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="联系人" min-width="180">
          <template #default="{ row }">
            <div class="contact-info">
              <span>{{ row.contact_name || '—' }}</span>
              <span>{{ row.contact_phone || '—' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="地区" min-width="200">
          <template #default="{ row }">
            <div class="address-info">
              <span>{{ formatRegion(row) || formatPrimaryAddress(row) }}</span>
              <div v-if="formatAddressDetail(row)" class="address-detail">{{ formatAddressDetail(row) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.create_time) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <el-pagination
          v-if="pagination.total > 0"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          :page-size="pagination.per_page"
          :current-page="pagination.page"
          :page-sizes="[15, 30, 50, 80]"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-drawer
      v-model="detailDrawer.visible"
      :with-header="false"
      size="520px"
      destroy-on-close
    >
      <div v-if="detailDrawer.data" class="drawer-body">
        <div class="drawer-header">
          <h2>{{ detailDrawer.data.mch_name }}</h2>
          <el-tag size="small" :type="detailDrawer.data.audit_tag_type">
            {{ detailDrawer.data.audit_status_text }}
          </el-tag>
        </div>

        <el-descriptions :column="1" border size="small" title="基础信息">
          <el-descriptions-item label="商户编号">
            {{ detailDrawer.data.merchant_id || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="商户简称">
            {{ detailDrawer.data.mch_short_name || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="营业执照">
            {{ detailDrawer.data.business_license || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="法人代表">
            {{ detailDrawer.data.legal_person || '—' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-descriptions :column="1" border class="drawer-section" size="small" title="联系方式">
          <el-descriptions-item label="联系人">
            {{ detailDrawer.data.contact_name || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">
            {{ detailDrawer.data.contact_phone || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="联系邮箱">
            {{ detailDrawer.data.contact_email || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="地址">
            {{ detailDrawer.data.full_address || '—' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-descriptions :column="1" border class="drawer-section" size="small" title="邀约信息">
          <el-descriptions-item label="邀请码">
            <div class="invite-code-cell">
              <span>{{ getInviteCodeDisplay(detailDrawer.data) }}</span>
              <el-tag
                v-if="getInviteOwnerLabel(detailDrawer.data)"
                class="invite-source-tag"
                size="small"
                :type="getInviteOwnerTagType(detailDrawer.data)"
              >
                {{ getInviteOwnerLabel(detailDrawer.data) }}
              </el-tag>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="业务员">
            {{ getInviteSalesmanDisplay(detailDrawer.data) }}
          </el-descriptions-item>
          <el-descriptions-item label="所属机构">
            {{ getInviteInstitutionDisplay(detailDrawer.data) }}
          </el-descriptions-item>
        </el-descriptions>

        <el-descriptions :column="1" border class="drawer-section" size="small" title="时间信息">
          <el-descriptions-item label="注册时间">
            {{ formatDateTime(detailDrawer.data.create_time) }}
          </el-descriptions-item>
          <el-descriptions-item label="最后登录" v-if="detailDrawer.data.last_login_time">
            {{ formatDateTime(detailDrawer.data.last_login_time) }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="mediaSections.length" class="drawer-section media-section">
          <h3>附件资料</h3>
          <div
            v-for="section in mediaSections"
            :key="section.key"
            class="media-group"
          >
            <div class="media-title">{{ section.label }}</div>
            <div class="media-images">
              <el-image
                v-for="(url, index) in section.images"
                :key="index"
                :src="url"
                fit="cover"
                :preview-src-list="section.images"
              />
            </div>
          </div>
        </div>
      </div>
      <div v-else class="drawer-loading">
        <el-skeleton :rows="5" animated />
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import merchantApi from '@/api/v1/merchant'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const list = ref([])

const filters = reactive({
  keyword: '',
  status: '',
  audit_status: '',
  dateRange: []
})

const pagination = reactive({
  page: 1,
  per_page: 15,
  total: 0
})

const detailDrawer = reactive({
  visible: false,
  data: null,
  loading: false
})

const buildQuery = () => {
  const params = {
    page: pagination.page,
    per_page: pagination.per_page
  }

  if (filters.keyword) params.keyword = filters.keyword
  if (filters.status !== '' && filters.status !== null) params.status = filters.status
  if (filters.audit_status !== '' && filters.audit_status !== null) params.audit_status = filters.audit_status
  if (Array.isArray(filters.dateRange) && filters.dateRange.length === 2) {
    params.date_start = filters.dateRange[0]
    params.date_end = filters.dateRange[1]
  }

  return params
}

const fetchList = async () => {
  loading.value = true
  try {
    const response = await merchantApi.getList(buildQuery())
    if (response.code !== 0) {
      ElMessage.error(response.message || '获取商户列表失败')
      return
    }

    const pageData = response.data || {}
    list.value = Array.isArray(pageData.data) ? pageData.data : []
    pagination.total = pageData.total || 0
    pagination.per_page = pageData.per_page || pagination.per_page
    pagination.page = pageData.current_page || pagination.page
  } catch (error) {
    console.error('获取商户列表失败:', error)
    ElMessage.error(error?.response?.data?.message || error.message || '获取商户列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchList()
}

const handleReset = () => {
  filters.keyword = ''
  filters.status = ''
  filters.audit_status = ''
  filters.dateRange = []
  pagination.page = 1
  fetchList()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchList()
}

const handleSizeChange = (size) => {
  pagination.per_page = size
  pagination.page = 1
  fetchList()
}

const openDetail = async (row) => {
  detailDrawer.visible = true
  detailDrawer.loading = true
  try {
    const isDraftSource = (row?.record_source === 'draft') || Boolean(row?.is_draft)
    const response = await merchantApi.getDetail(row.id, { source: isDraftSource ? 'draft' : 'final' })
    if (response.code === 0) {
      detailDrawer.data = response.data
    } else {
      ElMessage.error(response.message || '获取商户详情失败')
    }
  } catch (error) {
    console.error('获取商户详情失败:', error)
    ElMessage.error(error?.response?.data?.message || error.message || '获取商户详情失败')
  } finally {
    detailDrawer.loading = false
  }
}

const formatDateTime = (value) => {
  if (!value) return '—'
  return value
}

const formatRegion = (row) => {
  if (!row) return ''
  const parts = [row.province, row.city, row.district]
    .map(part => (part ?? '').toString().trim())
    .filter(Boolean)
  return parts.join(' ')
}

const formatPrimaryAddress = (row) => {
  const region = formatRegion(row)
  if (region) return region
  return row.full_address || row.address || '—'
}

const formatAddressDetail = (row) => {
  const region = formatRegion(row)
  const detailCandidate = (row.full_address || row.address || '').toString().trim()
  if (!detailCandidate) return ''
  if (!region) return detailCandidate
  if (detailCandidate === region) return ''

  if (detailCandidate.startsWith(region)) {
    const extra = detailCandidate.slice(region.length).trim().replace(/^[,，\-]+/, '').trim()
    return extra
  }

  return detailCandidate
}

const INVITE_FALLBACK = '—'

const getInviteCodeDisplay = (row) => {
  if (!row) return INVITE_FALLBACK
  return row.Invitation_code || row.invitation_code || row.invite_code || INVITE_FALLBACK
}

const getInviteOwnerLabel = (row) => {
  if (!row) return ''
  if (row.invite_owner_label) return row.invite_owner_label
  if (row.invite_owner_type === 'institution') return '机构邀请码'
  if (row.invite_owner_type === 'salesman') return '业务员邀请码'
  return ''
}

const getInviteOwnerTagType = (row) => {
  if (!row || !row.invite_owner_type) return 'info'
  return row.invite_owner_type === 'institution' ? 'success' : 'info'
}

const getInviteSalesmanDisplay = (row) => {
  if (!row) return INVITE_FALLBACK
  const ownerType = row.invite_owner_type || ''
  const displayName = row.salesman_display_name || ''
  const ownerName = row.invite_owner_name || ''
  const salesmanName = row.salesman_name || ''
  const salesmanSerial = row.salesman_serial || ''
  const displaySerial = row.salesman_display_serial || ''
  const channelName = row.channel_name || ''
  const channelId = row.channel_id || ''
  const institutionName = row.invite_institution_name || ''

  if (ownerType === 'institution') {
    return displayName
      || institutionName
      || ownerName
      || channelName
      || channelId
      || displaySerial
      || INVITE_FALLBACK
  }

  return displayName
    || ownerName
    || salesmanName
    || displaySerial
    || salesmanSerial
    || channelName
    || channelId
    || institutionName
    || INVITE_FALLBACK
}

const getInviteInstitutionDisplay = (row) => {
  if (!row) return INVITE_FALLBACK
  const institutionName = row.invite_institution_name || ''
  const channelName = row.channel_name || ''
  const ownerName = row.invite_owner_name || ''
  const channelId = row.channel_id || ''
  const salesmanName = row.salesman_name || ''
  const salesmanSerial = row.salesman_serial || ''

  return institutionName
    || channelName
    || ownerName
    || channelId
    || salesmanName
    || salesmanSerial
    || INVITE_FALLBACK
}

const resolveStatusBasics = (row) => {
  const status = typeof row?.status === 'number' ? row.status : (typeof row?.status_raw === 'number' ? row.status_raw : null)
  return status
}

const getMerchantStatusText = (row) => {
  if (row?.status_text) return row.status_text
  const status = resolveStatusBasics(row)
  switch (status) {
    case 1:
      return '已入驻'
    case 0:
      return '未入驻'
    case 2:
      return '已停用'
    default:
      return ''
  }
}

const getMerchantStatusType = (row) => {
  if (row?.status_tag_type) return row.status_tag_type
  const status = resolveStatusBasics(row)
  switch (status) {
    case 1:
      return 'success'
    case 2:
      return 'danger'
    case 0:
      return 'warning'
    default:
      return 'info'
  }
}

const getAuditStatusText = (row) => {
  if (row?.audit_status_text) return row.audit_status_text
  const status = typeof row?.audit_status === 'number' ? row.audit_status : null
  switch (status) {
    case 1:
      return '已通过'
    case 2:
      return '已拒绝'
    case 3:
      return '审核中'
    case 0:
      return '待审核'
    default:
      return ''
  }
}

const getAuditStatusType = (row) => {
  if (row?.audit_tag_type) return row.audit_tag_type
  const status = typeof row?.audit_status === 'number' ? row.audit_status : null
  switch (status) {
    case 1:
      return 'success'
    case 2:
      return 'danger'
    case 3:
      return 'warning'
    case 0:
      return 'info'
    default:
      return 'info'
  }
}

const mediaSections = computed(() => {
  const assets = detailDrawer.data?.media_assets
  if (!assets) return []
  const map = [
    { key: 'identity', label: '身份证件' },
    { key: 'license', label: '营业执照' },
    { key: 'storefront', label: '门店照片' },
    { key: 'protocol', label: '协议材料' },
    { key: 'other', label: '其他附件' }
  ]

  return map
    .map(item => ({
      ...item,
      images: Array.isArray(assets[item.key]) ? assets[item.key] : []
    }))
    .filter(item => item.images.length > 0)
})

fetchList()
</script>

<style scoped>
.merchant-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

.filter-card {
  border-radius: 12px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-footer {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.merchant-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.merchant-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.merchant-id {
  font-size: 12px;
  color: #6b7280;
}

.contact-info,
.invite-info,
.address-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}

.invite-info {
  color: #6b7280;
}

.invite-info-line {
  display: flex;
  align-items: center;
  gap: 6px;
}

.invite-info-line span {
  color: #1f2937;
  font-weight: 600;
}

.invite-source-tag {
  font-size: 11px;
}

.invite-code-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.invite-code-cell span {
  font-weight: 600;
  color: #1f2937;
}

.address-detail,
.status-reason {
  font-size: 12px;
  color: #6b7280;
}

.media-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.media-section h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.media-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.media-title {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.media-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.media-images :deep(.el-image) {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
}

.drawer-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.drawer-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.drawer-section {
  margin-top: 12px;
}

.drawer-loading {
  padding: 24px;
}
</style>
