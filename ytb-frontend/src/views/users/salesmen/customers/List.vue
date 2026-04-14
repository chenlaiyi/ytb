<template>
  <div class="app-container">
    <el-card class="filter-card">
      <template #header>
        <div class="card-header">
          <span>客户列表</span>
          <div>
            <el-button @click="backToSalesman">返回业务员详情</el-button>
            <el-button type="primary" @click="handleAddCustomer">添加客户</el-button>
          </div>
        </div>
      </template>
      
      <!-- 筛选条件 -->
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="客户名称">
          <el-input v-model="queryParams.customer_name" placeholder="请输入客户名称" clearable />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="queryParams.customer_phone" placeholder="请输入联系电话" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="所有状态" clearable>
            <el-option label="潜在客户" value="potential" />
            <el-option label="活跃客户" value="active" />
            <el-option label="非活跃客户" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 客户列表表格 -->
    <el-card class="data-card">
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>
      
      <el-table
        v-else
        :data="customerList"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="customer_name" label="客户名称" width="120" />
        <el-table-column prop="customer_phone" label="联系电话" width="120" />
        <el-table-column prop="customer_address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="source" label="来源" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deal_count" label="成交次数" width="100" align="center" />
        <el-table-column prop="total_amount" label="成交金额" width="120" align="right">
          <template #default="scope">
            ¥{{ formatPrice(scope.row.total_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="last_purchase_date" label="最近购买" width="120">
          <template #default="scope">
            {{ formatDate(scope.row.last_purchase_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="120">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button-group>
              <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
              <el-button type="success" size="small" @click="handleViewOrders(scope.row)">查看订单</el-button>
              <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 无数据提示 -->
      <el-empty v-if="!loading && customerList.length === 0" description="暂无客户记录" />
      
      <!-- 分页 -->
      <div class="pagination-container" v-if="!loading && customerList.length > 0">
        <el-pagination
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-sizes="[10, 15, 30, 50]"
          :page-size="queryParams.limit"
          :current-page="queryParams.page"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 新增/编辑客户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formTitle"
      width="550px"
      destroy-on-close
    >
      <el-form
        ref="customerFormRef"
        :model="customerForm"
        :rules="customerRules"
        label-width="120px"
      >
        <el-form-item label="客户名称" prop="customer_name">
          <el-input v-model="customerForm.customer_name" placeholder="请输入客户名称" />
        </el-form-item>
        
        <el-form-item label="联系电话" prop="customer_phone">
          <el-input v-model="customerForm.customer_phone" placeholder="请输入联系电话" />
        </el-form-item>
        
        <el-form-item label="地址" prop="customer_address">
          <el-input v-model="customerForm.customer_address" placeholder="请输入地址" />
        </el-form-item>
        
        <el-form-item label="来源" prop="source">
          <el-select v-model="customerForm.source" placeholder="请选择来源" style="width: 100%">
            <el-option label="主动联系" value="proactive" />
            <el-option label="推荐介绍" value="referral" />
            <el-option label="电话营销" value="telemarketing" />
            <el-option label="社交媒体" value="social_media" />
            <el-option label="展会" value="exhibition" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="客户状态" prop="status">
          <el-select v-model="customerForm.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="潜在客户" value="potential" />
            <el-option label="活跃客户" value="active" />
            <el-option label="非活跃客户" value="inactive" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="成交次数" prop="deal_count" v-if="isEdit">
          <el-input-number v-model="customerForm.deal_count" :min="0" :precision="0" style="width: 100%" />
        </el-form-item>
        
        <el-form-item label="成交金额" prop="total_amount" v-if="isEdit">
          <el-input-number v-model="customerForm.total_amount" :min="0" :precision="2" :step="0.01" style="width: 100%" />
        </el-form-item>
        
        <el-form-item label="最近购买日期" prop="last_purchase_date" v-if="isEdit">
          <el-date-picker
            v-model="customerForm.last_purchase_date"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="备注" prop="remarks">
          <el-input v-model="customerForm.remarks" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCustomerForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';

export default {
  name: 'SalesmenCustomersList',
  
  setup() {
    const router = useRouter();
    const route = useRoute();
    const loading = ref(true);
    const customerList = ref([]);
    const total = ref(0);
    const dialogVisible = ref(false);
    const customerFormRef = ref(null);
    const isEdit = ref(false);
    
    // 获取业务员ID
    const salesmanId = route.params.id;
    
    // 查询参数
    const queryParams = reactive({
      page: 1,
      limit: 15,
      salesman_id: salesmanId,
      customer_name: '',
      customer_phone: '',
      status: '',
      sort_field: 'created_at',
      sort_direction: 'desc'
    });
    
    // 客户表单
    const customerForm = reactive({
      id: null,
      salesman_id: salesmanId,
      customer_name: '',
      customer_phone: '',
      customer_address: '',
      source: 'proactive',
      status: 'potential',
      deal_count: 0,
      total_amount: 0,
      last_purchase_date: '',
      remarks: ''
    });
    
    // 表单验证规则
    const customerRules = reactive({
      customer_name: [
        { required: true, message: '请输入客户名称', trigger: 'blur' },
        { max: 50, message: '长度不能超过50个字符', trigger: 'blur' }
      ],
      customer_phone: [
        { required: true, message: '请输入联系电话', trigger: 'blur' },
        { max: 20, message: '长度不能超过20个字符', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
      ],
      status: [
        { required: true, message: '请选择状态', trigger: 'change' }
      ],
      source: [
        { required: true, message: '请选择来源', trigger: 'change' }
      ]
    });
    
    // 表单标题
    const formTitle = computed(() => {
      return isEdit.value ? '编辑客户信息' : '添加客户';
    });
    
    // 获取客户列表
    const getCustomerList = async () => {
      try {
        loading.value = true;
        const response = await axios.get('/admin/salesman-customers', { params: queryParams });
        customerList.value = response.data.data;
        total.value = response.data.total;
      } catch (error) {
        console.error('获取客户列表失败', error);
        ElMessage.error('获取客户列表失败');
      } finally {
        loading.value = false;
      }
    };
    
    // 查询按钮点击事件
    const handleQuery = () => {
      queryParams.page = 1;
      getCustomerList();
    };
    
    // 重置查询条件
    const resetQuery = () => {
      Object.assign(queryParams, {
        page: 1,
        customer_name: '',
        customer_phone: '',
        status: ''
      });
      getCustomerList();
    };
    
    // 分页大小变化处理
    const handleSizeChange = (size) => {
      queryParams.limit = size;
      getCustomerList();
    };
    
    // 页码变化处理
    const handleCurrentChange = (page) => {
      queryParams.page = page;
      getCustomerList();
    };
    
    // 添加客户
    const handleAddCustomer = () => {
      isEdit.value = false;
      dialogVisible.value = true;
      
      // 重置表单
      Object.assign(customerForm, {
        id: null,
        salesman_id: salesmanId,
        customer_name: '',
        customer_phone: '',
        customer_address: '',
        source: 'proactive',
        status: 'potential',
        deal_count: 0,
        total_amount: 0,
        last_purchase_date: '',
        remarks: ''
      });
    };
    
    // 编辑客户
    const handleEdit = (row) => {
      isEdit.value = true;
      dialogVisible.value = true;
      
      // 填充表单
      Object.assign(customerForm, {
        id: row.id,
        salesman_id: salesmanId,
        customer_name: row.customer_name,
        customer_phone: row.customer_phone,
        customer_address: row.customer_address || '',
        source: row.source,
        status: row.status,
        deal_count: row.deal_count || 0,
        total_amount: row.total_amount || 0,
        last_purchase_date: row.last_purchase_date ? new Date(row.last_purchase_date) : '',
        remarks: row.remarks || ''
      });
    };
    
    // 提交客户表单
    const submitCustomerForm = async () => {
      if (!customerFormRef.value) return;
      
      await customerFormRef.value.validate(async (valid, fields) => {
        if (valid) {
          try {
            const formData = { ...customerForm };
            
            if (formData.last_purchase_date) {
              formData.last_purchase_date = new Date(formData.last_purchase_date).toISOString().split('T')[0];
            }
            
            if (isEdit.value) {
              // 更新
              await axios.put(`/admin/salesman-customers/${formData.id}`, formData);
              ElMessage.success('客户信息更新成功');
            } else {
              // 新增
              await axios.post('/admin/salesman-customers', formData);
              ElMessage.success('客户添加成功');
            }
            
            dialogVisible.value = false;
            getCustomerList();
          } catch (error) {
            console.error('操作失败', error);
            ElMessage.error(error.response?.data?.message || '操作失败');
          }
        } else {
        }
      });
    };
    
    // 查看客户订单
    const handleViewOrders = (row) => {
      router.push({ name: 'SalesmenSales', query: { customer_id: row.id } });
    };
    
    // 删除客户
    const handleDelete = (row) => {
      ElMessageBox.confirm('确定要删除该客户吗？此操作不可恢复', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await axios.delete(`/admin/salesman-customers/${row.id}`);
          ElMessage.success('删除成功');
          getCustomerList();
        } catch (error) {
          console.error('删除失败', error);
          ElMessage.error('删除失败');
        }
      }).catch(() => {});
    };
    
    // 返回业务员详情页
    const backToSalesman = () => {
      router.push({ name: 'SalesmenDetail', params: { id: salesmanId } });
    };
    
    // 获取状态对应的类型
    const getStatusType = (status) => {
      switch (status) {
        case 'potential':
          return 'warning';
        case 'active':
          return 'success';
        case 'inactive':
          return 'info';
        default:
          return 'info';
      }
    };
    
    // 获取状态对应的文本
    const getStatusText = (status) => {
      switch (status) {
        case 'potential':
          return '潜在客户';
        case 'active':
          return '活跃客户';
        case 'inactive':
          return '非活跃客户';
        default:
          return '未知';
      }
    };
    
    // 格式化日期
    const formatDate = (date) => {
      if (!date) return '无';
      return new Date(date).toLocaleDateString('zh-CN');
    };
    
    // 格式化价格
    const formatPrice = (price) => {
      return parseFloat(price || 0).toFixed(2);
    };
    
    onMounted(() => {
      getCustomerList();
    });
    
    return {
      loading,
      customerList,
      total,
      queryParams,
      dialogVisible,
      customerForm,
      customerRules,
      customerFormRef,
      formTitle,
      isEdit,
      handleQuery,
      resetQuery,
      handleSizeChange,
      handleCurrentChange,
      handleAddCustomer,
      handleEdit,
      submitCustomerForm,
      handleViewOrders,
      handleDelete,
      backToSalesman,
      getStatusType,
      getStatusText,
      formatDate,
      formatPrice
    };
  }
};
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.data-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.loading-container {
  padding: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 