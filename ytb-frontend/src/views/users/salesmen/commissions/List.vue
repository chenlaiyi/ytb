<template>
  <div class="app-container">
    <el-card class="filter-card">
      <template #header>
        <div class="card-header">
          <span>佣金记录</span>
          <div>
            <el-button @click="backToSalesman">返回业务员详情</el-button>
            <el-button type="primary" @click="handleAddCommission">添加佣金记录</el-button>
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
        <el-form-item label="周期">
          <el-input v-model="queryParams.period" placeholder="请输入周期" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="所有状态" clearable>
            <el-option label="待支付" value="pending" />
            <el-option label="已支付" value="paid" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 佣金记录表格 -->
    <el-card class="data-card">
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>
      
      <el-table
        v-else
        :data="commissionList"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="period" label="周期" width="120" />
        <el-table-column prop="start_date" label="开始日期" width="120">
          <template #default="scope">
            {{ formatDate(scope.row.start_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="end_date" label="结束日期" width="120">
          <template #default="scope">
            {{ formatDate(scope.row.end_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="佣金金额" width="120" align="right">
          <template #default="scope">
            ¥{{ formatPrice(scope.row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payment_date" label="支付日期" width="120">
          <template #default="scope">
            {{ formatDate(scope.row.payment_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="remarks" label="备注" min-width="200" show-overflow-tooltip />
        <el-table-column prop="created_at" label="创建时间" width="120">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <el-button-group>
              <el-button type="primary" size="small" @click="handleEdit(scope.row)" v-if="scope.row.status === 'pending'">编辑</el-button>
              <el-button type="success" size="small" @click="handlePay(scope.row)" v-if="scope.row.status === 'pending'">结算</el-button>
              <el-button type="danger" size="small" @click="handleDelete(scope.row)" v-if="scope.row.status === 'pending'">删除</el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 无数据提示 -->
      <el-empty v-if="!loading && commissionList.length === 0" description="暂无佣金记录" />
      
      <!-- 分页 -->
      <div class="pagination-container" v-if="!loading && commissionList.length > 0">
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
    
    <!-- 新增/编辑佣金记录对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formTitle"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="commissionFormRef"
        :model="commissionForm"
        :rules="commissionRules"
        label-width="100px"
      >
        <el-form-item label="佣金金额" prop="amount">
          <el-input-number v-model="commissionForm.amount" :min="0" :precision="2" :step="0.01" style="width: 100%" />
        </el-form-item>
        <el-form-item label="周期" prop="period">
          <el-input v-model="commissionForm.period" placeholder="例如：2023年3月" />
        </el-form-item>
        <el-form-item label="时间范围" prop="date_range">
          <el-date-picker
            v-model="commissionForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="commissionForm.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="待支付" value="pending" />
            <el-option label="已支付" value="paid" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付日期" prop="payment_date" v-if="commissionForm.status === 'paid'">
          <el-date-picker
            v-model="commissionForm.payment_date"
            type="date"
            placeholder="选择支付日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remarks">
          <el-input v-model="commissionForm.remarks" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCommissionForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 结算佣金对话框 -->
    <el-dialog
      v-model="payDialogVisible"
      title="佣金结算"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="payFormRef"
        :model="payForm"
        :rules="payRules"
        label-width="100px"
      >
        <el-form-item label="佣金ID">
          <el-input v-model="payForm.id" disabled />
        </el-form-item>
        <el-form-item label="佣金金额">
          <el-input v-model="payForm.amount" disabled>
            <template #prepend>¥</template>
          </el-input>
        </el-form-item>
        <el-form-item label="周期">
          <el-input v-model="payForm.period" disabled />
        </el-form-item>
        <el-form-item label="支付日期" prop="payment_date">
          <el-date-picker
            v-model="payForm.payment_date"
            type="date"
            placeholder="选择支付日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remarks">
          <el-input v-model="payForm.remarks" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="payDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitPayForm">确认结算</el-button>
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
  name: 'SalesmenCommissionsList',
  
  setup() {
    const router = useRouter();
    const route = useRoute();
    const loading = ref(true);
    const commissionList = ref([]);
    const total = ref(0);
    const dialogVisible = ref(false);
    const payDialogVisible = ref(false);
    const commissionFormRef = ref(null);
    const payFormRef = ref(null);
    const dateRange = ref([]);
    const isEdit = ref(false);
    
    // 获取业务员ID
    const salesmanId = route.params.id;
    
    // 查询参数
    const queryParams = reactive({
      page: 1,
      limit: 15,
      salesman_id: salesmanId,
      period: '',
      status: '',
      start_date: '',
      end_date: ''
    });
    
    // 佣金表单
    const commissionForm = reactive({
      id: null,
      salesman_id: salesmanId,
      amount: 0,
      period: '',
      date_range: [],
      status: 'pending',
      payment_date: '',
      remarks: ''
    });
    
    // 表单验证规则
    const commissionRules = reactive({
      amount: [
        { required: true, message: '请输入佣金金额', trigger: 'blur' },
        { type: 'number', min: 0, message: '金额必须大于等于0', trigger: 'blur' }
      ],
      period: [
        { required: true, message: '请输入周期', trigger: 'blur' },
        { max: 50, message: '长度不能超过50个字符', trigger: 'blur' }
      ],
      date_range: [
        { required: true, message: '请选择时间范围', trigger: 'change' }
      ],
      status: [
        { required: true, message: '请选择状态', trigger: 'change' }
      ],
      payment_date: [
        { required: true, message: '请选择支付日期', trigger: 'change' }
      ]
    });
    
    // 结算表单
    const payForm = reactive({
      id: null,
      amount: 0,
      period: '',
      payment_date: new Date(),
      remarks: ''
    });
    
    // 支付表单验证规则
    const payRules = reactive({
      payment_date: [
        { required: true, message: '请选择支付日期', trigger: 'change' }
      ]
    });
    
    // 表单标题
    const formTitle = computed(() => {
      return isEdit.value ? '编辑佣金记录' : '添加佣金记录';
    });
    
    // 获取佣金记录列表
    const getCommissionList = async () => {
      try {
        loading.value = true;
        const response = await axios.get('/admin/salesman-commissions', { params: queryParams });
        commissionList.value = response.data.data;
        total.value = response.data.total;
      } catch (error) {
        console.error('获取佣金记录失败', error);
        ElMessage.error('获取佣金记录失败');
      } finally {
        loading.value = false;
      }
    };
    
    // 查询按钮点击事件
    const handleQuery = () => {
      queryParams.page = 1;
      getCommissionList();
    };
    
    // 重置查询条件
    const resetQuery = () => {
      dateRange.value = [];
      Object.assign(queryParams, {
        page: 1,
        period: '',
        status: '',
        start_date: '',
        end_date: ''
      });
      getCommissionList();
    };
    
    // 日期范围变化处理
    const handleDateRangeChange = (val) => {
      queryParams.start_date = val ? val[0] : '';
      queryParams.end_date = val ? val[1] : '';
    };
    
    // 分页大小变化处理
    const handleSizeChange = (size) => {
      queryParams.limit = size;
      getCommissionList();
    };
    
    // 页码变化处理
    const handleCurrentChange = (page) => {
      queryParams.page = page;
      getCommissionList();
    };
    
    // 添加佣金记录
    const handleAddCommission = () => {
      isEdit.value = false;
      dialogVisible.value = true;
      
      // 重置表单
      Object.assign(commissionForm, {
        id: null,
        salesman_id: salesmanId,
        amount: 0,
        period: '',
        date_range: [],
        status: 'pending',
        payment_date: '',
        remarks: ''
      });
    };
    
    // 编辑佣金记录
    const handleEdit = (row) => {
      isEdit.value = true;
      dialogVisible.value = true;
      
      // 填充表单
      Object.assign(commissionForm, {
        id: row.id,
        salesman_id: salesmanId,
        amount: row.amount,
        period: row.period,
        date_range: [row.start_date, row.end_date],
        status: row.status,
        payment_date: row.payment_date,
        remarks: row.remarks
      });
    };
    
    // 提交佣金记录表单
    const submitCommissionForm = async () => {
      if (!commissionFormRef.value) return;
      
      await commissionFormRef.value.validate(async (valid, fields) => {
        if (valid) {
          try {
            const formData = { ...commissionForm };
            
            // 处理日期
            if (formData.date_range && formData.date_range.length === 2) {
              formData.start_date = formData.date_range[0];
              formData.end_date = formData.date_range[1];
            }
            delete formData.date_range;
            
            if (formData.payment_date) {
              formData.payment_date = new Date(formData.payment_date).toISOString().split('T')[0];
            }
            
            if (isEdit.value) {
              // 更新
              await axios.put(`/admin/salesman-commissions/${formData.id}`, formData);
              ElMessage.success('佣金记录更新成功');
            } else {
              // 新增
              await axios.post('/admin/salesman-commissions', formData);
              ElMessage.success('佣金记录添加成功');
            }
            
            dialogVisible.value = false;
            getCommissionList();
          } catch (error) {
            console.error('操作失败', error);
            ElMessage.error(error.response?.data?.message || '操作失败');
          }
        } else {
        }
      });
    };
    
    // 结算佣金
    const handlePay = (row) => {
      payDialogVisible.value = true;
      
      // 填充表单
      Object.assign(payForm, {
        id: row.id,
        amount: row.amount,
        period: row.period,
        payment_date: new Date(),
        remarks: ''
      });
    };
    
    // 提交结算表单
    const submitPayForm = async () => {
      if (!payFormRef.value) return;
      
      await payFormRef.value.validate(async (valid, fields) => {
        if (valid) {
          try {
            const formData = { ...payForm };
            
            if (formData.payment_date) {
              formData.payment_date = new Date(formData.payment_date).toISOString().split('T')[0];
            }
            
            await axios.post(`/admin/salesman-commissions/${formData.id}/pay`, formData);
            
            ElMessage.success('佣金结算成功');
            payDialogVisible.value = false;
            getCommissionList();
          } catch (error) {
            console.error('佣金结算失败', error);
            ElMessage.error(error.response?.data?.message || '佣金结算失败');
          }
        } else {
        }
      });
    };
    
    // 删除佣金记录
    const handleDelete = (row) => {
      ElMessageBox.confirm('确定要删除该佣金记录吗？此操作不可恢复', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await axios.delete(`/admin/salesman-commissions/${row.id}`);
          ElMessage.success('删除成功');
          getCommissionList();
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
        case 'pending':
          return 'warning';
        case 'paid':
          return 'success';
        case 'cancelled':
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
        case 'cancelled':
          return '已取消';
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
      getCommissionList();
    });
    
    return {
      loading,
      commissionList,
      total,
      queryParams,
      dateRange,
      dialogVisible,
      payDialogVisible,
      commissionForm,
      commissionRules,
      commissionFormRef,
      payForm,
      payRules,
      payFormRef,
      formTitle,
      handleQuery,
      resetQuery,
      handleDateRangeChange,
      handleSizeChange,
      handleCurrentChange,
      handleAddCommission,
      handleEdit,
      submitCommissionForm,
      handlePay,
      submitPayForm,
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