<template>
  <div class="tea-stock-records-container">
    <div class="page-header">
      <h1 class="page-title">库存记录</h1>
      <div class="header-actions">
        <el-button @click="refreshData" :icon="Refresh">
          刷新
        </el-button>
        <el-button type="success" @click="exportData" :icon="Download">
          导出
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
          <el-input v-model="queryParams.product_name" placeholder="请输入茶品名称" clearable />
        </el-form-item>
        <el-form-item label="茶农名称:">
          <el-input v-model="queryParams.farmer_name" placeholder="请输入茶农名称" clearable />
        </el-form-item>
        <el-form-item label="操作类型:">
          <el-select v-model="queryParams.operation" placeholder="请选择操作类型" clearable>
            <el-option label="全部" value="" />
            <el-option label="增加" value="increase" />
            <el-option label="减少" value="decrease" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作时间:">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
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
        :data="stockRecordsList"
        stripe
        style="width: 100%"
        :header-cell-style="{backgroundColor: '#f5f7fa', color: '#606266'}"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="operation_time" label="操作时间" width="160" />
        <el-table-column prop="product_name" label="茶品名称" width="120" />
        <el-table-column prop="farmer_name" label="茶农" width="120" />
        <el-table-column prop="operation" label="操作类型" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.operation === 'increase' ? 'success' : 'danger'">
              {{ scope.row.operation === 'increase' ? '增加' : '减少' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量(斤)" width="100" />
        <el-table-column prop="reason" label="原因" min-width="180" show-overflow-tooltip />
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="handleDetail(scope.row)" :icon="View">查看</el-button>
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

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="库存记录详情"
      width="600px"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="记录ID">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item label="茶品名称">{{ detailData.product_name }}</el-descriptions-item>
        <el-descriptions-item label="茶农">{{ detailData.farmer_name }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ detailData.operation_time }}</el-descriptions-item>
        <el-descriptions-item label="操作类型">
          <el-tag :type="detailData.operation === 'increase' ? 'success' : 'danger'">
            {{ detailData.operation === 'increase' ? '增加' : '减少' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="数量">{{ detailData.quantity }} 斤</el-descriptions-item>
        <el-descriptions-item label="操作前库存">{{ detailData.before_stock }} 斤</el-descriptions-item>
        <el-descriptions-item label="操作后库存">{{ detailData.after_stock }} 斤</el-descriptions-item>
        <el-descriptions-item label="操作原因">{{ detailData.reason }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ detailData.operator }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ detailData.remark || '无' }}</el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh, Search, RefreshRight, View, Download } from '@element-plus/icons-vue';
import { useRouter, useRoute } from 'vue-router';
import { fetchStockRecords, getStockRecord, exportStockRecords } from '@/api/teaStockRecord';

// 路由相关
const router = useRouter();
const route = useRoute();

// 标签页相关
const activeTab = ref('tea-stock-records');

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

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 10,
  product_name: '',
  farmer_name: '',
  operation: '',
  start_date: '',
  end_date: ''
});

// 日期范围选择
const dateRange = ref([]);

// 监听日期范围变化
watch(dateRange, (newValue) => {
  if (newValue) {
    queryParams.start_date = newValue[0] || '';
    queryParams.end_date = newValue[1] || '';
  } else {
    queryParams.start_date = '';
    queryParams.end_date = '';
  }
}, { deep: true });

// 表格数据
const stockRecordsList = ref([]);
const total = ref(0);

// 详情对话框
const detailVisible = ref(false);
const detailData = ref({});

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const response = await fetchStockRecords({
      page: queryParams.page,
      limit: queryParams.limit,
      product_name: queryParams.product_name,
      farmer_name: queryParams.farmer_name,
      operation: queryParams.operation,
      date_start: queryParams.start_date,
      date_end: queryParams.end_date
    });

    if (response.code === 0) {
      stockRecordsList.value = response.data.data || [];
      total.value = response.data.total || 0;
    } else {
      ElMessage.error(response.message || '加载库存记录失败');
    }
  } catch (error) {
    console.error('加载库存记录失败:', error);
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
  queryParams.product_name = '';
  queryParams.farmer_name = '';
  queryParams.operation = '';
  queryParams.start_date = '';
  queryParams.end_date = '';
  dateRange.value = [];
  handleSearch();
};

// 刷新数据
const refreshData = () => {
  loadData();
};

// 导出数据
const exportData = () => {
  const params = {
    product_name: queryParams.product_name,
    farmer_name: queryParams.farmer_name,
    operation: queryParams.operation,
    date_start: queryParams.start_date,
    date_end: queryParams.end_date
  };
  exportStockRecords(params)
    .then((res) => {
      const blob = new Blob([res], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tea-stock-records-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    })
    .catch((error) => {
      console.error('导出失败:', error);
      ElMessage.error('导出失败');
    });
};

// 查看详情
const handleDetail = async (row) => {
  try {
    const response = await getStockRecord(row.id);
    if (response.code === 0) {
      detailData.value = response.data;
      detailVisible.value = true;
    } else {
      ElMessage.error(response.message || '获取详情失败');
    }
  } catch (error) {
    console.error('获取库存详情失败:', error);
    ElMessage.error('获取详情失败');
  }
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

// 页面加载时获取数据
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.tea-stock-records-container {
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
</style>
