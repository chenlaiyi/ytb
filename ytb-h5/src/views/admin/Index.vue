<template>
  <div class="admin-container">
    <!-- 移除头部导航条，界面更简洁 -->
    
    <div class="content">
      <!-- 欢迎卡片 -->
      <div class="welcome-card">
        <div class="welcome-header">
          <div class="avatar-box">
            <VanImage
              round
              width="60"
              height="60"
              :src="adminInfo.avatar || '/favicon.ico'"
            />
          </div>
          <div class="welcome-info">
            <div class="welcome-title">
              <span>{{ adminInfo.name || '管理员' }}</span>
              <div class="admin-badge">{{ adminInfo.role || '系统管理员' }}</div>
            </div>
            <div class="welcome-subtitle">上次登录: {{ adminInfo.lastLogin || '未知' }}</div>
            <div class="welcome-date">{{ currentDateStr }}</div>
          </div>
        </div>
      </div>

      <!-- 系统功能 -->
      <div class="function-card">
        <div class="card-title">系统功能</div>
        <Grid :column-num="4" :border="false" square>
          <GridItem v-for="(feature, index) in features" :key="index" :to="feature.route">
            <Icon :name="feature.icon" size="28" :color="feature.color" />
            <div class="text">{{ feature.name }}</div>
          </GridItem>
        </Grid>
      </div>
      
      <!-- 数据概览 -->
      <div class="data-card">
        <div class="card-header">
          <div class="card-title">数据概览</div>
          <div class="card-tabs">
            <span
              v-for="tab in overviewTabs"
              :key="tab.id"
              class="card-tab"
              :class="{ active: overviewTab === tab.id }"
              @click="setOverviewTab(tab.id)"
            >
              {{ tab.label }}
            </span>
          </div>
          <div class="card-date">{{ overviewMetaText }}</div>
        </div>
        <Grid :column-num="overviewColumnNum" :border="false">
          <GridItem v-for="item in currentOverviewItems" :key="item.key">
            <div
              class="count-number"
              :class="item.kind === 'comparison' ? 'count-kind-comparison' : 'count-kind-single'"
            >
              <template v-if="item.kind === 'comparison'">
                <span class="count-today">{{ item.today }}</span>
                <span class="count-yesterday">/{{ item.yesterday }}</span>
              </template>
              <template v-else>
                <span class="count-value">{{ item.value }}</span>
                <span v-if="item.sublabel" class="count-sub">{{ item.sublabel }}</span>
              </template>
            </div>
            <div class="count-label">{{ item.label }}</div>
          </GridItem>
        </Grid>
      </div>
      
      <!-- 商户列表 -->
      <div class="merchant-card">
        <template v-if="isMeituanTab">
          <div class="card-header merchant-header">
            <div class="card-title merchant-title">
              <span>美团商户列表</span>
              <span class="merchant-count" v-if="meituanMerchantHeader">{{ meituanMerchantHeader }}</span>
            </div>
          </div>
          <template v-if="meituanMerchants.length">
            <div class="merchant-list">
              <div
                class="merchant-item merchant-item--static"
                v-for="merchant in displayMeituanMerchants"
                :key="merchant.merchantCode || merchant.merchantName"
              >
                <div class="merchant-rank" v-if="merchant.rank">{{ merchant.rank }}</div>
                <div class="merchant-main">
                  <div class="merchant-header-row">
                    <div class="merchant-name">{{ merchant.merchantName }}</div>
                    <div class="merchant-code">销售员：{{ merchant.salesperson || merchant.institution || '--' }}</div>
                  </div>
                  <div class="merchant-line metrics">
                    <span class="value merchant-city">{{ merchant.city }}</span>
                    <span class="metrics-divider">·</span>
                    <span class="label label-inline">销售额</span>
                    <span class="value merchant-amount">{{ formatCurrency(merchant.transactionAmount) }}</span>
                    <span class="metrics-divider">·</span>
                    <span class="label label-inline">笔数</span>
                    <span class="value">{{ formatCount(merchant.transactionCount) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div
              class="merchant-pagination"
              v-if="meituanMerchants.length > meituanMerchantPagination.pageSize"
            >
              <div
                class="pager-button"
                :class="{ disabled: meituanMerchantPagination.current === 1 }"
                @click="meituanMerchantPagination.current === 1 ? null : goToPrevMeituanMerchantPage()"
              >
                <Icon name="arrow-left" size="14" />
                <span style="margin-left: 4px;">上一页</span>
              </div>
              <div class="page-indicator">
                第 {{ meituanMerchantPagination.current }} / {{ totalMeituanMerchantPages }} 页
              </div>
              <div
                class="pager-button"
                :class="{ disabled: meituanMerchantPagination.current === totalMeituanMerchantPages }"
                @click="meituanMerchantPagination.current === totalMeituanMerchantPages ? null : goToNextMeituanMerchantPage()"
              >
                <span style="margin-right: 4px;">下一页</span>
                <Icon name="arrow" size="14" />
              </div>
            </div>
          </template>
          <div class="empty-list" v-else>
            <Icon name="shop-o" size="40" color="#cccccc" />
            <div>暂无美团商户数据</div>
          </div>
        </template>
        <template v-else>
          <div class="card-header merchant-header">
            <div class="card-title merchant-title">
              <span>商户进件列表</span>
              <span class="merchant-count" v-if="totalMerchants">共 {{ totalMerchants }} 家</span>
            </div>
            <DropdownMenu direction="down" class="merchant-filter">
              <DropdownItem
                v-model="auditStatusFilter"
                :options="AUDIT_STATUS_OPTIONS"
              />
            </DropdownMenu>
          </div>

          <div class="merchant-summary" v-if="auditStatusFilter">
            当前筛选：{{ getAuditStatusLabel(auditStatusFilter) }}
          </div>

          <div class="merchant-status-tabs">
            <div
              v-for="item in AUDIT_STATUS_QUICK_FILTERS"
              :key="item.value"
              class="status-tab"
              :class="{ active: auditStatusFilter === item.value }"
              @click="setAuditStatusFilter(item.value)"
            >
              {{ item.label }}
            </div>
          </div>

          <div class="loading-state" v-if="isMerchantLoading">
            <Loading size="20px">加载中...</Loading>
          </div>

          <div class="merchant-list" v-else-if="filteredMerchants.length > 0">
            <div
              class="merchant-item"
              v-for="merchant in displayMerchants"
              :key="merchant.id || merchant.inviteCode"
              @click="handleMerchantClick(merchant)"
            >
              <div class="merchant-main">
                <div class="merchant-header-row">
                  <div class="merchant-name">{{ merchant.name }}</div>
                  <Tag
                    v-if="merchant.auditStatusText"
                    :type="merchant.auditTagType || resolveAuditTagType(merchant.auditStatusCode)"
                    size="mini"
                  >
                    {{ merchant.auditStatusText }}
                  </Tag>
                </div>
                <div class="merchant-line dual">
                  <div class="pair">
                    <span class="label">机构</span>
                    <span class="value institution-name">{{ merchant.institution || '未设置' }}</span>
                  </div>
                  <div class="pair">
                    <span class="label">邀请码</span>
                    <span class="value">{{ merchant.inviteCode || '-' }}</span>
                  </div>
                </div>
                <div class="merchant-meta">
                  <span>业务员：<span class="salesman-name">{{ merchant.salesmanName || '未分配' }}</span></span>
                  <span v-if="merchant.submittedAt">提交时间：{{ merchant.submittedAt }}</span>
                </div>
              </div>
              <Icon name="arrow" size="16" color="#cccccc" />
            </div>
          </div>
          <div
            class="merchant-pagination"
            v-if="totalMerchants > pagination.pageSize"
          >
            <div
              class="pager-button"
              :class="{ disabled: pagination.current === 1 }"
              @click="pagination.current === 1 ? null : goToPrevPage()"
            >
              <Icon name="arrow-left" size="14" />
              <span style="margin-left: 4px;">上一页</span>
            </div>
            <div class="page-indicator">
              第 {{ pagination.current }} / {{ totalMerchantPages }} 页
            </div>
            <div
              class="pager-button"
              :class="{ disabled: pagination.current === totalMerchantPages }"
              @click="pagination.current === totalMerchantPages ? null : goToNextPage()"
            >
              <span style="margin-right: 4px;">下一页</span>
              <Icon name="arrow" size="14" />
            </div>
          </div>
          <div class="empty-list" v-else>
            <Icon name="shop-o" size="40" color="#cccccc" />
            <div>当前筛选下暂无商户</div>
          </div>
        </template>
      </div>
      
      <!-- 机构排名 -->
      <div class="ranking-card">
        <template v-if="isMeituanTab">
          <div class="card-header ranking-header">
            <div class="card-title">美团机构排名</div>
          </div>
          <div class="trend-controls">
            <div class="trend-mode-tabs">
              <span
                class="trend-mode-tab"
                :class="{ active: meituanRanking.mode === 'daily' }"
                @click="setMeituanRankingMode('daily')"
              >昨日净额</span>
              <span
                class="trend-mode-tab"
                :class="{ active: meituanRanking.mode === 'monthly' }"
                @click="setMeituanRankingMode('monthly')"
              >按月净额</span>
            </div>
            <div
              class="trend-month-select"
              v-if="meituanRanking.mode === 'monthly' && meituanRanking.monthly.availableMonths.length"
            >
              <select :value="meituanRanking.monthly.month" @change="setMeituanRankingMonth($event.target.value)">
                <option
                  v-for="month in meituanRanking.monthly.availableMonths"
                  :key="month"
                  :value="month"
                >{{ month }}</option>
              </select>
            </div>
          </div>
          <div class="ranking-summary">
            <span>净交易额合计：{{ formatCurrency(currentRankingTotal) }}</span>
            <span class="ranking-summary-date">{{ currentRankingLabel }}</span>
          </div>
          <div class="ranking-content" v-if="currentRankingItems.length">
            <div
              class="ranking-item"
              v-for="item in currentRankingItems"
              :key="`${item.rank}-${item.institution}`"
            >
              <div class="ranking-no" :class="{ top: item.rank <= 3 }">{{ item.rank }}</div>
              <div class="ranking-info">
                <div class="ranking-name">{{ item.institution }}</div>
                <div class="ranking-count">净额 {{ formatCurrency(item.total) }}</div>
                <div class="ranking-sub">商户数 {{ formatCount(item.merchantCount) }}</div>
              </div>
              <div class="ranking-bar">
                <div class="ranking-bar-track">
                  <div
                    class="ranking-bar-inner"
                    :style="{ width: Math.min(item.percentage, 100) + '%' }"
                  ></div>
                </div>
                <div class="ranking-percentage">{{ item.percentage }}%</div>
              </div>
            </div>
          </div>
          <div class="ranking-empty" v-else>
            <Icon name="friends-o" size="40" color="#cccccc" />
            <div>暂无美团机构数据</div>
          </div>
        </template>
        <template v-else>
          <div class="card-header ranking-header">
            <div class="card-title">机构进件排名</div>
            <div class="ranking-controls">
              <div class="ranking-tabs">
                <span
                  class="ranking-tab"
                  :class="{ active: rankingFilter === 'today' }"
                  @click="setRankingFilter('today')"
                >今日</span>
                <span
                  class="ranking-tab"
                  :class="{ active: rankingFilter === 'yesterday' }"
                  @click="setRankingFilter('yesterday')"
                >昨日</span>
                <span
                  class="ranking-tab"
                  :class="{ active: rankingFilter === 'custom' }"
                  @click="openRankingDatePicker"
                >指定日期</span>
              </div>
              <div class="ranking-date" @click="openRankingDatePicker">
                <Icon name="calendar-o" size="16" />
                <span>{{ rankingDateLabel }}</span>
              </div>
            </div>
          </div>

          <div class="ranking-summary">
            <span>总进件：{{ rankingTotal }}</span>
            <span class="ranking-summary-date">{{ rankingDateLabel }}</span>
          </div>

          <div class="ranking-content" v-if="rankingLoading">
            <Loading size="18px">加载中...</Loading>
          </div>
          <div class="ranking-content" v-else-if="institutionRanking.length > 0">
            <div
              class="ranking-item"
              v-for="item in institutionRanking"
              :key="`${item.rank}-${item.institution}`"
            >
              <div class="ranking-no" :class="{ top: item.rank <= 3 }">{{ item.rank }}</div>
              <div class="ranking-info">
                <div class="ranking-name">{{ item.institution }}</div>
                <div class="ranking-count">进件 {{ item.total }} 单</div>
              </div>
              <div class="ranking-bar">
                <div class="ranking-bar-track">
                  <div
                    class="ranking-bar-inner"
                    :style="{ width: Math.min(item.percentage, 100) + '%' }"
                  ></div>
                </div>
                <div class="ranking-percentage">{{ item.percentage }}%</div>
              </div>
            </div>
          </div>
          <div class="ranking-empty" v-else>
            <Icon name="friends-o" size="40" color="#cccccc" />
            <div>暂无机构进件数据</div>
          </div>
        </template>
      </div>
      
      <!-- 商户进件趋势 -->
      <div class="trend-card">
        <template v-if="isMeituanTab">
          <div class="card-header trend-header">
            <div class="card-title">美团交易趋势</div>
            <div class="trend-header-tools">
              <span
                class="trend-refresh"
                :class="{ loading: meituanTrendLoading }"
                @click="refreshMeituanTrend"
              >
                <Icon name="replay" size="16" class="trend-refresh-icon" />
                <span>{{ meituanTrendLoading ? '刷新中' : '刷新' }}</span>
              </span>
              <div class="trend-tabs">
                <span
                  v-for="tab in trendTabs"
                  :key="tab.value"
                  class="trend-tab"
                  :class="{ active: currentTrendTab === tab.value }"
                  @click="setTrendTab(tab.value)"
                >
                  {{ tab.label }}
                </span>
              </div>
            </div>
          </div>

          <div class="trend-meta">
            <div class="trend-stat">
              <span class="label">累计GMV</span>
              <span class="value">{{ formatCurrency(currentMeituanTrendRange.totalGmv) }}</span>
              <span class="sub">日均 {{ formatCurrency(currentMeituanTrendRange.averageGmv) }}</span>
            </div>
            <div class="trend-stat">
              <span class="label">净交易额</span>
              <span class="value approved">{{ formatCurrency(currentMeituanTrendRange.totalNet) }}</span>
              <span class="sub success">日均 {{ formatCurrency(currentMeituanTrendRange.averageNet) }}</span>
            </div>
            <div class="trend-summary-label">{{ meituanTrendSummaryLabel }}</div>
            <div class="trend-updated" v-if="meituanTrend.updatedAt">
              更新时间：{{ formatTrendUpdatedAt(meituanTrend.updatedAt) }}
            </div>
          </div>
```
          <div class="trend-chart-wrapper" v-if="hasMeituanTrendData">
            <div class="trend-chart" ref="trendChartRef"></div>
          </div>
          <div class="trend-empty" v-else>
            <Icon name="chart-trending-o" size="40" color="#cccccc" />
            <div>暂无美团交易趋势</div>
          </div>
        </template>
        <template v-else>
          <div class="card-header trend-header">
            <div class="card-title">商户进件趋势</div>
            <div class="trend-header-tools">
              <span
                class="trend-refresh"
                :class="{ loading: merchantTrendLoading }"
                @click="refreshMerchantTrend"
              >
                <Icon name="replay" size="16" class="trend-refresh-icon" />
                <span>{{ merchantTrendLoading ? '刷新中' : '刷新' }}</span>
              </span>
              <div class="trend-tabs">
                <span
                  v-for="tab in trendTabs"
                  :key="tab.value"
                  class="trend-tab"
                  :class="{ active: currentTrendTab === tab.value }"
                  @click="setTrendTab(tab.value)"
                >
                  {{ tab.label }}
                </span>
              </div>
            </div>
          </div>

          <div class="trend-meta">
            <div class="trend-stat">
              <span class="label">总进件</span>
              <span class="value">{{ currentTrendSummary.submittedTotal }}</span>
              <span class="sub">日均 {{ currentTrendSummary.submittedAverage }}</span>
            </div>
            <div class="trend-stat">
              <span class="label">审核通过</span>
              <span class="value approved">{{ currentTrendSummary.approvedTotal }}</span>
              <span class="sub success">日均 {{ currentTrendSummary.approvedAverage }}</span>
            </div>
            <div class="trend-updated" v-if="merchantOnboardingTrend.updatedAt">
              更新时间：{{ formatTrendUpdatedAt(merchantOnboardingTrend.updatedAt) }}
            </div>
          </div>

          <div class="trend-chart-wrapper" v-if="hasTrendData">
            <div class="trend-chart" ref="trendChartRef"></div>
          </div>
          <div class="trend-empty" v-else>
            <Icon name="chart-trending-o" size="40" color="#cccccc" />
            <div>暂无进件趋势数据</div>
          </div>
        </template>
      </div>
      
      <!-- 系统日志 -->
      <div class="log-card" v-if="false">
        <div class="card-title">
          <span>系统日志</span>
          <router-link to="/admin/logs" class="more">查看全部 <Icon name="arrow" /></router-link>
        </div>
        <div class="log-list" v-if="systemLogs.length > 0">
          <div class="log-item" v-for="(log, index) in systemLogs" :key="index">
            <div class="log-tag" :class="`log-${log.type}`">{{ getLogTypeText(log.type) }}</div>
            <div class="log-content">
              <div class="log-message">{{ log.message }}</div>
              <div class="log-info">
                <span>{{ log.operator }}</span>
                <span class="log-time">{{ log.time }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="empty-list" v-else>
          <Icon name="notes-o" size="40" color="#cccccc" />
          <div>暂无系统日志</div>
        </div>
      </div>
      
      <!-- 系统功能 -->
    </div>
  </div>

  <Popup v-model:show="showRankingDatePicker" position="bottom" round>
    <DatePicker
      v-model="rankingPickerValue"
      title="选择日期"
      :min-date="rankingMinDate"
      :max-date="rankingMaxDate"
      @confirm="handleRankingDateConfirm"
      @cancel="handleRankingDateCancel"
    />
  </Popup>

  <!-- 日期详情弹窗 - 使用全局覆盖层 -->
  <Overlay v-model:show="showDateDetailPopup" :custom-style="{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }">
    <div class="date-detail-modal" v-if="selectedDateData">
      <div class="modal-content" @click.stop>
        <div class="popup-header">
          <h3 class="popup-title">{{ selectedDateData.date }} 数据详情</h3>
          <button class="close-btn" @click="closeDateDetailPopup">
            <Icon name="cross" size="18" />
          </button>
        </div>
        <div class="popup-content">
          <div class="data-grid">
            <div class="data-item">
              <div class="data-label">总进件</div>
              <div class="data-value primary">{{ selectedDateData.submitted }}</div>
            </div>
            <div class="data-item">
              <div class="data-label">审核通过</div>
              <div class="data-value success">{{ selectedDateData.approved }}</div>
            </div>
            <div class="data-item">
              <div class="data-label">待审核</div>
              <div class="data-value warning">{{ selectedDateData.pending }}</div>
            </div>
            <div class="data-item">
              <div class="data-label">通过率</div>
              <div class="data-value">{{ selectedDateData.approvalRate }}%</div>
            </div>
          </div>
        </div>
        <div class="popup-footer">
          <button class="confirm-btn" @click="closeDateDetailPopup">确定</button>
        </div>
      </div>
    </div>
  </Overlay>
</template>

<script setup>
import { ref, computed, onMounted, watch, reactive, nextTick, onBeforeUnmount } from 'vue'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { Grid, GridItem, Image as VanImage, Icon, showLoadingToast, closeToast, showToast, Popup, Overlay, DatePicker } from 'vant'
import { useRouter } from 'vue-router'
import { getAdminWorkspace, getAdminInstitutionRanking } from '@/api/admin'
import { getMerchantOnboardingStats, getMerchantList as fetchMerchantList } from '@/api/admin-merchant'
import { getAdminMerchants as fetchLegacyAdminMerchants } from '@/api/merchant'
import { redirectToLogin, setAdminAuthData, handleAdminLogout, getAdminUserInfo } from '@/utils/auth'
import { formatDateTime as formatDateTimeUtil } from '@/utils/date'

dayjs.extend(customParseFormat)
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent as EChartsGridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChart, EChartsGridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const router = useRouter()

const DEFAULT_MERCHANT_LIMIT = 50
const DEFAULT_MERCHANT_PAGE_SIZE = 10
const MEITUAN_MERCHANT_LIMIT = 100
const MEITUAN_MERCHANT_PAGE_SIZE = 10

const overviewTabs = Object.freeze([
  { id: 'purifier', label: '净水器' },
  { id: 'payment', label: '支付进件' },
  { id: 'meituan', label: '美团' }
])
const overviewTab = ref('payment')

const isMeituanTab = computed(() => overviewTab.value === 'meituan')

const setOverviewTab = (tabId) => {
  if (overviewTabs.some((tab) => tab.id === tabId)) {
    overviewTab.value = tabId
  }
}

const isAuthError = (error) => {
  if (!error) return false
  if (error.isAuthError) return true
  const code = Number(error.code)
  if (!Number.isNaN(code) && code === 401) return true
  const status = error.response?.status ?? error.status
  if (status !== undefined && Number(status) === 401) return true
  return false
}

const handleAuthError = (error, { redirect = true } = {}) => {
  if (!isAuthError(error)) return false
  if (redirect) {
    redirectToLogin()
  }
  return true
}

const formatCount = (value) => {
  if (value === null || value === undefined || value === '') {
    return '0'
  }

  const numeric = Number(value)
  if (Number.isNaN(numeric)) {
    return String(value)
  }

  return numeric.toLocaleString('zh-CN')
}

const formatAverage = (value) => {
  if (value === null || value === undefined || value === '') {
    return '0'
  }

  const numeric = Number(value)
  if (Number.isNaN(numeric)) {
    return '0'
  }

  if (Number.isInteger(numeric)) {
    return numeric.toLocaleString('zh-CN')
  }

  return numeric.toLocaleString('zh-CN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
  })
}

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') {
    return '0.00'
  }

  const numeric = Number(value)
  if (Number.isNaN(numeric)) {
    return String(value)
  }

  return numeric.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const parseMerchantAmount = (value) => {
  if (value === null || value === undefined) {
    return 0
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/[^\d.-]/g, '')
    const numeric = Number(normalized)
    return Number.isFinite(numeric) ? numeric : 0
  }

  return 0
}

const MERIDIEM_REPLACEMENTS = [
  { pattern: /(上午|早上|清晨|凌晨|\bAM\b|\bam\b)/gi, replacement: ' AM ' },
  { pattern: /(下午|晚上|傍晚|中午|午后|夜间|午夜|\bPM\b|\bpm\b)/gi, replacement: ' PM ' }
]

const KNOWN_TIME_FORMATS = [
  'YYYY-MM-DD HH:mm:ss',
  'YYYY-MM-DD HH:mm',
  'YYYY-MM-DDTHH:mm:ss',
  'YYYY-MM-DDTHH:mm:ssZ',
  'YYYY/MM/DD HH:mm:ss',
  'YYYY/MM/DD HH:mm',
  'YYYY/MM/DDTHH:mm:ss',
  'YYYY/MM/DDTHH:mm:ssZ',
  'YYYY-MM-DD hh:mm:ss A',
  'YYYY-MM-DD hh:mm A',
  'YYYY/MM/DD hh:mm:ss A',
  'YYYY/MM/DD hh:mm A',
  'YYYY年MM月DD日 HH:mm:ss',
  'YYYY年MM月DD日 HH:mm',
  'YYYY年MM月DD日 hh:mm:ss A',
  'YYYY年MM月DD日 hh:mm A',
  'ddd MMM DD YYYY HH:mm:ss [GMT]Z',
  'ddd MMM DD YYYY HH:mm:ss [GMT]ZZ',
  'ddd MMM DD YYYY hh:mm:ss A [GMT]Z',
  'ddd MMM DD YYYY hh:mm:ss A [GMT]ZZ'
]

const sanitizeDateString = (value) => {
  if (typeof value !== 'string') return value
  return value.replace(/\s*\([^)]*\)\s*$/, '')
}

const parseFlexibleDate = (value) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (value instanceof Date) {
    return dayjs(value)
  }

  const stringValue = String(value).trim()
  if (!stringValue) {
    return null
  }

  let normalizedValue = sanitizeDateString(stringValue)
  normalizedValue = MERIDIEM_REPLACEMENTS.reduce(
    (acc, { pattern, replacement }) => acc.replace(pattern, replacement),
    normalizedValue
  )
    .replace(/\s+/g, ' ')
    .trim()

  normalizedValue = normalizedValue.replace(
    /\b(AM|PM)\s*(\d{1,2}:\d{2}(?::\d{2})?)\b/gi,
    (_, meridiem, time) => `${time} ${meridiem.toUpperCase()}`
  )

  for (const format of KNOWN_TIME_FORMATS) {
    const parsed = dayjs(normalizedValue, format, true)
    if (parsed.isValid()) {
      return parsed
    }
  }

  const fallbackParsed = dayjs(normalizedValue)
  if (fallbackParsed.isValid()) {
    return fallbackParsed
  }

  const fallbackDate = new Date(normalizedValue)
  if (!Number.isNaN(fallbackDate.getTime())) {
    return dayjs(fallbackDate)
  }

  const numericMatch = normalizedValue.match(
    /(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})(?:日)?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?/i
  )

  if (numericMatch) {
    let [, year, month, day, hour = '0', minute = '0', second = '0', meridiemRaw = ''] = numericMatch
    let hourNumber = Number(hour)
    const minuteNumber = Number(minute)
    const secondNumber = Number(second)
    const meridiem = meridiemRaw ? meridiemRaw.toUpperCase() : ''

    if (Number.isNaN(hourNumber)) hourNumber = 0

    if (meridiem === 'PM' && hourNumber < 12) {
      hourNumber += 12
    } else if (meridiem === 'AM' && hourNumber === 12) {
      hourNumber = 0
    }

    const pad = (num, length = 2) => String(num).padStart(length, '0')

    const reconstructed = [
      pad(year, 4),
      '-',
      pad(Number(month)),
      '-',
      pad(Number(day)),
      ' ',
      pad(hourNumber),
      ':',
      pad(minuteNumber),
      ':',
      pad(secondNumber)
    ].join('')

    const reconstructedParsed = dayjs(reconstructed, 'YYYY-MM-DD HH:mm:ss', true)
    if (reconstructedParsed.isValid()) {
      return reconstructedParsed
    }
  }

  return null
}

const formatTimestampTo24h = (value) => {
  const parsed = parseFlexibleDate(value)
  if (!parsed) {
    return typeof value === 'string' ? value : ''
  }

  return parsed.format('YYYY-MM-DD HH:mm:ss')
}

const resolvePreferredTimestamp = (...values) => {
  let best = null
  values.forEach((value) => {
    const parsed = parseFlexibleDate(value)
    if (!parsed) return
    if (!best || parsed.valueOf() > best.parsed.valueOf()) {
      best = { parsed, raw: value }
    }
  })
  return best
}

const formatAdminLastLogin = (userInfo = {}) => {
  if (!userInfo || typeof userInfo !== 'object') {
    return ''
  }

  const candidate = resolvePreferredTimestamp(
    userInfo.last_login_time,
    userInfo.last_login_at,
    userInfo.last_login,
    userInfo.lastLoginAt,
    userInfo.last_login_ip_time
  )

  if (candidate?.parsed) {
    return candidate.parsed.format('YYYY-MM-DD HH:mm:ss')
  }

  const fallbackRaw =
    userInfo.last_login_time ??
    userInfo.last_login_at ??
    userInfo.last_login ??
    userInfo.lastLoginAt ??
    userInfo.last_login_ip_time ??
    ''

  const fallbackFormatted = formatTimestampTo24h(fallbackRaw)
  if (fallbackFormatted) {
    return fallbackFormatted
  }

  return typeof fallbackRaw === 'string' ? fallbackRaw : ''
}

const buildDefaultTrendRange = () => ({
  dates: [],
  counts: [],
  submitted: [],
  approved: [],
  totalSubmitted: 0,
  totalApproved: 0,
  averageSubmitted: 0,
  averageApproved: 0
})

const buildEmptyMeituanTrendRange = () => ({
  dates: [],
  gmv: [],
  net: [],
  totalGmv: 0,
  totalNet: 0,
  averageGmv: 0,
  averageNet: 0
})

const getEmptyOnboardingOverview = () => ({
  summary: {
    today_auto: 0,
    today_new: 0,
    yesterday_auto: 0,
    yesterday_new: 0,
    today_institutions: 0,
    yesterday_institutions: 0
  },
  today: {
    pending: 0,
    approved: 0,
    rejected: 0
  },
  yesterday: {
    pending: 0,
    approved: 0,
    rejected: 0
  },
  all: {
    pending: 0,
    approved: 0,
    rejected: 0
  },
  updatedAt: ''
})

const onboardingOverview = ref(getEmptyOnboardingOverview())

const resetOnboardingOverview = () => {
  onboardingOverview.value = getEmptyOnboardingOverview()
}

const updateOnboardingOverview = (data = {}) => {
  const summary = data.summary || {}
  const today = data.today || data.breakdown?.today || {}
  const yesterday = data.yesterday || data.breakdown?.yesterday || {}
  const all = data.all || data.breakdown?.all || {}

  onboardingOverview.value = {
    summary: {
      today_auto: summary.today_auto ?? 0,
      today_new: summary.today_new ?? 0,
      yesterday_auto: summary.yesterday_auto ?? 0,
      yesterday_new: summary.yesterday_new ?? 0,
      today_institutions: summary.today_institutions ?? 0,
      yesterday_institutions: summary.yesterday_institutions ?? 0
    },
    today: {
      pending: today.pending ?? 0,
      approved: today.approved ?? 0,
      rejected: today.rejected ?? 0
    },
    yesterday: {
      pending: yesterday.pending ?? 0,
      approved: yesterday.approved ?? 0,
      rejected: yesterday.rejected ?? 0
    },
    all: {
      pending: all.pending ?? 0,
      approved: all.approved ?? 0,
      rejected: all.rejected ?? 0
    },
    updatedAt: new Date().toLocaleString('zh-CN', { hour12: false })
  }
}

const trendTabs = Object.freeze([
  { value: '30d', label: '近30日' },
  { value: '7d', label: '近7日' }
])

const currentTrendTab = ref('30d')
const trendChartRef = ref(null)
const trendChartInstance = ref(null)

const merchantOnboardingTrend = reactive({
  range30: buildDefaultTrendRange(),
  range7: buildDefaultTrendRange(),
  updatedAt: ''
})

const meituanTrend = reactive({
  range30: buildEmptyMeituanTrendRange(),
  range7: buildEmptyMeituanTrendRange(),
  updatedAt: ''
})

const meituanTrendMode = ref('daily')
const meituanTrendMonthly = reactive({
  month: '',
  availableMonths: [],
  records: {}
})

const sortDateKeys = (source) => {
  if (!source) return []
  return Array.from(source).sort((a, b) => {
    const aStr = String(a)
    const bStr = String(b)
    const aDate = dayjs(aStr)
    const bDate = dayjs(bStr)
    if (aDate.isValid() && bDate.isValid()) {
      if (aDate.isSame(bDate)) return 0
      return aDate.isBefore(bDate) ? -1 : 1
    }
    if (aDate.isValid()) return -1
    if (bDate.isValid()) return 1
    return aStr.localeCompare(bStr)
  })
}

const normalizeTrendRangePayload = (range = {}) => {
  const dateSet = new Set()

  const pushDate = (value) => {
    if (value === null || value === undefined) return
    const normalized = String(value).trim()
    if (normalized) {
      dateSet.add(normalized)
    }
  }

  const applyDateArray = (dates) => {
    if (!Array.isArray(dates)) return
    dates.forEach((item) => pushDate(item))
  }

  const collectFromArray = (items, map, datesArray = []) => {
    if (!Array.isArray(items)) return
    items.forEach((value, index) => {
      const dateCandidate = Array.isArray(datesArray) && datesArray[index] !== undefined
        ? String(datesArray[index])
        : String(index)
      pushDate(dateCandidate)
      map.set(dateCandidate, Number(value) || 0)
    })
  }

  const collectFromObject = (objectLike, map) => {
    if (!objectLike || typeof objectLike !== 'object') return
    Object.entries(objectLike).forEach(([key, value]) => {
      const normalizedKey = String(key)
      pushDate(normalizedKey)
      map.set(normalizedKey, Number(value) || 0)
    })
  }

  const datesArray = Array.isArray(range.dates) ? range.dates.slice() : []
  applyDateArray(datesArray)

  const gmvMap = new Map()
  const netMap = new Map()

  if (Array.isArray(range.gmv)) {
    collectFromArray(range.gmv, gmvMap, datesArray)
  } else {
    collectFromObject(range.gmv, gmvMap)
  }

  if (Array.isArray(range.net)) {
    collectFromArray(range.net, netMap, datesArray)
  } else {
    collectFromObject(range.net, netMap)
  }

  if (!datesArray.length && gmvMap.size) {
    gmvMap.forEach((_value, key) => pushDate(key))
  }
  if (!datesArray.length && netMap.size) {
    netMap.forEach((_value, key) => pushDate(key))
  }

  const sortedDates = sortDateKeys(dateSet)
  const gmvValues = sortedDates.map((date) => gmvMap.get(date) ?? 0)
  const netValues = sortedDates.map((date) => netMap.get(date) ?? 0)

  const totalGmv = gmvValues.reduce((total, value) => total + value, 0)
  const totalNet = netValues.reduce((total, value) => total + value, 0)
  const averageGmv = gmvValues.length ? totalGmv / gmvValues.length : 0
  const averageNet = netValues.length ? totalNet / netValues.length : 0

  return {
    dates: sortedDates,
    gmv: gmvValues,
    net: netValues,
    totalGmv: Number.isFinite(totalGmv) ? Number(totalGmv.toFixed(2)) : 0,
    totalNet: Number.isFinite(totalNet) ? Number(totalNet.toFixed(2)) : 0,
    averageGmv: Number.isFinite(averageGmv) ? Number(averageGmv.toFixed(2)) : 0,
    averageNet: Number.isFinite(averageNet) ? Number(averageNet.toFixed(2)) : 0
  }
}

const merchantTrendLoading = ref(false)
const meituanTrendLoading = ref(false)

const meituanMerchants = ref([])
const meituanMerchantPagination = reactive({
  current: 1,
  pageSize: MEITUAN_MERCHANT_PAGE_SIZE
})
const meituanRanking = reactive({
  mode: 'daily',
  daily: {
    date: '',
    total: 0,
    items: []
  },
  monthly: {
    month: '',
    availableMonths: [],
    records: {}
  }
})

const ensureValidMonthlyMonth = () => {
  if (!meituanRanking.monthly.availableMonths.includes(meituanRanking.monthly.month)) {
    meituanRanking.monthly.month = meituanRanking.monthly.availableMonths[0] || ''
  }
}

const setMeituanRankingMode = (mode) => {
  const normalized = mode === 'monthly' ? 'monthly' : 'daily'
  if (meituanRanking.mode === normalized) {
    return
  }
  meituanRanking.mode = normalized
  if (normalized === 'monthly') {
    ensureValidMonthlyMonth()
  }
}

const setMeituanRankingMonth = (month) => {
  if (meituanRanking.monthly.availableMonths.includes(month)) {
    meituanRanking.monthly.month = month
  }
}

const ensureValidMeituanTrendMonth = () => {
  if (!meituanTrendMonthly.availableMonths.includes(meituanTrendMonthly.month)) {
    meituanTrendMonthly.month = meituanTrendMonthly.availableMonths[0] || ''
  }
}

const setMeituanTrendMode = (mode) => {
  const normalized = mode === 'monthly' ? 'monthly' : 'daily'
  if (meituanTrendMode.value === normalized) {
    return
  }
  meituanTrendMode.value = normalized
  if (normalized === 'monthly') {
    ensureValidMeituanTrendMonth()
  }
  renderTrendChart()
}

const setMeituanTrendMonth = (month) => {
  if (meituanTrendMonthly.availableMonths.includes(month)) {
    meituanTrendMonthly.month = month
    if (meituanTrendMode.value === 'monthly') {
      renderTrendChart()
    }
  }
}

const normalizeTrendRange = (payload = {}) => {
  const dates = Array.isArray(payload.dates) ? payload.dates.map((item) => String(item)) : []
  const submittedSource = Array.isArray(payload.submitted) ? payload.submitted : payload.counts
  const approvedSource = Array.isArray(payload.approved) ? payload.approved : []

  const submitted = Array.isArray(submittedSource)
    ? submittedSource.map((item) => {
        const numeric = Number(item)
        return Number.isFinite(numeric) ? numeric : 0
      })
    : []

  const approved = Array.isArray(approvedSource)
    ? approvedSource.map((item) => {
        const numeric = Number(item)
        return Number.isFinite(numeric) ? numeric : 0
      })
    : []

  const totalSubmitted = Number(payload.totalSubmitted ?? submitted.reduce((sum, value) => sum + value, 0))
  const totalApproved = Number(payload.totalApproved ?? approved.reduce((sum, value) => sum + value, 0))
  const averageSubmitted = Number(
    payload.averageSubmitted ?? (submitted.length ? totalSubmitted / submitted.length : 0)
  )
  const averageApproved = Number(
    payload.averageApproved ?? (approved.length ? totalApproved / approved.length : 0)
  )

  return {
    dates,
    counts: submitted.slice(),
    submitted,
    approved,
    totalSubmitted: Number.isFinite(totalSubmitted) ? totalSubmitted : 0,
    totalApproved: Number.isFinite(totalApproved) ? totalApproved : 0,
    averageSubmitted: Number.isFinite(averageSubmitted) ? averageSubmitted : 0,
    averageApproved: Number.isFinite(averageApproved) ? averageApproved : 0
  }
}

const resetMerchantTrend = () => {
  merchantOnboardingTrend.range30 = buildDefaultTrendRange()
  merchantOnboardingTrend.range7 = buildDefaultTrendRange()
  merchantOnboardingTrend.updatedAt = ''
  destroyTrendChart()
}

const applyMerchantTrend = (payload) => {
  if (!payload) {
    resetMerchantTrend()
    return
  }

  merchantOnboardingTrend.range30 = normalizeTrendRange(payload.range30)
  merchantOnboardingTrend.range7 = normalizeTrendRange(payload.range7)
  merchantOnboardingTrend.updatedAt = payload.updatedAt || ''

  renderTrendChart()
}

const resetMeituanWorkspace = () => {
  meituanMerchants.value = []
  meituanMerchantPagination.current = 1
  meituanRanking.mode = 'daily'
  meituanRanking.daily = {
    date: '',
    total: 0,
    items: []
  }
  meituanRanking.monthly = {
    month: '',
    availableMonths: [],
    records: {}
  }
  meituanTrend.range30 = buildEmptyMeituanTrendRange()
  meituanTrend.range7 = buildEmptyMeituanTrendRange()
  meituanTrend.updatedAt = ''
  meituanTrendMode.value = 'daily'
  meituanTrendMonthly.month = ''
  meituanTrendMonthly.availableMonths = []
  meituanTrendMonthly.records = {}
  if (isMeituanTab.value) {
    renderTrendChart()
  }
}

const applyMeituanTrendPayload = (trend = {}) => {
  const trendMode = trend.mode === 'monthly' ? 'monthly' : 'daily'
  const range30 = trend.range30 || {}
  const range7 = trend.range7 || {}

  meituanTrend.range30 = normalizeTrendRangePayload(range30)
  meituanTrend.range7 = normalizeTrendRangePayload(range7)

  meituanTrend.updatedAt = trend.updatedAt || trend.updated_at || ''

  const trendMonthly = trend.monthly || {}
  const trendAvailableMonths = Array.isArray(trendMonthly.availableMonths)
    ? trendMonthly.availableMonths.map((item) => String(item))
    : []
  const trendMonthlyRecords = {}
  if (trendMonthly.records && typeof trendMonthly.records === 'object') {
    Object.entries(trendMonthly.records).forEach(([key, value]) => {
      trendMonthlyRecords[String(key)] = normalizeTrendRangePayload(value || {})
    })
  }

  meituanTrendMonthly.availableMonths = trendAvailableMonths
  meituanTrendMonthly.records = trendMonthlyRecords
  meituanTrendMonthly.month = trendMonthly.month && trendAvailableMonths.includes(trendMonthly.month)
    ? trendMonthly.month
    : (trendAvailableMonths[0] || '')

  ensureValidMeituanTrendMonth()

  if (trendMode === 'monthly' && meituanTrendMonthly.availableMonths.length === 0) {
    meituanTrendMode.value = 'daily'
  } else {
    meituanTrendMode.value = trendMode
  }

  if (isMeituanTab.value) {
    renderTrendChart()
  }
}

const applyMeituanWorkspace = (payload = {}) => {
  if (!payload || typeof payload !== 'object') {
    resetMeituanWorkspace()
    return
  }

  if (payload.summary) {
    const mergedSummary = mergeMeituanSummaries(meituanStatsSnapshot.value, payload.summary)
    meituanStatsSnapshot.value = mergedSummary
    updateMeituanOverview({
      institution_total: mergedSummary.institution_total,
      merchant_total: mergedSummary.merchant_total,
      transaction_amount_formatted: formatCurrency(mergedSummary.transaction_amount),
      profit_amount_formatted: formatCurrency(mergedSummary.profit_amount),
      last_transaction_date: mergedSummary.last_transaction_date,
    })
  }

  const merchants = Array.isArray(payload.merchants) ? payload.merchants : []
  meituanMerchants.value = merchants.map((item) => {
    const transactionAmountSource =
      item.transactionAmount ??
      item.transaction_amount ??
      item.totalAmount ??
      item.total_amount ??
      item.netAmount ??
      item.net_amount ??
      item.gmv ??
      item.gmvAmount ??
      item.transaction_amount_formatted ??
      item.transactionAmountFormatted ??
      0

    return {
      rank: Number(item.rank ?? 0),
      merchantCode: item.merchantCode || item.merchant_code || '--',
      merchantName: item.merchantName || item.merchant_name || item.merchantCode || '未标注商户',
      city: item.city || '未标注城市',
      institution: item.institution || item.institution_name || '',
      salesperson: item.salesperson || item.salesperson_name || '',
      salespersonAccount: item.salespersonAccount || item.salesperson_account || '',
      transactionAmount: parseMerchantAmount(transactionAmountSource),
      transactionCount: Number(item.transactionCount ?? item.transaction_count ?? 0)
    }
  })
  meituanMerchantPagination.current = 1

  const ranking = payload.ranking || {}
  meituanRanking.mode = ranking.mode === 'monthly' ? 'monthly' : 'daily'

  const rankingDaily = ranking.daily || {}
  const dailyItems = Array.isArray(rankingDaily.items)
    ? rankingDaily.items.map((item) => ({
        rank: Number(item.rank ?? 0),
        institution: item.institution || '未标注机构',
        merchantCount: Number(item.merchantCount ?? item.merchant_count ?? 0),
        total: Number(item.total ?? 0),
        percentage: Number(item.percentage ?? 0)
      }))
    : []
  meituanRanking.daily = {
    date: rankingDaily.date || '',
    total: Number(rankingDaily.total ?? 0),
    items: dailyItems
  }

  const monthly = ranking.monthly || {}
  const availableMonths = Array.isArray(monthly.availableMonths)
    ? monthly.availableMonths.map((item) => String(item))
    : []
  const monthlyRecords = {}
  if (monthly.records && typeof monthly.records === 'object') {
    Object.entries(monthly.records).forEach(([key, value]) => {
      const items = Array.isArray(value.items)
        ? value.items.map((item) => ({
            rank: Number(item.rank ?? 0),
            institution: item.institution || '未标注机构',
            merchantCount: Number(item.merchantCount ?? item.merchant_count ?? 0),
            total: Number(item.total ?? 0),
            percentage: Number(item.percentage ?? 0)
          }))
        : []

      monthlyRecords[String(key)] = {
        total: Number(value.total ?? 0),
        items
      }
    })
  }

  const selectedMonth = monthly.month && availableMonths.includes(monthly.month)
    ? monthly.month
    : (availableMonths[0] || '')

  meituanRanking.monthly = {
    month: selectedMonth,
    availableMonths,
    records: monthlyRecords
  }

  if (meituanRanking.mode === 'monthly' && !selectedMonth && availableMonths.length === 0) {
    meituanRanking.mode = 'daily'
  }

  ensureValidMonthlyMonth()

  applyMeituanTrendPayload(payload.trend || {})
}

const refreshMerchantTrend = async () => {
  if (merchantTrendLoading.value) {
    return
  }

  merchantTrendLoading.value = true
  try {
    const response = await getAdminWorkspace({
      ranking_date: rankingDate.value,
      meituan_merchant_limit: MEITUAN_MERCHANT_LIMIT,
      force_refresh_merchant_trend: 1,
      refresh_scopes: 'merchant_trend'
    })
    if (response?.code === 0) {
      const trendPayload = response.data?.merchantOnboardingTrend
      if (trendPayload) {
        applyMerchantTrend(trendPayload)
        return
      }
      showToast('暂无新的进件趋势数据')
      return
    }

    showToast(response?.message || '刷新失败，请稍后重试')
  } catch (error) {
    if (!handleAuthError(error)) {
      console.error('刷新商户进件趋势失败:', error)
      showToast(error?.message || '刷新失败，请稍后重试')
    }
  } finally {
    merchantTrendLoading.value = false
  }
}

const refreshMeituanTrend = async () => {
  if (meituanTrendLoading.value) {
    return
  }

  meituanTrendLoading.value = true
  try {
    const response = await getAdminWorkspace({
      ranking_date: rankingDate.value,
      meituan_merchant_limit: MEITUAN_MERCHANT_LIMIT,
      force_refresh_meituan_trend: 1,
      refresh_scopes: 'meituan_trend'
    })
    if (response?.code === 0) {
      const workspace = response.data?.meituanWorkspace
      const refreshedStats = response.data?.stats?.meituan
      if (refreshedStats) {
        meituanStatsSnapshot.value = refreshedStats
      }
      if (workspace) {
        if (workspace.summary || refreshedStats) {
          const mergedSummary = mergeMeituanSummaries(
            meituanStatsSnapshot.value,
            workspace.summary || {}
          )
          updateMeituanOverview({
            institution_total: mergedSummary.institution_total,
            merchant_total: mergedSummary.merchant_total,
            transaction_amount_formatted: formatCurrency(mergedSummary.transaction_amount),
            profit_amount_formatted: formatCurrency(mergedSummary.profit_amount),
            last_transaction_date: mergedSummary.last_transaction_date,
          })
        }
        applyMeituanTrendPayload(workspace.trend || {})
        return
      }
      showToast('未获取到美团趋势数据')
      return
    }

    showToast(response?.message || '刷新失败，请稍后重试')
  } catch (error) {
    if (!handleAuthError(error)) {
      console.error('刷新美团趋势失败:', error)
      showToast(error?.message || '刷新失败，请稍后重试')
    }
  } finally {
    meituanTrendLoading.value = false
  }
}

const currentTrendRange = computed(() =>
  currentTrendTab.value === '30d' ? merchantOnboardingTrend.range30 : merchantOnboardingTrend.range7
)

const hasTrendData = computed(() => currentTrendRange.value.dates.length > 0)

const currentMeituanTrendRange = computed(() => {
  if (meituanTrendMode.value === 'monthly') {
    const month = meituanTrendMonthly.month
    return meituanTrendMonthly.records[month] || buildEmptyMeituanTrendRange()
  }

  return currentTrendTab.value === '30d' ? meituanTrend.range30 : meituanTrend.range7
})

const hasMeituanTrendData = computed(() => currentMeituanTrendRange.value.dates.length > 0)

const currentRankingData = computed(() => {
  if (meituanRanking.mode === 'monthly') {
    const month = meituanRanking.monthly.month
    const record = meituanRanking.monthly.records[month] || { total: 0, items: [] }
    return {
      total: Number(record.total ?? 0),
      items: Array.isArray(record.items) ? record.items : []
    }
  }

  return {
    total: Number(meituanRanking.daily.total ?? 0),
    items: Array.isArray(meituanRanking.daily.items) ? meituanRanking.daily.items : []
  }
})

const currentRankingItems = computed(() => currentRankingData.value.items)
const currentRankingTotal = computed(() => currentRankingData.value.total)
const currentRankingLabel = computed(() => {
  if (meituanRanking.mode === 'monthly') {
    return `统计月份：${meituanRanking.monthly.month || '—'}`
  }

  return `统计日期：${meituanRanking.daily.date || '—'}`
})

const meituanTrendSummaryLabel = computed(() => {
  if (meituanTrendMode.value === 'monthly') {
    return `统计月份：${meituanTrendMonthly.month || '—'}`
  }

  const tab = trendTabs.find((item) => item.value === currentTrendTab.value)
  return `统计区间：${tab ? tab.label : '—'}`
})

const currentTrendSummary = computed(() => {
  const submittedTotal = currentTrendRange.value.totalSubmitted ?? 0
  const submittedAverage = currentTrendRange.value.averageSubmitted ?? 0
  const approvedTotal = currentTrendRange.value.totalApproved ?? 0
  const approvedAverage = currentTrendRange.value.averageApproved ?? 0

  return {
    submittedTotal: formatCount(submittedTotal),
    submittedAverage: formatAverage(submittedAverage),
    approvedTotal: formatCount(approvedTotal),
    approvedAverage: formatAverage(approvedAverage)
  }
})

const setTrendTab = (tabValue) => {
  if (isMeituanTab.value && meituanTrendMode.value === 'monthly') {
    return
  }
  if (trendTabs.some((tab) => tab.value === tabValue)) {
    currentTrendTab.value = tabValue
    renderTrendChart()
  }
}

const formatTrendUpdatedAt = (value) => {
  if (!value) {
    return ''
  }

  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : value
}

const destroyTrendChart = () => {
  if (trendChartInstance.value) {
    trendChartInstance.value.dispose()
    trendChartInstance.value = null
  }
}

// 日期详情弹窗状态
const showDateDetailPopup = ref(false)
const selectedDateData = ref(null)

// 处理图表点击事件
const handleTrendChartClick = (params) => {
  if (isMeituanTab.value || !params || params.componentType !== 'series') return

  const dateIndex = params.dataIndex
  const range = currentTrendRange.value
  
  if (dateIndex >= 0 && dateIndex < range.dates.length) {
    const date = range.dates[dateIndex]
    const submittedCount = range.submitted[dateIndex] || 0
    const approvedCount = range.approved[dateIndex] || 0
    
    selectedDateData.value = {
      date: dayjs(date).format('YYYY-MM-DD'),
      submitted: submittedCount,
      approved: approvedCount,
      pending: submittedCount - approvedCount,
      approvalRate: submittedCount > 0 ? ((approvedCount / submittedCount) * 100).toFixed(1) : 0
    }
    
    showDateDetailPopup.value = true
  }
}

// 关闭日期详情弹窗
const closeDateDetailPopup = () => {
  showDateDetailPopup.value = false
  selectedDateData.value = null
}

const updateTrendChart = () => {
  if (!trendChartInstance.value) {
    return
  }

  if (isMeituanTab.value) {
    const range = currentMeituanTrendRange.value
    if (!range.dates.length) {
      trendChartInstance.value.clear()
      return
    }

    const formatTooltipDate = (value) => {
      const parsed = dayjs(value)
      if (!parsed.isValid()) {
        return value
      }
      return parsed.format('YYYY-MM-DD')
    }

    const formatAxisDate = (value) => {
      const parsed = dayjs(value)
      if (!parsed.isValid()) {
        return value
      }
      return parsed.format('MM-DD')
    }

    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: (params = []) => {
          if (!params.length) return ''
          const dateLabel = formatTooltipDate(params[0].axisValue)
          const gmvItem = params.find((item) => item.seriesName === 'GMV')
          const netItem = params.find((item) => item.seriesName === '净交易额')
          const lines = []
          if (gmvItem) {
            lines.push(`${gmvItem.marker}GMV：${formatCurrency(gmvItem.data)}`)
          }
          if (netItem) {
            lines.push(`${netItem.marker}净交易额：${formatCurrency(netItem.data)}`)
          }
          return [dateLabel, ...lines].join('<br/>')
        }
      },
      legend: {
        data: ['GMV', '净交易额'],
        top: '2%',
        right: '4%'
      },
      grid: {
        left: '6%',
        right: '4%',
        top: '18%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: range.dates,
        axisLabel: {
          formatter: (value) => formatAxisDate(value)
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value) => formatCurrency(value)
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0'
          }
        }
      },
      series: [
        {
          name: 'GMV',
          type: 'line',
          smooth: true,
          data: range.gmv,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: '#7232dd' },
          lineStyle: { width: 2, color: '#7232dd' },
          areaStyle: { color: 'rgba(114, 50, 221, 0.15)' }
        },
        {
          name: '净交易额',
          type: 'line',
          smooth: true,
          data: range.net,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: '#07c160' },
          lineStyle: { width: 2, color: '#07c160' },
          areaStyle: { color: 'rgba(7, 193, 96, 0.12)' }
        }
      ]
    }

    trendChartInstance.value.off('click')
    trendChartInstance.value.setOption(option, true)
    return
  }

  const range = currentTrendRange.value
  if (!range.dates.length) {
    trendChartInstance.value.clear()
    return
  }

  const dates = range.dates.map((item) => item)
  const submittedCounts = range.submitted.map((value) => (Number.isFinite(value) ? value : 0))
  const approvedCounts = range.approved.map((value) => (Number.isFinite(value) ? value : 0))

  const names = {
    submitted: '总进件',
    approved: '审核通过'
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params = []) => {
        if (!params.length) return ''
        const dateLabel = dayjs(params[0].axisValue).format('YYYY-MM-DD')
        const submittedItem = params.find((item) => item.seriesName === names.submitted)
        const approvedItem = params.find((item) => item.seriesName === names.approved)
        const lines = []
        if (submittedItem) {
          lines.push(`${submittedItem.marker}${names.submitted}：${submittedItem.data}`)
        }
        if (approvedItem) {
          lines.push(`${approvedItem.marker}${names.approved}：${approvedItem.data}`)
        }
        return [dateLabel, ...lines].join('<br/>')
      }
    },
    legend: {
      data: [names.submitted, names.approved],
      top: '2%',
      right: '4%',
      textStyle: {
        color: '#666',
        fontSize: 12
      }
    },
    grid: {
      left: '6%',
      right: '4%',
      top: '18%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: {
        lineStyle: {
          color: '#e0e0e0'
        }
      },
      axisLabel: {
        color: '#666',
        formatter: (value) => dayjs(value).format('MM-DD')
      }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: {
        show: false
      },
      axisLabel: {
        color: '#666'
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0'
        }
      }
    },
    series: [
      {
        name: names.submitted,
        type: 'line',
        smooth: true,
        data: submittedCounts,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: {
          color: '#1989fa'
        },
        lineStyle: {
          width: 2,
          color: '#1989fa'
        },
        areaStyle: {
          color: 'rgba(25, 137, 250, 0.18)'
        }
      },
      {
        name: names.approved,
        type: 'line',
        smooth: true,
        data: approvedCounts,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: {
          color: '#07c160'
        },
        lineStyle: {
          width: 2,
          color: '#07c160'
        },
        areaStyle: {
          color: 'rgba(7, 193, 96, 0.12)'
        }
      }
    ]
  }

  trendChartInstance.value.off('click')
  trendChartInstance.value.on('click', handleTrendChartClick)
  trendChartInstance.value.setOption(option, true)
}

const renderTrendChart = () => {
  const hasData = isMeituanTab.value ? hasMeituanTrendData.value : hasTrendData.value
  if (!hasData) {
    destroyTrendChart()
    return
  }

  nextTick(() => {
    if (!trendChartRef.value) {
      return
    }

    if (!trendChartInstance.value) {
      trendChartInstance.value = echarts.init(trendChartRef.value)
    }

    updateTrendChart()
  })
}

const handleTrendChartResize = () => {
  if (trendChartInstance.value) {
    trendChartInstance.value.resize()
  }
}

// 管理员信息
const adminInfo = ref({
  id: 0,
  name: '',
  avatar: '',
  role: '',
  lastLogin: ''
})

// 当前日期
const currentDateStr = computed(() => {
  const now = new Date()
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
  return now.toLocaleDateString('zh-CN', options)
})

// 数据概览
const dataOverview = ref({
  dateRange: '本月',
  totalVip: '0',
  totalDevices: '0',
  monthNewVip: '0',
  monthNewVipPrev: '0',
  monthNewDevices: '0',
  monthNewDevicesPrev: '0',
  todayNewVip: '0',
  todayNewDevices: '0'
})

const buildDefaultMeituanOverview = () => ({
  institutionTotal: 0,
  merchantTotal: 0,
  merchantTotalAllTime: 0,
  merchantTotalDisplay: 0,
  merchantDisplayLimit: 0,
  merchantRange: null,
  merchantScopeLabel: '',
  merchantScopeKey: '',
  transactionAmount: formatCurrency(0),
  profitAmount: formatCurrency(0),
  lastTransactionDate: ''
})

const meituanOverview = ref(buildDefaultMeituanOverview())
const meituanStatsSnapshot = ref({})

const parseAmount = (value) => {
  if (value === null || value === undefined) {
    return 0
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === 'string') {
    const normalized = value
      .replace(/[^\d.-]/g, '')
      .replace(/(\..*?)\./g, '$1')
    const numeric = Number(normalized)
    return Number.isFinite(numeric) ? numeric : 0
  }

  return 0
}

const normalizeMeituanSummary = (payload = {}) => {
  const normalizeCount = (value) => {
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : 0
  }

  return {
    institution_total: normalizeCount(payload.institution_total ?? payload.institutionTotal),
    merchant_total: normalizeCount(payload.merchant_total ?? payload.merchantTotal),
    merchant_total_all_time: normalizeCount(
      payload.merchant_total_all_time ??
        payload.merchantTotalAllTime ??
        payload.merchant_total ??
        payload.merchantTotal
    ),
    merchant_total_display: normalizeCount(
      payload.merchant_total_display ??
        payload.merchantTotalDisplay ??
        payload.merchant_total_active ??
        payload.merchantTotalActive ??
        payload.merchant_total ??
        payload.merchantTotal
    ),
    transaction_amount: parseAmount(
      payload.transaction_amount ??
        payload.transactionAmount ??
        payload.transaction_amount_formatted ??
        payload.transactionAmountFormatted
    ),
    profit_amount: parseAmount(
      payload.profit_amount ??
        payload.profitAmount ??
        payload.profit_amount_formatted ??
        payload.profitAmountFormatted
    ),
    last_transaction_date: payload.last_transaction_date ?? payload.lastTransactionDate ?? '',
    merchant_total_scope: payload.merchant_total_scope ?? payload.merchantTotalScope ?? '',
    merchant_total_scope_label: payload.merchant_total_scope_label ?? payload.merchantTotalScopeLabel ?? '',
    merchant_total_range: payload.merchant_total_range ?? payload.merchantTotalRange ?? null,
    merchant_display_limit: normalizeCount(payload.merchant_display_limit ?? payload.merchantDisplayLimit),
  }
}

const mergeMeituanSummaries = (primary = {}, secondary = {}) => {
  const base = normalizeMeituanSummary(primary)
  const incoming = normalizeMeituanSummary(secondary)

  const pickCount = (baseValue, incomingValue) => {
    return incomingValue > 0 ? incomingValue : baseValue
  }

  const pickAmount = (baseValue, incomingValue) => {
    return incomingValue > 0 ? incomingValue : baseValue
  }

  return {
    institution_total: pickCount(base.institution_total, incoming.institution_total),
    merchant_total: pickCount(base.merchant_total, incoming.merchant_total),
    merchant_total_all_time: pickCount(base.merchant_total_all_time, incoming.merchant_total_all_time),
    merchant_total_display: pickCount(base.merchant_total_display, incoming.merchant_total_display),
    transaction_amount: pickAmount(base.transaction_amount, incoming.transaction_amount),
    profit_amount: pickAmount(base.profit_amount, incoming.profit_amount),
    last_transaction_date: incoming.last_transaction_date || base.last_transaction_date || '',
    merchant_total_scope: incoming.merchant_total_scope || base.merchant_total_scope || '',
    merchant_total_scope_label: incoming.merchant_total_scope_label || base.merchant_total_scope_label || '',
    merchant_total_range: incoming.merchant_total_range || base.merchant_total_range || null,
    merchant_display_limit: pickCount(base.merchant_display_limit, incoming.merchant_display_limit),
  }
}

const resetMeituanOverview = () => {
  meituanOverview.value = buildDefaultMeituanOverview()
}

const updateMeituanOverview = (payload = {}) => {
  const institutionTotal = Number(payload.institution_total ?? payload.institutionTotal ?? 0)
  const merchantTotalDisplay = Number(
    payload.merchant_total_display ??
      payload.merchantTotalDisplay ??
      payload.merchant_total_active ??
      payload.merchant_total ??
      payload.merchantTotal ??
      0
  )
  const merchantTotalAllTime = Number(
    payload.merchant_total_all_time ??
      payload.merchantTotalAllTime ??
      payload.merchant_total ??
      payload.merchantTotal ??
      merchantTotalDisplay
  )
  const merchantDisplayLimit = Number(
    payload.merchant_display_limit ?? payload.merchantDisplayLimit ?? (merchantTotalDisplay || 0)
  )
  const merchantRangeRaw = payload.merchant_total_range ?? payload.merchantTotalRange ?? null
  const merchantScopeLabel = payload.merchant_total_scope_label ?? payload.merchantTotalScopeLabel ?? ''
  const merchantScopeKey = payload.merchant_total_scope ?? payload.merchantTotalScope ?? ''
  const transactionAmount = payload.transaction_amount_formatted ?? payload.transactionAmountFormatted ?? formatCurrency(payload.transaction_amount ?? payload.transactionAmount ?? 0)
  const profitAmount = payload.profit_amount_formatted ?? payload.profitAmountFormatted ?? formatCurrency(payload.profit_amount ?? payload.profitAmount ?? 0)
  const lastTransactionDate = payload.last_transaction_date ?? payload.lastTransactionDate ?? ''

  const merchantRange = merchantRangeRaw && typeof merchantRangeRaw === 'object'
    ? {
        start: merchantRangeRaw.start || '',
        end: merchantRangeRaw.end || ''
      }
    : null

  meituanOverview.value = {
    institutionTotal,
    merchantTotal: merchantTotalDisplay,
    merchantTotalDisplay,
    merchantTotalAllTime,
    merchantDisplayLimit,
    merchantRange,
    merchantScopeLabel,
    merchantScopeKey,
    transactionAmount,
    profitAmount,
    lastTransactionDate
  }
}

const purifierOverviewItems = computed(() => [
  { key: 'totalVip', label: 'VIP总数', kind: 'single', value: formatCount(dataOverview.value.totalVip) },
  { key: 'totalDevices', label: '设备总数', kind: 'single', value: formatCount(dataOverview.value.totalDevices) },
  {
    key: 'monthNewVip',
    label: '本月新增VIP',
    kind: 'single',
    value: formatCount(dataOverview.value.monthNewVip),
    sublabel: `上月 ${formatCount(dataOverview.value.monthNewVipPrev)}`
  },
  {
    key: 'monthNewDevices',
    label: '本月新增设备',
    kind: 'single',
    value: formatCount(dataOverview.value.monthNewDevices),
    sublabel: `上月 ${formatCount(dataOverview.value.monthNewDevicesPrev)}`
  },
  { key: 'todayNewVip', label: '今日新增VIP', kind: 'single', value: formatCount(dataOverview.value.todayNewVip) },
  { key: 'todayNewDevices', label: '今日新增设备', kind: 'single', value: formatCount(dataOverview.value.todayNewDevices) }
])

const paymentOverviewItems = computed(() => {
  const overview = onboardingOverview.value
  return [
    { 
      key: 'auto', 
      label: '自动进件', 
      kind: 'comparison',
      today: formatCount(overview.summary.today_auto),
      yesterday: formatCount(overview.summary.yesterday_auto)
    },
    { 
      key: 'approved', 
      label: '审核通过', 
      kind: 'comparison',
      today: formatCount(overview.summary.today_new),
      yesterday: formatCount(overview.summary.yesterday_new)
    },
    { 
      key: 'institutions', 
      label: '出商户机构', 
      kind: 'comparison',
      today: formatCount(overview.summary.today_institutions),
      yesterday: formatCount(overview.summary.yesterday_institutions)
    }
  ]
})

const meituanMerchantSublabel = computed(() => {
  const scopeLabel = meituanOverview.value.merchantScopeLabel || ''
  const display = Number(meituanOverview.value.merchantTotal || 0)
  const allTime = Number(meituanOverview.value.merchantTotalAllTime || 0)

  if (allTime > display && display > 0) {
    const allTimeText = formatCount(allTime)
    return scopeLabel ? `${scopeLabel} ｜ 累计 ${allTimeText}` : `累计 ${allTimeText}`
  }

  return scopeLabel
})

const totalMeituanMerchantPages = computed(() => {
  const total = meituanMerchants.value.length
  return total <= 0 ? 1 : Math.ceil(total / meituanMerchantPagination.pageSize)
})

const displayMeituanMerchants = computed(() => {
  if (!meituanMerchants.value.length) {
    return []
  }
  const start = (meituanMerchantPagination.current - 1) * meituanMerchantPagination.pageSize
  return meituanMerchants.value.slice(start, start + meituanMerchantPagination.pageSize)
})

const meituanMerchantHeader = computed(() => {
  const display = Number(meituanOverview.value.merchantTotal || 0)
  const allTime = Number(meituanOverview.value.merchantTotalAllTime || 0)
  const listCount = meituanMerchants.value.length

  if (display === 0 && listCount === 0) {
    return ''
  }

  const parts = []

  if (listCount > 0) {
    const totalPages = totalMeituanMerchantPages.value || 1
    const currentPage = Math.min(Math.max(1, meituanMerchantPagination.current), totalPages)
    const pageSize = meituanMerchantPagination.pageSize
    const start = (currentPage - 1) * pageSize + 1
    const availableMax = display > 0 ? Math.min(display, listCount) : listCount
    const end = Math.min(currentPage * pageSize, availableMax)
    const denominator = display > 0 ? formatCount(display) : formatCount(listCount)
    parts.push(`展示第 ${formatCount(start)}-${formatCount(end)} / ${denominator} 家`)
  } else if (display > 0) {
    parts.push(`共 ${formatCount(display)} 家`)
  }

  if (meituanOverview.value.merchantScopeLabel) {
    parts.push(meituanOverview.value.merchantScopeLabel)
  }

  if (allTime > display) {
    parts.push(`累计 ${formatCount(allTime)} 家`)
  }

  return parts.join(' ｜ ')
})

const meituanOverviewItems = computed(() => [
  { key: 'meituanInstitutions', label: '美团机构总数', kind: 'single', value: formatCount(meituanOverview.value.institutionTotal) },
  { key: 'meituanMerchants', label: '商户总数', kind: 'single', value: formatCount(meituanOverview.value.merchantTotal), sublabel: meituanMerchantSublabel.value || '' },
  { key: 'meituanTransaction', label: '交易总额', kind: 'single', value: meituanOverview.value.transactionAmount },
  { key: 'meituanProfit', label: '分润总额', kind: 'single', value: meituanOverview.value.profitAmount }
])

const overviewColumnNum = computed(() => (overviewTab.value === 'meituan' ? 2 : 3))

const currentOverviewItems = computed(() =>
  overviewTab.value === 'payment'
    ? paymentOverviewItems.value
    : overviewTab.value === 'meituan'
      ? meituanOverviewItems.value
      : purifierOverviewItems.value
)

const overviewMetaText = computed(() => {
  if (overviewTab.value === 'payment') {
    const todayPending = formatCount(onboardingOverview.value.today.pending)
    const allPending = formatCount(onboardingOverview.value.all.pending)
    const updatedAt = onboardingOverview.value.updatedAt
    const pendingInfo = `今日待审 ${todayPending} · 累计 ${allPending}`
    return updatedAt ? `${pendingInfo} ｜ 更新于 ${updatedAt}` : pendingInfo
  } else if (overviewTab.value === 'meituan') {
    const lastDate = meituanOverview.value.lastTransactionDate
    return lastDate ? `最近交易日：${lastDate}` : '暂无交易数据'
  }
  return dataOverview.value.dateRange || '本月'
})

const setMeituanMerchantPage = (target) => {
  const maxPage = totalMeituanMerchantPages.value || 1
  const normalized = Math.min(Math.max(1, Number(target) || 1), maxPage)
  if (normalized !== meituanMerchantPagination.current) {
    meituanMerchantPagination.current = normalized
  }
}

const goToPrevMeituanMerchantPage = () => {
  if (meituanMerchantPagination.current > 1) {
    setMeituanMerchantPage(meituanMerchantPagination.current - 1)
  }
}

const goToNextMeituanMerchantPage = () => {
  if (meituanMerchantPagination.current < totalMeituanMerchantPages.value) {
    setMeituanMerchantPage(meituanMerchantPagination.current + 1)
  }
}

watch(
  () => meituanMerchants.value.length,
  () => {
    const maxPage = totalMeituanMerchantPages.value || 1
    if (meituanMerchantPagination.current > maxPage) {
      meituanMerchantPagination.current = maxPage
    }
    if (meituanMerchantPagination.current < 1) {
      meituanMerchantPagination.current = 1
    }
  }
)

// 功能列表
const features = ref([
  {
    id: 1,
    name: '用户管理',
    icon: 'user-o',
    color: '#1989fa',
    route: '/admin/users'
  },
  {
    id: 3,
    name: '商户管理',
    icon: 'shop-o',
    color: '#ff976a',
    route: '/admin/merchants'
  },
  {
    id: 4,
    name: '设备管理',
    icon: 'desktop-o',
    color: '#7232dd',
    route: '/admin/tapp-devices'
  },
  {
    id: 5,
    name: '订单管理',
    icon: 'orders-o',
    color: '#ee0a24',
    route: '/admin/mall/orders'
  },
  {
    id: 6,
    name: '星驿付绑定',
    icon: 'link-o',
    color: '#07c160',
    route: '/admin/starpay-bindings'
  }
])

const AUDIT_STATUS_MAP = Object.freeze({
  0: '待审核',
  1: '已通过',
  2: '已拒绝',
  3: '审核中'
})

const AUDIT_STATUS_OPTIONS = Object.freeze([
  { text: '全部状态', value: '' },
  { text: AUDIT_STATUS_MAP[0], value: '0' },
  { text: AUDIT_STATUS_MAP[3], value: '3' },
  { text: AUDIT_STATUS_MAP[1], value: '1' },
  { text: AUDIT_STATUS_MAP[2], value: '2' }
])

const AUDIT_STATUS_QUICK_FILTERS = Object.freeze([
  { label: AUDIT_STATUS_MAP[0], value: '0' },
  { label: AUDIT_STATUS_MAP[1], value: '1' },
  { label: AUDIT_STATUS_MAP[2], value: '2' },
  { label: '全部', value: '' }
])

const LEGACY_STATUS_TO_AUDIT = Object.freeze({
  pending: { code: '0', tag: 'warning', text: AUDIT_STATUS_MAP[0] },
  reviewing: { code: '3', tag: 'primary', text: AUDIT_STATUS_MAP[3] },
  active: { code: '1', tag: 'success', text: AUDIT_STATUS_MAP[1] },
  suspended: { code: '2', tag: 'primary', text: AUDIT_STATUS_MAP[2] },
  terminated: { code: '2', tag: 'danger', text: AUDIT_STATUS_MAP[2] },
  rejected: { code: '2', tag: 'danger', text: AUDIT_STATUS_MAP[2] }
})

const auditStatusOptionMap = AUDIT_STATUS_OPTIONS.reduce((map, option) => {
  map.set(String(option.value), option.text)
  return map
}, new Map())

const getAuditStatusLabel = (value) => auditStatusOptionMap.get(String(value)) || '全部状态'

const auditStatusFilter = ref('0')
const merchantList = ref([])
const workspaceMerchantList = ref([])
const isMerchantLoading = ref(false)
const totalMerchants = ref(0)
const isServerPaginated = ref(true)
let merchantListRequestCounter = 0
const pagination = reactive({
  current: 1,
  pageSize: DEFAULT_MERCHANT_PAGE_SIZE
})

const institutionRanking = ref([])
const rankingTotal = ref(0)
const rankingFilter = ref('today')
const rankingDate = ref(dayjs().format('YYYY-MM-DD'))
const rankingLoading = ref(false)
const showRankingDatePicker = ref(false)
const previousRankingFilter = ref('today')

const filterByAuditStatus = (list) => {
  if (!auditStatusFilter.value) {
    return list
  }
  const target = String(auditStatusFilter.value)
  return list.filter((merchant) => String(merchant.auditStatus ?? '') === target)
}

const filteredMerchants = computed(() => filterByAuditStatus(merchantList.value))

const totalMerchantPages = computed(() => {
  const total = totalMerchants.value
  return total <= 0 ? 1 : Math.ceil(total / pagination.pageSize)
})

const displayMerchants = computed(() => {
  if (isServerPaginated.value) {
    return filteredMerchants.value
  }
  const start = (pagination.current - 1) * pagination.pageSize
  return filteredMerchants.value.slice(start, start + pagination.pageSize)
})

const rankingMinDate = dayjs().subtract(1, 'year').startOf('year').toDate()
const rankingMaxDate = new Date()

const buildRankingPickerValue = (dateStr) => {
  const parsed = dayjs(dateStr, ['YYYY-MM-DD', 'YYYY/M/D', 'YYYY-M-D'], true)
  if (!parsed.isValid()) {
    const fallback = dayjs(dateStr)
    if (!fallback.isValid()) {
      return []
    }
    return [fallback.format('YYYY'), fallback.format('MM'), fallback.format('DD')]
  }
  return [parsed.format('YYYY'), parsed.format('MM'), parsed.format('DD')]
}

const resolveRankingPickerValues = (values = []) => {
  if (!Array.isArray(values) || values.length < 3) {
    return ''
  }
  const [year, month, day] = values
  if (!year || !month || !day) {
    return ''
  }
  const dateStr = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const parsed = dayjs(dateStr, 'YYYY-MM-DD', true)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : ''
}

const rankingPickerValue = ref(buildRankingPickerValue(rankingDate.value))

watch(
  () => rankingDate.value,
  (value) => {
    rankingPickerValue.value = buildRankingPickerValue(value)
  }
)

watch(
  () => overviewTab.value,
  () => {
    if (isMeituanTab.value) {
      showDateDetailPopup.value = false
    }
    destroyTrendChart()
    nextTick(() => {
      renderTrendChart()
    })
  }
)

const rankingDateLabel = computed(() => {
  if (rankingFilter.value === 'today') {
    return '今日'
  }
  if (rankingFilter.value === 'yesterday') {
    return '昨日'
  }
  return rankingDate.value
})

const applyInstitutionRanking = (rankingData) => {
  if (!rankingData || typeof rankingData !== 'object') {
    return false
  }

  const items = Array.isArray(rankingData.items) ? rankingData.items : []
  institutionRanking.value = items
  rankingTotal.value = typeof rankingData.total === 'number' ? rankingData.total : items.length

  if (rankingData.date) {
    rankingDate.value = rankingData.date
    updateRankingFilterByDate(rankingData.date)
    previousRankingFilter.value = rankingFilter.value
  }

  return true
}

const resolveAuditTagType = (status) => {
  // 确保status是一个有效的数字，如果不是则使用默认值0
  const numericStatus = status === null || status === undefined ? 0 : Number(status)
  if (Number.isNaN(numericStatus)) {
    return 'primary'
  }
  switch (numericStatus) {
    case 1:
      return 'success'
    case 2:
      return 'danger'
    case 3:
      return 'primary'
    default:
      return 'warning'
  }
}

const SUPPORTED_TAG_TYPES = new Set(['primary', 'success', 'danger', 'warning'])

const normalizeTagType = (type, status) => {
  if (typeof type === 'string') {
    const normalized = type.trim().toLowerCase()
    if (SUPPORTED_TAG_TYPES.has(normalized)) {
      return normalized
    }
    if (normalized === 'info') {
      return 'primary'
    }
  }
  return resolveAuditTagType(status)
}

const getAuditStatusTextByCode = (status) => {
  const numericStatus = Number(status)
  if (Number.isNaN(numericStatus)) {
    return '未审核'
  }
  return AUDIT_STATUS_MAP[numericStatus] || '未审核'
}

const normalizeMerchantEntry = (entry) => {
  if (!entry || typeof entry !== 'object') {
    return null
  }

  const meta = entry.meta || {}
  const rawStatus = entry.audit_status ?? entry.auditStatus ?? meta.audit_status ?? meta.auditStatus ?? null
  const auditStatusCode = rawStatus === null || rawStatus === undefined || rawStatus === ''
    ? 0  // 改为默认值0而不是null
    : Number(rawStatus)
  const auditStatus = auditStatusCode === null || Number.isNaN(auditStatusCode)
    ? '0'  // 确保始终有默认值
    : String(auditStatusCode)

  const recordSource = entry.record_source ?? entry.recordSource ?? meta.record_source ?? meta.recordSource ?? ''

  const submittedCandidate = resolvePreferredTimestamp(
    entry.raw_submitted_at,
    entry.rawSubmittedAt,
    meta.raw_submitted_at,
    entry.submitted_at,
    entry.submittedAt,
    meta.submitted_at,
    entry.create_time,
    entry.created_at,
    meta.create_time,
    entry.cate_time,
    meta.cate_time
  )

  const finalAuditStatus = auditStatus || '0'
  const finalAuditStatusCode = Number.isNaN(Number(finalAuditStatus)) ? 0 : Number(finalAuditStatus)  // 确保是有效数字

  const salesmanName =
    entry.salesman_display_name ??
    entry.salesmanDisplayName ??
    entry.salesman_name ??
    entry.salesmanName ??
    meta.salesman_display_name ??
    meta.salesman_name ??
    ''
  const salesmanSerial =
    entry.salesman_display_serial ??
    entry.salesmanDisplaySerial ??
    entry.salesman_serial ??
    entry.salesmanSerial ??
    meta.salesman_display_serial ??
    meta.salesman_serial ??
    ''

  const resolvedAuditStatusText =
    entry.audit_status_text ??
    entry.auditStatusText ??
    meta.audit_status_text ??
    getAuditStatusTextByCode(finalAuditStatusCode)

  const resolvedAuditTagType =
    normalizeTagType(entry.audit_tag_type ?? entry.auditTagType ?? meta.audit_tag_type, finalAuditStatusCode)

  return {
    id: entry.id ?? entry.merchant_id ?? meta.id ?? null,
    recordId:
      entry.record_id ??
      entry.recordId ??
      entry.draft_id ??
      entry.draftId ??
      meta.record_id ??
      meta.recordId ??
      meta.draft_id ??
      meta.draftId ??
      null,
    name:
      entry.name ??
      entry.merchant_name ??
      entry.mch_short_name ??
      entry.mch_name ??
      entry.title ??
      meta.merchant ??
      meta.name ??
      '未知商户',
    institution: entry.institution ?? entry.invite_institution_name ?? meta.institution ?? meta.invite_institution_name ?? entry.channel_name ?? meta.channel ?? '',
    inviteCode: entry.invite_code ?? entry.inviteCode ?? meta.invite_code ?? '',
    auditStatus: finalAuditStatus,
    auditStatusCode: finalAuditStatusCode,
    auditStatusText: resolvedAuditStatusText,
    auditTagType: resolvedAuditTagType,
    recordSource,
    salesmanName,
    salesmanSerial,
    submittedAt: submittedCandidate ? submittedCandidate.parsed.format('YYYY-MM-DD HH:mm:ss') : '',
    rawSubmittedAt: submittedCandidate?.raw ?? '',
    channelName: entry.channel_name ?? entry.channelName ?? meta.channel ?? '',
    contactName: entry.contact_name ?? entry.contactName ?? meta.contact_name ?? '',
    contactPhone: entry.contact_phone ?? entry.contactPhone ?? meta.contact_phone ?? '',
  }
}

const extractMerchantEntries = (rawList) => {
  if (!rawList) return []
  if (Array.isArray(rawList)) {
    return rawList
  }
  if (typeof rawList === 'object') {
    if (Array.isArray(rawList.data)) {
      return rawList.data
    }
    if (Array.isArray(rawList.items)) {
      return rawList.items
    }
    if (Array.isArray(rawList.list)) {
      return rawList.list
    }
  }
  return []
}

const transformMerchantList = (rawList) =>
  extractMerchantEntries(rawList)
    .map((item) => normalizeMerchantEntry(item))
    .filter((item) => item !== null)

const normalizeLegacyMerchantEntry = (entry) => {
  if (!entry || typeof entry !== 'object') {
    return null
  }

  const legacyStatusRaw = typeof entry.status === 'string' ? entry.status.toLowerCase() : entry.status ?? ''
  const mapped = typeof legacyStatusRaw === 'string' ? LEGACY_STATUS_TO_AUDIT[legacyStatusRaw] : null

  const auditStatusSource = entry.audit_status ?? entry.auditStatus ?? mapped?.code ?? null
  const auditStatus = auditStatusSource === null || auditStatusSource === undefined
    ? '0'  // 确保始终有默认值
    : String(Number(auditStatusSource))
  const auditStatusCode = auditStatus ? Number(auditStatus) : 0  // 确保始终有默认值

  const resolvedAuditStatus = auditStatus || '0'
  const resolvedAuditStatusCode = Number.isNaN(Number(resolvedAuditStatus)) ? 0 : Number(resolvedAuditStatus)  // 确保是有效数字

  const auditTagType =
    entry.audit_tag_type ||
    entry.auditTagType ||
    mapped?.tag ||
    resolveAuditTagType(resolvedAuditStatusCode)

  const auditStatusText =
    entry.audit_status_text ||
    entry.auditStatusText ||
    entry.status_text ||
    mapped?.text ||
    getAuditStatusTextByCode(resolvedAuditStatusCode)

  const submittedCandidate = resolvePreferredTimestamp(
    entry.raw_submitted_at,
    entry.rawSubmittedAt,
    entry.submitted_at,
    entry.submittedAt,
    entry.create_time,
    entry.created_at,
    entry.cate_time,
    entry.update_time,
    entry.updated_at
  )

  const salesmanName =
    entry.salesman_display_name ||
    entry.salesmanDisplayName ||
    entry.salesman_name ||
    entry.salesmanName ||
    entry.salesman ||
    ''
  const salesmanSerial =
    entry.salesman_display_serial ||
    entry.salesmanDisplaySerial ||
    entry.salesman_serial ||
    entry.salesmanSerial ||
    entry.salesman_code ||
    ''

  return {
    id: entry.id ?? entry.merchant_id ?? entry.merchantId ?? null,
    recordId:
      entry.record_id ??
      entry.recordId ??
      entry.draft_id ??
      entry.draftId ??
      null,
    name:
      entry.name ||
      entry.merchant_name ||
      entry.merchant_short_name ||
      entry.mch_short_name ||
      entry.mch_name ||
      '未知商户',
    institution:
      entry.invite_institution_name ||
      entry.channel_name ||
      entry.institution ||
      entry.principal_name ||
      '',
    inviteCode:
      entry.invite_code ||
      entry.inviteCode ||
      entry.merchant_id ||
      entry.merchantId ||
      '',
    auditStatus: resolvedAuditStatus,
    auditStatusCode: resolvedAuditStatusCode,
    auditStatusText,
    auditTagType,
    recordSource: entry.record_source || entry.recordSource || (mapped?.code === '0' ? 'draft' : 'final'),
    salesmanName,
    salesmanSerial,
    submittedAt: submittedCandidate ? submittedCandidate.parsed.format('YYYY-MM-DD HH:mm:ss') : '',
    rawSubmittedAt: submittedCandidate?.raw ?? '',
    channelName: entry.channel_name || '',
    contactName: entry.contact_name || entry.principal_name || '',
    contactPhone: entry.contact_phone || entry.principal_mobile || '',
  }
}

const transformLegacyMerchantList = (rawList) =>
  extractMerchantEntries(rawList)
    .map((item) => normalizeLegacyMerchantEntry(item))
    .filter((item) => item !== null)

const mapAuditFilterToLegacyStatus = (auditValue) => {
  switch (String(auditValue)) {
    case '0':
      return 'pending'
    case '1':
      return 'active'
    case '2':
      return 'suspended'
    case '3':
      return 'pending'
    default:
      return undefined
  }
}

const extractTotalFromPayload = (payload, fallback = 0) => {
  if (!payload || typeof payload !== 'object') return fallback
  if (typeof payload.total === 'number') return payload.total
  if (payload.pagination && typeof payload.pagination.total === 'number') {
    return payload.pagination.total
  }
  if (payload.data && typeof payload.data === 'object') {
    if (typeof payload.data.total === 'number') {
      return payload.data.total
    }
    if (payload.data.pagination && typeof payload.data.pagination.total === 'number') {
      return payload.data.pagination.total
    }
  }
  return fallback
}

const loadMerchantList = async ({ page = pagination.current, showToastOnError = true } = {}) => {
  const requestId = ++merchantListRequestCounter
  const targetPage = Math.max(1, page)
  isMerchantLoading.value = true
  let primaryFailedMessage = ''

  try {
    const params = {
      per_page: pagination.pageSize,
      page: targetPage,
      sort_field: 'submitted_at',
      sort_order: 'desc'
    }

    if (auditStatusFilter.value) {
      params.audit_status = auditStatusFilter.value
    }

    const res = await fetchMerchantList(params)
    if (res?.code === 0) {
      const payload = res.data ?? {}
      const rawList = payload.data ?? payload.items ?? payload.list ?? []
      const normalizedList = transformMerchantList(rawList)
      if (requestId === merchantListRequestCounter) {
        pagination.current = targetPage
        merchantList.value = normalizedList
        totalMerchants.value = extractTotalFromPayload(payload, normalizedList.length)
        isServerPaginated.value = true
        isMerchantLoading.value = false
        return true
      }
    } else {
      primaryFailedMessage = res?.message || ''
    }
  } catch (error) {
    if (handleAuthError(error)) {
      isMerchantLoading.value = false
      return false
    }
    console.error('加载商户列表失败:', error)
    primaryFailedMessage = error?.message || ''
  }

  try {
    const legacyParams = {
      page: targetPage,
      limit: pagination.pageSize,
      sort_field: 'created_at',
      sort_order: 'desc'
    }

    const legacyStatus = mapAuditFilterToLegacyStatus(auditStatusFilter.value)
    if (legacyStatus) {
      legacyParams.status = legacyStatus
    }

    const legacyRes = await fetchLegacyAdminMerchants(legacyParams)
    if (legacyRes?.code === 0) {
      const legacyPayload = legacyRes.data ?? {}
      const legacyList = transformLegacyMerchantList(legacyPayload)
      if (requestId === merchantListRequestCounter) {
        pagination.current = targetPage
        merchantList.value = legacyList
        totalMerchants.value = extractTotalFromPayload(legacyPayload, legacyList.length)
        primaryFailedMessage = ''
        isServerPaginated.value = true
        isMerchantLoading.value = false
        return true
      }
    } else if (!primaryFailedMessage) {
      primaryFailedMessage = legacyRes?.message || ''
    }
  } catch (error) {
    if (handleAuthError(error)) {
      isMerchantLoading.value = false
      return false
    }
    console.error('加载商户列表失败（兼容接口）:', error)
    if (!primaryFailedMessage) {
      primaryFailedMessage = error?.message || ''
    }
  } finally {
    if (requestId === merchantListRequestCounter) {
      if (merchantList.value.length === 0) {
        const fallbackList = workspaceMerchantList.value.map((item) => ({ ...item }))
        merchantList.value = fallbackList
        const fallbackTotal = filterByAuditStatus(fallbackList).length
        totalMerchants.value = fallbackTotal
        const maxPage = fallbackTotal > 0 ? Math.ceil(fallbackTotal / pagination.pageSize) : 1
        pagination.current = Math.min(Math.max(1, targetPage), maxPage)
        isServerPaginated.value = false
      }
      if (showToastOnError && merchantList.value.length === 0 && primaryFailedMessage) {
        showToast(primaryFailedMessage || '加载商户列表失败，请稍后重试')
      }
      isMerchantLoading.value = false
    }
  }

  return merchantList.value.length > 0
}

const goToPage = (page) => {
  const target = Math.min(Math.max(1, page), totalMerchantPages.value)
  if (isServerPaginated.value === false) {
    pagination.current = target
    return
  }

  if (target === pagination.current && merchantList.value.length > 0) {
    return
  }
  loadMerchantList({ page: target })
}

const goToPrevPage = () => {
  if (pagination.current > 1) {
    goToPage(pagination.current - 1)
  }
}

const goToNextPage = () => {
  if (pagination.current < totalMerchantPages.value) {
    goToPage(pagination.current + 1)
  }
}

const setAuditStatusFilter = (value) => {
  if (auditStatusFilter.value === value) {
    return
  }
  auditStatusFilter.value = value
  pagination.current = 1
  loadMerchantList({ page: 1 })
}

const updateRankingFilterByDate = (dateStr) => {
  const todayStr = dayjs().format('YYYY-MM-DD')
  const yesterdayStr = dayjs().subtract(1, 'day').format('YYYY-MM-DD')

  if (dateStr === todayStr) {
    rankingFilter.value = 'today'
  } else if (dateStr === yesterdayStr) {
    rankingFilter.value = 'yesterday'
  } else {
    rankingFilter.value = 'custom'
  }
}

const fetchInstitutionRanking = async () => {
  rankingLoading.value = true
  let fetched = false

  try {
    const response = await getAdminInstitutionRanking({ date: rankingDate.value })
    if (response?.code === 0) {
      fetched = applyInstitutionRanking(response.data)
    }
  } catch (error) {
    console.error('获取机构进件排名失败:', error)
  }

  if (!fetched) {
    try {
      const fallbackResponse = await getAdminWorkspace({
        ranking_date: rankingDate.value,
        meituan_merchant_limit: MEITUAN_MERCHANT_LIMIT
      })
      if (fallbackResponse?.code === 0) {
        fetched = applyInstitutionRanking(fallbackResponse.data?.institutionRanking)
      }
    } catch (fallbackError) {
      console.error('fallback 获取机构进件排名失败:', fallbackError)
    }
  }

  if (!fetched) {
    institutionRanking.value = []
    rankingTotal.value = 0
  }

  rankingLoading.value = false
  return fetched
}

const setRankingFilter = (value) => {
  if (value === 'custom') {
    openRankingDatePicker()
    return
  }

  if (rankingFilter.value === value) {
    fetchInstitutionRanking()
    return
  }

  previousRankingFilter.value = value
  rankingFilter.value = value
  rankingDate.value = value === 'yesterday'
    ? dayjs().subtract(1, 'day').format('YYYY-MM-DD')
    : dayjs().format('YYYY-MM-DD')
  fetchInstitutionRanking()
}

const openRankingDatePicker = () => {
  previousRankingFilter.value = rankingFilter.value
  rankingFilter.value = 'custom'
  rankingPickerValue.value = buildRankingPickerValue(rankingDate.value)
  showRankingDatePicker.value = true
}

const handleRankingDateConfirm = (payload) => {
  const selectedValues = Array.isArray(payload?.selectedValues) ? payload.selectedValues : rankingPickerValue.value
  const dateValue = resolveRankingPickerValues(selectedValues)
  rankingPickerValue.value = buildRankingPickerValue(dateValue || rankingDate.value)
  showRankingDatePicker.value = false
  if (!dateValue) {
    return
  }
  rankingFilter.value = 'custom'
  rankingDate.value = dateValue
  fetchInstitutionRanking()
}

const handleRankingDateCancel = () => {
  showRankingDatePicker.value = false
  rankingPickerValue.value = buildRankingPickerValue(rankingDate.value)
  if (rankingFilter.value === 'custom' && previousRankingFilter.value !== 'custom') {
    rankingFilter.value = previousRankingFilter.value
    rankingDate.value = previousRankingFilter.value === 'yesterday'
      ? dayjs().subtract(1, 'day').format('YYYY-MM-DD')
      : dayjs().format('YYYY-MM-DD')
  }
}

const handleMerchantClick = (merchant) => {
  if (!merchant) {
    return
  }

  const targetId = merchant.id ?? merchant.merchant_id ?? merchant.merchantId

  if (!targetId) {
    showToast('未找到商户ID，无法打开详情')
    return
  }

  const routeLocation = {
    name: 'AdminMerchantDetail',
    params: {
      id: String(targetId)
    }
  }

  const query = {}
  if (merchant.recordSource) {
    query.source = merchant.recordSource
  }
  if (merchant.recordId) {
    query.record_id = merchant.recordId
  }
  if (Object.keys(query).length > 0) {
    routeLocation.query = query
  }

  router.push(routeLocation)
}

// 系统日志
const systemLogs = ref([])

// 获取日志类型文本
const getLogTypeText = (type) => {
  switch (type) {
    case 'info':
      return '信息'
    case 'warning':
      return '警告'
    case 'error':
      return '错误'
    case 'success':
      return '成功'
    default:
      return '未知'
  }
}

const buildFallbackUserInfo = () => {
  const cached = getAdminUserInfo()
  if (cached) {
    return cached
  }

  return {
    id: adminInfo.value?.id || 0,
    name: adminInfo.value?.name || '管理员',
    nickname: adminInfo.value?.name || '管理员',
    role: 'admin',
    is_admin: 1,
    branch_id: 3
  }
}

const loadPaymentOverview = async () => {
  try {
    const res = await getMerchantOnboardingStats()
    if (res?.code === 0) {
      updateOnboardingOverview(res.data || {})
      console.log('📈 [管理后台] 支付进件概览:', onboardingOverview.value)
      return true
    }
    throw res
  } catch (error) {
    if (isAuthError(error)) {
      showToast('登录已过期，请重新登录后查看支付进件数据')
      handleAdminLogout()
      return false
    }

    console.error('获取支付进件统计失败:', error)
    resetOnboardingOverview()
    return false
  }
}

const fetchAdminData = async () => {
  isMerchantLoading.value = true
  rankingLoading.value = true
  let loadingToast = null
  const closeLoadingSafely = () => {
    try {
      loadingToast?.close?.()
    } catch (e) {
      closeToast()
    }
  }

  try {
    loadingToast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      duration: 0
    })

    const workspaceRes = await getAdminWorkspace({
      ranking_date: rankingDate.value,
      meituan_merchant_limit: MEITUAN_MERCHANT_LIMIT
    })

    if (workspaceRes.code === 0 && workspaceRes.data) {
      const userInfo = workspaceRes.data.user_info || {}
      const lastLoginText = formatAdminLastLogin(userInfo)
      adminInfo.value = {
        id: userInfo.id,
        name: userInfo.nickname || userInfo.username || '管理员',
        avatar: userInfo.avatar || '/favicon.ico',
        role: '系统管理员',
        lastLogin: lastLoginText || '未知'
      }

      const stats = workspaceRes.data.stats || {}
      const overview = stats.overview || {}
      const vipStats = stats.vip || {}
      const deviceStats = stats.devices || {}
      const meituanStats = stats.meituan || {}

      dataOverview.value = {
        dateRange: '本月',
        totalVip: overview.total_vip || vipStats.total_vip || '0',
        totalDevices: overview.total_devices || deviceStats.total_devices || '0',
        monthNewVip: overview.month_new_vip || vipStats.month_new_vip || '0',
        monthNewVipPrev: overview.last_month_new_vip || vipStats.last_month_new_vip || '0',
        monthNewDevices: overview.month_new_devices || deviceStats.month_new_devices || '0',
        monthNewDevicesPrev: overview.last_month_new_devices || deviceStats.last_month_new_devices || '0',
        todayNewVip: overview.today_new_vip || vipStats.today_new_vip || '0',
        todayNewDevices: overview.today_new_devices || deviceStats.today_new_devices || '0'
      }

      meituanStatsSnapshot.value = meituanStats
      updateMeituanOverview(meituanStats)

      const meituanWorkspace = workspaceRes.data.meituanWorkspace || {}
      applyMeituanWorkspace(meituanWorkspace)

      const rawMerchantList = workspaceRes.data.merchantList ?? workspaceRes.data.todos ?? []
      const normalizedWorkspaceList = transformMerchantList(rawMerchantList)
      workspaceMerchantList.value = normalizedWorkspaceList.map((item) => ({ ...item }))
      merchantList.value = workspaceMerchantList.value.map((item) => ({ ...item }))
      pagination.current = 1
      totalMerchants.value = filterByAuditStatus(workspaceMerchantList.value).length
      isServerPaginated.value = false
      applyMerchantTrend(workspaceRes.data.merchantOnboardingTrend)
      systemLogs.value = []

      if (!applyInstitutionRanking(workspaceRes.data.institutionRanking)) {
        await fetchInstitutionRanking()
      } else {
        rankingLoading.value = false
      }
    } else {
      await fetchInstitutionRanking()
    }

    await loadMerchantList({ showToastOnError: false })
    await loadPaymentOverview(true)
  } catch (error) {
    console.error('获取管理员数据失败', error)

    if (handleAuthError(error)) {
      rankingLoading.value = false
      isMerchantLoading.value = false
      return
    }

    dataOverview.value = {
      dateRange: '今日',
      totalVip: '0',
      totalDevices: '0',
      monthNewVip: '0',
      monthNewVipPrev: '0',
      monthNewDevices: '0',
      monthNewDevicesPrev: '0',
      todayNewVip: '0',
      todayNewDevices: '0'
    }

    resetOnboardingOverview()
    resetMeituanOverview()
    resetMeituanWorkspace()
    institutionRanking.value = []
    rankingTotal.value = 0
    systemLogs.value = []
    resetMerchantTrend()
  } finally {
    closeLoadingSafely()
    isMerchantLoading.value = false
    rankingLoading.value = false
  }
}

onMounted(() => {
  window.addEventListener('resize', handleTrendChartResize)
  fetchAdminData()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleTrendChartResize)
  destroyTrendChart()
})
</script>

<style scoped>
.admin-container {
  background-color: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 20px;
  padding-top: 20px; /* 添加顶部内边距替代导航条空间 */
}

.content {
  padding: 0 12px;
}

/* 欢迎卡片 */
.welcome-card {
  margin-top: 12px;
  background: linear-gradient(135deg, #3a8ffe 0%, #28c76f 100%);
  border-radius: 8px;
  padding: 15px;
  color: #fff;
  box-shadow: 0 2px 12px rgba(58, 143, 254, 0.2);
}

.welcome-header {
  display: flex;
  align-items: center;
}

.avatar-box {
  margin-right: 15px;
}

.welcome-info {
  flex: 1;
}

.welcome-title {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
}

.admin-badge {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 12px;
  margin-left: 10px;
}

.welcome-subtitle {
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 3px;
}

.welcome-date {
  font-size: 12px;
  opacity: 0.8;
}

/* 数据卡片 */
.data-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.card-title {
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.card-tabs {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f2f3f5;
  border-radius: 999px;
  padding: 2px;
  flex-shrink: 0;
  margin-left: 12px;
}

.card-tab {
  min-width: 64px;
  padding: 4px 12px;
  font-size: 12px;
  color: #666;
  border-radius: 999px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
}

.card-tab.active {
  background: linear-gradient(135deg, #3a8ffe 0%, #28c76f 100%);
  color: #fff;
  box-shadow: 0 6px 12px rgba(58, 143, 254, 0.2);
}

.card-tab:not(.active):hover {
  color: #1989fa;
}

.card-date {
  font-size: 12px;
  color: #999;
  margin-left: auto;
  flex-shrink: 0;
}

.count-number {
  display: flex;
  flex-direction: column;
  font-size: 24px;
  font-weight: bold;
  color: #3a8ffe;
  margin-bottom: 5px;
  min-height: 40px;
  justify-content: center;
}

.count-kind-comparison {
  flex-direction: row;
  align-items: baseline;
  gap: 4px;
}

.count-today {
  font-size: 24px;
  font-weight: bold;
  color: #3a8ffe;
}

.count-yesterday {
  font-size: 14px;
  font-weight: normal;
  color: #999;
  margin-left: 2px;
}

.count-kind-single .count-value {
  font-size: 22px;
  font-weight: bold;
  color: #323233;
}

.count-kind-single .count-sub {
  font-size: 11px;
  color: #999;
  font-weight: 500;
  margin-top: 2px;
}

.count-label {
  font-size: 12px;
  color: #666;
}

/* 功能卡片 */
.function-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.text {
  font-size: 12px;
  margin-top: 4px;
  color: #646566;
}

/* 商户列表卡片 */
.merchant-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.merchant-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.merchant-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.merchant-count {
  font-size: 12px;
  color: #666;
}

.merchant-filter {
  min-width: 120px;
}

.merchant-summary {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.merchant-status-tabs {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.status-tab {
  min-width: 64px;
  padding: 6px 10px;
  border-radius: 16px;
  font-size: 12px;
  text-align: center;
  background: #f2f3f5;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-tab.active {
  background: linear-gradient(135deg, #3a8ffe 0%, #28c76f 100%);
  color: #fff;
  box-shadow: 0 4px 10px rgba(58, 143, 254, 0.2);
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
}

.merchant-list {
  margin-top: 10px;
}

.merchant-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
  font-size: 13px;
  color: #666;
}

.merchant-pagination .pager-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 16px;
  color: #409eff;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #fff;
}

.merchant-pagination .pager-button:active {
  background-color: rgba(64, 158, 255, 0.16);
}

.merchant-pagination .pager-button.disabled {
  color: #bbb;
  border-color: #e5e6eb;
  cursor: not-allowed;
  background-color: #f7f8fa;
}

.merchant-pagination .page-indicator {
  min-width: 96px;
  text-align: center;
}

.merchant-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.merchant-item--static {
  cursor: default;
}

.merchant-item--static + .merchant-item--static {
  border-top: 1px solid #f5f5f5;
}

.merchant-item:last-child {
  border-bottom: none;
}

.merchant-rank {
  width: 24px;
  height: 24px;
  line-height: 24px;
  border-radius: 50%;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #606266;
  background-color: #f2f3f5;
  margin-right: 12px;
}

.merchant-item--static .merchant-rank {
  background: linear-gradient(135deg, #3a8ffe 0%, #28c76f 100%);
  color: #fff;
}

.merchant-main {
  flex: 1;
}

.merchant-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.merchant-code {
  font-size: 12px;
  color: #969799;
}

.merchant-name {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
}

.merchant-line {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #646566;
  margin-top: 4px;
}

.merchant-line.dual {
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.merchant-line.dual .pair {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1 1 120px;
}

.merchant-line .label {
  color: #969799;
  min-width: 44px;
}

.merchant-line .institution-name {
  color: #2d5016; /* 墨绿色 */
  font-weight: 500;
}

.merchant-line .merchant-amount {
  font-weight: 600;
  color: #323233;
}

.merchant-line.metrics {
  gap: 6px;
  flex-wrap: wrap;
}

.merchant-line .metrics-divider {
  color: #dcdfe6;
}

.merchant-line .label-inline {
  min-width: auto;
}

.merchant-line .merchant-city {
  font-weight: 500;
  color: #323233;
}

.merchant-meta .salesman-name {
  color: #ff8c00; /* 橙色 */
  font-weight: 500;
}

.merchant-meta {
  margin-top: 6px;
  font-size: 12px;
  color: #969799;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

/* 机构排名卡片 */
.ranking-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.ranking-header {
  align-items: center;
}

.ranking-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ranking-tabs {
  display: inline-flex;
  align-items: center;
  background: #f2f3f5;
  border-radius: 999px;
  padding: 2px;
}

.ranking-tab {
  min-width: 64px;
  padding: 4px 12px;
  font-size: 12px;
  color: #666;
  border-radius: 999px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ranking-tab.active {
  background: linear-gradient(135deg, #3a8ffe 0%, #28c76f 100%);
  color: #fff;
  box-shadow: 0 4px 10px rgba(58, 143, 254, 0.2);
}

.trend-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.trend-mode-tabs,
.trend-range-tabs {
  display: inline-flex;
  align-items: center;
  background: #f2f3f5;
  border-radius: 999px;
  padding: 2px;
}

.trend-mode-tab,
.trend-range-tab {
  min-width: 64px;
  padding: 4px 12px;
  font-size: 12px;
  color: #666;
  border-radius: 999px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.trend-mode-tab.active,
.trend-range-tab.active {
  background: linear-gradient(135deg, #3a8ffe 0%, #28c76f 100%);
  color: #fff;
  box-shadow: 0 4px 10px rgba(58, 143, 254, 0.2);
}

.trend-month-select select {
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  color: #333;
  background-color: #fff;
}

.ranking-date {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: #f7f8fa;
  border-radius: 16px;
  font-size: 12px;
  color: #606266;
  cursor: pointer;
}

.ranking-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
  margin-top: 12px;
}

.ranking-summary-date {
  color: #606266;
}

.ranking-content {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px dashed #f0f1f5;
}

.ranking-item:last-child {
  border-bottom: none;
}

.ranking-no {
  width: 26px;
  height: 26px;
  line-height: 26px;
  border-radius: 50%;
  background-color: #f2f3f5;
  color: #606266;
  text-align: center;
  font-weight: 600;
  font-size: 13px;
}

.ranking-no.top {
  background: linear-gradient(135deg, #3a8ffe 0%, #28c76f 100%);
  color: #fff;
}

.ranking-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ranking-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.ranking-info .ranking-sub {
  font-size: 12px;
  color: #999;
}

.ranking-count {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.ranking-bar {
  width: 120px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ranking-bar-track {
  flex: 1;
  height: 8px;
  background-color: #f2f3f5;
  border-radius: 999px;
  overflow: hidden;
}

.ranking-bar-inner {
  height: 100%;
  background: linear-gradient(135deg, #3a8ffe 0%, #28c76f 100%);
  border-radius: 999px;
}

.ranking-percentage {
  font-size: 12px;
  color: #606266;
  min-width: 40px;
  text-align: right;
}

.ranking-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 0;
  color: #909399;
  font-size: 13px;
}

.meituan-institution-list {
  margin-top: 16px;
  border-top: 1px solid #f0f1f5;
}

.meituan-institution-list .institution-head,
.meituan-institution-list .institution-row {
  display: grid;
  grid-template-columns: 2.2fr 1fr 1fr 1fr 1fr;
  gap: 12px;
  align-items: center;
  padding: 12px 0;
}

.meituan-institution-list .institution-head {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
}

.meituan-institution-list .institution-row {
  font-size: 13px;
  color: #303133;
  border-bottom: 1px solid #f5f5f5;
}

.meituan-institution-list .institution-row:last-child {
  border-bottom: none;
}

.meituan-institution-list .institution-name {
  font-weight: 500;
}

.meituan-institution-list .institution-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #999;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 趋势卡片 */
.trend-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.more {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
}

.trend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.trend-header-tools {
  display: flex;
  align-items: center;
  gap: 12px;
}

.trend-refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #1989fa;
  background-color: rgba(25, 137, 250, 0.12);
  padding: 4px 12px;
  border-radius: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, opacity 0.2s ease;
}

.trend-refresh:hover {
  background-color: rgba(25, 137, 250, 0.2);
}

.trend-refresh-icon {
  transition: transform 0.2s ease;
}

.trend-refresh.loading {
  cursor: default;
  opacity: 0.6;
  pointer-events: none;
}

.trend-refresh.loading .trend-refresh-icon {
  animation: trend-refresh-spin 0.8s linear infinite;
}

@keyframes trend-refresh-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.trend-tabs {
  display: flex;
  gap: 8px;
}

.trend-tab {
  font-size: 12px;
  color: #666;
  background-color: #f2f3f5;
  padding: 4px 12px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.trend-tab.active {
  color: #fff;
  background: linear-gradient(135deg, #3a8ffe 0%, #28c76f 100%);
  box-shadow: 0 4px 12px rgba(58, 143, 254, 0.25);
}

.trend-meta {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.trend-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 72px;
}

.trend-stat .label {
  font-size: 12px;
  color: #999;
}

.trend-stat .value {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
}

.trend-stat .value.approved {
  color: #07c160;
}

.trend-stat .sub {
  font-size: 12px;
  color: #999;
}

.trend-stat .sub.success {
  color: #07c160;
}

.trend-summary-label {
  font-size: 12px;
  color: #666;
}

.trend-updated {
  margin-left: auto;
  font-size: 12px;
  color: #999;
}

.trend-chart-wrapper {
  margin-top: 16px;
  height: 220px;
}

.trend-chart {
  width: 100%;
  height: 100%;
}

.trend-empty {
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #909399;
  font-size: 13px;
}

/* 日志卡片 */
.log-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.log-list {
  margin-top: 10px;
}

.log-item {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.log-item:last-child {
  border-bottom: none;
}

.log-tag {
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 10px;
  height: 20px;
}

.log-info {
  background-color: #e6f7ff;
  color: #1989fa;
}

.log-warning {
  background-color: #fff7e6;
  color: #ff9500;
}

.log-error {
  background-color: #ffebee;
  color: #ee0a24;
}

.log-success {
  background-color: #e8f5e9;
  color: #07c160;
}

.log-content {
  flex: 1;
}

.log-message {
  font-size: 14px;
  margin-bottom: 4px;
}

.log-info {
  font-size: 12px;
  color: #999;
}

.log-time {
  margin-left: 10px;
}

.empty-list {
  height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #999;
  font-size: 14px;
}

/* 日期详情弹窗样式 */
.date-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  width: 85%;
  max-width: 400px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: modalFadeIn 0.3s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.date-detail-popup {
  padding: 0;
  overflow: hidden;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.popup-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.popup-content {
  padding: 20px;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.data-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.data-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.data-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}

.data-value {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.data-value.primary {
  color: #3b82f6;
}

.data-value.success {
  color: #10b981;
}

.data-value.warning {
  color: #f59e0b;
}

.popup-footer {
  padding: 16px 20px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
}

.confirm-btn {
  padding: 8px 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.confirm-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
</style> 
