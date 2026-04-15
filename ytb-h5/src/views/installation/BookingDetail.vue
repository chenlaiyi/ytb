<template>
  <div class="booking-detail-page">
    <van-nav-bar
      title="预约详情"
      left-arrow
      @click-left="$router.back()"
    />
    
    <div class="booking-detail-container" v-if="!loading && booking">
      <div class="booking-status-card">
        <div class="status-icon" :class="'status-' + booking.status">
          <van-icon :name="getStatusIcon(booking.status)" size="24" />
        </div>
        <div class="status-text">{{ booking.status_text }}</div>
        <div class="status-desc">{{ getStatusDesc(booking.status) }}</div>
      </div>
      
      <div class="card">
        <div class="card-title">
          <van-icon name="shopping-cart-o" />
          <span>套餐信息</span>
        </div>
        <div class="info-item">
          <span class="label">套餐类型</span>
          <span class="value">{{ booking.package_type_text }}</span>
        </div>
        <div class="info-item">
          <span class="label">扣费计划</span>
          <span class="value">{{ booking.billing_plan_text || booking.package_type_text }}</span>
        </div>
        <div class="info-item">
          <span class="label">套餐价格</span>
          <span class="value price">¥{{ booking.package_price }}</span>
        </div>
        <div class="info-item" v-if="booking.billing_rate">
          <span class="label">计费单价</span>
          <span class="value">{{ booking.billing_rate }} 元/{{ booking.billing_unit || 'L' }}</span>
        </div>
        <div class="info-item">
          <span class="label">押金</span>
          <span class="value">
            ¥{{ formatAmount(booking.deposit_amount) }}
            <van-tag v-if="booking.deposit_waived" type="success" size="small" plain>已免</van-tag>
          </span>
        </div>
        <div class="info-item" v-if="booking.wechat_pay_score">
          <span class="label">支付分</span>
          <span class="value">{{ booking.wechat_pay_score }}</span>
        </div>
        <div class="info-item">
          <span class="label">安装费用</span>
          <span class="value price">¥{{ booking.installation_fee }}</span>
        </div>
        <div class="info-item">
          <span class="label">总金额</span>
          <span class="value price">¥{{ booking.total_amount }}</span>
        </div>
      </div>
      
      <div class="card">
        <div class="card-title">
          <van-icon name="location-o" />
          <span>安装信息</span>
        </div>
        <div class="info-item">
          <span class="label">联系人</span>
          <span class="value">{{ booking.contact_name }}</span>
        </div>
        <div class="info-item">
          <span class="label">联系电话</span>
          <span class="value">{{ booking.contact_phone }}</span>
        </div>
        <div class="info-item">
          <span class="label">安装地址</span>
          <span class="value">{{ booking.install_address }}</span>
        </div>
        <div class="info-item">
          <span class="label">安装时间</span>
          <span class="value">{{ formatDateTime(booking.install_time) }}</span>
        </div>
        <div class="info-item" v-if="booking.remarks">
          <span class="label">备注</span>
          <span class="value">{{ booking.remarks }}</span>
        </div>
      </div>
      
      <div class="card" v-if="booking.referrer_id">
        <div class="card-title">
          <van-icon name="friends-o" />
          <span>推荐人信息</span>
        </div>
        <div class="referrer-info">
          <img v-if="booking.referrer_avatar" :src="booking.referrer_avatar" class="referrer-avatar" />
          <van-icon v-else name="contact" size="40" class="default-avatar" />
          <div class="referrer-details">
            <div class="referrer-name">{{ booking.referrer_nickname || booking.referrer_username || '未知用户' }}</div>
            <div class="referrer-id">ID: {{ booking.referrer_id }}</div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-title">
          <van-icon name="notes-o" />
          <span>订单信息</span>
        </div>
        <div class="info-item">
          <span class="label">预约单号</span>
          <span class="value">{{ booking.booking_no }}</span>
        </div>
        <div class="info-item">
          <span class="label">创建时间</span>
          <span class="value">{{ formatDateTime(booking.created_at) }}</span>
        </div>
        <div class="info-item" v-if="booking.status === 'cancelled'">
          <span class="label">取消原因</span>
          <span class="value">{{ booking.cancel_reason || '用户取消' }}</span>
        </div>
      </div>
      
      <div class="booking-actions" v-if="booking.status === 'pending' || booking.status === 'confirmed'">
        <van-button type="danger" block round @click="showCancelDialog">取消预约</van-button>
      </div>
    </div>
    
    <div class="loading-container" v-if="loading">
      <van-loading type="spinner" color="#1989fa" size="24px">加载中...</van-loading>
    </div>
    
    <div class="error-container" v-if="error">
      <van-empty image="error" description="加载失败，请重试">
        <template #bottom>
          <van-button round type="primary" size="small" @click="fetchBookingDetails">重新加载</van-button>
        </template>
      </van-empty>
    </div>
    
    <!-- 取消预约弹窗 -->
    <van-dialog
      v-model="showCancelConfirm"
      title="取消预约"
      show-cancel-button
      confirm-button-text="确认取消"
      cancel-button-text="再想想"
      @confirm="cancelBooking"
    >
      <div class="cancel-content">
        <p>确定要取消此次安装预约吗？</p>
        <van-field
          v-model="cancelReason"
          label="取消原因"
          placeholder="请填写取消原因（选填）"
          type="textarea"
          rows="2"
        />
      </div>
    </van-dialog>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { formatDateTime } from '@/utils/date'
import installationApi from '@/api/installation'

export default {
  name: 'BookingDetail',
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    const loading = ref(true)
    const error = ref(false)
    const booking = ref(null)
    const showCancelConfirm = ref(false)
    const cancelReason = ref('')
    
    // 获取预约详情
    const fetchBookingDetails = async () => {
      const bookingId = route.params.id
      if (!bookingId) {
        showToast('预约ID不存在')
        router.replace('/installation/booking-list')
        return
      }
      
      loading.value = true
      error.value = false
      
      try {
        const res = await installationApi.getBooking({ id: bookingId })
        if (res.code === 0) {
          booking.value = res.data
        } else {
          error.value = true
          showToast(res.message || '获取预约详情失败')
        }
      } catch (e) {
        console.error('获取预约详情失败', e)
        error.value = true
        showToast('网络错误，请稍后重试')
      } finally {
        loading.value = false
      }
    }
    
    // 获取状态图标
    const getStatusIcon = (status) => {
      const statusIconMap = {
        'pending': 'clock-o',
        'confirmed': 'passed',
        'completed': 'certificate',
        'cancelled': 'close',
        'assigned': 'manager'
      }
      return statusIconMap[status] || 'question-o'
    }
    
    // 获取状态描述
    const getStatusDesc = (status) => {
      const statusDescMap = {
        'pending': '您的预约正在等待处理，我们将尽快安排工作人员与您联系',
        'confirmed': '您的预约已确认，我们将按约定时间上门安装',
        'assigned': '工程师已分配，将按约定时间上门安装',
        'completed': '安装已完成，感谢您选择我们的服务',
        'cancelled': '预约已取消'
      }
      return statusDescMap[status] || ''
    }
    
    // 显示取消确认框
    const showCancelDialog = () => {
      showCancelConfirm.value = true
      cancelReason.value = ''
    }
    
    // 取消预约
    const cancelBooking = async () => {
      try {
        const bookingId = route.params.id
        const res = await installationApi.cancelBooking({ booking_id: bookingId, reason: cancelReason.value })
        if (res.code === 0) {
          showSuccessToast('预约已取消')
          showCancelConfirm.value = false
          fetchBookingDetails()
        } else {
          showToast(res.message || '取消预约失败')
        }
      } catch (e) {
        showToast('网络错误，请稍后重试')
      }
    }
    
    onMounted(() => {
      fetchBookingDetails()
    })

    const formatAmount = (value) => {
      const num = Number(value || 0)
      return num.toFixed(2)
    }
    
    return {
      loading,
      error,
      booking,
      showCancelConfirm,
      cancelReason,
      formatDateTime,
      fetchBookingDetails,
      getStatusIcon,
      getStatusDesc,
      formatAmount,
      showCancelDialog,
      cancelBooking
    }
  }
}
</script>

<style scoped>
.booking-detail-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 20px;
}

.booking-detail-container {
  padding: 16px;
}

.loading-container, .error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.booking-status-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 12px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.status-icon {
  margin-bottom: 12px;
  display: inline-block;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  margin-right: auto;
}

.status-pending {
  background-color: #fff5e6;
  color: #ff9800;
}

.status-confirmed {
  background-color: #e3f2fd;
  color: #2196f3;
}

.status-assigned {
  background-color: #e8f5e9;
  color: #4caf50;
}

.status-completed {
  background-color: #e8f5e9;
  color: #4caf50;
}

.status-cancelled {
  background-color: #f5f5f5;
  color: #9e9e9e;
}

.status-text {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
}

.status-desc {
  font-size: 14px;
  color: #646566;
  line-height: 1.4;
}

.card {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #323233;
  display: flex;
  align-items: center;
}

.card-title .van-icon {
  margin-right: 4px;
  color: #1989fa;
}

.info-item {
  display: flex;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-item .label {
  color: #646566;
  width: 80px;
  flex-shrink: 0;
}

.info-item .value {
  color: #323233;
  flex: 1;
}

.info-item .price {
  color: #ee0a24;
  font-weight: 500;
}

.referrer-info {
  display: flex;
  align-items: center;
}

.referrer-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
}

.default-avatar {
  width: 40px;
  height: 40px;
  background-color: #f2f3f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: #c8c9cc;
}

.referrer-details {
  flex: 1;
}

.referrer-name {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 4px;
}

.referrer-id {
  font-size: 12px;
  color: #969799;
}

.booking-actions {
  margin-top: 24px;
  padding: 0 16px;
}

.cancel-content {
  padding: 16px;
}

.cancel-content p {
  margin-bottom: 16px;
  text-align: center;
}
</style> 
