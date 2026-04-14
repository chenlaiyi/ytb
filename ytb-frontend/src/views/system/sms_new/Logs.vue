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

      <!-- 统计数据 -->
      <div class="dashboard-stats">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card shadow="hover">
              <div class="stat-item">
                <div class="stat-value">{{ statsData.total }}</div>
                <div class="stat-label">总发送量</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover">
              <div class="stat-item">
                <div class="stat-value">{{ statsData.success }}</div>
                <div class="stat-label">发送成功</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover">
              <div class="stat-item">
                <div class="stat-value">{{ statsData.failed }}</div>
                <div class="stat-label">发送失败</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 搜索筛选 -->
      <div class="filter-container">
        <el-form :inline="true" :model="filters" class="demo-form-inline">
          <el-form-item label="手机号">
            <el-input v-model="filters.phone" placeholder="输入手机号" clearable />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filters.status" placeholder="全部状态" clearable>
              <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="filters.type" placeholder="全部类型" clearable>
              <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
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
        :data="logsList"
        style="width: 100%"
        border
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="content" label="短信内容" min-width="200" show-overflow-tooltip />
        <el-table-column label="类型" width="120">
          <template #default="scope">
            <el-tag size="small">{{ getTypeLabel(scope.row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)" size="small">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发送时间" width="150">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="viewDetails(scope.row)">详情</el-button>
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
    <el-dialog
      v-model="detailDialog.visible"
      title="短信详情"
      width="600px"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="ID">{{ currentLog.id }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentLog.phone }}</el-descriptions-item>
        <el-descriptions-item label="手机号(掩码)">{{ currentLog.phone_masked }}</el-descriptions-item>
        <el-descriptions-item label="短信内容">{{ currentLog.content }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ getTypeLabel(currentLog.type) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentLog.status)">
            {{ getStatusLabel(currentLog.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(currentLog.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="发送时间" v-if="currentLog.sent_at">{{ formatDateTime(currentLog.sent_at) }}</el-descriptions-item>
        <el-descriptions-item label="验证码" v-if="currentLog.code">{{ currentLog.code }}</el-descriptions-item>
        <el-descriptions-item label="请求IP" v-if="currentLog.request_ip">{{ currentLog.request_ip }}</el-descriptions-item>
        <el-descriptions-item label="服务商">{{ currentLog.provider }}</el-descriptions-item>
        <el-descriptions-item label="数据来源">{{ currentLog.source_table }}</el-descriptions-item>
        <el-descriptions-item label="错误信息" v-if="currentLog.error_message">{{ currentLog.error_message }}</el-descriptions-item>

        <!-- 生日祝福短信额外信息 -->
        <template v-if="currentLog.extra_info && currentLog.extra_info.is_birthday_sms">
          <el-descriptions-item label="收件人姓名">{{ currentLog.extra_info.recipient_name }}</el-descriptions-item>
          <el-descriptions-item label="收件人年龄">{{ currentLog.extra_info.recipient_age }}岁</el-descriptions-item>
          <el-descriptions-item label="收件人生日">{{ currentLog.extra_info.recipient_birthday }}</el-descriptions-item>
          <el-descriptions-item label="收件人性别">{{ currentLog.extra_info.recipient_gender }}</el-descriptions-item>
        </template>

        <!-- 验证码短信额外信息 -->
        <template v-if="currentLog.extra_info && currentLog.extra_info.is_verification_code">
          <el-descriptions-item label="状态说明">{{ currentLog.extra_info.status_desc }}</el-descriptions-item>
        </template>

        <el-descriptions-item label="请求数据" v-if="currentLog.request_data">
          <pre>{{ formatJson(currentLog.request_data) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="响应数据" v-if="currentLog.response_data">
          <pre>{{ formatJson(currentLog.response_data) }}</pre>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialog.visible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>


  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import smsApi from '../../../api/smsApi';
import { formatDateTime, formatDate } from '../../../utils/formatters';

export default {
  name: 'SmsLogs',
  setup() {
    // 数据加载状态
    const loading = ref(false);

    // 短信日志列表数据
    const logsList = ref([]);

    // 短信类型列表
    const smsTypes = ref(['login', 'register', 'reset', 'bind', 'verify']);

    // 分页信息
    const pagination = reactive({
      page: 1,
      limit: 20,
      total: 0
    });

    // 搜索筛选
    const filters = reactive({
      phone: '',
      status: '',
      type: '',
      dateRange: null
    });

    // 状态选项
    const statusOptions = [
      { value: 'all', label: '全部' },
      { value: 'success', label: '发送成功' },
      { value: 'failed', label: '发送失败' },
      { value: 'used', label: '已使用' }
    ];

    // 短信类型选项
    const typeOptions = [
      { value: 'all', label: '全部' },
      { value: 'verification', label: '验证码' },
      { value: 'birthday', label: '生日祝福' },
      { value: 'login', label: '登录验证' },
      { value: 'register', label: '注册验证' },
      { value: 'reset', label: '重置密码' },
      { value: 'bind', label: '绑定手机' },
      { value: 'verify', label: '身份验证' },
      { value: 'withdraw_reject', label: '提现驳回' },
      { value: 'notification', label: '通知短信' },
      { value: 'marketing', label: '营销短信' }
    ];

    // 统计数据
    const statsData = reactive({
      total: 0,
      success: 0,
      failed: 0
    });

    // 详情对话框
    const detailDialog = reactive({
      visible: false
    });

    // 当前查看的日志
    const currentLog = reactive({
      id: null,
      phone: '',
      content: '',
      type: '',
      status: '',
      created_at: '',
      request_ip: '',
      provider: '',
      request_data: '',
      response_data: ''
    });

    // 获取短信日志列表
    const getSmsLogs = async () => {
      loading.value = true;
      try {
        // 尝试使用API获取数据
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          phone: filters.phone || undefined,
          status: filters.status || undefined,
          type: filters.type || undefined
        };

        // 添加日期范围
        if (filters.dateRange && filters.dateRange.length === 2) {
          params.start_date = filters.dateRange[0];
          params.end_date = filters.dateRange[1];
        }

        const response = await smsApi.getSmsLogs(params);
        console.log('短信日志API响应:', response);

        if (response && (response.code === 0 || response.code === 200)) {
          // 处理数据
          if (response.data && response.data.list) {
            // 新格式：{code: 200, data: {list: [], total: 0}}
            logsList.value = response.data.list || [];
            pagination.total = response.data.total || 0;
          } else {
            // 旧格式：{code: 0, data: [], total: 0}
            logsList.value = response.data || [];
            pagination.total = response.total || 0;
          }
        } else {
          // API调用失败，显示错误信息
          console.error('获取短信日志失败:', response?.message || '未知错误');
          ElMessage.error('获取短信日志失败: ' + (response?.message || '未知错误'));
          logsList.value = [];
          pagination.total = 0;
        }
      } catch (error) {
        console.error('获取短信日志失败:', error);
        if (error.response) {
          console.error('错误状态码:', error.response.status);
          console.error('错误响应:', error.response.data);
        }
        ElMessage.error('获取短信日志失败，请检查网络和API配置');
        logsList.value = [];
        pagination.total = 0;
      } finally {
        loading.value = false;
      }
    };

    // 获取短信统计数据
    const getSmsStats = async () => {
      try {
        const response = await smsApi.getSmsStats();
        console.log('短信统计API响应:', response);
        
        if (response && response.code === 0) {
          statsData.total = response.data.total || 0;
          statsData.success = response.data.success || 0;
          statsData.failed = response.data.failed || 0;
        }
      } catch (error) {
        console.error('获取短信统计数据失败:', error);
      }
    };

    // 清空数据方法
    const clearData = () => {
      logsList.value = [];
      statsData.total = 0;
      statsData.success = 0;
      statsData.failed = 0;
      pagination.total = 0;
    };

    // 查看详情
    const viewDetails = (row) => {
      Object.assign(currentLog, row);
      detailDialog.visible = true;
    };

    // 导出数据
    const exportData = () => {
      ElMessage.info('导出功能开发中...');
    };

    // 处理搜索
    const handleSearch = () => {
      pagination.page = 1;
      getSmsLogs();
    };

    // 重置筛选条件
    const resetFilters = () => {
      filters.phone = '';
      filters.status = '';
      filters.type = '';
      filters.dateRange = null;
      pagination.page = 1;
      getSmsLogs();
    };

    // 处理每页显示数量变化
    const handleSizeChange = (val) => {
      pagination.limit = val;
      getSmsLogs();
    };

    // 处理页码变化
    const handleCurrentChange = (val) => {
      pagination.page = val;
      getSmsLogs();
    };

    // 转到统计页面
    const goToStatistics = () => {
      ElMessage.info('跳转到统计页面');
    };

    // 转到验证码页面
    const goToCodes = () => {
      ElMessage.info('跳转到验证码页面');
    };

    // 格式化JSON字符串
    const formatJson = (jsonStr) => {
      try {
        const obj = JSON.parse(jsonStr);
        return JSON.stringify(obj, null, 2);
      } catch (e) {
        return jsonStr;
      }
    };
    // 获取状态类型（用于标签颜色）
    const getStatusType = (status) => {
      const typeMap = {
        'success': 'success',
        'failed': 'danger',
        'used': 'warning'
      };
      return typeMap[status] || 'info';
    };

    // 获取类型标签
    const getTypeLabel = (type) => {
      const typeMap = {
        'verification': '验证码',
        'birthday': '生日祝福',
        'login': '登录验证',
        'register': '注册验证',
        'reset': '重置密码',
        'bind': '绑定手机',
        'verify': '身份验证',
        'withdraw_reject': '提现驳回',
        'notification': '通知短信',
        'marketing': '营销短信'
      };
      return typeMap[type] || type;
    };

    // 获取状态标签
    const getStatusLabel = (status) => {
      const statusMap = {
        'success': '发送成功',
        'failed': '发送失败',
        'used': '已使用'
      };
      return statusMap[status] || status;
    };

    // 页面加载时获取数据
    onMounted(() => {
      getSmsLogs().then(() => {
        // 日志数据获取完成
      }).catch(err => {
        console.error('日志数据获取失败:', err);
      });

      getSmsStats().then(() => {
        // 统计数据获取完成
      }).catch(err => {
        console.error('统计数据获取失败:', err);
      });
    });

    return {
      loading,
      logsList,
      smsTypes,
      pagination,
      filters,
      statusOptions,
      typeOptions,
      detailDialog,
      currentLog,
      statsData,
      formatDateTime,
      formatDate,
      formatJson,
      getStatusType,
      getTypeLabel,
      getStatusLabel,
      getSmsLogs,
      viewDetails,
      exportData,
      handleSearch,
      resetFilters,
      handleSizeChange,
      handleCurrentChange,
      goToStatistics,
      goToCodes
    };
  }
};
</script>

<style lang="scss" scoped>
.sms-logs-page {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .filter-container {
    margin-bottom: 20px;
  }

  .dashboard-stats {
    margin-bottom: 20px;

    .el-card {
      margin-bottom: 0;
    }

    .stat-item {
      text-align: center;
      padding: 15px 0;

      .stat-value {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 5px;
      }

      .stat-label {
        color: #666;
      }
    }
  }
}
</style>
