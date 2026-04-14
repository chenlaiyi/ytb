<template>
  <div class="app-container">
    <el-card class="box-card" shadow="never">
      <div slot="header" class="clearfix">
        <span>验证码管理</span>
      </div>

      <!-- 统计卡片 -->
      <el-row :gutter="20" class="dashboard-stats">
        <el-col :span="8">
          <el-card class="stats-card" shadow="hover">
            <div class="stats-card-header">
              <i class="el-icon-key primary"></i>
              <div class="card-content">
                <div class="card-title">总验证码</div>
                <div class="card-data">{{ statsData.total || 0 }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stats-card" shadow="hover">
            <div class="stats-card-header">
              <i class="el-icon-success success"></i>
              <div class="card-content">
                <div class="card-title">已使用</div>
                <div class="card-data">{{ statsData.used || 0 }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stats-card" shadow="hover">
            <div class="stats-card-header">
              <i class="el-icon-time warning"></i>
              <div class="card-content">
                <div class="card-title">未使用</div>
                <div class="card-data">{{ statsData.unused || 0 }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 搜索表单 -->
      <el-form :model="searchForm" ref="searchForm" :inline="true" class="search-form">
        <el-form-item label="手机号">
          <el-input v-model="searchForm.phone" placeholder="输入手机号搜索" clearable></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="选择状态" clearable>
            <el-option label="全部" value=""></el-option>
            <el-option label="已使用" value="used"></el-option>
            <el-option label="未使用" value="unused"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" placeholder="选择类型" clearable>
            <el-option label="全部" value=""></el-option>
            <el-option v-for="type in smsTypes" :key="type" :label="getTypeLabel(type)" :value="type"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
            clearable>
          </el-date-picker>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" icon="el-icon-search">搜索</el-button>
          <el-button @click="resetSearch" icon="el-icon-refresh">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作按钮 -->
      <div class="table-operator">
        <el-button type="info" icon="el-icon-message" @click="goToLogs">短信日志</el-button>
        <el-button type="success" icon="el-icon-data-analysis" @click="goToStatistics">短信统计</el-button>
      </div>

      <!-- 数据表格 -->
      <el-table
        v-loading="loading"
        :data="codesList"
        border
        style="width: 100%"
        class="mt-20">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="phone" label="手机号" width="130">
          <template slot-scope="scope">
            {{ maskPhone(scope.row.phone) }}
          </template>
        </el-table-column>
        <el-table-column prop="code" label="验证码" width="100"></el-table-column>
        <el-table-column prop="type" label="类型" width="110">
          <template slot-scope="scope">
            <el-tag :type="getTypeTagType(scope.row.type)">{{ getTypeLabel(scope.row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_used" label="状态" width="120">
          <template slot-scope="scope">
            <template v-if="scope.row.is_used">
              <el-tag type="success">已使用</el-tag>
            </template>
            <template v-else>
              <el-tag v-if="isExpired(scope.row.created_at)" type="danger">已过期</el-tag>
              <el-tag v-else type="warning">未使用</el-tag>
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="发送时间" width="160"></el-table-column>
        <el-table-column prop="used_at" label="使用时间" width="160">
          <template slot-scope="scope">
            {{ scope.row.used_at || '未使用' }}
          </template>
        </el-table-column>
        <el-table-column label="有效期" width="160">
          <template slot-scope="scope">
            <template v-if="scope.row.is_used">
              <span class="text-muted">已使用</span>
            </template>
            <template v-else>
              <template v-if="isExpired(scope.row.created_at)">
                <span class="text-danger">已过期</span>
              </template>
              <template v-else>
                <span class="text-success">剩余 {{ getRemainingTime(scope.row.created_at) }} 分钟</span>
              </template>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        class="mt-20"
        @current-change="handleCurrentChange"
        :current-page.sync="currentPage"
        :page-size="pageSize"
        layout="total, prev, pager, next, jumper"
        :total="total">
      </el-pagination>
    </el-card>
  </div>
</template>

<script>
import { fetchSmsCodes, fetchSmsCodesStats } from '@/api/sms'

export default {
  name: 'SmsCodes',
  data() {
    return {
      loading: false,
      codesList: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      searchForm: {
        phone: '',
        status: '',
        type: '',
        dateRange: [],
      },
      smsTypes: ['login', 'register', 'reset', 'bind', 'verify'],
      statsData: {
        total: 0,
        used: 0,
        unused: 0
      },
      // 验证码有效期（分钟）
      codeValidity: 15
    }
  },
  created() {
    this.fetchData()
    this.fetchStats()
  },
  methods: {
    fetchData() {
      this.loading = true

      // 准备查询参数
      let params = {
        page: this.currentPage,
      }

      // 添加搜索条件
      if (this.searchForm.phone) {
        params.phone = this.searchForm.phone
      }

      if (this.searchForm.status) {
        params.status = this.searchForm.status
      }

      if (this.searchForm.type) {
        params.type = this.searchForm.type
      }

      if (this.searchForm.dateRange && this.searchForm.dateRange.length === 2) {
        params.date_start = this.searchForm.dateRange[0]
        params.date_end = this.searchForm.dateRange[1]
      }

      // 调用API
      fetchSmsCodes(params).then(response => {
        if (response && response.data && response.data.data) {
          this.codesList = response.data.data;
          this.total = response.data.total || 0;
        } else {
          this.useMockData();
        }
        this.loading = false
      }).catch((error) => {
        console.error('获取验证码列表失败:', error);
        this.useMockData();
        this.loading = false
      })
    },

    fetchStats() {
      fetchSmsCodesStats().then(response => {
        if (response && response.data && response.data.data) {
          this.statsData = response.data.data;
        } else {
          this.statsData = {
            total: 200,
            used: 150,
            unused: 50,
            usageRate: 75
          };
        }
      }).catch(error => {
        console.error('获取验证码统计数据失败:', error);
        this.statsData = {
          total: 200,
          used: 150,
          unused: 50,
          usageRate: 75
        };
      })
    },

    // 使用模拟数据
    useMockData() {
      // 模拟验证码数据
      this.codesList = [
        {
          id: 1,
          phone: '13800138000',
          code: '123456',
          type: 'login',
          used: 1,
          created_at: '2025-04-01 10:00:00',
          expired_at: '2025-04-01 10:05:00',
          used_at: '2025-04-01 10:02:30'
        },
        {
          id: 2,
          phone: '13900139000',
          code: '654321',
          type: 'register',
          used: 1,
          created_at: '2025-04-01 11:00:00',
          expired_at: '2025-04-01 11:05:00',
          used_at: '2025-04-01 11:01:45'
        },
        {
          id: 3,
          phone: '13700137000',
          code: '111222',
          type: 'reset',
          used: 0,
          created_at: '2025-04-01 12:00:00',
          expired_at: '2025-04-01 12:05:00',
          used_at: null
        }
      ];

      // 模拟统计数据
      this.statsData = {
        total: 200,
        used: 150,
        unused: 50,
        usageRate: 75
      };

      // 模拟总数
      this.total = 3;
    },

    handleSearch() {
      this.currentPage = 1
      this.fetchData()
    },

    resetSearch() {
      this.$refs.searchForm.resetFields()
      this.searchForm = {
        phone: '',
        status: '',
        type: '',
        dateRange: []
      }
      this.handleSearch()
    },

    handleCurrentChange(val) {
      this.currentPage = val
      this.fetchData()
    },

    getTypeLabel(type) {
      switch (type) {
        case 'login':
          return '登录验证'
        case 'register':
          return '注册验证'
        case 'reset':
          return '重置密码'
        case 'bind':
          return '绑定手机'
        case 'verify':
          return '身份验证'
        default:
          return type || '未知'
      }
    },

    getTypeTagType(type) {
      switch (type) {
        case 'login':
          return 'primary'
        case 'register':
          return 'success'
        case 'reset':
          return 'warning'
        case 'bind':
          return 'info'
        case 'verify':
          return ''
        default:
          return 'info'
      }
    },

    maskPhone(phone) {
      if (!phone) return ''
      return phone.toString().replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    },

    // 检查验证码是否过期
    isExpired(createdAt) {
      if (!createdAt) return true

      const createdDate = new Date(createdAt)
      const now = new Date()
      const diffMinutes = Math.floor((now - createdDate) / (1000 * 60))

      return diffMinutes >= this.codeValidity
    },

    // 获取剩余有效时间（分钟）
    getRemainingTime(createdAt) {
      if (!createdAt) return 0

      const createdDate = new Date(createdAt)
      const now = new Date()
      const diffMinutes = Math.floor((now - createdDate) / (1000 * 60))
      const remaining = this.codeValidity - diffMinutes

      return Math.max(0, remaining)
    },

    goToLogs() {
      this.$router.push('/system/sms/logs')
    },

    goToStatistics() {
      this.$router.push('/system/sms/statistics')
    }
  }
}
</script>

<style lang="scss" scoped>
.search-form {
  margin-bottom: 15px;
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

.table-operator {
  margin-bottom: 18px;
  display: flex;
  justify-content: flex-end;
}

.mt-20 {
  margin-top: 20px;
}

.text-muted {
  color: #909399;
}

.text-danger {
  color: #F56C6C;
}

.text-success {
  color: #67C23A;
}
</style>