<template>
  <div class="tea-farmers-container">
    <div class="page-header">
      <h1 class="page-title">茶农助手</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreate" :icon="Plus">
          新增茶农
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
        <el-form-item label="茶农姓名:">
          <el-input v-model="queryParams.name" placeholder="请输入茶农姓名" clearable />
        </el-form-item>
        <el-form-item label="手机号码:">
          <el-input v-model="queryParams.phone" placeholder="请输入手机号码" clearable />
        </el-form-item>
        <el-form-item label="状态:">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
            <el-option label="正常" value="normal" />
            <el-option label="禁用" value="disabled" />
          </el-select>
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
        :data="teaFarmersList"
        stripe
        style="width: 100%"
        :header-cell-style="{backgroundColor: '#f5f7fa', color: '#606266'}"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="茶农姓名" width="120" />
        <el-table-column prop="phone" label="手机号码" width="120" />
        <el-table-column prop="address" label="地址" min-width="180" show-overflow-tooltip />
        <el-table-column prop="farm_area" label="茶园面积(亩)" width="120" />
        <el-table-column prop="tea_type" label="茶叶品种" width="120" />
        <el-table-column prop="annual_output" label="年产量(kg)" width="120" />
        <el-table-column prop="create_time" label="注册时间" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'normal' ? 'success' : 'danger'">
              {{ scope.row.status === 'normal' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="handleEdit(scope.row)" :icon="Edit">编辑</el-button>
            <el-button type="primary" link @click="handleDetail(scope.row)" :icon="View">查看</el-button>
            <el-button 
              :type="scope.row.status === 'normal' ? 'danger' : 'success'" 
              link 
              @click="handleStatusChange(scope.row)"
              :icon="scope.row.status === 'normal' ? 'Delete' : 'RefreshLeft'"
            >
              {{ scope.row.status === 'normal' ? '禁用' : '启用' }}
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
      :title="dialogType === 'create' ? '新增茶农' : '编辑茶农'"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="茶农姓名" prop="name">
          <el-input v-model="formData.name" placeholder="请输入茶农姓名" />
        </el-form-item>
        <el-form-item label="手机号码" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入手机号码" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="formData.address" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="茶园面积" prop="farm_area">
          <el-input-number v-model="formData.farm_area" :min="0" :precision="2" :step="0.5" placeholder="请输入茶园面积(亩)" />
        </el-form-item>
        <el-form-item label="茶叶品种" prop="tea_type">
          <el-select v-model="formData.tea_type" placeholder="请选择茶叶品种">
            <el-option label="绿茶" value="green" />
            <el-option label="红茶" value="black" />
            <el-option label="乌龙茶" value="oolong" />
            <el-option label="白茶" value="white" />
            <el-option label="黄茶" value="yellow" />
            <el-option label="黑茶" value="dark" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="年产量" prop="annual_output">
          <el-input-number v-model="formData.annual_output" :min="0" :precision="2" :step="10" placeholder="请输入年产量(kg)" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio label="normal">正常</el-radio>
            <el-radio label="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="茶农详情"
      width="700px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="茶农ID">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item label="茶农姓名">{{ detailData.name }}</el-descriptions-item>
        <el-descriptions-item label="手机号码">{{ detailData.phone }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detailData.status === 'normal' ? 'success' : 'danger'">
            {{ detailData.status === 'normal' ? '正常' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">{{ detailData.address }}</el-descriptions-item>
        <el-descriptions-item label="茶园面积(亩)">{{ detailData.farm_area }}</el-descriptions-item>
        <el-descriptions-item label="茶叶品种">{{ formatTeaType(detailData.tea_type) }}</el-descriptions-item>
        <el-descriptions-item label="年产量(kg)">{{ detailData.annual_output }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ detailData.create_time }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailData.remark || '无' }}</el-descriptions-item>
      </el-descriptions>
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
import { Plus, Refresh, Search, RefreshRight, Edit, View, Delete } from '@element-plus/icons-vue';
import { useRouter, useRoute } from 'vue-router';
import {
  fetchTeaFarmers,
  createTeaFarmer,
  updateTeaFarmer,
  updateTeaFarmerStatus,
  getTeaFarmer
} from '@/api/teaFarmer';

// 路由相关
const router = useRouter();
const route = useRoute();

// 标签页相关
const activeTab = ref('tea-farmers');

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

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 10,
  name: '',
  phone: '',
  status: ''
});

// 表格数据
const teaFarmersList = ref([]);
const total = ref(0);

// 对话框控制
const dialogVisible = ref(false);
const dialogType = ref('create'); // create 或 edit
const detailVisible = ref(false);

// 表单数据和规则
const formRef = ref(null);
const formData = reactive({
  id: null,
  name: '',
  phone: '',
  address: '',
  farm_area: 0,
  tea_type: '',
  annual_output: 0,
  remark: '',
  status: 'normal'
});

const formRules = {
  name: [
    { required: true, message: '请输入茶农姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入地址', trigger: 'blur' }
  ],
  tea_type: [
    { required: true, message: '请选择茶叶品种', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
};

// 详情数据
const detailData = ref({});

// 格式化茶叶品种
const formatTeaType = (type) => {
  const typeMap = {
    'green': '绿茶',
    'black': '红茶',
    'oolong': '乌龙茶',
    'white': '白茶',
    'yellow': '黄茶',
    'dark': '黑茶',
    'other': '其他'
  };
  return typeMap[type] || type;
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const response = await fetchTeaFarmers({
      page: queryParams.page,
      limit: queryParams.limit,
      name: queryParams.name,
      phone: queryParams.phone,
      status: queryParams.status
    });

    if (response.code === 0) {
      teaFarmersList.value = response.data.items || [];
      total.value = response.data.total || 0;
    } else {
      ElMessage.error(response.message || '加载数据失败');
    }
  } catch (error) {
    console.error('加载茶农数据失败:', error);
    ElMessage.error('加载数据失败');
  } finally {
    loading.value = false;
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
  queryParams.phone = '';
  queryParams.status = '';
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

// 新增茶农
const handleCreate = () => {
  dialogType.value = 'create';
  resetForm();
  dialogVisible.value = true;
};

// 编辑茶农
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
    const response = await getTeaFarmer(row.id);
    if (response.code === 0) {
      detailData.value = response.data;
      detailVisible.value = true;
    } else {
      ElMessage.error(response.message || '获取详情失败');
    }
  } catch (error) {
    console.error('获取详情失败:', error);
    ElMessage.error('获取详情失败');
  }
};

// 改变状态
const handleStatusChange = (row) => {
  const statusText = row.status === 'normal' ? '禁用' : '启用';
  ElMessageBox.confirm(
    `确定要${statusText}茶农"${row.name}"吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        const nextStatus = row.status === 'normal' ? 'disabled' : 'normal';
        const response = await updateTeaFarmerStatus(row.id, { status: nextStatus });
        if (response.code === 0) {
          row.status = nextStatus;
          ElMessage.success(`${statusText}成功`);
        } else {
          ElMessage.error(response.message || `${statusText}失败`);
        }
      } catch (error) {
        console.error(`${statusText}失败:`, error);
        ElMessage.error(`${statusText}失败`);
      }
    })
    .catch(() => {
      // 取消操作
    });
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    submitting.value = true;
    const payload = {
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      farm_area: formData.farm_area,
      tea_type: formData.tea_type,
      annual_output: formData.annual_output,
      remark: formData.remark,
      status: formData.status
    };

    const response = dialogType.value === 'create'
      ? await createTeaFarmer(payload)
      : await updateTeaFarmer(formData.id, payload);

    if (response.code === 0) {
      ElMessage.success(dialogType.value === 'create' ? '新增茶农成功' : '编辑茶农成功');
      dialogVisible.value = false;
      resetForm();
      loadData();
    } else {
      ElMessage.error(response.message || '提交失败');
    }
  } catch (error) {
    console.error('提交表单失败:', error);
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
    phone: '',
    address: '',
    farm_area: 0,
    tea_type: '',
    annual_output: 0,
    remark: '',
    status: 'normal'
  });
};

// 页面加载时获取数据
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.tea-farmers-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
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
  display: flex;
  justify-content: flex-end;
}
</style>
