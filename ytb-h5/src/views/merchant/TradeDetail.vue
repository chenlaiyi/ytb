<!-- 商户交易详情页面 -->
<template>
  <div class="trade-detail">
    <van-nav-bar 
      title="交易详情" 
      left-arrow 
      @click-left="onBack" 
      fixed
    />
    
    <div class="content-wrap">
      <!-- 加载状态 -->
      <van-empty v-if="loading" description="加载中...">
        <template #image>
          <van-loading type="spinner" size="36" />
        </template>
      </van-empty>
      
      <!-- 交易详情内容 -->
      <template v-else>
        <!-- 状态卡片 -->
        <div class="status-card">
          <div class="amount">¥ {{ trade?.amount || '0.00' }}</div>
          <div class="status">
            <van-tag :type="getStatusTagType(trade?.status)" size="medium">
              {{ getStatusText(trade?.status) }}
            </van-tag>
          </div>
          <div class="reminder">
            <van-icon name="info-o" /> 交易款项由支付公司直接结算给商户
          </div>
        </div>
        
        <!-- 基本信息 -->
        <div class="detail-card">
          <div class="card-title">基本信息</div>
          <div class="card-content">
            <div class="detail-item">
              <div class="label">交易编号</div>
              <div class="value">{{ trade?.trade_no }}</div>
            </div>
            <div class="detail-item">
              <div class="label">交易类型</div>
              <div class="value">{{ getTradeTypeText(trade?.trade_type) }}</div>
            </div>
            <div class="detail-item">
              <div class="label">支付方式</div>
              <div class="value">{{ getPaymentMethodText(trade?.payment_method) }}</div>
            </div>
            <div class="detail-item">
              <div class="label">交易时间</div>
              <div class="value">{{ trade?.pay_time }}</div>
            </div>
            <div class="detail-item">
              <div class="label">商户名称</div>
              <div class="value">{{ trade?.merchant_name }}</div>
            </div>
          </div>
        </div>
        
        <!-- 资金信息 -->
        <div class="detail-card">
          <div class="card-title">资金信息</div>
          <div class="card-content">
            <div class="detail-item">
              <div class="label">交易金额</div>
              <div class="value">¥ {{ trade?.amount || '0.00' }}</div>
            </div>
            <div class="detail-item">
              <div class="label">手续费</div>
              <div class="value">¥ {{ trade?.fee || '0.00' }}</div>
            </div>
            <div class="detail-item">
              <div class="label">实际收入</div>
              <div class="value">¥ {{ trade?.actual_amount || '0.00' }}</div>
            </div>
            <div class="detail-item">
              <div class="label">结算方式</div>
              <div class="value">支付公司直接结算到商户账户</div>
            </div>
          </div>
        </div>
        
        <!-- 支付者信息 -->
        <div class="detail-card" v-if="trade?.payer_name || trade?.payer_account">
          <div class="card-title">支付者信息</div>
          <div class="card-content">
            <div class="detail-item" v-if="trade?.payer_name">
              <div class="label">支付者</div>
              <div class="value">{{ trade?.payer_name }}</div>
            </div>
            <div class="detail-item" v-if="trade?.payer_account">
              <div class="label">支付账号</div>
              <div class="value">{{ maskAccount(trade?.payer_account) }}</div>
            </div>
          </div>
        </div>
        
        <!-- 交易备注 -->
        <div class="detail-card" v-if="trade?.remark">
          <div class="card-title">交易备注</div>
          <div class="card-content">
            <div class="detail-item">
              <div class="value remark-text">{{ trade?.remark }}</div>
            </div>
          </div>
        </div>
        
        <!-- 操作区域 -->
        <div class="action-bar">
          <van-button 
            type="primary" 
            block 
            icon="share-o" 
            @click="showShare = true"
          >
            分享交易详情
          </van-button>
        </div>
        
        <!-- 流程图 -->
        <div class="process-card">
          <div class="card-title">交易流程</div>
          <div class="process-steps">
            <div class="step">
              <div class="step-icon completed">
                <van-icon name="peer-pay" />
              </div>
              <div class="step-content">
                <div class="step-title">支付完成</div>
                <div class="step-time">{{ trade?.pay_time }}</div>
              </div>
            </div>
            <div class="step-line"></div>
            <div class="step">
              <div class="step-icon completed">
                <van-icon name="balance-o" />
              </div>
              <div class="step-content">
                <div class="step-title">支付公司收款</div>
                <div class="step-time">{{ trade?.pay_time }}</div>
              </div>
            </div>
            <div class="step-line"></div>
            <div class="step">
              <div class="step-icon completed">
                <van-icon name="cash-back-record" />
              </div>
              <div class="step-content">
                <div class="step-title">结算到商户</div>
                <div class="step-time">T+1日内</div>
                <div class="step-desc">由支付公司直接结算到商户账户</div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
    
    <!-- 分享弹窗 -->
    <van-share-sheet
      v-model:show="showShare"
      title="分享交易详情"
      :options="shareOptions"
      @select="onSelect"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useMerchantStore } from '@/stores/merchant'

const route = useRoute()
const router = useRouter()
const merchantStore = useMerchantStore()
const loading = ref(true)
const trade = ref(null)
const showShare = ref(false)

// 分享选项
const shareOptions = [
  { name: '微信', icon: 'wechat' },
  { name: '微博', icon: 'weibo' },
  { name: '复制链接', icon: 'link' },
  { name: '二维码', icon: 'qrcode' },
  { name: '更多', icon: 'more' },
]

// 返回上一页
const onBack = () => {
  router.back()
}

// 获取交易状态文本
const getStatusText = (status) => {
  const statusMap = {
    'success': '交易成功',
    'pending': '处理中',
    'failed': '交易失败',
    'refunded': '已退款',
    'closed': '已关闭'
  }
  return statusMap[status] || '未知状态'
}

// 获取状态标签类型
const getStatusTagType = (status) => {
  const typeMap = {
    'success': 'success',
    'pending': 'warning',
    'failed': 'danger',
    'refunded': 'primary',
    'closed': 'default'
  }
  return typeMap[status] || 'default'
}

// 获取交易类型文本
const getTradeTypeText = (tradeType) => {
  const typeMap = {
    'payment': '收款',
    'refund': '退款',
    'transfer': '转账',
    'withdrawal': '提现'
  }
  return typeMap[tradeType] || '未知类型'
}

// 获取支付方式文本
const getPaymentMethodText = (method) => {
  const methodMap = {
    'wechat': '微信支付',
    'alipay': '支付宝',
    'bank': '银行卡',
    'cash': '现金',
    'other': '其他方式'
  }
  return methodMap[method] || '未知方式'
}

// 遮蔽账号
const maskAccount = (account) => {
  if (!account) return ''
  if (account.length <= 4) return account
  
  return account.slice(0, 3) + '****' + account.slice(-4)
}

// 处理分享
const onSelect = (option) => {
  showToast(`分享到: ${option.name}`)
  showShare.value = false
}

// 加载交易详情
const fetchTradeDetail = async () => {
  loading.value = true
  
  try {
    const tradeNo = route.params.tradeNo || route.query.trade_no
    
    if (!tradeNo) {
      showToast('缺少交易单号')
      setTimeout(() => {
        router.back()
      }, 1500)
      return
    }
    
    const data = await merchantStore.fetchTradeDetail(tradeNo)
    
    if (data) {
      trade.value = data
    } else {
      showToast('获取交易详情失败')
      setTimeout(() => {
        router.back()
      }, 1500)
    }
  } catch (error) {
    console.error('获取交易详情失败', error)
    showToast('获取交易详情失败')
  } finally {
    loading.value = false
  }
}

// 初始化
onMounted(() => {
  fetchTradeDetail()
})
</script>

<style scoped>
.trade-detail {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 20px;
}

.content-wrap {
  padding-top: 46px;
  padding-bottom: 30px;
}

.status-card {
  background-color: #1989fa;
  color: #fff;
  padding: 20px 15px;
  text-align: center;
  position: relative;
}

.status-card .amount {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 10px;
}

.status-card .status {
  margin-bottom: 15px;
}

.status-card .reminder {
  font-size: 12px;
  background: rgba(255, 255, 255, 0.2);
  padding: 5px 10px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
}

.status-card .reminder .van-icon {
  margin-right: 4px;
}

.detail-card, .process-card {
  margin: 15px;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(100, 101, 102, 0.08);
}

.card-title {
  padding: 12px 15px;
  font-size: 16px;
  font-weight: bold;
  color: #323233;
  border-bottom: 1px solid #f2f2f2;
}

.card-content {
  padding: 10px 15px;
}

.detail-item {
  display: flex;
  padding: 8px 0;
  font-size: 14px;
}

.detail-item .label {
  color: #646566;
  width: 90px;
  flex-shrink: 0;
}

.detail-item .value {
  color: #323233;
  flex: 1;
}

.detail-item .remark-text {
  padding: 5px 0;
  line-height: 1.5;
}

.action-bar {
  margin: 20px 15px;
}

.process-steps {
  padding: 20px 15px;
}

.step {
  display: flex;
  align-items: flex-start;
  position: relative;
}

.step-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  flex-shrink: 0;
  z-index: 1;
}

.step-icon.completed {
  background-color: #1989fa;
  color: #fff;
}

.step-icon.pending {
  background-color: #dcdee0;
  color: #c8c9cc;
}

.step-content {
  flex: 1;
  padding-bottom: 20px;
}

.step-title {
  font-size: 14px;
  font-weight: bold;
  color: #323233;
  margin-bottom: 4px;
}

.step-time {
  font-size: 12px;
  color: #969799;
  margin-bottom: 3px;
}

.step-desc {
  font-size: 12px;
  color: #646566;
}

.step-line {
  width: 1px;
  height: 30px;
  background-color: #dcdee0;
  margin-left: 16px;
  margin-bottom: 5px;
}

.step:last-child .step-content {
  padding-bottom: 0;
}
</style> 