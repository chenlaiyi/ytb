<template>
  <div class="app-container developers-page">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon class="title-icon"><UserFilled /></el-icon>
            开发者账号管理
          </h1>
          <p class="page-description">
            统一管理点点够终端 App 与后台共用的开发者账号，保持用户体系一致。
          </p>
        </div>
        <div class="header-actions">
          <el-button type="primary" size="large" @click="openCreateDialog">
            <el-icon><Plus /></el-icon>
            新增开发者
          </el-button>
          <el-button size="large" @click="refreshList" :loading="loading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>
    </div>

    <el-card class="filter-card" shadow="hover">
      <template #header>
        <div class="filter-header">
          <el-icon class="filter-icon"><Search /></el-icon>
          <span class="filter-title">筛选条件</span>
        </div>
      </template>
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item>
          <el-input
            v-model="queryParams.keyword"
            placeholder="搜索姓名 / 手机号 / 邮箱"
            clearable
            style="width: 260px"
            prefix-icon="Search"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryParams.status" placeholder="账号状态" clearable style="width: 160px">
            <template #prefix>
              <el-icon><CircleCheck /></el-icon>
            </template>
            <el-option label="启用" value="active">
              <el-tag type="success" size="small">启用</el-tag>
            </el-option>
            <el-option label="禁用" value="disabled">
              <el-tag type="danger" size="small">禁用</el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select
            v-model="queryParams.subscription_status"
            placeholder="订阅状态"
            clearable
            style="width: 160px"
          >
            <el-option label="全部" value="" />
            <el-option label="活跃订阅" value="active" />
            <el-option label="试用中" value="trial" />
            <el-option label="已过期" value="expired" />
            <el-option label="终身" value="lifetime" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select
            v-model="queryParams.subscription_plan"
            placeholder="套餐类型"
            clearable
            style="width: 160px"
          >
            <el-option label="全部" value="" />
            <el-option label="日度订阅 · Codex50" value="daily_codex50" />
            <el-option label="月度订阅 · Codex50/天" value="monthly_codex50" />
            <el-option label="月度订阅 · Codex110/天" value="monthly_codex110" />
            <el-option label="终身使用" value="lifetime" />
            <el-option label="试用中" value="trial" />
            <el-option label="[旧版] 周度体验" value="weekly" />
            <el-option label="[旧版] 月度订阅" value="monthly" />
            <el-option label="[旧版] 年度订阅" value="yearly" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetQuery" :disabled="loading">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="subscription-summary" shadow="hover">
      <div class="summary-header">
        <div>
          <span class="summary-title">订阅概览</span>
          <p class="summary-desc">快捷了解开发者试用与订阅状态，支持按需跟进。</p>
        </div>
        <el-tag round type="success">累计奖励：¥ {{ rewardBalanceTotal.toFixed(2) }}</el-tag>
      </div>
      <div class="summary-grid">
        <div class="summary-item">
          <p class="summary-label">活跃订阅</p>
          <p class="summary-value">{{ summaryStats.active }}</p>
        </div>
        <div class="summary-item">
          <p class="summary-label">试用中</p>
          <p class="summary-value">{{ summaryStats.trial }}</p>
        </div>
        <div class="summary-item">
          <p class="summary-label">终身用户</p>
          <p class="summary-value">{{ summaryStats.lifetime }}</p>
        </div>
        <div class="summary-item">
          <p class="summary-label">已过期</p>
          <p class="summary-value">{{ summaryStats.expired }}</p>
        </div>
      </div>
    </el-card>

    <el-card class="list-card" shadow="hover">
      <template #header>
        <div class="list-header">
          <span>开发者列表</span>
          <el-space>
            <el-tag type="info" effect="dark">共 {{ pagination.total }} 位开发者</el-tag>
            <el-tag v-if="filterApplied" type="success" effect="plain">
              筛选中 · 当前条件
            </el-tag>
          </el-space>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="developers"
        border
        stripe
        size="large"
        class="developers-table"
        :empty-text="tableEmptyText"
      >
        <el-table-column prop="id" label="ID" width="90" align="center" />
        <el-table-column prop="name" label="姓名" min-width="140">
          <template #default="{ row }">
            <div class="developer-name">
              <el-avatar :size="36" class="mr-2">
                <User v-if="!row.avatar" />
                <img v-else :src="row.avatar" alt="avatar" />
              </el-avatar>
              <div class="name-info">
                <div class="name-text">{{ row.name || '未填写' }}</div>
                <div class="name-sub" v-if="row.wechat_nickname">微信：{{ row.wechat_nickname }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="160">
          <template #default="{ row }">
            <span>{{ row.phone || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" width="220">
          <template #default="{ row }">
            <span>{{ row.email || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="登录渠道" min-width="220">
          <template #default="{ row }">
            <div class="channel-info">
              <span class="channel-badge" :class="`is-${loginChannelMeta(row).type}`">
                {{ loginChannelMeta(row).label }}
              </span>
              <span class="channel-meta">
                最近登录：{{ formatLoginPlatform(row.last_login_platform) }}
              </span>
              <span v-if="row.apple_user_identifier" class="channel-meta">
                Apple ID：<span class="mono">{{ abbreviateAppleId(row.apple_user_identifier) }}</span>
              </span>
              <span v-else-if="row.apple_email" class="channel-meta">
                Apple 邮箱：<span class="mono">{{ row.apple_email }}</span>
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="订阅状态" min-width="240">
          <template #default="{ row }">
            <div
              class="plan-card"
              :style="planGradientStyle(row.dev_subscription_plan)"
            >
              <div class="plan-card__meta">
                <el-tag :type="getSubscriptionStatus(row).type" size="small">
                  {{ getSubscriptionStatus(row).label }}
                </el-tag>
                <span class="plan-name">{{ getPlanLabel(row.dev_subscription_plan) }}</span>
              </div>
              <div class="plan-card__countdown" v-if="row.dev_subscription_plan !== 'lifetime'">
                <span class="label">剩余：</span>
                <span>{{ countdownText(row.dev_subscription_expires_at || row.dev_trial_expires_at) }}</span>
              </div>
              <div class="plan-card__expires" v-else>永久有效</div>
              <div class="plan-card__meta-extra">
                <span>
                  最近支付：{{ row.dev_last_payment_at ? formatDate(row.dev_last_payment_at) : '未支付' }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="邀请码 / 奖励" min-width="200">
          <template #default="{ row }">
            <div class="invite-code">
              <span>{{ row.dev_invite_code || '-' }}</span>
              <el-button v-if="row.dev_invite_code" size="small" text type="primary" @click="copyInviteCode(row.dev_invite_code)">复制</el-button>
            </div>
            <div class="reward-info">
              <span>余额 ¥{{ Number(row.dev_reward_balance || 0).toFixed(2) }}</span>
              <span class="divider">|</span>
              <span>累计 ¥{{ Number(row.dev_total_rewards || 0).toFixed(2) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_login_time" label="最近登录" width="200">
          <template #default="{ row }">
            <span>{{ formatDate(row.last_login_time) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="{ row }">
            <el-space>
              <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="warning" size="small" @click="toggleStatus(row)">
                {{ row.status === 1 ? '禁用' : '启用' }}
              </el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          :page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :current-page="pagination.page"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 创建/编辑弹窗 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="680px" destroy-on-close>
      <el-form :model="dialog.form" :rules="dialog.rules" ref="dialogFormRef" label-width="120px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="dialog.form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="dialog.form.phone" placeholder="请输入 11 位手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="dialog.form.email" placeholder="请输入邮箱地址" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="dialog.form.status"
            inactive-value="disabled"
            active-value="active"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>

        <el-divider content-position="left">订阅信息</el-divider>
        <el-alert
          v-if="!isEditMode"
          type="info"
          :closable="false"
          show-icon
          class="mb-12"
        >
          订阅信息只可在编辑现有开发者时调整，新增开发者将沿用默认试用策略。
        </el-alert>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="订阅套餐">
              <el-select
                v-model="dialog.form.subscription_plan"
                placeholder="选择套餐"
                :disabled="!isEditMode"
                @change="handlePlanChange"
              >
                <el-option
                  v-for="plan in planOptions"
                  :key="plan.value"
                  :label="plan.label"
                  :value="plan.value"
                  :disabled="Boolean(plan.disabled)"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="订阅到期">
              <el-date-picker
                v-model="dialog.form.subscription_expires_at"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                placeholder="请选择日期时间"
                :disabled="!isEditMode || isLifetimePlan"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="试用到期">
              <el-date-picker
                v-model="dialog.form.trial_expires_at"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                placeholder="请选择日期时间"
                :disabled="!isEditMode"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">奖励与邀请码</el-divider>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="奖励余额 (¥)">
              <el-input-number
                v-model="dialog.form.reward_balance"
                :min="0"
                :step="0.5"
                :precision="2"
                :disabled="!isEditMode"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="累计奖励 (¥)">
              <el-input-number
                v-model="dialog.form.total_rewards"
                :min="0"
                :step="1"
                :precision="2"
                :disabled="!isEditMode"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="邀请码">
          <el-space>
            <el-input v-model="dialog.form.dev_invite_code" readonly style="width: 220px" />
            <el-checkbox v-model="dialog.form.regenerate_invite_code" :disabled="!isEditMode">
              重新生成
            </el-checkbox>
          </el-space>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialog.visible = false">取消</el-button>
          <el-button type="primary" :loading="dialog.loading" @click="submitDialog">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus';
import {
  CircleCheck,
  Plus,
  Refresh,
  RefreshLeft,
  Search,
  User,
  UserFilled
} from '@element-plus/icons-vue';
import type { DeveloperItem, DeveloperListSummary, DeveloperQuery } from './types';
import { fetchDevelopers, createDeveloper, updateDeveloper, toggleDeveloperStatus } from './api';

const loading = ref(false);
const developers = ref<DeveloperItem[]>([]);

const queryParams = reactive<DeveloperQuery>({
  page: 1,
  pageSize: 20,
  keyword: '',
  status: '',
  subscription_status: '',
  subscription_plan: ''
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  lastPage: 1
});

const dialogFormRef = ref<FormInstance>();

const planOptions = [
  { label: '日度订阅 · Codex50', value: 'daily_codex50' },
  { label: '月度订阅 · Codex50/天', value: 'monthly_codex50' },
  { label: '月度订阅 · Codex110/天', value: 'monthly_codex110' },
  { label: '终身使用', value: 'lifetime' },
  { label: '试用中', value: 'trial' },
  { label: '[旧版] 周度体验', value: 'weekly', disabled: true },
  { label: '[旧版] 月度订阅', value: 'monthly', disabled: true },
  { label: '[旧版] 年度订阅', value: 'yearly', disabled: true }
];

const defaultDialogForm = () => ({
  id: 0,
  name: '',
  phone: '',
  email: '',
  status: 'active',
  subscription_plan: 'trial',
  subscription_expires_at: '',
  trial_expires_at: '',
  reward_balance: 0,
  total_rewards: 0,
  dev_invite_code: '',
  regenerate_invite_code: false
});

const dialog = reactive({
  visible: false,
  title: '新增开发者',
  loading: false,
  form: defaultDialogForm(),
  rules: {
    name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
    phone: [
      {
        validator: (_: any, value: string, callback: (error?: Error) => void) => {
          if (!value) {
            callback();
            return;
          }
          if (/^1[3-9]\d{9}$/.test(value)) {
            callback();
          } else {
            callback(new Error('请输入有效的11位手机号'));
          }
        },
        trigger: 'blur'
      }
    ],
    email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }]
  }
});

const summaryStats = reactive({
  active: 0,
  trial: 0,
  lifetime: 0,
  expired: 0
});

const rewardBalanceTotal = ref(0);

const planGradients: Record<string, [string, string]> = {
  daily_codex50: ['#4facfe', '#00f2fe'],
  monthly_codex50: ['#a18cd1', '#fbc2eb'],
  monthly_codex110: ['#ff9a9e', '#fad0c4'],
  weekly: ['#4facfe', '#00f2fe'],
  monthly: ['#a18cd1', '#fbc2eb'],
  yearly: ['#5ee7df', '#b490ca'],
  lifetime: ['#fad961', '#f76b1c'],
  trial: ['#ff9a9e', '#fecfef'],
  default: ['#1f1c2c', '#928dab']
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleString();
};

const planLabels: Record<string, string> = {
  daily_codex50: '日度订阅 · Codex50',
  monthly_codex50: '月度订阅 · Codex50/天',
  monthly_codex110: '月度订阅 · Codex110/天',
  weekly: '周度体验（旧版）',
  monthly: '月度订阅（旧版）',
  yearly: '年度订阅（旧版）',
  lifetime: '终身使用',
  trial: '试用中'
};

const getPlanLabel = (plan?: string | null) => {
  if (!plan) return '未激活';
  return planLabels[plan] || plan;
};

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isFuture = (value?: string | null) => {
  const date = parseDate(value);
  if (!date) return false;
  return date.getTime() > Date.now();
};

const getSubscriptionStatusValue = (row: DeveloperItem) => {
  if (row.dev_subscription_plan === 'lifetime') return 'lifetime';
  if (isFuture(row.dev_subscription_expires_at)) return 'active';
  if (isFuture(row.dev_trial_expires_at)) return 'trial';
  return 'expired';
};

const getSubscriptionStatus = (row: DeveloperItem) => {
  const value = getSubscriptionStatusValue(row);
  switch (value) {
    case 'lifetime':
      return { label: '终身', type: 'success' as const };
    case 'active':
      return { label: '已订阅', type: 'success' as const };
    case 'trial':
      return { label: '试用中', type: 'warning' as const };
    default:
      return { label: '已过期', type: 'info' as const };
  }
};

const planGradientStyle = (plan?: string | null) => {
  const palette = plan ? planGradients[plan] || planGradients.default : planGradients.default;
  return {
    background: `linear-gradient(120deg, ${palette[0]}, ${palette[1]})`
  };
};

const countdownText = (value?: string | null) => {
  if (!value) return '-';
  const end = parseDate(value);
  if (!end) return '-';
  const diff = end.getTime() - Date.now();
  if (diff <= 0) return '已到期';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) {
    return `${days} 天`;
  }
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 0) {
    return `${hours} 小时`;
  }
  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes} 分钟`;
};

const formatLoginPlatform = (value?: string | null) => {
  if (!value) return '未记录';
  const normalized = value.toLowerCase();
  if (normalized.includes('wechat')) return '微信授权';
  if (normalized.includes('apple')) return 'Apple ID 登录';
  if (normalized.includes('email')) return '邮箱验证码登录';
  if (normalized.includes('portal')) return 'Web 控制台';
  if (normalized.includes('dev_app') || normalized.includes('terminal')) return '终端 App';
  return value;
};

const loginChannelMeta = (row: DeveloperItem) => {
  if (row.apple_user_identifier) {
    return { label: 'Apple ID', type: 'apple' } as const;
  }
  const platform = (row.last_login_platform || '').toLowerCase();
  if (platform.includes('wechat')) {
    return { label: '微信', type: 'wechat' } as const;
  }
  if (platform.includes('email')) {
    return { label: '邮箱验证码', type: 'email' } as const;
  }
  if (platform.includes('portal')) {
    return { label: 'Web 控制台', type: 'web' } as const;
  }
  if (platform.includes('dev_app') || platform.includes('terminal')) {
    return { label: '终端 App', type: 'app' } as const;
  }
  return { label: '未知渠道', type: 'default' } as const;
};

const abbreviateAppleId = (value?: string | null) => {
  if (!value) return '-';
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
};

const copyInviteCode = async (code?: string | null) => {
  if (!code) {
    ElMessage.warning('该开发者暂无邀请码');
    return;
  }
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(code);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    ElMessage.success('邀请码已复制');
  } catch (error) {
    ElMessage.error('复制失败，请手动复制');
  }
};

const filterApplied = computed(() =>
  Boolean(
    queryParams.keyword ||
      queryParams.status ||
      queryParams.subscription_plan ||
      queryParams.subscription_status
  )
);

const tableEmptyText = computed(() =>
  filterApplied.value ? '未找到符合筛选条件的开发者' : '暂无开发者，请先创建或同步数据'
);

const applySummary = (payload?: DeveloperListSummary | null) => {
  summaryStats.active = payload?.active ?? 0;
  summaryStats.trial = payload?.trial ?? 0;
  summaryStats.expired = payload?.expired ?? 0;
  summaryStats.lifetime = payload?.lifetime ?? 0;
  rewardBalanceTotal.value = Number(payload?.reward_balance_sum ?? 0);
};

const loadDevelopers = async () => {
  loading.value = true;
  try {
    const { data, total, current_page, per_page, last_page, summary } = await fetchDevelopers(queryParams);
    developers.value = data;
    pagination.total = total;
    pagination.page = current_page;
    pagination.pageSize = per_page;
    pagination.lastPage = last_page;
    queryParams.page = current_page;
    queryParams.pageSize = per_page;
    applySummary(summary);
  } catch (error: any) {
    ElMessage.error(error?.message || '加载开发者列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  queryParams.page = 1;
  pagination.page = 1;
  loadDevelopers();
};

const resetQuery = () => {
  queryParams.keyword = '';
  queryParams.status = '';
  queryParams.subscription_status = '';
  queryParams.subscription_plan = '';
  handleSearch();
};

const handleSizeChange = (size: number) => {
  queryParams.pageSize = size;
  queryParams.page = 1;
  pagination.page = 1;
  pagination.pageSize = size;
  loadDevelopers();
};

const handlePageChange = (page: number) => {
  queryParams.page = page;
  pagination.page = page;
  loadDevelopers();
};

const openCreateDialog = () => {
  dialog.title = '新增开发者';
  resetDialogForm();
  dialog.visible = true;
};

const handleEdit = (row: DeveloperItem) => {
  dialog.title = '编辑开发者';
  resetDialogForm();
  dialog.form.id = row.id;
  dialog.form.name = row.name;
  dialog.form.phone = row.phone;
  dialog.form.email = row.email || '';
  dialog.form.status = row.status === 1 ? 'active' : 'disabled';
  dialog.form.subscription_plan = row.dev_subscription_plan || 'trial';
  dialog.form.subscription_expires_at = row.dev_subscription_expires_at || '';
  dialog.form.trial_expires_at = row.dev_trial_expires_at || '';
  dialog.form.reward_balance = Number(row.dev_reward_balance || 0);
  dialog.form.total_rewards = Number(row.dev_total_rewards || 0);
  dialog.form.dev_invite_code = row.dev_invite_code || '';
  dialog.form.regenerate_invite_code = false;
  dialog.visible = true;
};

const submitDialog = async () => {
  if (!dialogFormRef.value) {
    return;
  }
  await dialogFormRef.value.validate(async (valid) => {
    if (!valid) {
      return;
    }
    dialog.loading = true;
    try {
      const isEdit = dialog.form.id > 0;
      const payload = buildPayload(isEdit);
      if (isEdit) {
        await updateDeveloper(dialog.form.id, payload);
        ElMessage.success('开发者信息更新成功');
      } else {
        await createDeveloper(payload);
        ElMessage.success('开发者创建成功');
      }
      dialog.visible = false;
      loadDevelopers();
    } catch (error: any) {
      ElMessage.error(error?.message || '保存失败，请稍后重试');
    } finally {
      dialog.loading = false;
    }
  });
};

const toggleStatus = async (row: DeveloperItem) => {
  const action = row.status === 1 ? '禁用' : '启用';
  try {
    await ElMessageBox.confirm(`确认要${action}开发者「${row.name || row.phone}」吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '确认',
      cancelButtonText: '取消'
    });
    await toggleDeveloperStatus(row.id, row.status !== 1);
    ElMessage.success(`${action}成功`);
    loadDevelopers();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || `${action}失败，请稍后重试`);
    }
  }
};

const refreshList = () => {
  loadDevelopers();
};

const isEditMode = computed(() => dialog.form.id > 0);
const isLifetimePlan = computed(() => dialog.form.subscription_plan === 'lifetime');

const handlePlanChange = (value: string) => {
  if (value === 'lifetime') {
    dialog.form.subscription_expires_at = '';
  }
};

const resetDialogForm = () => {
  Object.assign(dialog.form, defaultDialogForm());
};

const buildPayload = (includeSubscription: boolean): DeveloperPayload => {
  const payload: DeveloperPayload = {
    name: dialog.form.name,
    phone: dialog.form.phone,
    email: dialog.form.email,
    status: dialog.form.status
  };

  if (includeSubscription) {
    payload.subscription_plan = dialog.form.subscription_plan || null;
    if (dialog.form.subscription_plan === 'lifetime') {
      payload.subscription_expires_at = null;
    } else {
      payload.subscription_expires_at = dialog.form.subscription_expires_at || null;
    }

    payload.trial_expires_at = dialog.form.trial_expires_at || null;

    if (dialog.form.reward_balance !== undefined && dialog.form.reward_balance !== null) {
      payload.reward_balance = Number(dialog.form.reward_balance);
    }

    if (dialog.form.total_rewards !== undefined && dialog.form.total_rewards !== null) {
      payload.total_rewards = Number(dialog.form.total_rewards);
    }

    if (dialog.form.regenerate_invite_code) {
      payload.regenerate_invite_code = true;
    }
  }

  return payload;
};

onMounted(() => {
  loadDevelopers();
});
</script>

<style scoped lang="scss">
.developers-page {
  .page-header {
    margin-bottom: 20px;
  }

  .developers-table {
    .developer-name {
      display: flex;
      align-items: center;

      .name-info {
        display: flex;
        flex-direction: column;

        .name-text {
          font-weight: 600;
        }

        .name-sub {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }

  .pagination-wrapper {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .subscription-summary {
    margin-bottom: 20px;

    .summary-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .summary-title {
        font-size: 16px;
        font-weight: 600;
      }

      .summary-desc {
        margin: 4px 0 0;
        color: var(--el-text-color-secondary);
        font-size: 13px;
      }
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }

    .summary-item {
      background: var(--el-fill-color-lighter);
      border-radius: 10px;
      padding: 12px 16px;
      text-align: center;

      .summary-label {
        margin: 0;
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }

      .summary-value {
        margin: 4px 0 0;
        font-size: 20px;
        font-weight: 600;
      }
    }
  }

  .subscription-status {
    display: flex;
    align-items: center;
    gap: 6px;

    .plan-name {
      font-weight: 500;
    }
  }

  .subscription-countdown {
    font-size: 12px;
    color: var(--el-text-color-secondary);

    .label {
      margin-right: 4px;
    }
  }

  .invite-code {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .reward-info {
    font-size: 12px;
    color: var(--el-text-color-secondary);

    .divider {
      margin: 0 4px;
    }
  }

  .channel-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .channel-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 500;
    background: var(--el-fill-color-lighter);
    width: fit-content;

    &.is-apple {
      background: #111;
      color: #fff;
    }

    &.is-wechat {
      background: rgba(58, 186, 108, 0.15);
      color: #18a058;
    }

    &.is-email {
      background: rgba(64, 158, 255, 0.15);
      color: #409eff;
    }

    &.is-web {
      background: rgba(147, 112, 219, 0.15);
      color: #7c3aed;
    }

    &.is-app {
      background: rgba(14, 165, 233, 0.15);
      color: #0284c7;
    }

    &.is-default {
      color: var(--el-text-color-regular);
    }
  }

  .channel-meta {
    font-size: 12px;
    color: var(--el-text-color-secondary);

    &.muted {
      color: var(--el-text-color-disabled);
    }
  }
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
}

.plan-card {
  border-radius: 14px;
  padding: 12px 14px;
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  transition: transform 0.2s ease;
}

.plan-card:hover {
  transform: translateY(-1px);
}

.plan-card__meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.plan-card__countdown,
.plan-card__expires {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
}

.plan-card__countdown .label {
  color: rgba(255, 255, 255, 0.7);
}

.plan-card__meta-extra {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.78);
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  padding-top: 6px;
}
</style>
