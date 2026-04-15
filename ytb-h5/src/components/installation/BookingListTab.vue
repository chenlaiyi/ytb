<template>
  <div class="booking-list-tab">
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model="loading"
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
              <span class="value">{{ formatDate(booking.install_time) }}</span>
            </div>
          </div>
          
          <div class="booking-footer">
            <span class="booking-time">{{ formatDateTime(booking.created_at) }}</span>
            <span class="booking-amount">¥{{ booking.total_amount.toFixed(2) }}</span>
          </div>
          
          <div v-if="booking.status === 'pending' || booking.status === 'confirmed'" class="booking-actions">
            <van-button type="danger" size="small" plain @click.stop="cancelBooking(booking.id)">取消预约</van-button>
          </div>
        </div>
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script>
import { formatDate, formatDateTime } from '@/utils/date.js'

export default {
  name: 'BookingListTab',
  props: {
    status: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      page: 1,
      limit: 10,
      bookingList: [],
      loading: false,
      finished: false,
      refreshing: false,
      error: false
    }
  },
  watch: {
    status() {
      this.reset()
      this.onLoad()
    }
  },
  methods: {
    formatDate,
    formatDateTime,
    reset() {
      this.page = 1
      this.bookingList = []
      this.loading = false
      this.finished = false
      this.error = false
    },
    onRefresh() {
      this.reset()
      this.onLoad()
    },
    onLoad() {
      this.loading = true
      this.error = false
      
      // 构建查询参数
      const params = {
        page: this.page,
        limit: this.limit
      }
      
      if (this.status) {
        params.status = this.status
      }
      
      this.$http.get('/api/installation/list_bookings.php', { params })
        .then(res => {
          if (res.data.code === 0) {
            const { list, pagination } = res.data.data
            
            // 如果是刷新，则清空数组
            if (this.refreshing) {
              this.bookingList = []
            }
            
            // 添加新数据
            this.bookingList.push(...list)
            
            // 判断是否已加载完全部数据
            if (this.page >= pagination.pages) {
              this.finished = true
            } else {
              this.page += 1
            }
          } else {
            this.error = true
            this.$toast(res.data.message || '获取预约列表失败')
          }
        })
        .catch(err => {
          console.error('获取预约列表错误:', err)
          this.error = true
          this.$toast('网络错误，请稍后重试')
        })
        .finally(() => {
          this.loading = false
          this.refreshing = false
        })
    },
    goToDetail(bookingId) {
      this.$router.push(`/installation/booking-detail/${bookingId}`)
    },
    cancelBooking(bookingId) {
      this.$dialog.confirm({
        title: '取消预约',
        message: '确定要取消此次安装预约吗？',
        confirmButtonText: '确定取消',
        cancelButtonText: '再想想'
      }).then(() => {
        // 用户点击确定，执行取消操作
        this.$http.post('/api/installation/cancel_booking.php', {
          booking_id: bookingId
        }).then(res => {
          if (res.data.code === 0) {
            this.$toast.success('预约已取消')
            // 刷新列表
            this.reset()
            this.onLoad()
          } else {
            this.$toast(res.data.message || '取消预约失败')
          }
        }).catch(err => {
          console.error('取消预约错误:', err)
          this.$toast('网络错误，请稍后重试')
        })
      }).catch(() => {
        // 用户点击取消，不做任何操作
      })
    }
  }
}
</script>

<style scoped>
.booking-list-tab {
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