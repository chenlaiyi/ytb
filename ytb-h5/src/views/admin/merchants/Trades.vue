<template>
  <div>
    <a-card :bordered="false" title="商户交易记录">
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
        <a-form-item label="交易状态">
          <a-select v-model:value="searchForm.status" style="width: 120px" allowClear>
            <a-select-option value="pending">待支付</a-select-option>
            <a-select-option value="processing">处理中</a-select-option>
            <a-select-option value="success">成功</a-select-option>
            <a-select-option value="failed">失败</a-select-option>
            <a-select-option value="closed">已关闭</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="交易时间">
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

      <!-- 数据表格 -->
      <a-table
        :columns="columns"
        :data-source="trades"
        :pagination="pagination"
        :loading="loading"
        rowKey="id"
        @change="handleTableChange"
        style="margin-top: 16px;"
      >
        <!-- 交易状态 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ record.status_text }}
            </a-tag>
          </template>

          <!-- 支付方式 -->
          <template v-if="column.dataIndex === 'payment_method'">
            <a-tag color="blue">{{ record.payment_method_text }}</a-tag>
          </template>

          <!-- 商户名称 -->
          <template v-if="column.dataIndex === 'merchant_name'">
            <a-tooltip :title="record.merchant_name">
              <span>{{ record.merchant_name }}</span>
            </a-tooltip>
          </template>

          <!-- 交易金额 -->
          <template v-if="column.dataIndex === 'amount'">
            <span>¥{{ formatAmount(record.amount) }}</span>
          </template>

          <!-- 实际金额 -->
          <template v-if="column.dataIndex === 'actual_amount'">
            <span>¥{{ formatAmount(record.actual_amount) }}</span>
          </template>

          <!-- 手续费 -->
          <template v-if="column.dataIndex === 'fee'">
            <a-tooltip :title="`费率: ${record.fee_rate}%`">
              <span>¥{{ formatAmount(record.fee) }}</span>
            </a-tooltip>
          </template>

          <!-- 操作列 -->
          <template v-if="column.dataIndex === 'action'">
            <a @click="showTradeDetail(record)">查看详情</a>
          </template>
        </template>
      </a-table>

      <!-- 交易详情抽屉 -->
      <a-drawer
        v-model:visible="detailDrawerVisible"
        title="交易详情"
        :width="600"
        placement="right"
      >
        <a-descriptions bordered :column="1" v-if="currentTrade">
          <a-descriptions-item label="交易单号">{{ currentTrade.trade_no }}</a-descriptions-item>
          <a-descriptions-item label="商户订单号">{{ currentTrade.order_no }}</a-descriptions-item>
          <a-descriptions-item label="商户名称">{{ currentTrade.merchant_name }}</a-descriptions-item>
          <a-descriptions-item label="交易金额">¥{{ formatAmount(currentTrade.amount) }}</a-descriptions-item>
          <a-descriptions-item label="手续费">¥{{ formatAmount(currentTrade.fee) }}（费率：{{ currentTrade.fee_rate }}%）</a-descriptions-item>
          <a-descriptions-item label="实际金额">¥{{ formatAmount(currentTrade.actual_amount) }}</a-descriptions-item>
          <a-descriptions-item label="交易状态">
            <a-tag :color="getStatusColor(currentTrade.status)">{{ currentTrade.status_text }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="支付方式">
            <a-tag color="blue">{{ currentTrade.payment_method_text }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="交易类型">{{ currentTrade.trade_type_text }}</a-descriptions-item>
          <a-descriptions-item label="支付时间">{{ currentTrade.pay_time }}</a-descriptions-item>
          <a-descriptions-item label="支付者信息">
            <div>用户: {{ currentTrade.payer_name || '-' }}</div>
            <div>账号: {{ currentTrade.payer_account || '-' }}</div>
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ currentTrade.created_at }}</a-descriptions-item>
          <a-descriptions-item label="更新时间">{{ currentTrade.updated_at }}</a-descriptions-item>
        </a-descriptions>
      </a-drawer>
    </a-card>
  </div>
</template>

<script>
import { defineComponent, ref, reactive, toRefs, computed, onMounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import { useRoute } from 'vue-router';
import dayjs from 'dayjs';
import { getAdminMerchants, getAdminMerchantTrades } from '@/api/merchant';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue';

export default defineComponent({
  name: 'MerchantTrades',
  components: {
    SearchOutlined,
    ReloadOutlined
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
      trades: [],
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
          title: '交易单号',
          dataIndex: 'trade_no',
          key: 'trade_no',
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
          title: '交易金额',
          dataIndex: 'amount',
          key: 'amount',
          width: 100,
          sorter: true
        },
        {
          title: '手续费',
          dataIndex: 'fee',
          key: 'fee',
          width: 100
        },
        {
          title: '实际金额',
          dataIndex: 'actual_amount',
          key: 'actual_amount',
          width: 100
        },
        {
          title: '支付方式',
          dataIndex: 'payment_method',
          key: 'payment_method',
          width: 120
        },
        {
          title: '交易状态',
          dataIndex: 'status',
          key: 'status',
          width: 100,
          filters: [
            { text: '待支付', value: 'pending' },
            { text: '处理中', value: 'processing' },
            { text: '成功', value: 'success' },
            { text: '失败', value: 'failed' },
            { text: '已关闭', value: 'closed' }
          ]
        },
        {
          title: '支付时间',
          dataIndex: 'pay_time',
          key: 'pay_time',
          width: 160,
          sorter: true
        },
        {
          title: '操作',
          dataIndex: 'action',
          key: 'action',
          fixed: 'right',
          width: 80
        }
      ],
      // 交易详情
      detailDrawerVisible: false,
      currentTrade: null
    });

    // 从URL参数获取商户ID
    onMounted(() => {
      const merchantId = route.query.merchant_id;
      if (merchantId) {
        state.searchForm.merchant_id = parseInt(merchantId);
      }
      fetchMerchants();
      fetchTrades();
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
        const { data } = await getAdminMerchants({
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

    // 获取交易记录
    const fetchTrades = async () => {
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

        const response = await getAdminMerchantTrades(params);
        const result = unwrapResponse(response);
        state.trades = extractItems(result);
        state.pagination.total = extractTotal(result);
      } catch (error) {
        message.error('获取交易记录失败：' + error.message);
      } finally {
        state.loading = false;
      }
    };

    // 搜索
    const handleSearch = () => {
      state.pagination.current = 1;
      fetchTrades();
    };

    // 重置搜索条件
    const handleReset = () => {
      state.searchForm.merchant_id = route.query.merchant_id ? parseInt(route.query.merchant_id) : undefined;
      state.searchForm.status = undefined;
      state.searchForm.start_date = undefined;
      state.searchForm.end_date = undefined;
      dateRange.value = null;
      state.pagination.current = 1;
      fetchTrades();
    };

    // 表格变化（排序、筛选、分页）
    const handleTableChange = (pagination, filters, sorter) => {
      state.pagination.current = pagination.current;
      state.pagination.pageSize = pagination.pageSize;
      
      // 处理过滤
      if (filters.status && filters.status.length > 0) {
        state.searchForm.status = filters.status[0];
      }
      
      fetchTrades();
    };

    // 显示交易详情
    const showTradeDetail = (record) => {
      state.currentTrade = record;
      state.detailDrawerVisible = true;
    };

    // 获取状态对应的颜色
    const getStatusColor = (status) => {
      const colors = {
        pending: 'orange',
        processing: 'blue',
        success: 'green',
        failed: 'red',
        closed: 'gray'
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
      showTradeDetail,
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
