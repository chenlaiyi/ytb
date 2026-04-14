<template>
  <div class="mall-dashboard">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>商城管理总览</h1>
      <p>管理官方商城和商户商城的商品、订单、数据统计</p>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <van-row :gutter="16">
        <van-col :span="6">
          <div class="action-card" @click="$router.push('/mall/official/products')">
            <van-icon name="shop-o" size="24" color="#1989fa" />
            <h3>官方商品管理</h3>
            <p>管理官方商城商品</p>
          </div>
        </van-col>
        <van-col :span="6">
          <div class="action-card" @click="$router.push('/mall/official/orders')">
            <van-icon name="orders-o" size="24" color="#07c160" />
            <h3>官方订单管理</h3>
            <p>处理官方商城订单</p>
          </div>
        </van-col>
        <van-col :span="6">
          <div class="action-card" @click="$router.push('/mall/merchant/products')">
            <van-icon name="shop-collect-o" size="24" color="#ff976a" />
            <h3>商户商品审核</h3>
            <p>审核商户商品</p>
          </div>
        </van-col>
        <van-col :span="6">
          <div class="action-card" @click="$router.push('/mall/merchant/merchants')">
            <van-icon name="manager-o" size="24" color="#ee0a24" />
            <h3>商户管理</h3>
            <p>管理商户信息</p>
          </div>
        </van-col>
      </van-row>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <h2>官方商城统计</h2>
      <van-row :gutter="16">
        <van-col :span="6">
          <div class="stat-card">
            <div class="stat-icon official">
              <van-icon name="shop-o" size="32" />
            </div>
            <div class="stat-content">
              <h3>{{ officialStats.goods?.total || 0 }}</h3>
              <p>商品总数</p>
              <span class="stat-detail">
                上架: {{ officialStats.goods?.on_sale || 0 }} | 
                下架: {{ officialStats.goods?.off_sale || 0 }}
              </span>
            </div>
          </div>
        </van-col>
        <van-col :span="6">
          <div class="stat-card">
            <div class="stat-icon official">
              <van-icon name="orders-o" size="32" />
            </div>
            <div class="stat-content">
              <h3>{{ officialStats.orders?.total || 0 }}</h3>
              <p>订单总数</p>
              <span class="stat-detail">
                今日: {{ officialStats.orders?.today || 0 }} | 
                待处理: {{ officialStats.orders?.pending_payment || 0 }}
              </span>
            </div>
          </div>
        </van-col>
        <van-col :span="6">
          <div class="stat-card">
            <div class="stat-icon official">
              <van-icon name="gold-coin-o" size="32" />
            </div>
            <div class="stat-content">
              <h3>¥{{ formatAmount(officialStats.sales?.total_amount || 0) }}</h3>
              <p>总销售额</p>
              <span class="stat-detail">
                今日: ¥{{ formatAmount(officialStats.sales?.today_amount || 0) }}
              </span>
            </div>
          </div>
        </van-col>
        <van-col :span="6">
          <div class="stat-card">
            <div class="stat-icon official">
              <van-icon name="label-o" size="32" />
            </div>
            <div class="stat-content">
              <h3>{{ officialStats.categories?.total || 0 }}</h3>
              <p>商品分类</p>
              <span class="stat-detail">
                启用: {{ officialStats.categories?.enabled || 0 }} | 
                禁用: {{ officialStats.categories?.disabled || 0 }}
              </span>
            </div>
          </div>
        </van-col>
      </van-row>
    </div>

    <div class="stats-section">
      <h2>商户商城统计</h2>
      <van-row :gutter="16">
        <van-col :span="6">
          <div class="stat-card">
            <div class="stat-icon merchant">
              <van-icon name="manager-o" size="32" />
            </div>
            <div class="stat-content">
              <h3>{{ merchantStats.merchants?.total || 0 }}</h3>
              <p>商户总数</p>
              <span class="stat-detail">
                活跃: {{ merchantStats.merchants?.active || 0 }} | 
                待审核: {{ merchantStats.merchants?.pending || 0 }}
              </span>
            </div>
          </div>
        </van-col>
        <van-col :span="6">
          <div class="stat-card">
            <div class="stat-icon merchant">
              <van-icon name="shop-collect-o" size="32" />
            </div>
            <div class="stat-content">
              <h3>{{ merchantStats.goods?.total || 0 }}</h3>
              <p>商户商品</p>
              <span class="stat-detail">
                上架: {{ merchantStats.goods?.on_sale || 0 }} | 
                待审核: {{ merchantStats.goods?.pending || 0 }}
              </span>
            </div>
          </div>
        </van-col>
        <van-col :span="6">
          <div class="stat-card">
            <div class="stat-icon merchant">
              <van-icon name="orders-o" size="32" />
            </div>
            <div class="stat-content">
              <h3>{{ merchantStats.orders?.total || 0 }}</h3>
              <p>商户订单</p>
              <span class="stat-detail">
                今日: {{ merchantStats.orders?.today || 0 }} | 
                待发货: {{ merchantStats.orders?.pending_ship || 0 }}
              </span>
            </div>
          </div>
        </van-col>
        <van-col :span="6">
          <div class="stat-card">
            <div class="stat-icon merchant">
              <van-icon name="gold-coin-o" size="32" />
            </div>
            <div class="stat-content">
              <h3>¥{{ formatAmount(merchantStats.sales?.total_amount || 0) }}</h3>
              <p>商户销售额</p>
              <span class="stat-detail">
                今日: ¥{{ formatAmount(merchantStats.sales?.today_amount || 0) }}
              </span>
            </div>
          </div>
        </van-col>
      </van-row>
    </div>

    <!-- 最近活动 -->
    <div class="recent-section">
      <van-row :gutter="16">
        <van-col :span="12">
          <div class="recent-card">
            <h3>最近官方订单</h3>
            <div class="recent-list">
              <div v-for="order in recentOfficialOrders" :key="order.id" class="recent-item">
                <div class="item-info">
                  <span class="order-id">{{ order.order_id }}</span>
                  <span class="order-amount">¥{{ order.order_amount }}</span>
                </div>
                <div class="item-meta">
                  <span class="order-time">{{ formatTime(order.create_time) }}</span>
                  <van-tag :type="getOrderStatusType(order.status)">{{ order.status_text }}</van-tag>
                </div>
              </div>
            </div>
          </div>
        </van-col>
        <van-col :span="12">
          <div class="recent-card">
            <h3>最近商户订单</h3>
            <div class="recent-list">
              <div v-for="order in recentMerchantOrders" :key="order.id" class="recent-item">
                <div class="item-info">
                  <span class="order-id">{{ order.order_id }}</span>
                  <span class="order-amount">¥{{ order.order_amount }}</span>
                </div>
                <div class="item-meta">
                  <span class="order-time">{{ formatTime(order.create_time) }}</span>
                  <van-tag :type="getOrderStatusType(order.status)">{{ order.status_text }}</van-tag>
                </div>
              </div>
            </div>
          </div>
        </van-col>
      </van-row>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { mallOfficialApi, mallMerchantApi } from '@/api/v1/mall'

export default {
  name: 'MallDashboard',
  setup() {
    const officialStats = ref({})
    const merchantStats = ref({})
    const recentOfficialOrders = ref([])
    const recentMerchantOrders = ref([])

    // 加载官方商城统计
    const loadOfficialStats = async () => {
      try {
        const response = await mallOfficialApi.getDashboard()
        if (response.code === 0) {
          officialStats.value = response.data
        }
      } catch (error) {
        console.error('加载官方商城统计失败:', error)
      }
    }

    // 加载商户商城统计
    const loadMerchantStats = async () => {
      try {
        const response = await mallMerchantApi.getDashboard()
        if (response.code === 0) {
          merchantStats.value = response.data
        }
      } catch (error) {
        console.error('加载商户商城统计失败:', error)
      }
    }

    // 加载最近订单
    const loadRecentOrders = async () => {
      try {
        // 加载最近官方订单
        const officialResponse = await mallOfficialApi.getOrders({ per_page: 5 })
        if (officialResponse.code === 0) {
          recentOfficialOrders.value = officialResponse.data.data || []
        }

        // 加载最近商户订单
        const merchantResponse = await mallMerchantApi.getOrders({ per_page: 5 })
        if (merchantResponse.code === 0) {
          recentMerchantOrders.value = merchantResponse.data.data || []
        }
      } catch (error) {
        console.error('加载最近订单失败:', error)
      }
    }

    // 格式化金额
    const formatAmount = (amount) => {
      return Number(amount).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    // 格式化时间
    const formatTime = (time) => {
      return new Date(time).toLocaleString('zh-CN')
    }

    // 获取订单状态类型
    const getOrderStatusType = (status) => {
      const statusMap = {
        1: 'warning', // 待付款
        2: 'primary', // 待发货
        3: 'success', // 已发货
        4: 'success', // 已完成
        5: 'danger',  // 发起退款
        6: 'default', // 退款完成
        7: 'default'  // 已取消
      }
      return statusMap[status] || 'default'
    }

    onMounted(() => {
      loadOfficialStats()
      loadMerchantStats()
      loadRecentOrders()
    })

    return {
      officialStats,
      merchantStats,
      recentOfficialOrders,
      recentMerchantOrders,
      formatAmount,
      formatTime,
      getOrderStatusType
    }
  }
}
</script>

<style scoped>
.mall-dashboard {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.page-header p {
  color: #6b7280;
  margin: 0;
}

.quick-actions {
  margin-bottom: 32px;
}

.action-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e5e7eb;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-card h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 12px 0 8px 0;
  color: #1f2937;
}

.action-card p {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
}

.stats-section {
  margin-bottom: 32px;
}

.stats-section h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  border: 1px solid #e5e7eb;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.stat-icon.official {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-icon.merchant {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-content h3 {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.stat-content p {
  color: #6b7280;
  font-size: 14px;
  margin: 0 0 8px 0;
}

.stat-detail {
  font-size: 12px;
  color: #9ca3af;
}

.recent-section {
  margin-bottom: 32px;
}

.recent-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e5e7eb;
}

.recent-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.recent-list {
  space-y: 12px;
}

.recent-item {
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.recent-item:last-child {
  border-bottom: none;
}

.item-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.order-id {
  font-weight: 600;
  color: #1f2937;
}

.order-amount {
  font-weight: 600;
  color: #059669;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-time {
  font-size: 12px;
  color: #6b7280;
}
</style> 