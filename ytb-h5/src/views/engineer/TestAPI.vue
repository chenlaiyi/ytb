<template>
  <div class="test-api-page">
    <!-- 统一导航栏 -->
    <NavHeader title="API测试" />

    <div class="content">
      <van-cell-group title="API测试">
        <van-cell title="获取工单详情" is-link @click="testGetWorkOrderDetail" />
        <van-cell title="完成工单" is-link @click="testCompleteWorkOrder" />
        <van-cell title="上传工单照片" is-link @click="testUploadWorkOrderPhoto" />
      </van-cell-group>

      <van-cell-group title="测试结果" style="margin-top: 20px;">
        <van-field
          v-model="testResult"
          type="textarea"
          rows="10"
          readonly
          placeholder="测试结果将显示在这里"
        />
      </van-cell-group>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Icon as VanIcon, Cell as VanCell, CellGroup as VanCellGroup, Field as VanField } from 'vant'
import Toast from '@/utils/toast-fix'
import { getWorkOrderDetail, completeWorkOrder, uploadWorkOrderPhoto } from '@/api/engineer'
import NavHeader from '@/components/NavHeader.vue'

// 测试结果
const testResult = ref('')

// 测试获取工单详情
const testGetWorkOrderDetail = async () => {
  try {
    testResult.value = '正在测试获取工单详情...\n'
    const res = await getWorkOrderDetail(1) // 使用测试ID
    testResult.value += JSON.stringify(res, null, 2)
  } catch (error) {
    testResult.value += '获取工单详情失败: ' + error.message
  }
}

// 测试完成工单
const testCompleteWorkOrder = async () => {
  try {
    testResult.value = '正在测试完成工单...\n'
    const res = await completeWorkOrder(1, { // 使用测试ID
      completion_note: '测试完成说明',
      completion_time: new Date().toISOString()
    })
    testResult.value += JSON.stringify(res, null, 2)
  } catch (error) {
    testResult.value += '完成工单失败: ' + error.message
  }
}

// 测试上传工单照片
const testUploadWorkOrderPhoto = async () => {
  try {
    testResult.value = '正在测试上传工单照片...\n'
    
    // 创建一个测试文件
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const formData = new FormData()
    formData.append('photo', file)
    
    const res = await uploadWorkOrderPhoto(1, formData) // 使用测试ID
    testResult.value += JSON.stringify(res, null, 2)
  } catch (error) {
    testResult.value += '上传工单照片失败: ' + error.message
  }
}
</script>

<style scoped>
.test-api-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 自定义导航栏 */
.custom-navbar {
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  color: white;
  padding: 0 12px;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 4px;
}

.navbar-left, .navbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 16px;
  cursor: pointer;
}

.navbar-title {
  font-size: 18px;
  font-weight: bold;
}

.content {
  padding: 12px;
}
</style>