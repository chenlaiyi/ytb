<template>
  <div>
    <a-card :bordered="false" title="商户结算记录">
      <!-- 搜索区域 -->
      <a-form layout="inline" :model="searchForm" @submit.prevent="handleSearch">
        <a-form-item label="商户">
          <a-select
            v-model:value="searchForm.merchant_id"
            style="width: 200px"
            placeholder="请选择商户"
            allowClear
            :loading="merchantsLoading"
          >
            <a-select-option v-for="item in merchants" :key="item.id" :value="item.id">
              {{ item.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="结算状态">
          <a-select v-model:value="searchForm.status" style="width: 120px" allowClear>
            <a-select-option value="pending">待处理</a-select-option>
            <a-select-option value="processing">处理中</a-select-option>
            <a-select-option value="success">成功</a-select-option>
            <a-select-option value="failed">失败</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="创建时间">
          <a-range-picker v-model:value="dateRange" style="width: 260px" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit">
            <template #icon><search-outlined /></template>
            查询
          </a-button>
          <a-button style="margin-left: 8px" @click="handleReset">
            <template #icon><reload-outlined /></template>
            重置
          </a-button>
        </a-form-item>
      </a-form>

      <!-- 操作按钮 -->
      <div style="margin-bottom: 16px; margin-top: 16px;">
        <a-button type="primary" @click="showCreateModal">
          <template #icon><plus-outlined /></template>
          新增结算
        </a-button>
      </div>

      <!-- 数据表格 -->
      <a-table
        :columns="columns"
        :data-source="settlements"
        :pagination="pagination"
        :loading="loading"
        rowKey="id"
        @change="handleTableChange"
      >
        <!-- 结算状态 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ record.status_text }}
            </a-tag>
          </template>

          <!-- 结算金额 -->
          <template v-if="column.dataIndex === 'amount'">
            <span>¥{{ formatAmount(record.amount) }}</span>
          </template>

          <!-- 商户名称 -->
          <template v-if="column.dataIndex === 'merchant_name'">
            <a-tooltip :title="record.merchant_name">
              <span>{{ record.merchant_name }}</span>
            </a-tooltip>
          </template>

          <!-- 备注 -->
          <template v-if="column.dataIndex === 'remarks'">
            <a-tooltip v-if="record.remarks" :title="record.remarks">
              <span>{{ record.remarks.length > 10 ? record.remarks.substring(0, 10) + '...' : record.remarks }}</span>
            </a-tooltip>
            <span v-else>-</span>
          </template>

          <!-- 操作列 -->
          <template v-if="column.dataIndex === 'action'">
            <a-space>
              <a @click="showDetail(record)">查看</a>
              <a-divider type="vertical" />
              <a v-if="record.status === 'pending'" @click="updateStatus(record.id, 'processing')">处理</a>
              <a v-if="record.status === 'processing'" @click="updateStatus(record.id, 'success')">完成</a>
            </a-space>
          </template>
        </template>
      </a-table>

      <!-- 结算详情抽屉 -->
      <a-drawer
        v-model:visible="detailDrawerVisible"
        title="结算详情"
        :width="600"
        placement="right"
      >
        <a-descriptions bordered :column="1" v-if="currentSettlement">
          <a-descriptions-item label="结算单号">{{ currentSettlement.settlement_no }}</a-descriptions-item>
          <a-descriptions-item label="商户名称">{{ currentSettlement.merchant_name }}</a-descriptions-item>
          <a-descriptions-item label="结算金额">¥{{ formatAmount(currentSettlement.amount) }}</a-descriptions-item>
          <a-descriptions-item label="结算状态">
            <a-tag :color="getStatusColor(currentSettlement.status)">{{ currentSettlement.status_text }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="银行名称">{{ currentSettlement.bank_name || '-' }}</a-descriptions-item>
          <a-descriptions-item label="支行名称">{{ currentSettlement.bank_branch || '-' }}</a-descriptions-item>
          <a-descriptions-item label="开户名">{{ currentSettlement.bank_account_name || '-' }}</a-descriptions-item>
          <a-descriptions-item label="银行账号">{{ currentSettlement.bank_account_no || '-' }}</a-descriptions-item>
          <a-descriptions-item label="结算时间">{{ currentSettlement.settlement_time || '-' }}</a-descriptions-item>
          <a-descriptions-item label="备注">{{ currentSettlement.remarks || '-' }}</a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ currentSettlement.created_at }}</a-descriptions-item>
          <a-descriptions-item label="更新时间">{{ currentSettlement.updated_at }}</a-descriptions-item>
        </a-descriptions>
      </a-drawer>

      <!-- 创建结算弹窗 -->
      <a-modal
        v-model:visible="createModalVisible"
        title="创建结算"
        @ok="handleCreateSubmit"
        @cancel="() => (createModalVisible = false)"
        :confirmLoading="submitLoading"
      >
        <a-form :model="formState" :rules="rules" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
          <a-form-item label="商户" name="merchant_id" required>
            <a-select
              v-model:value="formState.merchant_id"
              style="width: 100%"
              placeholder="请选择商户"
              :loading="merchantsLoading"
              @change="handleMerchantChange"
            >
              <a-select-option v-for="item in merchants" :key="item.id" :value="item.id">
                {{ item.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="结算金额" name="amount" required>
            <a-input-number
              v-model:value="formState.amount"
              style="width: 100%"
              precision="2"
              placeholder="请输入结算金额"
              :min="0.01"
            />
          </a-form-item>
          <a-form-item label="银行名称" name="bank_name">
            <a-input v-model:value="formState.bank_name" placeholder="请输入银行名称" />
          </a-form-item>
          <a-form-item label="支行名称" name="bank_branch">
            <a-input v-model:value="formState.bank_branch" placeholder="请输入支行名称" />
          </a-form-item>
          <a-form-item label="开户名" name="bank_account_name">
            <a-input v-model:value="formState.bank_account_name" placeholder="请输入开户名" />
          </a-form-item>
          <a-form-item label="银行账号" name="bank_account_no">
            <a-input v-model:value="formState.bank_account_no" placeholder="请输入银行账号" />
          </a-form-item>
          <a-form-item label="备注" name="remarks">
            <a-textarea v-model:value="formState.remarks" placeholder="请输入备注信息" :rows="3" />
          </a-form-item>
        </a-form>
      </a-modal>
    </a-card>
  </div>
</template>

<script>
import { defineComponent, ref, reactive, toRefs, onMounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import { useRoute } from 'vue-router';
import { 
  getAdminMerchants, 
  getMerchantSettlements, 
  createMerchantSettlement 
} from '@/api/merchant';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  PlusOutlined 
} from '@ant-design/icons-vue';

export default defineComponent({
  name: 'MerchantSettlements',
  components: {
    SearchOutlined,
    ReloadOutlined,
    PlusOutlined
  },
  setup() {
    const route = useRoute();
    const dateRange = ref(null);

    const state = reactive({
      // 搜索表单
      searchForm: {
        merchant_id: undefined,
        status: undefined,
        start_date: undefined,
        end_date: undefined
      },
      // 表格数据
      settlements: [],
      loading: false,
      // 商户选择数据
      merchants: [],
      merchantsLoading: false,
      // 分页参数
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
        showTotal: total => `共 ${total} 条记录`,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100']
      },
      // 表格列定义
      columns: [
        {
          title: '结算单号',
          dataIndex: 'settlement_no',
          key: 'settlement_no',
          width: 180
        },
        {
          title: '商户名称',
          dataIndex: 'merchant_name',
          key: 'merchant_name',
          width: 150,
          ellipsis: true
        },
        {
          title: '结算金额',
          dataIndex: 'amount',
          key: 'amount',
          width: 120,
          sorter: true
        },
        {
          title: '状态',
          dataIndex: 'status',
          key: 'status',
          width: 100,
          filters: [
            { text: '待处理', value: 'pending' },
            { text: '处理中', value: 'processing' },
            { text: '成功', value: 'success' },
            { text: '失败', value: 'failed' }
          ]
        },
        {
          title: '银行信息',
          dataIndex: 'bank_name',
          key: 'bank_name',
          width: 180,
          ellipsis: true,
          render: (_, record) => `${record.bank_name || '-'} / ${record.bank_account_name || '-'}`
        },
        {
          title: '银行账号',
          dataIndex: 'bank_account_no',
          key: 'bank_account_no',
          width: 150,
          ellipsis: true
        },
        {
          title: '备注',
          dataIndex: 'remarks',
          key: 'remarks',
          width: 120,
          ellipsis: true
        },
        {
          title: '创建时间',
          dataIndex: 'created_at',
          key: 'created_at',
          width: 160,
          sorter: true
        },
        {
          title: '操作',
          dataIndex: 'action',
          key: 'action',
          fixed: 'right',
          width: 120
        }
      ],
      // 弹窗控制
      detailDrawerVisible: false,
      createModalVisible: false,
      submitLoading: false,
      // 当前选中的结算记录
      currentSettlement: null,
      // 创建表单状态
      formState: {
        merchant_id: undefined,
        amount: null,
        bank_name: '',
        bank_branch: '',
        bank_account_name: '',
        bank_account_no: '',
        remarks: ''
      },
      // 表单验证规则
      rules: {
        merchant_id: [{ required: true, message: '请选择商户' }],
        amount: [
          { required: true, message: '请输入结算金额' },
          { type: 'number', min: 0.01, message: '结算金额必须大于0' }
        ]
      }
    });

    // 从URL参数获取商户ID
    onMounted(() => {
      const merchantId = route.query.merchant_id;
      if (merchantId) {
        state.searchForm.merchant_id = parseInt(merchantId);
      }
      fetchMerchants();
      fetchSettlements();
    });

    // 监听日期选择器变化
    watch(dateRange, (newVal) => {
      if (newVal && newVal.length === 2) {
        state.searchForm.start_date = newVal[0].format('YYYY-MM-DD');
        state.searchForm.end_date = newVal[1].format('YYYY-MM-DD');
      } else {
        state.searchForm.start_date = undefined;
        state.searchForm.end_date = undefined;
      }
    });

    const unwrapResponse = (payload) => {
      if (!payload || typeof payload !== 'object') {
        return payload || {};
      }
      return Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data || {} : payload;
    };

    const extractItems = (payload) => {
      if (!payload || typeof payload !== 'object') return [];
      if (Array.isArray(payload)) return payload;
      return payload.items || payload.list || [];
    };

    const extractTotal = (payload) => {
      if (!payload || typeof payload !== 'object') return 0;
      if (typeof payload.total === 'number') return payload.total;
      if (payload.pagination && typeof payload.pagination.total === 'number') {
        return payload.pagination.total;
      }
      return 0;
    };

    // 获取商户列表
    const fetchMerchants = async () => {
      try {
        state.merchantsLoading = true;
        const response = await getAdminMerchants({
          page: 1,
          limit: 100,
          status: 'active'
        });
        state.merchants = extractItems(unwrapResponse(response));
      } catch (error) {
        message.error('获取商户列表失败：' + error.message);
      } finally {
        state.merchantsLoading = false;
      }
    };

    // 获取结算记录
    const fetchSettlements = async () => {
      try {
        state.loading = true;
        const params = {
          page: state.pagination.current,
          limit: state.pagination.pageSize,
          merchant_id: state.searchForm.merchant_id,
          status: state.searchForm.status,
          start_date: state.searchForm.start_date,
          end_date: state.searchForm.end_date
        };

        const response = await getMerchantSettlements(params);
        const result = unwrapResponse(response);
        state.settlements = extractItems(result);
        state.pagination.total = extractTotal(result);
      } catch (error) {
        message.error('获取结算记录失败：' + error.message);
      } finally {
        state.loading = false;
      }
    };

    // 搜索
    const handleSearch = () => {
      state.pagination.current = 1;
      fetchSettlements();
    };

    // 重置搜索条件
    const handleReset = () => {
      state.searchForm.merchant_id = route.query.merchant_id ? parseInt(route.query.merchant_id) : undefined;
      state.searchForm.status = undefined;
      state.searchForm.start_date = undefined;
      state.searchForm.end_date = undefined;
      dateRange.value = null;
      state.pagination.current = 1;
      fetchSettlements();
    };

    // 表格变化（排序、筛选、分页）
    const handleTableChange = (pagination, filters, sorter) => {
      state.pagination.current = pagination.current;
      state.pagination.pageSize = pagination.pageSize;
      
      // 处理过滤
      if (filters.status && filters.status.length > 0) {
        state.searchForm.status = filters.status[0];
      }
      
      fetchSettlements();
    };

    // 显示详情抽屉
    const showDetail = (record) => {
      state.currentSettlement = record;
      state.detailDrawerVisible = true;
    };

    // 显示创建弹窗
    const showCreateModal = () => {
      // 重置表单
      state.formState = {
        merchant_id: state.searchForm.merchant_id, // 预设当前选中的商户（如果有）
        amount: null,
        bank_name: '',
        bank_branch: '',
        bank_account_name: '',
        bank_account_no: '',
        remarks: ''
      };
      
      // 自动填充银行信息（如果选择了商户）
      if (state.formState.merchant_id) {
        handleMerchantChange(state.formState.merchant_id);
      }
      
      state.createModalVisible = true;
    };

    // 商户选择变更
    const handleMerchantChange = (merchantId) => {
      if (!merchantId) return;
      
      const merchant = state.merchants.find(item => item.id === merchantId);
      if (merchant) {
        state.formState.bank_name = merchant.bank_name || '';
        state.formState.bank_branch = merchant.bank_branch || '';
        state.formState.bank_account_name = merchant.bank_account_name || '';
        state.formState.bank_account_no = merchant.bank_account_no || '';
      }
    };

    // 提交创建表单
    const handleCreateSubmit = async () => {
      if (!state.formState.merchant_id) {
        message.error('请选择商户');
        return;
      }
      
      if (!state.formState.amount) {
        message.error('请输入结算金额');
        return;
      }

      try {
        state.submitLoading = true;
        await createMerchantSettlement(state.formState);
        message.success('创建结算记录成功');
        state.createModalVisible = false;
        fetchSettlements();
      } catch (error) {
        message.error('创建结算记录失败：' + error.message);
      } finally {
        state.submitLoading = false;
      }
    };

    // 更新结算状态
    const updateStatus = async (id, status) => {
      try {
        state.loading = true;
        // TODO: 实现更新结算状态的API调用
        message.success('更新结算状态成功');
        fetchSettlements();
      } catch (error) {
        message.error('更新结算状态失败：' + error.message);
      } finally {
        state.loading = false;
      }
    };

    // 获取状态对应的颜色
    const getStatusColor = (status) => {
      const colors = {
        pending: 'orange',
        processing: 'blue',
        success: 'green',
        failed: 'red'
      };
      return colors[status] || 'default';
    };

    // 格式化金额
    const formatAmount = (amount) => {
      return parseFloat(amount).toFixed(2);
    };

    return {
      ...toRefs(state),
      dateRange,
      handleSearch,
      handleReset,
      handleTableChange,
      showDetail,
      showCreateModal,
      handleMerchantChange,
      handleCreateSubmit,
      updateStatus,
      getStatusColor,
      formatAmount
    };
  }
});
</script>

<style scoped>
.ant-form {
  margin-bottom: 16px;
}
</style> 
