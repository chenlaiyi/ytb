<template>
  <div class="merchant-users">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>商城用户</span>
          <el-button type="primary" :loading="loading" @click="fetchData">刷新</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="listQuery" class="filter-form">
        <el-form-item label="关键词">
          <el-input
            v-model="listQuery.keyword"
            placeholder="姓名/昵称/手机号"
            clearable
            @keyup.enter.native="handleFilter"
          />
        </el-form-item>
        <el-form-item label="注册日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleDateChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleFilter">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table
        v-loading="loading"
        :data="list"
        border
        style="width: 100%"
      >
        <el-table-column prop="id" label="用户ID" width="100" />
        <el-table-column label="用户信息" min-width="200">
          <template #default="{ row }">
            <div class="user-info">
              <div class="user-name">{{ row.name || '—' }}</div>
              <div class="user-phone">{{ row.phone || '—' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="orders_count" label="订单数" width="100" />
        <el-table-column prop="merchant_count" label="下单商户数" width="120" />
        <el-table-column prop="total_amount" label="消费金额" width="140">
          <template #default="{ row }">
            {{ formatCurrency(row.total_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="180" />
      </el-table>

      <div class="table-footer">
        <el-pagination
          v-if="total > 0"
          background
          layout="prev, pager, next, jumper, ->, total"
          :total="total"
          :page-size="listQuery.per_page"
          :current-page="listQuery.page"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { mallMerchantApi } from '@/api/v1/mall'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const dateRange = ref([])

const listQuery = reactive({
  keyword: '',
  start_date: '',
  end_date: '',
  page: 1,
  per_page: 15
})

const fetchData = async () => {
  loading.value = true
  try {
    const response = await mallMerchantApi.getUsers(listQuery)
    if (response.code === 0) {
      list.value = response.data?.data || []
      total.value = response.data?.total || 0
      listQuery.page = response.data?.current_page || listQuery.page
    } else {
      ElMessage.error(response.message || '获取用户数据失败')
    }
  } catch (error) {
    console.error('获取商户商城用户失败:', error)
    ElMessage.error('获取用户数据失败：' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

const handleFilter = () => {
  listQuery.page = 1
  fetchData()
}

const handleReset = () => {
  listQuery.keyword = ''
  listQuery.start_date = ''
  listQuery.end_date = ''
  dateRange.value = []
  handleFilter()
}

const handleDateChange = (val) => {
  if (val && val.length === 2) {
    listQuery.start_date = val[0]
    listQuery.end_date = val[1]
  } else {
    listQuery.start_date = ''
    listQuery.end_date = ''
  }
}

const handlePageChange = (page) => {
  listQuery.page = page
  fetchData()
}

const formatCurrency = (value) => {
  const number = Number(value || 0)
  return `¥${number.toFixed(2)}`
}

onMounted(fetchData)
</script>

<style scoped lang="scss">
.merchant-users {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .filter-form {
    margin-bottom: 20px;
  }

  .user-info {
    display: flex;
    flex-direction: column;

    .user-name {
      font-weight: 600;
    }

    .user-phone {
      font-size: 12px;
      color: #909399;
    }
  }

  .table-footer {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
