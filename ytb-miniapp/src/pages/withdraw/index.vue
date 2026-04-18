<template>
  <view class="page">
    <!-- 余额卡片 -->
    <view class="balance-card">
      <view class="balance-main">
        <text class="balance-label">可提现余额（元）</text>
        <text class="balance-value">{{ withdrawInfo.available_balance || '0.00' }}</text>
      </view>
      <view class="balance-extra">
        <view class="extra-item">
          <text class="extra-label">冻结金额</text>
          <text class="extra-value">¥{{ withdrawInfo.frozen_balance || '0.00' }}</text>
        </view>
        <view class="extra-item">
          <text class="extra-label">手续费率</text>
          <text class="extra-value">{{ (parseFloat(withdrawInfo.fee_rate || 0) * 100).toFixed(1) }}%</text>
        </view>
      </view>
    </view>

    <!-- 提现表单 -->
    <view class="form-section">
      <view class="section-title">💰 提现申请</view>
      <view class="form-card">
        <view class="form-item">
          <text class="form-label">提现金额</text>
          <view class="amount-input-wrap">
            <text class="yuan-prefix">¥</text>
            <input class="amount-input" type="digit" v-model="amount" placeholder="请输入提现金额" />
          </view>
          <view class="amount-hint">
            <text>最低提现 ¥{{ withdrawInfo.min_withdraw || '10.00' }}</text>
            <text class="all-btn" @tap="withdrawAll">全部提现</text>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">真实姓名</text>
          <input class="form-input" v-model="realName" placeholder="请输入收款人姓名" />
        </view>

        <view class="form-item">
          <text class="form-label">收款方式</text>
          <view class="pay-methods">
            <view class="pay-method" :class="{ active: payMethod === 'wechat' }" @tap="payMethod = 'wechat'">
              <text class="pay-icon">💚</text>
              <text>微信</text>
            </view>
            <view class="pay-method" :class="{ active: payMethod === 'alipay' }" @tap="payMethod = 'alipay'">
              <text class="pay-icon">💙</text>
              <text>支付宝</text>
            </view>
            <view class="pay-method" :class="{ active: payMethod === 'bank' }" @tap="payMethod = 'bank'">
              <text class="pay-icon">🏦</text>
              <text>银行卡</text>
            </view>
          </view>
        </view>

        <view class="form-item" v-if="payMethod === 'alipay'">
          <text class="form-label">支付宝账号</text>
          <input class="form-input" v-model="alipayAccount" placeholder="请输入支付宝账号" />
        </view>

        <view class="form-item" v-if="payMethod === 'bank'">
          <text class="form-label">银行卡号</text>
          <input class="form-input" v-model="bankCard" placeholder="请输入银行卡号" />
        </view>
        <view class="form-item" v-if="payMethod === 'bank'">
          <text class="form-label">开户行</text>
          <input class="form-input" v-model="bankName" placeholder="请输入开户行名称" />
        </view>

        <!-- 费用预览 -->
        <view class="fee-preview" v-if="amount && parseFloat(amount) > 0">
          <view class="fee-row">
            <text>提现金额</text>
            <text>¥{{ parseFloat(amount).toFixed(2) }}</text>
          </view>
          <view class="fee-row">
            <text>手续费（{{ (parseFloat(withdrawInfo.fee_rate || 0) * 100).toFixed(1) }}%）</text>
            <text class="fee-val">-¥{{ fee }}</text>
          </view>
          <view class="fee-row total">
            <text>实际到账</text>
            <text class="total-val">¥{{ actualAmount }}</text>
          </view>
        </view>

        <button class="submit-btn" :disabled="submitting" @tap="onSubmit">
          {{ submitting ? '提交中...' : '确认提现' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { get, post } from '../../api/request'

const withdrawInfo = ref({})
const amount = ref('')
const realName = ref('')
const payMethod = ref('wechat')
const alipayAccount = ref('')
const bankCard = ref('')
const bankName = ref('')
const submitting = ref(false)

const feeRate = computed(() => parseFloat(withdrawInfo.value.fee_rate || 0))
const fee = computed(() => (parseFloat(amount.value || 0) * feeRate.value).toFixed(2))
const actualAmount = computed(() => (parseFloat(amount.value || 0) - parseFloat(fee.value)).toFixed(2))

const fetchInfo = async () => {
  try {
    const res = await get('/api/ytb/withdraw/info')
    if (res.code === 0) withdrawInfo.value = res.data
  } catch (e) {}
}

const withdrawAll = () => { amount.value = withdrawInfo.value.available_balance || '0' }

const onSubmit = async () => {
  const amt = parseFloat(amount.value)
  if (!amt || amt <= 0) return uni.showToast({ title: '请输入金额', icon: 'none' })
  const minW = parseFloat(withdrawInfo.value.min_withdraw || 10)
  if (amt < minW) return uni.showToast({ title: `最低提现¥${minW}`, icon: 'none' })
  const maxW = parseFloat(withdrawInfo.value.available_balance || 0)
  if (amt > maxW) return uni.showToast({ title: '余额不足', icon: 'none' })
  if (!realName.value.trim()) return uni.showToast({ title: '请输入真实姓名', icon: 'none' })
  if (payMethod.value === 'alipay' && !alipayAccount.value.trim()) return uni.showToast({ title: '请输入支付宝账号', icon: 'none' })
  if (payMethod.value === 'bank' && !bankCard.value.trim()) return uni.showToast({ title: '请输入银行卡号', icon: 'none' })

  submitting.value = true
  try {
    const res = await post('/api/ytb/withdraw/apply', {
      amount: amt.toFixed(2), real_name: realName.value, pay_method: payMethod.value,
      alipay_account: alipayAccount.value, bank_card: bankCard.value, bank_name: bankName.value
    })
    if (res.code === 0) {
      uni.showToast({ title: '提现申请已提交', icon: 'success' })
      amount.value = ''
      fetchInfo()
    } else {
      uni.showToast({ title: res.message || '提交失败', icon: 'none' })
    }
  } catch (e) { uni.showToast({ title: '网络异常', icon: 'none' }) }
  finally { submitting.value = false }
}

onShow(() => fetchInfo())
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f5f7; padding-bottom: 40rpx; }
.balance-card { margin: 24rpx; background: linear-gradient(135deg, #10B981, #059669); border-radius: 24rpx; padding: 40rpx; color: #fff; }
.balance-label { font-size: 26rpx; color: rgba(255,255,255,0.7); display: block; }
.balance-value { font-size: 60rpx; font-weight: 800; display: block; margin: 12rpx 0 24rpx; }
.balance-extra { display: flex; gap: 40rpx; border-top: 1rpx solid rgba(255,255,255,0.15); padding-top: 20rpx; }
.extra-item { display: flex; flex-direction: column; gap: 4rpx; }
.extra-label { font-size: 22rpx; color: rgba(255,255,255,0.5); }
.extra-value { font-size: 26rpx; }

.form-section { margin: 0 24rpx; }
.section-title { font-size: 30rpx; font-weight: 700; color: #1e293b; margin-bottom: 16rpx; }
.form-card { background: #fff; border-radius: 20rpx; padding: 24rpx; }
.form-item { margin-bottom: 24rpx; }
.form-label { display: block; font-size: 26rpx; color: #64748b; margin-bottom: 12rpx; font-weight: 600; }
.form-input { background: #f8fafc; border: 2rpx solid #e2e8f0; border-radius: 12rpx; padding: 20rpx; font-size: 28rpx; width: 100%; box-sizing: border-box; }
.amount-input-wrap { display: flex; align-items: center; background: #f8fafc; border: 2rpx solid #e2e8f0; border-radius: 12rpx; padding: 0 20rpx; }
.yuan-prefix { font-size: 36rpx; font-weight: 800; color: #10b981; margin-right: 8rpx; }
.amount-input { flex: 1; padding: 20rpx 0; font-size: 36rpx; font-weight: 700; border: none; background: transparent; }
.amount-hint { display: flex; justify-content: space-between; margin-top: 8rpx; }
.amount-hint text { font-size: 22rpx; color: #94a3b8; }
.all-btn { color: #4F46E5 !important; font-weight: 600; }

.pay-methods { display: flex; gap: 16rpx; }
.pay-method { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8rpx; padding: 20rpx; background: #f8fafc; border: 2rpx solid #e2e8f0; border-radius: 16rpx; font-size: 24rpx; color: #64748b; transition: all 0.2s; }
.pay-method.active { border-color: #4F46E5; background: #EEF2FF; color: #4F46E5; font-weight: 600; }
.pay-icon { font-size: 36rpx; }

.fee-preview { background: #f8fafc; border-radius: 16rpx; padding: 20rpx; margin-bottom: 24rpx; }
.fee-row { display: flex; justify-content: space-between; padding: 8rpx 0; font-size: 26rpx; color: #64748b; }
.fee-row.total { border-top: 1rpx dashed #e2e8f0; margin-top: 8rpx; padding-top: 16rpx; }
.fee-val { color: #EF4444; }
.total-val { font-size: 32rpx; font-weight: 700; color: #10B981; }

.submit-btn { width: 100%; background: linear-gradient(135deg, #10B981, #059669); color: #fff; border: none; border-radius: 16rpx; padding: 24rpx 0; font-size: 30rpx; font-weight: 700; letter-spacing: 4rpx; margin-top: 8rpx; }
.submit-btn::after { border: none; }
.submit-btn[disabled] { opacity: 0.5; }
</style>
