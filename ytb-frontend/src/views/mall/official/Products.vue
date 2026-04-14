<template>
  <div class="official-products">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>官方商品管理</h1>
      <p>管理官方商城的商品信息</p>
    </div>

    <!-- 统计概览 -->
    <div class="stats-section">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-card primary">
            <div class="stat-title">商品总览</div>
            <div class="stat-value">{{ stats.goods.total }}</div>
            <div class="stat-meta">
              <span>上架：{{ stats.goods.on_sale }}</span>
              <span>下架：{{ stats.goods.off_sale }}</span>
              <span>低库存：{{ stats.goods.low_stock }}</span>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card success">
            <div class="stat-title">销售额</div>
            <div class="stat-value">¥{{ formatAmount(stats.sales.total_amount) }}</div>
            <div class="stat-meta">
              <span>今日：¥{{ formatAmount(stats.sales.today_amount) }}</span>
              <span>本月：¥{{ formatAmount(stats.sales.month_amount) }}</span>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card warning">
            <div class="stat-title">订单概况</div>
            <div class="stat-value">{{ stats.orders.total }}</div>
            <div class="stat-meta">
              <span>待支付：{{ stats.orders.pending_payment }}</span>
              <span>待发货：{{ stats.orders.pending_ship }}</span>
              <span>已完成：{{ stats.orders.completed }}</span>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card neutral">
            <div class="stat-title">分类统计</div>
            <div class="stat-value">{{ stats.categories.total }}</div>
            <div class="stat-meta">
              <span>启用：{{ stats.categories.enabled }}</span>
              <span>停用：{{ stats.categories.disabled }}</span>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-section">
      <el-form @submit.prevent="handleSearch" inline>
        <el-form-item>
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索商品名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <el-select
            v-model="searchForm.category_id"
            placeholder="选择分类"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="option in categoryOptions"
              :key="option.value"
              :label="option.text"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select
            v-model="searchForm.status"
            placeholder="商品状态"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.text"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 商品列表 -->
    <div class="products-section">
      <el-table
        v-if="products.length > 0 || loading"
        v-loading="loading"
        :data="products"
        border
        stripe
        class="products-table"
      >
        <el-table-column label="商品" min-width="240">
          <template #default="{ row }">
            <div class="table-product">
              <el-image
                :src="row.img"
                fit="cover"
                class="table-product-image"
              />
              <div class="table-product-info">
                <div class="table-product-name">{{ row.name || row.title }}</div>
                <div class="table-product-desc">{{ row.describe || '暂无描述' }}</div>
                <div class="table-product-tags">
                  <el-tag v-if="row.is_hot" type="danger" size="small">热销</el-tag>
                  <el-tag v-if="row.is_new" type="success" size="small">新品</el-tag>
                  <el-tag v-if="row.is_recommend" type="primary" size="small">推荐</el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="分类" min-width="140">
          <template #default="{ row }">
            {{ row.category?.name || '未分类' }}
          </template>
        </el-table-column>
        <el-table-column label="价格" min-width="140">
          <template #default="{ row }">
            <div class="price-block">
              <span class="current-price">¥{{ row.price }}</span>
              <span v-if="row.market_price && row.market_price !== row.price" class="market-price">
                ¥{{ row.market_price }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="库存/销量" min-width="140">
          <template #default="{ row }">
            <div class="metric-block">
              <span>库存：{{ row.stock }}</span>
              <span>销量：{{ row.sales }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="评价" min-width="100">
          <template #default="{ row }">
            {{ row.comments }}
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'danger'">
              {{ row.status ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="180">
          <template #default="{ row }">
            <el-button 
              size="small" 
              :type="row.status ? 'warning' : 'success'"
              @click="toggleProductStatus(row)"
            >
              {{ row.status ? '下架' : '上架' }}
            </el-button>
            <el-button 
              size="small" 
              type="primary"
              @click="viewProduct(row)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-else description="暂无商品数据" />
    </div>

    <!-- 分页 -->
    <div class="pagination-section" v-if="pagination.total > 0">
      <el-pagination
        v-model:current-page="pagination.current_page"
        :page-size="pagination.per_page"
        :total="pagination.total"
        layout="total, prev, pager, next, jumper"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 商品详情弹窗 -->
    <el-dialog 
      v-model="showProductDetail" 
      title="商品详情"
      width="60%"
      :before-close="() => showProductDetail = false"
    >
      <div class="product-detail" v-if="selectedProduct">
        <div class="detail-images" v-if="selectedProduct.images">
          <el-image
            v-for="(image, index) in selectedProduct.images.split(',')"
            :key="index"
            :src="image"
            style="width: 100px; height: 100px; margin-right: 10px"
            fit="cover"
            :preview-src-list="selectedProduct.images.split(',')"
          />
        </div>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="商品标题">{{ selectedProduct.title }}</el-descriptions-item>
          <el-descriptions-item label="商品价格">¥{{ selectedProduct.price }}</el-descriptions-item>
          <el-descriptions-item label="市场价格">¥{{ selectedProduct.market_price }}</el-descriptions-item>
          <el-descriptions-item label="库存数量">{{ selectedProduct.stock }}</el-descriptions-item>
          <el-descriptions-item label="销售数量">{{ selectedProduct.sales }}</el-descriptions-item>
          <el-descriptions-item label="评价数量">{{ selectedProduct.comments }}</el-descriptions-item>
          <el-descriptions-item label="商品状态">
            <el-tag :type="selectedProduct.status ? 'success' : 'danger'">
              {{ selectedProduct.status ? '上架' : '下架' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatTime(selectedProduct.create_time) }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="detail-description" style="margin-top: 20px">
          <h3>商品描述</h3>
          <div v-html="selectedProduct.intro || selectedProduct.describe"></div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { mallOfficialApi } from '@/api/v1/mall'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'OfficialProducts',
  setup() {
    const loading = ref(false)
    const products = ref([])
    const selectedProduct = ref(null)
    const showProductDetail = ref(false)
    const createDefaultStats = () => ({
      goods: {
        total: 0,
        on_sale: 0,
        off_sale: 0,
        low_stock: 0
      },
      categories: {
        total: 0,
        enabled: 0,
        disabled: 0
      },
      orders: {
        total: 0,
        pending_payment: 0,
        pending_ship: 0,
        shipped: 0,
        completed: 0
      },
      sales: {
        total_amount: 0,
        today_amount: 0,
        month_amount: 0,
        year_amount: 0
      }
    })
    const stats = ref(createDefaultStats())

    // 搜索表单
    const searchForm = reactive({
      keyword: '',
      category_id: '',
      status: '',
      sort_field: 'id',
      sort_order: 'desc'
    })

    // 分页信息
    const pagination = reactive({
      current_page: 1,
      per_page: 15,
      total: 0,
      last_page: 1
    })

    // 分类选项
    const categoryOptions = ref([
      { text: '全部分类', value: '' }
    ])

    // 状态选项
    const statusOptions = [
      { text: '全部状态', value: '' },
      { text: '上架', value: '1' },
      { text: '下架', value: '0' }
    ]

    // 加载统计数据
    const loadStats = async () => {
      try {
        const response = await mallOfficialApi.getDashboard()
        if (response.code === 0 && response.data) {
          const base = createDefaultStats()
          stats.value = {
            goods: { ...base.goods, ...(response.data.goods || {}) },
            categories: { ...base.categories, ...(response.data.categories || {}) },
            orders: { ...base.orders, ...(response.data.orders || {}) },
            sales: { ...base.sales, ...(response.data.sales || {}) }
          }
        }
      } catch (error) {
        console.error('加载统计数据失败:', error)
      }
    }

    // 加载商品列表
    const loadProducts = async () => {
      loading.value = true
      try {
        const params = {
          ...searchForm,
          page: pagination.current_page,
          per_page: pagination.per_page
        }
        
        console.log('加载商品参数:', params)
        const response = await mallOfficialApi.getProducts(params)
        console.log('商品API响应:', response)
        
        if (response.code === 0) {
          products.value = response.data.data || []
          pagination.total = response.data.total || 0
          pagination.last_page = response.data.last_page || 1
          pagination.current_page = response.data.current_page || 1
          
          console.log('成功加载商品:', products.value.length, '个')
        } else {
          ElMessage.error(response.message || '加载失败')
        }
      } catch (error) {
        console.error('加载商品列表失败:', error)
        ElMessage.error('加载失败: ' + error.message)
      } finally {
        loading.value = false
      }
    }

    // 加载分类列表
    const loadCategories = async () => {
      try {
        const response = await mallOfficialApi.getCategories({ tree: true })
        if (response.code === 0) {
          const categoryList = response.data || []
          categoryOptions.value = [
            { text: '全部分类', value: '' },
            ...categoryList.map(cat => ({ text: cat.name, value: cat.id }))
          ]
        }
      } catch (error) {
        console.error('加载分类失败:', error)
      }
    }

    // 搜索
    const handleSearch = () => {
      pagination.current_page = 1
      loadProducts()
    }

    // 重置搜索
    const resetSearch = () => {
      Object.assign(searchForm, {
        keyword: '',
        category_id: '',
        status: '',
        sort_field: 'id',
        sort_order: 'desc'
      })
      pagination.current_page = 1
      loadProducts()
    }

    // 分页变化
    const handlePageChange = (page) => {
      pagination.current_page = page
      loadProducts()
    }

    // 切换商品状态
    const toggleProductStatus = async (product) => {
      const action = product.status ? '下架' : '上架'
      
      try {
        await ElMessageBox.confirm(
          `确定要${action}商品"${product.name}"吗？`,
          '确认操作',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        const response = await mallOfficialApi.updateProductStatus(product.id, {
          status: product.status ? 0 : 1
        })
        
        if (response.code === 0) {
          ElMessage.success(`${action}成功`)
          loadProducts()
          loadStats()
        } else {
          ElMessage.error(response.message || `${action}失败`)
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error(`${action}商品失败:`, error)
          ElMessage.error(`${action}失败`)
        }
      }
    }

    // 查看商品详情
    const viewProduct = (product) => {
      selectedProduct.value = product
      showProductDetail.value = true
    }

    // 格式化时间
    const formatTime = (time) => {
      if (!time) return '-'
      return new Date(time).toLocaleString('zh-CN')
    }

    const formatAmount = (amount) => {
      const value = Number(amount) || 0
      return value.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    onMounted(() => {
      console.log('组件挂载，开始加载数据...')
      loadProducts()
      loadCategories()
      loadStats()
    })

    return {
      loading,
      products,
      selectedProduct,
      showProductDetail,
      searchForm,
      pagination,
      stats,
      categoryOptions,
      statusOptions,
      loadProducts,
      handleSearch,
      resetSearch,
      handlePageChange,
      toggleProductStatus,
      viewProduct,
      formatTime,
      formatAmount
    }
  }
}
</script>
<style scoped>
.official-products {
  padding: 20px;
}

.page-header {
  margin-bottom: 16px;
}

.page-header h1 {
  margin: 0 0 6px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.page-header p {
  margin: 0;
  color: #6b7280;
}

.stats-section {
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-card.primary {
  border-color: rgba(59, 130, 246, 0.25);
  background: linear-gradient(145deg, rgba(59, 130, 246, 0.08), #fff);
}

.stat-card.success {
  border-color: rgba(16, 185, 129, 0.25);
  background: linear-gradient(145deg, rgba(16, 185, 129, 0.08), #fff);
}

.stat-card.warning {
  border-color: rgba(245, 158, 11, 0.25);
  background: linear-gradient(145deg, rgba(245, 158, 11, 0.08), #fff);
}

.stat-card.neutral {
  border-color: rgba(99, 102, 241, 0.25);
  background: linear-gradient(145deg, rgba(99, 102, 241, 0.08), #fff);
}

.stat-title {
  font-size: 14px;
  color: #6b7280;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #111827;
}

.stat-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: #6b7280;
  font-size: 13px;
}

.search-section {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}

.products-section {
  margin-bottom: 20px;
}

.products-table {
  width: 100%;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
}

.table-product {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-product-image {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  background: #f3f4f6;
}

.table-product-info {
  flex: 1;
  overflow: hidden;
}

.table-product-name {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-product-desc {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-product-tags .el-tag {
  margin-right: 6px;
}

.price-block {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.price-block .current-price {
  font-size: 16px;
  font-weight: 600;
  color: #ef4444;
}

.price-block .market-price {
  font-size: 13px;
  color: #9ca3af;
  text-decoration: line-through;
}

.metric-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #4b5563;
}

.pagination-section {
  display: flex;
  justify-content: center;
  padding: 20px 0 0;
}

.detail-images {
  margin-bottom: 20px;
}

.detail-description h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
}
</style>
