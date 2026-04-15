<template>
  <div class="booking-list-page">
    <van-nav-bar
      title="我的预约"
      left-arrow
      @click-left="$router.back()"
    />
    
    <div class="booking-tabs">
      <van-tabs v-model:active="activeTab" sticky swipeable>
        <van-tab title="全部">
          <booking-list-content :status="null" />
        </van-tab>
        <van-tab title="待处理">
          <booking-list-content status="pending" />
        </van-tab>
        <van-tab title="已确认">
          <booking-list-content status="confirmed" />
        </van-tab>
        <van-tab title="已完成">
          <booking-list-content status="completed" />
        </van-tab>
        <van-tab title="已取消">
          <booking-list-content status="cancelled" />
        </van-tab>
      </van-tabs>
    </div>
    
    <div class="booking-button">
      <van-button 
        type="primary" 
        block 
        round 
        @click="$router.push('/install-booking')"
      >
        预约新安装
      </van-button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import BookingListContent from './components/BookingListContent.vue'

export default {
  name: 'BookingList',
  components: {
    BookingListContent
  },
  setup() {
    const route = useRoute()
    const activeTab = ref(0)
    
    // 初始化 - 从URL参数获取状态
    onMounted(() => {
      const tabStatus = route.query.status
      if (tabStatus) {
        const statusMap = {
          'pending': 1,
          'confirmed': 2,
          'completed': 3,
          'cancelled': 4
        }
        if (statusMap[tabStatus] !== undefined) {
          activeTab.value = statusMap[tabStatus]
        }
      }
    })
    
    return {
      activeTab
    }
  }
}
</script>

<style scoped>
.booking-list-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 70px;
}

.booking-tabs {
  margin-bottom: 20px;
}

.booking-button {
  position: fixed;
  bottom: 20px;
  left: 0;
  right: 0;
  padding: 0 16px;
  z-index: 10;
}
</style> 