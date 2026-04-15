<template>
  <div class="tea-farmer-page">
    <van-nav-bar
      title="茶农助手"
      left-arrow
      fixed
      placeholder
      @click-left="router.back()"
    />

    <div class="page-body">
      <div v-if="pageLoading" class="page-loading">
        <van-loading type="spinner" color="#10b981" size="28px" />
        <span>加载茶园数据...</span>
      </div>

      <template v-else>
        <section class="card-section">
          <div class="info-card">
            <div class="info-main">
              <div>
                <p class="brand-name">{{ farmerInfo.brandName || '未设置品牌' }}</p>
                <p class="farm-name">{{ farmerInfo.farmName || '点击完善资料' }}</p>
              </div>
              <div class="info-actions">
                <van-button size="small" type="primary" plain @click="openInfoForm">
                  {{ farmerInfoConfigured ? '编辑' : '完善' }}
                </van-button>
                <van-button
                  class="market-link"
                  size="small"
                  type="success"
                  plain
                  @click="router.push('/tea-market')"
                >
                  市场
                </van-button>
              </div>
            </div>
            <div class="info-card__chips">
              <span class="info-chip" v-if="farmerInfo.location">
                <van-icon name="location-o" />
                {{ farmerInfo.location }}
              </span>
              <span class="info-chip" v-else>未填写山场信息</span>
              <span class="info-chip" v-if="farmerInfoConfigured">茶农已完成资料</span>
            </div>
            <p class="info-card__contact">
              <van-icon name="phone-o" />
              <span>{{ farmerInfo.contact || '未填写联系方式' }}</span>
            </p>
          </div>
          <div class="stats-grid">
            <div class="stat-item">
              <p class="stat-value">{{ productCount }}</p>
              <p class="stat-label">茶品种类</p>
            </div>
            <div class="stat-item">
              <p class="stat-value">{{ totalStockText }}</p>
              <p class="stat-label">当前库存(斤)</p>
            </div>
            <div class="stat-item">
              <p class="stat-value">{{ lastRecordText }}</p>
              <p class="stat-label">最近出入库</p>
            </div>
          </div>
        </section>

        <section class="actions">
          <van-button type="primary" block @click="openProductForm">
            新增茶品
          </van-button>
        </section>

        <section class="list-section">
          <div class="section-header">
            <h3>库存一览</h3>
            <span class="hint" v-if="productList.length">点击按钮即可增减库存</span>
          </div>
          <van-empty v-if="!productList.length" description="还没有入库的茶叶" />
          <van-cell-group v-else>
            <van-cell
              v-for="item in productList"
              :key="item.id"
              :title="item.name"
              :label="renderProductLabel(item)"
            >
              <template #right-icon>
                <div class="cell-actions">
                  <van-button size="small" type="success" @click="openStockForm(item, 'add')">
                    增加
                  </van-button>
                  <van-button size="small" type="danger" @click="openStockForm(item, 'reduce')">
                    减少
                  </van-button>
                  <van-button size="small" type="primary" plain @click="startEditProduct(item)">
                    编辑
                  </van-button>
                </div>
              </template>
            </van-cell>
          </van-cell-group>
        </section>

        <section class="list-section">
          <div class="section-header">
            <h3>最新库存动态</h3>
            <span class="hint" v-if="recentRecords.length">保留最近 5 条</span>
          </div>
          <van-empty v-if="!recentRecords.length" description="暂无库存记录" />
          <div v-else class="record-list">
            <div class="record-item" v-for="record in recentRecords" :key="record.id">
              <div>
                <p class="record-title">
                  {{ record.product_name || record.product?.name || '未知茶品' }}
                  <van-tag :type="record.operation === 'add' ? 'success' : 'danger'" plain>
                    {{ record.operation === 'add' ? '入库' : '出库' }}
                  </van-tag>
                </p>
                <p class="record-meta">{{ record.reason || '手动调整' }}</p>
              </div>
              <div class="record-amount">
                <p>{{ record.operation === 'add' ? '+' : '-' }}{{ Number(record.quantity).toFixed(2) }} 斤</p>
                <span>{{ formatRecordTime(record.created_at) }}</span>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>

    <!-- 基本信息表单 -->
    <van-popup v-model:show="infoFormVisible" round position="bottom" :style="{ height: '70%' }">
      <div class="popup-header">茶园基本信息</div>
      <van-cell-group inset>
        <van-field v-model="infoForm.farmName" label="茶厂名称" placeholder="必填" required />
        <van-field v-model="infoForm.brandName" label="品牌名" placeholder="必填" required />
        <van-field v-model="infoForm.location" label="山场位置" placeholder="必填" required rows="2" type="textarea" />
        <van-field v-model="infoForm.contact" label="联系方式" placeholder="必填" required />
      </van-cell-group>
      <div class="popup-actions">
        <van-button type="primary" block :loading="infoSubmitting" @click="saveInfo">保存信息</van-button>
      </div>
    </van-popup>

    <!-- 新增茶品 -->
    <van-popup v-model:show="productFormVisible" round position="bottom" :style="{ height: '80%' }">
      <div class="popup-header">{{ isEditingProduct ? '编辑茶品' : '新增茶品' }}</div>
      <van-cell-group inset>
        <van-field v-model="productForm.name" label="茶品名称" placeholder="例如 大红袍" required />
        <van-field v-model="productForm.alias" label="别名" placeholder="选填" />
        <van-field
          v-if="!isEditingProduct"
          v-model.number="productForm.initialStock"
          label="初始库存"
          type="number"
          placeholder="请输入斤数"
          required
        >
          <template #button>斤</template>
        </van-field>
        <div v-else class="editing-stock-tip">
          当前库存：<strong>{{ editingProductSnapshot?.stock ?? '--' }}</strong> 斤
        </div>
        <van-field label="茶叶类型">
          <template #input>
            <van-radio-group v-model="productForm.category" direction="horizontal">
              <van-radio v-for="item in categoryOptions" :key="item" :name="item">{{ item }}</van-radio>
            </van-radio-group>
          </template>
        </van-field>
        <van-field v-if="showFireLevel" label="火功">
          <template #input>
            <van-radio-group v-model="productForm.fireLevel" direction="horizontal">
              <van-radio v-for="item in fireLevelOptions" :key="item" :name="item">{{ item }}</van-radio>
            </van-radio-group>
          </template>
        </van-field>
        <van-field v-model="productForm.remark" label="备注" type="textarea" rows="2" placeholder="选填" />
      </van-cell-group>
      <div class="popup-actions">
        <van-button type="primary" block :loading="productSubmitting" @click="saveProduct">
          {{ isEditingProduct ? '保存修改' : '保存茶品' }}
        </van-button>
      </div>
    </van-popup>

    <!-- 库存调整 -->
    <van-popup v-model:show="stockFormVisible" round position="bottom" :style="{ height: '65%' }">
      <div class="popup-header">
        {{ stockMode === 'add' ? '增加' : '减少' }}库存 - {{ currentProduct?.name || '' }}
      </div>
      <van-cell-group inset>
        <van-field v-model.number="stockForm.quantity" label="数量" type="number" placeholder="输入斤数" required>
          <template #button>斤</template>
        </van-field>
        <van-field v-model="stockForm.reason" label="备注" type="textarea" rows="2" placeholder="选填" />
      </van-cell-group>
      <div class="popup-actions">
        <van-button
          :type="stockMode === 'add' ? 'success' : 'danger'"
          block
          :loading="stockSubmitting"
          @click="saveStockChange"
        >
          确认{{ stockMode === 'add' ? '增加' : '减少' }}
        </van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import {
  getTeaFarmerInfo,
  saveTeaFarmerInfo,
  getTeaProducts,
  addTeaProduct,
  updateTeaProduct,
  adjustTeaStock,
  getTeaStockRecords
} from '@/api/teaFarmer'

const router = useRouter()
const userStore = useUserStore()

const pageLoading = ref(true)
const infoFormVisible = ref(false)
const productFormVisible = ref(false)
const stockFormVisible = ref(false)
const infoSubmitting = ref(false)
const productSubmitting = ref(false)
const stockSubmitting = ref(false)

const farmerInfo = reactive({
  farmName: '',
  brandName: '',
  location: '',
  contact: ''
})

const infoForm = reactive({
  farmName: '',
  brandName: '',
  location: '',
  contact: ''
})

const productForm = reactive({
  name: '',
  alias: '',
  initialStock: '',
  category: '成品',
  fireLevel: '中火',
  remark: ''
})
const editingProductId = ref(null)
const editingProductSnapshot = ref(null)

const stockForm = reactive({
  quantity: '',
  reason: ''
})

const productList = ref([])
const recentRecords = ref([])
const currentProduct = ref(null)
const stockMode = ref('add')

const categoryOptions = ['毛茶', '走水', '成品']
const fireLevelOptions = ['轻火', '中火', '高火']
const showFireLevel = computed(() => productForm.category === '成品')
const isEditingProduct = computed(() => editingProductId.value !== null)

watch(
  () => productForm.category,
  (value) => {
    if (value !== '成品') {
      productForm.fireLevel = ''
    } else if (!productForm.fireLevel) {
      productForm.fireLevel = '中火'
    }
  }
)

const resetProductForm = () => {
  editingProductId.value = null
  editingProductSnapshot.value = null
  Object.assign(productForm, {
    name: '',
    alias: '',
    initialStock: '',
    category: '成品',
    fireLevel: '中火',
    remark: ''
  })
}

const farmerInfoConfigured = computed(() =>
  farmerInfo.farmName && farmerInfo.brandName && farmerInfo.location && farmerInfo.contact
)

const productCount = computed(() => productList.value.length)
const totalStock = computed(() =>
  productList.value.reduce((sum, item) => sum + Number(item.stock || 0), 0)
)
const totalStockText = computed(() => totalStock.value.toFixed(2))
const lastRecordText = computed(() => {
  if (!recentRecords.value.length) {
    return '--'
  }
  return formatRecordTime(recentRecords.value[0].created_at)
})

const openInfoForm = () => {
  Object.assign(infoForm, farmerInfo)
  infoFormVisible.value = true
}

const openProductForm = () => {
  if (!farmerInfoConfigured.value) {
    showToast('请先完善茶园信息')
    return
  }
  resetProductForm()
  productFormVisible.value = true
}

const openStockForm = (product, mode) => {
  currentProduct.value = product
  stockMode.value = mode
  stockForm.quantity = ''
  stockForm.reason = ''
  stockFormVisible.value = true
}

const startEditProduct = (product) => {
  editingProductId.value = product.id
  editingProductSnapshot.value = product
  productForm.name = product.name
  productForm.alias = product.alias || ''
  productForm.category = product.parameters?.type || '成品'
  productForm.fireLevel = product.parameters?.fireLevel || (productForm.category === '成品' ? '中火' : '')
  productForm.remark = product.remark || ''
  productForm.initialStock = ''
  productFormVisible.value = true
}

const saveInfo = async () => {
  if (!infoForm.farmName || !infoForm.brandName || !infoForm.location || !infoForm.contact) {
    showToast('请补全信息')
    return
  }

  infoSubmitting.value = true
  try {
    const response = await saveTeaFarmerInfo({
      farm_name: infoForm.farmName,
      brand_name: infoForm.brandName,
      location: infoForm.location,
      contact: infoForm.contact
    })

    if (response.code === 0) {
      Object.assign(farmerInfo, infoForm)
      showToast('信息已保存')
      infoFormVisible.value = false
    } else {
      showToast(response.message || '保存失败')
    }
  } catch (error) {
    console.error(error)
    showToast('保存失败，请稍后重试')
  } finally {
    infoSubmitting.value = false
  }
}

const extractErrorMessage = (error, fallback) => {
  if (error?.response?.data?.message) return error.response.data.message
  if (error?.message) return error.message
  return fallback
}

const saveProduct = async () => {
  if (!productForm.name) {
    showToast('请填写茶品名称')
    return
  }
  if (!isEditingProduct.value && !productForm.initialStock) {
    showToast('请输入初始库存')
    return
  }

  productSubmitting.value = true
  try {
    const parameters = {
      type: productForm.category
    }
    if (showFireLevel.value && productForm.fireLevel) {
      parameters.fireLevel = productForm.fireLevel
    }

    if (isEditingProduct.value) {
      const payload = {
        name: productForm.name,
        alias: productForm.alias,
        parameters,
        remark: productForm.remark
      }
      const response = await updateTeaProduct(editingProductId.value, payload)
      if (response.code === 0) {
        showToast('茶品已更新')
        productFormVisible.value = false
        await loadProducts()
      } else {
        showToast(response.message || '更新失败')
      }
    } else {
      const payload = {
        name: productForm.name,
        alias: productForm.alias,
        parameters,
        initial_stock: Number(productForm.initialStock),
        remark: productForm.remark
      }
      const response = await addTeaProduct(payload)
      if (response.code === 0) {
        showToast('茶品已添加')
        productFormVisible.value = false
        await Promise.all([loadProducts(), loadStockRecords()])
      } else {
        showToast(response.message || '添加失败')
      }
    }
  } catch (error) {
    const fallback = isEditingProduct.value ? '更新失败，请稍后重试' : '添加失败，请稍后重试'
    console.error('[TeaFarmer] 保存茶品失败:', error)
    showToast(extractErrorMessage(error, fallback))
  } finally {
    productSubmitting.value = false
  }
}

const saveStockChange = async () => {
  if (!stockForm.quantity || !currentProduct.value) {
    showToast('请输入正确的斤数')
    return
  }

  stockSubmitting.value = true
  try {
    const response = await adjustTeaStock({
      product_id: currentProduct.value.id,
      operation: stockMode.value,
      quantity: Number(stockForm.quantity),
      reason: stockForm.reason
    })

    if (response.code === 0) {
      const updatedStock = response.data.current_stock
      productList.value = productList.value.map((item) =>
        item.id === currentProduct.value.id ? { ...item, stock: Number(updatedStock) } : item
      )
      await loadStockRecords()
      showToast('库存已更新')
      stockFormVisible.value = false
    } else {
      showToast(response.message || '操作失败')
    }
  } catch (error) {
    console.error(error)
    showToast('操作失败，请稍后重试')
  } finally {
    stockSubmitting.value = false
  }
}

const renderProductLabel = (product) => {
  const type = product.parameters?.type
  const fireLevel = product.parameters?.fireLevel
  const alias = product.alias || '无别名'
  return `${alias} ｜ ${product.stock.toFixed(2)}斤${type ? ' ｜ ' + type : ''}${fireLevel ? ' ｜ ' + fireLevel : ''}`
}

const toDate = (raw) => {
  if (!raw) return null
  if (raw instanceof Date) return raw
  if (typeof raw === 'number') return new Date(raw)
  if (typeof raw === 'string') {
    // ISO 字符串直接交给 Date 解析，其余通过 / 兼容 Safari
    const normalized = raw.includes('T') ? raw : raw.replace(/-/g, '/').replace(/\.\d+/, '')
    const parsed = new Date(normalized)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

const formatRecordTime = (value) => {
  const date = toDate(value)
  if (!date) return value || '--'
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

const parseParameters = (raw) => {
  if (!raw) return {}
  if (typeof raw === 'object') return raw
  try {
    return JSON.parse(raw)
  } catch (error) {
    return {}
  }
}

const loadFarmerInfo = async () => {
  const response = await getTeaFarmerInfo()
  if (response.code === 0 && response.data) {
    farmerInfo.farmName = response.data.farm_name || ''
    farmerInfo.brandName = response.data.brand_name || ''
    farmerInfo.location = response.data.location || ''
    farmerInfo.contact = response.data.contact || ''
  }
}

const loadProducts = async () => {
  const response = await getTeaProducts()
  if (response.code === 0) {
    productList.value = response.data.map((item) => ({
      id: item.id,
      name: item.name,
      alias: item.alias,
      parameters: parseParameters(item.parameters),
      stock: Number(item.stock || 0)
    }))
  }
}

const loadStockRecords = async () => {
  const response = await getTeaStockRecords()
  if (response.code === 0) {
    recentRecords.value = response.data.slice(0, 5)
  }
}

const initPage = async () => {
  pageLoading.value = true
  try {
    await Promise.all([loadFarmerInfo(), loadProducts(), loadStockRecords()])
  } catch (error) {
    console.error(error)
    showToast('加载数据失败')
  } finally {
    pageLoading.value = false
  }
}

const ensureLogin = () => {
  if (!userStore.userId) {
    showToast('请先登录账户')
    router.back()
    return false
  }
  return true
}

onMounted(() => {
  if (ensureLogin()) {
    initPage()
  }
})

watch(productFormVisible, (visible) => {
  if (!visible) {
    resetProductForm()
  }
})
</script>

<style scoped>
.tea-farmer-page {
  min-height: 100vh;
  background: #f6f7fb;
}

.page-body {
  padding: 12px 16px 40px;
}

.page-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 120px 0 40px;
  color: #888;
  font-size: 14px;
}

.card-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-card {
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  border-radius: 18px;
  padding: 16px;
  box-shadow: 0 15px 30px rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.market-link {
  border-color: #10b981;
  color: #10b981;
}

.editing-stock-tip {
  margin: 6px 0 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #ecfdf5;
  color: #047857;
  font-size: 14px;
}

.info-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.info-actions {
  display: flex;
  gap: 8px;
}

.info-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0 10px;
}

.info-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  color: #047857;
  font-size: 13px;
}

.info-card__contact {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.08);
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
}

.brand-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.farm-name {
  margin: 4px 0 0;
  color: #6b7280;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  background: #fff;
  border-radius: 16px;
  padding: 12px 0;
  text-align: center;
  gap: 8px;
}

.stat-item {
  border-right: 1px solid #f0f0f0;
}

.stat-item:last-child {
  border-right: none;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.stat-label {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 12px;
}

.actions {
  margin: 18px 0;
}

.list-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.section-header .hint {
  font-size: 12px;
  color: #6b7280;
}

.cell-actions {
  display: flex;
  gap: 8px;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.record-item {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}

.record-title {
  margin: 0 0 4px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.record-meta {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}

.record-amount {
  text-align: right;
  font-size: 13px;
  color: #111827;
}

.record-amount span {
  display: block;
  margin-top: 4px;
  color: #9ca3af;
}

.popup-header {
  text-align: center;
  padding: 16px 0;
  font-size: 16px;
  font-weight: 600;
}

.popup-actions {
  padding: 12px 16px 24px;
}
</style>
