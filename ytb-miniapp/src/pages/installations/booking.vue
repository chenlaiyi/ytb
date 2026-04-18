<template>
  <view class="booking-page">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-left">
        <view class="nav-btn" @tap="goBack">
          <text class="nav-btn-icon">←</text>
        </view>
        <view class="nav-divider"></view>
        <view class="nav-btn" @tap="goHome">
          <text class="nav-btn-icon">🏠</text>
        </view>
      </view>
      <text class="nav-title">预约安装净水器</text>
      <view class="nav-placeholder"></view>
    </view>

    <!-- 预约表单 -->
    <view class="form-section">
      <view class="form-card">
        <!-- 联系人 -->
        <view class="form-item">
          <text class="form-label">联系人姓名</text>
          <input class="form-input" v-model="form.contact_name" placeholder="请输入联系人姓名" />
        </view>

        <!-- 联系电话 -->
        <view class="form-item">
          <text class="form-label">联系电话</text>
          <input class="form-input" v-model="form.contact_phone" type="number" placeholder="请输入联系电话" maxlength="11" />
        </view>

        <!-- 省份 -->
        <view class="form-item">
          <text class="form-label">省份</text>
          <input class="form-input" v-model="form.province" placeholder="请输入省份" />
        </view>

        <!-- 城市 -->
        <view class="form-item">
          <text class="form-label">城市</text>
          <input class="form-input" v-model="form.city" placeholder="请输入城市" />
        </view>

        <!-- 详细地址 -->
        <view class="form-item">
          <text class="form-label">详细地址</text>
          <textarea class="form-textarea" v-model="form.address" placeholder="请输入详细安装地址" :maxlength="200" />
        </view>

        <!-- 预约日期 -->
        <view class="form-item">
          <text class="form-label">预约日期</text>
          <picker mode="date" :start="minDate" @change="onDateChange">
            <view class="form-input picker-input">
              <text :class="form.preferred_date ? '' : 'placeholder'">{{ form.preferred_date || '请选择预约日期' }}</text>
              <text class="picker-arrow">▼</text>
            </view>
          </picker>
        </view>

        <!-- 预约时间段 -->
        <view class="form-item">
          <text class="form-label">预约时间段</text>
          <picker :range="timeSlots" @change="onTimeChange">
            <view class="form-input picker-input">
              <text :class="form.preferred_time ? '' : 'placeholder'">{{ form.preferred_time || '请选择时间段' }}</text>
              <text class="picker-arrow">▼</text>
            </view>
          </picker>
        </view>

        <!-- 备注 -->
        <view class="form-item">
          <text class="form-label">备注 <text class="optional">(选填)</text></text>
          <textarea class="form-textarea" v-model="form.remark" placeholder="如有特殊要求请备注" :maxlength="500" />
        </view>
      </view>

      <!-- 费用说明 -->
      <view class="fee-card">
        <text class="fee-title">费用说明</text>
        <view class="fee-row">
          <text class="fee-label">安装服务费</text>
          <text class="fee-value">¥120.00</text>
        </view>
        <view class="fee-row">
          <text class="fee-label">上门检测</text>
          <text class="fee-value free">免费</text>
        </view>
        <view class="fee-note">* 安装完成后根据水质检测选择套餐并支付套餐费用</view>
      </view>
    </view>

    <!-- 底部提交按钮 -->
    <view class="submit-bar">
      <button class="submit-btn" :disabled="submitting" @tap="handleSubmit">
        {{ submitting ? '提交中...' : '提交预约' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()
const submitting = ref(false)
const referrerId = ref('')
const mode = ref('self')

const form = reactive({
  contact_name: '',
  contact_phone: '',
  province: '',
  city: '',
  address: '',
  preferred_date: '',
  preferred_time: '',
  remark: ''
})

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00'
]

// 最早日期 = 明天
const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)
const minDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`

onLoad((options) => {
  // 优先从普通参数获取 referrer_id
  referrerId.value = options.referrer_id || ''
  mode.value = options.mode || 'self'

  // 解析小程序码的 scene 参数（格式: ref=用户ID）
  if (options.scene && !referrerId.value) {
    const sceneStr = decodeURIComponent(options.scene)
    console.log('[Booking] scene参数:', sceneStr)
    const params = new URLSearchParams(sceneStr)
    const refId = params.get('ref')
    if (refId) {
      referrerId.value = refId
      mode.value = 'invite' // 扫码来的都是被邀请的
    }
  }

  // 如果是自己预约，自动填充用户信息
  if (mode.value === 'self' && userStore.userInfo) {
    form.contact_name = userStore.userInfo.real_name || userStore.userInfo.nickname || ''
    form.contact_phone = userStore.userInfo.phone || ''
  }

  console.log('[Booking] referrerId:', referrerId.value, 'mode:', mode.value)
})

const goBack = () => {
  uni.navigateBack({ fail: () => goHome() })
}

const goHome = () => {
  uni.switchTab({ url: '/pages/index/index' })
}

const onDateChange = (e) => {
  form.preferred_date = e.detail.value
}

const onTimeChange = (e) => {
  form.preferred_time = timeSlots[e.detail.value]
}

const handleSubmit = async () => {
  // 表单校验
  if (!form.contact_name.trim()) {
    return uni.showToast({ title: '请输入联系人姓名', icon: 'none' })
  }
  if (!form.contact_phone.trim() || form.contact_phone.length < 11) {
    return uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
  }
  if (!form.address.trim()) {
    return uni.showToast({ title: '请输入安装地址', icon: 'none' })
  }
  if (!form.preferred_date) {
    return uni.showToast({ title: '请选择预约日期', icon: 'none' })
  }
  if (!form.preferred_time) {
    return uni.showToast({ title: '请选择预约时间', icon: 'none' })
  }

  submitting.value = true
  try {
    const token = uni.getStorageSync('token') || ''
    const postData = {
      contact_name: form.contact_name,
      contact_phone: form.contact_phone,
      province: form.province,
      city: form.city,
      address: form.address,
      preferred_date: form.preferred_date,
      preferred_time: form.preferred_time,
      remark: form.remark,
      referrer_id: referrerId.value,
      install_fee: 120
    }

    const res = await uni.request({
      url: 'https://ytb.ddg.org.cn/api/ytb/install/orders',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      data: postData
    })

    const data = res.data || res[1]?.data
    if (data && data.code === 0) {
      uni.showModal({
        title: '预约成功',
        content: `您的安装预约已提交成功！\n工单号: ${data.data?.order_no || ''}\n我们会尽快安排工程师与您联系。`,
        showCancel: false,
        confirmText: '知道了',
        success: () => {
          uni.navigateBack()
        }
      })
    } else {
      uni.showToast({
        title: data?.message || '提交失败，请重试',
        icon: 'none'
      })
    }
  } catch (e) {
    console.error('提交预约失败:', e)
    uni.showToast({ title: '网络错误，请重试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.booking-page {
  min-height: 100vh;
  background: #f5f5f7;
  padding-bottom: 160rpx;
}

/* 导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 80rpx 30rpx 20rpx;
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
}

.nav-left {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 32rpx;
  padding: 0 4rpx;
  height: 56rpx;
}

.nav-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn-icon {
  font-size: 30rpx;
  color: #fff;
}

.nav-divider {
  width: 1rpx;
  height: 32rpx;
  background: rgba(255, 255, 255, 0.35);
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 34rpx;
  font-weight: 700;
  color: #fff;
}

.nav-placeholder {
  width: 120rpx;
}

/* 表单区域 */
.form-section {
  padding: 20rpx 30rpx;
}

.form-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 16rpx 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
}

.form-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f3f4f6;
}

.form-item:last-child {
  border-bottom: none;
}

.form-label {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12rpx;
}

.optional {
  font-weight: 400;
  color: #9CA3AF;
  font-size: 24rpx;
}

.form-input {
  width: 100%;
  height: 72rpx;
  font-size: 28rpx;
  color: #1f2937;
  background: #F9FAFB;
  border-radius: 12rpx;
  padding: 0 20rpx;
  box-sizing: border-box;
}

.form-textarea {
  width: 100%;
  height: 140rpx;
  font-size: 28rpx;
  color: #1f2937;
  background: #F9FAFB;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  box-sizing: border-box;
}

.picker-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  line-height: 72rpx;
}

.placeholder {
  color: #9CA3AF;
}

.picker-arrow {
  font-size: 22rpx;
  color: #9CA3AF;
}

/* 费用说明 */
.fee-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-top: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
}

.fee-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1e1e2e;
  margin-bottom: 20rpx;
  display: block;
}

.fee-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.fee-label {
  font-size: 28rpx;
  color: #6b7280;
}

.fee-value {
  font-size: 28rpx;
  font-weight: 600;
  color: #EF4444;
}

.free {
  color: #10B981;
}

.fee-note {
  font-size: 24rpx;
  color: #9CA3AF;
  margin-top: 12rpx;
  line-height: 1.5;
}

/* 底部按钮 */
.submit-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 16rpx rgba(0,0,0,0.06);
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  color: #fff;
  font-size: 32rpx;
  font-weight: 700;
  border-radius: 44rpx;
  border: none;
}

.submit-btn[disabled] {
  opacity: 0.6;
}
</style>
