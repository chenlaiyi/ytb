<template>
  <div class="merchant-products">
    <div class="page-header">
      <h1>商户商品管理</h1>
      <p>查看并审核商户提交的商品，支持批量审核、上下架等操作</p>
    </div>

    <div class="stats-section">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-card primary">
            <div class="stat-title">商品总数</div>
            <div class="stat-value">{{ stats.goods.total }}</div>
            <div class="stat-meta">
              <span>上架 {{ stats.goods.on_sale }}</span>
              <span>下架 {{ stats.goods.offline }}</span>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card warning">
            <div class="stat-title">待审核</div>
            <div class="stat-value">{{ stats.goods.pending }}</div>
            <div class="stat-meta">
              <span>已通过 {{ stats.goods.approved }}</span>
              <span>已拒绝 {{ stats.goods.rejected }}</span>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card success">
            <div class="stat-title">商户数量</div>
            <div class="stat-value">{{ stats.merchants.total }}</div>
            <div class="stat-meta">
              <span>启用 {{ stats.merchants.active }}</span>
              <span>待审核 {{ stats.merchants.pending }}</span>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card neutral">
            <div class="stat-title">销售额</div>
            <div class="stat-value">¥{{ formatAmount(stats.sales.total_amount) }}</div>
            <div class="stat-meta">
              <span>今日 ¥{{ formatAmount(stats.sales.today_amount) }}</span>
              <span>本月 ¥{{ formatAmount(stats.sales.month_amount) }}</span>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <div class="search-section">
      <el-form :inline="true" @submit.prevent="handleSearch">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="商品名称/标题"
            clearable
            @keyup.enter.native="handleSearch"
          />
        </el-form-item>
        <el-form-item label="商户名称">
          <el-input
            v-model="searchForm.merchant_name"
            placeholder="商户名称"
            clearable
            @keyup.enter.native="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable @change="handleSearch">
            <el-option
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.label"
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

    <div class="products-section">
      <div class="table-actions">
        <el-space>
          <el-button type="success" :disabled="!hasPendingSelection" @click="batchApprove">批量通过</el-button>
          <el-button type="danger" :disabled="!hasPendingSelection" @click="batchReject">批量拒绝</el-button>
          <el-button :disabled="selectedRows.length === 0" @click="clearSelection">清空选择</el-button>
        </el-space>
      </div>

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="products"
        border
        stripe
        class="products-table"
        empty-text="暂无商品数据"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="52" />
        <el-table-column label="商品" min-width="280">
          <template #default="{ row }">
            <div class="table-product">
              <el-image :src="row.thumbnail || defaultImage" fit="cover" class="table-product-image" />
              <div class="table-product-info">
                <div class="table-product-name">{{ row.name || row.title || '未命名商品' }}</div>
                <div class="table-product-desc">{{ row.description || '暂无描述' }}</div>
                <div class="table-product-tags">
                  <el-tag size="small" type="info">ID {{ row.id }}</el-tag>
                  <el-tag v-if="row.type_text" size="small">{{ row.type_text }}</el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="商户" min-width="180">
          <template #default="{ row }">
            <div class="merchant-info">
              <div class="merchant-name">{{ row.merchant_name || '未知商户' }}</div>
              <div class="merchant-code" v-if="row.merchant_code">编号：{{ row.merchant_code }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="价格" min-width="140">
          <template #default="{ row }">
            <div class="price-block">
              <span class="current-price">¥{{ formatAmount(row.price) }}</span>
              <span
                v-if="row.market_price && row.market_price !== row.price"
                class="market-price"
              >¥{{ formatAmount(row.market_price) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="库存/销量" min-width="160">
          <template #default="{ row }">
            <div class="metric-block">
              <span>库存：{{ row.stock }}</span>
              <span>冻结：{{ row.freeze_stock }}</span>
              <span>销量：{{ row.buy_count }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="150">
          <template #default="{ row }">
            <div class="metric-block">
              <el-tag :type="getStatusTagType(row.status)">{{ getStatusText(row.status) }}</el-tag>
              <div v-if="row.review_note" class="note-text">备注：{{ row.review_note }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" min-width="180">
          <template #default="{ row }">
            <div>{{ formatDate(row.updated_at) }}</div>
            <div class="sub-date">创建：{{ formatDate(row.created_at) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="240">
          <template #default="{ row }">
            <el-space wrap>
              <el-button size="small" type="primary" @click="viewProduct(row)">详情</el-button>
              <el-button
                v-if="canApproveStatus(row.status)"
                size="small"
                type="success"
                @click="openReviewDialog('approve', row)"
              >审核通过</el-button>
              <el-button
                v-if="canRejectStatus(row.status)"
                size="small"
                type="danger"
                @click="openReviewDialog('reject', row)"
              >审核拒绝</el-button>
              <el-button
                v-if="canToggleStatus(row.status)"
                size="small"
                :type="Number(row.status) === 1 ? 'warning' : 'success'"
                @click="toggleProductStatus(row)"
              >{{ Number(row.status) === 1 ? '下架' : '上架' }}</el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-section" v-if="pagination.total > 0">
        <el-pagination
          v-model:current-page="pagination.current_page"
          :page-size="pagination.per_page"
          :total="pagination.total"
          layout="total, prev, pager, next, jumper"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <el-dialog v-model="showProductDetail" title="商品详情" width="720px">
      <div v-if="currentProduct" class="product-detail">
        <div class="detail-header">
          <el-image :src="currentProduct.thumbnail || defaultImage" fit="cover" class="detail-image" />
          <div class="detail-basic">
            <h3>{{ currentProduct.name || currentProduct.title }}</h3>
            <p>{{ currentProduct.description || '暂无描述' }}</p>
            <div class="detail-tags">
              <el-tag>商户：{{ currentProduct.merchant_name || '未知' }}</el-tag>
              <el-tag type="info">状态：{{ getStatusText(currentProduct.status) }}</el-tag>
            </div>
            <div class="detail-price">
              <span class="current-price">¥{{ formatAmount(currentProduct.price) }}</span>
              <span
                v-if="currentProduct.market_price && currentProduct.market_price !== currentProduct.price"
                class="market-price"
              >¥{{ formatAmount(currentProduct.market_price) }}</span>
            </div>
          </div>
        </div>
        <el-descriptions :column="2" border class="detail-grid">
          <el-descriptions-item label="库存">{{ currentProduct.stock }}</el-descriptions-item>
          <el-descriptions-item label="冻结库存">{{ currentProduct.freeze_stock }}</el-descriptions-item>
          <el-descriptions-item label="销量">{{ currentProduct.buy_count }}</el-descriptions-item>
          <el-descriptions-item label="排序">{{ currentProduct.sort }}</el-descriptions-item>
          <el-descriptions-item label="分类">{{ currentProduct.category_name || '未分类' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(currentProduct.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDate(currentProduct.updated_at) }}</el-descriptions-item>
          <el-descriptions-item label="审核备注">{{ currentProduct.review_note || '暂无' }}</el-descriptions-item>
        </el-descriptions>
        <div class="detail-images" v-if="currentProduct.images && currentProduct.images.length">
          <div class="section-title">商品图片</div>
          <el-image
            v-for="(image, idx) in currentProduct.images"
            :key="idx"
            :src="image"
            fit="cover"
            class="detail-thumb"
            :preview-src-list="currentProduct.images"
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="showProductDetail = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="reviewDialogVisible"
      :title="reviewAction === 'approve' ? '审核通过' : '审核拒绝'"
      width="420px"
    >
      <el-form label-position="top">
        <el-form-item :label="reviewAction === 'approve' ? '通过备注（可选）' : '拒绝理由'">
          <el-input
            v-model="reviewForm.reason"
            type="textarea"
            :rows="4"
            maxlength="200"
            show-word-limit
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReview">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { mallMerchantApi } from '@/api/v1/mall'

const STATUS_OPTIONS = [
  { label: '全部状态', value: '' },
  { label: '待审核', value: 2 },
  { label: '审核中', value: 3 },
  { label: '审核拒绝', value: 4 },
  { label: '已上架', value: 1 },
  { label: '已下架', value: 0 },
  { label: '系统下架', value: 5 }
]

const STATUS_MAP = {
  0: { text: '下架', tag: 'info' },
  1: { text: '上架', tag: 'success' },
  2: { text: '待审核', tag: 'warning' },
  3: { text: '审核中', tag: 'warning' },
  4: { text: '审核拒绝', tag: 'danger' },
  5: { text: '系统下架', tag: 'danger' }
}

const createDefaultStats = () => ({
  goods: {
    total: 0,
    on_sale: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    offline: 0,
    force_offline: 0
  },
  merchants: {
    total: 0,
    active: 0,
    pending: 0,
    inactive: 0
  },
  orders: {
    total: 0,
    today: 0,
    pending_payment: 0,
    pending_ship: 0,
    completed: 0
  },
  sales: {
    total_amount: 0,
    today_amount: 0,
    month_amount: 0,
    year_amount: 0
  }
})

const canToggleStatus = (status) => [0, 1].includes(Number(status))
const canApproveStatus = (status) => [2, 3, 4].includes(Number(status))
const canRejectStatus = (status) => [1, 2, 3].includes(Number(status))

export default {
  name: 'MerchantProducts',
  setup() {
    const statusOptions = STATUS_OPTIONS
    const loading = ref(false)
    const tableRef = ref(null)
    const products = ref([])
    const stats = ref(createDefaultStats())
    const defaultImage = '/admin/images/default-product.png'

    const pagination = reactive({
      current_page: 1,
      per_page: 20,
      total: 0,
      last_page: 1
    })

    const searchForm = reactive({
      keyword: '',
      merchant_name: '',
      status: ''
    })

    const selectedRows = ref([])
    const reviewDialogVisible = ref(false)
    const reviewAction = ref('approve')
    const reviewTargets = ref([])
    const reviewForm = reactive({ reason: '' })

    const showProductDetail = ref(false)
    const currentProduct = ref(null)

    const hasPendingSelection = computed(() =>
      selectedRows.value.some(row => canApproveStatus(row.status))
    )

    const loadStats = async () => {
      try {
        const response = await mallMerchantApi.getDashboard()
        if (response?.code === 0 && response?.data) {
          const base = createDefaultStats()
          stats.value = {
            goods: { ...base.goods, ...(response.data.goods || {}) },
            merchants: { ...base.merchants, ...(response.data.merchants || {}) },
            orders: { ...base.orders, ...(response.data.orders || {}) },
            sales: { ...base.sales, ...(response.data.sales || {}) }
          }
        }
      } catch (error) {
        console.error('加载统计数据失败:', error)
      }
    }

    const loadProducts = async () => {
      if (loading.value) return
      loading.value = true
      try {
        const params = {
          keyword: searchForm.keyword || undefined,
          merchant_name: searchForm.merchant_name || undefined,
          status: searchForm.status === '' ? undefined : searchForm.status,
          page: pagination.current_page,
          per_page: pagination.per_page
        }
        const response = await mallMerchantApi.getProducts(params)
        if (response?.code === 0 && response?.data) {
          const pageData = response.data
          const list = Array.isArray(pageData.data) ? pageData.data : []
          products.value = list.map(item => {
            const status = Number(item.status)
            const meta = STATUS_MAP[status] || { text: '未知状态', tag: 'info' }
            const images = Array.isArray(item.images)
              ? item.images
              : item.images
                ? String(item.images).split(',').filter(Boolean)
                : []

            return {
              ...item,
              status,
              status_text: item.status_text || meta.text,
              status_tag_type: item.status_tag_type || meta.tag,
              images,
              price: Number(item.price ?? 0),
              market_price: Number(item.market_price ?? 0),
              discount_price: Number(item.discount_price ?? 0)
            }
          })
          tableRef.value?.clearSelection()
          selectedRows.value = []
          pagination.total = pageData.total || 0
          pagination.last_page = pageData.last_page || 1
          pagination.current_page = pageData.current_page || params.page
          pagination.per_page = pageData.per_page || pagination.per_page
        } else {
          throw new Error(response?.message || '加载失败')
        }
      } catch (error) {
        console.error('加载商品失败:', error)
        ElMessage.error(error.message || '加载商品失败')
      } finally {
        loading.value = false
      }
    }

    const handleSelectionChange = (rows) => {
      selectedRows.value = rows
    }

    const clearSelection = () => {
      tableRef.value?.clearSelection()
      selectedRows.value = []
    }

    const handleSearch = () => {
      pagination.current_page = 1
      loadProducts()
    }

    const resetSearch = () => {
      searchForm.keyword = ''
      searchForm.merchant_name = ''
      searchForm.status = ''
      pagination.current_page = 1
      loadProducts()
    }

    const handlePageChange = (page) => {
      pagination.current_page = page
      loadProducts()
    }

    const openReviewDialog = (action, targets) => {
      reviewAction.value = action
      reviewForm.reason = ''
      reviewTargets.value = Array.isArray(targets) ? targets : [targets]
      reviewDialogVisible.value = true
    }

    const submitReview = async () => {
      const statusValue = reviewAction.value === 'approve' ? 1 : 4
      if (reviewAction.value === 'reject' && !reviewForm.reason.trim()) {
        ElMessage.warning('请填写拒绝理由')
        return
      }

      try {
        if (reviewTargets.value.length === 1) {
          const target = reviewTargets.value[0]
          const response = await mallMerchantApi.auditProduct(target.id, {
            status: statusValue,
            review_note: reviewForm.reason
          })
          if (response?.code !== 0) {
            throw new Error(response?.message || '审核失败')
          }
        } else {
          const ids = reviewTargets.value.map(item => item.id)
          const response = await mallMerchantApi.batchAuditProducts({
            product_ids: ids,
            status: statusValue,
            review_note: reviewForm.reason
          })
          if (response?.code !== 0) {
            throw new Error(response?.message || '批量审核失败')
          }
        }

        ElMessage.success(reviewAction.value === 'approve' ? '审核通过成功' : '审核拒绝成功')
        reviewDialogVisible.value = false
        clearSelection()
        await Promise.all([loadProducts(), loadStats()])
      } catch (error) {
        console.error('审核失败:', error)
        ElMessage.error(error.message || '审核失败')
      }
    }

    const batchApprove = () => {
      const targets = selectedRows.value.filter(row => canApproveStatus(row.status))
      if (targets.length === 0) {
        ElMessage.warning('请选择需要审核的商品')
        return
      }
      openReviewDialog('approve', targets)
    }

    const batchReject = () => {
      const targets = selectedRows.value.filter(row => canRejectStatus(row.status))
      if (targets.length === 0) {
        ElMessage.warning('请选择需要审核的商品')
        return
      }
      openReviewDialog('reject', targets)
    }

    const viewProduct = async (row) => {
      try {
        const response = await mallMerchantApi.getProductDetail(row.id)
        if (response?.code === 0 && response?.data) {
          const detail = response.data
          detail.images = Array.isArray(detail.images)
            ? detail.images
            : detail.images
              ? String(detail.images).split(',').filter(Boolean)
              : []
          currentProduct.value = detail
        } else {
          currentProduct.value = {
            ...row,
            images: row.images || []
          }
        }
      } catch (error) {
        console.error('获取商品详情失败:', error)
        currentProduct.value = {
          ...row,
          images: row.images || []
        }
      }
      showProductDetail.value = true
    }

    const toggleProductStatus = async (row) => {
      if (!canToggleStatus(row.status)) {
        ElMessage.warning('当前状态不可直接上下架，请先完成审核')
        return
      }

      const nextStatus = Number(row.status) === 1 ? 0 : 1
      const actionText = nextStatus === 1 ? '上架' : '下架'
      try {
        await ElMessageBox.confirm(`确定要${actionText}该商品吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        const response = await mallMerchantApi.updateProductStatus(row.id, { status: nextStatus })
        if (response?.code === 0) {
          ElMessage.success(`${actionText}成功`)
          await Promise.all([loadProducts(), loadStats()])
        } else {
          throw new Error(response?.message || `${actionText}失败`)
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error(`${actionText}失败:`, error)
          ElMessage.error(error.message || `${actionText}失败`)
        }
      }
    }

    const getStatusText = (status) => STATUS_MAP[Number(status)]?.text || '未知状态'
    const getStatusTagType = (status) => STATUS_MAP[Number(status)]?.tag || 'info'

    const formatDate = (value) => {
      if (!value) return '-'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return value
      return date.toLocaleString('zh-CN')
    }

    const formatAmount = (value) => {
      const num = Number(value) || 0
      return num.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    onMounted(() => {
      loadStats()
      loadProducts()
    })

    return {
      loading,
      tableRef,
      products,
      stats,
      searchForm,
      statusOptions,
      pagination,
      selectedRows,
      hasPendingSelection,
      reviewDialogVisible,
      reviewForm,
      reviewAction,
      showProductDetail,
      currentProduct,
      defaultImage,
      handleSelectionChange,
      clearSelection,
      handleSearch,
      resetSearch,
      handlePageChange,
      openReviewDialog,
      submitReview,
      batchApprove,
      batchReject,
      viewProduct,
      toggleProductStatus,
      canApproveStatus,
      canRejectStatus,
      canToggleStatus,
      getStatusText,
      getStatusTagType,
      formatDate,
      formatAmount,
      loadProducts
    }
  }
}
</script>

<style scoped>
.merchant-products {
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

.table-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
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

.merchant-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.merchant-name {
  font-weight: 600;
  color: #1f2937;
}

.merchant-code {
  color: #6b7280;
  font-size: 13px;
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

.note-text {
  font-size: 12px;
  color: #9ca3af;
}

.pagination-section {
  display: flex;
  justify-content: center;
  padding: 20px 0 0;
}

.product-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-header {
  display: flex;
  gap: 16px;
}

.detail-image {
  width: 160px;
  height: 160px;
  border-radius: 12px;
  background: #f3f4f6;
}

.detail-basic {
  flex: 1;
}

.detail-basic h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.detail-basic p {
  margin: 0 0 12px 0;
  color: #4b5563;
}

.detail-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.detail-price {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.detail-price .current-price {
  font-size: 20px;
  font-weight: 600;
  color: #ef4444;
}

.detail-price .market-price {
  font-size: 14px;
  color: #9ca3af;
  text-decoration: line-through;
}

.detail-grid {
  background: #fff;
  border-radius: 12px;
}

.detail-images {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.detail-thumb {
  width: 96px;
  height: 96px;
  border-radius: 8px;
  background: #f3f4f6;
}

.section-title {
  width: 100%;
  font-weight: 600;
  color: #1f2937;
}

.sub-date {
  color: #9ca3af;
  font-size: 12px;
}
</style>
