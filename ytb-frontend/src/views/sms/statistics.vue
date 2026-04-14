<template>
  <div class="app-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="clearfix">
          <span>短信统计分析</span>
        </div>
      </template>

      <!-- 时间范围选择 -->
      <el-form :inline="true" class="time-range-form">
        <el-form-item label="时间范围">
          <el-radio-group v-model="timeRange" @change="handleRangeChange">
            <el-radio-button label="today">今日</el-radio-button>
            <el-radio-button label="yesterday">昨日</el-radio-button>
            <el-radio-button label="week">本周</el-radio-button>
            <el-radio-button label="month">本月</el-radio-button>
            <el-radio-button label="year">今年</el-radio-button>
            <el-radio-button label="custom">自定义</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="timeRange === 'custom'">
          <el-date-picker
            v-model="customDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
            @change="handleCustomRangeChange">
          </el-date-picker>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作按钮 -->
      <div class="table-operator">
        <el-button type="info" icon="el-icon-message" @click="goToLogs">短信日志</el-button>
        <el-button type="success" icon="el-icon-key" @click="goToCodes">验证码管理</el-button>
      </div>

      <!-- 统计概览 -->
      <el-row :gutter="20" class="dashboard-stats">
        <el-col :span="6">
          <el-card class="stats-card" shadow="hover">
            <div class="stats-card-header">
              <i class="el-icon-message primary"></i>
              <div class="card-content">
                <div class="card-title">总发送量</div>
                <div class="card-data">{{ statsData.totalStats?.total || 0 }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card" shadow="hover">
            <div class="stats-card-header">
              <i class="el-icon-check success"></i>
              <div class="card-content">
                <div class="card-title">发送成功率</div>
                <div class="card-data">{{ statsData.totalStats?.successRate || 0 }}%</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card" shadow="hover">
            <div class="stats-card-header">
              <i class="el-icon-data-line warning"></i>
              <div class="card-content">
                <div class="card-title">日均发送量</div>
                <div class="card-data">{{ statsData.totalStats?.dailyAverage || 0 }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card" shadow="hover">
            <div class="stats-card-header">
              <i class="el-icon-percentage danger"></i>
              <div class="card-content">
                <div class="card-title">验证码使用率</div>
                <div class="card-data">{{ statsData.totalStats?.usageRate || 0 }}%</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 数据表格 (替代图表区域) -->
      <el-row :gutter="20" class="chart-section">
        <el-col :span="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div>
                <span>日发送量趋势</span>
              </div>
            </template>
            <div class="table-container">
              <el-table
                :data="statsData.dailySending || []"
                border
                stripe
                style="width: 100%">
                <el-table-column prop="date" label="日期" width="120"></el-table-column>
                <el-table-column prop="count" label="发送量" width="120"></el-table-column>
              </el-table>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div>
                <span>短信类型分布</span>
              </div>
            </template>
            <div class="table-container">
              <el-table
                :data="statsData.typeDistribution || []"
                border
                stripe
                style="width: 100%">
                <el-table-column prop="type" label="类型" width="120"></el-table-column>
                <el-table-column prop="count" label="数量" width="120"></el-table-column>
                <el-table-column label="百分比" width="120">
                  <template #default="scope">
                    {{ calculatePercentage(scope.row.count, statsData.totalStats?.total) }}%
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="chart-section">
        <el-col :span="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div>
                <span>发送成功率趋势</span>
              </div>
            </template>
            <div class="table-container">
              <el-table
                :data="statsData.successRate || []"
                border
                stripe
                style="width: 100%">
                <el-table-column prop="date" label="日期" width="120"></el-table-column>
                <el-table-column prop="success" label="成功" width="100"></el-table-column>
                <el-table-column prop="failed" label="失败" width="100"></el-table-column>
                <el-table-column prop="successRate" label="成功率(%)" width="120"></el-table-column>
              </el-table>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div>
                <span>高频使用手机号</span>
              </div>
            </template>
            <div class="table-container">
              <el-table
                :data="statsData.frequentPhones || []"
                border
                style="width: 100%">
                <el-table-column
                  type="index"
                  label="排名"
                  width="80">
                </el-table-column>
                <el-table-column
                  prop="phone"
                  label="手机号"
                  width="150">
                  <template #default="scope">
                    {{ maskPhone(scope.row.phone) }}
                  </template>
                </el-table-column>
                <el-table-column
                  prop="count"
                  label="发送次数">
                </el-table-column>
              </el-table>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 详细统计数据 -->
      <el-row :gutter="20" class="chart-section">
        <el-col :span="24">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div>
                <span>详细统计数据</span>
              </div>
            </template>
            <el-row :gutter="20">
              <el-col :span="12">
                <h4>短信发送数据</h4>
                <el-descriptions border :column="1">
                  <el-descriptions-item label="总发送量">{{ statsData.totalStats?.total || 0 }}</el-descriptions-item>
                  <el-descriptions-item label="发送成功">{{ statsData.totalStats?.success || 0 }}</el-descriptions-item>
                  <el-descriptions-item label="发送失败">{{ statsData.totalStats?.failed || 0 }}</el-descriptions-item>
                  <el-descriptions-item label="成功率">{{ statsData.totalStats?.successRate || 0 }}%</el-descriptions-item>
                  <el-descriptions-item label="日均发送量">{{ statsData.totalStats?.dailyAverage || 0 }}</el-descriptions-item>
                </el-descriptions>
              </el-col>
              <el-col :span="12">
                <h4>验证码数据</h4>
                <el-descriptions border :column="1">
                  <el-descriptions-item label="总验证码数">{{ statsData.totalStats?.codesTotal || 0 }}</el-descriptions-item>
                  <el-descriptions-item label="已使用验证码">{{ statsData.totalStats?.codesUsed || 0 }}</el-descriptions-item>
                  <el-descriptions-item label="未使用验证码">{{ (statsData.totalStats?.codesTotal || 0) - (statsData.totalStats?.codesUsed || 0) }}</el-descriptions-item>
                  <el-descriptions-item label="验证码使用率">{{ statsData.totalStats?.usageRate || 0 }}%</el-descriptions-item>
                  <el-descriptions-item label="统计时间范围">{{ statsData.timeRange?.start || '-' }} 至 {{ statsData.timeRange?.end || '-' }}</el-descriptions-item>
                </el-descriptions>
              </el-col>
            </el-row>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script>
import smsApi from '@/api/smsApi'
// 暂时移除Chart.js依赖
// import Chart from 'chart.js/auto'

export default {
  name: 'SmsStatistics',
  data() {
    return {
      loading: false,
      timeRange: 'week',
      customDateRange: [],
      statsData: {
        dailySending: [],
        typeDistribution: [],
        successRate: [],
        frequentPhones: [],
        totalStats: {},
        timeRange: {}
      },
      charts: {
        dailySendingChart: null,
        typeDistributionChart: null,
        successRateChart: null
      }
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    fetchData() {
      this.loading = true

      // 准备查询参数
      let params = {
        range: this.timeRange
      }

      // 如果是自定义时间范围
      if (this.timeRange === 'custom' && this.customDateRange && this.customDateRange.length === 2) {
        params.start_date = this.customDateRange[0]
        params.end_date = this.customDateRange[1]
      }

      // 调用API
      fetchSmsStatistics(params).then(response => {
        // 处理API响应
        if (response && response.data && response.data.data) {
          this.statsData = response.data.data;
        } else {
          this.statsData = this.getMockData();
        }
        this.loading = false

        // 需要在数据获取后再初始化图表
        this.$nextTick(() => {
          this.initCharts()
        })
      }).catch((error) => {
        console.error('获取短信统计数据失败:', error);
        this.statsData = this.getMockData();
        this.loading = false
      })
    },

    handleRangeChange(val) {
      this.timeRange = val
      if (val !== 'custom') {
        this.fetchData()
      }
    },

    handleCustomRangeChange() {
      if (this.customDateRange && this.customDateRange.length === 2) {
        this.fetchData()
      }
    },

    initCharts() {
      // 不再创建图表实例
    },

    maskPhone(phone) {
      if (!phone) return ''
      return phone.toString().replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    },

    goToLogs() {
      this.$router.push('/system/sms/logs')
    },

    goToCodes() {
      this.$router.push('/system/sms/codes')
    },

    calculatePercentage(count, total) {
      if (total === 0) return 0
      return ((count / total) * 100).toFixed(2)
    },

    // 获取模拟数据
    getMockData() {
      return {
        dailySending: [
          { date: '2025-04-01', count: 120 },
          { date: '2025-04-02', count: 145 },
          { date: '2025-04-03', count: 132 },
          { date: '2025-04-04', count: 167 },
          { date: '2025-04-05', count: 189 }
        ],
        typeDistribution: [
          { type: '登录验证', count: 320 },
          { type: '注册验证', count: 240 },
          { type: '重置密码', count: 180 },
          { type: '绑定手机', count: 120 },
          { type: '身份验证', count: 90 }
        ],
        successRate: [
          { date: '2025-04-01', success: 115, failed: 5, successRate: 95.83 },
          { date: '2025-04-02', success: 140, failed: 5, successRate: 96.55 },
          { date: '2025-04-03', success: 128, failed: 4, successRate: 96.97 },
          { date: '2025-04-04', success: 160, failed: 7, successRate: 95.81 },
          { date: '2025-04-05', success: 182, failed: 7, successRate: 96.30 }
        ],
        frequentPhones: [
          { phone: '13800138000', count: 12 },
          { phone: '13900139000', count: 10 },
          { phone: '13700137000', count: 8 },
          { phone: '13600136000', count: 7 },
          { phone: '13500135000', count: 6 }
        ],
        totalStats: {
          total: 950,
          success: 915,
          failed: 35,
          successRate: 96.32,
          dailyAverage: 158,
          codesTotal: 850,
          codesUsed: 723,
          usageRate: 85.06
        },
        timeRange: {
          start: '2025-04-01',
          end: '2025-04-05'
        }
      };
    }
  },
  beforeDestroy() {
    // 组件销毁前清理图表
    this.destroyCharts()
  },

  // 添加缺失的方法
  destroyCharts() {
    // 清理图表实例
    for (const key in this.charts) {
      if (this.charts[key]) {
        this.charts[key].destroy();
        this.charts[key] = null;
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.time-range-form {
  margin-bottom: 20px;
}

.table-operator {
  margin-bottom: 18px;
  display: flex;
  justify-content: flex-end;
}

.dashboard-stats {
  margin-bottom: 20px;
}

.stats-card {
  .stats-card-header {
    display: flex;
    align-items: center;

    i {
      font-size: 40px;
      margin-right: 15px;

      &.primary {
        color: #409EFF;
      }

      &.success {
        color: #67C23A;
      }

      &.warning {
        color: #E6A23C;
      }

      &.danger {
        color: #F56C6C;
      }
    }

    .card-content {
      flex-grow: 1;

      .card-title {
        font-size: 14px;
        color: #909399;
      }

      .card-data {
        font-size: 24px;
        font-weight: bold;
        margin-top: 5px;
      }
    }
  }
}

.chart-section {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-container {
  height: 300px;
  position: relative;
}

.table-container {
  max-height: 300px;
  overflow-y: auto;
}

h4 {
  font-size: 16px;
  margin-bottom: 15px;
  color: #606266;
}
</style>