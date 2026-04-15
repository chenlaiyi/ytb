<template>
  <div class="tea-farmer-container">
    <van-nav-bar
      title="茶农助手"
      left-arrow
      @click-left="onClickLeft"
      fixed
      placeholder
    />

    <div class="page-content">
      <!-- 茶农基本信息卡片 -->
      <van-cell-group class="info-section" title="茶农信息">
        <van-card v-if="farmerInfo.isConfigured">
          <template #thumb>
            <div class="brand-logo-placeholder">
              <van-icon name="photograph" size="30" color="#10b981" />
            </div>
          </template>
          <template #title>
            <div class="brand-name">{{ farmerInfo.brandName || '暂无品牌名' }}</div>
          </template>
          <template #desc>
            <div class="info-details">
              <div class="info-item">
                <van-icon name="shop-o" size="14" />
                <span>{{ farmerInfo.farmName || '暂无茶厂名' }}</span>
              </div>
              <div class="info-item">
                <van-icon name="location-o" size="14" />
                <span>{{ farmerInfo.location || '暂无山场信息' }}</span>
              </div>
            </div>
          </template>
          <template #footer>
            <van-button 
              size="small" 
              type="primary" 
              @click="showFarmerInfoForm"
            >
              编辑信息
            </van-button>
          </template>
        </van-card>
        
        <div v-else class="init-placeholder" @click="showFarmerInfoForm">
          <van-icon name="info-o" size="40" color="#10b981" />
          <div class="placeholder-text">
            <p>请先配置茶农基本信息</p>
            <p class="sub-text">点击此处进行配置</p>
          </div>
        </div>
        
        <!-- 设置按钮 -->
        <div class="settings-trigger" @click="showFarmerInfoForm">
          <van-icon name="setting-o" size="20" />
        </div>
        
        <!-- 红点提示 -->
        <div v-if="!farmerInfo.isConfigured" class="red-dot"></div>
      </van-cell-group>

      <!-- 统计卡片 -->
      <van-cell-group class="stats-section" title="数据统计">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ stats.totalStock }}</div>
            <div class="stat-label">总库存(斤)</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.productCount }}</div>
            <div class="stat-label">茶品数量</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.todayChanges }}</div>
            <div class="stat-label">今日变更</div>
          </div>
        </div>
      </van-cell-group>

      <!-- 功能按钮卡片 -->
      <van-cell-group class="actions-section" title="功能操作">
        <div class="action-buttons">
          <van-button 
            type="primary" 
            block 
            @click="showProductForm"
            :disabled="!farmerInfo.isConfigured"
          >
            茶品入库
          </van-button>
          <van-button 
            type="success" 
            block 
            @click="showStockManagement"
            :disabled="!farmerInfo.isConfigured"
          >
            库存管理
          </van-button>
        </div>
      </van-cell-group>

      <!-- 库存列表 -->
      <van-cell-group class="stock-section" title="库存列表">
        <van-empty 
          v-if="productList.length === 0" 
          description="暂无库存数据" 
          image="search"
        />
        
        <van-list v-else>
          <van-swipe-cell 
            v-for="(product, index) in productList" 
            :key="product.id"
            :right-width="80"
          >
            <van-cell>
              <template #title>
                <div class="product-info">
                  <span class="product-index">{{ index + 1 }}.</span>
                  <span class="product-name">{{ product.name }}</span>
                </div>
              </template>
              <template #label>
                <div class="product-details">
                  <div class="detail-item">
                    <span class="label">别名:</span>
                    <span>{{ product.alias || '-' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">参数:</span>
                    <span>{{ formatParameters(product.parameters) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">库存:</span>
                    <span class="stock-quantity">{{ product.stock }}斤</span>
                  </div>
                </div>
              </template>
              <template #right-icon>
                <div class="stock-actions">
                  <van-button 
                    size="small" 
                    type="primary" 
                    @click="showStockChange(product, 'add')"
                  >
                    增加
                  </van-button>
                  <van-button 
                    size="small" 
                    type="danger" 
                    @click="showStockChange(product, 'reduce')"
                  >
                    减少
                  </van-button>
                </div>
              </template>
            </van-cell>
          </van-swipe-cell>
        </van-list>
      </van-cell-group>
    </div>

    <!-- 茶农信息表单弹窗 -->
    <van-popup 
      v-model:show="showInfoForm" 
      round 
      position="bottom" 
      :style="{ height: '70%' }"
    >
      <van-cell-group title="茶农基本信息">
        <van-field
          v-model="formInfo.farmName"
          label="茶厂名称"
          placeholder="请输入茶厂名称"
          required
        />
        <van-field
          v-model="formInfo.brandName"
          label="茶品牌名"
          placeholder="请输入茶品牌名称"
          required
        />
        <van-field
          v-model="formInfo.location"
          label="山场名"
          placeholder="请输入山场名称"
          required
        />
        <div class="form-actions">
          <van-button 
            type="primary" 
            block 
            @click="saveFarmerInfo"
            :loading="savingFarmerInfo"
          >
            保存信息
          </van-button>
        </div>
      </van-cell-group>
    </van-popup>

    <!-- 茶品入库表单弹窗 -->
    <van-popup 
      v-model:show="showProductFormPopup" 
      round 
      position="bottom" 
      :style="{ height: '80%' }"
    >
      <van-cell-group title="茶品入库">
        <van-field
          v-model="productForm.name"
          label="茶品名"
          placeholder="请选择或输入茶品名"
          is-link
          @click="showProductPicker = true"
        />
        <van-field
          v-model="productForm.alias"
          label="茶品别名"
          placeholder="例如：肉桂1号、水仙1号"
        />
        <van-cell title="茶品参数" is-link @click="showParameterPopup = true" />
        
        <van-field
          v-model.number="productForm.initialStock"
          label="初始库存"
          placeholder="请输入初始库存量"
          type="number"
        >
          <template #right-icon>
            <span>斤</span>
          </template>
        </van-field>
        
        <div class="form-actions">
          <van-button 
            type="primary" 
            block 
            @click="addProduct"
            :loading="addingProduct"
          >
            添加茶品
          </van-button>
        </div>
      </van-cell-group>
    </van-popup>

    <!-- 茶品选择器 -->
    <van-popup v-model:show="showProductPicker" round position="bottom">
      <van-picker
        title="选择茶品"
        :columns="productOptions"
        @confirm="onProductConfirm"
        @cancel="showProductPicker = false"
      />
    </van-popup>

    <!-- 参数配置弹窗 -->
    <van-popup v-model:show="showParameterPopup" round position="bottom" :style="{ height: '60%' }">
      <van-cell-group title="茶品参数配置">
        <van-cell title="类型">
          <template #right-icon>
            <van-dropdown-menu active-color="#10b981">
              <van-dropdown-item 
                v-model="productForm.parameters.type" 
                :options="typeOptions" 
              />
            </van-dropdown-menu>
          </template>
        </van-cell>
        <van-cell title="火功">
          <template #right-icon>
            <van-dropdown-menu active-color="#10b981">
              <van-dropdown-item 
                v-model="productForm.parameters.fireLevel" 
                :options="fireLevelOptions" 
              />
            </van-dropdown-menu>
          </template>
        </van-cell>
        <van-field
          v-model="productForm.parameters.other"
          label="其他参数"
          placeholder="请输入其他参数"
          type="textarea"
          rows="3"
        />
        <div class="form-actions">
          <van-button 
            type="primary" 
            block 
            @click="saveParameters"
          >
            保存参数
          </van-button>
        </div>
      </van-cell-group>
    </van-popup>

    <!-- 库存变更弹窗 -->
    <van-popup v-model:show="showStockPopup" round position="bottom">
      <van-cell-group :title="`${currentProduct.name} - ${stockOperation === 'add' ? '增加库存' : '减少库存'}`">
        <van-field
          v-model.number="stockChange.quantity"
          label="变更数量"
          placeholder="请输入变更数量"
          type="number"
        >
          <template #right-icon>
            <span>斤</span>
          </template>
        </van-field>
        <van-field
          v-model="stockChange.reason"
          label="变更原因"
          placeholder="请输入变更原因"
          type="textarea"
          rows="2"
        />
        <div class="form-actions">
          <van-button 
            type="primary" 
            block 
            @click="confirmStockChange"
            :loading="changingStock"
          >
            确认变更
          </van-button>
        </div>
      </van-cell-group>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';

const router = useRouter();

// 茶农基本信息
const farmerInfo = reactive({
  isConfigured: false,
  farmName: '',
  brandName: '',
  location: ''
});

const formInfo = reactive({
  farmName: '',
  brandName: '',
  location: ''
});

// 统计数据
const stats = reactive({
  totalStock: 0,
  productCount: 0,
  todayChanges: 0
});

// 茶品信息表单
const productForm = reactive({
  name: '',
  alias: '',
  parameters: {
    type: '成品',
    fireLevel: '中火',
    other: ''
  },
  initialStock: ''
});

// 库存变更信息
const stockChange = reactive({
  quantity: '',
  reason: ''
});

// 状态控制
const savingFarmerInfo = ref(false);
const addingProduct = ref(false);
const changingStock = ref(false);
const showInfoForm = ref(false);
const showProductFormPopup = ref(false);
const showProductPicker = ref(false);
const showParameterPopup = ref(false);
const showStockPopup = ref(false);
const stockOperation = ref('add'); // 'add' 或 'reduce'

// 当前操作的茶品
const currentProduct = ref({});

// 预设茶品选项
const productOptions = [
  '武夷岩茶',
  '大红袍',
  '肉桂',
  '水仙',
  '铁观音',
  '白牡丹',
  '白毫银针',
  '正山小种'
];

// 类型选项
const typeOptions = [
  { text: '毛茶', value: '毛茶' },
  { text: '走水', value: '走水' },
  { text: '成品', value: '成品' }
];

// 火功选项
const fireLevelOptions = [
  { text: '轻火', value: '轻火' },
  { text: '中火', value: '中火' },
  { text: '高火', value: '高火' }
];

// 茶品列表（模拟数据）
const productList = ref([
  {
    id: 1,
    name: '大红袍',
    alias: '肉桂1号',
    stock: 15.5,
    parameters: {
      type: '成品',
      fireLevel: '中火',
      other: '清香型'
    }
  },
  {
    id: 2,
    name: '水仙',
    alias: '水仙1号',
    stock: 12.8,
    parameters: {
      type: '成品',
      fireLevel: '轻火',
      other: '花香型'
    }
  }
]);

// 更新统计数据
const updateStats = () => {
  stats.productCount = productList.value.length;
  stats.totalStock = productList.value.reduce((sum, product) => sum + product.stock, 0);
  // 模拟今日变更数量
  stats.todayChanges = 3;
};

// 返回按钮
const onClickLeft = () => {
  router.back();
};

// 显示茶农信息表单
const showFarmerInfoForm = () => {
  // 将当前信息复制到表单
  formInfo.farmName = farmerInfo.farmName;
  formInfo.brandName = farmerInfo.brandName;
  formInfo.location = farmerInfo.location;
  showInfoForm.value = true;
};

// 保存茶农基本信息
const saveFarmerInfo = () => {
  if (!formInfo.farmName || !formInfo.brandName || !formInfo.location) {
    showToast.fail('请填写完整信息');
    return;
  }
  
  savingFarmerInfo.value = true;
  
  // 模拟保存操作
  setTimeout(() => {
    farmerInfo.farmName = formInfo.farmName;
    farmerInfo.brandName = formInfo.brandName;
    farmerInfo.location = formInfo.location;
    farmerInfo.isConfigured = true;
    
    showToast.success('基本信息保存成功');
    showInfoForm.value = false;
    savingFarmerInfo.value = false;
  }, 500);
};

// 显示茶品入库表单
const showProductForm = () => {
  if (!farmerInfo.isConfigured) {
    showToast.fail('请先配置茶农基本信息');
    return;
  }
  
  // 重置表单
  productForm.name = '';
  productForm.alias = '';
  productForm.parameters = {
    type: '成品',
    fireLevel: '中火',
    other: ''
  };
  productForm.initialStock = '';
  
  showProductFormPopup.value = true;
};

// 显示库存管理
const showStockManagement = () => {
  if (!farmerInfo.isConfigured) {
    showToast.fail('请先配置茶农基本信息');
    return;
  }
  
  showToast.success('进入库存管理页面');
  // 实际项目中应该跳转到库存管理页面
};

// 选择茶品
const onProductConfirm = ({ selectedValues }) => {
  productForm.name = selectedValues[0];
  showProductPicker.value = false;
};

// 保存参数
const saveParameters = () => {
  showParameterPopup.value = false;
  showToast.success('参数保存成功');
};

// 添加茶品
const addProduct = () => {
  if (!productForm.name) {
    showToast.fail('请选择茶品名');
    return;
  }
  
  if (!productForm.initialStock) {
    showToast.fail('请输入初始库存量');
    return;
  }
  
  addingProduct.value = true;
  
  // 模拟添加操作
  setTimeout(() => {
    const newProduct = {
      id: productList.value.length + 1,
      name: productForm.name,
      alias: productForm.alias,
      stock: parseFloat(productForm.initialStock),
      parameters: { ...productForm.parameters }
    };
    
    productList.value.push(newProduct);
    updateStats();
    
    showToast.success('茶品添加成功');
    showProductFormPopup.value = false;
    addingProduct.value = false;
  }, 500);
};

// 格式化参数显示
const formatParameters = (params) => {
  if (!params) return '-';
  return `${params.type}(${params.fireLevel})${params.other ? ` ${params.other}` : ''}`;
};

// 显示库存变更弹窗
const showStockChange = (product, operation) => {
  if (!farmerInfo.isConfigured) {
    showToast.fail('请先配置茶农基本信息');
    return;
  }
  
  currentProduct.value = product;
  stockOperation.value = operation;
  stockChange.quantity = '';
  stockChange.reason = '';
  showStockPopup.value = true;
};

// 确认库存变更
const confirmStockChange = () => {
  if (!stockChange.quantity) {
    showToast.fail('请输入变更数量');
    return;
  }
  
  changingStock.value = true;
  
  // 模拟变更操作
  setTimeout(() => {
    const index = productList.value.findIndex(p => p.id === currentProduct.value.id);
    if (index !== -1) {
      const quantity = parseFloat(stockChange.quantity);
      if (stockOperation.value === 'add') {
        productList.value[index].stock += quantity;
      } else {
        productList.value[index].stock -= quantity;
      }
      
      updateStats();
      
      // 记录操作日志（模拟）
      console.log(`库存变更记录: ${currentProduct.value.name} ${stockOperation.value === 'add' ? '增加' : '减少'} ${quantity}斤，原因: ${stockChange.reason}`);
      
      showToast.success('库存变更成功');
    }
    
    showStockPopup.value = false;
    changingStock.value = false;
  }, 500);
};

onMounted(() => {
  // 初始化统计数据
  updateStats();
});
</script>

<style scoped>
.tea-farmer-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 20px;
}

:deep(.van-nav-bar) {
  background-color: #10b981;
}

:deep(.van-nav-bar__title) {
  color: white;
  font-weight: bold;
}

:deep(.van-nav-bar .van-icon) {
  color: white;
}

:deep(.van-hairline--bottom::after) {
  border-bottom-width: 0;
}

.page-content {
  padding: 12px 16px;
}

/* 信息卡片样式 */
.info-section {
  position: relative;
  margin-bottom: 16px;
}

.brand-logo-placeholder {
  width: 60px;
  height: 60px;
  background-color: #e8f7f1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.info-details {
  font-size: 13px;
  color: #666;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.info-item .van-icon {
  margin-right: 4px;
}

.init-placeholder {
  display: flex;
  align-items: center;
  padding: 20px 16px;
  background-color: #fff;
  border-radius: 8px;
  cursor: pointer;
}

.placeholder-text {
  margin-left: 16px;
}

.placeholder-text p {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.placeholder-text .sub-text {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

.settings-trigger {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
}

.red-dot {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #ff4646;
  z-index: 3;
}

/* 统计卡片样式 */
.stats-section {
  margin-bottom: 16px;
}

.stats-grid {
  display: flex;
  padding: 16px 0;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #10b981;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

/* 功能按钮样式 */
.actions-section {
  margin-bottom: 16px;
}

.action-buttons {
  padding: 16px;
  display: flex;
  gap: 12px;
}

.action-buttons .van-button {
  flex: 1;
}

/* 库存列表样式 */
.stock-section {
  margin-bottom: 16px;
}

.product-info {
  display: flex;
  align-items: center;
}

.product-index {
  font-size: 12px;
  color: #999;
  margin-right: 4px;
}

.product-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.product-details {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.detail-item {
  display: flex;
  margin-bottom: 2px;
}

.detail-item .label {
  width: 40px;
  color: #999;
}

.stock-quantity {
  font-weight: 500;
  color: #10b981;
}

.stock-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stock-actions .van-button {
  min-width: 50px;
}

/* 表单操作按钮 */
.form-actions {
  padding: 16px;
}
</style>