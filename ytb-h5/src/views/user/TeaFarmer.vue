<template>
  <div class="tea-farmer-container">
    <van-nav-bar
      title="茶农助手"
      left-text="返回"
      left-arrow
      @click-left="onClickLeft"
    />

    <van-tabs v-model:active="activeTab" sticky>
      <van-tab title="基本信息">
        <div class="info-section">
          <van-form @submit="onSaveInfo">
            <van-cell-group inset>
              <van-field
                v-model="teaFarmerInfo.farmName"
                name="farmName"
                label="茶厂名称"
                placeholder="请输入茶厂名称"
                :rules="[{ required: true, message: '请填写茶厂名称' }]"
              />
              <van-field
                v-model="teaFarmerInfo.brandName"
                name="brandName"
                label="茶品牌"
                placeholder="请输入茶品牌名称"
                :rules="[{ required: true, message: '请填写茶品牌' }]"
              />
              <van-field
                v-model="teaFarmerInfo.location"
                name="location"
                label="茶山位置"
                placeholder="请输入茶山位置"
                :rules="[{ required: true, message: '请填写茶山位置' }]"
              />
              <van-field
                v-model="teaFarmerInfo.contact"
                name="contact"
                label="联系方式"
                placeholder="请输入联系方式"
                :rules="[{ required: true, message: '请填写联系方式' }]"
              />
            </van-cell-group>
            <div style="margin: 16px;">
              <van-button round block type="primary" native-type="submit">
                保存信息
              </van-button>
            </div>
          </van-form>
        </div>
      </van-tab>

      <van-tab title="茶叶库存">
        <div class="inventory-section">
          <van-button 
            type="primary" 
            size="small" 
            @click="showAddProductDialog = true"
            style="margin: 10px;"
          >
            茶品入库
          </van-button>

          <van-list>
            <van-card
              v-for="product in productList"
              :key="product.id"
              :title="product.name"
              :desc="product.alias"
              :price="product.parameters"
            >
              <template #tags>
                <van-tag plain type="primary">{{ product.type }}</van-tag>
              </template>
              <template #footer>
                <div class="inventory-footer">
                  <span>库存: {{ product.stock }} 斤</span>
                  <div class="actions">
                    <van-button 
                      size="mini" 
                      type="primary" 
                      @click="openAdjustStockDialog(product, 'add')"
                    >
                      增加
                    </van-button>
                    <van-button 
                      size="mini" 
                      type="danger" 
                      @click="openAdjustStockDialog(product, 'reduce')"
                      style="margin-left: 5px;"
                    >
                      减少
                    </van-button>
                  </div>
                </div>
              </template>
            </van-card>
          </van-list>
        </div>
      </van-tab>

      <van-tab title="操作记录">
        <div class="records-section">
          <van-list>
            <van-cell
              v-for="record in stockRecords"
              :key="record.id"
              :title="record.productName"
              :label="`${record.operation} ${record.quantity} 斤`"
            >
              <template #value>
                <span class="record-date">{{ record.date }}</span>
              </template>
            </van-cell>
          </van-list>
        </div>
      </van-tab>
    </van-tabs>

    <!-- 添加茶品对话框 -->
    <van-dialog
      v-model:show="showAddProductDialog"
      title="茶品入库"
      show-cancel-button
      @confirm="onAddProduct"
    >
      <van-form ref="productForm">
        <van-cell-group inset>
          <van-field
            v-model="newProduct.name"
            label="茶品名称"
            placeholder="请选择或输入茶品名称"
            is-link
            readonly
            @click="showProductPicker = true"
          />
          <van-field
            v-model="newProduct.alias"
            label="别名"
            placeholder="请输入别名，如：肉桂1号"
          />
          <van-field
            v-model="newProduct.parameters"
            label="参数"
            placeholder="请输入参数，如：毛茶、走水、成品（轻火、中火、高火）"
            type="textarea"
          />
          <van-field
            v-model="newProduct.initialStock"
            label="初始库存(斤)"
            placeholder="请输入初始库存"
            type="number"
          />
        </van-cell-group>
      </van-form>
    </van-dialog>

    <!-- 茶品选择器 -->
    <van-popup v-model:show="showProductPicker" round position="bottom">
      <van-picker
        title="选择茶品"
        :columns="teaProducts"
        @confirm="onProductConfirm"
        @cancel="showProductPicker = false"
      />
    </van-popup>

    <!-- 调整库存对话框 -->
    <van-dialog
      v-model:show="showAdjustStockDialog"
      title="调整库存"
      show-cancel-button
      @confirm="onAdjustStock"
    >
      <van-form ref="adjustForm">
        <van-cell-group inset>
          <van-field
            v-model="adjustStockData.productName"
            label="茶品"
            readonly
          />
          <van-field
            v-model="adjustStockData.quantity"
            label="数量(斤)"
            placeholder="请输入调整数量"
            type="number"
          />
          <van-field
            v-model="adjustStockData.reason"
            label="原因"
            placeholder="请输入调整原因"
            type="textarea"
          />
        </van-cell-group>
      </van-form>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showFailToast } from 'vant'
import { saveTeaFarmerInfo, getTeaFarmerInfo, addTeaProduct, getTeaProducts, adjustTeaStock, getTeaStockRecords } from '@/api/teaFarmer'

const router = useRouter()
const activeTab = ref(0)

// 茶农基本信息
const teaFarmerInfo = ref({
  farmName: '',
  brandName: '',
  location: '',
  contact: ''
})

// 茶品列表
const productList = ref([])

// 操作记录
const stockRecords = ref([])

// 添加茶品相关
const showAddProductDialog = ref(false)
const showProductPicker = ref(false)
const newProduct = ref({
  name: '',
  alias: '',
  parameters: '',
  initialStock: ''
})

// 预设茶品
const teaProducts = ref([
  { text: '大红袍', value: '大红袍' },
  { text: '肉桂', value: '肉桂' },
  { text: '水仙', value: '水仙' },
  { text: '铁观音', value: '铁观音' },
  { text: '金骏眉', value: '金骏眉' },
  { text: '正山小种', value: '正山小种' }
])

// 调整库存相关
const showAdjustStockDialog = ref(false)
const adjustStockData = ref({
  productId: '',
  productName: '',
  quantity: '',
  reason: ''
})

// 返回按钮点击
const onClickLeft = () => {
  router.back()
}

// 保存基本信息
const onSaveInfo = async (values) => {
  try {
    const res = await saveTeaFarmerInfo({
      farm_name: values.farmName,
      brand_name: values.brandName,
      location: values.location,
      contact: values.contact
    })
    
    if (res.code === 0) {
      showSuccessToast('信息保存成功')
    } else {
      showFailToast(res.message || '保存失败')
    }
  } catch (err) {
    showFailToast('保存失败: ' + err.message)
  }
}

// 茶品选择确认
const onProductConfirm = (value) => {
  newProduct.value.name = value.selectedValues[0]
  showProductPicker.value = false
}

// 添加茶品
const onAddProduct = async () => {
  if (!newProduct.value.name || !newProduct.value.initialStock) {
    showFailToast('请填写必要信息')
    return
  }

  try {
    const res = await addTeaProduct({
      name: newProduct.value.name,
      alias: newProduct.value.alias,
      parameters: newProduct.value.parameters,
      initial_stock: newProduct.value.initialStock
    })
    
    if (res.code === 0) {
      showSuccessToast('茶品入库成功')
      showAddProductDialog.value = false
      // 重置表单
      newProduct.value = {
        name: '',
        alias: '',
        parameters: '',
        initialStock: ''
      }
      // 刷新茶品列表
      loadProductList()
    } else {
      showFailToast(res.message || '入库失败')
    }
  } catch (err) {
    showFailToast('入库失败: ' + err.message)
  }
}

// 显示调整库存对话框
const openAdjustStockDialog = (product, operation) => {
  adjustStockData.value = {
    productId: product.id,
    productName: product.name,
    quantity: '',
    reason: operation === 'add' ? '增加库存' : '减少库存'
  }
  showAdjustStockDialog.value = true
}

// 调整库存
const onAdjustStock = async () => {
  if (!adjustStockData.value.quantity) {
    showFailToast('请输入调整数量')
    return
  }

  try {
    const res = await adjustTeaStock({
      product_id: adjustStockData.value.productId,
      operation: adjustStockData.value.reason.includes('增加') ? 'add' : 'reduce',
      quantity: adjustStockData.value.quantity,
      reason: adjustStockData.value.reason
    })
    
    if (res.code === 0) {
      showSuccessToast('库存调整成功')
      showAdjustStockDialog.value = false
      // 重置表单
      adjustStockData.value = {
        productId: '',
        productName: '',
        quantity: '',
        reason: ''
      }
      // 刷新数据
      loadProductList()
      loadStockRecords()
    } else {
      showFailToast(res.message || '调整失败')
    }
  } catch (err) {
    showFailToast('调整失败: ' + err.message)
  }
}

// 加载茶农信息
const loadFarmerInfo = async () => {
  try {
    const res = await getTeaFarmerInfo()
    if (res.code === 0 && res.data) {
      teaFarmerInfo.value = {
        farmName: res.data.farm_name || '',
        brandName: res.data.brand_name || '',
        location: res.data.location || '',
        contact: res.data.contact || ''
      }
    }
  } catch (err) {
    console.error('加载茶农信息失败:', err)
  }
}

// 加载茶品列表
const loadProductList = async () => {
  try {
    const res = await getTeaProducts()
    if (res.code === 0) {
      productList.value = res.data.map(item => ({
        id: item.id,
        name: item.name,
        alias: item.alias || item.name,
        type: '乌龙茶', // 默认类型
        parameters: item.parameters || '毛茶、走水、成品',
        stock: item.stock
      }))
    }
  } catch (err) {
    console.error('加载茶品列表失败:', err)
  }
}

// 加载库存记录
const loadStockRecords = async () => {
  try {
    const res = await getTeaStockRecords()
    if (res.code === 0) {
      stockRecords.value = res.data.map(item => ({
        id: item.id,
        productName: item.product ? item.product.name : '未知茶品',
        operation: item.operation === 'add' ? '增加库存' : '减少库存',
        quantity: item.quantity,
        date: new Date(item.created_at).toLocaleString('zh-CN'),
        reason: item.reason || ''
      }))
    }
  } catch (err) {
    console.error('加载库存记录失败:', err)
  }
}

onMounted(() => {
  // 初始化数据
  loadFarmerInfo()
  loadProductList()
  loadStockRecords()
})
</script>

<style scoped>
.tea-farmer-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.info-section, .inventory-section, .records-section {
  padding: 10px;
}

.inventory-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.actions {
  display: flex;
}

.record-date {
  color: #999;
  font-size: 12px;
}
</style>