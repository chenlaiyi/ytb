<template>
  <div class="mall-orders-container">
    <van-nav-bar
      title="订单管理"
      left-arrow
      @click-left="onClickLeft"
    />

    <van-tabs v-model:active="activeTab" sticky swipeable>
      <van-tab title="预约订单" name="install" />
      <van-tab title="商城订单" name="mall" />
    </van-tabs>

    <div v-if="activeTab === 'mall'">
      <!-- 搜索和筛选区 -->
      <div class="search-filter-area">
        <van-search 
          v-model="listQuery.keyword" 
          placeholder="订单号/设备号/客户名称/电话"
          @search="handleFilter"
          shape="round"
        />
        
        <van-dropdown-menu>
          <van-dropdown-item v-model="listQuery.status" :options="orderStatusOptions" />
          <van-dropdown-item v-model="listQuery.payment_status" :options="paymentStatusOptions" />
        </van-dropdown-menu>
        
        <div class="date-filter">
          <van-cell title="时间范围" is-link @click="showCalendar = true" />
          <div class="selected-date" v-if="listQuery.start_date && listQuery.end_date">
            {{ listQuery.start_date }} 至 {{ listQuery.end_date }}
          </div>
        </div>
      </div>
      
      <!-- 统计卡片 -->
      <div class="statistics-card">
        <van-grid :column-num="3">
          <van-grid-item>
            <template #text>
              <div class="statistic-value">{{ statistics.totalOrders }}</div>
              <div class="statistic-label">总订单数</div>
              <div class="statistic-trend">今日：{{ statistics.todayOrders }}</div>
            </template>
          </van-grid-item>
          <van-grid-item>
            <template #text>
              <div class="statistic-value">¥{{ statistics.totalAmount }}</div>
              <div class="statistic-label">总金额</div>
            </template>
          </van-grid-item>
          <van-grid-item>
            <template #text>
              <div class="statistic-value">¥{{ statistics.todayAmount }}</div>
              <div class="statistic-label">今日成交额</div>
            </template>
          </van-grid-item>
        </van-grid>
      </div>
      
      <!-- 订单列表 -->
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="listLoading"
          :finished="finished"
          finished-text="没有更多了"
          :immediate-check="false"
          @load="loadMore"
        >
          <div v-if="list.length === 0 && !listLoading" class="empty-tip">
            <van-empty description="暂无订单数据" />
          </div>
          
          <div v-for="(item, index) in list" :key="index" class="order-card">
            <van-cell-group inset>
              <van-cell>
                <template #title>
                  <div class="order-title">
                    <span class="order-number">{{ item.order_no }}</span>
                    <van-tag :type="getOrderStatusType(item.status)" round>
                      {{ getOrderStatusText(item.status) }}
                    </van-tag>
                  </div>
                </template>
                <template #label>
                  <div class="order-subtitle">
                    支付状态：{{ resolvePaymentText(item.payment_status) }}
                  </div>
                </template>
                <template #right-icon>
                  <van-button type="primary" size="small" @click="viewOrderDetail(item.id)">详情</van-button>
                </template>
              </van-cell>
              <van-cell title="客户" :value="formatCustomer(item.user)" />
              <van-cell title="实付金额" :value="`¥${formatCurrency(item.paid_amount ?? item.total_amount)}`" />
              <van-cell title="下单时间" :value="formatDateTime(item.created_at)" />
              <van-cell title="收货地址" :value="formatAddress(item.shipping_address)" />
            </van-cell-group>
          </div>
        </van-list>
      </van-pull-refresh>
      
      <!-- 订单详情弹窗 -->
      <van-popup
        v-model:show="orderDetailVisible"
        round
        position="bottom"
        :style="{ height: '85%' }"
      >
        <div class="popup-header">
          <div class="popup-title">订单详情</div>
          <van-icon name="cross" @click="orderDetailVisible = false" />
        </div>
        
        <div class="popup-content" v-if="currentOrder">
          <van-skeleton title :row="10" :loading="detailLoading">
            <!-- 订单基本信息 -->
            <div class="detail-section">
              <div class="section-title">
                订单信息
                <van-tag :type="getOrderStatusType(currentOrder.status)">
                  {{ getOrderStatusText(currentOrder.status) }}
                </van-tag>
              </div>
              <van-cell-group inset>
                <van-cell title="订单号" :value="currentOrder.order_no" />
                <van-cell title="支付状态" :value="resolvePaymentText(currentOrder.pay_status)" />
                <van-cell title="订单金额" :value="`¥${formatCurrency(currentOrder.order_amount)}`" />
                <van-cell title="实付金额" :value="`¥${formatCurrency(currentOrder.payed)}`" />
                <van-cell title="下单时间" :value="formatDateTime(currentOrder.create_time)" />
                <van-cell title="支付时间" :value="formatDateTime(currentOrder.payment_time)" />
                <van-cell title="完成时间" :value="formatDateTime(currentOrder.confirm_time)" />
              </van-cell-group>
            </div>
            
            <!-- 客户信息 -->
            <div class="detail-section">
              <div class="section-title">客户信息</div>
              <van-cell-group inset>
                <van-cell title="姓名" :value="currentOrder.user?.nickname || currentOrder.user?.name || '—'" />
                <van-cell title="联系电话" :value="currentOrder.user?.phone || '—'" />
              </van-cell-group>
            </div>
            
            <!-- 收货信息 -->
            <div class="detail-section">
              <div class="section-title">收货信息</div>
              <van-cell-group inset>
                <van-cell title="收货人" :value="currentOrder.ship_name || '—'" />
                <van-cell title="联系电话" :value="currentOrder.ship_mobile || '—'" />
                <van-cell title="收货地址" :value="currentOrder.ship_address || formatAddress(currentOrder.shipping_address)" />
              </van-cell-group>
            </div>
            
            <!-- 商品信息 -->
            <div class="detail-section" v-if="currentOrder.items?.length">
              <div class="section-title">商品信息</div>
              <van-cell-group inset>
                <van-cell v-for="product in currentOrder.items" :key="product.id">
                  <template #title>
                    <div class="order-item-title">{{ product.name }}</div>
                    <div class="order-item-spec">{{ product.spec_text }}</div>
                  </template>
                  <template #label>
                    数量：×{{ product.nums }} ｜ 单价 ¥{{ formatCurrency(product.price) }}
                  </template>
                  <template #value>
                    ¥{{ formatCurrency(product.amount) }}
                  </template>
                </van-cell>
              </van-cell-group>
            </div>
            
          </van-skeleton>
        </div>
      </van-popup>
    </div>

    <div v-else class="install-orders-tab">
      <AdminInstallBookings embedded />
    </div>
    <!-- 日期选择器 -->
    <van-calendar
      v-model:show="showCalendar"
      type="range"
      title="选择日期范围"
      :min-date="minDate"
      :max-date="maxDate"
      @confirm="onDateRangeConfirm"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showFailToast } from 'vant';
import { adminOrderApi } from '@/api/mall';
import AdminInstallBookings from './InstallBookings.vue';

const router = useRouter();

const activeTab = ref('mall');

// 数据列表
const list = ref([]);
const total = ref(0);
const listLoading = ref(false);
const refreshing = ref(false);
const finished = ref(false);
const page = ref(1);
const limit = ref(10);

// 查询参数
const listQuery = reactive({
  keyword: '',
  status: '',
  payment_status: '',
  start_date: '',
  end_date: ''
});

// 筛选选项
const orderStatusOptions = [
  { text: '全部状态', value: '' },
  { text: '待支付', value: 0 },
  { text: '待发货', value: 1 },
  { text: '待收货', value: 2 },
  { text: '已完成', value: 3 },
  { text: '售后', value: 4 },
  { text: '已关闭', value: 5 }
];

const paymentStatusOptions = [
  { text: '全部支付状态', value: '' },
  { text: '未支付', value: 0 },
  { text: '已支付', value: 1 },
  { text: '已退款', value: 2 }
];

// 订单详情
const orderDetailVisible = ref(false);
const currentOrder = ref(null);
const detailLoading = ref(false);

// 日期选择
const showCalendar = ref(false);
const minDate = new Date(new Date().getFullYear() - 1, 0, 1);
const maxDate = new Date();

// 统计数据
const statistics = reactive({
  totalOrders: 0,
  totalAmount: '0.00',
  todayOrders: 0,
  todayAmount: '0.00'
});

const ORDER_STATUS_MAP = {
  0: { text: '待支付', type: 'warning' },
  1: { text: '待发货', type: 'primary' },
  2: { text: '待收货', type: 'success' },
  3: { text: '已完成', type: 'success' },
  4: { text: '售后', type: 'danger' },
  5: { text: '已关闭', type: 'default' }
};

const PAYMENT_STATUS_MAP = {
  0: '未支付',
  1: '已支付',
  2: '已退款'
};

const formatCurrency = (value) => {
  const num = Number(value || 0);
  return num.toFixed(2);
};

const formatDateTime = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const pad = (v) => String(v).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const resolveStatusMeta = (status) => {
  const key = Number(status);
  return ORDER_STATUS_MAP[key] || { text: '未知状态', type: 'default' };
};

const resolvePaymentText = (status) => {
  const key = Number(status);
  return PAYMENT_STATUS_MAP[key] || '未知';
};

const formatAddress = (shipping) => {
  if (!shipping) return '—';
  if (typeof shipping === 'string') return shipping;
  const parts = [shipping.province, shipping.city, shipping.district, shipping.detail].filter(Boolean);
  return parts.length ? parts.join(' ') : '—';
};

// 页面加载
onMounted(() => {
  fetchOrders({ reset: true });
  fetchStats();
});

// 导航栏返回按钮点击
const onClickLeft = () => {
  router.push('/admin');
};

const fetchStats = async () => {
  try {
    const res = await adminOrderApi.getStatistics();
    if (res?.code === 0) {
      const overview = res.data?.overall ?? {};
      statistics.totalOrders = overview.total_orders ?? 0;
      statistics.totalAmount = formatCurrency(overview.total_amount);
      statistics.todayOrders = overview.today_orders ?? 0;
      statistics.todayAmount = formatCurrency(overview.today_amount);
    }
  } catch (error) {
    console.error('获取统计数据失败:', error);
  }
};

const fetchOrders = async ({ reset = false } = {}) => {
  if (listLoading.value) return;
  listLoading.value = true;
  try {
    if (reset) {
      page.value = 1;
      list.value = [];
      finished.value = false;
    }

    const params = {
      page: page.value,
      per_page: limit.value
    };

    if (listQuery.keyword) params.keyword = listQuery.keyword.trim();
    if (listQuery.status !== '' && listQuery.status !== null) params.status = listQuery.status;
    if (listQuery.payment_status !== '' && listQuery.payment_status !== null) params.payment_status = listQuery.payment_status;
    if (listQuery.start_date) params.start_date = listQuery.start_date;
    if (listQuery.end_date) params.end_date = listQuery.end_date;

    const res = await adminOrderApi.getList(params);
    if (res?.code !== 0) {
      showFailToast(res?.message || '获取订单列表失败');
      return;
    }

    const payload = res?.data ?? {};
    const listData = payload.list ?? payload.data ?? [];
    list.value = reset ? listData : list.value.concat(listData);
    total.value = payload.total ?? list.value.length;

    if (list.value.length >= total.value || listData.length < limit.value) {
      finished.value = true;
    } else {
      page.value += 1;
    }
  } catch (error) {
    console.error('获取订单列表失败:', error);
    showFailToast(error.message || '获取订单列表失败');
  } finally {
    listLoading.value = false;
    refreshing.value = false;
  }
};

// 下拉刷新
const onRefresh = () => {
  page.value = 1;
  finished.value = false;
  fetchOrders({ reset: true });
  fetchStats();
};

// 加载更多
const loadMore = () => {
  if (finished.value) return;
  fetchOrders();
};

// 搜索过滤
const handleFilter = () => {
  page.value = 1;
  finished.value = false;
  fetchOrders({ reset: true });
  fetchStats();
};

// 查看订单详情
const viewOrderDetail = async (id) => {
  orderDetailVisible.value = true;
  detailLoading.value = true;
  currentOrder.value = null;
  try {
    const res = await adminOrderApi.getDetail(id);
    if (res?.code === 0 && res.data) {
      currentOrder.value = res.data;
    } else {
      showFailToast(res?.message || '获取订单详情失败');
      orderDetailVisible.value = false;
    }
  } catch (error) {
    console.error('获取订单详情失败:', error);
    showFailToast(error.message || '获取订单详情失败');
    orderDetailVisible.value = false;
  } finally {
    detailLoading.value = false;
  }
};

// 日期范围确认
const onDateRangeConfirm = (dates) => {
  const [start, end] = dates;
  
  // 格式化日期
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  listQuery.start_date = formatDate(start);
  listQuery.end_date = formatDate(end);
  
  showCalendar.value = false;
  handleFilter(); // 触发搜索
};

const getOrderStatusType = (status) => resolveStatusMeta(status).type;
const getOrderStatusText = (status) => resolveStatusMeta(status).text;
const formatCustomer = (user) => {
  if (!user) return '—';
  const name = user.nickname || user.name || '—';
  return user.phone ? `${name} (${user.phone})` : name;
};

</script>

<style scoped>
.mall-orders-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.search-filter-area {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #fff;
}

.date-filter {
  background-color: #fff;
}

.selected-date {
  padding: 0 16px 10px;
  font-size: 12px;
  color: #1989fa;
}

.statistics-card {
  margin: 8px 0;
  background-color: #fff;
}

.statistic-value {
  font-size: 20px;
  font-weight: bold;
  color: #1989fa;
}

.statistic-label {
  font-size: 12px;
  color: #646566;
}

.statistic-trend {
  font-size: 12px;
  color: #969799;
  margin-top: 4px;
}

.order-card {
  margin: 8px 0;
}

.order-title {
  display: flex;
  align-items: center;
}

.order-number {
  margin-right: 8px;
  font-weight: bold;
}

.order-subtitle {
  font-size: 12px;
  color: #969799;
  margin-top: 4px;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebedf0;
}

.popup-title {
  font-weight: bold;
  font-size: 16px;
}

.popup-content {
  padding: 16px;
  overflow-y: auto;
  max-height: calc(100% - 60px);
}

.section-title {
  margin: 0 16px 8px;
  font-weight: bold;
  color: #323233;
  display: flex;
  align-items: center;
}

.section-title .van-tag {
  margin-left: 8px;
}

.detail-section {
  margin-bottom: 16px;
}

.order-item-title {
  font-weight: 600;
  color: #323233;
}

.order-item-spec {
  font-size: 12px;
  color: #969799;
}

.empty-tip {
  margin-top: 40px;
}

.install-orders-tab {
  padding: 0 12px 24px;
}
</style> 
