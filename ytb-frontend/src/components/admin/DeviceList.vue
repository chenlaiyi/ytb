<template>
  <div class="device-list">
    <el-table :data="devices" border style="width: 100%">
      <el-table-column prop="device_id" label="设备ID" width="180"></el-table-column>
      <el-table-column prop="device_name" label="设备名称"></el-table-column>
      <el-table-column prop="client_name" label="所属客户"></el-table-column>
      <el-table-column prop="status" label="状态">
        <template #default="{row}">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">
            {{ row.status === 1 ? '正常' : '故障' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{row}">
          <el-button size="small" @click="handleDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      @current-change="handlePageChange"
      :current-page="pagination.current"
      :page-size="pagination.size"
      :total="pagination.total"
      layout="total, prev, pager, next">
    </el-pagination>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { getDeviceList } from '@/api/device'

export default {
  name: 'DeviceList',
  setup() {
    const devices = ref([])
    const pagination = ref({
      current: 1,
      size: 10,
      total: 0
    })

    const fetchData = async () => {
      try {
        const res = await getDeviceList({
          page: pagination.value.current,
          size: pagination.value.size
        })
        devices.value = res.data.list
        pagination.value.total = res.data.total
      } catch (error) {
        console.error(error)
      }
    }

    const handlePageChange = (page) => {
      pagination.value.current = page
      fetchData()
    }

    const handleDetail = (row) => {
      // 跳转到详情页
    }

    onMounted(() => {
      fetchData()
    })

    return {
      devices,
      pagination,
      handlePageChange,
      handleDetail
    }
  }
}
</script>

<style scoped>
.device-list {
  padding: 20px;
}
</style>
