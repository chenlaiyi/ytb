<template>
  <div class="activate-page">
    <van-nav-bar title="设备绑定与激活" left-arrow @click-left="$router.back()" />
    
    <div v-if="loading" style="padding: 20px; text-align: center;">加载中...</div>
    <div v-else-if="order">
      <!-- 订单信息 -->
      <div class="card">
        <div class="card-title">设备信息</div>
        <van-cell-group inset>
          <van-cell title="工单号" :value="order.order_no || '-'" />
          <van-cell title="主板编号" :value="order.board_code || '未录入'" />
          <van-cell title="安装地址" :value="order.install_address" />
        </van-cell-group>
      </div>

      <!-- 确认水质 -->
      <div class="card" v-if="order.water_test">
        <div class="card-title">工程师水质检测报告</div>
        <van-cell-group inset>
          <van-cell title="原水TDS" :value="(order.water_test.tds_before || 0) + ' ppm'" />
          <van-cell title="净水TDS" :value="(order.water_test.tds_after || 0) + ' ppm'" />
        </van-cell-group>
        <div class="water-test-ok">
          <van-icon name="checked" color="#07c160" /> 水质合格，您可以放心激活
        </div>
      </div>

      <!-- 选择套餐 -->
      <div class="card">
        <div class="card-title">选择使用套餐</div>
        <van-radio-group v-model="selectedPackage">
          <van-cell-group inset>
            <van-cell v-for="plan in plans" :key="plan.code" :title="plan.name" :label="plan.desc" clickable @click="selectedPackage = plan.code">
              <template #right-icon>
                <van-radio :name="plan.code" />
              </template>
            </van-cell>
          </van-cell-group>
        </van-radio-group>
      </div>
      
      <!-- 费用明细 -->
      <div class="card">
        <div class="card-title">费用明细</div>
        <van-cell-group inset>
          <van-cell title="套餐费用" :value="'¥' + packagePrice" />
          <van-cell v-if="order.accessory_order_id && !order.accessory_paid" title="额外配件费" :value="'¥' + (order.accessory?.total_amount || 0)" />
        </van-cell-group>
        <div class="total-bar">
          <span class="total-label">实付总计</span>
          <span class="price">¥{{ totalPrice }}</span>
        </div>
      </div>
      
      <div class="agree-box">
        <van-checkbox v-model="agreed" shape="square" icon-size="14px">
          我已确认水质检测结果，并同意《设备买卖与服务协议》
        </van-checkbox>
      </div>

      <!-- 激活按钮 -->
      <div class="action-btn">
        <van-button type="primary" block round @click="handleActivate" :loading="activating">立即支付并激活</van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showSuccessToast, showLoadingToast, closeToast } from 'vant'
import installationApi from '@/api/installation'

const route = useRoute()
const router = useRouter()
const orderId = route.params.id

const loading = ref(true)
const activating = ref(false)
const order = ref(null)
const plans = ref([])
const selectedPackage = ref('')
const agreed = ref(false)

const packagePrice = computed(() => {
  const plan = plans.value.find(p => p.code === selectedPackage.value)
  return plan ? Number(plan.price) || 0 : 0
})

const totalPrice = computed(() => {
  let accessoryFee = 0
  if (order.value && order.value.accessory_order_id && !order.value.accessory_paid) {
    accessoryFee = Number(order.value.accessory?.total_amount || 0)
  }
  return packagePrice.value + accessoryFee
})

const loadOrder = async () => {
  try {
    const res = await installationApi.getBookingDetail(orderId)
    if (res.code === 0) {
      order.value = res.data
      
      // 预选工单的套餐
      if (order.value.package_type) {
        selectedPackage.value = order.value.package_type
      }
    } else {
      showToast(res.message || '加载详情失败')
    }
  } catch (error) {
    showToast('加载失败')
  }
}

const loadPlans = async () => {
  try {
    const res = await installationApi.getInstallationPlans()
    if (res.code === 0) {
      // 过滤出流量套餐和包年套餐
      const list = res.data.list || res.data || []
      // 根据用户要求，固定：一个流量套餐：980元/4000升、一个包年套餐：1200元/年
      // 这里为了适配之前数据库返回的形式，可能覆盖，也可能直接写死以确保体验。
      // 为展示一致，直接取API提供，或合并展示。
      plans.value = [
        { code: 'traffic_4000', name: '流量套餐', desc: '980元/4000升流量，水质好', price: 980 },
        { code: 'annual_1200', name: '包年套餐', desc: '1200元/年，不限量畅饮', price: 1200 }
      ]
      
      if (!selectedPackage.value) {
        selectedPackage.value = plans.value[0].code
      }
    }
  } catch (err) {
    console.error(err)
  }
}

onMounted(async () => {
  if (!orderId) {
    showToast('缺少参数')
    return
  }
  await loadPlans()
  await loadOrder()
  loading.value = false
})

const handleActivate = async () => {
  if (!selectedPackage.value) {
    return showToast('请选择套餐')
  }
  if (!agreed.value) {
    return showToast('请先勾选同意协议并确认水质')
  }

  activating.value = true
  showLoadingToast({ message: '发起支付...', duration: 0 })

  // 这里做个模拟延迟，当作是拉起了微信支付并成功
  setTimeout(async () => {
    try {
      showLoadingToast({ message: '激活设备中...', duration: 0 })
      const res = await installationApi.activateInstall(orderId, { package_type: selectedPackage.value })
      closeToast()
      if (res.code === 0) {
        showSuccessToast('设备激活成功！')
        setTimeout(() => {
          router.replace('/device-list') // 返回我的设备列表
        }, 1500)
      } else {
        showToast(res.message || '激活失败')
      }
    } catch (e) {
      closeToast()
      showToast('激活请求失败')
    } finally {
      activating.value = false
    }
  }, 1000)
}
</script>

<style scoped>
.activate-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 30px;
}
.card {
  margin: 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  overflow: hidden;
}
.card-title {
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 600;
  border-bottom: 1px solid #f5f5f5;
  color: #333;
}
.water-test-ok {
  background: #f6ffed;
  color: #389e0d;
  padding: 12px 16px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.total-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-top: 1px solid #f5f5f5;
}
.total-label {
  font-weight: bold;
}
.price {
  font-size: 20px;
  color: #ee0a24;
  font-weight: bold;
}
.agree-box {
  padding: 0 16px;
  margin: 16px 0;
  font-size: 12px;
  color: #666;
}
.action-btn {
  padding: 0 16px;
  margin-top: 24px;
}
</style>
