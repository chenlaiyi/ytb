<template>
  <div class="institution-workspace">
    <!-- 导航栏 -->
    <van-nav-bar
      title="支付机构工作台"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />

    <!-- 下拉刷新 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <div class="workspace-content">
        <!-- 机构信息卡片 -->
        <div class="institution-card">
          <div class="institution-header">
            <div class="institution-info">
              <div class="institution-name">{{ institutionInfo.name }}</div>
              <div class="institution-status" :class="institutionInfo.status">
                <van-tag :type="institutionInfo.status === 'active' ? 'success' : 'warning'">
                  {{ institutionInfo.status === 'active' ? '正常运营' : '待审核' }}
                </van-tag>
              </div>
            </div>
            <div class="institution-avatar">
              <van-icon name="shop-o" size="32" />
            </div>
          </div>
        </div>

        <!-- 数据统计卡片 -->
        <div class="stats-section">
          <div class="stats-header">
            <h3>交易统计</h3>
            <div class="stats-period">
              <van-dropdown-menu>
                <van-dropdown-item v-model="selectedPeriod" :options="periodOptions" />
              </van-dropdown-menu>
            </div>
          </div>

          <div class="stats-cards">
            <div class="stat-card">
              <div class="stat-value">¥{{ formatAmount(currentStats.amount) }}</div>
              <div class="stat-label">交易金额</div>
              <div class="stat-change positive">
                <van-icon name="arrow-up" />
                +{{ currentStats.amountGrowth }}%
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ currentStats.count }}</div>
              <div class="stat-label">交易笔数</div>
              <div class="stat-change positive">
                <van-icon name="arrow-up" />
                +{{ currentStats.countGrowth }}%
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ currentStats.successRate }}</div>
              <div class="stat-label">成功率</div>
              <div class="stat-change">
                <van-icon name="minus" />
                {{ currentStats.successRateChange }}%
              </div>
            </div>
          </div>
        </div>

        <!-- 商户统计 -->
        <div class="merchant-section">
          <div class="section-header">
            <h3>商户概况</h3>
            <div class="view-all" @click="$router.push('/institution/merchants')">
              查看全部 <van-icon name="arrow" />
            </div>
          </div>
          
          <div class="merchant-stats">
            <div class="merchant-stat-item">
              <div class="stat-number">{{ merchantCount.total }}</div>
              <div class="stat-text">总商户数</div>
            </div>
            <div class="merchant-stat-item">
              <div class="stat-number active">{{ merchantCount.active }}</div>
              <div class="stat-text">活跃商户</div>
            </div>
            <div class="merchant-stat-item">
              <div class="stat-number pending">{{ merchantCount.pending }}</div>
              <div class="stat-text">待审核</div>
            </div>
            <div class="merchant-stat-item">
              <div class="stat-number inactive">{{ merchantCount.inactive }}</div>
              <div class="stat-text">已停用</div>
            </div>
          </div>
        </div>

        <!-- 支付方式统计 -->
        <div class="payment-method-section">
          <div class="section-header">
            <h3>支付方式分布</h3>
          </div>
          
          <div class="payment-methods">
            <div class="payment-method-item" v-for="(method, key) in paymentMethodStats" :key="key">
              <div class="method-icon" :class="key">
                <van-icon :name="getPaymentIcon(key)" size="24" />
              </div>
              <div class="method-info">
                <div class="method-name">{{ getPaymentName(key) }}</div>
                <div class="method-stats">
                  <span class="amount">¥{{ formatAmount(method.amount) }}</span>
                  <span class="percentage">{{ method.percentage }}%</span>
                </div>
              </div>
              <div class="method-progress">
                <van-progress :percentage="method.percentage" :color="getPaymentColor(key)" />
              </div>
            </div>
          </div>
        </div>

        <!-- 最近交易 -->
        <div class="recent-transactions-section">
          <div class="section-header">
            <h3>最近交易</h3>
            <div class="view-all" @click="$router.push('/institution/orders')">
              查看全部 <van-icon name="arrow" />
            </div>
          </div>
          
          <div class="transaction-list">
            <div 
              class="transaction-item" 
              v-for="transaction in recentTransactions" 
              :key="transaction.id"
              @click="viewTransactionDetail(transaction)"
            >
              <div class="transaction-icon" :class="transaction.status">
                <van-icon :name="transaction.status === 'success' ? 'passed' : 'close'" />
              </div>
              <div class="transaction-info">
                <div class="transaction-merchant">{{ transaction.merchant_name }}</div>
                <div class="transaction-time">{{ formatTime(transaction.created_at) }}</div>
              </div>
              <div class="transaction-amount" :class="transaction.status">
                <div class="amount">¥{{ formatAmount(transaction.amount) }}</div>
                <div class="method">{{ getPaymentName(transaction.payment_method) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 快捷功能 -->
        <div class="quick-actions-section">
          <div class="section-header">
            <h3>快捷功能</h3>
          </div>
          
          <div class="quick-actions">
            <div class="action-item" @click="$router.push('/institution/merchants')">
              <div class="action-icon merchants">
                <van-icon name="shop-o" size="24" />
              </div>
              <div class="action-text">商户管理</div>
            </div>
            <div class="action-item" @click="$router.push('/institution/orders')">
              <div class="action-icon orders">
                <van-icon name="orders-o" size="24" />
              </div>
              <div class="action-text">交易查询</div>
            </div>
            <div class="action-item" @click="$router.push('/institution/commissions')">
              <div class="action-icon commissions">
                <van-icon name="gold-coin-o" size="24" />
              </div>
              <div class="action-text">分润明细</div>
            </div>
            <div class="action-item" @click="$router.push('/institution/statistics')">
              <div class="action-icon statistics">
                <van-icon name="bar-chart-o" size="24" />
              </div>
              <div class="action-text">数据统计</div>
            </div>
          </div>
        </div>
      </div>
    </van-pull-refresh>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { Toast } from 'vant'
import { getInstitutionWorkspace } from '@/api/institution'

export default {
  name: 'InstitutionWorkspace',
  setup() {
    const refreshing = ref(false)
    const loading = ref(false)
    
    // 选择的时间周期
    const selectedPeriod = ref('today')
    const periodOptions = [
      { text: '今日', value: 'today' },
      { text: '本月', value: 'month' },
      { text: '总计', value: 'total' }
    ]

    // 机构信息
    const institutionInfo = reactive({
      id: '',
      name: '支付机构',
      status: 'active'
    })

    // 统计数据
    const stats = reactive({
      today: { amount: 0, count: 0, successRate: '0%', amountGrowth: 0, countGrowth: 0, successRateChange: 0 },
      month: { amount: 0, count: 0, successRate: '0%', amountGrowth: 0, countGrowth: 0, successRateChange: 0 },
      total: { amount: 0, count: 0, successRate: '0%', amountGrowth: 0, countGrowth: 0, successRateChange: 0 }
    })

    // 当前显示的统计数据
    const currentStats = computed(() => stats[selectedPeriod.value])

    // 商户数量统计
    const merchantCount = reactive({
      total: 0,
      active: 0,
      pending: 0,
      inactive: 0
    })

    // 支付方式统计
    const paymentMethodStats = reactive({
      alipay: { count: 0, amount: 0, percentage: 0 },
      wechat: { count: 0, amount: 0, percentage: 0 },
      unionpay: { count: 0, amount: 0, percentage: 0 }
    })

    // 最近交易记录
    const recentTransactions = ref([])

    // 获取支付方式图标
    const getPaymentIcon = (method) => {
      const icons = {
        alipay: 'alipay',
        wechat: 'wechat-pay',
        unionpay: 'credit-pay'
      }
      return icons[method] || 'credit-pay'
    }

    // 获取支付方式名称
    const getPaymentName = (method) => {
      const names = {
        alipay: '支付宝',
        wechat: '微信支付',
        unionpay: '银联支付'
      }
      return names[method] || '其他'
    }

    // 获取支付方式颜色
    const getPaymentColor = (method) => {
      const colors = {
        alipay: '#1677ff',
        wechat: '#07c160',
        unionpay: '#ee0a24'
      }
      return colors[method] || '#969799'
    }

    // 格式化金额
    const formatAmount = (amount) => {
      if (amount >= 10000) {
        return (amount / 10000).toFixed(1) + '万'
      }
      return amount.toLocaleString()
    }

    // 格式化时间
    const formatTime = (time) => {
      const date = new Date(time)
      const now = new Date()
      const diff = now - date
      
      if (diff < 60000) { // 1分钟内
        return '刚刚'
      } else if (diff < 3600000) { // 1小时内
        return Math.floor(diff / 60000) + '分钟前'
      } else if (diff < 86400000) { // 24小时内
        return Math.floor(diff / 3600000) + '小时前'
      } else {
        return date.toLocaleDateString()
      }
    }

    // 查看交易详情
    const viewTransactionDetail = (transaction) => {
      Toast(`查看交易详情: ${transaction.id}`)
      // 这里可以跳转到交易详情页面
    }

    // 加载工作台数据
    const loadWorkspaceData = async () => {
      try {
        loading.value = true
        const response = await getInstitutionWorkspace()
        
        if (response.code === 0) {
          const data = response.data
          
          // 更新机构信息
          Object.assign(institutionInfo, data.institution_info)
          
          // 更新统计数据
          Object.assign(stats, data.stats)
          
          // 更新商户数量
          Object.assign(merchantCount, data.merchant_count)
          
          // 更新支付方式统计
          Object.assign(paymentMethodStats, data.payment_method_stats)
          
          // 更新最近交易
          recentTransactions.value = data.recent_transactions || []
        } else {
          Toast.fail(response.message || '加载数据失败')
        }
      } catch (error) {
        console.error('加载工作台数据失败:', error)
        Toast.fail('加载数据失败')
      } finally {
        loading.value = false
        refreshing.value = false
      }
    }

    // 下拉刷新
    const onRefresh = () => {
      loadWorkspaceData()
    }

    // 页面加载时获取数据
    onMounted(() => {
      loadWorkspaceData()
    })

    return {
      refreshing,
      loading,
      selectedPeriod,
      periodOptions,
      institutionInfo,
      currentStats,
      merchantCount,
      paymentMethodStats,
      recentTransactions,
      getPaymentIcon,
      getPaymentName,
      getPaymentColor,
      formatAmount,
      formatTime,
      viewTransactionDetail,
      onRefresh
    }
  }
}
</script>

<style lang="scss" scoped>
.institution-workspace {
  background-color: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 20px;
}

.workspace-content {
  padding: 16px;
}

// 机构信息卡片
.institution-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  color: white;

  .institution-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .institution-info {
    flex: 1;
  }

  .institution-name {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 8px;
  }

  .institution-status {
    .van-tag {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
  }

  .institution-avatar {
    width: 60px;
    height: 60px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

// 统计卡片
.stats-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;

  .stats-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: bold;
    }

    .stats-period {
      .van-dropdown-menu {
        background: transparent;
      }
    }
  }

  .stats-cards {
    display: flex;
    gap: 12px;
  }

  .stat-card {
    flex: 1;
    text-align: center;
    padding: 16px 8px;
    background: #f7f8fa;
    border-radius: 8px;

    .stat-value {
      font-size: 20px;
      font-weight: bold;
      color: #323233;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 12px;
      color: #969799;
      margin-bottom: 8px;
    }

    .stat-change {
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2px;

      &.positive {
        color: #07c160;
      }

      &.negative {
        color: #ee0a24;
      }
    }
  }
}

// 商户统计
.merchant-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: bold;
    }

    .view-all {
      font-size: 14px;
      color: #1989fa;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .merchant-stats {
    display: flex;
    justify-content: space-between;
  }

  .merchant-stat-item {
    text-align: center;

    .stat-number {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 4px;

      &.active {
        color: #07c160;
      }

      &.pending {
        color: #ff976a;
      }

      &.inactive {
        color: #969799;
      }
    }

    .stat-text {
      font-size: 12px;
      color: #969799;
    }
  }
}

// 支付方式统计
.payment-method-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;

  .section-header {
    margin-bottom: 20px;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: bold;
    }
  }

  .payment-methods {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .payment-method-item {
    display: flex;
    align-items: center;
    gap: 12px;

    .method-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;

      &.alipay {
        background: #e6f7ff;
        color: #1677ff;
      }

      &.wechat {
        background: #f0f9ff;
        color: #07c160;
      }

      &.unionpay {
        background: #fff2f0;
        color: #ee0a24;
      }
    }

    .method-info {
      flex: 1;

      .method-name {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 4px;
      }

      .method-stats {
        display: flex;
        gap: 12px;

        .amount {
          font-size: 14px;
          color: #323233;
        }

        .percentage {
          font-size: 14px;
          color: #969799;
        }
      }
    }

    .method-progress {
      width: 60px;
    }
  }
}

// 最近交易
.recent-transactions-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: bold;
    }

    .view-all {
      font-size: 14px;
      color: #1989fa;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .transaction-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .transaction-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f7f8fa;
    border-radius: 8px;

    .transaction-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      &.success {
        background: #f0f9ff;
        color: #07c160;
      }

      &.failed {
        background: #fff2f0;
        color: #ee0a24;
      }
    }

    .transaction-info {
      flex: 1;

      .transaction-merchant {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 4px;
      }

      .transaction-time {
        font-size: 12px;
        color: #969799;
      }
    }

    .transaction-amount {
      text-align: right;

      .amount {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 4px;

        &.success {
          color: #07c160;
        }

        &.failed {
          color: #ee0a24;
        }
      }

      .method {
        font-size: 12px;
        color: #969799;
      }
    }
  }
}

// 快捷功能
.quick-actions-section {
  background: white;
  border-radius: 12px;
  padding: 20px;

  .section-header {
    margin-bottom: 20px;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: bold;
    }
  }

  .quick-actions {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 8px;
    border-radius: 8px;
    background: #f7f8fa;

    .action-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      &.merchants {
        background: #e6f7ff;
        color: #1677ff;
      }

      &.orders {
        background: #fff7e6;
        color: #ff976a;
      }

      &.commissions {
        background: #f6ffed;
        color: #52c41a;
      }

      &.statistics {
        background: #f9f0ff;
        color: #722ed1;
      }
    }

    .action-text {
      font-size: 12px;
      color: #323233;
      text-align: center;
    }
  }
}
</style>