<template>
  <div class="payment-container">
    <NavBar
      title="支付管理"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />
    
    <div class="payment-content">
      <!-- 支付方式设置 -->
      <div class="payment-section">
        <Cell center title="微信支付">
          <template #icon>
            <Icon name="wechat-pay" class="cell-icon wechat" />
          </template>
          <template #right-icon>
            <Tag type="primary" size="medium">已启用</Tag>
          </template>
        </Cell>
        
        <Cell center title="支付宝支付">
          <template #icon>
            <Icon name="alipay" class="cell-icon alipay" />
          </template>
          <template #right-icon>
            <Tag type="primary" size="medium">已启用</Tag>
          </template>
        </Cell>
        
        <!-- 暂时隐藏积分支付，因为积分兑换链路还未开发完成 -->
        <!--
        <Cell center title="积分支付">
          <template #icon>
            <Icon name="points" class="cell-icon points" />
          </template>
          <template #right-icon>
            <Switch v-model="enablePointsPayment" size="24" @change="handlePointsPaymentChange" />
          </template>
        </Cell>
        -->
        
        <Cell center title="消费券支付">
          <template #icon>
            <Icon name="coupon-o" class="cell-icon coupon" />
          </template>
          <template #right-icon>
            <Switch v-model="enableCouponPayment" size="24" @change="handleCouponPaymentChange" />
          </template>
        </Cell>
      </div>
      
      <!-- 说明 -->
      <div class="payment-tips">
        <div class="tips-title">温馨提示：</div>
        <div class="tips-item">1. 微信支付和支付宝支付为默认支付方式，不可关闭</div>
        <!-- 暂时隐藏积分支付说明，因为积分兑换链路还未开发完成 -->
        <!-- <div class="tips-item">2. 启用积分支付后，用户可使用积分抵扣部分商品金额</div> -->
        <div class="tips-item">2. 启用消费券支付后，用户可使用消费券抵扣特定商品</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, Cell, Icon, Tag, Switch, Toast } from 'vant'
import { getUserPaymentSettings, updateUserPaymentSettings } from '@/api/user'

const router = useRouter()
const { proxy } = getCurrentInstance() // 获取组件实例

// 支付方式开关状态
const enablePointsPayment = ref(true) // 默认开启
const enableCouponPayment = ref(false) // 默认关闭

// 加载用户支付设置
const loadPaymentSettings = async () => {
  try {
    // 尝试从本地存储读取设置
    const localSettings = localStorage.getItem('payment_settings')
    
    if (localSettings) {
      const settings = JSON.parse(localSettings)
      enablePointsPayment.value = settings.enablePointsPayment !== undefined ? settings.enablePointsPayment : true
      enableCouponPayment.value = settings.enableCouponPayment !== undefined ? settings.enableCouponPayment : false
      return
    }
    
    // TODO: 如果后端API已实现，可通过API获取用户支付设置
    /*
    const res = await getUserPaymentSettings()
    if (res.code === 0 && res.data) {
      enablePointsPayment.value = res.data.enable_points_payment === '1'
      enableCouponPayment.value = res.data.enable_coupon_payment === '1'
    }
    */
    
  } catch (error) {
    console.error('获取支付设置失败', error)
    Toast('获取支付设置失败，已加载默认配置')
  }
}

// 保存用户支付设置
const savePaymentSettings = async () => {
  try {
    // 保存到本地存储
    localStorage.setItem('payment_settings', JSON.stringify({
      enablePointsPayment: enablePointsPayment.value,
      enableCouponPayment: enableCouponPayment.value
    }))
    
    // TODO: 如果后端API已实现，可通过API保存用户支付设置
    /*
    await updateUserPaymentSettings({
      enable_points_payment: enablePointsPayment.value ? '1' : '0',
      enable_coupon_payment: enableCouponPayment.value ? '1' : '0'
    })
    */
    
  } catch (error) {
    console.error('保存支付设置失败', error)
    Toast({ type: 'fail', message: '保存支付设置失败' })
  }
}

// 处理积分支付状态变更
const handlePointsPaymentChange = (checked) => {
  enablePointsPayment.value = checked
  savePaymentSettings()
  Toast(checked ? '已启用积分支付' : '已关闭积分支付')
}

// 处理消费券支付状态变更
const handleCouponPaymentChange = (checked) => {
  enableCouponPayment.value = checked
  savePaymentSettings()
  Toast(checked ? '已启用消费券支付' : '已关闭消费券支付')
}

// 页面加载时获取数据
onMounted(() => {
  console.log('支付管理页面加载')
  loadPaymentSettings()
  
  // 强制隐藏底部导航
  const tabbarElements = document.querySelectorAll('.van-tabbar, .tab-bar-container, .tabbar-placeholder, .van-tabbar--fixed')
  tabbarElements.forEach(el => {
    if (el) {
      el.style.display = 'none'
    }
  })
  
  // 使用全局方法刷新TabBar状态
  if (proxy && proxy.$refreshTabBar) {
    proxy.$refreshTabBar()
    
    // 为了处理可能的延迟加载，延迟一段时间后再次刷新
    setTimeout(() => {
      proxy.$refreshTabBar()
    }, 500)
  }
})
</script>

<style scoped>
.payment-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.payment-content {
  padding-bottom: 30px;
}

.payment-section {
  margin: 12px 0;
  background: #fff;
}

.cell-icon {
  margin-right: 5px;
  font-size: 24px;
}

.wechat {
  color: #07c160;
}

.alipay {
  color: #1989fa;
}

.points {
  color: #ff9500;
}

.coupon {
  color: #ee0a24;
}

.payment-tips {
  margin: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
}

.tips-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #323233;
}

.tips-item {
  font-size: 13px;
  color: #969799;
  line-height: 1.5;
  margin-bottom: 4px;
}
</style> 