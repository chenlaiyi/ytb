<template>
  <div class="branch-products-container">
    <van-nav-bar 
      title="产品中心" 
      left-arrow 
      @click-left="$router.go(-1)"
      fixed
      placeholder
    >
      <template #right>
        <van-icon name="search" size="20" @click="showSearch = true" />
      </template>
    </van-nav-bar>

    <!-- 搜索弹出层 -->
    <van-popup v-model:show="showSearch" position="top" :style="{ height: '100%' }">
      <div class="search-container">
        <van-nav-bar title="搜索产品" left-arrow @click-left="showSearch = false" />
        <div class="search-content">
          <van-search
            v-model="searchKeyword"
            placeholder="请输入产品名称或关键词"
            @search="handleSearch"
            @clear="handleClearSearch"
          />
          
          <!-- 搜索历史 -->
          <div class="search-history" v-if="searchHistory.length > 0 && !searchKeyword">
            <div class="history-header">
              <span>搜索历史</span>
              <van-button type="primary" size="mini" plain @click="clearSearchHistory">清空</van-button>
            </div>
            <div class="history-tags">
              <van-tag 
                v-for="(item, index) in searchHistory"
                :key="index"
                @click="searchKeyword = item; handleSearch()"
                class="history-tag"
              >
                {{ item }}
              </van-tag>
            </div>
          </div>
          
          <!-- 热门搜索 -->
          <div class="hot-search" v-if="!searchKeyword">
            <div class="hot-header">热门搜索</div>
            <div class="hot-tags">
              <van-tag 
                v-for="(item, index) in hotSearchWords"
                :key="index"
                @click="searchKeyword = item; handleSearch()"
                class="hot-tag"
                color="#f0f9ff"
                text-color="#1989fa"
              >
                {{ item }}
              </van-tag>
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 分类标签 -->
    <div class="category-tabs">
      <van-tabs v-model:active="activeCategory" @change="handleCategoryChange" sticky>
        <van-tab 
          v-for="category in categories" 
          :key="category.id" 
          :title="category.name"
          :name="category.id"
        />
      </van-tabs>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-item" @click="showSortPopup = true">
        <span>{{ currentSort.name }}</span>
        <van-icon name="arrow-down" />
      </div>
      <div class="filter-item" @click="showFilterPopup = true">
        <span>筛选</span>
        <van-icon name="filter-o" />
        <van-badge :content="filterCount" v-if="filterCount > 0" />
      </div>
      <div class="filter-item" @click="toggleViewMode">
        <van-icon :name="viewMode === 'grid' ? 'apps-o' : 'list-switch'" />
      </div>
    </div>

    <!-- 产品列表 -->
    <div class="products-content">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <!-- 网格视图 -->
          <div v-if="viewMode === 'grid'" class="products-grid">
            <div 
              v-for="product in productList"
              :key="product.id"
              class="product-card"
              @click="handleProductClick(product)"
            >
              <div class="product-image">
                <van-image
                  :src="product.image"
                  fit="cover"
                  :alt="product.name"
                >
                  <template #error>
                    <div class="image-error">
                      <van-icon name="photo-fail" size="32" />
                    </div>
                  </template>
                </van-image>
                
                <!-- 标签 -->
                <div class="product-tags" v-if="product.tags && product.tags.length > 0">
                  <van-tag 
                    v-for="tag in product.tags.slice(0, 2)"
                    :key="tag"
                    size="mini"
                    :color="getTagColor(tag)"
                  >
                    {{ tag }}
                  </van-tag>
                </div>
              </div>
              
              <div class="product-info">
                <div class="product-name">{{ product.name }}</div>
                <div class="product-desc">{{ product.description }}</div>
                <div class="product-price">
                  <span class="current-price">¥{{ product.price }}</span>
                  <span class="original-price" v-if="product.originalPrice">¥{{ product.originalPrice }}</span>
                </div>
                <div class="product-stats">
                  <span class="sales">已售{{ product.sales }}件</span>
                  <span class="rating">
                    <van-rate :value="product.rating" size="12" readonly />
                    <span class="rating-text">{{ product.rating }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 列表视图 -->
          <div v-else class="products-list">
            <div 
              v-for="product in productList"
              :key="product.id"
              class="product-item"
              @click="handleProductClick(product)"
            >
              <div class="product-image">
                <van-image
                  :src="product.image"
                  fit="cover"
                  :alt="product.name"
                >
                  <template #error>
                    <div class="image-error">
                      <van-icon name="photo-fail" size="24" />
                    </div>
                  </template>
                </van-image>
              </div>
              
              <div class="product-content">
                <div class="product-header">
                  <div class="product-name">{{ product.name }}</div>
                  <div class="product-tags" v-if="product.tags && product.tags.length > 0">
                    <van-tag 
                      v-for="tag in product.tags.slice(0, 1)"
                      :key="tag"
                      size="mini"
                      :color="getTagColor(tag)"
                    >
                      {{ tag }}
                    </van-tag>
                  </div>
                </div>
                <div class="product-desc">{{ product.description }}</div>
                <div class="product-footer">
                  <div class="product-price">
                    <span class="current-price">¥{{ product.price }}</span>
                    <span class="original-price" v-if="product.originalPrice">¥{{ product.originalPrice }}</span>
                  </div>
                  <div class="product-stats">
                    <span class="sales">已售{{ product.sales }}件</span>
                    <van-rate :value="product.rating" size="12" readonly />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <van-empty 
            v-if="!loading && productList.length === 0"
            description="暂无产品"
            image="search"
          >
            <van-button type="primary" @click="onRefresh">刷新试试</van-button>
          </van-empty>
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 排序弹出层 -->
    <van-popup v-model:show="showSortPopup" position="bottom" closeable>
      <div class="sort-popup">
        <div class="popup-header">排序方式</div>
        <div class="sort-options">
          <div 
            v-for="sort in sortOptions"
            :key="sort.key"
            class="sort-option"
            :class="{ active: currentSort.key === sort.key }"
            @click="handleSortChange(sort)"
          >
            <span>{{ sort.name }}</span>
            <van-icon name="success" v-if="currentSort.key === sort.key" />
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 筛选弹出层 -->
    <van-popup v-model:show="showFilterPopup" position="bottom" closeable>
      <div class="filter-popup">
        <div class="popup-header">
          <span>筛选</span>
          <van-button type="primary" size="mini" plain @click="resetFilters">重置</van-button>
        </div>
        
        <!-- 价格区间 -->
        <div class="filter-section">
          <div class="filter-title">价格区间</div>
          <div class="price-range">
            <van-field
              v-model="filters.minPrice"
              placeholder="最低价"
              type="number"
              class="price-input"
            />
            <span class="price-separator">-</span>
            <van-field
              v-model="filters.maxPrice"
              placeholder="最高价"
              type="number"
              class="price-input"
            />
          </div>
        </div>

        <!-- 品牌 -->
        <div class="filter-section">
          <div class="filter-title">品牌</div>
          <div class="filter-options">
            <van-checkbox-group v-model="filters.brands">
              <van-checkbox 
                v-for="brand in brandOptions"
                :key="brand"
                :name="brand"
                class="filter-checkbox"
              >
                {{ brand }}
              </van-checkbox>
            </van-checkbox-group>
          </div>
        </div>

        <!-- 特色服务 -->
        <div class="filter-section">
          <div class="filter-title">特色服务</div>
          <div class="filter-options">
            <van-checkbox-group v-model="filters.services">
              <van-checkbox 
                v-for="service in serviceOptions"
                :key="service"
                :name="service"
                class="filter-checkbox"
              >
                {{ service }}
              </van-checkbox>
            </van-checkbox-group>
          </div>
        </div>

        <div class="filter-actions">
          <van-button @click="showFilterPopup = false" class="cancel-btn">取消</van-button>
          <van-button type="primary" @click="applyFilters" class="confirm-btn">确定</van-button>
        </div>
      </div>
    </van-popup>

    <!-- 产品详情弹出层 -->
    <van-popup v-model:show="showProductDetail" position="bottom" :style="{ height: '80%' }" closeable>
      <div class="product-detail" v-if="selectedProduct">
        <div class="detail-header">
          <van-image
            :src="selectedProduct.image"
            fit="cover"
            class="detail-image"
          />
          
          <div class="detail-info">
            <div class="detail-name">{{ selectedProduct.name }}</div>
            <div class="detail-price">
              <span class="current-price">¥{{ selectedProduct.price }}</span>
              <span class="original-price" v-if="selectedProduct.originalPrice">¥{{ selectedProduct.originalPrice }}</span>
            </div>
            <div class="detail-tags" v-if="selectedProduct.tags">
              <van-tag 
                v-for="tag in selectedProduct.tags"
                :key="tag"
                size="mini"
                :color="getTagColor(tag)"
              >
                {{ tag }}
              </van-tag>
            </div>
          </div>
        </div>
        
        <div class="detail-content">
          <div class="detail-section">
            <div class="section-title">产品介绍</div>
            <div class="section-content">{{ selectedProduct.description }}</div>
          </div>
          
          <div class="detail-section">
            <div class="section-title">产品规格</div>
            <div class="spec-list">
              <div v-for="(spec, index) in selectedProduct.specifications" :key="index" class="spec-item">
                <span class="spec-label">{{ spec.label }}:</span>
                <span class="spec-value">{{ spec.value }}</span>
              </div>
            </div>
          </div>
          
          <div class="detail-section">
            <div class="section-title">用户评价</div>
            <div class="rating-summary">
              <van-rate :value="selectedProduct.rating" size="16" readonly />
              <span class="rating-score">{{ selectedProduct.rating }}分</span>
              <span class="rating-count">({{ selectedProduct.reviewCount }}条评价)</span>
            </div>
          </div>
        </div>
        
        <div class="detail-actions">
          <van-button type="warning" class="action-btn" @click="handleAddToCart">加入购物车</van-button>
          <van-button type="danger" class="action-btn" @click="handleBuyNow">立即购买</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showConfirmDialog } from 'vant'

export default {
  name: 'BranchProducts',
  setup() {
    const router = useRouter()
    
    // 响应式数据
    const showSearch = ref(false)
    const searchKeyword = ref('')
    const activeCategory = ref('all')
    const viewMode = ref('grid') // grid 或 list
    const showSortPopup = ref(false)
    const showFilterPopup = ref(false)
    const showProductDetail = ref(false)
    const selectedProduct = ref(null)
    
    const refreshing = ref(false)
    const loading = ref(false)
    const finished = ref(false)
    
    const productList = ref([])
    const searchHistory = ref(['净水器', '家电', '智能设备'])
    
    // 筛选器
    const filters = reactive({
      minPrice: '',
      maxPrice: '',
      brands: [],
      services: []
    })
    
    // 分类数据
    const categories = ref([
      { id: 'all', name: '全部' },
      { id: 'appliance', name: '家电' },
      { id: 'purifier', name: '净水器' },
      { id: 'smart', name: '智能设备' },
      { id: 'service', name: '服务' }
    ])
    
    // 排序选项
    const sortOptions = ref([
      { key: 'default', name: '默认排序' },
      { key: 'price_asc', name: '价格从低到高' },
      { key: 'price_desc', name: '价格从高到低' },
      { key: 'sales', name: '销量优先' },
      { key: 'rating', name: '评分优先' },
      { key: 'newest', name: '最新上架' }
    ])
    
    const currentSort = ref(sortOptions.value[0])
    
    // 筛选选项
    const brandOptions = ref(['华为', '小米', '海尔', '美的', '格力', '松下'])
    const serviceOptions = ref(['包邮', '7天退换', '正品保证', '上门安装', '质保三年'])
    
    // 热门搜索词
    const hotSearchWords = ref(['净水器', '智能家电', '空气净化器', '热水器', '洗衣机'])
    
    // 计算属性
    const filterCount = computed(() => {
      let count = 0
      if (filters.minPrice || filters.maxPrice) count++
      if (filters.brands.length > 0) count++
      if (filters.services.length > 0) count++
      return count
    })
    
    // 模拟产品数据
    const mockProducts = [
      {
        id: 1,
        name: '智能净水器Pro',
        description: '五级过滤，智能监控，保障饮水安全',
        price: '2999.00',
        originalPrice: '3999.00',
        image: 'https://img.yzcdn.cn/vant/cat.jpeg',
        sales: 1200,
        rating: 4.8,
        reviewCount: 356,
        tags: ['热销', '智能'],
        category: 'purifier',
        brand: '华为',
        specifications: [
          { label: '过滤级数', value: '5级' },
          { label: '净水流量', value: '3L/min' },
          { label: '适用人数', value: '3-6人' },
          { label: '滤芯寿命', value: '12个月' }
        ]
      },
      {
        id: 2,
        name: '空气净化器Max',
        description: 'HEPA滤网，除甲醛除PM2.5，静音运行',
        price: '1899.00',
        originalPrice: '2399.00',
        image: 'https://img.yzcdn.cn/vant/cat.jpeg',
        sales: 856,
        rating: 4.6,
        reviewCount: 234,
        tags: ['新品', '静音'],
        category: 'appliance',
        brand: '小米',
        specifications: [
          { label: '适用面积', value: '30-50㎡' },
          { label: 'CADR值', value: '400m³/h' },
          { label: '噪音', value: '≤35dB' },
          { label: '功率', value: '45W' }
        ]
      },
      {
        id: 3,
        name: '智能热水器',
        description: '即热式设计，恒温控制，节能环保',
        price: '3299.00',
        image: 'https://img.yzcdn.cn/vant/cat.jpeg',
        sales: 645,
        rating: 4.7,
        reviewCount: 189,
        tags: ['节能', '即热'],
        category: 'appliance',
        brand: '海尔',
        specifications: [
          { label: '容量', value: '60L' },
          { label: '加热方式', value: '即热式' },
          { label: '温控范围', value: '30-75℃' },
          { label: '能效等级', value: '一级' }
        ]
      },
      {
        id: 4,
        name: '上门安装服务',
        description: '专业师傅上门安装，包工包料，质保一年',
        price: '299.00',
        image: 'https://img.yzcdn.cn/vant/cat.jpeg',
        sales: 2340,
        rating: 4.9,
        reviewCount: 567,
        tags: ['服务', '包安装'],
        category: 'service',
        brand: '点点够',
        specifications: [
          { label: '服务范围', value: '全市' },
          { label: '响应时间', value: '24小时内' },
          { label: '质保期', value: '1年' },
          { label: '服务标准', value: '5星标准' }
        ]
      }
    ]
    
    // 方法
    const handleSearch = () => {
      if (!searchKeyword.value.trim()) {
        showToast('请输入搜索关键词')
        return
      }
      
      // 添加到搜索历史
      if (!searchHistory.value.includes(searchKeyword.value)) {
        searchHistory.value.unshift(searchKeyword.value)
        if (searchHistory.value.length > 10) {
          searchHistory.value = searchHistory.value.slice(0, 10)
        }
      }
      
      showSearch.value = false
      loadProducts()
      showToast(`搜索 "${searchKeyword.value}"`)
    }
    
    const handleClearSearch = () => {
      searchKeyword.value = ''
    }
    
    const clearSearchHistory = () => {
      showConfirmDialog({
        title: '确认清空',
        message: '确定要清空搜索历史吗？'
      }).then(() => {
        searchHistory.value = []
        showSuccessToast('已清空')
      })
    }
    
    const handleCategoryChange = (categoryId) => {
      activeCategory.value = categoryId
      onRefresh()
    }
    
    const handleSortChange = (sort) => {
      currentSort.value = sort
      showSortPopup.value = false
      onRefresh()
      showToast(`已按${sort.name}`)
    }
    
    const toggleViewMode = () => {
      viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
    }
    
    const resetFilters = () => {
      filters.minPrice = ''
      filters.maxPrice = ''
      filters.brands = []
      filters.services = []
    }
    
    const applyFilters = () => {
      showFilterPopup.value = false
      onRefresh()
      showToast('筛选已应用')
    }
    
    const getTagColor = (tag) => {
      const colorMap = {
        '热销': '#ff4444',
        '新品': '#07c160',
        '智能': '#1989fa',
        '静音': '#9c26b0',
        '节能': '#ff9800',
        '即热': '#f44336',
        '服务': '#607d8b',
        '包安装': '#4caf50'
      }
      return colorMap[tag] || '#999'
    }
    
    const handleProductClick = (product) => {
      selectedProduct.value = product
      showProductDetail.value = true
    }
    
    const handleAddToCart = () => {
      showSuccessToast('已加入购物车')
      showProductDetail.value = false
    }
    
    const handleBuyNow = () => {
      showToast('跳转到购买页面')
      showProductDetail.value = false
    }
    
    const loadProducts = () => {
      // 模拟API调用
      let filteredProducts = [...mockProducts]
      
      // 分类筛选
      if (activeCategory.value !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.category === activeCategory.value)
      }
      
      // 搜索筛选
      if (searchKeyword.value) {
        filteredProducts = filteredProducts.filter(p => 
          p.name.includes(searchKeyword.value) || 
          p.description.includes(searchKeyword.value)
        )
      }
      
      // 价格筛选
      if (filters.minPrice) {
        filteredProducts = filteredProducts.filter(p => parseFloat(p.price) >= parseFloat(filters.minPrice))
      }
      if (filters.maxPrice) {
        filteredProducts = filteredProducts.filter(p => parseFloat(p.price) <= parseFloat(filters.maxPrice))
      }
      
      // 品牌筛选
      if (filters.brands.length > 0) {
        filteredProducts = filteredProducts.filter(p => filters.brands.includes(p.brand))
      }
      
      // 排序
      switch (currentSort.value.key) {
        case 'price_asc':
          filteredProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
          break
        case 'price_desc':
          filteredProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
          break
        case 'sales':
          filteredProducts.sort((a, b) => b.sales - a.sales)
          break
        case 'rating':
          filteredProducts.sort((a, b) => b.rating - a.rating)
          break
        case 'newest':
          filteredProducts.sort((a, b) => b.id - a.id)
          break
      }
      
      return filteredProducts
    }
    
    const onRefresh = () => {
      refreshing.value = true
      productList.value = []
      finished.value = false
      
      setTimeout(() => {
        const products = loadProducts()
        productList.value = products.slice(0, 10)
        refreshing.value = false
        
        if (products.length <= 10) {
          finished.value = true
        }
      }, 1000)
    }
    
    const onLoad = () => {
      setTimeout(() => {
        const products = loadProducts()
        const startIndex = productList.value.length
        const newProducts = products.slice(startIndex, startIndex + 10)
        
        productList.value.push(...newProducts)
        loading.value = false
        
        if (productList.value.length >= products.length) {
          finished.value = true
        }
      }, 1000)
    }
    
    // 生命周期
    onMounted(() => {
      onRefresh()
    })
    
    return {
      // 响应式数据
      showSearch,
      searchKeyword,
      activeCategory,
      viewMode,
      showSortPopup,
      showFilterPopup,
      showProductDetail,
      selectedProduct,
      refreshing,
      loading,
      finished,
      productList,
      searchHistory,
      filters,
      categories,
      sortOptions,
      currentSort,
      brandOptions,
      serviceOptions,
      hotSearchWords,
      filterCount,
      
      // 方法
      handleSearch,
      handleClearSearch,
      clearSearchHistory,
      handleCategoryChange,
      handleSortChange,
      toggleViewMode,
      resetFilters,
      applyFilters,
      getTagColor,
      handleProductClick,
      handleAddToCart,
      handleBuyNow,
      onRefresh,
      onLoad
    }
  }
}
</script>

<style scoped>
.branch-products-container {
  background: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 20px;
}

/* 搜索容器 */
.search-container {
  background: #fff;
  height: 100%;
}

.search-content {
  padding: 16px;
}

.search-history, .hot-search {
  margin-top: 20px;
}

.history-header, .hot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.history-tags, .hot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-tag, .hot-tag {
  cursor: pointer;
}

/* 分类标签 */
.category-tabs {
  background: #fff;
  position: sticky;
  top: 46px;
  z-index: 99;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 90px;
  z-index: 98;
}

.filter-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-right: 16px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  position: relative;
}

.filter-item:last-child {
  margin-left: auto;
  margin-right: 0;
}

.filter-item .van-icon {
  margin-left: 4px;
  font-size: 12px;
}

/* 产品列表 */
.products-content {
  padding: 0 16px;
}

/* 网格视图 */
.products-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 12px;
}

.product-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

.product-card:active {
  transform: scale(0.98);
}

.product-image {
  position: relative;
  height: 160px;
}

.product-image .van-image {
  width: 100%;
  height: 100%;
}

.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #f5f5f5;
  color: #ccc;
}

.product-tags {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  gap: 4px;
}

.product-info {
  padding: 12px;
}

.product-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-desc {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-price {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.current-price {
  font-size: 16px;
  font-weight: 600;
  color: #ff4444;
}

.original-price {
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
}

.product-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.rating {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rating-text {
  font-size: 12px;
}

/* 列表视图 */
.products-list {
  margin-top: 12px;
}

.product-item {
  display: flex;
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

.product-item:active {
  transform: scale(0.98);
}

.product-item .product-image {
  width: 80px;
  height: 80px;
  margin-right: 12px;
  border-radius: 6px;
  overflow: hidden;
}

.product-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

/* 弹出层 */
.sort-popup, .filter-popup {
  background: #fff;
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.sort-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sort-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.sort-option.active {
  color: #1989fa;
}

.sort-option:last-child {
  border-bottom: none;
}

/* 筛选弹出层 */
.filter-section {
  margin-bottom: 24px;
}

.filter-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
}

.price-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price-input {
  flex: 1;
}

.price-separator {
  color: #999;
  font-size: 14px;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-checkbox {
  margin-bottom: 8px;
}

.filter-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.cancel-btn, .confirm-btn {
  flex: 1;
}

/* 产品详情弹出层 */
.product-detail {
  background: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.detail-image {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  margin-right: 16px;
}

.detail-info {
  flex: 1;
}

.detail-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.detail-price {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.detail-price .current-price {
  font-size: 18px;
  font-weight: 600;
  color: #ff4444;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.detail-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
}

.section-content {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.spec-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.spec-item {
  display: flex;
  font-size: 14px;
}

.spec-label {
  color: #666;
  width: 80px;
  flex-shrink: 0;
}

.spec-value {
  color: #333;
  flex: 1;
}

.rating-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.rating-score {
  color: #333;
  font-weight: 500;
}

.rating-count {
  color: #999;
}

.detail-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.action-btn {
  flex: 1;
}
</style> 