<template>
  <div class="branch-orders-container">
    <van-nav-bar
      title="我的订单"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />
    
    <div class="orders-content">
      <!-- 订单状态筛选 -->
      <div class="filter-tabs">
        <div 
          v-for="tab in statusTabs" 
          :key="tab.value"
          :class="['filter-tab', { active: currentStatus === tab.value }]"
          @click="changeStatus(tab.value)"
        >
          <span class="tab-text">{{ tab.label }}</span>
          <span v-if="tab.count > 0" class="tab-badge">{{ tab.count }}</span>
        </div>
      </div>

      <!-- 搜索框 -->
      <div class="search-section">
        <van-search
          v-model="searchKeyword"
          placeholder="搜索订单号或商品名称"
          @search="handleSearch"
          @clear="handleClear"
        />
      </div>

      <!-- 订单列表 -->
      <div class="orders-list" v-if="filteredOrders.length > 0">
        <div 
          v-for="order in filteredOrders" 
          :key="order.id"
          class="order-item"
          @click="showOrderDetail(order)"
        >
          <div class="order-header">
            <div class="order-info">
              <span class="order-number">订单号：{{ order.order_no }}</span>
              <span class="order-time">{{ formatTime(order.created_at) }}</span>
            </div>
            <div class="order-status" :class="getStatusClass(order.status)">
              {{ getStatusText(order.status) }}
            </div>
          </div>
          
          <div class="order-products">
            <div 
              v-for="product in order.products" 
              :key="product.id"
              class="product-item"
            >
              <div class="product-image">
                <van-image
                  :src="product.image || '/images/default-product.png'"
                  width="60"
                  height="60"
                  fit="cover"
                  radius="8"
                >
                  <template #error>
                    <div class="image-placeholder">
                      <van-icon name="photo-o" size="20" />
                    </div>
                  </template>
                </van-image>
              </div>
              <div class="product-info">
                <div class="product-name">{{ product.name }}</div>
                <div class="product-specs">{{ product.specs }}</div>
                <div class="product-price">
                  <span class="price">¥{{ product.price }}</span>
                  <span class="quantity">×{{ product.quantity }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="order-footer">
            <div class="order-total">
              <span class="total-label">共{{ order.total_quantity }}件商品</span>
              <span class="total-amount">合计：¥{{ order.total_amount }}</span>
            </div>
            <div class="order-actions">
              <van-button 
                v-if="order.status === 'pending'"
                size="small" 
                type="danger"
                @click.stop="cancelOrder(order)"
              >
                取消订单
              </van-button>
              <van-button 
                v-if="order.status === 'pending'"
                size="small" 
                type="primary"
                @click.stop="payOrder(order)"
              >
                立即支付
              </van-button>
              <van-button 
                v-if="order.status === 'shipped'"
                size="small" 
                type="primary"
                @click.stop="confirmReceive(order)"
              >
                确认收货
              </van-button>
              <van-button 
                v-if="order.status === 'completed'"
                size="small" 
                plain
                @click.stop="reviewOrder(order)"
              >
                评价
              </van-button>
              <van-button 
                v-if="['cancelled', 'completed'].includes(order.status)"
                size="small" 
                plain
                @click.stop="deleteOrder(order)"
              >
                删除订单
              </van-button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <van-empty :description="getEmptyDescription()" />
      <van-button type="primary" @click="$router.push('/branch/products')">
          去购物
      </van-button>
      </div>
    </div>

    <!-- 订单详情弹窗 -->
    <van-popup v-model:show="showDetailPopup" position="bottom" round>
      <div class="detail-popup">
        <div class="detail-header">
          <h3>订单详情</h3>
          <van-icon name="cross" @click="showDetailPopup = false" />
        </div>
        <div class="detail-content">
          <div class="detail-section">
            <h4>订单信息</h4>
            <div class="detail-item">
              <span class="detail-label">订单号：</span>
              <span class="detail-value">{{ currentOrder.order_no }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">下单时间：</span>
              <span class="detail-value">{{ formatTime(currentOrder.created_at) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">订单状态：</span>
              <span class="detail-value" :class="getStatusClass(currentOrder.status)">
                {{ getStatusText(currentOrder.status) }}
              </span>
            </div>
          </div>
          
          <div class="detail-section" v-if="currentOrder.shipping_address">
            <h4>收货信息</h4>
            <div class="address-info">
              <div class="address-line">
                <span class="name">{{ currentOrder.shipping_address.name }}</span>
                <span class="phone">{{ currentOrder.shipping_address.phone }}</span>
              </div>
              <div class="address-text">{{ currentOrder.shipping_address.address }}</div>
            </div>
          </div>
          
          <div class="detail-section">
            <h4>商品信息</h4>
            <div class="products-detail">
              <div 
                v-for="product in currentOrder.products" 
                :key="product.id"
                class="product-detail-item"
              >
                <div class="product-image">
                  <van-image
                    :src="product.image || '/images/default-product.png'"
                    width="50"
                    height="50"
                    fit="cover"
                    radius="6"
                  />
                </div>
                <div class="product-info">
                  <div class="product-name">{{ product.name }}</div>
                  <div class="product-specs">{{ product.specs }}</div>
                </div>
                <div class="product-price">
                  <div class="price">¥{{ product.price }}</div>
                  <div class="quantity">×{{ product.quantity }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="detail-section">
            <h4>费用明细</h4>
            <div class="cost-detail">
              <div class="cost-item">
                <span>商品总价</span>
                <span>¥{{ currentOrder.goods_amount || '0.00' }}</span>
              </div>
              <div class="cost-item">
                <span>运费</span>
                <span>¥{{ currentOrder.shipping_fee || '0.00' }}</span>
              </div>
              <div class="cost-item">
                <span>优惠金额</span>
                <span class="discount">-¥{{ currentOrder.discount_amount || '0.00' }}</span>
              </div>
              <div class="cost-item total">
                <span>实付金额</span>
                <span class="total-amount">¥{{ currentOrder.total_amount }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getBranchUserOrders } from '@/api/branchUser'
import { showToast, showDialog } from 'vant'

const router = useRouter()

// 状态管理
const currentStatus = ref('all')
const searchKeyword = ref('')
const orders = ref([])
const showDetailPopup = ref(false)
const currentOrder = ref({})

// 状态筛选标签
const statusTabs = ref([
  { label: '全部', value: 'all', count: 0 },
  { label: '待付款', value: 'pending', count: 0 },
  { label: '待发货', value: 'paid', count: 0 },
  { label: '待收货', value: 'shipped', count: 0 },
  { label: '已完成', value: 'completed', count: 0 },
  { label: '已取消', value: 'cancelled', count: 0 }
])

// 筛选后的订单
const filteredOrders = computed(() => {
  let filtered = orders.value

  // 按状态筛选
  if (currentStatus.value !== 'all') {
    filtered = filtered.filter(order => order.status === currentStatus.value)
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(order => 
      order.order_no.toLowerCase().includes(keyword) ||
      order.products.some(product => 
        product.name.toLowerCase().includes(keyword)
      )
    )
  }

  return filtered
})

// 获取状态样式类
const getStatusClass = (status) => {
  const statusMap = {
    'pending': 'pending',
    'paid': 'paid',
    'shipped': 'shipped',
    'completed': 'completed',
    'cancelled': 'cancelled'
  }
  return statusMap[status] || 'pending'
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'pending': '待付款',
    'paid': '待发货',
    'shipped': '待收货',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status] || '未知状态'
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取空状态描述
const getEmptyDescription = () => {
  if (searchKeyword.value) {
    return '未找到相关订单'
  }
  if (currentStatus.value === 'all') {
    return '暂无订单'
  }
  return `暂无${statusTabs.value.find(tab => tab.value === currentStatus.value)?.label}订单`
}

// 切换状态
const changeStatus = (status) => {
  currentStatus.value = status
}

// 搜索处理
const handleSearch = () => {
  // 搜索逻辑已在computed中处理
}

// 清空搜索
const handleClear = () => {
  searchKeyword.value = ''
}

// 显示订单详情
const showOrderDetail = (order) => {
  currentOrder.value = order
  showDetailPopup.value = true
}

// 取消订单
const cancelOrder = async (order) => {
  try {
    const result = await showDialog({
      title: '确认取消',
      message: '确定要取消这个订单吗？'
    })
    
    // 这里调用取消订单API
    showToast.success('订单已取消')
    order.status = 'cancelled'
    updateStatusCounts()
  } catch (error) {
    // 用户取消操作
  }
}

// 支付订单
const payOrder = (order) => {
  showToast('跳转到支付页面...')
  // 这里可以跳转到支付页面
}

// 确认收货
const confirmReceive = async (order) => {
  try {
    const result = await showDialog({
      title: '确认收货',
      message: '确认已收到商品吗？'
    })
    
    // 这里调用确认收货API
    showToast.success('收货成功')
    order.status = 'completed'
    updateStatusCounts()
  } catch (error) {
    // 用户取消操作
  }
}

// 评价订单
const reviewOrder = (order) => {
  showToast('评价功能开发中...')
}

// 删除订单
const deleteOrder = async (order) => {
  try {
    const result = await showDialog({
      title: '确认删除',
      message: '删除后无法恢复，确定要删除这个订单吗？'
    })
    
    // 这里调用删除订单API
    const index = orders.value.findIndex(item => item.id === order.id)
    if (index > -1) {
      orders.value.splice(index, 1)
    }
    showToast.success('订单已删除')
    updateStatusCounts()
  } catch (error) {
    // 用户取消操作
  }
}

// 更新状态计数
const updateStatusCounts = () => {
  statusTabs.value.forEach(tab => {
    if (tab.value === 'all') {
      tab.count = orders.value.length
    } else {
      tab.count = orders.value.filter(order => order.status === tab.value).length
    }
  })
}

// 获取订单列表
const fetchOrders = async () => {
  try {
    const res = await getBranchUserOrders()
    if (res.code === 0 && res.data) {
      orders.value = res.data.map(order => ({
        id: order.id,
        order_no: order.order_no,
        status: order.status,
        total_amount: order.total_amount,
        total_quantity: order.total_quantity,
        goods_amount: order.goods_amount,
        shipping_fee: order.shipping_fee,
        discount_amount: order.discount_amount,
        created_at: order.created_at,
        shipping_address: order.shipping_address,
        products: order.products || []
      }))
      updateStatusCounts()
    }
  } catch (error) {
    console.error('获取订单列表失败', error)
    // 使用模拟数据
    orders.value = [
      {
        id: 1,
        order_no: 'DD2024062501',
        status: 'pending',
        total_amount: '299.00',
        total_quantity: 2,
        goods_amount: '289.00',
        shipping_fee: '10.00',
        discount_amount: '0.00',
        created_at: new Date().toISOString(),
        shipping_address: {
          name: '张三',
          phone: '13888888888',
          address: '广东省深圳市南山区科技园南区'
        },
        products: [
          {
            id: 1,
            name: '净水器滤芯套装',
            specs: 'PP棉+活性炭+RO膜',
            price: '149.00',
            quantity: 2,
            image: '/images/filter-set.jpg'
          }
        ]
      },
      {
        id: 2,
        order_no: 'DD2024062502',
        status: 'shipped',
        total_amount: '1299.00',
        total_quantity: 1,
        goods_amount: '1299.00',
        shipping_fee: '0.00',
        discount_amount: '200.00',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        shipping_address: {
          name: '李四',
          phone: '13999999999',
          address: '北京市朝阳区望京SOHO'
        },
        products: [
          {
            id: 2,
            name: '家用净水器',
            specs: '5级过滤/400G大通量',
            price: '1299.00',
            quantity: 1,
            image: '/images/water-purifier.jpg'
          }
        ]
      }
    ]
    updateStatusCounts()
  }
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.branch-orders-container {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 20px;
}

.orders-content {
  padding: 16px;
}

/* 筛选标签 */
.filter-tabs {
  display: flex;
  background: #fff;
  border-radius: 12px;
  padding: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
  white-space: nowrap;
}

.filter-tab {
  position: relative;
  flex: 1;
  min-width: 60px;
  padding: 8px 12px;
  text-align: center;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
}

.filter-tab.active {
  background-color: #1989fa;
  color: #fff;
}

.tab-text {
  font-size: 14px;
  font-weight: 500;
}

.tab-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background-color: #ff4d4f;
  color: #fff;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 8px;
  min-width: 16px;
  height: 16px;
  line-height: 14px;
  text-align: center;
}

.filter-tab.active .tab-badge {
  background-color: rgba(255, 255, 255, 0.8);
  color: #1989fa;
}

/* 搜索框 */
.search-section {
  margin-bottom: 16px;
}

/* 订单列表 */
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-item {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.order-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.order-number {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
}

.order-time {
  font-size: 12px;
  color: #969799;
}

.order-status {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.order-status.pending {
  background-color: #fff7e6;
  color: #fa8c16;
}

.order-status.paid {
  background-color: #e6f7ff;
  color: #1890ff;
}

.order-status.shipped {
  background-color: #f0f9ff;
  color: #0ea5e9;
}

.order-status.completed {
  background-color: #f6ffed;
  color: #52c41a;
}

.order-status.cancelled {
  background-color: #f5f5f5;
  color: #8c8c8c;
}

/* 商品列表 */
.order-products {
  margin-bottom: 12px;
}

.product-item {
  display: flex;
  gap: 12px;
  padding: 8px 0;
}

.product-item:not(:last-child) {
  border-bottom: 1px solid #f7f8fa;
  margin-bottom: 8px;
  padding-bottom: 12px;
}

.product-image {
  flex-shrink: 0;
}

.image-placeholder {
  width: 60px;
  height: 60px;
  background-color: #f7f8fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c8c9cc;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-name {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 4px;
  line-height: 1.4;
}

.product-specs {
  font-size: 12px;
  color: #969799;
  margin-bottom: 8px;
}

.product-price {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  font-size: 16px;
  font-weight: 600;
  color: #ff4d4f;
}

.quantity {
  font-size: 12px;
  color: #969799;
}

/* 订单底部 */
.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.order-total {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.total-label {
  font-size: 12px;
  color: #969799;
}

.total-amount {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.order-actions {
  display: flex;
  gap: 8px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

/* 详情弹窗 */
.detail-popup {
  padding: 20px;
  max-height: 80vh;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin: 0;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section h4 {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 12px 0;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f7f8fa;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 14px;
  color: #646566;
}

.detail-value {
  font-size: 14px;
  color: #323233;
  font-weight: 500;
}

/* 收货地址 */
.address-info {
  background-color: #f7f8fa;
  padding: 12px;
  border-radius: 8px;
}

.address-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.name {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
}

.phone {
  font-size: 14px;
  color: #646566;
}

.address-text {
  font-size: 14px;
  color: #646566;
  line-height: 1.4;
}

/* 商品详情 */
.products-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.product-detail-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
  background-color: #f7f8fa;
  border-radius: 8px;
}

.product-detail-item .product-info {
  flex: 1;
}

.product-detail-item .product-name {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 4px;
}

.product-detail-item .product-specs {
  font-size: 12px;
  color: #969799;
}

.product-detail-item .product-price {
  text-align: right;
}

.product-detail-item .price {
  font-size: 14px;
  font-weight: 600;
  color: #ff4d4f;
  margin-bottom: 4px;
}

.product-detail-item .quantity {
  font-size: 12px;
  color: #969799;
}

/* 费用明细 */
.cost-detail {
  background-color: #f7f8fa;
  padding: 12px;
  border-radius: 8px;
}

.cost-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.cost-item:not(:last-child) {
  border-bottom: 1px solid #e5e5e5;
}

.cost-item.total {
  font-weight: 600;
  font-size: 16px;
  padding-top: 12px;
  border-top: 2px solid #e5e5e5;
  margin-top: 8px;
}

.discount {
  color: #52c41a;
}

.total-amount {
  color: #ff4d4f;
}

/* 响应式设计 */
@media (max-width: 375px) {
  .orders-content {
    padding: 12px;
  }
  
  .order-item {
    padding: 12px;
  }
  
  .order-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .order-actions {
    justify-content: flex-end;
  }
  
  .detail-popup {
    padding: 16px;
  }
}
</style> 