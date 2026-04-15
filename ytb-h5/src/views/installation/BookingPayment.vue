<template>
  <div class="booking-payment">
    <!-- 加载状态 -->
    <div class="loading-container" v-if="isLoading">
      <van-loading size="24px" vertical>加载中...</van-loading>
    </div>

    <!-- 支付内容 -->
    <div class="payment-container" v-else>
      <div class="payment-header">
        <div class="payment-title">安装预约支付</div>
        <div class="payment-subtitle">请确认订单信息并完成支付</div>
      </div>

      <!-- 订单信息卡片 -->
      <div class="order-card card-shadow">
        <div class="order-header">
          <div class="order-title">订单信息</div>
          <div class="order-status" :class="{ 'status-unpaid': !isPaid, 'status-paid': isPaid }">
            {{ isPaid ? '已支付' : '待支付' }}
          </div>
        </div>

        <div class="order-info">
          <div class="info-item">
            <div class="info-label">预约编号</div>
            <div class="info-value">{{ bookingInfo.booking_no || '加载中...' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">套餐类型</div>
            <div class="info-value">{{ formattedPackageName }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">安装时间</div>
            <div class="info-value">{{ formattedInstallTime }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">联系人</div>
            <div class="info-value">{{ bookingInfo.contact_name || '加载中...' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">联系电话</div>
            <div class="info-value">{{ bookingInfo.contact_phone || '加载中...' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">安装地址</div>
            <div class="info-value address-value">{{ bookingInfo.install_address || '未设置' }}</div>
          </div>
        </div>

        <div class="order-divider"></div>

        <div class="price-info">
          <!-- 安装费用 - 必选项 -->
          <div class="price-item installation-fee">
            <div class="price-item-left">
              <div class="price-icon installation-icon">
                <van-icon name="certificate" size="20" />
              </div>
              <div class="price-details">
                <div class="price-label">安装费用</div>
                <div class="price-desc">必选项</div>
              </div>
            </div>
            <div class="price-value">¥{{ (bookingInfo.installation_fee || 120).toFixed(2) }}</div>
          </div>

          <!-- 扣费计划展示 -->
          <div class="price-item plan-summary">
            <div class="price-item-left">
              <div class="price-icon package-icon">
                <van-icon name="balance-o" size="20" />
              </div>
              <div class="price-details">
                <div class="price-label">{{ bookingInfo.billing_plan_text || '扣费计划' }}</div>
                <div class="price-desc">{{ formatPlanSummary(bookingInfo) }}</div>
              </div>
            </div>
            <div class="price-value">
              <template v-if="bookingInfo.billing_plan === 'annual_unlimited'">
                ¥{{ (bookingInfo.package_price || 0).toFixed(2) }}
              </template>
              <template v-else>
                {{ bookingInfo.billing_rate || '--' }} 元/{{ bookingInfo.billing_unit || 'L' }}
              </template>
            </div>
          </div>

          <!-- 押金展示 -->
          <div class="price-item deposit-item">
            <div class="price-item-left">
              <div class="price-icon deposit-icon">
                <van-icon name="gold-coin-o" size="20" />
              </div>
              <div class="price-details">
                <div class="price-label">押金</div>
                <div class="price-desc">支付分≥750自动免押金</div>
              </div>
            </div>
            <div class="price-value">
              ¥{{ formatAmount(bookingInfo.deposit_amount) }}
              <span v-if="bookingInfo.deposit_waived" class="deposit-tag">已免</span>
            </div>
          </div>

          <div class="price-divider"></div>

          <!-- 总计金额 -->
          <div class="price-item total-price">
            <div class="price-label">总计</div>
            <div class="price-value">¥{{ calculatedTotalAmount.toFixed(2) }}</div>
          </div>
        </div>
      </div>

      <!-- 支付方式选择 -->
      <div class="payment-methods card-shadow" v-if="!isPaid">
        <div class="method-title">选择支付方式</div>
        <div class="method-list">
          <div
            class="method-item"
            :class="{ 'method-selected': selectedPaymentMethod === 'wechat' }"
            @click="selectPaymentMethod('wechat')"
          >
            <div class="method-icon">
              <van-icon name="wechat" color="#07c160" size="24" />
            </div>
            <div class="method-name">微信支付</div>
            <div class="method-check" v-if="selectedPaymentMethod === 'wechat'">
              <van-icon name="success" color="#07c160" size="16" />
            </div>
          </div>

          <div
            class="method-item method-disabled"
          >
            <div class="method-icon">
              <van-icon name="alipay" color="#1677ff" size="24" />
            </div>
            <div class="method-name">支付宝支付</div>
            <div class="method-disabled-tag">暂不可用</div>
          </div>
        </div>
      </div>

      <!-- 支付按钮 -->
      <div class="payment-action" v-if="!isPaid">
        <van-button
          round
          block
          type="primary"
          color="#07c160"
          size="large"
          :loading="isProcessing"
          style="height: 50px; font-size: 18px; font-weight: bold;"
          @click="handlePayment"
        >
          立即支付 ¥{{ calculatedTotalAmount.toFixed(2) }}
        </van-button>

        <!-- 测试模式下显示模拟支付按钮 -->
        <van-button
          v-if="showSimulateButton"
          round
          block
          type="default"
          style="margin-top: 10px; height: 40px;"
          @click="simulatePayment"
        >
          模拟支付(测试用)
        </van-button>
      </div>

      <!-- 已支付提示 -->
      <div class="payment-success" v-else>
        <div class="success-icon">
          <van-icon name="checked" color="#07c160" size="48" />
        </div>
        <div class="success-text">支付成功</div>
        <div class="success-desc">工程师将尽快与您联系确认安装时间</div>
        <van-button
          round
          block
          type="primary"
          color="#1989fa"
          @click="goToBookingList"
        >
          查看我的预约
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { setShareMetadata } from '@/utils/share';
import { showToast, showSuccessToast, showLoadingToast, closeToast, showDialog, showConfirmDialog } from 'vant';
import { useUserStore } from '@/stores/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

// 状态变量
const isLoading = ref(true);
const isProcessing = ref(false);
const bookingInfo = ref({});
const selectedPaymentMethod = ref('wechat');
const isPaid = computed(() => bookingInfo.value.payment_status === 'paid');
const paymentStage = ref(''); // 跟踪支付阶段
const isTimeoutMode = ref(false); // 是否进入超时模式
const isRequestSent = ref(false); // 防止重复请求标志
const showSimulateButton = ref(true); // 始终显示模拟支付按钮

// 使用计算属性处理格式化，避免在数据加载前调用格式化函数
const PLAN_NAME_FALLBACK = {
  personal: '个人/企业套餐',
  unlimited: '无限畅饮套餐',
  business_year: '商务机包年套餐',
  business_flow: '商务机流量套餐',
  daily_pay_per_liter: '每日扣费 · 0.35元/升',
  weekly_pay_per_liter: '每周扣费 · 0.40元/升',
  annual_unlimited: '包年不限量 · 1500元/年'
};

const resolvePlanName = (info) => {
  if (!info) return '加载中...';
  return PLAN_NAME_FALLBACK[info.package_type] || PLAN_NAME_FALLBACK[info.billing_plan] || '定制套餐';
};

const formattedPackageName = computed(() => {
  if (!bookingInfo.value) {
    return '加载中...';
  }
  return bookingInfo.value.billing_plan_text
    || bookingInfo.value.package_type_text
    || resolvePlanName(bookingInfo.value);
});

const formattedInstallTime = computed(() => {
  if (!bookingInfo.value || !bookingInfo.value.install_time) {
    return '加载中...';
  }
  return formatInstallTime(bookingInfo.value.install_time);
});

const formatAmount = (value) => {
  const num = Number(value || 0);
  return num.toFixed(2);
};

const formatPlanSummary = (info) => {
  if (!info) return '按需扣费';
  if (info.billing_plan === 'annual_unlimited') {
    return '包年不限量';
  }
  if (info.billing_cycle === 'weekly') {
    return '每周统计扣费';
  }
  if (info.billing_cycle === 'daily') {
    return '每日按量结算';
  }
  return '按需扣费';
};

// 计算总金额
const calculatedTotalAmount = computed(() => {
  const installationFee = parseFloat(bookingInfo.value.installation_fee || 120);
  const planAmount = parseFloat(bookingInfo.value.package_price || 0);
  const depositAmount = parseFloat(bookingInfo.value.deposit_amount || 0);
  return installationFee + planAmount + depositAmount;
});

// 获取预约ID
const rawBookingParam = computed(() => route.params.id || route.query.id || '');

const normalizeBookingId = (value) => {
  if (!value) return '';
  const str = String(value);
  if (/^\d+amount=/i.test(str)) {
    return str.replace(/amount=.*$/i, '');
  }
  return str;
};

const bookingId = computed(() => normalizeBookingId(rawBookingParam.value));

const redirectingToLogin = ref(false);

const extractTokenValue = (value) => {
  if (!value) return '';
  if (value === 'null' || value === 'undefined') {
    return '';
  }
  return value;
};

const readCookie = (name) => {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
};

const resolveAuthToken = () => {
  const candidates = [
    userStore.token,
    localStorage.getItem('token'),
    sessionStorage.getItem('token'),
    localStorage.getItem('branch_token'),
    sessionStorage.getItem('branch_token'),
    localStorage.getItem('simulate_token'),
    sessionStorage.getItem('simulate_token'),
    readCookie('token'),
    readCookie('branch_token'),
    readCookie('simulate_token')
  ];

  for (const candidate of candidates) {
    const value = extractTokenValue(candidate);
    if (value) {
      return value;
    }
  }
  return '';
};

const authToken = computed(() => resolveAuthToken());

const extractAmountFromParam = (value) => {
  if (!value) return null;
  const match = String(value).match(/amount=([\d.]+)/i);
  return match ? match[1] : null;
};

const repairBrokenPaymentUrl = async () => {
  const raw = route.params.id;
  if (typeof raw === 'string' && raw.includes('amount=')) {
    const amountValue = extractAmountFromParam(raw);
    const normalizedId = normalizeBookingId(raw);
    const nextQuery = { ...route.query };
    if (amountValue && !nextQuery.amount) {
      nextQuery.amount = amountValue;
    }
    await router.replace({
      path: `/installation/payment/${normalizedId}`,
      query: nextQuery
    });
    return true;
  }
  return false;
};

const redirectToLogin = (message = '请先登录后查看订单') => {
  if (redirectingToLogin.value) return;
  redirectingToLogin.value = true;
  showToast(message);
  const redirectPath = route.fullPath || `/installation/payment/${bookingId.value || ''}`;
  setTimeout(() => {
    router.replace({
      path: '/login',
      query: { redirect: redirectPath }
    });
  }, 600);
};


// 初始化
onMounted(async () => {
  console.log('[BookingPayment] Component mounted, booking ID:', bookingId.value);

  // 在开发环境下显示模拟支付按钮
  const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
  showSimulateButton.value = isDevelopment || window.location.search.includes('debug=true');
  console.log('[BookingPayment] 模拟支付按钮状态:', showSimulateButton.value ? '已启用' : '已禁用');

  if (!bookingId.value) {
    showToast('预约ID无效');
    router.replace('/installation/booking');
    return;
  }

  await repairBrokenPaymentUrl();
  await fetchBookingInfo();

  // 微信分享配置
  if (isPaid.value === false) {
    try {
      setShareMetadata({
        title: '设备安装支付',
        subtitle: '点点够智能净水设备安装服务',
        url: window.location.href.split('#')[0],
        logo: 'https://pay.itapgo.com/app/images/logo.png'
      });
    } catch (e) {
      // 静默处理错误
    }
  }
});

// 获取预约信息
const fetchBookingInfo = async () => {
  isLoading.value = true;

  try {
    const token = authToken.value;
    if (!token) {
      redirectToLogin('请先登录后查看订单');
      return;
    }

    // 即使是临时ID也尝试从API获取，不直接使用模拟数据
    console.log('[BookingPayment] 正在获取预约信息，ID:', bookingId.value);

    // 构建API路径
    let apiUrl = `/api/installation/get_booking.php?id=${bookingId.value}`;

    // 检查当前环境
    const currentHost = window.location.hostname;
    if (currentHost === 'pay.itapgo.com') {
      apiUrl = `/Tapp/admin/api/installation/get_booking.php?id=${bookingId.value}`;
    }

    console.log('[BookingPayment] 获取预约信息API路径:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('[BookingPayment] API响应状态:', response.status);

    if (!response.ok) {
      if (response.status === 401) {
        redirectToLogin('登录状态已过期，请重新登录');
        return;
      }
      console.error(`[BookingPayment] HTTP error! status: ${response.status}`);

      // 只有在API明确返回错误时才尝试使用临时数据，并且仅限于以"temp_"开头的ID
      if (bookingId.value.startsWith('temp_')) {
        console.log('[BookingPayment] API返回错误，临时ID使用备用模拟数据');
        createMockBookingData();
      } else {
        showToast('获取预约信息失败，请稍后重试');
      }
      return;
    }

    const result = await response.json();
    console.log('[BookingPayment] 预约信息结果:', result);

    const responseCode = typeof result.code === 'string' ? Number(result.code) : result.code;

    if (responseCode === 0 && result.data) {
      console.log('[BookingPayment] 成功获取到预约数据');

      // 确保数据完整性，补充必要字段的默认值
      const bookingData = {
        ...result.data,
        // 确保这些关键字段有默认值
        package_type: result.data.package_type || 'personal',
        package_price: parseFloat(result.data.package_price || 0),
        installation_fee: parseFloat(result.data.installation_fee || 0),
        total_amount: parseFloat(result.data.total_amount || 0),
        contact_name: result.data.contact_name || '未设置',
        contact_phone: result.data.contact_phone || '未设置',
        install_address: result.data.install_address || '未设置',
        install_time: result.data.install_time || new Date().toISOString().replace('T', ' ').substring(0, 19),
        payment_status: result.data.payment_status || 'unpaid',
        booking_no: result.data.booking_no || '未分配'
      };

      bookingInfo.value = bookingData;
      console.log('[BookingPayment] 处理后的预约数据:', bookingInfo.value);

      // 如果已支付，显示成功提示
      if (bookingInfo.value.payment_status === 'paid') {
        showSuccessToast('订单已支付');
      }
    } else {
      if (responseCode === 401) {
        redirectToLogin('登录状态已过期，请重新登录');
        return;
      }
      console.error('[BookingPayment] API返回错误:', result.message);

      // 只有在API明确返回数据不存在且ID是临时ID时才使用模拟数据
      if (bookingId.value.startsWith('temp_')) {
        console.log('[BookingPayment] API未返回有效数据，临时ID使用备用模拟数据');
        createMockBookingData();
      } else {
        showToast(result.message || '获取预约信息失败');
      }
    }
  } catch (error) {
    console.error('[BookingPayment] 获取预约信息异常:', error);

    // 只有在发生异常且ID是临时ID时才使用模拟数据
    if (bookingId.value.startsWith('temp_')) {
      console.log('[BookingPayment] 发生异常，临时ID使用备用模拟数据');
      createMockBookingData();
    } else {
      showToast('网络异常，请稍后重试');
    }
  } finally {
    isLoading.value = false;
  }
};

watch(rawBookingParam, async (next, prev) => {
  if (next === prev) return;
  await repairBrokenPaymentUrl();
  if (bookingId.value) {
    fetchBookingInfo();
  }
});

watch(() => userStore.isLoggedIn, (logged) => {
  if (logged && bookingId.value) {
    fetchBookingInfo();
  }
});

watch(authToken, (token, prev) => {
  if (token && token !== prev && bookingId.value) {
    fetchBookingInfo();
  }
});

// 创建模拟预约数据
const createMockBookingData = () => {
  console.log('[BookingPayment] Creating booking data from localStorage');

  // 初始化默认数据
  const now = new Date();
  const installDate = new Date();
  installDate.setDate(now.getDate() + 2); // 安装时间为两天后

  // 默认数据对象
  const defaultData = {
    id: bookingId.value,
    booking_no: 'BK' + Date.now().toString().substring(5),
    package_type: 'personal',
    contact_name: '张三', // 使用真实的中文名字
    contact_phone: '13812345678', // 使用标准手机号格式
    install_address: '北京市海淀区中关村街道128号', // 使用真实地址
    install_time: installDate.toISOString().replace('T', ' ').substring(0, 19),
    payment_status: 'unpaid',
    total_amount: 120.00,
    created_at: now.toISOString().replace('T', ' ').substring(0, 19)
  };

  // 尝试从 localStorage 获取用户填写的数据
  const savedData = localStorage.getItem('temp_booking_data');

  if (savedData) {
    try {
      // 使用用户实际填写的数据
      const parsedData = JSON.parse(savedData);

      // 安全地处理数据，确保所有字段都有有效值
      const safeData = {
        id: parsedData?.id || defaultData.id,
        booking_no: parsedData?.booking_no || defaultData.booking_no,
        package_type: parsedData?.package_type || defaultData.package_type,
        contact_name: parsedData?.contact_name || defaultData.contact_name,
        contact_phone: parsedData?.contact_phone || defaultData.contact_phone,
        install_address: parsedData?.install_address || defaultData.install_address,
        install_time: parsedData?.install_time || defaultData.install_time,
        payment_status: parsedData?.payment_status || defaultData.payment_status,
        total_amount: parsedData?.total_amount || defaultData.total_amount,
        created_at: parsedData?.created_at || defaultData.created_at
      };

      // 额外安全检查，确保字符串字段是字符串类型
      if (typeof safeData.install_address !== 'string') {
        safeData.install_address = String(safeData.install_address || '');
      }

      if (typeof safeData.contact_name !== 'string') {
        safeData.contact_name = String(safeData.contact_name || '');
      }

      if (typeof safeData.contact_phone !== 'string') {
        safeData.contact_phone = String(safeData.contact_phone || '');
      }

      // 设置安全处理后的数据
      bookingInfo.value = safeData;

      console.log('[BookingPayment] Using user data from localStorage (after safety checks):', bookingInfo.value);
      return;
    } catch (e) {
      console.error('[BookingPayment] Error parsing saved data:', e);
      console.error('[BookingPayment] Error details:', e.message, e.stack);
    }
  }

  // 如果没有保存的数据或解析出错，使用默认数据
  console.log('[BookingPayment] No saved data found or error occurred, using default data');
  bookingInfo.value = defaultData;
  console.log('[BookingPayment] Default booking data created:', bookingInfo.value);
};

// 选择支付方式
const selectPaymentMethod = (method) => {
  selectedPaymentMethod.value = method;
  console.log('[BookingPayment] Selected payment method:', method);
};

// 处理支付提交
const persistWechatIdentifiers = (openid, unionid = '') => {
  try {
    if (openid) {
      localStorage.setItem('wechat_openid', openid)
      sessionStorage.setItem('wechat_openid', openid)
    }
    if (unionid) {
      localStorage.setItem('wechat_unionid', unionid)
      sessionStorage.setItem('wechat_unionid', unionid)
    }
  } catch (error) {
    console.warn('[BookingPayment] 持久化微信标识失败:', error)
  }
}

const extractOpenIdFromToken = () => {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!token || token.split('.').length !== 3) {
      return ''
    }
    const payloadBase64 = token.split('.')[1]
    const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    const payload = JSON.parse(atob(padded))
    return payload?.openid || payload?.open_id || payload?.wechat_openid || ''
  } catch (error) {
    console.warn('[BookingPayment] 解析token获取openid失败:', error)
    return ''
  }
}

const ensureWechatOpenId = async () => {
  const possibleFields = ['open_id', 'openid', 'wechat_openid', 'openId']
  const readFromObject = (source) => {
    if (!source) return ''
    for (const field of possibleFields) {
      if (source[field]) {
        return source[field]
      }
    }
    return ''
  }

  let openid = readFromObject(userStore.userInfo)
  if (openid) {
    persistWechatIdentifiers(openid, userStore.userInfo?.wechat_unionid)
    return openid
  }

  try {
    const cachedUserInfo = JSON.parse(localStorage.getItem('userInfo') || 'null')
    openid = readFromObject(cachedUserInfo)
    if (openid) {
      persistWechatIdentifiers(openid, cachedUserInfo?.wechat_unionid)
      return openid
    }
  } catch (error) {
    console.warn('[BookingPayment] 解析本地用户信息失败:', error)
  }

  const storedOpenId = localStorage.getItem('wechat_openid') || sessionStorage.getItem('wechat_openid')
  if (storedOpenId) {
    return storedOpenId
  }

  const queryOpenId = new URLSearchParams(window.location.search).get('openid')
  if (queryOpenId) {
    persistWechatIdentifiers(queryOpenId)
    return queryOpenId
  }

  if (typeof window.__wxOpenId !== 'undefined' && window.__wxOpenId) {
    persistWechatIdentifiers(window.__wxOpenId)
    return window.__wxOpenId
  }

  const tokenOpenId = extractOpenIdFromToken()
  if (tokenOpenId) {
    persistWechatIdentifiers(tokenOpenId)
    return tokenOpenId
  }

  // 尝试重新拉取一次用户信息
  try {
    await userStore.fetchUserInfo({ forceRefresh: true })
    const refreshedOpenId = readFromObject(userStore.userInfo)
    if (refreshedOpenId) {
      persistWechatIdentifiers(refreshedOpenId, userStore.userInfo?.wechat_unionid)
      return refreshedOpenId
    }
  } catch (error) {
    console.warn('[BookingPayment] 刷新用户信息失败:', error)
  }

  const refreshedStored = localStorage.getItem('wechat_openid') || sessionStorage.getItem('wechat_openid')
  if (refreshedStored) {
    return refreshedStored
  }

  return ''
}

const handlePayment = async () => {
  try {
    if (isProcessing.value) {
      console.log('[BookingPayment] 支付处理中，不要重复点击');
      return;
    }

    // 添加防重复点击保护
    if (isRequestSent.value) {
      console.log('[BookingPayment] 请求已发送，请勿重复点击');
      return;
    }

    if (!selectedPaymentMethod.value) {
      showToast('请选择支付方式');
      return;
    }

    // 设置状态
    isProcessing.value = true;
    isTimeoutMode.value = false;
    paymentStage.value = '准备支付';
    isRequestSent.value = true; // 标记请求已发送

    console.log('[BookingPayment] 开始处理支付，方式:', selectedPaymentMethod.value);

    // 显示加载提示，添加15秒自动关闭以防卡死
    showLoadingToast({
      message: '正在创建支付订单...',
      forbidClick: true,
      duration: 0
    });

    // 设置15秒后自动关闭加载提示
    const timeoutTimer = setTimeout(() => {
      closeToast();
      if (isProcessing.value) {
        console.log('[BookingPayment] 全局超时触发');

        // 显示支付超时提示
        showDialog({
          title: '支付请求超时',
          message: '支付请求处理时间过长，请稍后重试'
        }).then(() => {
          isProcessing.value = false;
          isRequestSent.value = false;
        });
      }
    }, 15000); // 15秒超时

    // 对于临时ID，不再直接使用模拟支付，而是调用后端接口
    // 临时ID也可以调用微信支付接口，后端会处理临时预约的特殊逻辑
    if (bookingId.value.startsWith('temp_')) {
      console.log('[BookingPayment] 检测到临时ID:', bookingId.value);
      // 不做特殊处理，继续正常支付流程
    }

    // 验证预约ID
    if (!bookingInfo.value?.id) {
      clearTimeout(timeoutTimer);
      closeToast(); // 使用closeToast替代showToast.clear
      showToast('无法获取预约信息');
      isProcessing.value = false;
      isRequestSent.value = false;
      return;
    }

    // 检查是否在微信浏览器中
    if (selectedPaymentMethod.value === 'wechat') {
      const isWechatBrowser = /MicroMessenger/i.test(navigator.userAgent);
      if (!isWechatBrowser) {
        clearTimeout(timeoutTimer);
        closeToast(); // 使用closeToast替代showToast.clear
        showToast('请在微信浏览器中打开进行支付或使用模拟支付按钮');
        // 确保模拟支付按钮显示
        showSimulateButton.value = true;
        console.log('[BookingPayment] 非微信环境，已启用模拟支付按钮');
        isProcessing.value = false;
        isRequestSent.value = false;
        return;
      }
    }

    // 确保微信SDK已准备好
    if (selectedPaymentMethod.value === 'wechat') {
      try {
        await loadWechatJsScript();
        await initWeixinJSBridge();
        window.wxSDKReady = true;
      } catch (sdkError) {
        console.error('[BookingPayment] 初始化微信SDK失败:', sdkError);
        throw new Error('微信环境准备失败，请刷新后重试');
      }
    }

    let openid = await ensureWechatOpenId()

    console.log('[BookingPayment] 最终获取到的OpenID:', openid)

    if (!openid) {
      console.warn('[BookingPayment] 未能立即获取openid，交由后端自动补全');
    }

    // 构建API路径
    let apiUrl = '/api/installation/create_payment.php';

    // 检查当前环境 - 确保使用完整路径
    const currentHost = window.location.hostname;
    if (currentHost === 'pay.itapgo.com') {
      apiUrl = '/Tapp/admin/api/installation/create_payment.php';
    }

    console.log('[BookingPayment] 创建支付订单API路径:', apiUrl);
    paymentStage.value = '请求支付接口';

    const token = localStorage.getItem('token');
    if (!token) {
      clearTimeout(timeoutTimer);
      closeToast(); // 使用closeToast替代showToast.clear
      showToast('登录状态无效，请重新登录');
      isProcessing.value = false;
      isRequestSent.value = false;
      // 不要直接跳转，让用户手动处理
      return;
    }

    try {
      // 构建后端需要的参数
      const params = new URLSearchParams();
      const appendParam = (key, value) => {
        if (value === undefined || value === null) return;
        params.append(key, String(value));
      };

      appendParam('booking_id', bookingInfo.value.id);
      appendParam('payment_method', selectedPaymentMethod.value);
      if (openid) {
        appendParam('openid', openid);
      }
      appendParam('token', token);
      appendParam('timestamp', Date.now());
      appendParam('client_type', 'h5');
      appendParam('redirect_url', window.location.href);
      appendParam('browser_info', navigator.userAgent);
      appendParam('nonce', Math.random().toString(36).substring(2, 15));
      appendParam('include_package', Number(bookingInfo.value.package_price || 0) > 0 ? '1' : '0');
      appendParam('calculated_amount', calculatedTotalAmount.value.toString());

      console.log('[BookingPayment] 开始发送支付请求');
      paymentStage.value = '发送支付请求';

      // 修改：使用增强的请求方式，确保OpenID正确传递
      console.log('[BookingPayment] 发送支付请求到:', apiUrl);
      console.log('[BookingPayment] 请求参数:', {
        booking_id: bookingInfo.value.id,
        payment_method: selectedPaymentMethod.value,
        openid: openid
      });

      // 设置请求超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20秒超时

      const headers = {
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      };

      if (openid) {
        headers['X-Wechat-Openid'] = openid;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: params.toString(),
        signal: controller.signal
      });

      // 清除超时定时器
      clearTimeout(timeoutId);

      clearTimeout(timeoutTimer);
      closeToast();

      console.log('[BookingPayment] 支付接口响应状态:', response.status);

      if (!response.ok) {
        console.error(`[BookingPayment] 支付请求失败: ${response.status}`);

        // 尝试读取错误信息
        let errorMsg = `支付请求失败(${response.status})`;
        let errorDetails = null;

        try {
          const errorResult = await response.text();
          console.log('[BookingPayment] 错误响应内容:', errorResult);

          // 尝试解析JSON格式的错误
          try {
            const errorJson = JSON.parse(errorResult);
            errorDetails = errorJson;

            if (errorJson.message) {
              errorMsg = errorJson.message;
            } else if (errorJson.error) {
              errorMsg = errorJson.error;
            }

            // 记录更多详细信息
            console.log('[BookingPayment] 解析的错误详情:', errorJson);
          } catch(e) {
            // 如果不是JSON，使用原始文本
            console.warn('[BookingPayment] 响应不是JSON格式:', e.message);
            if (errorResult && errorResult.length < 200) {
              errorMsg = errorResult;
            }
          }
        } catch(e) {
          console.error('[BookingPayment] 读取错误响应失败:', e);
        }

        // 根据状态码定制错误消息
        if (response.status === 401) {
          errorMsg = '登录已过期，请重新登录';
          // 清除本地token
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          // 不要自动跳转，让用户手动处理
        } else if (response.status === 500) {
          errorMsg = '服务器处理异常，请稍后重试' + (errorDetails ? ': ' + errorMsg : '');
        } else if (response.status === 429) {
          errorMsg = '请求过于频繁，请稍后再试';
        } else if (response.status === 0) {
          errorMsg = '网络连接已断开，请检查网络设置';
        }

        // 显示错误信息
        showToast(errorMsg);
        console.error('[BookingPayment] 支付请求失败详情:', { status: response.status, message: errorMsg });
        isProcessing.value = false;
        isRequestSent.value = false;
        return;
      }

      try {
        // 尝试解析JSON响应
        let result;
        try {
          result = await response.json();
          console.log('[BookingPayment] 支付接口响应:', JSON.stringify(result));
        } catch (jsonError) {
          console.error('[BookingPayment] 解析JSON响应失败:', jsonError);
          // 尝试获取原始文本
          const textResponse = await response.text();
          console.log('[BookingPayment] 原始响应内容:', textResponse);
          throw new Error('服务器响应格式错误');
        }

        // 检查响应结果
        if (!result) {
          console.error('[BookingPayment] 响应结果为空');
          showToast('服务器响应为空');
          isProcessing.value = false;
          isRequestSent.value = false;
          return;
        }

        if (result.code !== 0 || !result.data) {
          const errorMsg = result.message || '创建支付订单失败';
          console.error('[BookingPayment] 支付订单创建失败:', errorMsg);
          showToast(errorMsg);
          isProcessing.value = false;
          isRequestSent.value = false;
          return;
        }

        // 获取支付参数
        const paymentData = result.data;
        console.log('[BookingPayment] 支付参数:', JSON.stringify(paymentData));

        // 显示调起支付的提示
        showLoadingToast({
          message: '正在调起微信支付...',
          forbidClick: true,
          duration: 2000 // 2秒后自动关闭，避免卡住
        });

        // 提取支付参数
        let paymentParams;
        console.log('[BookingPayment] 原始支付参数数据:', JSON.stringify(paymentData));

        if (paymentData.payment_params) {
          paymentParams = paymentData.payment_params;
          console.log('[BookingPayment] 使用payment_params字段:', JSON.stringify(paymentParams));
        } else if (paymentData.jsapi_params) {
          paymentParams = paymentData.jsapi_params;
          console.log('[BookingPayment] 使用jsapi_params字段:', JSON.stringify(paymentParams));
        } else if (paymentData.appId || paymentData.timeStamp || paymentData.timestamp) {
          paymentParams = paymentData;
          console.log('[BookingPayment] 直接使用返回数据作为支付参数:', JSON.stringify(paymentParams));
        } else {
          console.error('[BookingPayment] 无法识别的支付参数格式:', JSON.stringify(paymentData));
          closeToast();
          showToast('支付参数格式错误');
          isProcessing.value = false;
          isRequestSent.value = false;
          return;
        }

        // 等待UI更新，确保支付界面显示正确
        await nextTick();

        // 延迟一小段时间后，再尝试调起支付
        setTimeout(async () => {
          closeToast();
          console.log('[BookingPayment] 开始调起微信支付');
          paymentStage.value = '调起微信支付';

          try {
            // 先检查微信环境
            const isWechatBrowser = /MicroMessenger/i.test(navigator.userAgent);
            if (!isWechatBrowser) {
              throw new Error('请在微信浏览器中打开进行支付');
            }

                // 微信JSSDK通过统一分享组件管理

            // 调用微信支付
            await callWechatPayment(paymentParams);

            // 支付成功，更新状态
            const orderNo = paymentData.order_no || '';
            await updatePaymentStatus(orderNo);
          } catch (payError) {
            console.error('[BookingPayment] 调用微信支付异常:', payError);
            if (payError.message.includes('cancel')) {
              showToast('您已取消支付');
            } else {
              showToast(payError.message || '支付失败，请稍后重试');
            }
            isProcessing.value = false;
            isRequestSent.value = false;
          }
        }, 300);
      } catch (jsonError) {
        console.error('[BookingPayment] 解析响应异常:', jsonError);
        closeToast();
        showToast('服务器响应格式错误');
        isProcessing.value = false;
        isRequestSent.value = false;
      }
    } catch (fetchError) {
      clearTimeout(timeoutTimer);
      closeToast();

      console.error('[BookingPayment] 支付请求异常:', fetchError);
      showToast('网络请求错误，请稍后重试');
      isProcessing.value = false;
      isRequestSent.value = false;
    }
  } catch (outerError) {
    console.error('[BookingPayment] 支付函数外层异常:', outerError);
    closeToast();
    const message = outerError?.message ? `支付失败：${outerError.message}` : '支付过程发生错误，请重试';
    showToast(message);
    isProcessing.value = false;
    isRequestSent.value = false;
  }
};

// 提供模拟支付功能
const simulatePayment = () => {
  console.log('[BookingPayment] 模拟支付函数被调用');

  // 清除任何存在的提示
  closeToast(); // 使用closeToast替代showToast.clear

  showConfirmDialog({
    title: '模拟支付',
    message: '由于微信支付接口暂时不可用，您可以使用模拟支付完成预约。点击"确认支付"将直接完成支付流程。',
    confirmButtonText: '确认支付',
    cancelButtonText: '取消'
  }).then(() => {
    // 用户选择模拟支付
    console.log('[BookingPayment] 用户确认模拟支付');

    // 显示加载提示
    showLoadingToast({
      message: '处理中...',
      forbidClick: true,
      duration: 0
    });

    // 模拟短暂延迟
    setTimeout(() => {
      // 清除加载提示
      closeToast(); // 使用closeToast替代showToast.clear

      // 显示成功提示
      showSuccessToast('支付成功');

      // 更新预约状态
      bookingInfo.value.payment_status = 'paid';
      bookingInfo.value.payment_time = new Date().toISOString().replace('T', ' ').substring(0, 19);

      // 重置处理状态
      isProcessing.value = false;
      isRequestSent.value = false;

      console.log('[BookingPayment] 模拟支付成功完成');
    }, 1500);
  }).catch(() => {
    console.log('[BookingPayment] 用户取消模拟支付');
    showToast('支付已取消');
    isProcessing.value = false;
    isRequestSent.value = false;
  });
};

// 调用微信支付 - 增强版
const callWechatPayment = async (payParams) => {
  return new Promise((resolve, reject) => {
    try {
      // 规范化参数
      const params = {
        appId: String(payParams.appId || payParams.appid || ''),
        timeStamp: String(payParams.timeStamp || payParams.timestamp || ''),
        nonceStr: String(payParams.nonceStr || payParams.noncestr || ''),
        package: String(payParams.package || ''),
        signType: String(payParams.signType || payParams.signtype || 'MD5'),
        paySign: String(payParams.paySign || payParams.paysign || '')
      };

      console.log('[BookingPayment] 调用微信支付，参数:', JSON.stringify(params));

      // 检查关键参数
      const missingParams = [];
      if (!params.appId) missingParams.push('appId');
      if (!params.timeStamp) missingParams.push('timeStamp');
      if (!params.nonceStr) missingParams.push('nonceStr');
      if (!params.package) missingParams.push('package');
      if (!params.signType) missingParams.push('signType');
      if (!params.paySign) missingParams.push('paySign');

      if (missingParams.length > 0) {
        console.error('[BookingPayment] 支付参数不完整，缺少:', missingParams.join(', '));

        // 尝试修复 package 参数
        if (!params.package && payParams.prepay_id) {
          params.package = `prepay_id=${payParams.prepay_id}`;
          console.log('[BookingPayment] 修复 package 参数:', params.package);
          // 从缺失参数列表中移除package
          const packageIndex = missingParams.indexOf('package');
          if (packageIndex > -1) {
            missingParams.splice(packageIndex, 1);
          }
        }

        // 再次检查参数，如果还有缺失就拒绝请求
        if (missingParams.length > 0) {
          reject(new Error('支付参数不完整，缺少: ' + missingParams.join(', ')));
          return;
        }
      }

      // 设置超时处理
      const paymentTimeout = setTimeout(() => {
        console.error('[BookingPayment] 微信支付调用超时');
        reject(new Error('支付超时，请重新尝试'));
      }, 10000); // 10秒超时

      // 检查WeixinJSBridge是否可用
      if (typeof window.WeixinJSBridge === 'undefined') {
        console.error('[BookingPayment] WeixinJSBridge未定义');

        // 尝试初始化WeixinJSBridge
        console.log('[BookingPayment] 尝试再次初始化WeixinJSBridge');

        // 设置一个短超时，检查WeixinJSBridge是否在短时间内变得可用
        setTimeout(() => {
          if (typeof window.WeixinJSBridge !== 'undefined') {
            console.log('[BookingPayment] WeixinJSBridge已动态加载，继续支付流程');

            // 调用支付
            callPayApi();
          } else {
            clearTimeout(paymentTimeout);
            console.error('[BookingPayment] WeixinJSBridge无法初始化');
            reject(new Error('微信支付接口不可用，请确保在微信浏览器中打开，或刷新页面后重试'));
          }
        }, 1000);

        return;
      }

      // 直接调用支付
      callPayApi();

      // 定义调用支付API的函数
      function callPayApi() {
        try {
          // 调用微信支付
          window.WeixinJSBridge.invoke('getBrandWCPayRequest', params, (res) => {
            clearTimeout(paymentTimeout); // 清除超时定时器
            console.log('[BookingPayment] 微信支付返回结果:', JSON.stringify(res));

            // 处理返回结果
            const errMsg = res.err_msg || '';
            if (errMsg.indexOf('ok') > -1) {
              // 支付成功
              showSuccessToast('支付成功');
              bookingInfo.value.payment_status = 'paid'; // 立即更新本地状态
              resolve(true);
            } else if (errMsg.indexOf('cancel') > -1) {
              // 用户取消支付
              reject(new Error('用户取消支付'));
            } else {
              // 支付失败
              reject(new Error('支付失败: ' + errMsg));
            }
          });
        } catch (invokeError) {
          clearTimeout(paymentTimeout);
          console.error('[BookingPayment] 调用WeixinJSBridge.invoke失败:', invokeError);
          reject(new Error('调用支付接口失败: ' + invokeError.message));
        }
      }
    } catch (error) {
      console.error('[BookingPayment] 调用微信支付出现异常:', error);
      reject(new Error('支付处理异常: ' + error.message));
    }
  });
};

// 更新支付状态
const updatePaymentStatus = async (orderNo = null) => {
  try {
    // 如果是临时ID，更新localStorage
    if (bookingId.value.startsWith('temp_')) {
      console.log('[BookingPayment] 正在处理临时预约支付状态更新', { id: bookingId.value, orderNo });

      closeToast(); // 使用closeToast替代showToast.clear

      const savedData = localStorage.getItem('temp_booking_data');
      if (savedData) {
        console.log('[BookingPayment] 找到临时预约数据，准备更新');
        try {
          const data = JSON.parse(savedData);
          data.payment_status = 'paid';
          data.payment_time = new Date().toISOString().replace('T', ' ').substring(0, 19);
          localStorage.setItem('temp_booking_data', JSON.stringify(data));
          console.log('[BookingPayment] 临时预约状态已更新为已支付', data);

          // 更新当前组件的数据
          bookingInfo.value.payment_status = 'paid';
          bookingInfo.value.payment_time = data.payment_time;

          // 显示支付成功消息
          showSuccessToast('支付成功');

          // 创建支付成功记录，便于后续同步到服务器
          const paymentRecord = {
            booking_id: bookingId.value,
            order_no: orderNo || 'TEMP' + Date.now(),
            payment_time: data.payment_time,
            payment_method: selectedPaymentMethod.value,
            amount: calculatedTotalAmount.value,
            include_package: Number(bookingInfo.value.package_price || 0) > 0 ? 1 : 0,
            status: 'paid'
          };

          console.log('[BookingPayment] 创建临时支付记录', paymentRecord);

          // 保存到localStorage
          const paymentRecords = JSON.parse(localStorage.getItem('payment_records') || '[]');
          paymentRecords.push(paymentRecord);
          localStorage.setItem('payment_records', JSON.stringify(paymentRecords));
          console.log('[BookingPayment] 支付记录已保存到localStorage');

          // 请求服务器同步支付状态
          try {
            // 构建API路径
            let syncUrl = '/api/installation/sync_payment.php';
            const currentHost = window.location.hostname;
            if (currentHost === 'pay.itapgo.com') {
              syncUrl = '/Tapp/admin/api/installation/sync_payment.php';
            }

            console.log('[BookingPayment] 同步支付记录到服务器', { syncUrl, record: paymentRecord });

            // 同步支付记录到服务器
            const token = localStorage.getItem('token');
            if (token) {
              fetch(syncUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentRecord)
              }).then(response => {
                console.log('[BookingPayment] 支付记录同步响应状态:', response.status);
                if (response.ok) {
                  console.log('[BookingPayment] 支付记录同步成功');
                } else {
                  console.warn('[BookingPayment] 支付记录同步返回非成功状态码:', response.status);
                }
              }).catch(error => {
                console.error('[BookingPayment] 支付记录同步失败:', error);
              });
            } else {
              console.warn('[BookingPayment] 无法同步支付记录，token不存在');
            }
          } catch (syncError) {
            console.error('[BookingPayment] 同步支付记录异常:', syncError);
          }
        } catch (parseError) {
          console.error('[BookingPayment] 解析临时预约数据失败:', parseError);
          showToast('处理订单数据失败');
        }
      } else {
        console.warn('[BookingPayment] 未找到临时预约数据');
        showToast('找不到预约信息');
      }

      // 无论如何，都确保设置为未处理状态
      isProcessing.value = false;
      return;
    }

    showLoadingToast({
      message: '正在更新支付状态...',
      forbidClick: true,
      duration: 0
    });

    // 调用API更新支付状态
    let apiUrl = '/api/installation/update_payment_status.php';

    // 检查当前环境
    const currentHost = window.location.hostname;
    if (currentHost === 'pay.itapgo.com') {
      apiUrl = '/Tapp/admin/api/installation/update_payment_status.php';
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('[BookingPayment] 无法更新支付状态: 未找到Token');
      showToast('Token无效，请重新登录');
      isProcessing.value = false;
      return;
    }

    const formData = new FormData();
    formData.append('booking_id', bookingInfo.value.id);
    formData.append('status', 'paid');
    formData.append('payment_method', selectedPaymentMethod.value);

    // 如果有订单号，也传递
    if (orderNo) {
      formData.append('order_no', orderNo);
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error(`[BookingPayment] 更新支付状态失败: ${response.status}`);
      showToast('更新支付状态失败，请稍后重试');
      isProcessing.value = false;
      return;
    }

    const result = await response.json();
    console.log('[BookingPayment] 更新支付状态结果:', result);

    if (result.code === 0) {
      // 更新成功
      closeToast(); // 替换showToast.clear
      showSuccessToast('支付成功');
      bookingInfo.value.payment_status = 'paid';
      // 刷新预约信息
      await fetchBookingInfo();
    } else {
      // 更新失败
      showToast(result.message || '更新支付状态失败');
    }

    isProcessing.value = false;
  } catch (error) {
    console.error('[BookingPayment] 更新支付状态异常:', error);
    showToast('更新支付状态出错，请稍后重试');
    isProcessing.value = false;
  }
};

// 微信JSSDK初始化已移至统一的分享组件中

// 初始化WeixinJSBridge对象
const initWeixinJSBridge = () => {
  return new Promise((resolve) => {
    if (typeof window.WeixinJSBridge !== 'undefined') {
      console.log('[BookingPayment] WeixinJSBridge已就绪');
      resolve();
      return;
    }

    console.log('[BookingPayment] 尝试初始化WeixinJSBridge');

    // 尝试通过事件监听初始化
    if (document.addEventListener) {
      document.addEventListener('WeixinJSBridgeReady', () => {
        console.log('[BookingPayment] WeixinJSBridge通过事件初始化成功');
        resolve();
      }, false);
    }

    // 在微信环境中尝试iframe桥接方式初始化
    const isWechatBrowser = /MicroMessenger/i.test(navigator.userAgent);
    if (isWechatBrowser) {
      try {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = 'https://mp.weixin.qq.com/mp/jsbridge?action=jsbridge';
        document.body.appendChild(iframe);
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch (removeError) {
            console.error('[BookingPayment] 移除iframe失败:', removeError);
          }
          console.log('[BookingPayment] 通过iframe尝试初始化WeixinJSBridge');
        }, 100);
      } catch (e) {
        console.error('[BookingPayment] iframe初始化WeixinJSBridge失败:', e);
      }

      // 尝试直接调用WeixinJSBridge方法
      try {
        if (window.WeixinJSBridge && typeof window.WeixinJSBridge.invoke === 'function') {
          console.log('[BookingPayment] 直接调用WeixinJSBridge方法初始化成功');
          resolve();
          return;
        }
      } catch (directError) {
        console.error('[BookingPayment] 直接调用WeixinJSBridge方法失败:', directError);
      }
    }

    // 设置一个超时，不要无限等待
    setTimeout(() => {
      console.log('[BookingPayment] WeixinJSBridge初始化超时，继续后续步骤');
      // 即使超时也尝试再次检查WeixinJSBridge是否存在
      if (typeof window.WeixinJSBridge !== 'undefined') {
        console.log('[BookingPayment] 超时后检测到WeixinJSBridge已就绪');
      } else {
        console.warn('[BookingPayment] 超时后WeixinJSBridge仍然不可用');
      }
      resolve();
    }, 1500); // 缩短超时时间，避免用户等待太久
  });
};

// 动态加载微信JSSDK脚本
const loadWechatJsScript = () => {
  return new Promise((resolve) => {
    // 检查是否已加载
    if (typeof window.wx !== 'undefined' || document.getElementById('wechat-jssdk')) {
      console.log('[BookingPayment] 微信JSSDK已加载');
      resolve();
      return;
    }

    console.log('[BookingPayment] 开始加载微信JSSDK脚本');

    // 设置超时定时器，确保不会无限等待
    const scriptTimeout = setTimeout(() => {
      console.warn('[BookingPayment] 加载微信JSSDK脚本超时');
      resolve();
    }, 5000);

    try {
      // 创建script标签
      const script = document.createElement('script');
      script.id = 'wechat-jssdk';
      script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js';
      script.crossOrigin = 'anonymous'; // 添加跨域支持

      // 设置回调
      script.onload = () => {
        clearTimeout(scriptTimeout);
        console.log('[BookingPayment] 微信JSSDK脚本加载成功');

        // 确保对象存在
        if (typeof window.wx === 'undefined') {
          console.warn('[BookingPayment] 脚本加载成功但wx对象不存在');
          // 尝试再次检查
          setTimeout(() => {
            if (typeof window.wx !== 'undefined') {
              console.log('[BookingPayment] 延迟检查到wx对象已存在');
            } else {
              console.error('[BookingPayment] 延迟检查wx对象仍然不存在');
            }
            resolve();
          }, 500);
        } else {
          resolve();
        }
      };

      script.onerror = (error) => {
        clearTimeout(scriptTimeout);
        console.error('[BookingPayment] 微信JSSDK脚本加载失败:', error);

        // 尝试使用备用CDN
        try {
          const backupScript = document.createElement('script');
          backupScript.id = 'wechat-jssdk-backup';
          backupScript.src = 'https://cdn.bootcdn.net/ajax/libs/jweixin/1.6.0/jweixin.min.js';
          backupScript.crossOrigin = 'anonymous';

          backupScript.onload = () => {
            console.log('[BookingPayment] 备用CDN加载微信JSSDK成功');
            resolve();
          };

          backupScript.onerror = () => {
            console.error('[BookingPayment] 备用CDN也加载失败');
            resolve(); // 即使失败也resolve，不阻塞后续流程
          };

          document.head.appendChild(backupScript);
        } catch (backupError) {
          console.error('[BookingPayment] 尝试加载备用JSSDK失败:', backupError);
          resolve();
        }
      };

      // 添加到页面
      document.head.appendChild(script);
    } catch (e) {
      clearTimeout(scriptTimeout);
      console.error('[BookingPayment] 添加JSSDK脚本异常:', e);
      resolve();
    }
  });
};

// 格式化安装时间
const formatInstallTime = (timeString) => {
  // 安全检查输入
  if (timeString === undefined || timeString === null) {
    console.warn('[BookingPayment] formatInstallTime received undefined or null input');
    return '未设置';
  }

  // 确保输入是字符串
  if (typeof timeString !== 'string') {
    console.warn('[BookingPayment] formatInstallTime received non-string input:', timeString);
    try {
      timeString = String(timeString);
    } catch (e) {
      console.error('[BookingPayment] Failed to convert timeString to string:', e);
      return '未设置';
    }
  }

  // 空字符串检查
  if (timeString === '') {
    console.warn('[BookingPayment] formatInstallTime received empty string');
    return '未设置';
  }

  try {
    // 检查是否有空格，如果没有则不是有效的时间格式
    if (!timeString.includes(' ')) {
      console.warn('[BookingPayment] Invalid time format (no space):', timeString);
      return timeString; // 返回原始值
    }

    // 假设时间格式为 "YYYY-MM-DD HH:MM:SS"
    const parts = timeString.split(' ');
    if (parts.length < 2) {
      console.warn('[BookingPayment] Invalid time format (split failed):', timeString);
      return timeString;
    }

    const [datePart, timePart] = parts;

    // 检查日期部分是否有效
    if (!datePart || !datePart.includes('-')) {
      console.warn('[BookingPayment] Invalid date part:', datePart);
      return timeString;
    }

    // 处理日期部分 YYYY-MM-DD -> YYYY年MM月DD日
    // 使用更安全的方式处理日期
    const dateMatch = datePart.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!dateMatch || dateMatch.length < 4) {
      console.warn('[BookingPayment] Date part does not match expected format:', datePart);
      return timeString;
    }

    const year = dateMatch[1];
    const month = dateMatch[2];
    const day = dateMatch[3];
    const dateText = `${year}年${month}月${day}日`;

    // 处理时间部分 HH:MM:SS -> HH:MM
    if (!timePart || !timePart.includes(':')) {
      console.warn('[BookingPayment] Invalid time part:', timePart);
      return timeString;
    }

    const timeParts = timePart.split(':');
    if (timeParts.length < 2) {
      console.warn('[BookingPayment] Time part does not have enough components:', timePart);
      return timeString;
    }
    const timeText = timeParts.slice(0, 2).join(':');

    // 获取星期几
    try {
      const date = new Date(`${year}-${month}-${day}T00:00:00`);
      if (isNaN(date.getTime())) {
        console.warn('[BookingPayment] Invalid date object created:', date);
        return timeString;
      }
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const weekDay = weekDays[date.getDay()];

      // 整合
      return `${dateText} ${weekDay} ${timeText}`;
    } catch (dateError) {
      console.error('[BookingPayment] Error creating date object:', dateError);
      return timeString;
    }
  } catch (e) {
    console.error('[BookingPayment] Error formatting install time:', e);
    console.error('[BookingPayment] Error details:', e.message, e.stack);
    return timeString || '未设置';
  }
};

// 获取套餐名称
const getPackageName = (type) => {
  // 安全检查输入
  if (type === undefined || type === null) {
    console.warn('[BookingPayment] getPackageName received undefined or null input');
    return '未知套餐';
  }

  // 确保输入是字符串
  let packageType = type;
  if (typeof packageType !== 'string') {
    console.warn('[BookingPayment] getPackageName received non-string input:', type);
    try {
      packageType = String(packageType);
    } catch (e) {
      console.error('[BookingPayment] Failed to convert package type to string:', e);
      return '未知套餐';
    }
  }

  // 安全地去除空格 - 只有当字符串非空时才调用trim()
  if (packageType && typeof packageType === 'string' && typeof packageType.trim === 'function') {
    try {
      packageType = packageType.trim();
    } catch (e) {
      console.error('[BookingPayment] Error trimming package type:', e);
      // 继续使用原始值
    }
  }

  const packagesMap = {
    'personal': '个人/企业套餐',
    'unlimited': '无限畅饮套餐',
    'business_year': '商务机包年套餐',
    'business_flow': '商务机流量套餐'
  };

  return packagesMap[packageType] || '未知套餐';
};

// 跳转到预约列表 - 强化版
const goToBookingList = () => {
  console.log('[BookingPayment] 准备跳转到预约列表页面');
  
  try {
    // 使用replace而不是push，避免用户返回到支付页面
    router.replace('/installation/bookings');
    console.log('[BookingPayment] 路由跳转命令已执行');
  } catch (error) {
    console.error('[BookingPayment] 路由跳转失败:', error);
    // 如果路由跳转失败，使用window.location作为备选方案
    try {
      window.location.href = '/app/#/installation/bookings';
      console.log('[BookingPayment] 使用window.location备选方案跳转');
    } catch (locationError) {
      console.error('[BookingPayment] window.location跳转也失败:', locationError);
      showToast('页面跳转失败，请手动返回预约列表');
    }
  }
};
</script>

<style scoped>
.booking-payment {
  padding: 16px;
  background-color: #f7f8fa;
  min-height: 100vh;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.payment-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.payment-header {
  text-align: center;
  margin-bottom: 20px;
}

.payment-title {
  font-size: 20px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 8px;
}

.payment-subtitle {
  font-size: 14px;
  color: #969799;
}

.card-shadow {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(100, 101, 102, 0.08);
  padding: 16px;
  margin-bottom: 16px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.order-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.order-status {
  font-size: 14px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
}

.status-unpaid {
  color: #ff976a;
  background-color: rgba(255, 151, 106, 0.1);
}

.status-paid {
  color: #07c160;
  background-color: rgba(7, 193, 96, 0.1);
}

.order-info {
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  margin-bottom: 12px;
}

.info-label {
  width: 80px;
  font-size: 14px;
  color: #969799;
  flex-shrink: 0;
}

.info-value {
  flex: 1;
  font-size: 14px;
  color: #323233;
}

.address-value {
  word-break: break-all;
}

.order-divider {
  height: 1px;
  background-color: #f2f3f5;
  margin: 16px 0;
}

.price-info {
  margin-top: 16px;
}

.price-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin: 8px 0;
  background-color: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.price-item-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.installation-fee {
  background-color: #f0f9ff;
  border-left: 4px solid #1989fa;
}

.plan-summary {
  background-color: #f0f9ff;
  border-left: 4px solid #1989fa;
}
.plan-summary .price-desc {
  color: #0f172a;
}

.deposit-item {
  background-color: #fff8f1;
  border-left: 4px solid #fb923c;
}

.deposit-item .price-value {
  font-weight: 600;
}

.deposit-tag {
  margin-left: 6px;
  font-size: 12px;
  color: #16a34a;
}

/* 添加动画效果 */
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.price-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 12px;
  background-color: rgba(25, 137, 250, 0.1);
}

.installation-icon {
  background-color: rgba(25, 137, 250, 0.1);
}

.installation-icon .van-icon {
  color: #1989fa;
}

.package-icon {
  background-color: rgba(238, 10, 36, 0.08);
}

.package-icon .van-icon {
  color: #ee0a24;
}

.price-details {
  display: flex;
  flex-direction: column;
}

.price-label {
  font-size: 15px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 2px;
}

.price-desc {
  font-size: 12px;
  color: #969799;
}

.price-value {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  white-space: nowrap;
}

.price-divider {
  height: 1px;
  background-color: #f2f3f5;
  margin: 12px 0;
}

.total-price {
  padding: 12px 16px;
  background-color: #fff;
  border-radius: 12px;
  border-left: none;
  margin-top: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.total-price .price-label {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.total-price .price-value {
  font-size: 20px;
  font-weight: 700;
  color: #ee0a24;
}

.payment-methods {
  margin-top: 16px;
}

.method-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 16px;
}

.method-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.method-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  background-color: #f7f8fa;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.method-selected {
  background-color: rgba(7, 193, 96, 0.08);
  border: 1px solid rgba(7, 193, 96, 0.3);
}

.method-disabled {
  opacity: 0.75;
  cursor: not-allowed;
  background-color: #f2f3f5;
  border: 1px solid #ebedf0;
}

.method-icon {
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
}

.method-name {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: #323233;
}

.method-check {
  display: flex;
  align-items: center;
  justify-content: center;
}

.method-disabled-tag {
  font-size: 12px;
  color: #969799;
  background-color: #f2f3f5;
  padding: 2px 6px;
  border-radius: 4px;
  position: absolute;
  right: 16px;
}

.payment-action {
  margin-top: 24px;
  padding-bottom: 40px;
}

/* 微信支付按钮强调样式 */
.payment-action .van-button--primary {
  background-color: #07c160 !important;
  border-color: #07c160 !important;
  box-shadow: 0 4px 12px rgba(7, 193, 96, 0.35);
  transition: all 0.3s ease;
  font-weight: bold;
}

.payment-action .van-button--primary:active {
  background-color: #06ae56 !important;
  border-color: #06ae56 !important;
  transform: translateY(2px);
  box-shadow: 0 2px 8px rgba(7, 193, 96, 0.25);
}

/* 微信图标样式 */
.method-item .van-icon-wechat {
  font-size: 28px !important;
  color: #07c160 !important;
}

.payment-success {
  text-align: center;
  padding: 32px 16px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(100, 101, 102, 0.08);
  margin-top: 24px;
}

.success-icon {
  margin-bottom: 16px;
}

.success-text {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 8px;
}

.success-desc {
  font-size: 14px;
  color: #969799;
  margin-bottom: 24px;
}
</style>
