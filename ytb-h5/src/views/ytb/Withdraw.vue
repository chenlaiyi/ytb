<template>
  <div class="ytb-withdraw">
    <van-nav-bar title="佣金提现" left-arrow @click-left="goBack" />

    <!-- 余额信息 -->
    <div class="balance-card">
      <div class="balance-item">
        <div class="balance-label">可提现余额</div>
        <div class="balance-value">¥{{ formatMoney(withdrawInfo.available_balance) }}</div>
      </div>
      <div class="balance-row">
        <div class="balance-item small">
          <div class="balance-label">冻结中</div>
          <div class="balance-value">¥{{ formatMoney(withdrawInfo.frozen_balance) }}</div>
        </div>
        <div class="balance-item small">
          <div class="balance-label">累计已提现</div>
          <div class="balance-value">¥{{ formatMoney(withdrawInfo.total_withdrawn) }}</div>
        </div>
      </div>
    </div>

    <!-- 提现规则 -->
    <div class="rules-card">
      <div class="rules-title">提现规则</div>
      <div class="rules-list">
        <div class="rule-item">
          <van-icon name="info-o" />
          <span>最低提现金额：¥{{ withdrawInfo.min_withdraw_amount }}</span>
        </div>
        <div class="rule-item">
          <van-icon name="info-o" />
          <span>税费：{{ withdrawInfo.tax_rate }}%</span>
        </div>
        <div class="rule-item">
          <van-icon name="info-o" />
          <span>手续费：¥{{ withdrawInfo.service_fee }}/笔</span>
        </div>
      </div>
    </div>

    <!-- 待处理提现 -->
    <div class="pending-card" v-if="withdrawInfo.pending_withdrawal">
      <van-cell-group inset title="待处理提现">
        <van-cell 
          :title="`提现 ¥${withdrawInfo.pending_withdrawal.amount}`"
          :label="`申请时间：${withdrawInfo.pending_withdrawal.created_at}`"
        >
          <template #value>
            <van-tag :type="getStatusType(withdrawInfo.pending_withdrawal.status)">
              {{ withdrawInfo.pending_withdrawal.status_name }}
            </van-tag>
          </template>
        </van-cell>
      </van-cell-group>
    </div>

    <!-- 提现表单 -->
    <div class="withdraw-form" v-if="!withdrawInfo.pending_withdrawal">
      <van-form @submit="submitWithdraw">
        <van-cell-group inset title="提现信息">
          <!-- 提现金额 -->
          <van-field
            v-model="form.amount"
            type="number"
            label="提现金额"
            placeholder="请输入提现金额"
            :rules="[{ required: true, message: '请输入提现金额' }]"
            @blur="calculateFees"
          >
            <template #button>
              <van-button size="small" type="primary" plain @click="withdrawAll">全部提现</van-button>
            </template>
          </van-field>

          <!-- 费用预览 -->
          <van-cell title="税费(8%)" :value="`-¥${formatMoney(fees.tax_fee)}`" v-if="fees.tax_fee > 0" />
          <van-cell title="手续费" :value="`-¥${formatMoney(fees.service_fee)}`" v-if="fees.service_fee > 0" />
          <van-cell title="实际到账" :value="`¥${formatMoney(fees.actual_amount)}`" v-if="fees.actual_amount > 0" class="actual-amount" />

          <!-- 提现方式 -->
          <van-field
            v-model="form.withdraw_type"
            is-link
            readonly
            label="提现方式"
            placeholder="请选择提现方式"
            :rules="[{ required: true, message: '请选择提现方式' }]"
            @click="showTypePicker = true"
          >
            <template #input>
              {{ getTypeName(form.withdraw_type) || '请选择' }}
            </template>
          </van-field>

          <!-- 账户姓名 -->
          <van-field
            v-model="form.account_name"
            label="账户姓名"
            placeholder="请输入收款账户姓名"
            :rules="[{ required: true, message: '请输入账户姓名' }]"
          />

          <!-- 账户号码 -->
          <van-field
            v-model="form.account_no"
            :label="accountNoLabel"
            :placeholder="accountNoPlaceholder"
            :rules="[{ required: true, message: accountNoPlaceholder }]"
          />

          <!-- 银行名称（银行卡时显示） -->
          <van-field
            v-if="form.withdraw_type === 'bank_card'"
            v-model="form.bank_name"
            label="银行名称"
            placeholder="请输入银行名称，如：中国工商银行"
            :rules="[{ required: true, message: '请输入银行名称' }]"
          />

          <!-- 开户支行（银行卡时显示） -->
          <van-field
            v-if="form.withdraw_type === 'bank_card'"
            v-model="form.bank_branch"
            label="开户支行"
            placeholder="请输入开户支行（选填）"
          />
        </van-cell-group>

        <div class="submit-section">
          <van-button 
            type="primary" 
            block 
            native-type="submit"
            :loading="submitting"
            :disabled="!canSubmit"
          >
            {{ submitButtonText }}
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- 提现记录入口 -->
    <div class="records-entry">
      <van-cell title="提现记录" is-link @click="goToRecords" />
    </div>

    <!-- 提现方式选择器 -->
    <van-action-sheet
      v-model:show="showTypePicker"
      :actions="withdrawTypes"
      @select="onTypeSelect"
      cancel-text="取消"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showDialog } from 'vant'
import {
  getWithdrawInfo,
  calculateWithdrawFees,
  applyWithdraw,
  isLoggedIn
} from '@/api/ytb'
import { useYtbShare } from '@/composables/useYtbShare'

// 设置亿拓宝分享配置
useYtbShare('亿拓宝联盟 - 佣金提现')

const router = useRouter()

// 状态
const withdrawInfo = ref({
  available_balance: 0,
  frozen_balance: 0,
  total_withdrawn: 0,
  min_withdraw_amount: 300,
  tax_rate: 8,
  service_fee: 3,
  can_withdraw: false,
  withdraw_types: [],
  pending_withdrawal: null
})

const form = ref({
  amount: '',
  withdraw_type: '',
  account_name: '',
  account_no: '',
  bank_name: '',
  bank_branch: ''
})

const fees = ref({
  tax_fee: 0,
  service_fee: 0,
  actual_amount: 0
})

const showTypePicker = ref(false)
const submitting = ref(false)

// 计算属性
const withdrawTypes = computed(() => {
  return [
    { name: '银行卡', value: 'bank_card' },
    { name: '微信钱包', value: 'wechat' },
    { name: '支付宝', value: 'alipay' }
  ]
})

const accountNoLabel = computed(() => {
  switch (form.value.withdraw_type) {
    case 'bank_card': return '银行卡号'
    case 'wechat': return '微信号'
    case 'alipay': return '支付宝账号'
    default: return '账户号码'
  }
})

const accountNoPlaceholder = computed(() => {
  switch (form.value.withdraw_type) {
    case 'bank_card': return '请输入银行卡号'
    case 'wechat': return '请输入微信号'
    case 'alipay': return '请输入支付宝账号'
    default: return '请输入账户号码'
  }
})

const canSubmit = computed(() => {
  const amount = parseFloat(form.value.amount) || 0
  return amount >= withdrawInfo.value.min_withdraw_amount && 
         amount <= withdrawInfo.value.available_balance &&
         form.value.withdraw_type &&
         form.value.account_name &&
         form.value.account_no &&
         (form.value.withdraw_type !== 'bank_card' || form.value.bank_name)
})

const submitButtonText = computed(() => {
  const amount = parseFloat(form.value.amount) || 0
  if (amount < withdrawInfo.value.min_withdraw_amount) {
    return `最低提现¥${withdrawInfo.value.min_withdraw_amount}`
  }
  if (amount > withdrawInfo.value.available_balance) {
    return '余额不足'
  }
  return '申请提现'
})

// 初始化
onMounted(async () => {
  if (!isLoggedIn()) {
    router.replace('/ytb/login')
    return
  }
  await loadWithdrawInfo()
})

// 加载提现信息
const loadWithdrawInfo = async () => {
  try {
    const res = await getWithdrawInfo()
    if (res.code === 0) {
      withdrawInfo.value = res.data
    }
  } catch (error) {
    console.error('获取提现信息失败:', error)
  }
}

// 计算费用
const calculateFees = async () => {
  const amount = parseFloat(form.value.amount) || 0
  if (amount < withdrawInfo.value.min_withdraw_amount) {
    fees.value = { tax_fee: 0, service_fee: 0, actual_amount: 0 }
    return
  }

  try {
    const res = await calculateWithdrawFees(amount)
    if (res.code === 0) {
      fees.value = res.data
    }
  } catch (error) {
    console.error('计算费用失败:', error)
  }
}

// 全部提现
const withdrawAll = () => {
  form.value.amount = withdrawInfo.value.available_balance.toString()
  calculateFees()
}

// 选择提现方式
const onTypeSelect = (action) => {
  form.value.withdraw_type = action.value
  // 清空之前的账户信息
  form.value.account_no = ''
  form.value.bank_name = ''
  form.value.bank_branch = ''
}

// 获取提现方式名称
const getTypeName = (type) => {
  const item = withdrawTypes.value.find(t => t.value === type)
  return item ? item.name : ''
}

// 提交提现
const submitWithdraw = async () => {
  const amount = parseFloat(form.value.amount) || 0
  
  if (amount < withdrawInfo.value.min_withdraw_amount) {
    showToast(`最低提现金额为¥${withdrawInfo.value.min_withdraw_amount}`)
    return
  }

  if (amount > withdrawInfo.value.available_balance) {
    showToast('可提现余额不足')
    return
  }

  // 确认提现
  try {
    await showDialog({
      title: '确认提现',
      message: `提现金额：¥${amount}\n税费(8%)：-¥${fees.value.tax_fee}\n手续费：-¥${fees.value.service_fee}\n实际到账：¥${fees.value.actual_amount}`,
      showCancelButton: true,
      confirmButtonText: '确认提现',
      cancelButtonText: '取消'
    })
  } catch {
    return // 用户取消
  }

  submitting.value = true
  try {
    const res = await applyWithdraw({
      amount: amount,
      withdraw_type: form.value.withdraw_type,
      account_name: form.value.account_name,
      account_no: form.value.account_no,
      bank_name: form.value.bank_name,
      bank_branch: form.value.bank_branch
    })

    if (res.code === 0) {
      showSuccessToast('提现申请已提交')
      // 重新加载信息
      await loadWithdrawInfo()
      // 清空表单
      form.value = {
        amount: '',
        withdraw_type: '',
        account_name: '',
        account_no: '',
        bank_name: '',
        bank_branch: ''
      }
      fees.value = { tax_fee: 0, service_fee: 0, actual_amount: 0 }
    } else {
      showToast(res.message || '提现申请失败')
    }
  } catch (error) {
    showToast('网络错误')
  } finally {
    submitting.value = false
  }
}

// 获取状态类型
const getStatusType = (status) => {
  switch (status) {
    case 'completed': return 'success'
    case 'rejected': return 'danger'
    case 'processing': return 'primary'
    default: return 'warning'
  }
}

// 格式化金额
const formatMoney = (value) => {
  return parseFloat(value || 0).toFixed(2)
}

// 跳转到提现记录
const goToRecords = () => router.push('/ytb/withdraw-records')

// 返回
const goBack = () => router.back()
</script>

<style scoped>
.ytb-withdraw {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20px;
}

.balance-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 12px;
  padding: 24px;
  border-radius: 12px;
  color: white;
}

.balance-item {
  text-align: center;
}

.balance-item.small {
  flex: 1;
}

.balance-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.balance-value {
  font-size: 32px;
  font-weight: bold;
}

.balance-item.small .balance-value {
  font-size: 18px;
}

.balance-row {
  display: flex;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.rules-card {
  background: white;
  margin: 12px;
  padding: 16px;
  border-radius: 12px;
}

.rules-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.rule-item .van-icon {
  color: #667eea;
}

.pending-card {
  margin: 12px;
}

.withdraw-form {
  margin: 12px;
}

.actual-amount {
  font-weight: bold;
}

.actual-amount :deep(.van-cell__value) {
  color: #07c160;
  font-size: 16px;
}

.submit-section {
  padding: 20px 16px;
}

.records-entry {
  margin: 12px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
}
</style>
