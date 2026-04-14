<template>
  <div class="merchant-points">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>商户积分管理</span>
          <el-button type="primary" :loading="loading" @click="fetchData">刷新</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="listQuery" class="filter-form">
        <el-form-item label="关键词">
          <el-input
            v-model="listQuery.keyword"
            placeholder="商户名称/手机号/商户号"
            clearable
            @keyup.enter.native="handleFilter"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="listQuery.status" placeholder="请选择" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
            <el-option label="待审核" :value="2" />
            <el-option label="审核中" :value="3" />
          </el-select>
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
        <el-table-column prop="merchant_id" label="商户号" width="140" />
        <el-table-column prop="merchant_name" label="商户名称" min-width="200" />
        <el-table-column prop="phone" label="登录手机号" width="140" />
        <el-table-column prop="contact_name" label="联系人" width="120" />
        <el-table-column prop="contact_phone" label="联系电话" width="140" />
        <el-table-column prop="status_text" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ row.status_text }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="integral" label="积分余额" width="120">
          <template #default="{ row }">
            {{ Number(row.integral || 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
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

const listQuery = reactive({
  keyword: '',
  status: '',
  page: 1,
  per_page: 15
})

const fetchData = async () => {
  loading.value = true
  try {
    const response = await mallMerchantApi.getPoints(listQuery)
    if (response.code === 0) {
      list.value = response.data?.data || []
      total.value = response.data?.total || 0
      listQuery.page = response.data?.current_page || listQuery.page
    } else {
      ElMessage.error(response.message || '获取商户积分失败')
    }
  } catch (error) {
    console.error('获取商户积分失败:', error)
    ElMessage.error('获取商户积分失败：' + (error.response?.data?.message || error.message))
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
  listQuery.status = ''
  handleFilter()
}

const handlePageChange = (page) => {
  listQuery.page = page
  fetchData()
}

const statusType = (status) => {
  const map = {
    1: 'success',
    0: 'info',
    2: 'warning',
    3: 'warning'
  }
  return map[status] || 'info'
}

onMounted(fetchData)
</script>

<style scoped lang="scss">
.merchant-points {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .filter-form {
    margin-bottom: 20px;
  }

  .table-footer {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
