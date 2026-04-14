<template>
  <div class="meituan-institution-page">
    <el-card shadow="never" class="filter-card">
      <div v-if="summaryCards.length" class="summary-section">
        <el-row :gutter="16">
          <el-col
            v-for="item in summaryCards"
            :key="item.key"
            :xs="24"
            :sm="12"
            :md="6"
            :lg="6"
          >
            <el-card shadow="never" class="summary-card">
              <div class="summary-label">{{ item.label }}</div>
              <div class="summary-value">
                <span v-if="item.valuePrefix" class="summary-value-affix">{{ item.valuePrefix }}</span>
                {{ item.value }}
                <span v-if="item.valueSuffix" class="summary-value-affix">{{ item.valueSuffix }}</span>
              </div>
              <div
                v-if="item.subValue"
                :class="['summary-sub-value', { 'summary-sub-value--highlight': item.subHighlight }]"
              >
                {{ item.subValue }}
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <el-form :inline="true" :model="filters" @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model.trim="filters.keyword"
            clearable
            placeholder="机构名称 / 编号 / 手机号"
            @keyup.enter.native="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable placeholder="全部" style="width: 160px">
            <el-option
              v-for="item in STATUS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="美团上级">
          <el-select
            v-model="filters.parentId"
            clearable
            filterable
            remote
            reserve-keyword
            placeholder="全部"
            :remote-method="loadMeituanParentOptions"
            :loading="meituanParentLoading"
            style="width: 200px"
          >
            <el-option :value="0" label="顶级机构" />
            <el-option
              v-for="item in meituanParentOptions"
              :key="item.id"
              :label="`${item.id} - ${item.name || '未命名'}`"
              :value="item.id"
            />
          </el-select>
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
            共 <strong>{{ pagination.total }}</strong> 个美团机构
          </div>
          <div class="header-actions">
            <el-button type="primary" text @click="loadData">
              <el-icon><RefreshRight /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="list"
        border
        stripe
        @sort-change="handleSortChange"
        :default-sort="defaultSortOptions"
        empty-text="暂无美团机构"
      >
        <el-table-column label="ID" min-width="140">
          <template #default="{ row }">
            <div class="table-id-cell">
              <span class="table-id-primary">#{{ row.id }}</span>
              <span class="table-id-secondary">账户ID：{{ formatAccountId(row) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="机构信息" min-width="220">
          <template #default="{ row }">
            <div class="institution-info">
              <div class="name-line">
                <span class="institution-name">{{ row.nickname || row.name || '—' }}</span>
                <el-tag size="small" :type="getStatusTagType(row.status)" class="status-tag">
                  {{ row.status_text }}
                </el-tag>
              </div>
              <div class="meta-line">
                美团账号：{{ row.meituan_account || '—' }}
                <span v-if="row.number" class="meta-split">|</span>
                <span v-if="row.number">机构编号：{{ row.number }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="负责人" min-width="160">
          <template #default="{ row }">
            <div class="contact-info">
              <el-avatar
                :size="36"
                class="contact-avatar"
                :src="formatAvatar(row.responsible_avatar)"
              >
                {{ (row.name || row.nickname || '—').charAt(0) }}
              </el-avatar>
              <div class="contact-meta">
                <span class="contact-name">{{ row.name || '—' }}</span>
                <span class="contact-phone">{{ row.phone || '—' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="所在区域" min-width="220">
          <template #default="{ row }">
            <div class="address-info">
              <span>{{ formatAuthorizedRegion(row) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="美团等级" width="200" align="center">
          <template #default="{ row }">
            <div class="meituan-role-cell">
              <el-tag size="small" type="success">
                {{ row.meituan_role_text || '未设置' }}
              </el-tag>
              <div v-if="row.meituan_commission_rate" class="meituan-commission">分润：{{ row.meituan_commission_rate }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="服务包 / 合伙人" min-width="240">
          <template #default="{ row }">
            <template v-if="row.meituan_role === MEITUAN_ROLE_OPERATION_CENTER">
              <div>服务包：{{ row.meituan_service_package_count || 0 }}</div>
              <div v-if="row.meituan_partner_quota_total">
                合伙人：已用 {{ row.meituan_partner_quota_used || 0 }} / {{ row.meituan_partner_quota_total }}
                <span class="quota-remaining">（剩余 {{ row.meituan_partner_quota_remaining || 0 }}）</span>
              </div>
              <div v-else>合伙人名额未开通</div>
            </template>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="销售经理名额" min-width="240">
          <template #default="{ row }">
            <template v-if="row.meituan_role === MEITUAN_ROLE_OPERATION_CENTER">
              <div>
                销售经理：已用 {{ row.meituan_sales_quota_used || 0 }} / {{ row.meituan_sales_quota_total || 0 }}
                <span class="quota-remaining">（剩余 {{ row.meituan_sales_quota_remaining || 0 }}）</span>
              </div>
            </template>
            <template v-else-if="row.meituan_role === MEITUAN_ROLE_PARTNER">
              <div>服务包：{{ row.meituan_partner_package_count || 0 }}</div>
              <div>
                销售经理：已用 {{ row.meituan_sales_quota_used || 0 }} / {{ row.meituan_sales_quota_total || 0 }}
                <span class="quota-remaining">（剩余 {{ row.meituan_sales_quota_remaining || 0 }}）</span>
              </div>
            </template>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="美团上级" min-width="200">
          <template #default="{ row }">
            {{ formatMeituanParent(row) }}
          </template>
        </el-table-column>
        <el-table-column label="子机构" width="120" align="center">
          <template #default="{ row }">
            {{ row.meituan_children_count ?? 0 }}
          </template>
        </el-table-column>
        <el-table-column label="商户数" width="120" align="center">
          <template #default="{ row }">
            {{ formatInteger(row.meituan_merchant_total) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="meituan_total_sales_amount"
          label="销售业绩"
          min-width="200"
          align="right"
          sortable="custom"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <div class="metrics-cell">
              <div class="metrics-line">
                <span>本月团队</span>
                <strong>{{ formatCurrency(row.meituan_team_month_sales_amount || row.meituan_month_sales_amount) }}</strong>
              </div>
              <div
                v-if="showTeamDelta(row.meituan_month_sales_amount, row.meituan_team_month_sales_amount)"
                class="metrics-sub-line"
              >
                <span>直推</span>
                <strong>{{ formatCurrency(row.meituan_month_sales_amount) }}</strong>
              </div>
              <div class="metrics-line">
                <span>累计团队</span>
                <strong>{{ formatCurrency(row.meituan_team_total_sales_amount || row.meituan_total_sales_amount) }}</strong>
              </div>
              <div
                v-if="showTeamDelta(row.meituan_total_sales_amount, row.meituan_team_total_sales_amount)"
                class="metrics-sub-line"
              >
                <span>直推</span>
                <strong>{{ formatCurrency(row.meituan_total_sales_amount) }}</strong>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          label="分润"
          min-width="200"
          align="right"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <div class="metrics-cell">
              <div class="metrics-line">
                <span>本月合计</span>
                <strong>{{ formatCurrency(row.meituan_month_commission_amount) }}</strong>
              </div>
              <div class="metrics-sub-line">
                <span>直推</span>
                <strong>{{ formatCurrency(row.meituan_direct_month_commission_amount) }}</strong>
              </div>
              <div
                v-if="Number(row.meituan_difference_month_commission_amount || 0) !== 0"
                class="metrics-sub-line"
              >
                <span>差额</span>
                <strong>{{ formatCurrency(row.meituan_difference_month_commission_amount) }}</strong>
              </div>
              <div class="metrics-line">
                <span>累计合计</span>
                <strong>{{ formatCurrency(row.meituan_total_commission_amount) }}</strong>
              </div>
              <div class="metrics-sub-line">
                <span>直推</span>
                <strong>{{ formatCurrency(row.meituan_direct_commission_amount) }}</strong>
              </div>
              <div
                v-if="Number(row.meituan_difference_total_commission_amount || 0) !== 0"
                class="metrics-sub-line"
              >
                <span>差额</span>
                <strong>{{ formatCurrency(row.meituan_difference_total_commission_amount) }}</strong>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          label="钱包余额"
          min-width="200"
          align="right"
        >
          <template #default="{ row }">
            <div v-if="row.meituan_wallet" class="metrics-cell">
              <div class="metrics-line">
                <span>可用</span>
                <strong>{{ formatCurrency(row.meituan_wallet.available) }}</strong>
              </div>
              <div class="metrics-sub-line">
                <span>冻结</span>
                <strong>{{ formatCurrency(row.meituan_wallet.frozen) }}</strong>
              </div>
              <div class="metrics-sub-line">
                <span>待审核提现</span>
                <strong>{{ formatCurrency(row.meituan_wallet.pending_withdraw_amount) }}</strong>
              </div>
            </div>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="created_at" min-width="160" />
        <el-table-column label="更新时间" prop="updated_at" min-width="160" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-space wrap>
              <el-button type="primary" text size="small" @click="openCreatePartnerDialog(row)">
                新建伙伴
              </el-button>
              <el-button type="primary" text size="small" @click="openEditDialog(row)">编辑</el-button>
              <el-button type="primary" text size="small" @click="goDetail(row)">详情</el-button>
              <el-popconfirm
                v-if="row.is_meituan"
                title="确认关闭该机构的美团业务？"
                confirm-button-text="确认"
                cancel-button-text="取消"
                @confirm="handleMeituanToggle(row, false)"
              >
                <template #reference>
                  <el-button type="danger" text size="small">关闭美团</el-button>
                </template>
              </el-popconfirm>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <el-pagination
          v-if="pagination.total > 0"
          background
          layout="prev, pager, next, jumper, ->, total"
          :total="pagination.total"
          :page-size="pagination.perPage"
          :current-page="pagination.page"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
    <el-dialog
      v-model="editDialog.visible"
      title="编辑美团设置"
      width="420px"
      destroy-on-close
    >
      <template #header>
        <div class="edit-dialog-header">
          <div class="edit-dialog-target">
            <el-avatar :size="44" :src="editDialog.meta.avatar">
              {{ (editDialog.meta.name || '—').charAt(0) }}
            </el-avatar>
            <div class="edit-dialog-meta">
              <div class="edit-dialog-name">{{ editDialog.meta.name || '未命名机构' }}</div>
              <div class="edit-dialog-number" v-if="editDialog.meta.account">美团账号：{{ editDialog.meta.account }}</div>
              <div class="edit-dialog-number" v-else-if="editDialog.meta.number">编号：{{ editDialog.meta.number }}</div>
            </div>
          </div>
        </div>
      </template>
      <el-form :model="editDialog.form" label-width="120px">
        <el-form-item label="美团账号">
          <el-input
            v-model.trim="editDialog.form.meituan_account"
            maxlength="100"
            placeholder="请输入美团账号"
          />
        </el-form-item>
        <el-form-item label="美团上级">
          <el-select
            v-model="editDialog.form.meituan_parent_id"
            filterable
            remote
            clearable
            reserve-keyword
            placeholder="顶级机构"
            :remote-method="loadMeituanParentOptions"
            :loading="meituanParentLoading"
            style="width: 100%"
          >
            <el-option :value="0" label="顶级机构" />
            <el-option
              v-for="item in meituanParentOptions"
              :key="item.id"
              :label="`${item.id} - ${item.name || '未命名'}`"
              :value="item.id"
            >
              <div class="meituan-parent-option">
                <el-avatar :size="28" :src="item.avatar" class="meituan-parent-avatar">
                  {{ (item.name || '未命名').charAt(0) }}
                </el-avatar>
                <div class="meituan-parent-meta">
                  <div class="meituan-parent-name">{{ item.name || '未命名' }}</div>
                  <div class="meituan-parent-desc">
                    ID: {{ item.id }}{{ item.number ? ` ｜ 编号：${item.number}` : '' }}
                    <span v-if="item.meituan_region_text"> ｜ {{ item.meituan_region_text }}</span>
                  </div>
                </div>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="所在区域">
          <div class="region-selects">
            <el-select
              v-model="editDialog.form.meituan_province_id"
              placeholder="省份"
              clearable
              filterable
              :loading="provinceLoading"
              @visible-change="visible => visible && ensureProvinceOptionsLoaded()"
              @change="handleProvinceChange"
              style="flex: 1"
            >
              <el-option
                v-for="item in provinceOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
            <el-select
              v-model="editDialog.form.meituan_city_id"
              placeholder="城市"
              clearable
              filterable
              :loading="cityLoading"
              :disabled="!editDialog.form.meituan_province_id"
              @change="handleCityChange"
              style="flex: 1"
            >
              <el-option
                v-for="item in cityOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
            <el-select
              v-model="editDialog.form.meituan_district_id"
              placeholder="区县"
              clearable
              filterable
              :loading="districtLoading"
              :disabled="!editDialog.form.meituan_city_id"
              style="flex: 1"
            >
              <el-option
                v-for="item in districtOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="美团等级" required>
          <el-select v-model="editDialog.form.meituan_role" placeholder="请选择等级">
            <el-option
              v-for="item in MEITUAN_ROLE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="分润档位" required>
          <el-select v-model="editDialog.form.meituan_commission_rate" placeholder="请选择分润档位">
            <el-option
              v-for="item in MEITUAN_COMMISSION_OPTIONS"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="isOperationCenterRole" label="运营中心服务包">
          <div class="package-input">
            <el-input-number
              v-model="editDialog.form.meituan_service_package_count"
              :min="1"
              :step="1"
              controls-position="right"
            />
            <div class="package-hint">每份包含20个合伙人名额，售价19800元，由总部收取</div>
          </div>
        </el-form-item>
        <el-form-item v-if="isPartnerRole" label="合伙人服务包">
          <div class="package-input">
            <el-input-number
              v-model="editDialog.form.meituan_partner_package_count"
              :min="0"
              :step="1"
              controls-position="right"
            />
            <div class="package-hint">基础含30个销售经理名额，每新增1份增加30个名额，售价3980元</div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="editDialog.loading" @click="submitEditDialog">
          保存
        </el-button>
      </template>
    </el-dialog>
    <el-dialog
      v-model="createPartnerDialog.visible"
      :title="createPartnerDialogTitle"
      width="520px"
      destroy-on-close
    >
      <div v-if="createPartnerDialog.stage === 'select'">
        <div class="create-partner-target" v-if="createPartnerDialog.target">
          <div class="target-name">{{ getTargetName(createPartnerDialog.target) }}</div>
          <div class="target-meta">当前等级：{{ getTargetRoleText(createPartnerDialog.target) }}</div>
          <div class="target-meta">
            合伙人名额：{{ describePartnerQuota(createPartnerDialog.target) }} ｜ 销售经理名额：{{ describeSalesQuota(createPartnerDialog.target) }}
          </div>
        </div>
        <div class="create-partner-options">
          <div
            class="create-partner-card"
            :class="{ disabled: !canCreatePartner(createPartnerDialog.target) }"
            @click="canCreatePartner(createPartnerDialog.target) && handleSelectCreatePartner('partner')"
          >
            <div class="card-title">新建合伙人</div>
            <div class="card-desc">适用于运营中心新增合伙人，享受运营中心服务包内的分润待遇（档位以机构设置为准）。</div>
          <div class="card-quota">名额：{{ describePartnerQuota(createPartnerDialog.target) }}</div>
            <div class="card-actions">
              <el-button
                type="primary"
                size="small"
                :disabled="!canCreatePartner(createPartnerDialog.target)"
                @click.stop="handleSelectCreatePartner('partner')"
              >
                选择
              </el-button>
            </div>
          </div>
          <div
            class="create-partner-card"
            :class="{ disabled: !canCreateSalesman(createPartnerDialog.target) }"
            @click="canCreateSalesman(createPartnerDialog.target) && handleSelectCreatePartner('salesman')"
          >
            <div class="card-title">新建销售经理</div>
            <div class="card-desc">适用于运营中心或合伙人直接发展销售经理，绑定销售团队额度。</div>
          <div class="card-quota">名额：{{ describeSalesQuota(createPartnerDialog.target) }}</div>
            <div class="card-actions">
              <el-button
                type="primary"
                size="small"
                :disabled="!canCreateSalesman(createPartnerDialog.target)"
                @click.stop="handleSelectCreatePartner('salesman')"
              >
                选择
              </el-button>
            </div>
          </div>
        </div>
      </div>
      <div v-else>
        <div class="create-partner-target" v-if="createPartnerDialog.target">
          <div class="target-name">{{ getTargetName(createPartnerDialog.target) }}</div>
          <div class="target-meta">当前等级：{{ getTargetRoleText(createPartnerDialog.target) }}</div>
        </div>
        <el-form
          v-if="createPartnerDialog.type === 'partner'"
          ref="partnerFormRef"
          :model="partnerForm"
          :rules="partnerFormRules"
          label-width="100px"
        >
          <el-form-item label="机构名称" prop="nickname">
            <el-input
              v-model.trim="partnerForm.nickname"
              maxlength="50"
              placeholder="请输入合伙人机构名称"
            />
          </el-form-item>
          <el-form-item label="负责人姓名" prop="name">
            <el-input
              v-model.trim="partnerForm.name"
              maxlength="50"
              placeholder="请输入负责人姓名"
            />
          </el-form-item>
          <el-form-item label="联系方式" prop="phone">
            <el-input
              v-model.trim="partnerForm.phone"
              maxlength="20"
              placeholder="请输入联系方式（选填）"
            />
          </el-form-item>
          <div class="create-partner-tip">提示：创建成功后将占用运营中心服务包中的合伙人名额。</div>
        </el-form>
        <el-form
          v-else
          ref="salesmanFormRef"
          :model="salesmanForm"
          :rules="salesmanFormRules"
          label-width="100px"
        >
          <el-form-item label="团队名称" prop="nickname">
            <el-input
              v-model.trim="salesmanForm.nickname"
              maxlength="50"
              placeholder="请输入团队名称"
            />
          </el-form-item>
          <el-form-item label="销售姓名" prop="name">
            <el-input
              v-model.trim="salesmanForm.name"
              maxlength="50"
              placeholder="请输入销售经理姓名"
            />
          </el-form-item>
          <el-form-item label="联系方式" prop="phone">
            <el-input
              v-model.trim="salesmanForm.phone"
              maxlength="20"
              placeholder="请输入联系方式（选填）"
            />
          </el-form-item>
          <div class="create-partner-tip">
            提示：创建成功后将占用
            {{ createPartnerDialog.target?.meituan_role === MEITUAN_ROLE_OPERATION_CENTER ? '运营中心' : '合伙人' }}
            的销售经理名额。
          </div>
        </el-form>
      </div>
      <template #footer>
        <template v-if="createPartnerDialog.stage === 'select'">
          <el-button @click="createPartnerDialog.visible = false">关闭</el-button>
        </template>
        <template v-else>
          <el-button @click="handleCreatePartnerBack" :disabled="createPartnerLoading">返回</el-button>
          <el-button type="primary" :loading="createPartnerLoading" @click="submitCreatePartner">
            确认创建
          </el-button>
        </template>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { RefreshRight } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import {
  fetchInstitutions,
  createInstitution,
  toggleInstitutionMeituan,
  fetchInstitutionParentOptions,
  updateInstitutionMeituanSettings,
  fetchInstitutionProvinces,
  fetchInstitutionCities,
  fetchInstitutionDistricts
} from '@/api/v1/institution'

const STATUS_OPTIONS = [
  { label: '已认证', value: 1 },
  { label: '待审核', value: 0 },
  { label: '审核未通过', value: 2 }
]

const router = useRouter()

const createEmptyOverview = () => ({
  total_institutions: 0,
  sales_total_amount: 0,
  sales_month_amount: 0,
  net_total_amount: 0,
  net_month_amount: 0,
  refund_total_amount: 0,
  refund_month_amount: 0,
  commission_total_amount: 0,
  commission_month_amount: 0,
  merchant_total: 0
})

const loading = ref(false)
const tableRef = ref(null)
const list = ref([])
const summary = ref({ meituan_overview: createEmptyOverview() })

const pagination = reactive({
  page: 1,
  perPage: 15,
  total: 0
})

const filters = reactive({
  keyword: '',
  status: '',
  parentId: ''
})

const sortState = reactive({
  field: '',
  order: ''
})

const defaultSortOptions = {
  prop: '',
  order: ''
}

const meituanLoading = reactive({})
const meituanParentOptions = ref([])
const meituanParentLoading = ref(false)
const provinceOptions = ref([])
const cityOptions = ref([])
const districtOptions = ref([])
const provinceLoading = ref(false)
const cityLoading = ref(false)
const districtLoading = ref(false)

const MEITUAN_ROLE_OPTIONS = [
  { label: '运营总部', value: 1 },
  { label: '运营中心', value: 2 },
  { label: '合伙人', value: 3 },
  { label: '销售经理', value: 4 }
]

const MEITUAN_ROLE_OPERATION_CENTER = 2
const MEITUAN_ROLE_PARTNER = 3
const MEITUAN_ROLE_SALESMAN = 4

const MEITUAN_COMMISSION_OPTIONS = ['万8', '万9', '万10', '万11', '万12', '万13', '万14']

const SORT_FIELD_MAP = {
  meituan_total_sales_amount: 'meituan_sales_amount'
}

const DEFAULT_SORT_PROP = 'meituan_total_sales_amount'
const DEFAULT_SORT_ORDER = 'descending'
const DEFAULT_SORT_FIELD = SORT_FIELD_MAP[DEFAULT_SORT_PROP] || DEFAULT_SORT_PROP

sortState.field = DEFAULT_SORT_FIELD
sortState.order = DEFAULT_SORT_ORDER === 'ascending' ? 'asc' : 'desc'
defaultSortOptions.prop = DEFAULT_SORT_PROP
defaultSortOptions.order = DEFAULT_SORT_ORDER

const createPartnerDialog = reactive({
  visible: false,
  stage: 'select',
  type: null,
  target: null
})

const partnerFormRef = ref()
const salesmanFormRef = ref()
const partnerForm = reactive({
  nickname: '',
  name: '',
  phone: ''
})
const salesmanForm = reactive({
  nickname: '',
  name: '',
  phone: ''
})

const partnerFormRules = {
  nickname: [{ required: true, message: '请输入合伙人机构名称', trigger: 'blur' }],
  name: [{ required: true, message: '请输入负责人姓名', trigger: 'blur' }],
  phone: [{ max: 20, message: '联系方式长度不能超过20', trigger: 'blur' }]
}

const salesmanFormRules = {
  nickname: [{ required: true, message: '请输入团队名称', trigger: 'blur' }],
  name: [{ required: true, message: '请输入销售经理姓名', trigger: 'blur' }],
  phone: [{ max: 20, message: '联系方式长度不能超过20', trigger: 'blur' }]
}

const createPartnerLoading = ref(false)

const normalizeRegionId = (value) => {
  const normalized = value === null || value === undefined ? '' : String(value).trim()
  if (!normalized || normalized === '0' || normalized.toLowerCase() === 'null') {
    return '0'
  }
  return normalized
}

const toFormRegionValue = (value) => {
  const normalized = normalizeRegionId(value)
  return normalized === '0' ? '' : normalized
}

const toPayloadRegionValue = (value) => {
  const normalized = value === null || value === undefined ? '' : String(value).trim()
  return normalized ? normalized : '0'
}

const buildRegionText = (provinceName, cityName, districtName) => {
  const segments = [provinceName, cityName, districtName].filter(Boolean)
  return segments.length > 0 ? segments.join(' / ') : ''
}

const editDialog = reactive({
  visible: false,
  loading: false,
  id: null,
  meta: {
    name: '',
    number: '',
    account: '',
    avatar: ''
  },
  inheritOnParentChange: false,
  form: {
    meituan_role: 1,
    meituan_commission_rate: '万8',
    meituan_parent_id: 0,
    meituan_account: '',
    meituan_province_id: '',
    meituan_city_id: '',
    meituan_district_id: '',
    meituan_service_package_count: 0,
    meituan_partner_package_count: 0
  }
})

const isOperationCenterRole = computed(() => editDialog.form.meituan_role === MEITUAN_ROLE_OPERATION_CENTER)
const isPartnerRole = computed(() => editDialog.form.meituan_role === MEITUAN_ROLE_PARTNER)

const createPartnerDialogTitle = computed(() => {
  if (createPartnerDialog.stage === 'select') {
    return '新建伙伴'
  }
  return createPartnerDialog.type === 'partner' ? '新建合伙人' : '新建销售经理'
})

watch(
  () => editDialog.form.meituan_role,
  (role) => {
    if (role === MEITUAN_ROLE_OPERATION_CENTER) {
      if (!editDialog.form.meituan_service_package_count || editDialog.form.meituan_service_package_count < 1) {
        editDialog.form.meituan_service_package_count = 1
      }
      editDialog.form.meituan_partner_package_count = 0
    } else if (role === MEITUAN_ROLE_PARTNER) {
      if (editDialog.form.meituan_partner_package_count < 0) {
        editDialog.form.meituan_partner_package_count = 0
      }
      editDialog.form.meituan_service_package_count = 0
    } else {
      editDialog.form.meituan_service_package_count = 0
      editDialog.form.meituan_partner_package_count = 0
    }
  }
)

const getTargetName = (row) => {
  if (!row) return '—'
  return row.nickname || row.name || '—'
}

const getTargetRoleText = (row) => {
  if (!row) return '—'
  return row.meituan_role_text || '未设置'
}

const canCreatePartner = (row) => {
  if (!row) return false
  if (Number(row.meituan_role) !== MEITUAN_ROLE_OPERATION_CENTER) {
    return false
  }
  return Number(row.meituan_partner_quota_remaining ?? 0) > 0
}

const canCreateSalesman = (row) => {
  if (!row) return false
  if (![MEITUAN_ROLE_OPERATION_CENTER, MEITUAN_ROLE_PARTNER].includes(Number(row.meituan_role))) {
    return false
  }
  return Number(row.meituan_sales_quota_remaining ?? 0) > 0
}

const getPartnerQuotaStats = (row) => {
  const total = Math.max(0, Number(row?.meituan_partner_quota_total ?? 0))
  const remainingRaw = Math.max(0, Number(row?.meituan_partner_quota_remaining ?? 0))
  const remaining = Math.min(total, remainingRaw)
  const used = Math.max(0, total - remaining)
  return { total, remaining, used }
}

const getSalesQuotaStats = (row) => {
  const total = Math.max(0, Number(row?.meituan_sales_quota_total ?? 0))
  const remainingRaw = Math.max(0, Number(row?.meituan_sales_quota_remaining ?? 0))
  const remaining = Math.min(total, remainingRaw)
  const used = Math.max(0, total - remaining)
  return { total, remaining, used }
}

const describePartnerQuota = (row) => {
  const { total, remaining, used } = getPartnerQuotaStats(row)
  if (total <= 0) {
    return '未开通'
  }
  return `已用 ${used} / ${total}（剩余 ${remaining}）`
}

const describeSalesQuota = (row) => {
  const { total, remaining, used } = getSalesQuotaStats(row)
  if (total <= 0) {
    return '未开通'
  }
  return `已用 ${used} / ${total}（剩余 ${remaining}）`
}

const openCreatePartnerDialog = (row) => {
  if (!row?.id) {
    ElMessage.error('未找到机构信息')
    return
  }
  createPartnerDialog.target = row
  createPartnerDialog.stage = 'select'
  createPartnerDialog.type = null
  createPartnerDialog.visible = true
  partnerForm.nickname = ''
  partnerForm.name = ''
  partnerForm.phone = ''
  salesmanForm.nickname = ''
  salesmanForm.name = ''
  salesmanForm.phone = ''
  nextTick(() => {
    if (partnerFormRef.value) {
      partnerFormRef.value.clearValidate()
    }
    if (salesmanFormRef.value) {
      salesmanFormRef.value.clearValidate()
    }
  })
}

const handleSelectCreatePartner = async (type) => {
  const target = createPartnerDialog.target
  if (!target) {
    return
  }
  if (type === 'partner' && !canCreatePartner(target)) {
    ElMessage.warning('当前运营中心暂无可用合伙人名额')
    return
  }
  if (type === 'salesman' && !canCreateSalesman(target)) {
    ElMessage.warning('当前机构暂无可用销售经理名额')
    return
  }
  createPartnerDialog.type = type
  createPartnerDialog.stage = 'form'
  partnerForm.nickname = ''
  partnerForm.name = ''
  partnerForm.phone = ''
  salesmanForm.nickname = ''
  salesmanForm.name = ''
  salesmanForm.phone = ''
  await nextTick()
  if (type === 'partner' && partnerFormRef.value) {
    partnerFormRef.value.clearValidate()
  }
  if (type === 'salesman' && salesmanFormRef.value) {
    salesmanFormRef.value.clearValidate()
  }
}

const handleCreatePartnerBack = () => {
  createPartnerDialog.stage = 'select'
  createPartnerDialog.type = null
  if (partnerFormRef.value) {
    partnerFormRef.value.clearValidate()
  }
  if (salesmanFormRef.value) {
    salesmanFormRef.value.clearValidate()
  }
}

const buildCreatePartnerPayload = (type, target) => {
  const form = type === 'partner' ? partnerForm : salesmanForm
  const payload = {
    nickname: form.nickname.trim(),
    name: form.name.trim(),
    status: 1,
    is_meituan: true,
    meituan_parent_id: Number(target.id) || 0,
    meituan_role: type === 'partner' ? MEITUAN_ROLE_PARTNER : MEITUAN_ROLE_SALESMAN,
    meituan_commission_rate: type === 'partner' ? '万12' : ''
  }

  const phone = form.phone.trim()
  if (phone) {
    payload.phone = phone
  }

  payload.meituan_province_id = toPayloadRegionValue(target.meituan_province_id)
  payload.meituan_city_id = toPayloadRegionValue(target.meituan_city_id)
  payload.meituan_district_id = toPayloadRegionValue(target.meituan_district_id)

  if (target.provincial) {
    payload.province_id = String(target.provincial)
  }
  if (target.city) {
    payload.city_id = String(target.city)
  }
  if (target.distinguish) {
    payload.district_id = String(target.distinguish)
  }

  return payload
}

const submitCreatePartner = async () => {
  if (createPartnerDialog.stage !== 'form') {
    return
  }
  const target = createPartnerDialog.target
  const type = createPartnerDialog.type
  if (!target || !type) {
    ElMessage.error('未找到有效的机构信息')
    return
  }
  const formRef = type === 'partner' ? partnerFormRef.value : salesmanFormRef.value
  if (!formRef) {
    return
  }
  try {
    await formRef.validate()
  } catch (error) {
    return
  }

  const payload = buildCreatePartnerPayload(type, target)
  if (type === 'partner' && !canCreatePartner(target)) {
    ElMessage.warning('当前运营中心暂无可用合伙人名额')
    return
  }
  if (type === 'salesman' && !canCreateSalesman(target)) {
    ElMessage.warning('当前机构暂无可用销售经理名额')
    return
  }
  createPartnerLoading.value = true
  try {
    const { code, data, message } = await createInstitution(payload)
    if (code === 0 && data) {
      ElMessage.success(type === 'partner' ? '合伙人创建成功' : '销售经理创建成功')
      createPartnerDialog.visible = false
      await loadData()
    } else {
      ElMessage.error(message || '创建失败')
    }
  } catch (error) {
    console.error('create partner failed', error)
    ElMessage.error(error.response?.data?.message || error.message || '创建失败')
  } finally {
    createPartnerLoading.value = false
  }
}

watch(
  () => createPartnerDialog.visible,
  (visible) => {
    if (!visible) {
      createPartnerDialog.stage = 'select'
      createPartnerDialog.type = null
      createPartnerDialog.target = null
      nextTick(() => {
        if (partnerFormRef.value) {
          partnerFormRef.value.clearValidate()
        }
        if (salesmanFormRef.value) {
          salesmanFormRef.value.clearValidate()
        }
      })
    }
  }
)

watch(
  () => salesmanForm.name,
  (value) => {
    if (
      createPartnerDialog.stage === 'form' &&
      createPartnerDialog.type === 'salesman' &&
      !salesmanForm.nickname &&
      value
    ) {
      salesmanForm.nickname = value
    }
  }
)

const getStatusTagType = (status) => {
  if (status === 1) return 'success'
  if (status === 2) return 'danger'
  return 'warning'
}

const formatAuthorizedRegion = (row) => {
  if (!row) return '—'

  const regionText = row.meituan_region_text || buildRegionText(
    row.meituan_province_name,
    row.meituan_city_name,
    row.meituan_district_name
  )

  if (regionText) {
    return regionText
  }

  const fallback = [row.province_name, row.city_name, row.district_name].filter(Boolean)
  if (fallback.length > 0) {
    return fallback.join(' / ')
  }

  return '—'
}

const MEITUAN_PARENT_ROLE_WHITELIST = ['运营总部', '运营中心', '合伙人', '销售经理']

const resolveMeituanParentRole = (source) => {
  if (!source) {
    return ''
  }
  const candidate =
    source.meituan_role_text ??
    source.role_text ??
    source.roleText ??
    source.role ??
    source.level_text ??
    source.level_name ??
    ''
  const normalized = typeof candidate === 'string' ? candidate.trim() : String(candidate || '').trim()
  if (!normalized) {
    return ''
  }
  const matched = MEITUAN_PARENT_ROLE_WHITELIST.find(role => normalized.includes(role))
  return matched || normalized
}

const formatParentNameWithRole = (source) => {
  if (!source) {
    return '—'
  }
  const name = source.name || source.nickname || source.contact_name || '未命名'
  const role = resolveMeituanParentRole(source)
  return role ? `${name}（${role}）` : name
}

const formatMeituanParent = (row) => {
  if (!row?.is_meituan) {
    return '—'
  }
  if (row.meituan_parent && row.meituan_parent.id) {
    return formatParentNameWithRole(row.meituan_parent)
  }
  if (row.meituan_parent_id) {
    return `未知（ID：${row.meituan_parent_id}）`
  }
  return '顶级机构'
}

const applyMeituanMeta = (row, payload) => {
  if (!row || !payload) return
  const info = payload.meituan || {}
  row.is_meituan = !!payload.is_meituan
  row.meituan_level = payload.meituan_level ?? info.level ?? 0
  row.meituan_parent_id = payload.meituan_parent_id ?? info.parent_id ?? 0
  row.meituan_parent = info.parent ? decorateMeituanOption(info.parent) : null
  row.meituan_children_count = info.children_count ?? payload.meituan_children_count ?? 0
  row.meituan_role = info.role ?? payload.meituan_role ?? 0
  row.meituan_role_text = info.role_text ?? payload.meituan_role_text ?? ''
  row.meituan_commission_rate = info.commission_rate ?? payload.meituan_commission_rate ?? ''
  row.meituan_account = info.account ?? payload.meituan_account ?? row.meituan_account ?? ''
  row.meituan_service_package_count = Number(payload.meituan_service_package_count ?? info.service_package_count ?? row.meituan_service_package_count ?? 0)
  row.meituan_partner_package_count = Number(payload.meituan_partner_package_count ?? info.partner_package_count ?? row.meituan_partner_package_count ?? 0)
  const partnerQuota = info.partner_quota || {}
  row.meituan_partner_quota_total = Number(payload.meituan_partner_quota_total ?? partnerQuota.total ?? row.meituan_partner_quota_total ?? 0)
  row.meituan_partner_quota_used = Number(payload.meituan_partner_quota_used ?? partnerQuota.used ?? row.meituan_partner_quota_used ?? 0)
  row.meituan_partner_quota_remaining = Number(payload.meituan_partner_quota_remaining ?? partnerQuota.remaining ?? row.meituan_partner_quota_remaining ?? 0)
  const salesQuota = info.sales_quota || {}
  row.meituan_sales_quota_total = Number(payload.meituan_sales_quota_total ?? salesQuota.total ?? row.meituan_sales_quota_total ?? 0)
  row.meituan_sales_quota_used = Number(payload.meituan_sales_quota_used ?? salesQuota.used ?? row.meituan_sales_quota_used ?? 0)
  row.meituan_sales_quota_remaining = Number(payload.meituan_sales_quota_remaining ?? salesQuota.remaining ?? row.meituan_sales_quota_remaining ?? 0)
  row.meituan_sales_quota_scope = payload.meituan_sales_quota_scope ?? salesQuota.scope ?? row.meituan_sales_quota_scope ?? null
  const region = info.region || {}
  const provinceId = normalizeRegionId(region.province_id ?? payload.meituan_province_id ?? row.meituan_province_id ?? '0')
  const cityId = normalizeRegionId(region.city_id ?? payload.meituan_city_id ?? row.meituan_city_id ?? '0')
  const districtId = normalizeRegionId(region.district_id ?? payload.meituan_district_id ?? row.meituan_district_id ?? '0')
  const provinceName = region.province_name ?? payload.meituan_province_name ?? row.meituan_province_name ?? null
  const cityName = region.city_name ?? payload.meituan_city_name ?? row.meituan_city_name ?? null
  const districtName = region.district_name ?? payload.meituan_district_name ?? row.meituan_district_name ?? null
  row.meituan_province_id = provinceId
  row.meituan_city_id = cityId
  row.meituan_district_id = districtId
  row.meituan_province_name = provinceName
  row.meituan_city_name = cityName
  row.meituan_district_name = districtName
  row.meituan_region_text = region.text ?? payload.meituan_region_text ?? buildRegionText(provinceName, cityName, districtName)
}

const restoreMeituanMeta = (row, backup) => {
  if (!row || !backup) return
  row.is_meituan = backup.is_meituan
  row.meituan_level = backup.meituan_level
  row.meituan_parent_id = backup.meituan_parent_id
  row.meituan_parent = backup.meituan_parent
  row.meituan_children_count = backup.meituan_children_count
  row.meituan_role = backup.meituan_role
  row.meituan_role_text = backup.meituan_role_text
  row.meituan_commission_rate = backup.meituan_commission_rate
  row.meituan_account = backup.meituan_account
  row.meituan_province_id = backup.meituan_province_id
  row.meituan_city_id = backup.meituan_city_id
  row.meituan_district_id = backup.meituan_district_id
  row.meituan_province_name = backup.meituan_province_name
  row.meituan_city_name = backup.meituan_city_name
  row.meituan_district_name = backup.meituan_district_name
  row.meituan_region_text = backup.meituan_region_text
  row.meituan_service_package_count = backup.meituan_service_package_count ?? 0
  row.meituan_partner_package_count = backup.meituan_partner_package_count ?? 0
  row.meituan_partner_quota_total = backup.meituan_partner_quota_total ?? 0
  row.meituan_partner_quota_used = backup.meituan_partner_quota_used ?? 0
  row.meituan_partner_quota_remaining = backup.meituan_partner_quota_remaining ?? 0
  row.meituan_sales_quota_total = backup.meituan_sales_quota_total ?? 0
  row.meituan_sales_quota_used = backup.meituan_sales_quota_used ?? 0
  row.meituan_sales_quota_remaining = backup.meituan_sales_quota_remaining ?? 0
  row.meituan_sales_quota_scope = backup.meituan_sales_quota_scope ?? null
}

const formatAvatar = (value) => {
  if (!value) return ''
  const normalized = String(value).trim()
  if (!normalized) return ''
  if (/^data:/i.test(normalized)) {
    return normalized
  }
  if (/^https?:\/\//i.test(normalized)) {
    return normalized
  }
  if (normalized.startsWith('//')) {
    return `https:${normalized}`
  }
  if (normalized.startsWith('/')) {
    return normalized
  }
  return `/${normalized}`
}

const formatAmount = (value) => {
  if (value === null || value === undefined || value === '') return '0.00'
  const number = Number(value || 0)
  if (Number.isNaN(number)) {
    return '0.00'
  }
  return number.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatCurrency = (value) => `¥${formatAmount(value)}`

const hasPositiveDelta = (teamValue, directValue) => {
  const team = Number(teamValue || 0)
  const direct = Number(directValue || 0)
  return team - direct > 0.0001
}

const showTeamDelta = (directValue, teamValue) => hasPositiveDelta(teamValue, directValue)

const formatInteger = (value) => {
  const number = Number(value || 0)
  if (Number.isNaN(number)) {
    return '0'
  }
  return number.toLocaleString('zh-CN')
}

const formatAccountId = (row) => {
  if (!row) {
    return '—'
  }
  if (row.account_id) {
    return row.account_id
  }
  if (row.account && row.account.id) {
    return row.account.id
  }
  return '—'
}

const summaryCards = computed(() => {
  const overview = summary.value?.meituan_overview ?? createEmptyOverview()
  const totalSales = Number(overview.sales_total_amount ?? 0)
  const monthSales = Number(overview.sales_month_amount ?? 0)
  const totalNet = Number(overview.net_total_amount ?? totalSales)
  const monthNet = Number(overview.net_month_amount ?? monthSales)
  const refundTotal = Number(overview.refund_total_amount ?? 0)
  const refundMonth = Number(overview.refund_month_amount ?? 0)
  const refundDisplay = refundMonth > 0 ? refundMonth : refundTotal
  const totalCommission = Number(overview.commission_total_amount ?? 0)
  const monthCommission = Number(overview.commission_month_amount ?? 0)
  return [
    {
      key: 'institutions',
      label: '美团机构总数',
      value: formatInteger(overview.total_institutions ?? 0)
    },
    {
      key: 'sales',
      label: '交易净额',
      value: formatAmount(totalNet),
      subValue: `本月净额 ${formatAmount(monthNet)} | 退款 ${formatAmount(refundDisplay)}`,
      subHighlight: monthNet > 0 || refundDisplay > 0
    },
    {
      key: 'commission',
      label: '分润总额',
      value: formatAmount(totalCommission),
      subValue: `本月 ${formatAmount(monthCommission)}`,
      subHighlight: monthCommission > 0
    },
    {
      key: 'merchants',
      label: '商户总数',
      value: formatInteger(overview.merchant_total ?? 0)
    }
  ]
})

const decorateMeituanOption = (item) => {
  if (!item) return null
  const provinceId = normalizeRegionId(item.meituan_province_id)
  const cityId = normalizeRegionId(item.meituan_city_id)
  const districtId = normalizeRegionId(item.meituan_district_id)
  const regionText = item.meituan_region_text || buildRegionText(item.meituan_province_name, item.meituan_city_name, item.meituan_district_name)
  return {
    ...item,
    avatar: formatAvatar(item.avatar),
    meituan_province_id: provinceId,
    meituan_city_id: cityId,
    meituan_district_id: districtId,
    meituan_province_name: item.meituan_province_name ?? null,
    meituan_city_name: item.meituan_city_name ?? null,
    meituan_district_name: item.meituan_district_name ?? null,
    meituan_region_text: regionText
  }
}

const buildQueryParams = () => {
  const params = {
    page: pagination.page,
    per_page: pagination.perPage,
    is_meituan: 1
  }
  if (filters.keyword) params.keyword = filters.keyword
  if (filters.status !== '' && filters.status !== null) params.status = filters.status
  if (filters.parentId !== '' && filters.parentId !== null) params.meituan_parent_id = filters.parentId
  if (sortState.field && sortState.order) {
    params.sort_field = sortState.field
    params.sort_order = sortState.order
  }
  return params
}

const ensureProvinceOptionsLoaded = async () => {
  if (provinceOptions.value.length > 0 || provinceLoading.value) return
  provinceLoading.value = true
  try {
    const { code, data, message } = await fetchInstitutionProvinces()
    if (code === 0 && Array.isArray(data)) {
      provinceOptions.value = data.map(item => ({
        ...item,
        id: String(item.id)
      }))
    } else {
      ElMessage.error(message || '获取省份列表失败')
    }
  } catch (error) {
    console.error('获取省份列表失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '获取省份列表失败')
  } finally {
    provinceLoading.value = false
  }
}

const loadCityOptionsByProvince = async (provinceId, preset = null) => {
  if (!provinceId) {
    cityOptions.value = []
    districtOptions.value = []
    editDialog.form.meituan_city_id = ''
    editDialog.form.meituan_district_id = ''
    return
  }
  cityLoading.value = true
  try {
    const { code, data, message } = await fetchInstitutionCities(provinceId)
    if (code === 0 && Array.isArray(data)) {
      cityOptions.value = data.map(item => ({
        ...item,
        id: String(item.id)
      }))
      const presetValue = preset != null ? toFormRegionValue(preset) : ''
      if (presetValue && cityOptions.value.some(item => item.id === presetValue)) {
        editDialog.form.meituan_city_id = presetValue
        await loadDistrictOptionsByCity(presetValue, editDialog.form.meituan_district_id)
      } else {
        editDialog.form.meituan_city_id = ''
        editDialog.form.meituan_district_id = ''
        districtOptions.value = []
      }
    } else {
      ElMessage.error(message || '获取城市列表失败')
    }
  } catch (error) {
    console.error('获取城市列表失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '获取城市列表失败')
  } finally {
    cityLoading.value = false
  }
}

const loadDistrictOptionsByCity = async (cityId, preset = null) => {
  if (!cityId) {
    districtOptions.value = []
    editDialog.form.meituan_district_id = ''
    return
  }
  districtLoading.value = true
  try {
    const { code, data, message } = await fetchInstitutionDistricts(cityId)
    if (code === 0 && Array.isArray(data)) {
      districtOptions.value = data.map(item => ({
        ...item,
        id: String(item.id)
      }))
      const presetValue = preset != null ? toFormRegionValue(preset) : ''
      if (presetValue && districtOptions.value.some(item => item.id === presetValue)) {
        editDialog.form.meituan_district_id = presetValue
      } else {
        editDialog.form.meituan_district_id = ''
      }
    } else {
      ElMessage.error(message || '获取区县列表失败')
    }
  } catch (error) {
    console.error('获取区县列表失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '获取区县列表失败')
  } finally {
    districtLoading.value = false
  }
}

const handleProvinceChange = async (value) => {
  editDialog.form.meituan_city_id = ''
  editDialog.form.meituan_district_id = ''
  if (!value) {
    cityOptions.value = []
    districtOptions.value = []
    return
  }
  await loadCityOptionsByProvince(value)
}

const handleCityChange = async (value) => {
  editDialog.form.meituan_district_id = ''
  if (!value) {
    districtOptions.value = []
    return
  }
  await loadDistrictOptionsByCity(value)
}

const applyRegionFromParent = async (parentOption) => {
  if (!parentOption) return
  await ensureProvinceOptionsLoaded()
  const provinceId = toFormRegionValue(parentOption.meituan_province_id)
  editDialog.form.meituan_province_id = provinceId
  if (provinceId) {
    await loadCityOptionsByProvince(provinceId, parentOption.meituan_city_id ?? null)
    const cityId = toFormRegionValue(parentOption.meituan_city_id)
    if (cityId) {
      await loadDistrictOptionsByCity(cityId, parentOption.meituan_district_id ?? null)
    } else {
      districtOptions.value = []
      editDialog.form.meituan_district_id = ''
    }
  } else {
    cityOptions.value = []
    districtOptions.value = []
    editDialog.form.meituan_city_id = ''
    editDialog.form.meituan_district_id = ''
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const { code, data, message } = await fetchInstitutions(buildQueryParams())
    if (code === 0 && data) {
      const nextSummary = { ...data.summary }
      if (!nextSummary.meituan_overview) {
        nextSummary.meituan_overview = createEmptyOverview()
      } else {
        nextSummary.meituan_overview = {
          ...createEmptyOverview(),
          ...nextSummary.meituan_overview
        }
      }
      summary.value = nextSummary
      list.value = (data.items || []).map(item => ({
        ...item,
        is_meituan: !!item.is_meituan,
        meituan_children_count: item.meituan_children_count ?? 0,
        meituan_level: item.meituan_level ?? 0,
        meituan_total_sales_amount: Number(item.meituan_total_sales_amount ?? 0),
        meituan_net_sales_amount: Number(item.meituan_net_sales_amount ?? 0),
        meituan_month_sales_amount: Number(item.meituan_month_sales_amount ?? 0),
        meituan_team_total_sales_amount: Number(item.meituan_team_total_sales_amount ?? item.meituan_total_sales_amount ?? 0),
        meituan_team_month_sales_amount: Number(item.meituan_team_month_sales_amount ?? item.meituan_month_sales_amount ?? 0),
        meituan_team_net_sales_amount: Number(item.meituan_team_net_sales_amount ?? item.meituan_net_sales_amount ?? 0),
        meituan_direct_total_sales_amount: Number(item.meituan_direct_total_sales_amount ?? item.meituan_total_sales_amount ?? 0),
        meituan_direct_month_sales_amount: Number(item.meituan_direct_month_sales_amount ?? item.meituan_month_sales_amount ?? 0),
        meituan_total_commission_amount: Number(item.meituan_total_commission_amount ?? 0),
        meituan_month_commission_amount: Number(item.meituan_month_commission_amount ?? 0),
        meituan_direct_commission_amount: Number(item.meituan_direct_commission_amount ?? item.meituan_total_commission_amount ?? 0),
        meituan_direct_month_commission_amount: Number(item.meituan_direct_month_commission_amount ?? item.meituan_month_commission_amount ?? 0),
        meituan_difference_total_commission_amount: Number(item.meituan_difference_total_commission_amount ?? 0),
        meituan_difference_month_commission_amount: Number(item.meituan_difference_month_commission_amount ?? 0),
        meituan_merchant_total: Number(item.meituan_merchant_total ?? 0),
        meituan_service_package_count: Number(item.meituan_service_package_count ?? 0),
        meituan_partner_package_count: Number(item.meituan_partner_package_count ?? 0),
        meituan_partner_quota_total: Number(item.meituan_partner_quota_total ?? 0),
        meituan_partner_quota_used: Number(item.meituan_partner_quota_used ?? 0),
        meituan_partner_quota_remaining: Number(item.meituan_partner_quota_remaining ?? 0),
        meituan_sales_quota_total: Number(item.meituan_sales_quota_total ?? 0),
        meituan_sales_quota_used: Number(item.meituan_sales_quota_used ?? 0),
        meituan_sales_quota_remaining: Number(item.meituan_sales_quota_remaining ?? 0),
        meituan_sales_quota_scope: item.meituan_sales_quota_scope ?? null,
        meituan_parent_id: item.meituan_parent_id ?? 0,
        meituan_parent: item.meituan_parent ? decorateMeituanOption(item.meituan_parent) : null,
        meituan_role: item.meituan_role ?? 0,
        meituan_role_text: item.meituan_role_text ?? '',
        meituan_commission_rate: item.meituan_commission_rate ?? '',
        meituan_commission_rate_value: Number(item.meituan_commission_rate_value ?? 0),
        meituan_account: item.meituan_account ?? '',
        meituan_province_id: normalizeRegionId(item.meituan_province_id),
        meituan_city_id: normalizeRegionId(item.meituan_city_id),
        meituan_district_id: normalizeRegionId(item.meituan_district_id),
        meituan_province_name: item.meituan_province_name ?? null,
        meituan_city_name: item.meituan_city_name ?? null,
        meituan_district_name: item.meituan_district_name ?? null,
        meituan_region_text: item.meituan_region_text ?? buildRegionText(
          item.meituan_province_name,
          item.meituan_city_name,
          item.meituan_district_name
        )
      }))
      pagination.total = data.pagination?.total || 0
      pagination.page = data.pagination?.page || pagination.page
      pagination.perPage = data.pagination?.per_page || pagination.perPage
    } else {
      ElMessage.error(message || '获取美团机构失败')
    }
  } catch (error) {
    console.error('获取美团机构失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '获取美团机构失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  filters.keyword = ''
  filters.status = ''
  filters.parentId = ''
  pagination.page = 1
  sortState.field = DEFAULT_SORT_FIELD
  sortState.order = DEFAULT_SORT_ORDER === 'ascending' ? 'asc' : 'desc'
  if (tableRef.value) {
    nextTick(() => {
      tableRef.value?.sort(DEFAULT_SORT_PROP, DEFAULT_SORT_ORDER)
    })
  } else {
    loadData()
  }
}

const handlePageChange = (page) => {
  pagination.page = page
  loadData()
}

const handleSortChange = ({ prop, order }) => {
  const mappedField = SORT_FIELD_MAP[prop] || ''
  if (!order || !mappedField) {
    if (sortState.field !== DEFAULT_SORT_FIELD || sortState.order !== (DEFAULT_SORT_ORDER === 'ascending' ? 'asc' : 'desc')) {
      sortState.field = DEFAULT_SORT_FIELD
      sortState.order = DEFAULT_SORT_ORDER === 'ascending' ? 'asc' : 'desc'
      pagination.page = 1
      if (tableRef.value && prop !== DEFAULT_SORT_PROP) {
        nextTick(() => {
          tableRef.value?.sort(DEFAULT_SORT_PROP, DEFAULT_SORT_ORDER)
        })
      } else {
        loadData()
      }
    }
    return
  }

  sortState.field = mappedField
  sortState.order = order === 'ascending' ? 'asc' : 'desc'
  pagination.page = 1
  loadData()
}

const handleMeituanToggle = async (row, value) => {
  if (!row?.id) return

  meituanLoading[row.id] = true
  const previousMeta = {
    is_meituan: row.is_meituan,
    meituan_level: row.meituan_level,
    meituan_parent_id: row.meituan_parent_id,
    meituan_parent: row.meituan_parent,
    meituan_children_count: row.meituan_children_count,
    meituan_role: row.meituan_role,
    meituan_role_text: row.meituan_role_text,
    meituan_commission_rate: row.meituan_commission_rate,
    meituan_account: row.meituan_account,
    meituan_province_id: row.meituan_province_id,
    meituan_city_id: row.meituan_city_id,
    meituan_district_id: row.meituan_district_id,
    meituan_province_name: row.meituan_province_name,
    meituan_city_name: row.meituan_city_name,
    meituan_district_name: row.meituan_district_name,
    meituan_region_text: row.meituan_region_text
  }

  row.is_meituan = value

  try {
    const { code, data, message } = await toggleInstitutionMeituan(row.id, value)
    if (code === 0 && data) {
      applyMeituanMeta(row, data)
      if (!row.is_meituan) {
        await loadData()
      }
    } else {
      restoreMeituanMeta(row, previousMeta)
      ElMessage.error(message || '更新美团业务标记失败')
    }
  } catch (error) {
    console.error('更新美团业务标记失败:', error)
    restoreMeituanMeta(row, previousMeta)
    ElMessage.error(error.response?.data?.message || error.message || '更新美团业务标记失败')
  } finally {
    meituanLoading[row.id] = false
  }
}

const loadMeituanParentOptions = async (query) => {
  if (!query) {
    meituanParentOptions.value = []
    return
  }

  meituanParentLoading.value = true
  try {
    const { code, data, message } = await fetchInstitutionParentOptions({ keyword: query, is_meituan: 1 })
    if (code === 0 && Array.isArray(data)) {
      meituanParentOptions.value = data.map(decorateMeituanOption)
    } else {
      ElMessage.error(message || '获取美团上级失败')
    }
  } catch (error) {
    console.error('获取美团上级失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '获取美团上级失败')
  } finally {
    meituanParentLoading.value = false
  }
}

const openEditDialog = async (row) => {
  if (!row?.id) return

  editDialog.id = row.id
  editDialog.meta.name = row.nickname || row.name || ''
  editDialog.meta.number = row.number || ''
  editDialog.meta.account = row.meituan_account || ''
  editDialog.meta.avatar = formatAvatar(row.responsible_avatar || row.avatar)
  editDialog.form.meituan_role = row.meituan_role && MEITUAN_ROLE_OPTIONS.some(item => item.value === row.meituan_role)
    ? row.meituan_role
    : MEITUAN_ROLE_OPTIONS[0].value
  editDialog.form.meituan_commission_rate = row.meituan_commission_rate && MEITUAN_COMMISSION_OPTIONS.includes(row.meituan_commission_rate)
    ? row.meituan_commission_rate
    : MEITUAN_COMMISSION_OPTIONS[0]
  editDialog.form.meituan_parent_id = row.meituan_parent?.id ?? row.meituan_parent_id ?? 0
  editDialog.form.meituan_account = row.meituan_account || ''
  editDialog.form.meituan_service_package_count = Number(row.meituan_service_package_count ?? 0)
  editDialog.form.meituan_partner_package_count = Number(row.meituan_partner_package_count ?? 0)
  editDialog.inheritOnParentChange = false
  await ensureProvinceOptionsLoaded()
  const provinceValue = toFormRegionValue(row.meituan_province_id)
  editDialog.form.meituan_province_id = provinceValue
  if (provinceValue) {
    await loadCityOptionsByProvince(provinceValue, row.meituan_city_id ?? null)
    const cityValue = toFormRegionValue(row.meituan_city_id)
    editDialog.form.meituan_city_id = cityValue
    if (cityValue) {
      await loadDistrictOptionsByCity(cityValue, row.meituan_district_id ?? null)
    } else {
      districtOptions.value = []
      editDialog.form.meituan_district_id = ''
    }
  } else {
    cityOptions.value = []
    districtOptions.value = []
    editDialog.form.meituan_city_id = ''
    editDialog.form.meituan_district_id = ''
  }

  if (editDialog.form.meituan_parent_id) {
    const parentPayload = row.meituan_parent ? { ...row.meituan_parent } : {}
    const decorated = decorateMeituanOption({
      ...parentPayload,
      id: editDialog.form.meituan_parent_id
    })
    meituanParentOptions.value = decorated ? [decorated] : []
  } else {
    meituanParentOptions.value = []
  }

  editDialog.visible = true
  editDialog.inheritOnParentChange = true
}

const submitEditDialog = async () => {
  if (!editDialog.id) return

  editDialog.loading = true
  try {
    const payload = {
      meituan_role: editDialog.form.meituan_role,
      meituan_commission_rate: editDialog.form.meituan_commission_rate,
      meituan_parent_id: editDialog.form.meituan_parent_id || 0,
      meituan_account: editDialog.form.meituan_account || '',
      meituan_service_package_count: Number(editDialog.form.meituan_service_package_count || 0),
      meituan_partner_package_count: Number(editDialog.form.meituan_partner_package_count || 0),
      meituan_province_id: toPayloadRegionValue(editDialog.form.meituan_province_id),
      meituan_city_id: toPayloadRegionValue(editDialog.form.meituan_city_id),
      meituan_district_id: toPayloadRegionValue(editDialog.form.meituan_district_id)
    }
    const { code, data, message } = await updateInstitutionMeituanSettings(editDialog.id, payload)
    if (code === 0 && data) {
      const target = list.value.find(item => item.id === editDialog.id)
      if (target) {
        applyMeituanMeta(target, data)
      }
      ElMessage.success('美团设置已更新')
      editDialog.visible = false
      await loadData()
    } else {
      ElMessage.error(message || '更新美团设置失败')
    }
  } catch (error) {
    console.error('更新美团设置失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '更新美团设置失败')
  } finally {
    editDialog.loading = false
  }
}

const goDetail = (row) => {
  if (!row?.id) return
  router.push({ name: 'InstitutionMeituanDetail', params: { id: row.id } })
}

onMounted(() => {
  loadData()
})

watch(() => filters.parentId, (value) => {
  if (value === '') {
    meituanParentOptions.value = []
  }
})

watch(
  () => editDialog.form.meituan_parent_id,
  async (value) => {
    if (!editDialog.visible || !editDialog.inheritOnParentChange) {
      return
    }
    if (!value || value === 0) {
      return
    }
    const target = meituanParentOptions.value.find(item => item.id === value)
    if (target) {
      await applyRegionFromParent(target)
    }
  }
)
</script>

<style scoped lang="scss">
.meituan-institution-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-card {
  .el-form-item {
    margin-bottom: 12px;
  }
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meituan-column-info {
  margin-top: 8px;
  line-height: 1.4;
  color: #909399;
  font-size: 12px;
}

.meituan-parent-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 0;
}

.meituan-parent-avatar {
  background-color: #f4f4f5;
  color: #606266;
}

.meituan-parent-meta {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  line-height: 1.3;
}

.meituan-parent-name {
  font-weight: 600;
  color: #303133;
}

.meituan-parent-desc {
  color: #909399;
}

.edit-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0 4px;
}

.edit-dialog-target {
  display: flex;
  align-items: center;
  gap: 12px;
}

.edit-dialog-meta {
  display: flex;
  flex-direction: column;
  line-height: 1.4;
}

.edit-dialog-name {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.edit-dialog-number {
  color: #909399;
  font-size: 12px;
}

.meituan-role-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.meituan-commission {
  font-size: 12px;
  color: #909399;
}

.package-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.package-hint {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.create-partner-target {
  margin-bottom: 16px;
  padding: 12px;
  background: #f7f8fa;
  border-radius: 8px;
}

.create-partner-target .target-name {
  font-weight: 600;
  color: #303133;
}

.create-partner-target .target-meta {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.create-partner-options {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.create-partner-card {
  flex: 1;
  min-width: 220px;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fff;
}

.create-partner-card:hover {
  border-color: #409eff;
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.12);
}

.create-partner-card.disabled {
  cursor: not-allowed;
  opacity: 0.6;
  border-color: #ebeef5;
  box-shadow: none;
}

.create-partner-card .card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
}

.create-partner-card .card-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 10px;
}

.create-partner-card .card-quota {
  font-size: 12px;
  color: #909399;
  margin-bottom: 12px;
}

.create-partner-card .card-actions {
  display: flex;
  justify-content: flex-end;
}

.create-partner-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.quota-remaining {
  font-size: 12px;
  color: #67c23a;
  margin-left: 4px;
}

.region-selects {
  display: flex;
  gap: 8px;
}

.region-selects .el-select {
  flex: 1;
}

.institution-info {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .name-line {
    display: flex;
    align-items: center;
    gap: 8px;

    .institution-name {
      font-weight: 600;
      font-size: 15px;
    }
  }

.meta-line {
  color: #909399;
  font-size: 13px;
}

.meta-split {
  margin: 0 6px;
  color: #dcdfe6;
}
}

.contact-info {
  display: flex;
  align-items: center;
  gap: 10px;

  .contact-avatar {
    background-color: #f0f2f5;
    color: #606266;
  }

  .contact-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    line-height: 1.2;

    .contact-name {
      font-weight: 500;
      color: #303133;
    }

    .contact-phone {
      color: #909399;
      font-size: 12px;
    }
  }
}

.address-info {
  color: #606266;
  font-size: 13px;
}

.table-id-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.2;
  gap: 2px;
}

.table-id-primary {
  font-weight: 600;
  color: #303133;
}

.table-id-secondary {
  font-size: 12px;
  color: #909399;
}

.table-footer {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.summary-section {
  margin-bottom: 20px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 110px;
  justify-content: center;
  padding: 16px 20px;
  background: linear-gradient(180deg, #f9fbff 0%, #ffffff 100%);
  border-radius: 10px;
}

.summary-label {
  font-size: 13px;
  color: #909399;
}

.summary-value {
  font-size: 22px;
  font-weight: 600;
  color: #1f2d3d;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.summary-value-affix {
  font-size: 14px;
  color: #909399;
}

.summary-sub-value {
  font-size: 12px;
  color: #909399;
}

.summary-sub-value--highlight {
  color: #16a34a;
  font-weight: 500;
}

.metrics-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.metrics-line {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 13px;
}

.metrics-line span {
  color: #909399;
}

.metrics-line strong {
  font-weight: 600;
  color: #303133;
}

.metrics-sub-line {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 12px;
  color: #a0a3a8;
}

.metrics-sub-line span {
  color: #a0a3a8;
}

.metrics-sub-line strong {
  font-weight: 500;
  color: #606266;
}

</style>
