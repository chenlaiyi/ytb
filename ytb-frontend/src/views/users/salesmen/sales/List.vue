<template>
  <div class="app-container">
    <el-card class="filter-card">
      <template #header>
        <div class="card-header">
          <span>销售记录</span>
          <div>
            <el-button @click="backToSalesman">返回业务员详情</el-button>
            <el-button type="primary" @click="handleAddSales">添加销售记录</el-button>
          </div>
        </div>
      </template>
      
      <!-- 筛选条件 -->
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="handleDateRangeChange"
          />
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model="queryParams.order_no" placeholder="请输入订单号" clearable />
        </el-form-item>
        <el-form-item label="商品名称">
          <el-input v-model="queryParams.product_name" placeholder="请输入商品名称" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="所有状态" clearable>
            <el-option label="待支付" value="pending" />
            <el-option label="已支付" value="paid" />
            <el-option label="已发货" value="shipped" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="已退款" value="refunded" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 销售记录表格 -->
    <el-card class="data-card">
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>
      
      <el-table
        v-else
        :data="salesList"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="order_no" label="订单号" width="180" />
        <el-table-column prop="product_name" label="商品名称" min-width="200" />
        <el-table-column prop="quantity" label="数量" width="80" align="center" />
        <el-table-column prop="amount" label="金额" width="120" align="right">
          <template #default="scope">
            ¥{{ formatPrice(scope.row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="commission" label="佣金" width="120" align="right">
          <template #default="scope">
            ¥{{ formatPrice(scope.row.commission) }}
          </template>
        </el-table-column>
        <el-table-column prop="customer_name" label="客户名称" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sale_date" label="销售日期" width="120">
          <template #default="scope">
            {{ formatDate(scope.row.sale_date) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="viewOrderDetail(scope.row)" :disabled="!scope.row.order_id">查看订单</el-button>
            <el-button type="danger" size="small" @click="handleDelete(scope.row)" v-if="scope.row.status === 'pending'">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 无数据提示 -->
      <el-empty v-if="!loading && salesList.length === 0" description="暂无销售记录" />
      
      <!-- 分页 -->
      <div class="pagination-container" v-if="!loading && salesList.length > 0">
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
    
    <!-- 新增销售记录对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="添加销售记录"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="salesFormRef"
        :model="salesForm"
        :rules="salesRules"
        label-width="100px"
      >
        <el-form-item label="商品名称" prop="product_name">
          <el-input v-model="salesForm.product_name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="客户" prop="customer_id">
          <el-select
            v-model="salesForm.customer_id"
            placeholder="请选择客户"
            style="width: 100%"
            filterable
            clearable
          >
            <el-option
              v-for="customer in customerOptions"
              :key="customer.id"
              :label="customer.customer_name"
              :value="customer.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="销售数量" prop="quantity">
          <el-input-number v-model="salesForm.quantity" :min="1" :precision="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="销售金额" prop="amount">
          <el-input-number v-model="salesForm.amount" :min="0" :precision="2" :step="0.01" style="width: 100%" />
        </el-form-item>
        <el-form-item label="佣金" prop="commission">
          <el-input-number v-model="salesForm.commission" :min="0" :precision="2" :step="0.01" style="width: 100%" />
        </el-form-item>
        <el-form-item label="销售日期" prop="sale_date">
          <el-date-picker
            v-model="salesForm.sale_date"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="订单号" prop="order_no">
          <el-input v-model="salesForm.order_no" placeholder="请输入订单号（可选）" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="salesForm.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="待支付" value="pending" />
            <el-option label="已支付" value="paid" />
            <el-option label="已发货" value="shipped" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="已退款" value="refunded" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="salesForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitSalesForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';

export default {
  name: 'SalesmenSalesList',
  
  setup() {
    const router = useRouter();
    const route = useRoute();
    const loading = ref(true);
    const salesList = ref([]);
    const total = ref(0);
    const dialogVisible = ref(false);
    const salesFormRef = ref(null);
    const customerOptions = ref([]);
    const dateRange = ref([]);
    
    // 获取业务员ID
    const salesmanId = route.params.id;
    
    // 查询参数
    const queryParams = reactive({
      page: 1,
      limit: 15,
      salesman_id: salesmanId,
      order_no: '',
      product_name: '',
      status: '',
      start_date: '',
      end_date: ''
    });
    
    // 销售表单
    const salesForm = reactive({
      salesman_id: salesmanId,
      product_name: '',
      customer_id: null,
      quantity: 1,
      amount: 0,
      commission: 0,
      sale_date: new Date(),
      order_no: '',
      status: 'completed',
      remark: ''
    });
    
    // 表单验证规则
    const salesRules = reactive({
      product_name: [
        { required: true, message: '请输入商品名称', trigger: 'blur' },
        { max: 100, message: '长度不能超过100个字符', trigger: 'blur' }
      ],
      quantity: [
        { required: true, message: '请输入销售数量', trigger: 'blur' },
        { type: 'number', min: 1, message: '数量必须大于0', trigger: 'blur' }
      ],
      amount: [
        { required: true, message: '请输入销售金额', trigger: 'blur' },
        { type: 'number', min: 0, message: '金额必须大于等于0', trigger: 'blur' }
      ],
      status: [
        { required: true, message: '请选择状态', trigger: 'change' }
      ],
      sale_date: [
        { required: true, message: '请选择销售日期', trigger: 'change' }
      ]
    });
    
    // 获取销售记录列表
    const getSalesList = async () => {
      try {
        loading.value = true;
        const response = await axios.get('/admin/salesman-sales', { params: queryParams });
        salesList.value = response.data.data;
        total.value = response.data.total;
      } catch (error) {
        console.error('获取销售记录失败', error);
        ElMessage.error('获取销售记录失败');
      } finally {
        loading.value = false;
      }
    };
    
    // 获取客户列表
    const getCustomerOptions = async () => {
      try {
        const response = await axios.get(`/admin/salesmen/${salesmanId}/customers`);
        customerOptions.value = response.data;
      } catch (error) {
        console.error('获取客户列表失败', error);
        ElMessage.error('获取客户列表失败');
      }
    };
    
    // 查询按钮点击事件
    const handleQuery = () => {
      queryParams.page = 1;
      getSalesList();
    };
    
    // 重置查询条件
    const resetQuery = () => {
      dateRange.value = [];
      Object.assign(queryParams, {
        page: 1,
        order_no: '',
        product_name: '',
        status: '',
        start_date: '',
        end_date: ''
      });
      getSalesList();
    };
    
    // 日期范围变化处理
    const handleDateRangeChange = (val) => {
      queryParams.start_date = val ? val[0] : '';
      queryParams.end_date = val ? val[1] : '';
    };
    
    // 分页大小变化处理
    const handleSizeChange = (size) => {
      queryParams.limit = size;
      getSalesList();
    };
    
    // 页码变化处理
    const handleCurrentChange = (page) => {
      queryParams.page = page;
      getSalesList();
    };
    
    // 添加销售记录
    const handleAddSales = () => {
      dialogVisible.value = true;
      
      // 重置表单
      Object.assign(salesForm, {
        salesman_id: salesmanId,
        product_name: '',
        customer_id: null,
        quantity: 1,
        amount: 0,
        commission: 0,
        sale_date: new Date(),
        order_no: '',
        status: 'completed',
        remark: ''
      });
    };
    
    // 提交销售记录表单
    const submitSalesForm = async () => {
      if (!salesFormRef.value) return;
      
      await salesFormRef.value.validate(async (valid, fields) => {
        if (valid) {
          try {
            const formData = { ...salesForm };
            
            if (formData.sale_date) {
              formData.sale_date = new Date(formData.sale_date).toISOString().split('T')[0];
            }
            
            await axios.post('/admin/salesman-sales', formData);
            
            ElMessage.success('销售记录添加成功');
            dialogVisible.value = false;
            getSalesList();
          } catch (error) {
            console.error('销售记录添加失败', error);
            ElMessage.error(error.response?.data?.message || '销售记录添加失败');
          }
        } else {
        }
      });
    };
    
    // 删除销售记录
    const handleDelete = (row) => {
      ElMessageBox.confirm('确定要删除该销售记录吗？此操作不可恢复', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await axios.delete(`/admin/salesman-sales/${row.id}`);
          ElMessage.success('删除成功');
          getSalesList();
        } catch (error) {
          console.error('删除失败', error);
          ElMessage.error('删除失败');
        }
      }).catch(() => {});
    };
    
    // 查看订单详情
    const viewOrderDetail = (row) => {
      if (!row.order_id) {
        ElMessage.warning('未关联订单');
        return;
      }
      
      router.push({ name: 'OrderDetail', params: { id: row.order_id } });
    };
    
    // 返回业务员详情页
    const backToSalesman = () => {
      router.push({ name: 'SalesmenDetail', params: { id: salesmanId } });
    };
    
    // 获取状态对应的类型
    const getStatusType = (status) => {
      switch (status) {
        case 'pending':
          return 'warning';
        case 'paid':
          return 'success';
        case 'shipped':
          return 'info';
        case 'completed':
          return 'success';
        case 'cancelled':
          return 'danger';
        case 'refunded':
          return 'danger';
        default:
          return 'info';
      }
    };
    
    // 获取状态对应的文本
    const getStatusText = (status) => {
      switch (status) {
        case 'pending':
          return '待支付';
        case 'paid':
          return '已支付';
        case 'shipped':
          return '已发货';
        case 'completed':
          return '已完成';
        case 'cancelled':
          return '已取消';
        case 'refunded':
          return '已退款';
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
      getSalesList();
      getCustomerOptions();
    });
    
    return {
      loading,
      salesList,
      total,
      queryParams,
      dateRange,
      dialogVisible,
      salesForm,
      salesRules,
      salesFormRef,
      customerOptions,
      handleQuery,
      resetQuery,
      handleDateRangeChange,
      handleSizeChange,
      handleCurrentChange,
      handleAddSales,
      submitSalesForm,
      handleDelete,
      viewOrderDetail,
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