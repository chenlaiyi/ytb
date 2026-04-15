<template>
  <div class="merchant-page">
    <van-nav-bar
      title="商户管理"
      left-arrow
      fixed
      placeholder
      @click-left="handleBack"
    />

    <div class="page-body">
      <div class="source-switch">
        <div
          v-for="option in sourceOptions"
          :key="option.value"
          class="source-chip"
          :class="{ active: currentSource === option.value }"
          @click="switchSource(option.value)"
        >
          {{ option.label }}
        </div>
      </div>

      <div v-if="summaryMetrics.length" class="summary-wrapper">
        <div class="summary-card" :class="summaryTheme.cardClass">
          <div class="summary-card-title">
            <span>{{ summaryTheme.title }}</span>
            <span class="summary-card-subtitle">{{ summaryTheme.subtitle }}</span>
          </div>
          <div class="summary-metric-grid">
            <div
              class="summary-metric"
              v-for="item in summaryMetrics"
              :key="item.key"
            >
              <div class="summary-metric-value">{{ item.value }}</div>
              <div class="summary-metric-label">{{ item.label }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="search-panel">
        <van-search
          v-model="searchForm.keyword"
          placeholder="搜索商户名称 / 编号"
          show-action
          @search="handleSearch"
          @cancel="resetSearch"
        >
          <template #action>
            <van-button size="small" type="primary" round @click="handleSearch">查询</van-button>
          </template>
        </van-search>

        <div class="filter-line" v-if="showFilter">
          <van-dropdown-menu>
            <van-dropdown-item
              v-if="currentSource === 'unionpay'"
              v-model="searchForm.institution_number"
              :options="filterOptions.institutions"
              @change="handleSearch"
            />
            <van-dropdown-item
              v-else-if="currentSource === 'shengfutong'"
              v-model="searchForm.reseller_id"
              :options="filterOptions.resellers"
              @change="handleSearch"
            />
            <van-dropdown-item
              v-else-if="currentSource === 'meituan'"
              v-model="searchForm.institution_id"
              :options="filterOptions.institutions"
              @change="handleSearch"
            />
          </van-dropdown-menu>
        </div>
      </div>

      <van-pull-refresh v-model="refreshing" @refresh="handleRefresh">
        <div v-if="!loading && merchants.length === 0" class="empty-wrapper">
          <van-empty description="暂无商户数据" />
        </div>

        <div v-else class="merchant-list">
          <div
            v-for="merchant in merchants"
            :key="merchant.merchant_key"
            class="merchant-card"
          >
            <div class="card-header">
              <div class="card-title">{{ merchant.name || '未命名商户' }}</div>
              <van-tag size="medium" round :type="statusType(merchant.status)">
                {{ merchant.status_text || '未知状态' }}
              </van-tag>
            </div>

            <div class="card-meta" v-if="merchant.short_name">
              <span class="meta-label">简称</span>
              <span class="meta-value">{{ merchant.short_name }}</span>
            </div>

            <div v-if="merchant.institution" class="card-meta">
              <span class="meta-label">机构</span>
              <span class="meta-value">{{ merchant.institution.name || merchant.institution.number || '未分配' }}</span>
            </div>

            <div v-if="merchant.reseller" class="card-meta">
              <span class="meta-label">渠道商</span>
              <span class="meta-value">{{ merchant.reseller.name || merchant.reseller.id || '未分配' }}</span>
            </div>

            <div v-if="merchant.salesperson" class="card-meta">
              <span class="meta-label">业务员</span>
              <span class="meta-value">{{ merchant.salesperson.name || merchant.salesperson.account || '未分配' }}</span>
            </div>

            <div class="metrics-row">
              <div class="metric">
                <div class="metric-value">{{ formatAmount(merchant.metrics?.total_amount) }}</div>
                <div class="metric-label">累计交易额</div>
              </div>
              <div class="metric">
                <div class="metric-value">{{ formatAmount(merchant.metrics?.month_amount) }}</div>
                <div class="metric-label">本月交易额</div>
              </div>
              <div class="metric">
                <div class="metric-value">{{ formatAmount(merchant.metrics?.today_amount) }}</div>
                <div class="metric-label">今日交易额</div>
              </div>
            </div>

            <div class="card-footer">
              <div class="meta-info">
                <span>最后交易：</span>
                <span>{{ merchant.last_transaction_at || '暂无' }}</span>
              </div>
              <van-button size="small" type="primary" round plain @click="openDetail(merchant)">
                查看详情
              </van-button>
            </div>
          </div>

          <div class="paging" v-if="pagination.total > pagination.pageSize">
            <van-button size="small" round plain :disabled="pagination.current <= 1" @click="changePage(pagination.current - 1)">
              上一页
            </van-button>
            <span class="page-info">第 {{ pagination.current }} / {{ totalPages }} 页</span>
            <van-button size="small" round plain :disabled="pagination.current >= totalPages" @click="changePage(pagination.current + 1)">
              下一页
            </van-button>
          </div>
        </div>
      </van-pull-refresh>
    </div>

    <van-popup
      v-model:show="detailVisible"
      round
      position="bottom"
      :style="{ height: '85%' }"
      @opened="handlePopupOpened"
    >
      <div class="detail-panel">
        <div class="detail-header">
          <div class="detail-title">{{ detailData?.basic?.name || '商户详情' }}</div>
          <van-tag v-if="detailData?.basic?.status_text" size="medium" :type="statusType(detailData.basic.status)">
            {{ detailData.basic.status_text }}
          </van-tag>
          <van-icon name="cross" @click="detailVisible = false" />
        </div>

        <div v-if="detailLoading" class="detail-loading">
          <van-loading size="24px" />
          <span>加载中...</span>
        </div>

        <div v-else-if="detailData" class="detail-scroll">
          <van-cell-group inset class="detail-group">
            <van-cell title="商户编号" :value="detailData.merchant_id" />
            <van-cell v-if="detailData.basic?.short_name" title="商户简称" :value="detailData.basic.short_name" />
            <van-cell v-if="detailData.basic?.institution" title="所属机构" :value="formatInstitution(detailData.basic.institution)" />
            <van-cell v-if="detailData.basic?.reseller" title="渠道商" :value="formatReseller(detailData.basic.reseller)" />
            <van-cell v-if="detailData.basic?.salesperson" title="业务员" :value="formatSales(detailData.basic.salesperson)" />
            <van-cell v-if="detailData.basic?.contact" title="联系人" :value="formatContact(detailData.basic.contact)" />
            <van-cell v-if="detailData.basic?.activation_date" title="激活时间" :value="detailData.basic.activation_date" />
          </van-cell-group>

          <van-cell-group inset class="detail-group">
            <van-cell title="累计交易额" :value="formatAmount(detailData.summary?.total_amount)" />
            <van-cell v-if="detailData.summary?.net_amount !== undefined" title="净入账" :value="formatAmount(detailData.summary?.net_amount)" />
            <van-cell title="交易笔数" :value="detailData.summary?.total_count || 0" />
            <van-cell v-if="detailData.summary?.today_amount !== undefined" title="今日交易" :value="formatAmount(detailData.summary?.today_amount)" />
            <van-cell v-if="detailData.summary?.month_amount !== undefined" title="本月交易" :value="formatAmount(detailData.summary?.month_amount)" />
            <van-cell title="最后交易" :value="detailData.summary?.last_transaction_at || '暂无'" />
            <van-cell v-if="detailData.summary?.agent_commission !== undefined" title="机构分润" :value="formatAmount(detailData.summary?.agent_commission)" />
            <van-cell v-if="detailData.summary?.reseller_commission !== undefined" title="渠道分润" :value="formatAmount(detailData.summary?.reseller_commission)" />
          </van-cell-group>

          <div class="detail-section">
          <div class="section-title with-action">
            <span>近14日交易趋势</span>
            <span v-if="trendSummaryText" class="section-subtitle">{{ trendSummaryText }}</span>
          </div>
          <div class="trend-chart-wrapper">
            <div ref="trendChartRef" class="trend-chart"></div>
            <div v-if="!hasTrendData" class="trend-empty-overlay">暂无趋势数据</div>
          </div>
        </div>

          <div class="detail-section" v-if="detailData.recent_transactions?.length">
            <div class="section-title">最近交易</div>
            <van-cell-group inset>
              <van-cell
                v-for="(item, index) in detailData.recent_transactions"
                :key="index"
                :title="item.order_id || item.date || '交易记录'"
                :label="formatRecentLabel(item)"
              >
                <template #value>
                  {{ formatAmount(item.amount) }}
                </template>
              </van-cell>
            </van-cell-group>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { showFailToast, showLoadingToast, closeToast } from 'vant';
import { getAdminUnifiedMerchants, getAdminUnifiedMerchantDetail } from '@/api/merchant';
import { useRouter } from 'vue-router';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent as EChartsGridComponent,
  TooltipComponent,
  DataZoomComponent,
  LegendComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  LineChart,
  EChartsGridComponent,
  TooltipComponent,
  DataZoomComponent,
  LegendComponent,
  CanvasRenderer
]);

const router = useRouter();

const sourceOptions = [
  { label: '银联前置平台', value: 'unionpay' },
  { label: '盛付通', value: 'shengfutong' },
  { label: '美团商户', value: 'meituan' }
];

const currentSource = ref('unionpay');
const loading = ref(false);
const refreshing = ref(false);
const merchants = ref([]);

const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0
});

const filterOptions = reactive({
  institutions: [],
  resellers: []
});

const searchForm = reactive({
  keyword: '',
  institution_number: undefined,
  reseller_id: undefined,
  institution_id: undefined
});

const summary = reactive({
  merchant_count: 0,
  total_amount: 0,
  today_amount: 0,
  month_amount: 0
});

const detailVisible = ref(false);
const detailLoading = ref(false);
const detailData = ref(null);
const trendChartRef = ref(null);
const trendChartInstance = ref(null);
const resizeBound = ref(false);
let trendResizeObserver = null;

const summaryMetrics = computed(() => [
  { key: 'merchant_count', label: '商户数', value: summary.merchant_count },
  { key: 'total_amount', label: '累计交易额', value: formatAmount(summary.total_amount) },
  { key: 'month_amount', label: '本月交易额', value: formatAmount(summary.month_amount) },
  { key: 'today_amount', label: '今日交易额', value: formatAmount(summary.today_amount) }
]);

const summaryTheme = computed(() => {
  switch (currentSource.value) {
    case 'unionpay':
      return {
        cardClass: 'summary-card-unionpay',
        title: '银联前置平台概览',
        subtitle: '实时更新'
      };
    case 'shengfutong':
      return {
        cardClass: 'summary-card-shengfutong',
        title: '盛付通渠道概览',
        subtitle: '含即时条码数据'
      };
    case 'meituan':
    default:
      return {
        cardClass: 'summary-card-meituan',
        title: '美团渠道概览',
        subtitle: '数据按日同步'
      };
  }
});

const totalPages = computed(() => Math.max(1, Math.ceil(pagination.total / pagination.pageSize)));
const showFilter = computed(() => {
  if (currentSource.value === 'unionpay') {
    return filterOptions.institutions.length > 0;
  }
  if (currentSource.value === 'shengfutong') {
    return filterOptions.resellers.length > 0;
  }
  if (currentSource.value === 'meituan') {
    return filterOptions.institutions.length > 0;
  }
  return false;
});

function statusType(status) {
  switch (status) {
    case 'active':
      return 'success';
    case 'pending':
    case 'pending_activation':
      return 'warning';
    case 'rejected':
    case 'disabled':
      return 'danger';
    default:
      return 'primary';
  }
}

function formatAmount(value) {
  const num = Number(value || 0);
  return `¥${num.toFixed(2)}`;
}

function formatInstitution(institution) {
  if (!institution) return '未分配';
  return institution.name || institution.number || '未分配';
}

function formatReseller(reseller) {
  if (!reseller) return '未分配';
  return reseller.name || reseller.id || '未分配';
}

function formatSales(salesperson) {
  if (!salesperson) return '未分配';
  return salesperson.name || salesperson.account || '未分配';
}

function formatContact(contact) {
  if (!contact) return '未设置';
  const phone = contact.principal_mobile ? ` (${contact.principal_mobile})` : '';
  return `${contact.principal || '未知联系人'}${phone}`;
}

function formatRecentLabel(item) {
  const lines = [];
  if (item.paid_at || item.date) {
    lines.push(item.paid_at || item.date);
  }
  if (item.payment_method) {
    lines.push(`方式：${item.payment_method}`);
  }
  if (item.status) {
    lines.push(`状态：${item.status}`);
  }
  if (item.net_amount !== undefined) {
    lines.push(`净入账：${formatAmount(item.net_amount)}`);
  }
  if (item.count !== undefined) {
    lines.push(`笔数：${item.count}`);
  }
  return lines.join(' | ');
}

function buildParams() {
  const params = {
    source: currentSource.value,
    page: pagination.current,
    per_page: pagination.pageSize,
    keyword: searchForm.keyword || undefined
  };

  if (currentSource.value === 'unionpay' && searchForm.institution_number) {
    params.institution_number = searchForm.institution_number;
  }

  if (currentSource.value === 'shengfutong' && searchForm.reseller_id) {
    params.reseller_id = searchForm.reseller_id;
  }

  if (currentSource.value === 'meituan' && searchForm.institution_id) {
    params.institution_id = searchForm.institution_id;
  }

  return params;
}

async function loadData() {
  loading.value = true;
  try {
    const toast = showLoadingToast({ message: '加载中...', forbidClick: true, duration: 0 });
    const response = await getAdminUnifiedMerchants(buildParams());
    const data = response.data || {};

    merchants.value = data.items || [];
    pagination.total = data.pagination?.total || 0;
    pagination.pageSize = data.pagination?.per_page || pagination.pageSize;
    pagination.current = data.pagination?.page || pagination.current;

    summary.merchant_count = data.summary?.merchant_count || 0;
    summary.total_amount = data.summary?.total_amount || 0;
    summary.today_amount = data.summary?.today_amount || 0;
    summary.month_amount = data.summary?.month_amount || 0;

    filterOptions.institutions = data.filters?.institutions || [];
    filterOptions.resellers = data.filters?.resellers || [];
    closeToast(toast);
  } catch (error) {
    console.error(error);
    showFailToast(error?.message || '加载商户数据失败');
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

function handleSearch() {
  pagination.current = 1;
  loadData();
}

function resetSearch() {
  searchForm.keyword = '';
  pagination.current = 1;
  loadData();
}

function handleRefresh() {
  refreshing.value = true;
  loadData();
}

function changePage(page) {
  if (page < 1 || page > totalPages.value) return;
  pagination.current = page;
  loadData();
}

function openDetail(merchant) {
  detailVisible.value = true;
  detailLoading.value = true;
  getAdminUnifiedMerchantDetail(currentSource.value, merchant.merchant_id)
    .then(({ data }) => {
      const payload = data?.data ?? data ?? null;
      if (payload) {
        const normalizedTrend = normalizeTrendSeries(payload.charts?.daily_trend);
        detailData.value = {
          ...payload,
          charts: {
            ...(payload.charts || {}),
            daily_trend: normalizedTrend
          }
        };
      } else {
        detailData.value = null;
      }
      if (detailVisible.value) {
        nextTick(() => renderTrendChart());
      }
    })
    .catch((error) => {
      console.error(error);
      showFailToast(error?.message || '获取商户详情失败');
    })
    .finally(() => {
      detailLoading.value = false;
    });
}

const trendData = computed(() => detailData.value?.charts?.daily_trend ?? []);
const hasTrendData = computed(() => Array.isArray(trendData.value) && trendData.value.length > 0);
const trendSummaryText = computed(() => {
  if (!hasTrendData.value) return '';
  const last = trendData.value[trendData.value.length - 1];
  const prev = trendData.value.length > 1 ? trendData.value[trendData.value.length - 2] : null;
  const lastAmount = formatAmount(last.amount || 0);
  if (!prev) return `${last.date}：${lastAmount}`;
  const diff = Number(last.amount || 0) - Number(prev.amount || 0);
  if (diff === 0) return `${last.date}：${lastAmount}（持平）`;
  const trendLabel = `${diff > 0 ? '↑ ' : '↓ '}${formatAmount(Math.abs(diff)).replace('¥', '')}`;
  return `${last.date}：${lastAmount}（较前一日${trendLabel}）`;
});

function renderTrendChart(retry = 0) {
  if (!detailVisible.value || !trendChartRef.value) {
    disposeTrendChart();
    return;
  }

  const container = trendChartRef.value;
  const { clientWidth, clientHeight } = container;

  if ((clientWidth === 0 || clientHeight === 0) && retry < 5) {
    requestAnimationFrame(() => renderTrendChart(retry + 1));
    return;
  }

  if (trendChartInstance.value) {
    trendChartInstance.value.dispose();
    trendChartInstance.value = null;
  }

  const chart = echarts.init(container);
  trendChartInstance.value = chart;

  const dates =
    hasTrendData.value && trendData.value.length
      ? trendData.value.map((item) => item.date)
      : Array.from({ length: 14 }).map((_, idx) => `Day ${idx + 1}`);
  const lineSeriesData = hasTrendData.value
    ? trendData.value.map((item) => Number(item.amount || 0))
    : Array.from({ length: dates.length }).map(() => 0.1);

  chart.setOption({
    grid: {
      left: 24,
      right: 16,
      top: 28,
      bottom: 40
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0,0,0,0.78)',
      borderWidth: 0,
      confine: true,
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (params) => {
        if (!params?.length) return '';
        const datum = trendData.value[params[0].dataIndex];
        const amount = datum?.amount ?? params[0].value ?? 0;
        const count = datum?.count ?? '—';
        const date = params[0].axisValueLabel;
        return [
          `${date}`,
          `成交额：${formatAmount(amount)}`,
          `成交笔数：${count === '—' ? '—' : `${count} 笔`}`
        ].join('<br />');
      }
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: true,
      axisLine: { lineStyle: { color: '#d7d8da' } },
      axisLabel: { color: '#666', fontSize: 10, rotate: 40 }
    },
    yAxis: {
      scale: true,
      axisLine: { lineStyle: { color: '#d7d8da' } },
      axisLabel: {
        color: '#666',
        formatter: (value) => formatAmount(value).replace('¥', '')
      },
      splitLine: { show: true, lineStyle: { color: 'rgba(0,0,0,0.06)' } }
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100,
        minSpan: 20
      }
    ],
    series: [
      {
        type: 'line',
        data: lineSeriesData,
        smooth: true,
        showSymbol: false,
        lineStyle: {
          width: 2,
          color: '#2f88ff'
        },
        areaStyle: {
          color: 'rgba(47,136,255,0.08)'
        }
      }
    ]
  });

  const resizeChart = () => {
    if (trendChartInstance.value) {
      trendChartInstance.value.resize();
    }
  };

  requestAnimationFrame(resizeChart);
  if (retry === 0) {
    setTimeout(resizeChart, 120);
  }

  if (!resizeBound.value) {
    window.addEventListener('resize', handleTrendResize, { passive: true });
    resizeBound.value = true;
  }

  if (!trendResizeObserver && typeof ResizeObserver !== 'undefined' && trendChartRef.value) {
    trendResizeObserver = new ResizeObserver(() => {
      if (trendChartInstance.value) {
        trendChartInstance.value.resize();
      }
    });
    trendResizeObserver.observe(trendChartRef.value);
  }
}

function handleTrendResize() {
  if (trendChartInstance.value) {
    trendChartInstance.value.resize();
  }
}

function disposeTrendChart() {
  if (trendChartInstance.value) {
    trendChartInstance.value.dispose();
    trendChartInstance.value = null;
  }
  if (resizeBound.value && (!detailVisible.value || !hasTrendData.value)) {
    window.removeEventListener('resize', handleTrendResize);
    resizeBound.value = false;
  }
  if (trendResizeObserver) {
    trendResizeObserver.disconnect();
    trendResizeObserver = null;
  }
}

function switchSource(value) {
  if (currentSource.value === value) return;
  currentSource.value = value;
}

function handleSourceChange() {
  pagination.current = 1;
  searchForm.keyword = '';
  searchForm.institution_number = undefined;
  searchForm.reseller_id = undefined;
  searchForm.institution_id = undefined;
  loadData();
}

function handleBack() {
  router.back();
}

function handlePopupOpened() {
  nextTick(() => {
    requestAnimationFrame(() => renderTrendChart());
  });
}

function normalizeTrendSeries(series) {
  if (!series) return [];
  if (Array.isArray(series)) return series;
  if (typeof series === 'object') {
    return Object.keys(series)
      .sort()
      .map((key) => ({ date: key, ...(series[key] || {}) }));
  }
  return [];
}

watch(detailVisible, (visible) => {
  if (!visible) {
    disposeTrendChart();
    return;
  }
  if (visible) {
    nextTick(() => {
      requestAnimationFrame(() => renderTrendChart());
    });
  }
});

watch(
  () => trendData.value,
  () => {
    if (detailVisible.value) {
      nextTick(() => {
        requestAnimationFrame(() => renderTrendChart());
      });
    }
  },
  { deep: true }
);

watch(currentSource, handleSourceChange);

onMounted(() => {
  loadData();
});

onBeforeUnmount(() => {
  disposeTrendChart();
  if (resizeBound.value) {
    window.removeEventListener('resize', handleTrendResize);
  }
});
</script>

<style scoped>
.merchant-page {
  min-height: 100vh;
  background: #f5f6f7;
}

.page-body {
  padding: 12px 12px 24px;
}

.source-switch {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  overflow-x: auto;
}

.source-chip {
  flex: none;
  padding: 6px 14px;
  border-radius: 16px;
  background: #eef1f5;
  color: #666;
  font-size: 14px;
  line-height: 20px;
  cursor: pointer;
}

.source-chip.active {
  background: #1989fa;
  color: #fff;
  box-shadow: 0 2px 6px rgba(25, 137, 250, 0.3);
}

.summary-wrapper {
  margin-bottom: 14px;
}

.summary-card {
  border-radius: 16px;
  padding: 16px;
  color: #1f2d3d;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.summary-card-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 14px;
}

.summary-card-title span:first-child {
  font-size: 16px;
  font-weight: 600;
}

.summary-card-subtitle {
  font-size: 12px;
  opacity: 0.8;
}

.summary-metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.summary-metric {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.32);
  backdrop-filter: blur(4px);
}

.summary-metric:nth-child(odd)::after {
  content: '';
  position: absolute;
  right: -6px;
  top: 0;
  bottom: 0;
  width: 12px;
  background: transparent;
}

.summary-metric-value {
  font-size: 18px;
  font-weight: 600;
}

.summary-metric-label {
  font-size: 12px;
  opacity: 0.75;
  margin-left: 12px;
}

.summary-card-unionpay {
  background: linear-gradient(135deg, #f0f6ff 0%, #dbe7ff 100%);
  border: 1px solid rgba(51, 112, 255, 0.2);
}

.summary-card-shengfutong {
  background: linear-gradient(135deg, #f1fff5 0%, #d8f8e4 100%);
  border: 1px solid rgba(49, 196, 141, 0.25);
}

.summary-card-meituan {
  background: linear-gradient(135deg, #fff5e6 0%, #ffe0b2 100%);
  border: 1px solid rgba(255, 144, 0, 0.25);
}

.search-panel {
  margin-bottom: 12px;
}

.filter-line {
  margin-top: 8px;
}

.merchant-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 16px;
}

.merchant-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2d3d;
  max-width: 70%;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin: 4px 0;
}

.meta-label {
  color: #8c8c8c;
}

.meta-value {
  color: #333;
}

.metrics-row {
  display: flex;
  justify-content: space-between;
  margin: 12px 0;
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.metric {
  flex: 1;
  text-align: center;
}

.metric + .metric {
  border-left: 1px solid #eceff3;
}

.metric-value {
  font-size: 15px;
  font-weight: 600;
  color: #1f2d3d;
}

.metric-label {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 2px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-info {
  font-size: 12px;
  color: #92969c;
}

.paging {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
}

.page-info {
  font-size: 13px;
  color: #666;
}

.empty-wrapper {
  padding: 40px 0;
}

.detail-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid #f1f2f5;
}

.detail-title {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
}

.detail-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 0;
  color: #888;
}

.detail-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.detail-group {
  margin-bottom: 12px;
}

.detail-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title.with-action {
  justify-content: space-between;
}

.section-subtitle {
  font-size: 12px;
  color: #8c8c8c;
  font-weight: normal;
}

.trend-chart-wrapper {
  position: relative;
}

.trend-chart {
  width: 100%;
  height: 220px;
  background: #fff;
  border-radius: 12px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
}

.trend-empty {
  padding: 24px 0;
  text-align: center;
  font-size: 12px;
  color: #999;
  background: #f7f8fa;
  border-radius: 12px;
}

.trend-empty-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #999;
  pointer-events: none;
}

@media (max-width: 600px) {
  .summary-metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
