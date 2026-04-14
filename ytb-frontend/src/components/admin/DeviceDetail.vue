<template>
  <div class="device-detail">
    <el-card>
      <div slot="header" class="clearfix">
        <span>设备详情</span>
        <el-button style="float: right; padding: 3px 0" type="text" @click="goBack">返回</el-button>
      </div>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="设备ID">{{ device.device_id }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ device.device_name }}</el-descriptions-item>
        <el-descriptions-item label="设备型号">{{ device.model }}</el-descriptions-item>
        <el-descriptions-item label="安装日期">{{ device.install_date }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="device.status === 1 ? 'success' : 'danger'">
            {{ device.status === 1 ? '正常' : '故障' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="所属客户">{{ device.client_name }}</el-descriptions-item>
        <el-descriptions-item label="客户电话">{{ device.client_phone }}</el-descriptions-item>
        <el-descriptions-item label="客户地址">{{ device.client_address }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ device.remark }}</el-descriptions-item>
      </el-descriptions>

      <div class="action-buttons">
        <el-button type="primary" @click="handleEdit">编辑</el-button>
        <el-button type="danger" @click="handleDelete">删除</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getDeviceDetail } from '@/api/device'

export default {
  name: 'DeviceDetail',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const device = ref({
      device_id: '',
      device_name: '',
      model: '',
      install_date: '',
      status: 0,
      client_name: '',
      client_phone: '',
      client_address: '',
      remark: ''
    })

    const fetchData = async () => {
      try {
        const res = await getDeviceDetail(route.params.id)
        device.value = res.data
      } catch (error) {
        console.error(error)
      }
    }

    const goBack = () => {
      router.go(-1)
    }

    const handleEdit = () => {
      // 跳转到编辑页
    }

    const handleDelete = () => {
      // 删除设备
    }

    onMounted(() => {
      fetchData()
    })

    return {
      device,
      goBack,
      handleEdit,
      handleDelete
    }
  }
}
</script>

<style scoped>
.device-detail {
  padding: 20px;
}

.action-buttons {
  margin-top: 20px;
  text-align: center;
}
</style>
