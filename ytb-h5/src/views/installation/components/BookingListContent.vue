<template>
  <div class="booking-list-content">
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        :error="error"
        error-text="请求失败，点击重新加载"
        @load="onLoad"
      >
        <div v-if="bookingList.length === 0 && !loading && !error" class="empty-list">
          <van-empty description="暂无预约记录" />
        </div>
        
        <div v-for="booking in bookingList" :key="booking.id" class="booking-item" @click="goToDetail(booking.id)">
          <div class="booking-header">
            <span class="booking-no">{{ booking.booking_no }}</span>
            <span class="booking-status" :class="'status-' + booking.status">{{ booking.status_text }}</span>
          </div>
          
          <div class="booking-content">
          <div class="booking-row">
            <van-icon name="shopping-cart-o" />
            <span class="label">套餐类型：</span>
            <span class="value">{{ booking.package_type_text }}</span>
          </div>
          
          <div class="booking-row">
            <van-icon name="balance-o" />
            <span class="label">扣费计划：</span>
            <span class="value">{{ booking.billing_plan_text || booking.package_type_text }}</span>
          </div>
          
          <div class="booking-row">
            <van-icon name="gold-coin-o" />
            <span class="label">押金：</span>
            <span class="value">¥{{ formatAmount(booking.deposit_amount) }}<span v-if="booking.deposit_waived" class="badge">已免</span></span>
          </div>
            
            <div class="booking-row">
              <van-icon name="contact" />
              <span class="label">联系人：</span>
              <span class="value">{{ booking.contact_name }} {{ booking.contact_phone }}</span>
            </div>
            
            <div class="booking-row">
              <van-icon name="location-o" />
              <span class="label">安装地址：</span>
              <span class="value address">{{ booking.install_address }}</span>
            </div>
            
            <div class="booking-row">
              <van-icon name="clock-o" />
              <span class="label">安装时间：</span>
              <span class="value">{{ formatDateTime(booking.install_time) }}</span>
            </div>
          </div>
          
          <div class="booking-footer">
            <span class="booking-time">{{ formatDateTime(booking.created_at) }}</span>
            <span class="booking-amount">¥{{ booking.total_amount }}</span>
          </div>
          
          <div v-if="booking.status === 'pending' || booking.status === 'confirmed' || booking.status === 'paid'" class="booking-actions">
            <van-button type="danger" size="small" plain @click.stop="cancelBooking(booking.id)">取消预约</van-button>
          </div>
          <div v-if="booking.status === 'completed'" class="booking-actions">
            <van-button type="primary" size="small" @click.stop="goToActivate(booking.id)">去激活并支付套餐</van-button>
          </div>
        </div>
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog, showSuccessToast } from 'vant'
import { formatDateTime } from '@/utils/date'
import installationApi from '@/api/installation'

export default {
  name: 'BookingListContent',
  props: {
    status: {
      type: String,
      default: null
    }
  },
  setup(props) {
    const router = useRouter()
    
    const page = ref(1)
    const limit = ref(10)
    const bookingList = ref([])
    const loading = ref(false)
    const finished = ref(false)
    const refreshing = ref(false)
    const error = ref(false)
    
    // 监听状态变化，重置列表
    watch(() => props.status, () => {
      reset()
      onLoad()
    })
    
    // 重置列表状态
    const reset = () => {
      page.value = 1
      bookingList.value = []
      loading.value = false
      finished.value = false
      error.value = false
    }
    
    // 下拉刷新
    const onRefresh = () => {
      reset()
      onLoad()
    }
    
    // 加载数据
    const onLoad = async () => {
      if (refreshing.value) {
        bookingList.value = []
        refreshing.value = false
      }
      
      try {
        loading.value = true
        error.value = false
        
        // 构建查询参数
        const params = {
          page: page.value,
          limit: limit.value
        }
        
        if (props.status) {
          params.status = props.status
        }
        
        // 调用API获取预约列表
        const res = await installationApi.getBookingList(params)
        
        if (res.code === 0) {
          const { list, pagination } = res.data
          
          // 添加数据到列表
          bookingList.value.push(...list)
          
          // 判断是否加载完成
          if (page.value >= pagination.pages) {
            finished.value = true
          } else {
            page.value += 1
          }
        } else {
          throw new Error(res.message || '获取预约列表失败')
        }
      } catch (e) {
        console.error('获取预约列表错误:', e)
        error.value = true
        showToast(e.message || '网络错误，请稍后重试')
      } finally {
        loading.value = false
      }
    }
    
    // 跳转到详情
    const goToDetail = (id) => {
      router.push(`/installation/booking-detail/${id}`)
    }
    
    // 跳转到激活页
    const goToActivate = (id) => {
      router.push(`/installation/activate/${id}`)
    }
    
    // 取消预约
    const cancelBooking = (id) => {
      showDialog({
        title: '取消预约',
        message: '确定要取消此次安装预约吗？',
        confirmButtonText: '确定取消',
        cancelButtonText: '再想想'
      }).then(async () => {
        try {
          const res = await installationApi.cancelBooking({ booking_id: id })
          if (res.code === 0) {
            showSuccessToast('预约已取消')
            onRefresh()
          } else {
            throw new Error(res.message || '取消预约失败')
          }
        } catch (e) {
          console.error('取消预约错误:', e)
          showToast(e.message || '网络错误，请稍后重试')
        }
      }).catch(() => {})
    }
    
    const formatAmount = (value) => {
      const num = Number(value || 0);
      return num.toFixed(2);
    }
    
    return {
      bookingList,
      loading,
      finished,
      refreshing,
      error,
      formatDateTime,
      formatAmount,
      onLoad,
      onRefresh,
      goToDetail,
      goToActivate,
      cancelBooking
    }
  }
}
</script>

<style scoped>
.booking-list-content {
  background-color: #f7f8fa;
  min-height: 70vh;
}

.empty-list {
  padding: 40px 0;
}

.booking-item {
  margin: 12px;
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
}

.booking-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  border-bottom: 1px solid #f5f5f5;
  padding-bottom: 8px;
}

.booking-no {
  font-size: 14px;
  color: #323233;
  font-weight: 500;
}

.booking-status {
  font-size: 14px;
  font-weight: 500;
}

.status-pending {
  color: #ff9800;
}

.status-confirmed {
  color: #2196f3;
}

.status-completed {
  color: #4caf50;
}

.status-cancelled {
  color: #9e9e9e;
}

.booking-content {
  padding: 8px 0;
}

.booking-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.booking-row .van-icon {
  margin-right: 4px;
  color: #969799;
}

.booking-row .label {
  color: #646566;
  width: 80px;
  flex-shrink: 0;
}

.booking-row .value {
  color: #323233;
  flex: 1;
}

.booking-row .badge {
  margin-left: 6px;
  font-size: 12px;
  color: #16a34a;
}

.booking-row .address {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.booking-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid #f5f5f5;
}

.booking-time {
  font-size: 12px;
  color: #969799;
}

.booking-amount {
  font-size: 16px;
  color: #ee0a24;
  font-weight: 500;
}

.booking-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style> 
