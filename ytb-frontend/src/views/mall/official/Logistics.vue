<template>
  <div class="official-logistics">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>物流管理</span>
          <el-button type="primary" :loading="loading" @click="fetchData">刷新</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="listQuery" class="filter-form">
        <el-form-item label="关键词">
          <el-input
            v-model="listQuery.keyword"
            placeholder="订单号/收货人/电话/快递单号"
            clearable
            @keyup.enter.native="handleFilter"
          />
        </el-form-item>
        <el-form-item label="物流公司">
          <el-input
            v-model="listQuery.express_company"
            placeholder="物流公司"
            clearable
            @keyup.enter.native="handleFilter"
          />
        </el-form-item>
        <el-form-item label="发货状态">
          <el-select v-model="listQuery.ship_status" placeholder="选择状态" clearable>
            <el-option label="已发货" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已退货" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="发货日期">
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
        <el-table-column prop="order_id" label="订单号" width="160" />
        <el-table-column prop="merchant_name" label="所属商户" width="160" v-if="false" />
        <el-table-column label="收货人" width="140">
          <template #default="{ row }">
            <div class="user-info">
              <div>{{ row.user_name || '—' }}</div>
              <div class="user-phone">{{ row.user_phone || '—' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="express_company" label="物流公司" width="140" />
        <el-table-column prop="express_no" label="快递单号" width="180" />
        <el-table-column prop="ship_status_text" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.ship_status)">{{ row.ship_status_text }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ship_time" label="发货时间" width="180" />
        <el-table-column prop="confirm_time" label="签收时间" width="180" />
        <el-table-column prop="amount" label="金额" width="100">
          <template #default="{ row }">
            {{ formatCurrency(row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="ship_address" label="收货地址" min-width="220" show-overflow-tooltip />
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
import { mallOfficialApi } from '@/api/v1/mall'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const dateRange = ref([])

const listQuery = reactive({
  keyword: '',
  express_company: '',
  ship_status: '',
  start_date: '',
  end_date: '',
  page: 1,
  per_page: 15
})

const fetchData = async () => {
  loading.value = true
  try {
    const response = await mallOfficialApi.getLogistics(listQuery)
    if (response.code === 0) {
      list.value = response.data?.data || []
      total.value = response.data?.total || 0
      listQuery.page = response.data?.current_page || listQuery.page
    } else {
      ElMessage.error(response.message || '获取物流数据失败')
    }
  } catch (error) {
    console.error('获取官方商城物流失败:', error)
    ElMessage.error('获取物流数据失败：' + (error.response?.data?.message || error.message))
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
  listQuery.express_company = ''
  listQuery.ship_status = ''
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

const statusType = (status) => {
  const map = {
    2: 'primary',
    3: 'success',
    4: 'danger'
  }
  return map[status] || 'info'
}

const formatCurrency = (value) => {
  const number = Number(value || 0)
  return `¥${number.toFixed(2)}`
}

onMounted(fetchData)
</script>

<style scoped lang="scss">
.official-logistics {
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
