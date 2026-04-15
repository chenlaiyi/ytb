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
      <!-- 茶农基本信息配置 -->
      <van-cell-group class="config-section" title="茶农基本信息">
        <van-field
          v-model="farmerInfo.farmName"
          label="茶厂名称"
          placeholder="请输入茶厂名称"
          required
        />
        <van-field
          v-model="farmerInfo.brandName"
          label="茶品牌名"
          placeholder="请输入茶品牌名称"
          required
        />
        <van-field
          v-model="farmerInfo.location"
          label="茶山位置"
          placeholder="请输入茶山位置"
          required
          type="textarea"
          rows="2"
        />
        <van-button 
          type="primary" 
          block 
          @click="saveFarmerInfo"
          :loading="savingFarmerInfo"
        >
          保存基本信息
        </van-button>
      </van-cell-group>

      <!-- 茶品入库 -->
      <van-cell-group class="product-section" title="茶品入库">
        <van-field
          v-model="productInfo.name"
          label="茶品名"
          placeholder="请选择或输入茶品名"
          is-link
          @click="showProductPicker = true"
        />
        <van-field
          v-model="productInfo.alias"
          label="茶品别名"
          placeholder="例如：肉桂1号、水仙1号"
        />
        <van-cell title="茶品参数" is-link @click="showParameterPopup = true" />
        
        <van-field
          v-model.number="productInfo.initialStock"
          label="初始库存"
          placeholder="请输入初始库存量"
          type="number"
        >
          <template #right-icon>
            <span>斤</span>
          </template>
        </van-field>
        
        <van-button 
          type="primary" 
          block 
          @click="addProduct"
          :loading="addingProduct"
        >
          添加茶品
        </van-button>
      </van-cell-group>

      <!-- 茶叶库存列表 -->
      <van-cell-group class="stock-section" title="茶叶库存">
        <van-list>
          <van-cell
            v-for="product in productList"
            :key="product.id"
            :title="product.name"
            :label="product.alias ? `${product.alias} | 库存: ${product.stock}斤` : `库存: ${product.stock}斤`"
          >
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
        </van-list>
      </van-cell-group>
    </div>

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
                v-model="productInfo.parameters.type" 
                :options="typeOptions" 
              />
            </van-dropdown-menu>
          </template>
        </van-cell>
        <van-cell title="火功">
          <template #right-icon>
            <van-dropdown-menu active-color="#10b981">
              <van-dropdown-item 
                v-model="productInfo.parameters.fireLevel" 
                :options="fireLevelOptions" 
              />
            </van-dropdown-menu>
          </template>
        </van-cell>
        <van-field
          v-model="productInfo.parameters.other"
          label="其他参数"
          placeholder="请输入其他参数"
          type="textarea"
          rows="3"
        />
        <van-button 
          type="primary" 
          block 
          @click="saveParameters"
        >
          保存参数
        </van-button>
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
        <van-button 
          type="primary" 
          block 
          @click="confirmStockChange"
          :loading="changingStock"
        >
          确认变更
        </van-button>
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
  farmName: '',
  brandName: '',
  location: ''
});

// 茶品信息
const productInfo = reactive({
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

// 返回按钮
const onClickLeft = () => {
  router.back();
};

// 保存茶农基本信息
const saveFarmerInfo = () => {
  savingFarmerInfo.value = true;
  // 模拟保存操作
  setTimeout(() => {
    showToast.success('基本信息保存成功');
    savingFarmerInfo.value = false;
  }, 500);
};

// 选择茶品
const onProductConfirm = ({ selectedValues }) => {
  productInfo.name = selectedValues[0];
  showProductPicker.value = false;
};

// 保存参数
const saveParameters = () => {
  showParameterPopup.value = false;
  showToast.success('参数保存成功');
};

// 添加茶品
const addProduct = () => {
  if (!productInfo.name) {
    showToast.fail('请选择茶品名');
    return;
  }
  
  if (!productInfo.initialStock) {
    showToast.fail('请输入初始库存量');
    return;
  }
  
  addingProduct.value = true;
  
  // 模拟添加操作
  setTimeout(() => {
    const newProduct = {
      id: productList.value.length + 1,
      name: productInfo.name,
      alias: productInfo.alias,
      stock: parseFloat(productInfo.initialStock),
      parameters: { ...productInfo.parameters }
    };
    
    productList.value.push(newProduct);
    
    // 重置表单
    productInfo.name = '';
    productInfo.alias = '';
    productInfo.initialStock = '';
    
    showToast.success('茶品添加成功');
    addingProduct.value = false;
  }, 500);
};

// 显示库存变更弹窗
const showStockChange = (product, operation) => {
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
      
      // 记录操作日志（模拟）
      console.log(`库存变更记录: ${currentProduct.value.name} ${stockOperation.value === 'add' ? '增加' : '减少'} ${quantity}斤，原因: ${stockChange.reason}`);
      
      showToast.success('库存变更成功');
    }
    
    showStockPopup.value = false;
    changingStock.value = false;
  }, 500);
};

onMounted(() => {
  // 页面加载时的初始化逻辑
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

.config-section, .product-section, .stock-section {
  margin-bottom: 16px;
  border-radius: 12px;
  overflow: hidden;
}

.stock-actions {
  display: flex;
  gap: 8px;
}

.stock-actions .van-button {
  min-width: 50px;
}
</style>