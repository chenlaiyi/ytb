<template>
  <div class="branch-wallet-container">
    <van-nav-bar
      title="我的钱包"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />
    
    <div class="wallet-content">
    <!-- 钱包余额卡片 -->
      <div class="balance-card">
        <div class="balance-header">
          <div class="balance-info">
            <div class="balance-label">账户余额（元）</div>
            <div class="balance-amount">{{ walletInfo.balance || '0.00' }}</div>
      </div>
      <div class="balance-actions">
            <van-button size="small" type="primary" @click="showRecharge">充值</van-button>
            <van-button size="small" plain @click="showWithdraw">提现</van-button>
      </div>
    </div>

        <div class="balance-details">
          <div class="detail-item">
            <span class="detail-label">可用余额</span>
            <span class="detail-value">¥{{ walletInfo.available_balance || '0.00' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">冻结金额</span>
            <span class="detail-value">¥{{ walletInfo.frozen_amount || '0.00' }}</span>
          </div>
        </div>
      </div>

      <!-- 资产统计 -->
      <div class="assets-stats">
        <div class="stats-item" @click="$router.push('/branch/points')">
          <div class="stats-icon points">
            <van-icon name="gold-coin-o" size="20" />
          </div>
          <div class="stats-content">
            <div class="stats-value">{{ walletInfo.points || '0' }}</div>
            <div class="stats-label">积分</div>
          </div>
        </div>
        
        <div class="stats-item" @click="$router.push('/branch/benefits')">
          <div class="stats-icon benefits">
            <van-icon name="gift-o" size="20" />
          </div>
          <div class="stats-content">
            <div class="stats-value">{{ walletInfo.benefits || '0' }}</div>
            <div class="stats-label">专属福利</div>
          </div>
        </div>
        
        <div class="stats-item" @click="showCoupons">
          <div class="stats-icon coupons">
            <van-icon name="coupon-o" size="20" />
          </div>
          <div class="stats-content">
            <div class="stats-value">{{ walletInfo.coupons || '0' }}</div>
            <div class="stats-label">优惠券</div>
          </div>
        </div>
      </div>

      <!-- 快捷功能 -->
      <div class="quick-actions">
        <div class="action-item" @click="showTransfer">
          <div class="action-icon transfer">
            <van-icon name="exchange" size="24" />
          </div>
          <div class="action-text">转账</div>
        </div>
        
        <div class="action-item" @click="showBill">
          <div class="action-icon bill">
            <van-icon name="orders-o" size="24" />
          </div>
          <div class="action-text">账单</div>
      </div>
        
        <div class="action-item" @click="showSettings">
          <div class="action-icon settings">
            <van-icon name="setting-o" size="24" />
          </div>
          <div class="action-text">设置</div>
        </div>
        
        <div class="action-item" @click="showHelp">
          <div class="action-icon help">
            <van-icon name="question-o" size="24" />
          </div>
          <div class="action-text">帮助</div>
      </div>
    </div>

    <!-- 交易记录 -->
    <div class="transaction-section">
      <div class="section-header">
          <span class="section-title">交易记录</span>
          <div class="filter-tabs">
            <span 
              v-for="tab in filterTabs" 
              :key="tab.value"
              :class="['filter-tab', { active: currentFilter === tab.value }]"
              @click="currentFilter = tab.value"
            >
              {{ tab.label }}
            </span>
          </div>
      </div>
      
        <div class="transaction-list" v-if="filteredTransactions.length > 0">
        <div 
            v-for="transaction in filteredTransactions" 
            :key="transaction.id"
          class="transaction-item"
            @click="showTransactionDetail(transaction)"
        >
            <div class="transaction-icon" :class="transaction.type">
              <van-icon :name="getTransactionIcon(transaction.type)" size="20" />
            </div>
            <div class="transaction-content">
              <div class="transaction-title">{{ transaction.title }}</div>
              <div class="transaction-desc">{{ transaction.description }}</div>
              <div class="transaction-time">{{ formatTime(transaction.created_at) }}</div>
            </div>
            <div class="transaction-amount" :class="transaction.type">
              {{ transaction.type === 'income' ? '+' : '-' }}¥{{ transaction.amount }}
            </div>
          </div>
        </div>
        
        <div v-else class="empty-state">
          <van-empty description="暂无交易记录" />
        </div>
      </div>
    </div>

    <!-- 充值弹窗 -->
    <van-popup v-model:show="showRechargePopup" position="bottom" round>
      <div class="popup-content">
        <div class="popup-header">
          <h3>账户充值</h3>
          <van-icon name="cross" @click="showRechargePopup = false" />
        </div>
        <div class="recharge-form">
          <van-field
            v-model="rechargeAmount"
            type="number"
            label="充值金额"
            placeholder="请输入充值金额"
            :rules="[{ required: true, message: '请输入充值金额' }]"
          />
          <div class="quick-amounts">
            <span 
              v-for="amount in quickAmounts" 
              :key="amount"
              class="quick-amount"
              @click="rechargeAmount = amount"
            >
              {{ amount }}
            </span>
          </div>
          <van-button type="primary" block @click="handleRecharge" :loading="rechargeLoading">
            确认充值
          </van-button>
        </div>
      </div>
    </van-popup>

    <!-- 提现弹窗 -->
    <van-popup v-model:show="showWithdrawPopup" position="bottom" round>
      <div class="popup-content">
        <div class="popup-header">
          <h3>申请提现</h3>
          <van-icon name="cross" @click="showWithdrawPopup = false" />
        </div>
        <div class="withdraw-form">
          <van-field
            v-model="withdrawAmount"
            type="number"
            label="提现金额"
            placeholder="请输入提现金额"
            :rules="[{ required: true, message: '请输入提现金额' }]"
          />
          <div class="withdraw-info">
            <p>可提现余额：¥{{ walletInfo.available_balance || '0.00' }}</p>
            <p>提现手续费：¥0.00</p>
            <p>到账时间：1-3个工作日</p>
          </div>
          <van-button type="primary" block @click="handleWithdraw" :loading="withdrawLoading">
            申请提现
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getBranchWalletInfo, getBranchTransactions, recharge, withdraw } from '@/api/branchUser'
import { showToast } from 'vant'

    const router = useRouter()
    
// 钱包信息
    const walletInfo = ref({
  balance: '0.00',
  available_balance: '0.00',
  frozen_amount: '0.00',
  points: '0',
  benefits: '0',
  coupons: '0'
})

// 交易记录
const transactions = ref([])
const currentFilter = ref('all')

// 弹窗状态
const showRechargePopup = ref(false)
const showWithdrawPopup = ref(false)

// 表单数据
const rechargeAmount = ref('')
const withdrawAmount = ref('')
const rechargeLoading = ref(false)
const withdrawLoading = ref(false)

// 快捷金额
const quickAmounts = [100, 200, 500, 1000]

// 筛选标签
const filterTabs = [
  { label: '全部', value: 'all' },
  { label: '收入', value: 'income' },
  { label: '支出', value: 'expense' },
  { label: '充值', value: 'recharge' },
  { label: '提现', value: 'withdraw' }
]

// 筛选后的交易记录
const filteredTransactions = computed(() => {
  if (currentFilter.value === 'all') {
    return transactions.value
  }
  return transactions.value.filter(item => item.type === currentFilter.value)
})

// 获取交易图标
const getTransactionIcon = (type) => {
  const iconMap = {
    income: 'plus',
    expense: 'minus',
    recharge: 'gold-coin-o',
    withdraw: 'credit-pay',
    transfer: 'exchange'
  }
  return iconMap[type] || 'orders-o'
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) { // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) { // 1小时内
    return Math.floor(diff / 60000) + '分钟前'
  } else if (diff < 86400000) { // 1天内
    return Math.floor(diff / 3600000) + '小时前'
  } else {
    return date.toLocaleDateString()
  }
}

// 显示充值弹窗
const showRecharge = () => {
  rechargeAmount.value = ''
  showRechargePopup.value = true
}

// 显示提现弹窗
const showWithdraw = () => {
  withdrawAmount.value = ''
  showWithdrawPopup.value = true
}

// 处理充值
const handleRecharge = async () => {
  if (!rechargeAmount.value) {
    showToast('请输入充值金额')
    return
  }
  
  if (parseFloat(rechargeAmount.value) <= 0) {
    showToast('充值金额必须大于0')
    return
  }
  
  try {
    rechargeLoading.value = true
    const res = await recharge({
      amount: rechargeAmount.value
    })
    
    if (res.code === 0) {
      showToast.success('充值成功')
      showRechargePopup.value = false
      await fetchWalletInfo()
      await fetchTransactions()
    } else {
      showToast({ type: 'fail', message: res.message || '充值失败' })
    }
  } catch (error) {
    console.error('充值失败', error)
    showToast({ type: 'fail', message: '充值失败，请稍后重试' })
  } finally {
    rechargeLoading.value = false
  }
}

// 处理提现
const handleWithdraw = async () => {
  if (!withdrawAmount.value) {
    showToast('请输入提现金额')
    return
  }
  
  const amount = parseFloat(withdrawAmount.value)
  const availableBalance = parseFloat(walletInfo.value.available_balance)
  
  if (amount <= 0) {
    showToast('提现金额必须大于0')
    return
  }
  
  if (amount > availableBalance) {
    showToast('提现金额不能超过可用余额')
    return
  }
  
  try {
    withdrawLoading.value = true
    const res = await withdraw({
      amount: withdrawAmount.value
    })
    
    if (res.code === 0) {
      showToast.success('提现申请已提交')
      showWithdrawPopup.value = false
      await fetchWalletInfo()
      await fetchTransactions()
    } else {
      showToast({ type: 'fail', message: res.message || '提现申请失败' })
    }
  } catch (error) {
    console.error('提现申请失败', error)
    showToast({ type: 'fail', message: '提现申请失败，请稍后重试' })
  } finally {
    withdrawLoading.value = false
  }
}

// 显示交易详情
const showTransactionDetail = (transaction) => {
  // 这里可以跳转到交易详情页面或显示详情弹窗
  showToast('交易详情功能开发中...')
}

// 其他功能
const showTransfer = () => showToast('转账功能开发中...')
const showBill = () => showToast('账单功能开发中...')
const showSettings = () => router.push('/branch/settings')
const showHelp = () => router.push('/branch/help')
const showCoupons = () => showToast('优惠券功能开发中...')

// 获取钱包信息
const fetchWalletInfo = async () => {
  try {
    const res = await getBranchWalletInfo()
    if (res.code === 0 && res.data) {
      walletInfo.value = {
        balance: res.data.balance || '0.00',
        available_balance: res.data.available_balance || '0.00',
        frozen_amount: res.data.frozen_amount || '0.00',
        points: res.data.points || '0',
        benefits: res.data.benefits || '0',
        coupons: res.data.coupons || '0'
      }
    }
  } catch (error) {
    console.error('获取钱包信息失败', error)
  }
}

// 获取交易记录
const fetchTransactions = async () => {
  try {
    const res = await getBranchTransactions()
    if (res.code === 0 && res.data) {
      transactions.value = res.data.map(item => ({
        id: item.id,
        title: item.title || '交易',
        description: item.description || '',
        amount: item.amount || '0.00',
        type: item.type || 'expense',
        created_at: item.created_at
      }))
    }
  } catch (error) {
    console.error('获取交易记录失败', error)
    // 使用模拟数据
    transactions.value = [
      {
        id: 1,
        title: '账户充值',
        description: '支付宝充值',
        amount: '100.00',
        type: 'recharge',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        title: '购买产品',
        description: '净水器滤芯',
        amount: '58.00',
        type: 'expense',
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 3,
        title: '分红收益',
        description: 'VIP分红',
        amount: '25.50',
        type: 'income',
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  }
    }

    onMounted(() => {
  fetchWalletInfo()
  fetchTransactions()
})
</script>

<style scoped>
.branch-wallet-container {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 20px;
}

.wallet-content {
  padding: 16px;
}

/* 余额卡片 */
.balance-card {
  background: linear-gradient(135deg, #1989fa, #0088ff);
  border-radius: 12px;
  padding: 20px;
  color: #fff;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(25, 137, 250, 0.3);
}

.balance-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.balance-label {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 8px;
}

.balance-amount {
  font-size: 32px;
  font-weight: 600;
  line-height: 1;
}

.balance-actions {
  display: flex;
  gap: 8px;
}

.balance-details {
  display: flex;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.detail-label {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 16px;
  font-weight: 500;
}

/* 资产统计 */
.assets-stats {
  display: flex;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stats-item {
  flex: 1;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s;
}

.stats-item:hover {
  background-color: #f7f8fa;
}

.stats-item:not(:last-child) {
  border-right: 1px solid #f0f0f0;
}

.stats-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: #fff;
}

.stats-icon.points { background: linear-gradient(135deg, #ffd700, #ffed4e); }
.stats-icon.benefits { background: linear-gradient(135deg, #ff6b6b, #ffa8a8); }
.stats-icon.coupons { background: linear-gradient(135deg, #4ecdc4, #7fdbda); }

.stats-content {
  flex: 1;
}

.stats-value {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 2px;
}

.stats-label {
  font-size: 12px;
  color: #969799;
}

/* 快捷功能 */
.quick-actions {
  display: flex;
  justify-content: space-between;
  background: #fff;
  border-radius: 12px;
  padding: 20px 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s;
  min-width: 60px;
}

.action-item:hover {
  background-color: #f7f8fa;
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  color: #fff;
}

.action-icon.transfer { background: linear-gradient(135deg, #667eea, #764ba2); }
.action-icon.bill { background: linear-gradient(135deg, #f093fb, #f5576c); }
.action-icon.settings { background: linear-gradient(135deg, #4facfe, #00f2fe); }
.action-icon.help { background: linear-gradient(135deg, #43e97b, #38f9d7); }

.action-text {
  font-size: 12px;
  color: #323233;
  text-align: center;
}

/* 交易记录 */
.transaction-section {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.filter-tabs {
  display: flex;
  gap: 16px;
}

.filter-tab {
  font-size: 12px;
  color: #969799;
  cursor: pointer;
  padding: 4px 0;
  transition: all 0.3s;
}

.filter-tab.active {
  color: #1989fa;
  font-weight: 500;
  border-bottom: 2px solid #1989fa;
}

.transaction-list {
  max-height: 400px;
  overflow-y: auto;
}

.transaction-item {
  display: flex;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  border-bottom: 1px solid #f7f8fa;
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-item:hover {
  background-color: #f7f8fa;
}

.transaction-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: #fff;
}

.transaction-icon.income { background-color: #07c160; }
.transaction-icon.expense { background-color: #ff4d4f; }
.transaction-icon.recharge { background-color: #1989fa; }
.transaction-icon.withdraw { background-color: #ff9500; }
.transaction-icon.transfer { background-color: #722ed1; }

.transaction-content {
  flex: 1;
}

.transaction-title {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 2px;
}

.transaction-desc {
  font-size: 12px;
  color: #969799;
  margin-bottom: 2px;
}

.transaction-time {
  font-size: 11px;
  color: #c8c9cc;
}

.transaction-amount {
  font-size: 16px;
  font-weight: 600;
}

.transaction-amount.income {
  color: #07c160;
}

.transaction-amount.expense,
.transaction-amount.withdraw {
  color: #ff4d4f;
}

.transaction-amount.recharge {
  color: #1989fa;
}

.empty-state {
  padding: 40px 16px;
  text-align: center;
}

/* 弹窗样式 */
.popup-content {
  padding: 20px;
  min-height: 300px;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.popup-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin: 0;
}

.recharge-form,
.withdraw-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.quick-amounts {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.quick-amount {
  padding: 8px 16px;
  background-color: #f7f8fa;
  border-radius: 20px;
  font-size: 14px;
  color: #323233;
  cursor: pointer;
  transition: all 0.3s;
}

.quick-amount:hover {
  background-color: #1989fa;
  color: #fff;
}

.withdraw-info {
  background-color: #f7f8fa;
  padding: 12px;
  border-radius: 8px;
  font-size: 12px;
  color: #646566;
  line-height: 1.5;
}

.withdraw-info p {
  margin: 0;
  margin-bottom: 4px;
}

.withdraw-info p:last-child {
  margin-bottom: 0;
}

/* 响应式设计 */
@media (max-width: 375px) {
  .wallet-content {
    padding: 12px;
  }
  
  .balance-card {
    padding: 16px;
  }
  
  .balance-amount {
    font-size: 28px;
  }
  
  .assets-stats {
    padding: 12px;
  }
  
  .quick-actions {
    padding: 16px 12px;
  }
}
</style> 