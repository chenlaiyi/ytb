<template>
  <div class="coupon-list">
    <div v-if="loading" class="loading-container">
      <Loading />
    </div>
    
    <template v-else>
      <!-- 空状态 -->
      <div v-if="coupons.length === 0" class="empty-state">
        <img :src="emptyImage" alt="暂无优惠券" class="empty-image" />
        <p class="empty-text">暂无优惠券</p>
      </div>
      
      <!-- 优惠券列表 -->
      <div v-else class="coupons-wrapper">
        <div
          v-for="coupon in coupons"
          :key="coupon.id"
          class="coupon-item"
          :class="{ 'coupon-used': coupon.status === 1, 'coupon-expired': coupon.status === 2 }"
        >
          <div class="coupon-content">
            <div class="coupon-left">
              <div class="coupon-value">
                <span class="value-prefix" v-if="coupon.unitDesc === '元'">¥</span>
                <span class="value-number">{{ coupon.valueDesc }}</span>
                <span class="value-unit">{{ coupon.unitDesc }}</span>
              </div>
              <div class="coupon-condition">{{ coupon.condition }}</div>
            </div>
            
            <div class="coupon-info">
              <div class="coupon-name">{{ coupon.name }}</div>
              <div class="coupon-desc">{{ coupon.description }}</div>
              <div class="coupon-time">
                {{ formatDate(coupon.startAt) }} - {{ formatDate(coupon.endAt) }}
              </div>
            </div>
            
            <div class="coupon-right">
              <template v-if="coupon.status === 0">
                <button class="use-btn" @click="handleUse(coupon)">去使用</button>
              </template>
              <template v-else>
                <div class="status-tag">{{ coupon.reason }}</div>
              </template>
            </div>
          </div>
          
          <div class="coupon-corner" v-if="coupon.status !== 0">
            <img 
              :src="coupon.status === 1 ? 'https://img.itapgo.com/profile/used.png' : 'https://img.itapgo.com/profile/expired.png'" 
              alt="状态标记"
            />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { Loading } from 'vant'
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  coupons: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  emptyImage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['use'])

// 格式化日期
const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

// 使用优惠券
const handleUse = (coupon) => {
  emit('use', coupon)
}
</script>

<style scoped>
.coupon-list {
  padding: 16px 12px;
  min-height: 300px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.empty-image {
  width: 120px;
  height: 120px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
  color: #999;
}

.coupons-wrapper {
  padding-bottom: 30px;
}

.coupon-item {
  position: relative;
  margin-bottom: 12px;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.coupon-item::before {
  content: '';
  position: absolute;
  left: 30%;
  top: -4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f7f8fa;
  z-index: 1;
}

.coupon-item::after {
  content: '';
  position: absolute;
  left: 30%;
  bottom: -4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f7f8fa;
  z-index: 1;
}

.coupon-content {
  display: flex;
  padding: 16px 12px;
  position: relative;
}

.coupon-content::before {
  content: '';
  position: absolute;
  left: 30%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: repeating-linear-gradient(to bottom, #ddd 0, #ddd 4px, transparent 4px, transparent 8px);
}

.coupon-left {
  width: 30%;
  padding-right: 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.coupon-value {
  color: #ff5500;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 8px;
}

.value-prefix {
  font-size: 16px;
}

.value-number {
  font-size: 28px;
}

.value-unit {
  font-size: 14px;
}

.coupon-condition {
  font-size: 12px;
  color: #999;
}

.coupon-info {
  flex: 1;
  padding-left: 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.coupon-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
}

.coupon-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.coupon-time {
  font-size: 12px;
  color: #999;
}

.coupon-right {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding-left: 12px;
}

.use-btn {
  background: #ff5500;
  color: #fff;
  border: none;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
}

.status-tag {
  font-size: 12px;
  color: #999;
}

.coupon-corner {
  position: absolute;
  top: 0;
  right: 0;
  width: 60px;
  height: 60px;
  overflow: hidden;
}

.coupon-corner img {
  width: 60px;
  height: 60px;
}

/* 已使用样式 */
.coupon-used {
  filter: grayscale(100%);
}

.coupon-used .coupon-value,
.coupon-used .coupon-name,
.coupon-used .coupon-desc {
  color: #999;
}

/* 已过期样式 */
.coupon-expired {
  filter: grayscale(100%);
}

.coupon-expired .coupon-value,
.coupon-expired .coupon-name,
.coupon-expired .coupon-desc {
  color: #999;
}
</style> 