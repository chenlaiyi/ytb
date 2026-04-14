<template>
  <div class="institution-salesman">
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filters" @submit.prevent>
        <el-form-item label="机构编号">
          <el-input v-model="filters.institution_number" placeholder="机构号" clearable />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="filters.salesman_name" placeholder="业务员姓名" clearable />
        </el-form-item>
        <el-form-item label="编号">
          <el-input v-model="filters.salesman_code" placeholder="业务员编号" clearable />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="filters.salesman_phone" placeholder="手机号" clearable />
        </el-form-item>
        <el-form-item label="邀请码">
          <el-input v-model="filters.invite_code" placeholder="业务员邀请码" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="success" @click="openForm()">新增业务员</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-tabs v-model="activeTab" class="mt15">
      <el-tab-pane label="业务员列表" name="list">
        <el-table
          :data="list"
          border
          v-loading="loading"
          style="width: 100%"
          @sort-change="handleSort"
        >
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column label="业务员">
            <template #default="{ row }">
              <div class="name-line">
                <strong>{{ row.salesman_name }}</strong>
                <el-tag size="small" class="ml6">{{ row.salesman_code || '—' }}</el-tag>
              </div>
              <div class="muted">电话：{{ row.salesman_phone || '—' }}</div>
            </template>
          </el-table-column>
          <el-table-column label="机构">
            <template #default="{ row }">
              <div>{{ row.channelname }}</div>
              <div class="muted">编号：{{ row.channelId }}</div>
            </template>
          </el-table-column>
        <el-table-column label="上级" width="120">
          <template #default="{ row }">
            {{ row.s_id || '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="total_profit" label="总分润" width="140" sortable="custom">
          <template #default="{ row }">
            {{ formatAmount(row.total_profit) }}
          </template>
        </el-table-column>
        <el-table-column prop="withdrawal_price" label="已提现" width="110" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="child_count" label="下级" width="120" sortable="custom">
          <template #default="{ row }">
            <el-button type="primary" link @click="openSubordinates(row)">
              {{ row.child_count ?? 0 }} 人
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="invite_code" label="邀请码" width="140" />
        <el-table-column prop="cate_time" label="创建时间" width="170" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openForm(row)">编辑</el-button>
              <el-button link type="warning" @click="openStatus(row)">审核/状态</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="mt12 flex-end">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.per_page"
            :total="pagination.total"
            layout="total, prev, pager, next, jumper"
            @current-change="loadData"
          />
        </div>
      </el-tab-pane>
      <el-tab-pane label="入账流水" name="price">
        <el-table :data="priceLogs" border v-loading="priceLoading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="salesman_name" label="业务员" />
          <el-table-column prop="salesman_code" label="编号" />
          <el-table-column prop="price" label="金额" />
          <el-table-column prop="status" label="类型" />
          <el-table-column prop="cate_time" label="时间" width="170" />
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="提现审核" name="withdraw">
        <el-table :data="withdrawals" border v-loading="withdrawLoading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="salesman_name" label="业务员" />
          <el-table-column prop="salesman_code" label="编号" />
          <el-table-column prop="price" label="提现金额" />
          <el-table-column prop="account_price" label="到账金额" />
          <el-table-column prop="status" label="状态">
            <template #default="{ row }">
              <el-tag :type="withdrawStatusTag(row.status)">{{ withdrawStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="cate_time" label="申请时间" width="170" />
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <el-button size="small" type="success" @click="reviewWithdrawal(row, 2)" :disabled="row.status!=1">通过</el-button>
              <el-button size="small" type="danger" @click="reviewWithdrawal(row, 3)" :disabled="row.status!=1">拒绝</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="配置" name="settings">
        <el-form :model="settings" label-width="120px" class="settings-form" @submit.prevent>
          <el-form-item label="分润比例(万)">
            <el-input-number v-model="settings.profit" :min="0" />
          </el-form-item>
          <el-form-item label="下级分润比例(万)">
            <el-input-number v-model="settings.level_profit" :min="0" />
          </el-form-item>
          <el-form-item label="提现手续费(%)">
            <el-input-number v-model="settings.commission" :min="0" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="settingsSaving" @click="saveSettings">保存配置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <el-drawer v-model="formVisible" :title="formModel.id ? '编辑业务员' : '新增业务员'" size="460px">
      <el-form :model="formModel" label-width="110px" @submit.prevent>
        <el-form-item label="机构名称">
          <el-select
            v-model="formModel.channelId"
            filterable
            remote
            clearable
            placeholder="搜索机构名称/编号"
            :remote-method="remoteSearchInstitution"
            :loading="institutionLoading"
            style="width: 100%;"
            @change="handleInstitutionChange"
          >
            <el-option
              v-for="item in institutionOptions"
              :key="item.id"
              :label="`${item.nickname || item.name || '—'} (${item.number || '无编号'})`"
              :value="item.number"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="机构编号">
          <el-input v-model="formModel.channelId" placeholder="机构编号" disabled />
        </el-form-item>
        <el-form-item label="业务员姓名">
          <el-input v-model="formModel.salesman_name" placeholder="姓名" />
        </el-form-item>
        <el-form-item label="业务员编号">
          <el-input v-model="formModel.salesman_code" placeholder="唯一编号" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="formModel.salesman_phone" placeholder="手机号" />
        </el-form-item>
        <el-form-item label="上级业务员ID">
          <el-input v-model="formModel.s_id" placeholder="可为空" />
        </el-form-item>
        <el-form-item label="上上级业务员ID">
          <el-input v-model="formModel.ss_id" placeholder="可为空" />
        </el-form-item>
        <el-form-item label="等级ID">
          <el-input v-model="formModel.lv" placeholder="可为空" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
          <el-button @click="formVisible=false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-drawer>

    <el-dialog v-model="statusVisible" title="审核 / 状态更新" width="420px">
      <el-form :model="statusForm" label-width="110px">
        <el-form-item label="状态">
          <el-select v-model="statusForm.status" placeholder="选择状态">
            <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="业务员编号" v-if="statusForm.status===1">
          <el-input v-model="statusForm.salesman_code" placeholder="审核通过时必填" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="statusForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusVisible=false">取消</el-button>
        <el-button type="primary" :loading="statusSaving" @click="submitStatus">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="childDialog.visible"
      :title="`下级业务员 - ${childDialog.parent?.salesman_name || ''}`"
      width="680px"
    >
      <el-table :data="childDialog.items" v-loading="childDialog.loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="salesman_name" label="姓名" />
        <el-table-column prop="salesman_code" label="编号" />
        <el-table-column prop="salesman_phone" label="手机号" />
        <el-table-column prop="status" label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="cate_time" label="创建时间" width="170" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  fetchInstitutionSalesmen,
  createInstitutionSalesman,
  updateInstitutionSalesman,
  updateInstitutionSalesmanStatus,
  fetchSalesmanPriceLogs,
  fetchSalesmanWithdrawals,
  reviewSalesmanWithdrawal,
  getSalesmanSettings,
  saveSalesmanSettings,
  fetchInstitutionSalesmanStats
} from "@/api/v1/institutionSalesman";
import { fetchInstitutions } from '@/api/v1/institution';

const filters = reactive({
  institution_number: '',
  salesman_name: '',
  salesman_code: '',
  salesman_phone: '',
  invite_code: '',
  status: '',
  sort_field: '',
  sort_order: ''
});

const statusOptions = [
  { value: 1, label: '审核通过' },
  { value: 2, label: '审核拒绝/禁用' },
  { value: 3, label: '禁用' },
  { value: 4, label: '待审核' },
  { value: 5, label: '恢复启用' }
];

const loading = ref(false);
const list = ref([]);
const pagination = reactive({ page: 1, per_page: 20, total: 0 });
const activeTab = ref('list');
const sort = reactive({ field: '', order: '' });

const priceLogs = ref([]);
const priceLoading = ref(false);
const withdrawals = ref([]);
const withdrawLoading = ref(false);

const formVisible = ref(false);
const formModel = reactive({
  id: null,
  channelId: '',
  channelname: '',
  salesman_name: '',
  salesman_code: '',
  salesman_phone: '',
  s_id: '',
  ss_id: '',
  lv: ''
});
const institutionOptions = ref([]);
const institutionLoading = ref(false);
const saving = ref(false);

const statusVisible = ref(false);
const statusForm = reactive({
  id: null,
  status: 1,
  salesman_code: '',
  notes: ''
});
const statusSaving = ref(false);

const childDialog = reactive({
  visible: false,
  loading: false,
  parent: null,
  items: [],
});

const settings = reactive({
  profit: 0,
  level_profit: 0,
  commission: 0
});
const settingsSaving = ref(false);

const loadData = async () => {
  loading.value = true;
  try {
    const response = await fetchInstitutionSalesmen({
      ...filters,
      page: pagination.page,
      per_page: pagination.per_page
    });
    const payload = response?.data || response || {};
    list.value = payload.items || payload.data || [];
    pagination.total = payload.total || pagination.total;
    pagination.page = payload.current_page || pagination.page;
    pagination.per_page = payload.per_page || pagination.per_page;
    pagination.last_page = payload.last_page || pagination.last_page;
  } catch (e) {
    ElMessage.error(e.message || '加载失败');
  } finally {
    loading.value = false;
  }
};

const handleSort = ({ prop, order }) => {
  if (prop !== 'total_profit' && prop !== 'child_count') {
    sort.field = '';
    sort.order = '';
    filters.sort_field = '';
    filters.sort_order = '';
    return;
  }
  sort.field = prop;
  sort.order = order === 'ascending' ? 'asc' : order === 'descending' ? 'desc' : '';
  filters.sort_field = sort.field;
  filters.sort_order = sort.order;
  pagination.page = 1;
  loadData();
};

const formatAmount = (v) => {
  const n = Number(v || 0);
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const resetFilters = () => {
  filters.institution_number = '';
  filters.salesman_name = '';
  filters.salesman_code = '';
  filters.salesman_phone = '';
  filters.invite_code = '';
  filters.status = '';
  pagination.page = 1;
  loadData();
};

const openForm = (row = null) => {
  if (row) {
    Object.assign(formModel, row);
  } else {
    Object.assign(formModel, {
      id: null,
      channelId: '',
      channelname: '',
      salesman_name: '',
      salesman_code: '',
      salesman_phone: '',
      s_id: '',
      ss_id: '',
      lv: ''
    });
  }
  formVisible.value = true;
};

const submitForm = async () => {
  saving.value = true;
  try {
    if (formModel.id) {
      await updateInstitutionSalesman(formModel.id, formModel);
    } else {
      await createInstitutionSalesman(formModel);
    }
    ElMessage.success('保存成功');
    formVisible.value = false;
    loadData();
  } catch (e) {
    ElMessage.error(e.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

const openStatus = (row) => {
  statusForm.id = row.id;
  statusForm.status = row.status;
  statusForm.salesman_code = row.salesman_code;
  statusForm.notes = '';
  statusVisible.value = true;
};

const submitStatus = async () => {
  if (!statusForm.id) return;
  statusSaving.value = true;
  try {
    await updateInstitutionSalesmanStatus(statusForm.id, {
      status: statusForm.status,
      salesman_code: statusForm.salesman_code,
      notes: statusForm.notes
    });
    ElMessage.success('更新成功');
    statusVisible.value = false;
    loadData();
  } catch (e) {
    ElMessage.error(e.message || '更新失败');
  } finally {
    statusSaving.value = false;
  }
};

const loadSubordinates = async (parentId) => {
  if (!parentId) {
    childDialog.items = [];
    return;
  }
  childDialog.loading = true;
  try {
    const response = await fetchInstitutionSalesmen({
      parent_id: parentId,
      page: 1,
      per_page: 200,
    });
    const payload = response?.data || response || {};
    childDialog.items = payload.items || payload.data || [];
  } catch (e) {
    ElMessage.error(e.message || '下级加载失败');
  } finally {
    childDialog.loading = false;
  }
};

const openSubordinates = (row) => {
  childDialog.parent = row;
  childDialog.visible = true;
  loadSubordinates(row.id);
};

watch(() => childDialog.visible, (visible) => {
  if (!visible) {
    childDialog.parent = null;
    childDialog.items = [];
  }
});

const loadPriceLogs = async () => {
  priceLoading.value = true;
  try {
    const response = await fetchSalesmanPriceLogs({ channelId: filters.institution_number });
    const payload = response?.data || response || {};
    priceLogs.value = payload.items || payload.data || [];
  } catch (e) {
    ElMessage.error(e.message || '加载失败');
  } finally {
    priceLoading.value = false;
  }
};

const loadWithdrawals = async () => {
  withdrawLoading.value = true;
  try {
    const response = await fetchSalesmanWithdrawals({ channelId: filters.institution_number });
    const payload = response?.data || response || {};
    withdrawals.value = payload.items || payload.data || [];
  } catch (e) {
    ElMessage.error(e.message || '加载失败');
  } finally {
    withdrawLoading.value = false;
  }
};

const reviewWithdrawal = (row, status) => {
  ElMessageBox.confirm(
    status === 2 ? '确认通过该提现申请？' : '确认拒绝并退回余额？',
    '提示',
    { type: status === 2 ? 'success' : 'warning' }
  ).then(async () => {
    await reviewSalesmanWithdrawal(row.id, { status });
    ElMessage.success('处理成功');
    loadWithdrawals();
    loadData();
  }).catch(() => {});
};

const statusTag = (status) => {
  switch (status) {
    case 1: return 'success';
    case 2: return 'danger';
    case 3: return 'danger';
    case 4: return 'warning';
    default: return '';
  }
};
const statusText = (status) => {
  return {
    1: '审核通过',
    2: '审核拒绝',
    3: '禁用',
    4: '待审核',
    5: '恢复启用',
  }[status] || '未知';
};

const withdrawStatusText = (status) => ({ 1: '审核中', 2: '通过', 3: '拒绝' }[status] || '未知');
const withdrawStatusTag = (status) => ({ 1: 'warning', 2: 'success', 3: 'danger' }[status] || '');

const loadSettings = async () => {
  try {
    const { data } = await getSalesmanSettings();
    Object.assign(settings, data || {});
  } catch (e) {
    console.warn('加载配置失败', e);
  }
};

const saveSettings = async () => {
  settingsSaving.value = true;
  try {
    await saveSalesmanSettings(settings);
    ElMessage.success('已保存');
  } catch (e) {
    ElMessage.error(e.message || '保存失败');
  } finally {
    settingsSaving.value = false;
  }
};

const remoteSearchInstitution = async (query) => {
  if (!query) {
    institutionOptions.value = [];
    return;
  }
  institutionLoading.value = true;
  try {
    const params = { keyword: query, per_page: 20 };
    const response = await fetchInstitutions(params);
    const payload = response?.data || response || {};
    institutionOptions.value = payload.items || payload.data || [];
  } catch (e) {
    console.warn('搜索机构失败', e);
  } finally {
    institutionLoading.value = false;
  }
};

const handleInstitutionChange = (number) => {
  const target = institutionOptions.value.find(item => item.number === number);
  formModel.channelId = target?.number || number || '';
  formModel.channelname = target?.nickname || target?.name || '';
};

onMounted(() => {
  loadData();
  loadPriceLogs();
  loadWithdrawals();
  loadSettings();
});
</script>

<style scoped>
.institution-salesman {
  padding: 8px;
}
.filter-card {
  margin-bottom: 12px;
}
.name-line {
  display: flex;
  align-items: center;
  gap: 6px;
}
.muted {
  color: #909399;
  font-size: 12px;
}
.mt12 { margin-top: 12px; }
.mt15 { margin-top: 15px; }
.ml6 { margin-left: 6px; }
.flex-end {
  display: flex;
  justify-content: flex-end;
  padding: 10px 0;
}
.settings-form {
  max-width: 520px;
  margin-top: 16px;
}
</style>
