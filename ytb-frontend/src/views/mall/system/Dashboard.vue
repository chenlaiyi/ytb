<template>
  <div class="mall-dashboard">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>商城总览</h1>
      <p>商城运营数据统计与快捷管理</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon goods">
          <i class="el-icon-goods"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.total_goods || 0 }}</div>
          <div class="stat-label">商品总数</div>
          <div class="stat-extra">
            <span class="on-sale">上架: {{ statistics.on_sale_goods || 0 }}</span>
            <span class="off-sale">下架: {{ statistics.off_sale_goods || 0 }}</span>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon orders">
          <i class="el-icon-document"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.total_orders || 0 }}</div>
          <div class="stat-label">订单总数</div>
          <div class="stat-extra">
            <span class="today">今日: {{ statistics.today_orders || 0 }}</span>
            <span class="pending">待处理: {{ statistics.pending_orders || 0 }}</span>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon sales">
          <i class="el-icon-money"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">¥{{ formatMoney(statistics.total_sales || 0) }}</div>
          <div class="stat-label">销售总额</div>
          <div class="stat-extra">
            <span class="today">今日: ¥{{ formatMoney(statistics.today_sales || 0) }}</span>
            <span class="month">本月: ¥{{ formatMoney(statistics.month_sales || 0) }}</span>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon categories">
          <i class="el-icon-menu"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.total_categories || 0 }}</div>
          <div class="stat-label">商品分类</div>
          <div class="stat-extra">
            <span class="enabled">启用: {{ statistics.enabled_categories || 0 }}</span>
            <span class="disabled">禁用: {{ statistics.disabled_categories || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <h2>快捷操作</h2>
      <div class="action-grid">
        <div class="action-card" @click="goToProducts">
          <i class="el-icon-goods"></i>
          <span>商品管理</span>
        </div>
        <div class="action-card" @click="goToOrders">
          <i class="el-icon-document"></i>
          <span>订单管理</span>
        </div>
        <div class="action-card" @click="goToCategories">
          <i class="el-icon-menu"></i>
          <span>分类管理</span>
        </div>
        <div class="action-card" @click="goToSettings">
          <i class="el-icon-setting"></i>
          <span>商城设置</span>
        </div>
      </div>
    </div>

    <!-- 数据概览 -->
    <div class="data-overview">
      <div class="overview-left">
        <h2>商品状态分布</h2>
        <div class="chart-container">
          <div class="chart-placeholder">
            <div class="chart-item">
              <div class="chart-bar on-sale" :style="{ width: getPercentage(statistics.on_sale_goods, statistics.total_goods) + '%' }"></div>
              <span>上架商品 ({{ statistics.on_sale_goods || 0 }})</span>
            </div>
            <div class="chart-item">
              <div class="chart-bar off-sale" :style="{ width: getPercentage(statistics.off_sale_goods, statistics.total_goods) + '%' }"></div>
              <span>下架商品 ({{ statistics.off_sale_goods || 0 }})</span>
            </div>
            <div class="chart-item">
              <div class="chart-bar out-stock" :style="{ width: getPercentage(statistics.out_of_stock || 0, statistics.total_goods) + '%' }"></div>
              <span>缺货商品 ({{ statistics.out_of_stock || 0 }})</span>
            </div>
            <div class="chart-item">
              <div class="chart-bar low-stock" :style="{ width: getPercentage(statistics.low_stock || 0, statistics.total_goods) + '%' }"></div>
              <span>库存不足 ({{ statistics.low_stock || 0 }})</span>
            </div>
          </div>
        </div>
      </div>

      <div class="overview-right">
        <h2>最近订单</h2>
        <div class="recent-orders">
          <div v-if="recentOrders.length === 0" class="no-data">
            暂无订单数据
          </div>
          <div v-else>
            <div v-for="order in recentOrders" :key="order.id || order.order_id" class="order-item">
              <div class="order-info">
                <div class="order-no">{{ order.order_no || order.order_id || order.sn || '-' }}</div>
                <div class="order-amount">¥{{ formatMoney(order.actual_amount ?? order.order_amount ?? order.total_amount ?? 0) }}</div>
              </div>
              <div class="order-meta">
                <span class="order-status" :class="getOrderStatusClass(order.status)">
                  {{ order.status_text }}
                </span>
                <span class="order-time">{{ formatTime(order.created_at || order.create_time || order.order_time) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 库存预警 -->
    <div v-if="lowStockProducts.length > 0" class="stock-warning">
      <h2>库存预警</h2>
      <div class="warning-list">
        <div v-for="product in lowStockProducts" :key="product.id || product.product_id" class="warning-item">
          <div class="product-info">
            <img :src="product.thumbnail || product.cover || product.image" :alt="product.name || product.title" class="product-thumb">
            <div class="product-details">
              <div class="product-name">{{ product.name || product.title }}</div>
              <div class="product-stock">库存: {{ product.stock ?? product.stock_num ?? 0 }}</div>
            </div>
          </div>
          <div class="warning-actions">
            <el-button size="small" type="primary" @click="goToProductEdit(product.id || product.product_id, product)">
              补充库存
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mallOfficialApi, mallMerchantApi } from '@/api/v1/mall'

const createDefaultStatistics = () => ({
  total_goods: 0,
  on_sale_goods: 0,
  off_sale_goods: 0,
  out_of_stock: 0,
  low_stock: 0,
  total_orders: 0,
  today_orders: 0,
  pending_orders: 0,
  total_sales: 0,
  today_sales: 0,
  month_sales: 0,
  total_categories: 0,
  enabled_categories: 0,
  disabled_categories: 0
})

export default {
  name: 'MallDashboard',
  data() {
    return {
      statistics: createDefaultStatistics(),
      recentOrders: [],
      lowStockProducts: [],
      loading: false
    }
  },
  mounted() {
    this.loadDashboardData()
  },
  methods: {
    async loadDashboardData() {
      this.loading = true
      try {
        await Promise.allSettled([
          this.loadStatistics(),
          this.loadRecentOrders(),
          this.loadLowStockProducts()
        ])
      } catch (error) {
        console.error('加载数据失败:', error)
      } finally {
        this.loading = false
      }
    },

    async loadStatistics() {
      const aggregated = createDefaultStatistics()
      try {
        const [officialResult, merchantResult] = await Promise.allSettled([
          mallOfficialApi.getDashboard(),
          mallMerchantApi.getDashboard()
        ])

        const applyStats = (source = {}) => {
          const goods = source.goods || {}
          aggregated.total_goods += Number(goods.total || goods.total_goods || goods.total_count || 0)
          aggregated.on_sale_goods += Number(goods.on_sale || goods.on_sale_goods || 0)
          aggregated.off_sale_goods += Number(goods.off_sale || goods.off_sale_goods || 0)
          aggregated.low_stock += Number(goods.low_stock || goods.low_stock_goods || 0)
          aggregated.out_of_stock += Number(goods.out_of_stock || goods.out_stock_goods || 0)

          const orders = source.orders || {}
          aggregated.total_orders += Number(orders.total || orders.total_orders || orders.total_count || 0)
          aggregated.today_orders += Number(orders.today || orders.today_orders || 0)
          aggregated.pending_orders += Number(orders.pending || orders.pending_orders || orders.pending_payment || 0)

          const sales = source.sales || {}
          aggregated.total_sales += Number(sales.total_amount || sales.total || 0)
          aggregated.today_sales += Number(sales.today_amount || sales.today || 0)
          aggregated.month_sales += Number(sales.month_amount || sales.month || 0)

          const categories = source.categories || {}
          aggregated.total_categories += Number(categories.total || categories.total_categories || 0)
          aggregated.enabled_categories += Number(categories.enabled || categories.enabled_categories || 0)
          aggregated.disabled_categories += Number(categories.disabled || categories.disabled_categories || 0)

          if (!this.lowStockProducts.length && Array.isArray(source.low_stock_products)) {
            this.lowStockProducts = source.low_stock_products
          }
        }

        if (officialResult.status === 'fulfilled' && officialResult.value?.code === 0) {
          applyStats(officialResult.value.data)
        }

        if (merchantResult.status === 'fulfilled' && merchantResult.value?.code === 0) {
          applyStats(merchantResult.value.data)
        }

        this.statistics = aggregated
      } catch (error) {
        console.error('加载统计数据失败:', error)
        this.statistics = createDefaultStatistics()
      }
    },

    async loadRecentOrders() {
      try {
        const [officialOrders, merchantOrders] = await Promise.allSettled([
          mallOfficialApi.getOrders({ per_page: 5 }),
          mallMerchantApi.getOrders({ per_page: 5 })
        ])

        const combined = []
        if (officialOrders.status === 'fulfilled' && officialOrders.value?.code === 0) {
          combined.push(...(officialOrders.value.data?.data || []))
        }
        if (merchantOrders.status === 'fulfilled' && merchantOrders.value?.code === 0) {
          combined.push(...(merchantOrders.value.data?.data || []))
        }

        this.recentOrders = combined
      } catch (error) {
        console.error('加载最近订单失败:', error)
        this.recentOrders = []
      }
    },

    async loadLowStockProducts() {
      try {
        const officialPromise = mallOfficialApi.getProducts
          ? mallOfficialApi.getProducts({ per_page: 10, stock_warning: 1 })
          : Promise.resolve(null)
        const merchantPromise = mallMerchantApi.getProducts
          ? mallMerchantApi.getProducts({ per_page: 10, stock_warning: 1 })
          : Promise.resolve(null)

        const [officialProducts, merchantProducts] = await Promise.allSettled([
          officialPromise,
          merchantPromise
        ])

        const list = []
        if (officialProducts.status === 'fulfilled' && officialProducts.value?.code === 0) {
          list.push(...(officialProducts.value.data?.data || []))
        }
        if (merchantProducts.status === 'fulfilled' && merchantProducts.value?.code === 0) {
          list.push(...(merchantProducts.value.data?.data || []))
        }

        this.lowStockProducts = list
      } catch (error) {
        console.error('加载库存预警失败:', error)
        this.lowStockProducts = []
      }
    },

    formatMoney(amount) {
      return Number(amount).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    },

    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      const now = new Date()
      const diff = now - date
      
      if (diff < 60000) return '刚刚'
      if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
      if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
      return date.toLocaleDateString()
    },

    getPercentage(value, total) {
      if (!total || total === 0) return 0
      return Math.round((value / total) * 100)
    },

    getOrderStatusClass(status) {
      const statusMap = {
        1: 'pending',
        2: 'processing', 
        3: 'shipped',
        4: 'completed',
        5: 'cancelled'
      }
      return statusMap[status] || 'unknown'
    },

    // 导航方法
    goToProducts() {
      this.$router.push('/mall/official/products')
    },

    goToOrders() {
      this.$router.push('/mall/official/orders')
    },

    goToCategories() {
      this.$router.push('/mall/official/categories')
    },

    goToSettings() {
      this.$router.push('/mall/config/settings')
    },

    goToProductEdit(productId, record = {}) {
      if (!productId) {
        return
      }
      if (record.merchant_id) {
        this.$router.push(`/mall/merchant/products/${productId}/edit`)
      } else {
        this.$router.push(`/mall/official/products/${productId}/edit`)
      }
    }
  }
}
</script>

<style scoped>
.mall-dashboard {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 24px;
  color: #303133;
  margin: 0 0 8px 0;
}

.page-header p {
  color: #909399;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  font-size: 24px;
  color: white;
}

.stat-icon.goods { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stat-icon.orders { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.stat-icon.sales { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.stat-icon.categories { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-extra {
  font-size: 12px;
}

.stat-extra span {
  margin-right: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}

.on-sale, .enabled, .today { background: #f0f9ff; color: #1890ff; }
.off-sale, .disabled { background: #fff2f0; color: #ff4d4f; }
.pending { background: #fff7e6; color: #fa8c16; }
.month { background: #f6ffed; color: #52c41a; }

.quick-actions {
  margin-bottom: 30px;
}

.quick-actions h2 {
  font-size: 18px;
  color: #303133;
  margin-bottom: 16px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  max-width: 600px;
}

.action-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.action-card i {
  font-size: 24px;
  color: #409eff;
  margin-bottom: 8px;
  display: block;
}

.action-card span {
  font-size: 14px;
  color: #606266;
}

.data-overview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.overview-left, .overview-right {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.overview-left h2, .overview-right h2 {
  font-size: 16px;
  color: #303133;
  margin-bottom: 20px;
}

.chart-container {
  height: 200px;
}

.chart-item {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

.chart-bar {
  height: 20px;
  border-radius: 10px;
  margin-right: 12px;
  min-width: 20px;
  transition: width 0.3s;
}

.chart-bar.on-sale { background: #52c41a; }
.chart-bar.off-sale { background: #ff4d4f; }
.chart-bar.out-stock { background: #fa8c16; }
.chart-bar.low-stock { background: #faad14; }

.recent-orders {
  max-height: 200px;
  overflow-y: auto;
}

.no-data {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

.order-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.order-item:last-child {
  border-bottom: none;
}

.order-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.order-no {
  font-weight: 500;
  color: #303133;
}

.order-amount {
  color: #f56c6c;
  font-weight: 500;
}

.order-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.order-status {
  padding: 2px 6px;
  border-radius: 4px;
}

.order-status.pending { background: #fff7e6; color: #fa8c16; }
.order-status.processing { background: #f0f9ff; color: #1890ff; }
.order-status.shipped { background: #f6ffed; color: #52c41a; }
.order-status.completed { background: #f0f9ff; color: #1890ff; }
.order-status.cancelled { background: #fff2f0; color: #ff4d4f; }

.order-time {
  color: #909399;
}

.stock-warning {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stock-warning h2 {
  font-size: 16px;
  color: #303133;
  margin-bottom: 20px;
}

.warning-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.warning-item:last-child {
  border-bottom: none;
}

.product-info {
  display: flex;
  align-items: center;
}

.product-thumb {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  margin-right: 12px;
  object-fit: cover;
}

.product-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.product-stock {
  font-size: 12px;
  color: #fa8c16;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .data-overview {
    grid-template-columns: 1fr;
  }
  
  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style> 
