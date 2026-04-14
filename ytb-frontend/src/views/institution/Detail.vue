<template>
  <div class="institution-detail-page">
    <el-page-header
      v-if="!isEmbedded"
      class="detail-header"
      @back="handleBack"
      content="机构详情"
    />

    <el-card v-if="detail" shadow="never" class="detail-card">
      <template #header>
        <div class="detail-card-header">
          <div>
            <h3 class="institution-title">
              {{ detail.nickname || detail.name || '未命名机构' }}
              <el-tag
                v-if="detail.status_text"
                size="small"
                :type="getStatusTagType(detail.status)"
                class="status-tag"
              >
                {{ detail.status_text }}
              </el-tag>
              <el-tag
                v-if="detail.core_type_text"
                size="small"
                :type="detail.core_type === 2 ? 'warning' : 'info'"
              >
                {{ detail.core_type_text }}
              </el-tag>
            </h3>
            <div class="sub-title">机构ID：{{ detail.id }}</div>
          </div>
          <el-space wrap>
            <el-button type="success" @click="openStatusDialog(1)" :disabled="detail.status === 1">
              审核通过
            </el-button>
            <el-button type="danger" @click="openStatusDialog(2)" :disabled="detail.status === 2">
              驳回
            </el-button>
            <el-button type="primary" @click="openBalanceDialog">
              调整余额
            </el-button>
            <el-button @click="openCoreDialog">
              核心设置
            </el-button>
          </el-space>
        </div>
      </template>

      <el-row :gutter="16">
        <el-col :xs="24" :md="12">
          <el-card shadow="never" class="info-block">
            <template #header>基本信息</template>
            <el-descriptions column="1" border>
              <el-descriptions-item label="机构名称">{{ detail.nickname || '—' }}</el-descriptions-item>
              <el-descriptions-item label="负责人">{{ detail.name || '—' }}</el-descriptions-item>
              <el-descriptions-item label="手机号">{{ detail.phone || '—' }}</el-descriptions-item>
              <el-descriptions-item label="机构编号">{{ detail.number || '—' }}</el-descriptions-item>
              <el-descriptions-item label="新生编号">{{ detail.xs_number || '—' }}</el-descriptions-item>
              <el-descriptions-item label="等级">{{ detail.level_text || `L${detail.level ?? '—'}` }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ detail.created_at || '—' }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{ detail.updated_at || '—' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-card shadow="never" class="info-block">
            <template #header>账号信息</template>
            <el-descriptions column="1" border>
              <el-descriptions-item label="账号">
                {{ detail.account?.name || detail.account?.phone || '—' }}
              </el-descriptions-item>
              <el-descriptions-item label="手机号">{{ detail.account?.phone || '—' }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag
                  v-if="detail.account?.status_text"
                  size="small"
                  :type="detail.account?.status === 1 ? 'success' : 'danger'"
                >
                  {{ detail.account.status_text }}
                </el-tag>
                <span v-else>—</span>
              </el-descriptions-item>
              <el-descriptions-item label="最后登录">
                {{ detail.account?.last_login_at || '—' }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="info-row">
        <el-col :xs="24" :md="12">
          <el-card shadow="never" class="info-block">
            <template #header>余额情况</template>
            <el-descriptions column="1" border>
              <el-descriptions-item label="可提现">
                {{ formatAmount(balanceSection.withdrawable) }}
              </el-descriptions-item>
              <el-descriptions-item label="不可提现">
                {{ formatAmount(balanceSection.non_withdrawable) }}
              </el-descriptions-item>
              <el-descriptions-item :label="balanceSection.pendingLabel">
                <span>
                  {{ formatAmount(balanceSection.pending) }}
                  <span v-if="balanceSection.pendingCount">（{{ balanceSection.pendingCount }} 笔）</span>
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="更新时间">
                {{ balanceSection.updated_at || '—' }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>

        <el-col :xs="24" :md="12">
          <el-card shadow="never" class="info-block">
            <template #header>上下级与商户</template>
            <el-descriptions column="1" border>
              <el-descriptions-item label="上级机构ID">{{ detail.parent?.id || detail.parent_id || '—' }}</el-descriptions-item>
              <el-descriptions-item label="上级机构">{{ detail.parent?.nickname || detail.parent?.name || '—' }}</el-descriptions-item>
              <el-descriptions-item label="子机构数">{{ detail.children_count ?? 0 }}</el-descriptions-item>
              <el-descriptions-item label="直接商户">
                {{ detail.merchant_stats?.direct ?? 0 }}
              </el-descriptions-item>
              <el-descriptions-item label="团队商户">
                {{ detail.merchant_stats?.team ?? 0 }}
              </el-descriptions-item>
              <el-descriptions-item label="商户总数">
                {{ detail.merchant_stats?.total ?? 0 }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
      </el-row>

      <el-card shadow="never" class="info-block">
        <template #header>地址信息</template>
        <el-descriptions column="2" border>
          <el-descriptions-item label="省">{{ detail.province_name || detail.province || '—' }}</el-descriptions-item>
          <el-descriptions-item label="市">{{ detail.city_name || detail.city || '—' }}</el-descriptions-item>
          <el-descriptions-item label="区县">{{ detail.district_name || detail.district || '—' }}</el-descriptions-item>
          <el-descriptions-item label="详细地址">
            {{ detail.address || '—' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card shadow="never" class="info-block">
        <template #header>美团业务</template>
        <el-descriptions column="2" border>
          <el-descriptions-item label="是否开通">
            <el-tag
              v-if="detail.meituan?.enabled"
              size="small"
              type="success"
            >
              已开通
            </el-tag>
            <el-tag v-else size="small">未开通</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="美团层级">
            <span v-if="detail.meituan?.enabled">{{ detail.meituan?.level ?? 0 }}</span>
            <span v-else>—</span>
          </el-descriptions-item>
          <el-descriptions-item label="美团上级" :span="2">
            <span v-if="detail.meituan?.enabled">
              {{ formatMeituanParent(detail.meituan?.parent) }}
            </span>
            <span v-else>—</span>
          </el-descriptions-item>
          <el-descriptions-item label="美团等级">
            <span v-if="detail.meituan?.enabled">
              {{ detail.meituan?.role_text || '未设置' }}
            </span>
            <span v-else>—</span>
          </el-descriptions-item>
          <el-descriptions-item label="分润档位">
            <span v-if="detail.meituan?.enabled">
              {{ detail.meituan?.commission_rate || '未设置' }}
            </span>
            <span v-else>—</span>
          </el-descriptions-item>
          <el-descriptions-item v-if="detail.meituan?.role === MEITUAN_ROLE_OPERATION_CENTER" label="运营中心服务包">
            {{ detail.meituan?.service_package_count ?? 0 }}
          </el-descriptions-item>
          <el-descriptions-item v-if="detail.meituan?.role === MEITUAN_ROLE_OPERATION_CENTER" label="合伙人名额">
            {{ detail.meituan?.partner_quota?.used ?? 0 }} / {{ detail.meituan?.partner_quota?.total ?? 0 }}
          </el-descriptions-item>
          <el-descriptions-item v-if="detail.meituan?.role === MEITUAN_ROLE_PARTNER" label="合伙人服务包">
            {{ detail.meituan?.partner_package_count ?? 0 }}
          </el-descriptions-item>
          <el-descriptions-item v-if="[MEITUAN_ROLE_OPERATION_CENTER, MEITUAN_ROLE_PARTNER].includes(detail.meituan?.role)" label="销售经理名额">
            {{ detail.meituan?.sales_quota?.used ?? 0 }} / {{ detail.meituan?.sales_quota?.total ?? 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="美团子机构数" :span="2">
            <span v-if="detail.meituan?.enabled">{{ detail.meituan?.children_count ?? 0 }}</span>
            <span v-else>—</span>
          </el-descriptions-item>
        </el-descriptions>

        <div
          v-if="detail.meituan?.enabled && (detail.meituan?.children?.length || 0) > 0"
          class="meituan-children"
        >
          <div class="children-title">美团子机构</div>
          <el-table
            :data="detail.meituan.children"
            border
            size="small"
            :row-key="row => row.id"
            empty-text="暂无子机构"
          >
            <el-table-column prop="id" label="ID" width="90" />
            <el-table-column label="机构名称" min-width="180">
              <template #default="{ row }">
                <span>{{ row.name || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="number" label="机构编号" min-width="140" />
            <el-table-column label="层级" width="100">
              <template #default="{ row }">
                <el-tag size="small" type="info">L{{ row.level ?? 0 }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="phone" label="联系方式" min-width="140" />
          </el-table>
        </div>
      </el-card>
    </el-card>

    <el-empty v-else-if="!loading" description="未找到机构信息" />

    <div v-else class="loading-container">
      <el-skeleton :rows="6" animated />
    </div>

    <!-- 审核/驳回对话框 -->
    <el-dialog
      v-model="dialogs.status.visible"
      :title="dialogs.status.status === 1 ? '审核通过' : '驳回机构'"
      width="480px"
    >
      <el-form :model="dialogs.status.form" label-width="100px">
        <el-form-item label="机构编号">
          <el-input
            v-model.trim="dialogs.status.form.number"
            maxlength="100"
            placeholder="可在审核时同步更新机构编号"
          />
        </el-form-item>
        <el-form-item label="新生编号">
          <el-input
            v-model.trim="dialogs.status.form.xs_number"
            maxlength="50"
          />
        </el-form-item>
        <el-form-item :label="dialogs.status.status === 1 ? '备注' : '驳回原因'" required>
          <el-input
            v-model.trim="dialogs.status.form.note"
            type="textarea"
            :rows="3"
            maxlength="255"
            show-word-limit
            :placeholder="dialogs.status.status === 1 ? '可填写审核备注' : '请填写驳回原因'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogs.status.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitStatus">
          确认
        </el-button>
      </template>
    </el-dialog>

    <!-- 余额调整对话框 -->
    <el-dialog
      v-model="dialogs.balance"
      title="调整机构余额"
      width="480px"
    >
      <el-form :model="balanceForm" label-width="100px">
        <el-form-item label="调整类型" required>
          <el-radio-group v-model="balanceForm.action">
            <el-radio-button label="increase">增加</el-radio-button>
            <el-radio-button label="decrease">扣减</el-radio-button>
            <el-radio-button label="set">设为指定金额</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="金额" required>
          <el-input-number
            v-model="balanceForm.amount"
            :precision="2"
            :min="0"
            :max="99999999"
            controls-position="right"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model.trim="balanceForm.remark"
            type="textarea"
            :rows="3"
            maxlength="255"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogs.balance = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitBalance">
          确认
        </el-button>
      </template>
    </el-dialog>

    <!-- 核心机构设置 -->
    <el-dialog
      v-model="dialogs.core"
      title="核心机构设置"
      width="480px"
    >
      <el-form :model="coreForm" label-width="110px">
        <el-form-item label="机构类型" required>
          <el-radio-group v-model="coreForm.core_type">
            <el-radio-button :label="1">普通机构</el-radio-button>
            <el-radio-button :label="2">核心机构</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="核心等级" v-if="coreForm.core_type === 2" required>
          <el-select v-model="coreForm.core_level_id" placeholder="请选择核心等级">
            <el-option
              v-for="item in coreLevels"
              :key="item.id"
              :label="`${item.grade_name} (L${item.grade})`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="普通等级">
          <el-input-number
            v-model="coreForm.level"
            :min="0"
            :max="99"
            controls-position="right"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogs.core = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitCore">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  fetchInstitutionDetail,
  updateInstitutionStatus,
  adjustInstitutionBalance,
  updateInstitutionCore,
  fetchInstitutionCoreLevels
} from '@/api/v1/institution'

const props = defineProps({
  id: {
    type: [Number, String],
    default: null
  },
  embedded: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'updated'])

const route = useRoute()
const router = useRouter()
const isEmbedded = computed(() => !!props.embedded)
const institutionId = computed(() => {
  if (props.id !== null && props.id !== undefined && props.id !== '') {
    const parsed = Number(props.id)
    return Number.isNaN(parsed) ? null : parsed
  }
  return Number(route.params.id)
})

const loading = ref(false)
const submitLoading = ref(false)
const detail = ref(null)
const coreLevels = ref([])

const dialogs = reactive({
  status: {
    visible: false,
    status: 1,
    form: {
      number: '',
      xs_number: '',
      note: ''
    }
  },
  balance: false,
  core: false
})

const balanceForm = reactive({
  action: 'increase',
  amount: 0,
  remark: ''
})

const coreForm = reactive({
  core_type: 1,
  core_level_id: null,
  level: null
})

const getStatusTagType = (status) => {
  if (status === 1) return 'success'
  if (status === 2) return 'danger'
  return 'warning'
}

const formatAmount = (value) => {
  if (value === null || value === undefined) return '—'
  const number = Number(value)
  if (Number.isNaN(number)) return '—'
  return `¥${number.toFixed(2)}`
}

const walletSnapshot = computed(() => {
  if (!detail.value) return null
  return detail.value.meituan_wallet || detail.value.balance || null
})

const balanceSection = computed(() => {
  const snapshot = walletSnapshot.value
  if (!snapshot) {
    return {
      withdrawable: null,
      non_withdrawable: null,
      pending: null,
      pendingLabel: '待入账',
      pendingCount: 0,
      updated_at: null
    }
  }

  const isMeituanWallet = !!detail.value?.meituan_wallet
  const withdrawable = snapshot.withdrawable ?? snapshot.available ?? snapshot.balance ?? null
  let nonWithdrawable = snapshot.non_withdrawable ?? snapshot.frozen ?? null
  if ((nonWithdrawable === null || nonWithdrawable === undefined) && snapshot.balance !== undefined && snapshot.available !== undefined) {
    const balanceNumber = Number(snapshot.balance)
    const availableNumber = Number(snapshot.available)
    if (!Number.isNaN(balanceNumber) && !Number.isNaN(availableNumber)) {
      nonWithdrawable = (balanceNumber - availableNumber).toFixed(2)
    }
  }
  const pending = snapshot.pending ?? snapshot.pending_withdraw_amount ?? null
  const pendingCount = snapshot.pending_withdraw_count ?? 0

  return {
    withdrawable,
    non_withdrawable: nonWithdrawable,
    pending,
    pendingLabel: isMeituanWallet ? '待审核提现' : '待入账',
    pendingCount,
    updated_at: snapshot.updated_at || snapshot.last_transaction_at || null
  }
})

const MEITUAN_PARENT_ROLE_WHITELIST = ['运营总部', '运营中心', '合伙人', '销售经理']
const MEITUAN_ROLE_OPERATION_CENTER = 2
const MEITUAN_ROLE_PARTNER = 3

const resolveMeituanParentRole = (parent) => {
  if (!parent) {
    return ''
  }
  const candidate =
    parent.meituan_role_text ??
    parent.role_text ??
    parent.roleText ??
    parent.role ??
    parent.level_text ??
    parent.level_name ??
    ''
  const normalized = typeof candidate === 'string' ? candidate.trim() : String(candidate || '').trim()
  if (!normalized) {
    return ''
  }
  const matched = MEITUAN_PARENT_ROLE_WHITELIST.find(role => normalized.includes(role))
  return matched || normalized
}

const formatMeituanParent = (parent) => {
  if (!parent || !parent.id) {
    return '顶级机构'
  }
  const name = parent.name || parent.nickname || '未命名'
  const role = resolveMeituanParentRole(parent)
  return role ? `${name}（${role}）` : name
}

const loadDetail = async () => {
  if (!institutionId.value) return
  loading.value = true
  try {
    const { code, data, message } = await fetchInstitutionDetail(institutionId.value)
    if (code === 0) {
      detail.value = data
      dialogs.status.form.number = data.number || ''
      dialogs.status.form.xs_number = data.xs_number || ''
      coreForm.core_type = data.core_type ?? 1
      coreForm.core_level_id = data.core_id ?? null
      coreForm.level = data.level ?? null
    } else {
      ElMessage.error(message || '获取机构详情失败')
    }
  } catch (error) {
    console.error('获取机构详情失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '获取机构详情失败')
  } finally {
    loading.value = false
  }
}

const loadCoreLevels = async () => {
  try {
    const { code, data, message } = await fetchInstitutionCoreLevels()
    if (code === 0 && Array.isArray(data)) {
      coreLevels.value = data
    } else {
      ElMessage.error(message || '获取核心等级失败')
    }
  } catch (error) {
    console.error('获取核心等级失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '获取核心等级失败')
  }
}

const openStatusDialog = (status) => {
  dialogs.status.status = status
  dialogs.status.form.note = ''
  dialogs.status.visible = true
}

const openBalanceDialog = () => {
  balanceForm.action = 'increase'
  balanceForm.amount = 0
  balanceForm.remark = ''
  dialogs.balance = true
}

const openCoreDialog = () => {
  coreForm.core_type = detail.value?.core_type ?? 1
  coreForm.core_level_id = detail.value?.core_id ?? null
  coreForm.level = detail.value?.level ?? null
  dialogs.core = true
}

const submitStatus = async () => {
  if (!institutionId.value) return

  if (dialogs.status.status === 2 && !dialogs.status.form.note) {
    ElMessage.error('请填写驳回原因')
    return
  }

  submitLoading.value = true
  try {
    const payload = {
      status: dialogs.status.status,
      note: dialogs.status.form.note,
      number: dialogs.status.form.number,
      xs_number: dialogs.status.form.xs_number
    }
    const { code, data, message } = await updateInstitutionStatus(institutionId.value, payload)
    if (code === 0) {
      detail.value = data
      dialogs.status.visible = false
      ElMessage.success('机构状态更新成功')
      if (props.embedded) {
        emit('updated', detail.value)
      }
    } else {
      ElMessage.error(message || '机构状态更新失败')
    }
  } catch (error) {
    console.error('机构状态更新失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '机构状态更新失败')
  } finally {
    submitLoading.value = false
  }
}

const submitBalance = async () => {
  if (!institutionId.value) return

  if (balanceForm.amount <= 0 && balanceForm.action !== 'set') {
    ElMessage.error('金额需大于0')
    return
  }

  submitLoading.value = true
  try {
    const payload = {
      action: balanceForm.action,
      amount: balanceForm.amount,
      remark: balanceForm.remark
    }
    const { code, data, message } = await adjustInstitutionBalance(institutionId.value, payload)
    if (code === 0) {
      detail.value = data
      dialogs.balance = false
      ElMessage.success('余额调整成功')
      if (props.embedded) {
        emit('updated', detail.value)
      }
    } else {
      ElMessage.error(message || '余额调整失败')
    }
  } catch (error) {
    console.error('余额调整失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '余额调整失败')
  } finally {
    submitLoading.value = false
  }
}

const submitCore = async () => {
  if (!institutionId.value) return

  if (coreForm.core_type === 2 && !coreForm.core_level_id) {
    ElMessage.error('请选择核心等级')
    return
  }

  submitLoading.value = true
  try {
    const payload = {
      core_type: coreForm.core_type,
      core_level_id: coreForm.core_type === 2 ? coreForm.core_level_id : null,
      level: coreForm.level
    }
    const { code, data, message } = await updateInstitutionCore(institutionId.value, payload)
    if (code === 0) {
      detail.value = data
      dialogs.core = false
      ElMessage.success('核心信息更新成功')
      if (props.embedded) {
        emit('updated', detail.value)
      }
    } else {
      ElMessage.error(message || '核心信息更新失败')
    }
  } catch (error) {
    console.error('核心信息更新失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '核心信息更新失败')
  } finally {
    submitLoading.value = false
  }
}

const handleBack = () => {
  if (props.embedded) {
    emit('close')
  } else {
    router.back()
  }
}

watch(institutionId, async (newVal, oldVal) => {
  if (newVal && newVal !== oldVal) {
    await loadDetail()
  }
})

onMounted(async () => {
  await Promise.all([loadDetail(), loadCoreLevels()])
  if (detail.value) {
    coreForm.core_type = detail.value.core_type ?? 1
    coreForm.core_level_id = detail.value.core_id ?? null
    coreForm.level = detail.value.level ?? null
  }
})
</script>

<style scoped lang="scss">
.institution-detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-header {
  padding: 0;
}

.detail-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;

  .institution-title {
    margin: 0;
    font-size: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sub-title {
    color: #909399;
    font-size: 13px;
    margin-top: 4px;
  }
}

.info-block {
  margin-bottom: 16px;
}

.info-row {
  margin-top: 8px;
}

.loading-container {
  background-color: #fff;
  padding: 24px;
}
</style>
