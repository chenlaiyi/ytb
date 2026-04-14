<template>
  <div class="withdrawal-audit">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>盛付通提现审核管理</span>
          <el-button
            type="success"
            @click="refreshData"
            :loading="loading"
            size="small"
          >
            刷新数据
          </el-button>
        </div>
      </template>

      <!-- 统计卡片 -->
      <div class="statistics-cards">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="stat-card pending">
              <div class="stat-content">
                <div class="stat-value">¥{{ statistics.pending_amount }}</div>
                <div class="stat-label">待审核金额</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card paid">
              <div class="stat-content">
                <div class="stat-value">¥{{ statistics.paid_amount }}</div>
                <div class="stat-label">已支付金额</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card rejected">
              <div class="stat-content">
                <div class="stat-value">¥{{ statistics.rejected_amount }}</div>
                <div class="stat-label">已驳回金额</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card balance">
              <div class="stat-content">
                <div class="stat-value">¥{{ statistics.alipay_balance }}</div>
                <div class="stat-label">支付宝余额</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 搜索区域 -->
      <div class="filter-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索机构名称或ID"
          class="filter-item"
          style="width: 200px;"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="statusFilter"
          placeholder="状态筛选"
          class="filter-item"
          style="width: 120px;"
          @change="handleSearch"
        >
          <el-option label="全部" value="" />
          <el-option label="审核中" value="3" />
          <el-option label="已通过" value="1" />
          <el-option label="已驳回" value="2" />
        </el-select>
        <el-date-picker
          v-model="dateFilter"
          type="date"
          placeholder="选择日期"
          class="filter-item"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="handleSearch"
        />
        <el-button
          class="filter-item"
          type="primary"
          @click="handleSearch"
        >
          搜索
        </el-button>
        <el-button
          class="filter-item"
          @click="resetSearch"
        >
          重置
        </el-button>
      </div>

      <!-- 提现列表 -->
      <el-table
        v-loading="loading"
        :data="withdrawalList"
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <el-table-column
          prop="withdrawal_id"
          label="提现ID"
          width="120"
          fixed="left"
        />
        <el-table-column
          prop="institution_name"
          label="机构名称"
          width="200"
          show-overflow-tooltip
        />
        <el-table-column
          prop="institution_id"
          label="机构ID"
          width="100"
        />
        <el-table-column
          prop="withdrawal_amount"
          label="提现金额"
          width="120"
          sortable="custom"
        >
          <template #default="scope">
            <span class="amount">¥{{ scope.row.withdrawal_amount }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="arrival_amount"
          label="到账金额"
          width="120"
        >
          <template #default="scope">
            <span class="amount">¥{{ scope.row.arrival_amount }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="withdrawal_time"
          label="申请时间"
          width="160"
          sortable="custom"
        />
        <el-table-column
          prop="status"
          label="状态"
          width="100"
        >
          <template #default="scope">
            <el-tag
              :type="getStatusType(scope.row.status)"
              size="small"
            >
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="alipay_openid"
          label="支付宝账户"
          width="120"
        >
          <template #default="scope">
            <el-tag
              :type="scope.row.alipay_openid ? 'success' : 'danger'"
              size="small"
            >
              {{ scope.row.alipay_openid ? '已绑定' : '未绑定' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="order_id"
          label="支付宝订单号"
          width="150"
          show-overflow-tooltip
        />
        <el-table-column
          label="操作"
          width="200"
          fixed="right"
        >
          <template #default="scope">
            <el-button
              v-if="scope.row.status === '3'"
              type="success"
              size="small"
              @click="handleAudit(scope.row, 1)"
              :disabled="!scope.row.alipay_openid"
            >
              通过
            </el-button>
            <el-button
              v-if="scope.row.status === '3'"
              type="danger"
              size="small"
              @click="handleAudit(scope.row, 2)"
            >
              驳回
            </el-button>
            <el-button
              type="info"
              size="small"
              @click="showWithdrawalDetail(scope.row)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 审核对话框 -->
    <el-dialog
      v-model="auditDialogVisible"
      :title="auditType === 1 ? '审核通过' : '审核驳回'"
      width="400px"
    >
      <el-form :model="auditForm" label-width="100px">
        <el-form-item label="提现ID:">
          <span>{{ currentWithdrawal.withdrawal_id }}</span>
        </el-form-item>
        <el-form-item label="机构名称:">
          <span>{{ currentWithdrawal.institution_name }}</span>
        </el-form-item>
        <el-form-item label="提现金额:">
          <span class="amount">¥{{ currentWithdrawal.withdrawal_amount }}</span>
        </el-form-item>
        <el-form-item label="管理密码:" required>
          <el-input
            v-model="auditForm.password"
            type="password"
            placeholder="请输入管理密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="auditDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="confirmAudit"
            :loading="auditLoading"
          >
            确认{{ auditType === 1 ? '通过' : '驳回' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="提现详情"
      width="600px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="提现ID">
          {{ currentWithdrawal.withdrawal_id }}
        </el-descriptions-item>
        <el-descriptions-item label="机构ID">
          {{ currentWithdrawal.institution_id }}
        </el-descriptions-item>
        <el-descriptions-item label="机构名称">
          {{ currentWithdrawal.institution_name }}
        </el-descriptions-item>
        <el-descriptions-item label="提现金额">
          <span class="amount">¥{{ currentWithdrawal.withdrawal_amount }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="到账金额">
          <span class="amount">¥{{ currentWithdrawal.arrival_amount }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentWithdrawal.status)">
            {{ getStatusText(currentWithdrawal.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="申请时间">
          {{ currentWithdrawal.withdrawal_time }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">
          {{ currentWithdrawal.update_time }}
        </el-descriptions-item>
        <el-descriptions-item label="支付宝账户">
          <el-tag :type="currentWithdrawal.alipay_openid ? 'success' : 'danger'">
            {{ currentWithdrawal.alipay_openid ? '已绑定' : '未绑定' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="支付宝订单号" v-if="currentWithdrawal.order_id">
          {{ currentWithdrawal.order_id }}
        </el-descriptions-item>
        <el-descriptions-item label="支付宝流水号" v-if="currentWithdrawal.pay_fund_order_id">
          {{ currentWithdrawal.pay_fund_order_id }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script>
import { getWithdrawals, auditWithdrawal, getStatistics, checkNewWithdrawals } from '@/api/withdrawal-audit'

export default {
  name: 'FinanceShengfutong',
  data() {
    return {
      loading: false,
      auditLoading: false,
      withdrawalList: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      searchQuery: '',
      statusFilter: '',
      dateFilter: '',
      statistics: {
        pending_amount: '0.00',
        paid_amount: '0.00',
        rejected_amount: '0.00',
        alipay_balance: '0.00'
      },
      auditDialogVisible: false,
      detailDialogVisible: false,
      auditType: 1, // 1: 通过, 2: 驳回
      currentWithdrawal: {},
      auditForm: {
        password: ''
      },
      autoRefreshTimer: null
    }
  },
  mounted() {
    this.fetchData()
    this.fetchStatistics()
    this.startAutoRefresh()
  },
  beforeUnmount() {
    this.stopAutoRefresh()
  },
  methods: {
    async fetchData() {
      this.loading = true
      try {
        const params = {
          page: this.currentPage,
          limit: this.pageSize,
          search: this.searchQuery,
          status: this.statusFilter,
          date: this.dateFilter
        }
        
        console.log('发送请求参数:', params)
        const response = await getWithdrawals(params)
        console.log('API响应:', response)
        
        if (response.code === 20000) {
          this.withdrawalList = response.data.items || []
          this.total = response.data.total || 0
          console.log('数据更新成功:', this.withdrawalList.length, '条记录')
        } else {
          console.error('API返回错误:', response)
          this.$message.error(response.message || '获取数据失败')
        }
      } catch (error) {
        console.error('请求异常:', error)
        this.$message.error('获取数据失败: ' + error.message)
      } finally {
        this.loading = false
      }
    },
    
    async fetchStatistics() {
      try {
        console.log('获取统计数据...')
        const response = await getStatistics()
        console.log('统计数据响应:', response)
        
        if (response.code === 20000) {
          this.statistics = response.data
          console.log('统计数据更新成功:', this.statistics)
        } else {
          console.error('统计数据API返回错误:', response)
          this.$message.error(response.message || '获取统计数据失败')
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
        this.$message.error('获取统计数据失败: ' + error.message)
      }
    },
    
    handleSearch() {
      this.currentPage = 1
      this.fetchData()
    },
    
    resetSearch() {
      this.searchQuery = ''
      this.statusFilter = ''
      this.dateFilter = ''
      this.currentPage = 1
      this.fetchData()
    },
    
    refreshData() {
      this.fetchData()
      this.fetchStatistics()
    },
    
    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1
      this.fetchData()
    },
    
    handleCurrentChange(val) {
      this.currentPage = val
      this.fetchData()
    },
    
    handleSortChange({ column, prop, order }) {
      // 处理排序逻辑
      this.fetchData()
    },
    
    handleAudit(row, type) {
      this.currentWithdrawal = row
      this.auditType = type
      this.auditForm.password = ''
      this.auditDialogVisible = true
    },
    
    async confirmAudit() {
      if (!this.auditForm.password) {
        this.$message.error('请输入管理密码')
        return
      }
      
      this.auditLoading = true
      try {
        const data = {
          withdrawal_id: this.currentWithdrawal.withdrawal_id,
          status: this.auditType,
          password: this.auditForm.password
        }
        
        const response = await auditWithdrawal(data)
        if (response.code === 20000) {
          this.$message.success('审核操作成功')
          this.auditDialogVisible = false
          this.fetchData()
          this.fetchStatistics()
        } else {
          this.$message.error(response.message || '审核失败')
        }
      } catch (error) {
        this.$message.error('审核失败: ' + error.message)
      } finally {
        this.auditLoading = false
      }
    },
    
    showWithdrawalDetail(row) {
      this.currentWithdrawal = row
      this.detailDialogVisible = true
    },
    
    getStatusType(status) {
      const statusMap = {
        '1': 'success',
        '2': 'danger',
        '3': 'warning'
      }
      return statusMap[status] || 'info'
    },
    
    getStatusText(status) {
      const statusMap = {
        '1': '已通过',
        '2': '已驳回',
        '3': '审核中'
      }
      return statusMap[status] || '未知'
    },
    
    startAutoRefresh() {
      // 每30秒检查一次新订单
      this.autoRefreshTimer = setInterval(() => {
        this.checkNewOrders()
      }, 30000)
    },
    
    stopAutoRefresh() {
      if (this.autoRefreshTimer) {
        clearInterval(this.autoRefreshTimer)
        this.autoRefreshTimer = null
      }
    },
    
    async checkNewOrders() {
      try {
        const response = await checkNewWithdrawals()
        if (response.code === 20000 && response.data.count > 0) {
          // 有新订单时刷新数据
          this.fetchData()
          this.fetchStatistics()
        }
      } catch (error) {
        console.error('检查新订单失败:', error)
      }
    }
  }
}
</script>

<style scoped>
.withdrawal-audit {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.statistics-cards {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  padding: 10px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.stat-card.pending .stat-value {
  color: #e6a23c;
}

.stat-card.paid .stat-value {
  color: #67c23a;
}

.stat-card.rejected .stat-value {
  color: #f56c6c;
}

.stat-card.balance .stat-value {
  color: #409eff;
}

.filter-container {
  margin-bottom: 20px;
}

.filter-item {
  margin-right: 10px;
  margin-bottom: 10px;
}

.amount {
  font-weight: bold;
  color: #e6a23c;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.dialog-footer {
  text-align: right;
}

:deep(.el-table .cell) {
  word-break: break-all;
}
</style> 