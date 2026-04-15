<template>
  <div class="install-booking">
    <!-- 加载状态 -->
    <div class="loading-container" v-if="isLoading">
      <van-loading size="24px" vertical>加载中...</van-loading>
    </div>

    <!-- 登录提示 (显示条件: 非加载中 且 未登录) -->
    <div class="login-container" v-else-if="!isLoading && !isLoggedIn">
      <div class="login-card">
        <div class="login-title">欢迎使用净水器预约安装</div>
        <div class="login-subtitle">请先登录后继续操作</div>
        <van-image
          width="100"
          height="100"
          src="/app/images/logo.png"
          class="logo"
        />
        <van-button
          type="primary"
          block
          icon="wechat"
          color="#07c160"
          class="wechat-login-btn"
          @click="handleWechatLogin"
        >
          微信一键登录
        </van-button>
      </div>
    </div>

    <!-- 预约表单 (显示条件: 非加载中 且 已登录) -->
    <div class="booking-container" v-else-if="!isLoading && isLoggedIn">
      <!-- 顶部邀请信息 -->
      <div class="hero-card card-shadow">
        <div class="hero-title-row">
          <div>
            <div class="hero-title">净水器预约安装</div>
            <div class="hero-subtitle">3 步完成 · 官方工程师上门</div>
          </div>
          <div class="hero-pill">受邀</div>
        </div>
        <div class="hero-tags">
          <span class="hero-tag">支付分 &gt; {{ depositPolicy.pay_score_threshold || 600 }} 免押</span>
          <span class="hero-tag">微信填表</span>
          <span class="hero-tag">预约到家</span>
        </div>
        <div v-if="referrerInfo.id" class="hero-referrer">
          <van-image
            v-if="referrerInfo.avatar"
            round
            width="32"
            height="32"
            :src="referrerInfo.avatar"
            fit="cover"
          />
          <div class="referrer-fallback" v-else>
            <van-icon name="user-circle-o" size="18" />
          </div>
          <div class="referrer-meta">
            <span class="referrer-name">{{ referrerInfo.name || '认证顾问' }}</span>
            <span class="referrer-id">ID {{ referrerInfo.id }}</span>
          </div>
        </div>
      </div>

      <!-- 三步提示 -->
      <div class="booking-steps">
        <div
          v-for="(step, index) in quickSteps"
          :key="step.title"
          class="step-chip"
        >
          <span class="step-index">{{ index + 1 }}</span>{{ step.title }}
        </div>
      </div>

      <!-- 计费计划选择 -->
      <div class="package-section card-shadow">
        <div class="section-title">选择扣费计划</div>
        <div class="plan-loading" v-if="planLoading">
          <van-loading size="20px" type="spinner">加载计划...</van-loading>
        </div>
        <div class="plan-grid" v-else>
          <van-radio-group v-model="selectedPlanKey">
            <div
              v-for="plan in planOptions"
              :key="plan.key"
              class="plan-item"
              :class="{ active: plan.key === selectedPlanKey }"
              @click="selectedPlanKey = plan.key"
            >
              <div class="plan-accent" :class="{ active: plan.key === selectedPlanKey }"></div>
              <div class="plan-inner">
                <div class="plan-top">
                  <div class="plan-item-header">
                    <div class="plan-name-stack">
                      <div class="plan-name">{{ getPlanTitle(plan) }}</div>
                      <div class="plan-subtitle" v-if="getPlanSubtitle(plan)">{{ getPlanSubtitle(plan) }}</div>
                    </div>
                    <div class="plan-rate">{{ formatPlanRate(plan) }}</div>
                  </div>
                  <van-radio
                    class="plan-radio"
                    :name="plan.key"
                    icon-size="18px"
                    checked-color="#1989fa"
                    @click.stop="selectedPlanKey = plan.key"
                  />
                </div>
                <div class="plan-desc">{{ plan.description }}</div>
                <div class="plan-meta">
                  <span class="plan-chip">{{ formatPlanCycle(plan) }}</span>
                  <span class="plan-chip" v-if="getPlanTypeLabel(plan)">{{ getPlanTypeLabel(plan) }}</span>
                  <span class="plan-chip" v-if="plan.upfront_amount">包年 ¥{{ plan.upfront_amount }}</span>
                </div>
              </div>
            </div>
          </van-radio-group>
          <van-empty v-if="!planOptions.length" description="暂无可用计划" />
        </div>
      </div>

      <!-- 安装信息填写 -->
      <div class="installation-form">
        <div class="section-title">安装信息</div>
        <van-form @submit="onSubmit">
          <van-cell-group inset class="form-group card-shadow">
            <van-field
              v-model="form.name"
              name="name"
              label="联系人"
              placeholder="请输入联系人姓名"
              :rules="[{ required: true, message: '请填写联系人姓名' }]"
            />
            <van-field
              v-model="form.phone"
              name="phone"
              label="手机号码"
              type="tel"
              placeholder="请输入手机号码"
              :rules="[
                { required: true, message: '请填写手机号码' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
              ]"
            />
            <van-field
              v-model="form.address"
              rows="2"
              autosize
              name="address"
              label="安装地址"
              type="textarea"
              placeholder="请输入详细安装地址"
              :rules="[{ required: true, message: '请填写安装地址' }]"
            >
              <template #button>
                <van-button size="small" type="primary" @click="chooseWxAddress" :loading="loadingAddress">
                  <van-icon name="location-o" style="margin-right: 2px;" />
                  微信地址
                </van-button>
              </template>
              <template #extra v-if="addressError">
                <div class="address-error-tip" @click="showAddressHelp">
                  <van-icon name="question-o" style="margin-right: 2px; color: #ff976a;" />
                  <span style="color: #ff976a; font-size: 12px;">地址选择失败？</span>
                </div>
              </template>
            </van-field>
            <van-field
              readonly
              clickable
              name="datetimePicker"
              :model-value="formattedInstallTimeDisplay"
              label="预约时间"
              placeholder="点击选择安装时间"
              right-icon="calendar-o"
              @click="showDatePicker = true"
              :rules="[{ required: true, message: '请选择安装时间' }]"
            />
            <van-field
              v-model="form.remarks"
              rows="2"
              autosize
              name="remarks"
              label="备注"
              type="textarea"
              placeholder="安装备注信息（选填）"
            />
          </van-cell-group>

          <!-- 费用概览 -->
          <div class="cost-insight card-shadow">
            <div class="cost-chip">费用预估</div>
            <div class="cost-grid">
              <div class="cost-item">
                <span class="label">基础安装费</span>
                <span class="value">¥{{ installationFee.toFixed(2) }}</span>
              </div>
              <div class="cost-item deposit-item">
                <div class="deposit-head">
                  <span class="label">预计押金</span>
                  <span class="value" :class="{ highlight: depositPreview === 0 }">
                    ¥{{ depositPreview.toFixed(2) }}
                  </span>
                </div>
                <div class="pay-score-inline">
                  <div class="pay-score-copy">
                    <span class="pay-score-label">
                      {{ isFlatPlan ? '包年计划自动免押金' : '填写微信支付分' }}
                    </span>
                    <span class="pay-score-tip" v-if="!isFlatPlan">
                      &gt;{{ depositPolicy.pay_score_threshold || 600 }} 自动免押金
                    </span>
                    <span class="pay-score-tip" v-else>无需填写支付分，直接提交即可</span>
                  </div>
                  <div class="pay-score-controls" v-if="!isFlatPlan">
                    <input
                      class="pay-score-input"
                      v-model="payScoreInput"
                      type="tel"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      maxlength="4"
                      placeholder="请输入支付分"
                    />
                    <button type="button" class="pay-score-guide" @click="payScoreGuideVisible = true">
                      <van-icon name="question-o" /> 如何获取？
                    </button>
                  </div>
                  <div class="pay-score-annual-tip" v-else>
                    <van-icon name="passed" /> 包年支付 ¥{{ selectedPlan?.upfront_amount || selectedPlan?.billing_rate }}，押金自动减免
                  </div>
                </div>
              </div>
              <div class="cost-item">
                <span class="label">{{ selectedPlan?.plan_type === 'flat' ? '包年费用' : '计费单价' }}</span>
                <span class="value">
                  <template v-if="selectedPlan?.plan_type === 'flat'">
                    ¥{{ (selectedPlan?.upfront_amount || 0).toFixed(2) }}
                  </template>
                  <template v-else>
                    {{ selectedPlan?.billing_rate || '--' }} 元/{{ selectedPlan?.billing_unit || 'L' }}
                  </template>
                </span>
              </div>
              <div class="cost-item">
                <span class="label">支付分</span>
                <span class="value">{{ parsedPayScore ?? '未填写' }}</span>
              </div>
            </div>
            <div class="cost-highlight" :class="{ success: depositPreview === 0 }">
              <van-icon :name="isFlatPlan ? 'award-o' : depositPreview === 0 ? 'smile-o' : 'shield-o'" />
              <span v-if="isFlatPlan">包年计划已免押金，直接支付 ¥{{ selectedPlan?.upfront_amount || selectedPlan?.billing_rate }} 即可</span>
              <span v-else-if="depositPreview === 0">已满足免押金条件，提交后仅支付安装费</span>
              <span v-else>支付分 &gt; {{ depositPolicy.pay_score_threshold || 600 }} 可免押金</span>
            </div>
            <div class="cost-note">
              实际扣费以微信支付分校验结果为准，预约成功后将在公众号中推送支付通知。
            </div>
          </div>

          <!-- 悬浮提交区域 -->
          <div class="floating-submit card-shadow">
            <div class="floating-info">
              <div class="label">预计首付</div>
              <div class="value">¥{{ totalPreview.toFixed(2) }}</div>
              <div class="sub">
                安装费 ¥{{ installationFee.toFixed(2) }} · 押金 ¥{{ depositPreview.toFixed(2) }}
              </div>
            </div>
            <van-button
              round
              type="primary"
              native-type="submit"
              color="#1989fa"
              :loading="submitting"
            >
              确认预约
            </van-button>
          </div>
        </van-form>
      </div>
    </div>

    <!-- 时间选择 -->
    <div class="time-picker-simplified">
      <van-popup v-model:show="showDatePicker" position="bottom" round>
        <!-- 使用 PickerGroup 替代手动实现的工具栏和布局 -->
        <van-picker-group
          title="选择安装时间"
          :tabs="['选择日期', '选择时间']"
          next-step-text="下一步"
          @confirm="onPickerConfirm"
          @cancel="onPickerCancel"
        >
          <van-picker
            :columns="dateColumns"
            @change="onDateColumnChange"
            :default-index="0"
            item-height="44"
            visible-item-count="5"
            swipe-duration="300"
          />
          <van-picker
            :columns="timeColumns"
            @change="onTimeColumnChange"
            :default-index="0"
            item-height="44"
            visible-item-count="5"
            swipe-duration="300"
          />
        </van-picker-group>
      </van-popup>
    </div>

    <van-popup
      v-model:show="payScoreGuideVisible"
      position="bottom"
      round
      :style="{ height: '55%' }"
    >
      <div class="guide-sheet">
        <div class="guide-header">如何查看微信支付分</div>
        <div class="guide-body">
          <div class="guide-step" v-for="(step, index) in payScoreGuideSteps" :key="index">
            <div class="guide-step-index">{{ index + 1 }}</div>
            <div>
              <div class="guide-step-title">{{ step.title }}</div>
              <div class="guide-step-desc">{{ step.desc }}</div>
            </div>
          </div>
        </div>
        <div class="guide-footer">
          <van-button type="primary" block @click="payScoreGuideVisible = false">我已了解</van-button>
        </div>
      </div>
    </van-popup>

    <!-- 调试信息 -->
    <div v-if="false" class="debug-info" style="margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 8px;">
      <div><strong>表单字段值：</strong> {{ form.installTime }}</div>
      <div><strong>格式化显示值：</strong> {{ formattedInstallTimeDisplay }}</div>
      <div><strong>选中日期：</strong> {{ selectedDate }}</div>
      <div><strong>选中时间：</strong> {{ selectedTime }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast, showSuccessToast, showDialog, closeToast, Toast, Form as VanForm, Field as VanField, CellGroup as VanCellGroup, Button as VanButton, RadioGroup as VanRadioGroup, Radio as VanRadio, Popup as VanPopup, Picker as VanPicker, Loading as VanLoading, Image as VanImage, Icon as VanIcon, PickerGroup, Tag as VanTag, Empty as VanEmpty } from 'vant';
import { useUserStore } from '@/stores/user';
import { getWechatLoginUrl } from '@/api/user';
import { formatDate, getCurrentDate, getRelativeDate } from '@/utils/date';
import { logWechatAddress, LogLevel } from '@/utils/logger';
import installationApi from '@/api/installation';

const route = useRoute();
const router = useRouter();

const repairBrokenReferrerRoute = async () => {
  const rawPath = route.path || '';
  if (rawPath.includes('bookingreferrer_id')) {
    const match = rawPath.match(/bookingreferrer_id=([^/]+)/i);
    const referrerId = match ? match[1] : '';
    const nextQuery = { ...route.query };
    if (referrerId && !nextQuery.referrer_id) {
      nextQuery.referrer_id = referrerId;
    }
    await router.replace({
      path: '/installation/booking',
      query: nextQuery
    });
    return true;
  }
  return false;
};

const autoWechatLoginTriggered = ref(false);

const shouldAutoTriggerWechatLogin = () => {
  if (autoWechatLoginTriggered.value) {
    return false;
  }
  if (isLoggedIn.value) {
    return false;
  }
  if (!route.query.referrer_id) {
    return false;
  }
  if (typeof navigator === 'undefined') {
    return false;
  }
  return /MicroMessenger/i.test(navigator.userAgent || '');
};

const triggerAutoWechatLogin = () => {
  if (!shouldAutoTriggerWechatLogin()) {
    return;
  }
  autoWechatLoginTriggered.value = true;
  // 稍作延迟，避免阻塞页面首屏渲染
  setTimeout(() => {
    handleWechatLogin();
  }, 600);
};
const userStore = useUserStore();

// 新增：加载状态
const isLoading = ref(true);

// 用户状态
const isLoggedIn = computed(() => userStore.isLoggedIn);
const userInfo = computed(() => {
  const user = userStore.userInfo || {};
  console.log('[Booking] Computed userInfo - START');
  console.log('[Booking] Computed userInfo - userStore.userInfo received:', JSON.parse(JSON.stringify(user)));

  // 简化头像处理：直接使用 avatar，因为回调中已标准化
  let rawAvatar = user.avatar;
  console.log('[Booking] Computed userInfo - Raw user.avatar:', rawAvatar);
  let avatar = rawAvatar || '/app/images/profile/default-avatar.png';
  // console.log('[Booking] Computed userInfo - Final avatar (after default):', avatar);

  // --- 最终检查和修复 avatar ---
  if (avatar && typeof avatar === 'string' && !avatar.startsWith('http') && !avatar.startsWith('/')) {
      // 再次确保非 / 开头的相对路径添加斜杠
      avatar = '/' + avatar;
      console.log('[Booking] Computed userInfo - Final Check: Repaired relative avatar:', avatar);
  }
  if (avatar && typeof avatar === 'string' && avatar.startsWith('http:')) {
      // 再次确保 http 转 https
      avatar = avatar.replace('http:', 'https:');
      console.log('[Booking] Computed userInfo - Final Check: Repaired http avatar:', avatar);
  }
  console.log('[Booking] Computed userInfo - Final Check: Final avatar value before return:', avatar);
  // --- 结束最终检查 ---

  const finalUserInfo = {
    ...user,
    avatar: avatar, // 使用最终检查后的 avatar
    nickname: user.nickname || user.name || user.wechat_nickname || '用户'
  };
  console.log('[Booking] Computed userInfo - final user info to return:', JSON.parse(JSON.stringify(finalUserInfo))); // 添加日志
  console.log('[Booking] Computed userInfo - END');
  return finalUserInfo;
});

// 推荐人信息
const referrerInfo = reactive({
  id: '',
  name: '',
  avatar: '',
  username: '',
  nickname: ''
});

// 扣费计划
const quickSteps = [
  { title: '填写信息' },
  { title: '选择计划' },
  { title: '确认预约' }
]

const payScoreGuideVisible = ref(false)
const payScoreGuideSteps = [
  { title: '打开微信 > 我 > 服务', desc: '滚动到底部点击“钱包”进入支付中心' },
  { title: '进入“支付分”', desc: '首次使用需完成官方授权，按提示实名验证' },
  { title: '查看分值', desc: '支付分大于 600 即可免押金，记下分数填入本页面' }
]

const planOptions = ref([
  {
    key: 'daily_pay_per_liter',
    label: '每日扣费 · 0.35元/升',
    description: '按实际用量每日结算，适合家庭与轻度商用场景',
    billing_cycle: 'daily',
    billing_unit: 'L',
    billing_rate: 0.35,
    plan_type: 'metered',
    upfront_amount: 0
  },
  {
    key: 'weekly_pay_per_liter',
    label: '每周扣费 · 0.40元/升',
    description: '周度集中扣费，方便核对费用明细',
    billing_cycle: 'weekly',
    billing_unit: 'L',
    billing_rate: 0.40,
    plan_type: 'metered',
    upfront_amount: 0
  },
  {
    key: 'annual_unlimited',
    label: '包年不限量 · 1500元/年',
    description: '一年不限流量，高频用水或门店优选',
    billing_cycle: 'annual',
    billing_unit: 'year',
    billing_rate: 1500,
    plan_type: 'flat',
    upfront_amount: 1500
  }
]);
const selectedPlanKey = ref(planOptions.value[0]?.key || 'daily_pay_per_liter');
const planLoading = ref(false);
const hasFetchedPlans = ref(false);
const getPlanTitle = (plan) => {
  if (!plan?.label) return '';
  return plan.label.split('·')[0].trim();
};
const getPlanSubtitle = (plan) => {
  if (!plan?.label) return '';
  const parts = plan.label.split('·');
  return parts.slice(1).join('·').trim();
};
const getPlanTypeLabel = (plan) => {
  if (!plan) return '';
  if (plan.plan_type === 'flat') return '包年不限量';
  return '按量扣费';
};
const depositPolicy = ref({
  amount: 999,
  pay_score_threshold: 600
});
const installationFee = ref(120);
const payScoreInput = ref('');
const parsedPayScore = computed(() => {
  const value = Number(payScoreInput.value);
  return Number.isFinite(value) ? value : null;
});
const selectedPlan = computed(() => {
  return planOptions.value.find(plan => plan.key === selectedPlanKey.value) || planOptions.value[0] || null;
});
const isFlatPlan = computed(() => selectedPlan.value?.plan_type === 'flat');
const depositPreview = computed(() => {
  const policy = depositPolicy.value;
  if (!policy) return 0;
  if (isFlatPlan.value) {
    return 0;
  }
  const threshold = policy.pay_score_threshold || 0;
  const score = parsedPayScore.value;
  if (score !== null && threshold && score > threshold) {
    return 0;
  }
  return Number(policy.amount || 0);
});
const totalPreview = computed(() => {
  const upfront = selectedPlan.value?.upfront_amount || 0;
  return Number((depositPreview.value + installationFee.value + upfront).toFixed(2));
});

const formatPlanRate = (plan) => {
  if (!plan) return '--';
  if (plan.plan_type === 'metered' && plan.billing_rate) {
    return `${plan.billing_rate}元/${plan.billing_unit || 'L'}`;
  }
  if (plan.plan_type === 'flat') {
    return `${plan.upfront_amount || plan.billing_rate}元/年`;
  }
  return '自定义';
};

const formatPlanCycle = (plan) => {
  if (!plan) return '按需结算';
  if (plan.plan_type === 'metered') {
    return plan.billing_cycle === 'weekly' ? '每周结算' : '每日结算';
  }
  if (plan.plan_type === 'flat') {
    return '包年结算';
  }
  return '按需结算';
};

// 表单数据
const form = reactive({
  name: '',
  phone: '',
  address: '',
  installTime: '',
  remarks: '',
});

// 提交状态
const submitting = ref(false);

// 地址选择状态
const loadingAddress = ref(false);
const addressError = ref(false);

// 简化的日期时间选择器
const showDatePicker = ref(false);
const selectedDate = ref('');
const selectedTime = ref('');

// 生成日期选项 - 未来14天
const generateDateOptions = () => {
  const options = [];
  for (let i = 1; i <= 14; i++) {
    // 这里使用自定义日期格式
    const d = new Date();
    d.setDate(d.getDate() + i);

    // 格式化为M月D日
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const displayDate = `${month}月${day}日`;

    // 格式化为YYYY-MM-DD
    const year = d.getFullYear();
    const monthStr = String(month).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const valueDate = `${year}-${monthStr}-${dayStr}`;

    options.push({
      text: i === 1 ? `明天 (${displayDate})` :
            i === 2 ? `后天 (${displayDate})` : displayDate,
      value: valueDate
    });
  }
  return options;
};

// 生成时间选项 - 9点到17点
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 9; hour <= 17; hour++) {
    options.push({
      text: `${hour}:00`,
      value: `${hour < 10 ? '0' + hour : hour}:00`
    });
    if (hour < 17) {
      options.push({
        text: `${hour}:30`,
        value: `${hour < 10 ? '0' + hour : hour}:30`
      });
    }
  }
  return options;
};

const dateColumns = ref(generateDateOptions());
const timeColumns = ref(generateTimeOptions());

// 列变化处理 - 修正：change 事件第一个参数是选中值数组
const onDateColumnChange = (selectedValues) => {
  console.log('[Booking] Date changed:', selectedValues);
  if (selectedValues && selectedValues.length > 0) {
      selectedDate.value = selectedValues[0]; // 获取第一个（也是唯一一个）选中值
  }
};

const fetchPlanOptions = async () => {
  if (!isLoggedIn.value || planLoading.value) {
    return;
  }
  planLoading.value = true;
  try {
    const res = await installationApi.getInstallationPlans();
    if (res && res.code === 0 && res.data) {
      if (Array.isArray(res.data.plans) && res.data.plans.length) {
        planOptions.value = res.data.plans;
      }
      if (res.data.deposit) {
        depositPolicy.value = {
          amount: Number(res.data.deposit.amount ?? depositPolicy.value.amount),
          pay_score_threshold: res.data.deposit.pay_score_threshold ?? depositPolicy.value.pay_score_threshold
        };
      }
      if (res.data.installation_fee) {
        installationFee.value = Number(res.data.installation_fee);
      }
      if (planOptions.value.length && !planOptions.value.some(plan => plan.key === selectedPlanKey.value)) {
        selectedPlanKey.value = planOptions.value[0].key;
      }
    }
    hasFetchedPlans.value = true;
  } catch (error) {
    console.error('[Booking] 获取扣费计划失败', error);
    const status = error?.response?.status;
    if (error?.isAuthError || status === 401) {
      userStore.clearUserInfo();
      showToast({
        type: 'fail',
        message: '登录状态已过期，请重新登录'
      });
    }
  } finally {
    planLoading.value = false;
  }
};

const onTimeColumnChange = (selectedValues) => {
  console.log('[Booking] Time changed:', selectedValues);
   if (selectedValues && selectedValues.length > 0) {
       selectedTime.value = selectedValues[0]; // 获取第一个（也是唯一一个）选中值
   }
};

// 新增：专门用于格式化显示时间的计算属性
const formattedInstallTimeDisplay = computed(() => {
    console.log('[Booking] Computing formattedInstallTimeDisplay for value:', form.installTime);

    // 如果表单字段为空，返回空字符串
    if (!form.installTime) {
        console.log('[Booking] installTime is empty, returning empty string');
        return '';
    }

    try {
        // 对于非空值，确保格式正确
        if (typeof form.installTime !== 'string') {
            console.error('[Booking] installTime is not a string:', form.installTime);
            return String(form.installTime); // 尝试转换为字符串
        }

        if (!form.installTime.includes(' ')) {
            console.error('[Booking] Invalid installTime format (no space):', form.installTime);
            return form.installTime; // 返回原始值
        }

        // 尝试格式化时间
        const formattedValue = formatInstallTime(form.installTime);
        console.log('[Booking] Formatted install time:', formattedValue);

        // 如果格式化失败，返回原始值
        if (!formattedValue) {
            console.warn('[Booking] formatInstallTime returned empty value, using original value');
            return form.installTime;
        }

        return formattedValue;
    } catch (error) {
        console.error('[Booking] Error in formattedInstallTimeDisplay computed:', error);
        // 出错时返回原始值，确保至少有值显示
        return form.installTime || '';
    }
});

// 处理微信登录
const handleWechatLogin = async () => {
  try {
    showToast({
      message: '正在跳转微信登录...',
      duration: 0,
    });

    // 获取微信登录URL - 确保包含完整的origin和path
    const currentUrl = window.location.href;
    console.log('[Booking] Redirect URL for Wechat Login:', currentUrl);

    // 1. 生成唯一的 Key
    const redirectKey = `wx_redirect_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const referrerIdForStorage = route.query.referrer_id || localStorage.getItem('referrer_id') || '';

    // 2. 将包含 URL 和 referrer_id 的对象存储在 sessionStorage 中
    // --- 更精确地构建目标 URL ---
    const basePath = '/app/#';
    const currentRoutePath = route.path; // e.g., /install-booking
    const currentQuery = route.query; // e.g., { referrer_id: '32' }
    let queryString = '';
    if (Object.keys(currentQuery).length > 0) {
      queryString = '?' + new URLSearchParams(currentQuery).toString(); // e.g., ?referrer_id=32
    }
    const constructedUrl = `${window.location.origin}${basePath}${currentRoutePath}${queryString}`;
    console.log('[Booking] Precisely Constructed Original URL:', constructedUrl);
    // --- 结束精确构建 ---

    const storageData = {
      originalUrl: constructedUrl, // 使用精确拼接的 URL
      referrerId: referrerIdForStorage
    };
    localStorage.setItem(redirectKey, JSON.stringify(storageData)); // 改用 localStorage
    console.log(`[Booking] Stored data in localStorage with key ${redirectKey}:`, storageData);

    // 移除旧的 localStorage 存储 (如果还存在)
    localStorage.removeItem('login_redirect_url');

    // 构建回调URL - 根据环境区分路径
    const callbackBase = window.location.host.includes('pay.itapgo.com')
        ? '/app/#/user/wechat-callback'
        : '/#/user/wechat-callback';
    const callbackPath = `${callbackBase}?source=install`;

    const res = await getWechatLoginUrl({
        redirect_uri: `${window.location.origin}${callbackPath}`,
        state: redirectKey
    });

    if (res.code === 0 && res.data?.url) {
      // 在跳转前保存所有必要信息
      if (route.query.referrer_id) {
          localStorage.setItem('referrer_id', route.query.referrer_id);
          sessionStorage.setItem('referrer_id', route.query.referrer_id);
      }

      console.log('[Booking] Final Wechat login URL:', res.data.url);
      // 使用replace而不是href避免历史记录问题
      window.location.replace(res.data.url);
    } else {
      closeToast();
      showToast('获取登录链接失败，请重试');
    }
  } catch (error) {
    console.error('微信登录跳转失败', error);
    closeToast();
    showToast('登录失败，请重试');
  }
};

// 处理表单提交
const onSubmit = async () => {
  try {
    // 显示加载状态
    submitting.value = true;
    
    // 确保安装时间格式正确
    if (!form.installTime || typeof form.installTime !== 'string' || !form.installTime.includes(' ')) {
      showToast('安装时间格式错误，请重新选择');
      submitting.value = false;
      return;
    }
    
    // 格式化时间为YYYY-MM-DD HH:MM:SS格式
    let installTimeFormatted = form.installTime;
    if (!installTimeFormatted.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
      // 如果没有秒数，添加:00
      if (installTimeFormatted.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)) {
        installTimeFormatted += ':00';
      }
    }
    
    console.log('[Booking] 格式化后的安装时间:', installTimeFormatted);
    
    // 校验支付分
    if (payScoreInput.value) {
      const score = parsedPayScore.value;
      if (score === null || score > 1000) {
        showToast('请输入0-1000之间的支付分');
        submitting.value = false;
        return;
      }
    }

    // 构建预约数据
    const bookingData = {
      contact_name: form.name,
      contact_phone: form.phone,
      install_address: form.address,
      install_time: installTimeFormatted,
      package_type: selectedPlanKey.value,
      billing_plan: selectedPlanKey.value,
      remarks: form.remarks,
      referrer_id: referrerInfo.id || ''
    };
    if (parsedPayScore.value !== null) {
      bookingData.wechat_pay_score = parsedPayScore.value;
    }

    console.log('[Booking] 提交安装预约数据:', bookingData);
    
    // 调用API创建预约
    const response = await installationApi.createBookingFullPackage(bookingData);
    
    // 检查响应
    if (response && response.code === 0) {
      console.log('[Booking] 预约创建成功:', response.data);
      
      // 显示成功提示
      showSuccessToast('预约创建成功');
      
      // 跳转到支付页面
      router.push({
        path: `/installation/payment/${response.data.booking_id}`,
        query: {
          amount: response.data.total_amount
        }
      });
    } else {
      console.error('[Booking] 预约创建失败:', response);
      showToast(response.message || '预约创建失败，请重试');
    }
  } catch (error) {
    console.error('[Booking] 提交预约异常:', error);
    
    // 检查是否是登录状态异常
    if (error.message && error.message.includes('登录状态异常')) {
      showToast('登录状态已过期，请重新登录后再试');
      // 延迟跳转到登录页
      setTimeout(() => {
        router.replace('/login');
      }, 2000);
    } else {
      showToast(error.message || '网络异常，请稍后重试');
    }
  } finally {
    submitting.value = false;
  }
};

// 获取套餐名称
const getPackageName = (type) => {
  const packagesMap = {
    'personal': '个人/企业套餐 (¥980)',
    'unlimited': '无限畅饮套餐 (¥1200)',
    'business_year': '商务机包年套餐 (¥2400)',
    'business_flow': '商务机流量套餐 (¥3700)'
  };
  return packagesMap[type] || '未知套餐';
};

// 获取推荐人ID (简化，只获取ID，不调用API)
const getReferrerIdFromUrlOrStorage = () => {
    const queryReferrerId = route.query.referrer_id;
    const storedReferrerId = localStorage.getItem('referrer_id');
    const finalReferrerId = queryReferrerId || storedReferrerId;
    console.log(`[Booking] getReferrerId - query: ${queryReferrerId}, storage: ${storedReferrerId}, final: ${finalReferrerId}`);
    if (finalReferrerId && storedReferrerId) {
        localStorage.removeItem('referrer_id'); // 清理旧的 storage
    }
    referrerInfo.id = finalReferrerId || ''; // 更新 referrerInfo.id
    return finalReferrerId;
};

// 获取推荐人信息 API 调用
const fetchReferrerInfo = async (referrerId) => {
  if (!referrerId) return;
  referrerInfo.name = '';
  referrerInfo.avatar = '';
  try {
    // 动态拼接API路径，兼容生产环境
    let referrerApiUrl = `/api/user/get_referrer_info.php?referrer_id=${referrerId}`;
    if (window.location.hostname === 'pay.itapgo.com') {
      referrerApiUrl = `/Tapp/admin/api/user/get_referrer_info.php?referrer_id=${referrerId}`;
    }
    let headers = { 'Authorization': `Bearer ${userStore.token}` };
    let res = await fetch(referrerApiUrl, { headers }).then(response => response.json());
    if (res.code === 0 && res.data) {
      const name = res.data.nickname || `用户${referrerId}`;
      let avatar = res.data.avatar || res.data.wechat_avatar || '/app/images/profile/default-avatar.png';
      referrerInfo.name = name;
      referrerInfo.avatar = avatar;
    } else {
      referrerInfo.name = `用户${referrerId}`;
      referrerInfo.avatar = '/app/images/profile/default-avatar.png';
    }
  } catch (error) {
    referrerInfo.name = `用户${referrerId}`;
    referrerInfo.avatar = '/app/images/profile/default-avatar.png';
  }
};

// 初始化页面（只包含登录后需要执行的操作）
const initializeLoggedInPage = () => {
    console.log('[Booking] Initializing logged-in page...');
    // 填充表单
    if (userInfo.value) {
        form.name = userInfo.value.name || userInfo.value.nickname || '';
        form.phone = userInfo.value.phone || '';
        console.log('[Booking] Form pre-filled:', form.name, form.phone);
    }
    // 获取推荐人信息 (确保 referrerInfo.id 已被设置)
    if (referrerInfo.id) {
        console.log('[Booking] Fetching referrer info for ID (logged in):', referrerInfo.id);
        fetchReferrerInfo(referrerInfo.id);
    }
};

// 新增：检查认证状态并加载页面
const checkAuthAndLoad = async () => {
    console.log('[Booking] checkAuthAndLoad started.');
    isLoading.value = true;
    let isAuthenticated = false;
    const token = userStore.token || localStorage.getItem('token'); // 获取当前 token

    // 步骤 1: 检查是否存在 token
    if (token) {
        console.log('[Booking] Token found, attempting to validate by fetching user info...');
        try {
          // 步骤 2: 不再需要强制验证 token，因为回调已经刷新了Store
          // await userStore.fetchUserInfo({ force: true }); // 添加 force 选项，如果 store 有缓存逻辑
          console.log('[Booking] Skipping redundant fetchUserInfo call in checkAuthAndLoad.'); // 可以保留或添加这行日志
          isAuthenticated = userStore.isLoggedIn; // 直接获取当前Store状态
          console.log('[Booking] Current store authentication status:', isAuthenticated);
        } catch (error) {
          console.error('[Booking] Error during fetchUserInfo (token validation):', error);
          // 即使出错，也以 userStore 的状态为准，fetchUserInfo 内部应处理 clearUserInfo
          isAuthenticated = userStore.isLoggedIn;
        }
    } else {
        console.log('[Booking] No token found.');
        // 确保状态是未登录
        if(userStore.isLoggedIn) userStore.clearUserInfo();
        isAuthenticated = false;
    }

    // 步骤 3: 根据最终的认证状态执行后续操作
    getReferrerIdFromUrlOrStorage(); // 先获取 referrerId，无论是否登录

    if (isAuthenticated) {
        console.log('[Booking] User is authenticated. Initializing logged-in page.');
        initializeLoggedInPage();
        if (!hasFetchedPlans.value) {
            await fetchPlanOptions();
        }
    } else {
        console.log('[Booking] User is not authenticated. Login prompt will be shown.');
        // 未登录状态下不需要执行 initializeLoggedInPage
        // 确保 referrer_id 存在 localStorage 中以便登录 state 使用
        if (referrerInfo.id && !localStorage.getItem('referrer_id')) {
             localStorage.setItem('referrer_id', referrerInfo.id);
             console.log('[Booking] Saved referrerId to localStorage for login state:', referrerInfo.id);
        }
    }

    // 步骤 4: 结束加载状态
    isLoading.value = false;
    console.log('[Booking] checkAuthAndLoad finished. isLoading set to false.');
};

// 格式化显示安装时间
const formatInstallTime = (timeString) => {
  console.log('[Booking] formatInstallTime called with input:', timeString);
  if (!timeString) {
      console.log('[Booking] formatInstallTime: input is empty, returning empty string.');
      return '';
  }

  try {
    // 假设格式是 YYYY-MM-DD HH:MM:SS
    const parts = timeString.split(' ');
    if (parts.length !== 2) {
        console.error('[Booking] formatInstallTime: Invalid format - expected date and time parts.', timeString);
        return timeString; // 格式不对，返回原始字符串
    }
    const [datePart, timePart] = parts;

    // 处理日期部分 YYYY-MM-DD -> MM月DD日
    const dateParts = datePart.split('-');
    if (dateParts.length !== 3) {
        console.error('[Booking] formatInstallTime: Invalid date part format.', datePart);
        return timeString;
    }
    const [year, month, day] = dateParts;
    const dateText = `${parseInt(month)}月${parseInt(day)}日`;

    // 处理时间部分 HH:MM:SS -> HH:MM
    const timeParts = timePart.split(':');
    if (timeParts.length < 2) { // 允许 HH:MM 或 HH:MM:SS
        console.error('[Booking] formatInstallTime: Invalid time part format.', timePart);
        return timeString;
    }
    const timeText = timeParts.slice(0, 2).join(':'); // 取前两部分 HH:MM

    // 获取星期几
    const date = new Date(datePart);
    if (isNaN(date.getTime())) { // 检查日期是否有效
        console.error('[Booking] formatInstallTime: Invalid date object created.', datePart);
        return timeString;
    }
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekDay = weekDays[date.getDay()];

    // 整合
    const formattedResult = `${dateText} ${weekDay} ${timeText}`;
    console.log('[Booking] formatInstallTime successfully formatted:', formattedResult);
    return formattedResult;
  } catch (e) {
    console.error('[Booking] Error inside formatInstallTime:', e, 'Input was:', timeString);
    return timeString; // 出错时返回原始字符串，避免显示空白
  }
};

// 强制触发表单字段更新
const forceUpdateFormField = (fieldName, value) => {
  console.log(`[Booking] forceUpdateFormField: ${fieldName} = ${value}`);
  if (form[fieldName] !== undefined) {
    // 先清空再设置，确保触发响应式更新
    form[fieldName] = '';
    nextTick(() => {
      form[fieldName] = value;
      console.log(`[Booking] forceUpdateFormField: ${fieldName} updated to ${form[fieldName]}`);
    });
  }
};

// PickerGroup 确认事件处理 (简化版，增强日志和错误处理)
const onPickerConfirm = (payload) => {
    console.log('[Booking] PickerGroup onPickerConfirm START. Received payload:', payload);
    let selectedValues = null;

    // 检查 payload 结构，可能是 { selectedValues } 或直接是数组
    if (payload && payload.selectedValues) {
        selectedValues = payload.selectedValues;
        console.log('[Booking] Extracted selectedValues from payload object:', selectedValues);
    } else if (Array.isArray(payload)) {
        selectedValues = payload;
        console.log('[Booking] Received selectedValues directly as array:', selectedValues);
    } else {
         console.error('[Booking] onPickerConfirm received unexpected payload structure:', payload);
         showToast('确认失败，请重试');
         showDatePicker.value = false;
         return;
    }

    try {
        // 确保 selectedValues 是包含两个非空对象，且每个对象内 selectedValues 数组有值
        if (Array.isArray(selectedValues) && selectedValues.length === 2 &&
            selectedValues[0] && selectedValues[0].selectedValues && selectedValues[0].selectedValues.length > 0 &&
            selectedValues[1] && selectedValues[1].selectedValues && selectedValues[1].selectedValues.length > 0)
        {
            console.log('[Booking] selectedValues structure seems valid for PickerGroup.');
            const dateValue = selectedValues[0].selectedValues[0]; // 从第一个对象提取日期值
            const timeValue = selectedValues[1].selectedValues[0]; // 从第二个对象提取时间值
            console.log(`[Booking] Extracted dateValue: ${dateValue}, timeValue: ${timeValue}`);

            // 再次检查提取出的值是否有效
            if (dateValue && timeValue) {
                selectedDate.value = dateValue;
                selectedTime.value = timeValue;

                // 关键修复：确保表单值的更新触发计算属性的重新计算
                // 确保时间格式正确，使用标准格式
                // 处理日期部分，确保是 YYYY-MM-DD 格式
                const dateParts = dateValue.split('-');
                if (dateParts.length !== 3) {
                    console.error('[Booking] Invalid date format:', dateValue);
                    showToast('日期格式无效');
                    return;
                }

                // 处理时间部分，确保是 HH:MM 格式
                const timeParts = timeValue.split(':');
                if (timeParts.length < 1 || timeParts.length > 2) {
                    console.error('[Booking] Invalid time format:', timeValue);
                    showToast('时间格式无效');
                    return;
                }

                // 格式化为 YYYY-MM-DD HH:MM:SS
                const year = dateParts[0].padStart(4, '0');
                const month = dateParts[1].padStart(2, '0');
                const day = dateParts[2].padStart(2, '0');
                const hour = timeParts[0].padStart(2, '0');
                const minute = timeParts.length > 1 ? timeParts[1].padStart(2, '0') : '00';

                // 添加秒数部分，确保格式为 YYYY-MM-DD HH:MM:SS
                const newValue = `${year}-${month}-${day} ${hour}:${minute}:00`;
                console.log('[Booking] Setting form.installTime to:', newValue);

                // 直接设置表单字段值
                form.installTime = newValue;
                console.log('[Booking] Form installTime set to:', form.installTime);

                // 强制触发UI更新
                nextTick(() => {
                    // 确保在DOM更新后检查值是否正确显示
                    console.log('[Booking] After nextTick - form.installTime:', form.installTime);
                    console.log('[Booking] After nextTick - formattedInstallTimeDisplay:', formattedInstallTimeDisplay.value);

                    // 如果还是没有显示，再尝试一次强制更新
                    if (!formattedInstallTimeDisplay.value) {
                        console.log('[Booking] Trying one more time to update form.installTime');
                        // 尝试使用延迟更新
                        setTimeout(() => {
                            form.installTime = '';
                            setTimeout(() => {
                                form.installTime = newValue;
                                console.log('[Booking] Form installTime updated again:', form.installTime);
                            }, 50);
                        }, 50);
                    }
                });

                showDatePicker.value = false; // 成功后关闭
                console.log('[Booking] PickerGroup popup should be closed (success).');
            } else {
                 console.warn('[Booking] Extracted dateValue or timeValue is empty.');
                 showToast('选择的日期或时间无效');
            }
        } else {
            console.warn('[Booking] selectedValues structure is invalid or incomplete:', selectedValues);
            showToast('请确保已选择有效的日期和时间');
            // 不关闭弹窗，让用户重新选择
        }
    } catch (error) {
        console.error('[Booking] Error inside onPickerConfirm logic:', error);
        showToast('处理时间选择时出错');
        // 尝试关闭弹窗
        showDatePicker.value = false;
    }
    console.log('[Booking] PickerGroup onPickerConfirm END.');
};

// PickerGroup 取消事件处理
const onPickerCancel = () => {
    console.log('[Booking] PickerGroup cancelled.');
    showDatePicker.value = false;
};

// --- 生命周期钩子和监听器 ---
onMounted(async () => {
  console.log('[Booking] Component Mounted. Starting auth check...');
  console.log('[Booking] Current userStore.userInfo:', JSON.stringify(userStore.userInfo, null, 2));
  await repairBrokenReferrerRoute();
  checkAuthAndLoad();
  triggerAutoWechatLogin();
});

// 微信JSSDK初始化已通过统一的分享组件处理，这里不再重复初始化

// 监听登录状态变化 (主要处理登录成功后跳转回来的情况)
watch(isLoggedIn, (newVal, oldVal) => {
  console.log(`[Booking] Watch isLoggedIn: status changed from ${oldVal} to ${newVal}. isLoading: ${isLoading.value}`);
  // 确保不是在初始加载过程中触发
  // 并且是从未登录变为已登录
  if (!isLoading.value && newVal === true && oldVal === false) {
    console.log('[Booking] Watch isLoggedIn: User just logged in AFTER initial load, re-initializing page...');
    // 登录成功后，可能需要重新获取 referrerId (如果 state 传递有问题) 并初始化
    getReferrerIdFromUrlOrStorage();
    initializeLoggedInPage();
    fetchPlanOptions();
  } else if (!isLoading.value && newVal === false) {
      console.log('[Booking] Watch isLoggedIn: User logged out or token invalidated AFTER initial load.');
      // 清理推荐人信息
      referrerInfo.id = '';
      referrerInfo.name = '';
      referrerInfo.avatar = '';
      hasFetchedPlans.value = false;
      triggerAutoWechatLogin();
  }
});

// 监听路由变化 (可能不再那么必要，但保留以防万一)
watch(() => route.fullPath, (newPath, oldPath) => {
    // 只在非初始加载时响应路由变化
    if (!isLoading.value && newPath !== oldPath && newPath.includes('install-booking')) {
        console.log(`[Booking] Watch route: changed from ${oldPath} to ${newPath}. Checking auth again.`);
        // 路由变化可能意味着登录回调或其他情况，重新检查认证
        checkAuthAndLoad();
        triggerAutoWechatLogin();
    }
});

watch(payScoreInput, (value) => {
    if (!value) return;
    const normalized = value.replace(/\D/g, '').slice(0, 4);
    if (normalized !== value) {
        payScoreInput.value = normalized;
    }
});

// 监听表单安装时间字段的变化
watch(() => form.installTime, (newValue, oldValue) => {
    console.log(`[Booking] Watch form.installTime: changed from "${oldValue}" to "${newValue}"`);
    if (newValue && newValue !== oldValue) {
        // 强制触发计算属性重新计算
        nextTick(() => {
            console.log('[Booking] Watch form.installTime nextTick - formattedInstallTimeDisplay:', formattedInstallTimeDisplay.value);
        });
    }
});

// 显示地址选择帮助提示
const showAddressHelp = () => {
  showDialog({
    title: '微信地址选择帮助',
    message: '如果微信地址选择失败，您可以尝试以下方法：\n\n1. 刷新页面后重试\n2. 确认微信版本是否是最新版\n3. 手动输入地址\n4. 如果一直无法选择，请尝试关闭微信后重新打开',
    confirmButtonText: '知道了',
    confirmButtonColor: '#1989fa',
  });
};

// 选择微信地址
const chooseWxAddress = async () => {
  try {
    loadingAddress.value = true;
    
    // 检查微信环境
    if (!/MicroMessenger/i.test(navigator.userAgent)) {
      showToast('请在微信内打开页面使用此功能');
      loadingAddress.value = false;
      return;
    }
    
    // 检查微信SDK是否已就绪
    if (!window.wx || !window.wx.openAddress) {
      showToast('微信接口未就绪，请刷新页面后重试');
      loadingAddress.value = false;
      return;
    }
    
    // 直接调用微信地址选择
    window.wx.openAddress({
      success(res) {
        console.log('[Booking] 微信地址选择成功:', res);
        form.name = res.userName || '';
        form.phone = res.telNumber || '';
        form.address = `${res.provinceName || ''}${res.cityName || ''}${res.countryName || ''}${res.detailInfo || ''}`;
        showSuccessToast('地址导入成功');
        // 重置地址错误标志
        addressError.value = false;
      },
      fail(err) {
        console.error('[Booking] 微信地址选择失败:', err);
        showToast('微信地址选择失败，请手动填写');
        // 设置地址错误标志，显示帮助提示
        addressError.value = true;
      },
      complete() {
        loadingAddress.value = false;
      }
    });
  } catch (e) {
    console.error('[Booking] 微信地址选择异常:', e);
    showToast('微信地址导入异常，请手动填写');
    loadingAddress.value = false;
    // 设置地址错误标志，显示帮助提示
    addressError.value = true;
  }
};
</script>

<style scoped>
/* 新增加载状态样式 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
  padding: 30px;
}

.install-booking {
  background-color: #f5f7fa;
  min-height: 100vh;
  padding-bottom: 30px;
}

.booking-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 16px 80px;
}

.hero-card {
  background: linear-gradient(135deg, #1b2fff 0%, #5d75ff 50%, #7ed5ff 100%);
  color: #fff;
  padding: 16px;
}

.hero-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.hero-title {
  font-size: 18px;
  font-weight: 700;
}

.hero-subtitle {
  font-size: 13px;
  opacity: 0.85;
}

.hero-pill {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  letter-spacing: 2px;
}

.hero-tags {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.hero-tag {
  background: rgba(255, 255, 255, 0.18);
  border-radius: 14px;
  padding: 4px 10px;
  font-size: 12px;
}

.hero-referrer {
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.16);
  border-radius: 999px;
}

.referrer-label {
  font-size: 12px;
  opacity: 0.85;
}

.referrer-profile {
  display: flex;
  align-items: center;
  gap: 8px;
}

.referrer-fallback {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}

.referrer-meta {
  line-height: 1.1;
  display: flex;
  flex-direction: column;
}

.referrer-name {
  font-weight: 600;
  font-size: 13px;
}

.referrer-id {
  font-size: 11px;
  opacity: 0.85;
}

.booking-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0 2px;
}

.step-chip {
  padding: 4px 10px;
  border-radius: 999px;
  background: #eef2ff;
  color: #3c64ff;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.step-index {
  font-weight: 600;
  font-size: 12px;
}

.step-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #eef2ff;
  color: #3c64ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-title {
  font-weight: 600;
  font-size: 14px;
}

.step-desc {
  font-size: 12px;
  color: #8c94a8;
}

/* 登录区域样式 */
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  min-height: 70vh;
}

.login-card {
  width: 100%;
  max-width: 320px;
  background: #ffffff;
  border-radius: 12px;
  padding: 30px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.login-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #323233;
}

.login-subtitle {
  font-size: 14px;
  color: #969799;
  margin-bottom: 20px;
}

.logo {
  display: block;
  margin: 20px auto;
}

.wechat-login-btn {
  margin-top: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 12px;
  padding-left: 4px;
}

.package-section {
  /* background-color: #ffffff; */ /* 移除背景，由 card-shadow 处理 */
  border-radius: 8px; /* 保持圆角 */
  padding: 16px 16px 8px 16px; /* 调整内边距 */
  margin-bottom: 16px;
  /* box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); */ /* 移除内阴影 */
}

.plan-loading {
  text-align: center;
  padding: 12px 0;
}

.plan-grid {
  display: grid;
  gap: 6px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.plan-item {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background-color: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  min-height: auto;
  cursor: pointer;
  overflow: hidden;
}

.plan-item.active {
  border-color: #1989fa;
  box-shadow: 0 8px 16px rgba(25, 137, 250, 0.12);
  background-color: #f5fbff;
}

.plan-accent {
  height: 3px;
  width: 100%;
  background: linear-gradient(90deg, rgba(25, 137, 250, 0.15), rgba(25, 137, 250, 0));
}

.plan-accent.active {
  background: linear-gradient(90deg, #1c6eff, #52a3ff);
}

.plan-inner {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px 12px;
}

.plan-top {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.plan-item-header {
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: 6px;
  align-items: flex-end;
}

.plan-name-stack {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.plan-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2d3d;
  margin-right: 8px;
}

.plan-subtitle {
  font-size: 12px;
  color: #5c667a;
  letter-spacing: 0.2px;
}

.plan-rate {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eef5ff;
  color: #2267c7;
  font-size: 12px;
  font-weight: 500;
}

.plan-radio {
  margin-left: auto;
  padding-left: 4px;
}

.plan-desc {
  font-size: 12px;
  color: #65708a;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  width: 100%;
}

.plan-meta {
  font-size: 12px;
  color: #94a3b8;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.plan-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: #f0f4ff;
  color: #4a5bdc;
  font-size: 11px;
  font-weight: 500;
}

.installation-form {
  margin-bottom: 16px;
  padding-bottom: 80px;
}

.form-group {
  margin-bottom: 16px;
  background-color: #ffffff;
}

.cost-insight {
  margin: 12px 0 0;
  padding: 18px;
}

.cost-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  background: #eef2ff;
  color: #3c64ff;
  font-size: 12px;
  margin-bottom: 14px;
}

.cost-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.cost-item {
  background: #f8fafc;
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.deposit-item {
  gap: 8px;
  grid-column: span 2;
}

.deposit-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pay-score-inline {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 4px;
  border-top: 1px dashed #d3dae6;
}

.pay-score-copy {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: #667085;
}

.pay-score-label {
  font-weight: 600;
  color: #1f2d3d;
}

.pay-score-tip {
  font-size: 12px;
  color: #3c64ff;
}

.pay-score-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pay-score-input {
  flex: 1;
  min-width: 0;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #d0d7e3;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background: #fff;
}

.pay-score-input:focus {
  outline: none;
  border-color: #1989fa;
  box-shadow: 0 0 0 2px rgba(25, 137, 250, 0.15);
}

.pay-score-guide {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #eef2ff;
  color: #3553ff;
  border: none;
  border-radius: 999px;
  padding: 0 12px;
  height: 32px;
  font-size: 12px;
  cursor: pointer;
  flex-shrink: 0;
}

.pay-score-guide:active {
  opacity: 0.8;
}

.pay-score-annual-tip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #1c6eff;
  background: #eef5ff;
  border-radius: 8px;
  padding: 6px 10px;
}

.cost-item .label {
  font-size: 12px;
  color: #94a3b8;
}

.cost-item .value {
  font-weight: 600;
  font-size: 15px;
  color: #1f2d3d;
}

.cost-highlight {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 10px;
  padding: 10px 12px;
  background: #fffbe6;
  color: #b45309;
  font-size: 13px;
}

.cost-highlight.success {
  background: #ecfdf5;
  color: #047857;
}

.cost-note {
  margin-top: 8px;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.5;
}

.floating-submit {
  position: sticky;
  bottom: 16px;
  margin-top: 18px;
  padding: 14px 16px;
  display: flex;
  gap: 14px;
  align-items: center;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.15);
}

.floating-info {
  flex: 1;
}

.floating-info .label {
  font-size: 12px;
  color: #94a3b8;
}

.floating-info .value {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  line-height: 1.1;
}

.floating-info .sub {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

/* 自定义时间选择器样式 */
.picker-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 44px;
  padding: 0 16px;
  border-bottom: 1px solid #ebedf0;
}

.picker-toolbar .cancel {
  color: #969799;
  font-size: 14px;
}

.picker-toolbar .title {
  font-size: 16px;
  font-weight: 500;
  color: #323233;
}

.picker-toolbar .confirm {
  color: #1989fa;
  font-size: 14px;
  font-weight: 500;
}

.date-selector {
  display: flex;
  height: 220px;
}

.date-selector .van-picker {
  flex: 1;
}

/* 用户信息卡片样式 */
.user-info-card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.user-info-content {
  display: flex;
  align-items: flex-start;
}

.current-user-avatar {
  margin-right: 12px;
  flex-shrink: 0;
}

.user-details {
  margin-left: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 6px;
  line-height: 1.3;
}

.referrer-info {
  font-size: 12px;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  margin-top: 0;
  background-color: #f8fafc;
  padding: 3px 6px;
  border-radius: 4px;
  max-width: 100%;
}

.referrer-placeholder {
    color: #969799;
    background-color: transparent;
    padding: 3px 0;
}

.referrer-avatar {
  margin-right: 4px;
  flex-shrink: 0;
}

.referrer-text {
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-shadow {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  border-radius: 8px;
  background-color: #ffffff;
}

/* Vant Tabs 样式微调 */
:deep(.van-tabs__nav--card) {
  margin: 0; /* 移除 card 类型 tabs 的默认 margin */
}

:deep(.van-tabs__content) {
    padding-top: 0; /* 移除 tab 内容的默认上边距，使用 .package-list 控制 */
}

/* 时间选择弹窗优化 */
:deep(.van-picker-group) {
  background-color: #ffffff; /* 设置背景色以避免空规则集警告 */
}

/* 地址选择按钮样式 */
:deep(.van-field__button) {
  min-width: 100px;
}

:deep(.van-field__button) .van-button {
  padding: 0 12px;
  height: 32px;
  line-height: 30px;
  font-size: 13px;
}

/* 地址错误提示样式 */
.address-error-tip {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.address-error-tip:hover {
  background-color: rgba(255, 151, 106, 0.1);
}

.guide-sheet {
  padding: 24px 20px 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.guide-header {
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 16px;
}

.guide-body {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.guide-step {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 12px;
}

.guide-step-index {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e0e7ff;
  color: #1d4ed8;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.guide-step-title {
  font-weight: 600;
  margin-bottom: 4px;
  color: #111827;
}

.guide-step-desc {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
}

.guide-footer {
  margin-top: 12px;
}

:deep(.van-picker-group__toolbar) {
  /* 优化工具栏样式 */
  padding: 8px 12px; /* 微调内边距 */
  border-bottom: 1px solid #ebedf0;
}

:deep(.van-picker-group__title) {
  font-weight: 600; /* 加粗标题 */
}

:deep(.van-picker-group__confirm),
:deep(.van-picker-group__cancel) {
  padding: 0 8px; /* 调整按钮内边距 */
  font-weight: normal; /* 可能不需要加粗按钮文字 */
}

:deep(.van-tabs__nav--card) {
  margin: 0 16px; /* 给 tabs 左右一些边距 */
  height: 36px; /* 微调 tabs 高度 */
  border: 1px solid #1989fa; /* 给 tabs 一个边框 */
}

:deep(.van-tabs__nav--card .van-tab) {
  line-height: 34px; /* 调整 tab 内文字行高 */
  border-right: 1px solid #1989fa; /* tab之间的分隔线 */
}

:deep(.van-tabs__nav--card .van-tab:last-child) {
    border-right: none; /* 最后一个 tab 不加右边框 */
}

:deep(.van-tabs__nav--card .van-tab.van-tab--active) {
  background-color: #1989fa; /* 选中 tab 的背景色 */
  color: white; /* 选中 tab 的文字颜色 */
}

:deep(.van-picker__columns) {
  /* 可以在这里调整 picker 列的整体样式，例如背景 */
  /* background-color: #ffffff; */
  padding: 10px 0; /* 给 picker 上下一些间距 */
}

:deep(.van-picker-column__item) {
  /* 调整选项的字体大小或颜色 */
   font-size: 15px;
}

:deep(.van-picker-column__item--selected) {
  /* 突出显示选中项 */
  font-weight: 600;
  font-size: 17px; /* 稍微放大选中项 */
  color: #1989fa; /* 使用主题色 */
}

/* 移除 Vant Picker 默认的上下遮罩和选中框边框 */
:deep(.van-picker__mask) {
    background-image: none;
}
:deep(.van-picker__frame) {
    border-top: none;
    border-bottom: none;
}
</style>
