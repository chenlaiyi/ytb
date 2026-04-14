<template>
  <div class="sms-logs-page">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>短信日志管理</span>
          <div class="header-buttons">
            <el-button type="primary" @click="exportData">导出数据</el-button>
          </div>
        </div>
      </template>

      <!-- 搜索筛选 -->
      <div class="filter-container">
        <el-form :inline="true" :model="filters" class="demo-form-inline">
          <el-form-item label="搜索">
            <el-input v-model="filters.keyword" placeholder="手机号/内容" clearable />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filters.status" placeholder="全部状态" clearable>
              <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="发送日期">
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              clearable
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 数据表格 -->
      <el-table
        v-loading="loading"
        :data="smsList"
        style="width: 100%"
        border
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="content" label="短信内容" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'success' ? 'success' : 'danger'">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="发送时间" width="160" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="viewDetail(scope.row)">查看</el-button>
            <el-button type="danger" link @click="resendSms(scope.row)" v-if="scope.row.status === 'failed'">重发</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailDialog.visible" title="短信详情" width="600px">
      <div v-loading="detailDialog.loading">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="ID">{{ detailDialog.data.id }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ detailDialog.data.phone }}</el-descriptions-item>
          <el-descriptions-item label="短信内容">{{ detailDialog.data.content }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="detailDialog.data.status === 'success' ? 'success' : 'danger'">
              {{ getStatusLabel(detailDialog.data.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发送时间">{{ detailDialog.data.created_at }}</el-descriptions-item>
          <el-descriptions-item label="错误信息" v-if="detailDialog.data.error_message">
            {{ detailDialog.data.error_message }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailDialog.visible = false">关闭</el-button>
          <el-button type="primary" @click="resendSms(detailDialog.data)" v-if="detailDialog.data.status === 'failed'">
            重发短信
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { get } from '@/utils/request';

export default {
  name: 'SmsLogs',
  setup() {
    // 加载状态
    const loading = ref(false);
    
    // 短信列表
    const smsList = ref([]);
    
    // 筛选条件
    const filters = reactive({
      keyword: '',
      status: '',
      dateRange: null
    });
    
    // 状态选项
    const statusOptions = [
      { value: 'success', label: '发送成功' },
      { value: 'failed', label: '发送失败' }
    ];
    
    // 分页
    const pagination = reactive({
      page: 1,
      limit: 10,
      total: 0
    });
    
    // 详情对话框
    const detailDialog = reactive({
      visible: false,
      loading: false,
      data: {}
    });
    
    // 获取短信列表
    const getSmsList = async () => {
      loading.value = true;
      try {
        // 构建查询参数
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          keyword: filters.keyword,
          status: filters.status
        };
        
        // 添加日期范围
        if (filters.dateRange && filters.dateRange.length === 2) {
          params.start_date = filters.dateRange[0];
          params.end_date = filters.dateRange[1];
        }
        
        // 模拟API调用
        // const response = await get('/system/api/sms/logs', params);
        
        // 模拟数据
        const mockData = {
          code: 0,
          message: 'success',
          data: {
            list: [
              {
                id: 1,
                phone: '13800138000',
                content: '您的验证码是123456，有效期5分钟，请勿泄露。',
                status: 'success',
                created_at: '2025-04-01 10:00:00'
              },
              {
                id: 2,
                phone: '13900139000',
                content: '您的验证码是654321，有效期5分钟，请勿泄露。',
                status: 'success',
                created_at: '2025-04-01 11:00:00'
              },
              {
                id: 3,
                phone: '13700137000',
                content: '您的验证码是111222，有效期5分钟，请勿泄露。',
                status: 'failed',
                created_at: '2025-04-01 12:00:00',
                error_message: '手机号不存在或已停机'
              }
            ],
            total: 3
          }
        };
        
        // 更新数据
        smsList.value = mockData.data.list;
        pagination.total = mockData.data.total;
      } catch (error) {
        console.error('获取短信列表失败:', error);
        ElMessage.error('获取短信列表失败，请重试');
      } finally {
        loading.value = false;
      }
    };
    
    // 查看详情
    const viewDetail = (row) => {
      detailDialog.data = { ...row };
      detailDialog.visible = true;
    };
    
    // 重发短信
    const resendSms = (row) => {
      ElMessageBox.confirm(`确定要重新发送短信到 ${row.phone} 吗?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          // 模拟API调用
          // await post('/system/api/sms/resend', { id: row.id });
          
          ElMessage.success('短信已重新发送');
          getSmsList(); // 刷新列表
        } catch (error) {
          console.error('重发短信失败:', error);
          ElMessage.error('重发短信失败，请重试');
        }
      }).catch(() => {});
    };
    
    // 导出数据
    const exportData = () => {
      ElMessage.info('导出功能开发中...');
    };
    
    // 处理搜索
    const handleSearch = () => {
      pagination.page = 1;
      getSmsList();
    };
    
    // 重置筛选条件
    const resetFilters = () => {
      filters.keyword = '';
      filters.status = '';
      filters.dateRange = null;
      pagination.page = 1;
      getSmsList();
    };
    
    // 处理每页显示数量变化
    const handleSizeChange = (val) => {
      pagination.limit = val;
      getSmsList();
    };
    
    // 处理页码变化
    const handleCurrentChange = (val) => {
      pagination.page = val;
      getSmsList();
    };
    
    // 获取状态标签
    const getStatusLabel = (status) => {
      const statusMap = {
        'success': '发送成功',
        'failed': '发送失败'
      };
      return statusMap[status] || status;
    };
    
    // 组件挂载时获取数据
    onMounted(() => {
      getSmsList();
    });
    
    return {
      loading,
      smsList,
      filters,
      statusOptions,
      pagination,
      detailDialog,
      getSmsList,
      viewDetail,
      resendSms,
      exportData,
      handleSearch,
      resetFilters,
      handleSizeChange,
      handleCurrentChange,
      getStatusLabel
    };
  }
};
</script>

<style scoped>
.sms-logs-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-container {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
