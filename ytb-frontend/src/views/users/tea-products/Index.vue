<template>
  <div class="tea-products-container">
    <div class="page-header">
      <h1 class="page-title">茶品管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreate" :icon="Plus">
          新增茶品
        </el-button>
        <el-button @click="refreshData" :icon="Refresh">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 标签页导航 -->
    <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="tab-container">
      <el-tab-pane label="茶农列表" name="tea-farmers"></el-tab-pane>
      <el-tab-pane label="茶品管理" name="tea-products"></el-tab-pane>
      <el-tab-pane label="库存记录" name="tea-stock-records"></el-tab-pane>
    </el-tabs>

    <!-- 搜索过滤区域 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="queryParams" inline>
        <el-form-item label="茶品名称:">
          <el-input v-model="queryParams.name" placeholder="请输入茶品名称" clearable />
        </el-form-item>
        <el-form-item label="茶农名称:">
          <el-input v-model="queryParams.farmer_name" placeholder="请输入茶农名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :icon="Search">查询</el-button>
          <el-button @click="resetQuery" :icon="RefreshRight">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="teaProductsList"
        stripe
        style="width: 100%"
        :header-cell-style="{backgroundColor: '#f5f7fa', color: '#606266'}"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="茶品名称" width="120" />
        <el-table-column prop="alias" label="别名" width="120" />
        <el-table-column prop="farmer_name" label="茶农" width="120" />
        <el-table-column prop="parameters" label="参数" min-width="180" show-overflow-tooltip />
        <el-table-column prop="stock" label="库存(斤)" width="120" />
        <el-table-column prop="create_time" label="添加时间" width="180" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="handleEdit(scope.row)" :icon="Edit">编辑</el-button>
            <el-button type="primary" link @click="handleDetail(scope.row)" :icon="View">查看</el-button>
            <el-button type="success" link @click="handleIncreaseStock(scope.row)" :icon="Plus">
              增加库存
            </el-button>
            <el-button type="warning" link @click="handleDecreaseStock(scope.row)" :icon="Minus">
              减少库存
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-if="total > 0"
        class="pagination"
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.limit"
        :page-sizes="[10, 20, 50, 100]"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增茶品' : '编辑茶品'"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="茶品名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入茶品名称" />
        </el-form-item>
        <el-form-item label="别名" prop="alias">
          <el-input v-model="formData.alias" placeholder="请输入别名" />
        </el-form-item>
        <el-form-item label="所属茶农" prop="farmer_id">
          <el-select v-model="formData.farmer_id" placeholder="请选择茶农">
            <el-option 
              v-for="farmer in farmerOptions" 
              :key="farmer.id" 
              :label="farmer.name" 
              :value="farmer.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="参数" prop="parameters">
          <el-input v-model="formData.parameters" placeholder="请输入参数信息，如毛茶、走水、成品及火功等级" />
        </el-form-item>
        <el-form-item label="初始库存" prop="stock" v-if="dialogType === 'create'">
          <el-input-number v-model="formData.stock" :min="0" :precision="2" :step="0.5" placeholder="请输入初始库存(斤)" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 库存调整对话框 -->
    <el-dialog
      v-model="stockDialogVisible"
      :title="stockDialogType === 'increase' ? '增加库存' : '减少库存'"
      width="500px"
    >
      <el-form
        ref="stockFormRef"
        :model="stockFormData"
        :rules="stockFormRules"
        label-width="100px"
      >
        <el-form-item label="茶品名称">
          <el-input v-model="stockFormData.name" disabled />
        </el-form-item>
        <el-form-item label="当前库存">
          <el-input v-model="stockFormData.current_stock" disabled>
            <template #append>斤</template>
          </el-input>
        </el-form-item>
        <el-form-item label="调整数量" prop="quantity">
          <el-input-number 
            v-model="stockFormData.quantity" 
            :min="0.01" 
            :precision="2" 
            :step="0.5" 
            :placeholder="`请输入${stockDialogType === 'increase' ? '增加' : '减少'}数量`" 
          />
          <span class="ml-2">斤</span>
        </el-form-item>
        <el-form-item label="调整原因" prop="reason">
          <el-input 
            v-model="stockFormData.reason" 
            type="textarea" 
            :rows="2" 
            :placeholder="`请输入${stockDialogType === 'increase' ? '增加' : '减少'}原因`" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="stockDialogVisible = false">取消</el-button>
        <el-button 
          :type="stockDialogType === 'increase' ? 'success' : 'warning'" 
          @click="submitStockForm" 
          :loading="stockSubmitting"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="茶品详情"
      width="700px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="茶品ID">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item label="茶品名称">{{ detailData.name }}</el-descriptions-item>
        <el-descriptions-item label="别名">{{ detailData.alias || '无' }}</el-descriptions-item>
        <el-descriptions-item label="所属茶农">{{ detailData.farmer_name }}</el-descriptions-item>
        <el-descriptions-item label="参数" :span="2">{{ detailData.parameters || '无' }}</el-descriptions-item>
        <el-descriptions-item label="当前库存">{{ detailData.stock }} 斤</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detailData.create_time }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailData.remark || '无' }}</el-descriptions-item>
      </el-descriptions>
      
      <div class="mt-4">
        <h4>库存变更历史</h4>
        <el-table
          :data="stockHistoryList"
          style="width: 100%"
          :header-cell-style="{backgroundColor: '#f5f7fa', color: '#606266'}"
        >
          <el-table-column prop="operation_time" label="操作时间" width="180" />
          <el-table-column prop="operation" label="操作类型" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.operation === 'increase' ? 'success' : 'danger'">
                {{ scope.row.operation === 'increase' ? '增加' : '减少' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量(斤)" width="100" />
          <el-table-column prop="reason" label="原因" min-width="200" show-overflow-tooltip />
        </el-table>
      </div>
      
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleEdit(detailData)">编辑</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Minus, Refresh, Search, RefreshRight, Edit, View } from '@element-plus/icons-vue';
import { useRouter, useRoute } from 'vue-router';
import {
  fetchTeaProducts,
  getTeaProduct,
  createTeaProduct,
  updateTeaProduct,
  increaseStock,
  decreaseStock
} from '@/api/teaProduct';
import { fetchTeaFarmers } from '@/api/teaFarmer';
import { fetchStockRecords } from '@/api/teaStockRecord';

// 路由相关
const router = useRouter();
const route = useRoute();

// 标签页相关
const activeTab = ref('tea-products');

// 标签页切换处理
const handleTabChange = (tabName) => {
  switch (tabName) {
    case 'tea-farmers':
      router.push('/users/tea-farmers');
      break;
    case 'tea-products':
      router.push('/users/tea-products');
      break;
    case 'tea-stock-records':
      router.push('/users/tea-stock-records');
      break;
  }
};

// 加载状态
const loading = ref(false);
const submitting = ref(false);
const stockSubmitting = ref(false);

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 10,
  name: '',
  farmer_name: ''
});

// 表格数据
const teaProductsList = ref([]);
const total = ref(0);

// 茶农选项
const farmerOptions = ref([]);

// 对话框控制
const dialogVisible = ref(false);
const dialogType = ref('create'); // create 或 edit
const detailVisible = ref(false);
const stockDialogVisible = ref(false);
const stockDialogType = ref('increase'); // increase 或 decrease

// 表单数据和规则
const formRef = ref(null);
const formData = reactive({
  id: null,
  name: '',
  alias: '',
  farmer_id: null,
  parameters: '',
  stock: 0,
  remark: ''
});

const formRules = {
  name: [
    { required: true, message: '请输入茶品名称', trigger: 'blur' },
    { min: 2, max: 30, message: '长度在 2 到 30 个字符', trigger: 'blur' }
  ],
  farmer_id: [
    { required: true, message: '请选择茶农', trigger: 'change' }
  ],
  stock: [
    { required: true, message: '请输入初始库存', trigger: 'blur' },
    { type: 'number', min: 0, message: '库存不能小于0', trigger: 'blur' }
  ]
};

// 库存调整表单
const stockFormRef = ref(null);
const stockFormData = reactive({
  id: null,
  name: '',
  current_stock: 0,
  quantity: 0.5,
  reason: ''
});

const stockFormRules = {
  quantity: [
    { required: true, message: '请输入调整数量', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '调整数量必须大于0', trigger: 'blur' }
  ],
  reason: [
    { required: true, message: '请输入调整原因', trigger: 'blur' }
  ]
};

// 详情数据
const detailData = ref({});
const stockHistoryList = ref([]);

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const response = await fetchTeaProducts({
      page: queryParams.page,
      limit: queryParams.limit,
      name: queryParams.name,
      farmer_name: queryParams.farmer_name
    });

    if (response.code === 0) {
      teaProductsList.value = (response.data.items || []).map(item => ({
        ...item,
        stock: Number(item.stock || 0)
      }));
      total.value = response.data.total || 0;
    } else {
      ElMessage.error(response.message || '加载茶品失败');
    }

    await loadFarmerOptions();
  } catch (error) {
    console.error('加载茶品数据失败:', error);
    ElMessage.error('加载数据失败');
  } finally {
    loading.value = false;
  }
};

// 加载茶农选项
const loadFarmerOptions = async () => {
  try {
    const response = await fetchTeaFarmers({ page: 1, limit: 200 });
    if (response.code === 0) {
      farmerOptions.value = (response.data.items || []).map(item => ({ id: item.id, name: item.name || item.brand_name || item.farm_name }));
    }
  } catch (error) {
    console.error('加载茶农选项失败:', error);
    ElMessage.error('加载茶农选项失败');
  }
};

// 搜索
const handleSearch = () => {
  queryParams.page = 1;
  loadData();
};

// 重置查询
const resetQuery = () => {
  queryParams.name = '';
  queryParams.farmer_name = '';
  handleSearch();
};

// 刷新数据
const refreshData = () => {
  loadData();
};

// 分页相关
const handleSizeChange = (size) => {
  queryParams.limit = size;
  loadData();
};

const handleCurrentChange = (page) => {
  queryParams.page = page;
  loadData();
};

// 新增茶品
const handleCreate = () => {
  dialogType.value = 'create';
  resetForm();
  dialogVisible.value = true;
};

// 编辑茶品
const handleEdit = (row) => {
  dialogType.value = 'edit';
  detailVisible.value = false; // 如果从详情页点击编辑，关闭详情页
  
  Object.keys(formData).forEach(key => {
    if (key in row) {
      formData[key] = row[key];
    }
  });
  
  dialogVisible.value = true;
};

// 查看详情
const handleDetail = async (row) => {
  try {
    const response = await getTeaProduct(row.id);
    if (response.code === 0) {
      detailData.value = response.data;
      detailVisible.value = true;
      loadStockHistory(row.id);
    } else {
      ElMessage.error(response.message || '获取茶品详情失败');
    }
  } catch (error) {
    console.error('获取茶品详情失败:', error);
    ElMessage.error('获取茶品详情失败');
  }
};

// 加载库存历史
const loadStockHistory = async (productId) => {
  try {
    const response = await fetchStockRecords({ product_id: productId, limit: 10 });
    if (response.code === 0) {
      stockHistoryList.value = response.data.data || response.data.items || response.data;
    } else {
      ElMessage.error(response.message || '加载库存历史失败');
    }
  } catch (error) {
    console.error('加载库存历史失败:', error);
    ElMessage.error('加载库存历史失败');
  }
};

// 增加库存
const handleIncreaseStock = (row) => {
  stockDialogType.value = 'increase';
  stockFormData.id = row.id;
  stockFormData.name = row.name;
  stockFormData.current_stock = row.stock;
  stockFormData.quantity = 0.5;
  stockFormData.reason = '';
  stockDialogVisible.value = true;
};

// 减少库存
const handleDecreaseStock = (row) => {
  stockDialogType.value = 'decrease';
  stockFormData.id = row.id;
  stockFormData.name = row.name;
  stockFormData.current_stock = row.stock;
  stockFormData.quantity = 0.5;
  stockFormData.reason = '';
  stockDialogVisible.value = true;
};

// 提交库存调整
const submitStockForm = async () => {
  if (!stockFormRef.value) return;
  
  try {
    await stockFormRef.value.validate();
    stockSubmitting.value = true;
    
    // 确保减少库存时数量不超过当前库存
    if (stockDialogType.value === 'decrease' && stockFormData.quantity > stockFormData.current_stock) {
      ElMessage.error('减少数量不能超过当前库存');
      stockSubmitting.value = false;
      return;
    }
    const api = stockDialogType.value === 'increase' ? increaseStock : decreaseStock;
    const response = await api({
      product_id: stockFormData.id,
      quantity: stockFormData.quantity,
      reason: stockFormData.reason
    });

    if (response.code === 0) {
      ElMessage.success(`${stockDialogType.value === 'increase' ? '增加' : '减少'}库存成功`);
      stockDialogVisible.value = false;
      await loadData();
    } else {
      ElMessage.error(response.message || '操作失败');
    }
  } catch (error) {
    console.error('提交库存调整失败:', error);
    ElMessage.error(error?.response?.data?.message || '提交失败，请重试');
  } finally {
    stockSubmitting.value = false;
  }
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    submitting.value = true;
    const payload = {
      name: formData.name,
      alias: formData.alias,
      farmer_id: formData.farmer_id,
      parameters: formData.parameters,
      stock: formData.stock,
      remark: formData.remark
    };
    if (dialogType.value === 'edit') {
      delete payload.stock;
    }

    const response = dialogType.value === 'create'
      ? await createTeaProduct(payload)
      : await updateTeaProduct(formData.id, payload);

    if (response.code === 0) {
      ElMessage.success(dialogType.value === 'create' ? '新增茶品成功' : '编辑茶品成功');
      dialogVisible.value = false;
      resetForm();
      loadData();
    } else {
      ElMessage.error(response.message || '提交失败');
    }
  } catch (error) {
    console.error('提交茶品失败:', error);
    ElMessage.error(error?.response?.data?.message || '提交失败');
  } finally {
    submitting.value = false;
  }
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  
  Object.assign(formData, {
    id: null,
    name: '',
    alias: '',
    farmer_id: null,
    parameters: '',
    stock: 0,
    remark: ''
  });
};

// 页面加载时获取数据
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.tea-products-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
}

.tab-container {
  margin-bottom: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.ml-2 {
  margin-left: 8px;
}

.mt-4 {
  margin-top: 16px;
}
</style>
