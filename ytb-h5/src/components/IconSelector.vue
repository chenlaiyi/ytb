<template>
  <div class="icon-selector">
    <div class="icon-selector-input" @click="toggleSelector">
      <van-icon v-if="modelValue" :name="modelValue" class="selected-icon" />
      <div v-else class="placeholder">{{ placeholder }}</div>
      <van-icon name="arrow-down" class="arrow-icon" />
    </div>
    
    <van-popup v-model:show="showSelector" position="bottom" round :style="{ height: '60%' }">
      <div class="popup-header">
        <div class="popup-title">选择图标</div>
        <van-icon name="cross" class="close-icon" @click="showSelector = false" />
      </div>
      
      <div class="search-box">
        <van-field
          v-model="searchText"
          placeholder="搜索图标"
          left-icon="search"
          clearable
          @input="filterIcons"
        />
      </div>
      
      <div class="icons-container">
        <div
          v-for="icon in filteredIcons"
          :key="icon"
          class="icon-item"
          :class="{ active: modelValue === icon }"
          @click="selectIcon(icon)"
        >
          <van-icon :name="icon" />
          <div class="icon-name">{{ icon }}</div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Icon as VanIcon, Popup as VanPopup, Field as VanField } from 'vant'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '选择图标'
  }
})

const emit = defineEmits(['update:modelValue'])

const showSelector = ref(false)
const searchText = ref('')

// 预设的Vant图标列表
const iconsList = [
  'add-o', 'after-sale', 'aim', 'alipay', 'apps-o', 'arrow', 'arrow-down', 'arrow-left', 'arrow-up',
  'ascending', 'audio', 'award-o', 'back-top', 'bag-o', 'balance-list-o', 'balance-o', 'balance-pay',
  'bar-chart-o', 'bars', 'bell', 'bill-o', 'birthday-cake-o', 'bookmark-o', 'browsing-history-o',
  'brush-o', 'bulb-o', 'bullhorn-o', 'calendar-o', 'card', 'cart-o', 'cash-back-record', 'cash-o',
  'certificate', 'chart-trending-o', 'chat-o', 'checked', 'circle', 'clear', 'clock-o', 'close',
  'closed-eye', 'cluster-o', 'column', 'comment-circle-o', 'comment-o', 'completed', 'contact',
  'coupon-o', 'credit-pay', 'cross', 'debit-pay', 'delete', 'delete-o', 'descending', 'description',
  'desktop-o', 'diamond-o', 'diamond', 'discount', 'down', 'ecard-pay', 'edit', 'ellipsis',
  'empty', 'envelop-o', 'exchange', 'expand-o', 'eye-o', 'failure', 'filter-o', 'fire-o',
  'flag-o', 'flower-o', 'font', 'font-o', 'free-postage', 'friends-o', 'gem-o', 'gift-card-o',
  'gift-o', 'gold-coin-o', 'good-job-o', 'good-job', 'goods-collect-o', 'guide-o', 'home-o',
  'hot-o', 'hot-sale-o', 'idcard', 'info-o', 'invition', 'label-o', 'like-o', 'like',
  'live', 'location-o', 'location', 'lock', 'logistics', 'manager-o', 'manager', 'map-marked',
  'medal-o', 'medal', 'minus', 'more-o', 'more', 'music-o', 'new-arrival-o', 'new-o',
  'newspaper-o', 'notes-o', 'notification-o', 'orders-o', 'other-pay', 'paid', 'passed',
  'pause-circle-o', 'pause-circle', 'pause', 'peer-pay', 'pending-payment', 'phone-circle-o',
  'phone-o', 'photo-o', 'photograph', 'play-circle-o', 'play-circle', 'play', 'plus',
  'point-gift-o', 'points', 'printer', 'qr-invalid', 'qr', 'question-o', 'question',
  'records', 'refund-o', 'replay', 'scan', 'search', 'send-gift-o', 'service-o', 'setting-o',
  'setting', 'share-o', 'share', 'shop-collect-o', 'shop-o', 'shopping-cart-o', 'shopping-o',
  'shrink', 'sign', 'smile-comment-o', 'smile-o', 'sort', 'star-o', 'star', 'stop-circle-o',
  'stop-circle', 'stop', 'success', 'thumb-circle-o', 'todo-list-o', 'tosend', 'tv-o',
  'umbrella-circle', 'underway-o', 'upgrade', 'user-circle-o', 'user-o', 'video-o',
  'video', 'vip-card-o', 'volume-o', 'wap-home-o', 'wap-nav', 'warn-o', 'warning-o',
  'weapp-nav', 'wechat-pay', 'wechat', 'youzan-shield'
]

// 过滤图标列表
const filteredIcons = computed(() => {
  if (!searchText.value) {
    return iconsList
  }
  
  return iconsList.filter(icon => 
    icon.toLowerCase().includes(searchText.value.toLowerCase())
  )
})

// 切换选择器显示状态
const toggleSelector = () => {
  showSelector.value = !showSelector.value
  if (showSelector.value) {
    searchText.value = ''
  }
}

// 选择图标
const selectIcon = (icon) => {
  emit('update:modelValue', icon)
  showSelector.value = false
}

// 过滤图标
const filterIcons = () => {
  // 已由计算属性处理
}
</script>

<style scoped>
.icon-selector {
  position: relative;
  width: 100%;
}

.icon-selector-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 16px;
  border: 1px solid #dcdee0;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
}

.selected-icon {
  font-size: 20px;
  margin-right: 8px;
}

.placeholder {
  color: #969799;
  flex: 1;
}

.arrow-icon {
  color: #969799;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  position: relative;
  border-bottom: 1px solid #f2f3f5;
}

.popup-title {
  font-size: 16px;
  font-weight: 500;
}

.close-icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  cursor: pointer;
}

.search-box {
  padding: 10px 16px;
  position: sticky;
  top: 0;
  background-color: #fff;
  z-index: 1;
}

.icons-container {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  padding: 16px;
  overflow-y: auto;
  max-height: calc(60vh - 120px);
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid transparent;
}

.icon-item:hover {
  background-color: #f7f8fa;
}

.icon-item.active {
  background-color: #e8f3ff;
  border-color: #1989fa;
}

.icon-item .van-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.icon-name {
  font-size: 12px;
  color: #646566;
  width: 100%;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style> 