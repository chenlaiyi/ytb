<template>
  <div class="app-container">
    <el-card class="filter-card">
      <template #header>
        <div class="card-header">
          <span>目标设置</span>
          <div>
            <el-button @click="backToSalesman">返回业务员详情</el-button>
            <el-button type="primary" @click="handleAddTarget">添加目标</el-button>
          </div>
        </div>
      </template>
      
      <!-- 筛选条件 -->
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="周期类型">
          <el-select v-model="queryParams.period_type" placeholder="所有类型" clearable>
            <el-option label="每月" value="monthly" />
            <el-option label="每季度" value="quarterly" />
            <el-option label="每年" value="yearly" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="周期">
          <el-input v-model="queryParams.period" placeholder="请输入周期" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="所有状态" clearable>
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="未完成" value="failed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 目标列表表格 -->
    <el-card class="data-card">
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>
      
      <el-table
        v-else
        :data="targetList"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="period_type" label="周期类型" width="100">
          <template #default="scope">
            {{ getPeriodTypeText(scope.row.period_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="period" label="周期" width="120" />
        <el-table-column label="时间范围" width="200">
          <template #default="scope">
            {{ formatDate(scope.row.start_date) }} 至 {{ formatDate(scope.row.end_date) }}
          </template>
        </el-table-column>
        <el-table-column label="销售目标" width="240">
          <template #default="scope">
            <div>数量：{{ scope.row.target_quantity }}</div>
            <div>金额：¥{{ formatPrice(scope.row.target_amount) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="当前达成" width="240">
          <template #default="scope">
            <div>
              数量：{{ scope.row.current_quantity || 0 }}
              <span class="achievement-rate">
                ({{ calculateRate(scope.row.current_quantity, scope.row.target_quantity) }}%)
              </span>
            </div>
            <div>
              金额：¥{{ formatPrice(scope.row.current_amount || 0) }}
              <span class="achievement-rate">
                ({{ calculateRate(scope.row.current_amount, scope.row.target_amount) }}%)
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remarks" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column prop="created_at" label="创建时间" width="120">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button-group>
              <el-button type="primary" size="small" @click="handleEdit(scope.row)" v-if="['in_progress', 'failed'].includes(scope.row.status)">编辑</el-button>
              <el-button type="success" size="small" @click="handleComplete(scope.row)" v-if="scope.row.status === 'in_progress'">标记完成</el-button>
              <el-button type="danger" size="small" @click="handleCancel(scope.row)" v-if="scope.row.status === 'in_progress'">取消</el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 无数据提示 -->
      <el-empty v-if="!loading && targetList.length === 0" description="暂无目标记录" />
      
      <!-- 分页 -->
      <div class="pagination-container" v-if="!loading && targetList.length > 0">
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
    
    <!-- 新增/编辑目标对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formTitle"
      width="550px"
      destroy-on-close
    >
      <el-form
        ref="targetFormRef"
        :model="targetForm"
        :rules="targetRules"
        label-width="120px"
      >
        <el-form-item label="周期类型" prop="period_type">
          <el-select v-model="targetForm.period_type" placeholder="请选择周期类型" style="width: 100%">
            <el-option label="每月" value="monthly" />
            <el-option label="每季度" value="quarterly" />
            <el-option label="每年" value="yearly" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="周期" prop="period">
          <el-input v-model="targetForm.period" placeholder="例如：2023年3月、2023年Q1、2023年" />
        </el-form-item>
        
        <el-form-item label="时间范围" prop="date_range">
          <el-date-picker
            v-model="targetForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
            :disabled="targetForm.period_type !== 'custom'"
            :disabledDate="disabledDate"
            @change="handleDateRangePickerChange"
          />
        </el-form-item>
        
        <el-form-item label="销售目标数量" prop="target_quantity">
          <el-input-number v-model="targetForm.target_quantity" :min="0" :precision="0" style="width: 100%" />
        </el-form-item>
        
        <el-form-item label="销售目标金额" prop="target_amount">
          <el-input-number v-model="targetForm.target_amount" :min="0" :precision="2" :step="0.01" style="width: 100%" />
        </el-form-item>
        
        <el-form-item label="备注" prop="remarks">
          <el-input v-model="targetForm.remarks" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitTargetForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';

export default {
  name: 'SalesmenTargetsList',
  
  setup() {
    const router = useRouter();
    const route = useRoute();
    const loading = ref(true);
    const targetList = ref([]);
    const total = ref(0);
    const dialogVisible = ref(false);
    const targetFormRef = ref(null);
    const isEdit = ref(false);
    
    // 获取业务员ID
    const salesmanId = route.params.id;
    
    // 查询参数
    const queryParams = reactive({
      page: 1,
      limit: 15,
      salesman_id: salesmanId,
      period_type: '',
      period: '',
      status: ''
    });
    
    // 目标表单
    const targetForm = reactive({
      id: null,
      salesman_id: salesmanId,
      period_type: 'monthly',
      period: '',
      date_range: [],
      start_date: '',
      end_date: '',
      target_quantity: 0,
      target_amount: 0,
      status: 'in_progress',
      remarks: ''
    });
    
    // 表单验证规则
    const targetRules = reactive({
      period_type: [
        { required: true, message: '请选择周期类型', trigger: 'change' }
      ],
      period: [
        { required: true, message: '请输入周期', trigger: 'blur' },
        { max: 50, message: '长度不能超过50个字符', trigger: 'blur' }
      ],
      date_range: [
        { required: true, message: '请选择时间范围', trigger: 'change' }
      ],
      target_quantity: [
        { required: true, message: '请输入销售目标数量', trigger: 'blur' },
        { type: 'number', min: 0, message: '数量必须大于等于0', trigger: 'blur' }
      ],
      target_amount: [
        { required: true, message: '请输入销售目标金额', trigger: 'blur' },
        { type: 'number', min: 0, message: '金额必须大于等于0', trigger: 'blur' }
      ]
    });
    
    // 表单标题
    const formTitle = computed(() => {
      return isEdit.value ? '编辑目标记录' : '添加目标记录';
    });
    
    // 周期类型变化时，自动设置日期范围
    watch(() => targetForm.period_type, (newValue) => {
      if (newValue && newValue !== 'custom') {
        setDefaultDateRange(newValue);
      }
    });
    
    // 根据周期类型设置默认日期范围
    const setDefaultDateRange = (periodType) => {
      const now = new Date();
      let start, end;
      
      switch (periodType) {
        case 'monthly':
          // 当月第一天到最后一天
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          targetForm.period = `${now.getFullYear()}年${now.getMonth() + 1}月`;
          break;
        case 'quarterly':
          // 当前季度第一天到最后一天
          const quarter = Math.floor(now.getMonth() / 3);
          start = new Date(now.getFullYear(), quarter * 3, 1);
          end = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
          targetForm.period = `${now.getFullYear()}年Q${quarter + 1}`;
          break;
        case 'yearly':
          // 当年第一天到最后一天
          start = new Date(now.getFullYear(), 0, 1);
          end = new Date(now.getFullYear(), 11, 31);
          targetForm.period = `${now.getFullYear()}年`;
          break;
      }
      
      targetForm.date_range = [start, end];
      targetForm.start_date = formatDateToString(start);
      targetForm.end_date = formatDateToString(end);
    };
    
    // 日期范围选择器变化处理
    const handleDateRangePickerChange = (val) => {
      if (val) {
        targetForm.start_date = formatDateToString(val[0]);
        targetForm.end_date = formatDateToString(val[1]);
      } else {
        targetForm.start_date = '';
        targetForm.end_date = '';
      }
    };
    
    // 格式化日期为字符串
    const formatDateToString = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    
    // 禁用日期
    const disabledDate = (time) => {
      // 禁用今天之后的日期，但针对自定义类型不做此限制
      if (targetForm.period_type !== 'custom') {
        return time.getTime() > Date.now();
      }
      return false;
    };
    
    // 获取目标列表
    const getTargetList = async () => {
      try {
        loading.value = true;
        const response = await axios.get('/admin/salesman-targets', { params: queryParams });
        targetList.value = response.data.data;
        total.value = response.data.total;
      } catch (error) {
        console.error('获取目标列表失败', error);
        ElMessage.error('获取目标列表失败');
      } finally {
        loading.value = false;
      }
    };
    
    // 查询按钮点击事件
    const handleQuery = () => {
      queryParams.page = 1;
      getTargetList();
    };
    
    // 重置查询条件
    const resetQuery = () => {
      Object.assign(queryParams, {
        page: 1,
        period_type: '',
        period: '',
        status: ''
      });
      getTargetList();
    };
    
    // 分页大小变化处理
    const handleSizeChange = (size) => {
      queryParams.limit = size;
      getTargetList();
    };
    
    // 页码变化处理
    const handleCurrentChange = (page) => {
      queryParams.page = page;
      getTargetList();
    };
    
    // 添加目标
    const handleAddTarget = () => {
      isEdit.value = false;
      dialogVisible.value = true;
      
      // 重置表单
      Object.assign(targetForm, {
        id: null,
        salesman_id: salesmanId,
        period_type: 'monthly',
        period: '',
        date_range: [],
        start_date: '',
        end_date: '',
        target_quantity: 0,
        target_amount: 0,
        status: 'in_progress',
        remarks: ''
      });
      
      // 设置默认日期范围
      setDefaultDateRange('monthly');
    };
    
    // 编辑目标
    const handleEdit = (row) => {
      isEdit.value = true;
      dialogVisible.value = true;
      
      // 填充表单
      Object.assign(targetForm, {
        id: row.id,
        salesman_id: salesmanId,
        period_type: row.period_type,
        period: row.period,
        date_range: [new Date(row.start_date), new Date(row.end_date)],
        start_date: row.start_date,
        end_date: row.end_date,
        target_quantity: row.target_quantity,
        target_amount: row.target_amount,
        status: row.status,
        remarks: row.remarks
      });
    };
    
    // 提交目标表单
    const submitTargetForm = async () => {
      if (!targetFormRef.value) return;
      
      await targetFormRef.value.validate(async (valid, fields) => {
        if (valid) {
          try {
            const formData = { ...targetForm };
            
            if (isEdit.value) {
              // 更新
              await axios.put(`/admin/salesman-targets/${formData.id}`, formData);
              ElMessage.success('目标记录更新成功');
            } else {
              // 新增
              await axios.post('/admin/salesman-targets', formData);
              ElMessage.success('目标记录添加成功');
            }
            
            dialogVisible.value = false;
            getTargetList();
          } catch (error) {
            console.error('操作失败', error);
            ElMessage.error(error.response?.data?.message || '操作失败');
          }
        } else {
        }
      });
    };
    
    // 标记完成
    const handleComplete = (row) => {
      ElMessageBox.confirm('确定要将此目标标记为已完成吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(async () => {
        try {
          await axios.post(`/admin/salesman-targets/${row.id}/complete`);
          ElMessage.success('操作成功');
          getTargetList();
        } catch (error) {
          console.error('操作失败', error);
          ElMessage.error('操作失败');
        }
      }).catch(() => {});
    };
    
    // 取消目标
    const handleCancel = (row) => {
      ElMessageBox.confirm('确定要取消此目标吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await axios.post(`/admin/salesman-targets/${row.id}/cancel`);
          ElMessage.success('取消成功');
          getTargetList();
        } catch (error) {
          console.error('取消失败', error);
          ElMessage.error('取消失败');
        }
      }).catch(() => {});
    };
    
    // 返回业务员详情页
    const backToSalesman = () => {
      router.push({ name: 'SalesmenDetail', params: { id: salesmanId } });
    };
    
    // 获取周期类型文本
    const getPeriodTypeText = (type) => {
      switch (type) {
        case 'monthly':
          return '每月';
        case 'quarterly':
          return '每季度';
        case 'yearly':
          return '每年';
        case 'custom':
          return '自定义';
        default:
          return '未知';
      }
    };
    
    // 获取状态对应的类型
    const getStatusType = (status) => {
      switch (status) {
        case 'in_progress':
          return 'info';
        case 'completed':
          return 'success';
        case 'failed':
          return 'danger';
        case 'cancelled':
          return 'warning';
        default:
          return 'info';
      }
    };
    
    // 获取状态对应的文本
    const getStatusText = (status) => {
      switch (status) {
        case 'in_progress':
          return '进行中';
        case 'completed':
          return '已完成';
        case 'failed':
          return '未完成';
        case 'cancelled':
          return '已取消';
        default:
          return '未知';
      }
    };
    
    // 计算达成率
    const calculateRate = (current, target) => {
      if (!target || target <= 0) return 0;
      const rate = (current || 0) / target * 100;
      return rate.toFixed(2);
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
      getTargetList();
    });
    
    return {
      loading,
      targetList,
      total,
      queryParams,
      dialogVisible,
      targetForm,
      targetRules,
      targetFormRef,
      formTitle,
      disabledDate,
      handleDateRangePickerChange,
      handleQuery,
      resetQuery,
      handleSizeChange,
      handleCurrentChange,
      handleAddTarget,
      handleEdit,
      submitTargetForm,
      handleComplete,
      handleCancel,
      backToSalesman,
      getPeriodTypeText,
      getStatusType,
      getStatusText,
      calculateRate,
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

.achievement-rate {
  color: #67C23A;
  font-size: 12px;
  margin-left: 5px;
}
</style> 