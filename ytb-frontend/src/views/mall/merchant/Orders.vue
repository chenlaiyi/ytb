<template>
  <div class="merchant-orders">
    <van-nav-bar title="商户订单管理" left-arrow @click-left="$router.go(-1)" />
    
    <!-- 搜索筛选 -->
    <div class="search-section">
      <van-search
        v-model="searchForm.keyword"
        placeholder="搜索订单号、商户名称"
        @search="handleSearch"
        @clear="handleClear"
      />
      
      <van-dropdown-menu>
        <van-dropdown-item v-model="searchForm.status" :options="statusOptions" @change="handleSearch" />
        <van-dropdown-item v-model="searchForm.merchant_id" :options="merchantOptions" @change="handleSearch" />
        <van-dropdown-item v-model="searchForm.date_range" :options="dateRangeOptions" @change="handleSearch" />
      </van-dropdown-menu>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <van-grid :column-num="4" :border="false">
        <van-grid-item>
          <div class="stat-card">
            <div class="stat-number">{{ stats.total || 0 }}</div>
            <div class="stat-label">总订单</div>
          </div>
        </van-grid-item>
        <van-grid-item>
          <div class="stat-card">
            <div class="stat-number">{{ stats.today || 0 }}</div>
            <div class="stat-label">今日订单</div>
          </div>
        </van-grid-item>
        <van-grid-item>
          <div class="stat-card">
            <div class="stat-number">{{ stats.pending || 0 }}</div>
            <div class="stat-label">待处理</div>
          </div>
        </van-grid-item>
        <van-grid-item>
          <div class="stat-card">
            <div class="stat-number">¥{{ stats.total_amount || 0 }}</div>
            <div class="stat-label">总金额</div>
          </div>
        </van-grid-item>
      </van-grid>
    </div>

    <!-- 订单列表 -->
    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="loadOrders"
    >
      <div v-for="order in orders" :key="order.id" class="order-item">
        <van-cell-group>
          <van-cell>
            <template #title>
              <div class="order-header">
                <span class="order-no">订单号：{{ order.order_no }}</span>
                <van-tag :type="getStatusType(order.status)">{{ getStatusText(order.status) }}</van-tag>
              </div>
            </template>
            <template #label>
              <div class="order-info">
                <div>商户：{{ order.merchant_name || '未知' }}</div>
                <div>用户：{{ order.user_phone || '未知' }}</div>
                <div>下单时间：{{ formatDate(order.created_at) }}</div>
              </div>
            </template>
          </van-cell>
          
          <!-- 订单商品 -->
          <van-cell v-for="item in order.items" :key="item.id">
            <template #icon>
              <van-image
                :src="item.goods_image || '/images/default-product.png'"
                width="60"
                height="60"
                fit="cover"
                class="goods-image"
              />
            </template>
            <template #title>
              <div class="goods-info">
                <div class="goods-name">{{ item.goods_name }}</div>
                <div class="goods-spec">{{ item.goods_spec || '' }}</div>
              </div>
            </template>
            <template #value>
              <div class="goods-price">
                <div>¥{{ item.goods_price }}</div>
                <div>x{{ item.goods_num }}</div>
              </div>
            </template>
          </van-cell>
          
          <van-cell>
            <template #title>
              <div class="order-total">
                <span>订单总额：¥{{ order.total_amount }}</span>
                <span class="merchant-commission">
                  (商户收入：¥{{ calculateMerchantIncome(order) }})
                </span>
              </div>
            </template>
            <template #value>
              <div class="order-actions">
                <van-button size="small" type="primary" @click="viewOrder(order)">查看详情</van-button>
                <van-button 
                  v-if="order.status === 1" 
                  size="small" 
                  type="success" 
                  @click="confirmOrder(order)"
                >
                  确认订单
                </van-button>
                <van-button 
                  v-if="order.status === 2" 
                  size="small" 
                  type="warning" 
                  @click="shipOrder(order)"
                >
                  发货
                </van-button>
              </div>
            </template>
          </van-cell>
        </van-cell-group>
      </div>
    </van-list>

    <!-- 订单详情弹窗 -->
    <van-popup v-model:show="showOrderDetail" position="bottom" :style="{ height: '80%' }">
      <div class="order-detail" v-if="currentOrder">
        <van-nav-bar title="订单详情" left-arrow @click-left="showOrderDetail = false" />
        <!-- 订单详情内容 -->
        <div class="detail-content">
          <van-cell-group title="订单信息">
            <van-cell title="订单号" :value="currentOrder.order_no" />
            <van-cell title="订单状态" :value="getStatusText(currentOrder.status)" />
            <van-cell title="下单时间" :value="formatDate(currentOrder.created_at)" />
            <van-cell title="商户名称" :value="currentOrder.merchant_name || '未知'" />
            <van-cell title="用户手机" :value="currentOrder.user_phone || '未知'" />
          </van-cell-group>
          
          <van-cell-group title="收货信息" v-if="currentOrder.address">
            <van-cell title="收货人" :value="currentOrder.address.name" />
            <van-cell title="联系电话" :value="currentOrder.address.phone" />
            <van-cell title="收货地址" :value="currentOrder.address.full_address" />
          </van-cell-group>
          
          <van-cell-group title="商品信息">
            <van-cell v-for="item in currentOrder.items" :key="item.id">
              <template #icon>
                <van-image
                  :src="item.goods_image || '/images/default-product.png'"
                  width="50"
                  height="50"
                  fit="cover"
                />
              </template>
              <template #title>
                <div>{{ item.goods_name }}</div>
                <div class="goods-spec">{{ item.goods_spec || '' }}</div>
              </template>
              <template #value>
                <div>¥{{ item.goods_price }} x{{ item.goods_num }}</div>
              </template>
            </van-cell>
          </van-cell-group>
          
          <van-cell-group title="费用明细">
            <van-cell title="商品总额" :value="`¥${currentOrder.goods_amount || 0}`" />
            <van-cell title="运费" :value="`¥${currentOrder.shipping_fee || 0}`" />
            <van-cell title="优惠金额" :value="`-¥${currentOrder.discount_amount || 0}`" />
            <van-cell title="平台手续费" :value="`¥${currentOrder.platform_fee || 0}`" />
            <van-cell title="实付金额" :value="`¥${currentOrder.total_amount}`" />
            <van-cell title="商户收入" :value="`¥${calculateMerchantIncome(currentOrder)}`" />
          </van-cell-group>
          
          <van-cell-group title="商户信息" v-if="currentOrder.merchant">
            <van-cell title="商户ID" :value="currentOrder.merchant.id" />
            <van-cell title="商户名称" :value="currentOrder.merchant.name" />
            <van-cell title="联系电话" :value="currentOrder.merchant.phone" />
            <van-cell title="商户状态" :value="currentOrder.merchant.status === 'active' ? '正常' : '禁用'" />
          </van-cell-group>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { mallMerchantApi } from '@/api/v1/mall'
import { showToast, showConfirmDialog } from '@/utils/vant-compat'

export default {
  name: 'MerchantOrders',
  setup() {
    const loading = ref(false)
    const finished = ref(false)
    const orders = ref([])
    const stats = ref({})
    const showOrderDetail = ref(false)
    const currentOrder = ref(null)
    const merchantOptions = ref([{ text: '全部商户', value: '' }])
    
    const searchForm = reactive({
      keyword: '',
      status: '',
      merchant_id: '',
      date_range: '',
      page: 1
    })

    const statusOptions = [
      { text: '全部状态', value: '' },
      { text: '待付款', value: '0' },
      { text: '待确认', value: '1' },
      { text: '待发货', value: '2' },
      { text: '已发货', value: '3' },
      { text: '已完成', value: '4' },
      { text: '已取消', value: '5' }
    ]

    const dateRangeOptions = [
      { text: '全部时间', value: '' },
      { text: '今天', value: 'today' },
      { text: '昨天', value: 'yesterday' },
      { text: '最近7天', value: '7days' },
      { text: '最近30天', value: '30days' }
    ]

    // 加载订单列表
    const loadOrders = async () => {
      if (loading.value) return
      
      loading.value = true
      try {
        const params = {
          ...searchForm,
          per_page: 20
        }
        
        const response = await mallMerchantApi.getMerchantOrders(params)
        
        if (searchForm.page === 1) {
          orders.value = response.data.data
        } else {
          orders.value.push(...response.data.data)
        }
        
        finished.value = response.data.current_page >= response.data.last_page
        searchForm.page++
      } catch (error) {
        console.error('加载订单失败:', error)
        showToast('加载订单失败')
      } finally {
        loading.value = false
      }
    }

    // 加载统计数据
    const loadStats = async () => {
      try {
        const response = await mallMerchantApi.dashboard()
        stats.value = response.data.orders || {}
      } catch (error) {
        console.error('加载统计数据失败:', error)
      }
    }

    // 加载商户选项
    const loadMerchantOptions = async () => {
      try {
        const response = await mallMerchantApi.getMerchants({ per_page: 100 })
        const merchants = response.data.data || []
        merchantOptions.value = [
          { text: '全部商户', value: '' },
          ...merchants.map(merchant => ({
            text: merchant.name,
            value: merchant.id
          }))
        ]
      } catch (error) {
        console.error('加载商户选项失败:', error)
      }
    }

    // 搜索
    const handleSearch = () => {
      searchForm.page = 1
      finished.value = false
      orders.value = []
      loadOrders()
    }

    // 清空搜索
    const handleClear = () => {
      searchForm.keyword = ''
      handleSearch()
    }

    // 查看订单详情
    const viewOrder = (order) => {
      currentOrder.value = order
      showOrderDetail.value = true
    }

    // 确认订单
    const confirmOrder = async (order) => {
      try {
        await showConfirmDialog({
          title: '确认订单',
          message: '确定要确认这个订单吗？'
        })
        
        await mallMerchantApi.updateOrderStatus(order.id, { status: 2 })
        showToast('订单确认成功')
        
        // 更新订单状态
        order.status = 2
      } catch (error) {
        if (error !== 'cancel') {
          console.error('确认订单失败:', error)
          showToast('确认订单失败')
        }
      }
    }

    // 发货
    const shipOrder = async (order) => {
      try {
        await showConfirmDialog({
          title: '订单发货',
          message: '确定要将此订单标记为已发货吗？'
        })
        
        await mallMerchantApi.updateOrderStatus(order.id, { status: 3 })
        showToast('发货成功')
        
        // 更新订单状态
        order.status = 3
      } catch (error) {
        if (error !== 'cancel') {
          console.error('发货失败:', error)
          showToast('发货失败')
        }
      }
    }

    // 计算商户收入
    const calculateMerchantIncome = (order) => {
      const totalAmount = parseFloat(order.total_amount || 0)
      const platformFee = parseFloat(order.platform_fee || 0)
      return (totalAmount - platformFee).toFixed(2)
    }

    // 获取状态类型
    const getStatusType = (status) => {
      const types = {
        0: 'warning',
        1: 'primary',
        2: 'success',
        3: 'default',
        4: 'success',
        5: 'danger'
      }
      return types[status] || 'default'
    }

    // 获取状态文本
    const getStatusText = (status) => {
      const texts = {
        0: '待付款',
        1: '待确认',
        2: '待发货',
        3: '已发货',
        4: '已完成',
        5: '已取消'
      }
      return texts[status] || '未知'
    }

    // 格式化日期
    const formatDate = (date) => {
      if (!date) return ''
      return new Date(date).toLocaleString('zh-CN')
    }

    onMounted(() => {
      loadStats()
      loadMerchantOptions()
      loadOrders()
    })

    return {
      loading,
      finished,
      orders,
      stats,
      searchForm,
      statusOptions,
      merchantOptions,
      dateRangeOptions,
      showOrderDetail,
      currentOrder,
      loadOrders,
      handleSearch,
      handleClear,
      viewOrder,
      confirmOrder,
      shipOrder,
      calculateMerchantIncome,
      getStatusType,
      getStatusText,
      formatDate
    }
  }
}
</script>

<style scoped>
.merchant-orders {
  background-color: #f7f8fa;
  min-height: 100vh;
}

.search-section {
  background: white;
  padding: 16px;
  margin-bottom: 8px;
}

.stats-cards {
  background: white;
  margin-bottom: 8px;
}

.stat-card {
  text-align: center;
  padding: 16px 0;
}

.stat-number {
  font-size: 20px;
  font-weight: bold;
  color: #323233;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #969799;
}

.order-item {
  background: white;
  margin-bottom: 8px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-no {
  font-size: 14px;
  font-weight: bold;
}

.order-info {
  margin-top: 4px;
  font-size: 12px;
  color: #969799;
}

.order-info div {
  margin-bottom: 2px;
}

.goods-image {
  border-radius: 4px;
  margin-right: 12px;
}

.goods-info {
  flex: 1;
}

.goods-name {
  font-size: 14px;
  color: #323233;
  margin-bottom: 4px;
}

.goods-spec {
  font-size: 12px;
  color: #969799;
}

.goods-price {
  text-align: right;
  font-size: 14px;
}

.order-total {
  font-weight: bold;
  color: #ee0a24;
}

.merchant-commission {
  font-size: 12px;
  color: #07c160;
  margin-left: 8px;
}

.order-actions {
  display: flex;
  gap: 8px;
}

.detail-content {
  padding: 16px;
}

.detail-content .van-cell-group {
  margin-bottom: 16px;
}
</style> 