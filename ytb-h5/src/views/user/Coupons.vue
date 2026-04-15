<template>
  <div class="coupons-container">
    <NavBar
      title="我的优惠券"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />
    
    <div class="coupons-content">
      <!-- 顶部标签页 -->
      <Tabs v-model:active="activeTab" sticky>
        <Tab title="未使用" name="unused">
          <CouponList
            :coupons="unusedCoupons"
            :loading="loading"
            empty-image="https://img.itapgo.com/profile/empty-coupon.png"
            @use="handleUseCoupon"
          />
        </Tab>
        <Tab title="已使用" name="used">
          <CouponList
            :coupons="usedCoupons"
            :loading="loading"
            empty-image="https://img.itapgo.com/profile/empty-coupon.png"
          />
        </Tab>
        <Tab title="已过期" name="expired">
          <CouponList
            :coupons="expiredCoupons"
            :loading="loading"
            empty-image="https://img.itapgo.com/profile/empty-coupon.png"
          />
        </Tab>
      </Tabs>
      
      <!-- 底部按钮 -->
      <div class="coupons-footer">
        <Button round block type="primary" @click="goToMall">
          去领券中心
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, Button, Tabs, Tab, Toast } from 'vant'
import CouponList from './components/CouponList.vue'

const router = useRouter()
const activeTab = ref('unused')
const loading = ref(false)

// 所有优惠券数据
const coupons = ref([
  // 示例数据，真实项目中应从API获取
  {
    id: '1',
    name: '新人专享券',
    condition: '无使用门槛',
    value: 10,
    valueDesc: '¥10',
    unitDesc: '元',
    description: '首次下单可用',
    startAt: 1649433600000, // 2022-04-09
    endAt: 1654905600000,   // 2022-06-11
    status: 0, // 0: 未使用, 1: 已使用, 2: 已过期
    reason: ''
  },
  {
    id: '2',
    name: '满减优惠券',
    condition: '满100元可用',
    value: 20,
    valueDesc: '¥20',
    unitDesc: '元',
    description: '指定商品可用',
    startAt: 1649433600000, // 2022-04-09
    endAt: 1651507200000,   // 2022-05-03 (已过期)
    status: 2, // 已过期
    reason: '已过期'
  },
  {
    id: '3',
    name: '商品折扣券',
    condition: '无使用门槛',
    value: 85,
    valueDesc: '8.5',
    unitDesc: '折',
    description: '部分商品不可用',
    startAt: 1649433600000, // 2022-04-09
    endAt: 1654905600000,   // 2022-06-11
    status: 1, // 已使用
    reason: '已使用'
  },
  {
    id: '4',
    name: '会员专享券',
    condition: '无使用门槛',
    value: 15,
    valueDesc: '¥15',
    unitDesc: '元',
    description: 'VIP专享',
    startAt: 1649433600000, // 2022-04-09
    endAt: 1654905600000,   // 2022-06-11
    status: 0, // 未使用
    reason: ''
  },
  {
    id: '5',
    name: '净水器安装券',
    condition: '购买净水器可用',
    value: 120,
    valueDesc: '¥120',
    unitDesc: '元',
    description: '可抵扣安装费',
    startAt: 1649433600000, // 2022-04-09
    endAt: 1654905600000,   // 2022-06-11
    status: 0, // 未使用
    reason: ''
  }
])

// 未使用优惠券列表
const unusedCoupons = computed(() => 
  coupons.value.filter(coupon => coupon.status === 0)
)

// 已使用优惠券列表
const usedCoupons = computed(() => 
  coupons.value.filter(coupon => coupon.status === 1)
)

// 已过期优惠券列表
const expiredCoupons = computed(() => 
  coupons.value.filter(coupon => coupon.status === 2)
)

// 使用优惠券
const handleUseCoupon = (coupon) => {
  router.push('/')
  Toast('前往商城使用优惠券...')
}

// 去领券中心
const goToMall = () => {
  router.push('/')
  Toast('领券中心功能开发中...')
}

// 获取优惠券数据
const fetchCoupons = () => {
  loading.value = true
  
  // 模拟API请求
  setTimeout(() => {
    // 在实际项目中，应该通过API获取优惠券数据
    // coupons.value = res.data
    loading.value = false
  }, 1000)
}

// 页面加载时获取数据
onMounted(() => {
  fetchCoupons()
})
</script>

<style scoped>
.coupons-container {
  min-height: 100vh;
  background-color: #f7f8fa;
  display: flex;
  flex-direction: column;
}

.coupons-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.coupons-footer {
  padding: 16px;
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

:deep(.van-tabs__wrap) {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

:deep(.van-tab--active) {
  color: var(--primary-color);
}

:deep(.van-tabs__line) {
  background-color: var(--primary-color);
}
</style>
