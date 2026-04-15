<template>
  <div class="client-detail-container">
    <!-- 页面标题 -->
    <van-nav-bar
      title="客户设备详情"
      left-text="返回"
      left-arrow
      @click-left="$router.go(-1)"
    />

    <!-- 加载状态 -->
    <van-loading
      v-if="loading"
      type="spinner"
      color="#1989fa"
      vertical
      class="loading-container"
    >
      加载中...
    </van-loading>

    <!-- 客户信息区域 -->
    <div v-else-if="clientInfo.id" class="content-container">
      <!-- 客户基本信息 -->
      <van-cell-group inset class="client-info-card">
        <van-cell-group title="客户信息">
          <van-cell title="客户姓名" :value="clientInfo.name" />
          <van-cell title="联系电话" :value="clientInfo.phone" />
          <van-cell title="客户类型" :value="clientInfo.type_text" />
          <van-cell title="注册时间" :value="clientInfo.created_at" />
        </van-cell-group>
      </van-cell-group>

      <!-- IOT设备信息 -->
      <van-cell-group v-if="deviceInfo.device_id" inset class="device-info-card">
        <van-cell-group title="设备信息">
          <van-cell title="设备编号" :value="deviceInfo.device_id" />
          <van-cell title="设备名称" :value="deviceInfo.device_name" />
          <van-cell title="设备状态">
            <template #value>
              <van-tag 
                :type="deviceInfo.status === 'online' ? 'success' : 'danger'"
                size="medium"
              >
                {{ deviceInfo.status_text }}
              </van-tag>
            </template>
          </van-cell>
          <van-cell title="安装时间" :value="deviceInfo.install_date" />
          <van-cell title="设备型号" :value="deviceInfo.model || 'RO-888'" />
        </van-cell-group>
      </van-cell-group>

      <!-- 实时数据监控 -->
      <van-cell-group v-if="realtimeData.tds" inset class="realtime-data-card">
        <van-cell-group title="实时数据监控">
          <van-cell title="TDS值" :value="`${realtimeData.tds} ppm`" />
          <van-cell title="水温" :value="`${realtimeData.temperature}°C`" />
          <van-cell title="今日用水量" :value="`${realtimeData.todayUsage} L`" />
          <van-cell title="滤芯状态">
            <template #value>
              <van-tag 
                :type="realtimeData.filterStatus === 'normal' ? 'success' : 'warning'"
                size="medium"
              >
                {{ realtimeData.filterStatusText }}
              </van-tag>
            </template>
          </van-cell>
        </van-cell-group>
      </van-cell-group>

      <!-- 设备控制面板 -->
      <van-cell-group v-if="deviceInfo.device_id" inset class="control-panel-card">
        <van-cell-group title="设备控制">
          <van-cell title="设备开关">
            <template #value>
              <van-switch 
                v-model="devicePowerStatus" 
                @change="handlePowerToggle"
                :disabled="controlLoading"
              />
            </template>
          </van-cell>
          <van-cell title="设备锁定">
            <template #value>
              <van-switch 
                v-model="deviceLockStatus" 
                @change="handleLockToggle"
                :disabled="controlLoading"
              />
            </template>
          </van-cell>
        </van-cell-group>
        
        <!-- 控制按钮 -->
        <div class="control-buttons">
          <van-button 
            type="primary" 
            size="small" 
            @click="refreshRealtimeData"
            :loading="refreshLoading"
          >
            刷新数据
          </van-button>
          <van-button 
            type="warning" 
            size="small" 
            @click="resetFilter"
            :loading="resetLoading"
          >
            复位滤芯
          </van-button>
        </div>
      </van-cell-group>

      <!-- 师傅信息 -->
      <van-cell-group v-if="masterInfo.id" inset class="master-info-card">
        <van-cell-group title="服务师傅">
          <van-cell title="师傅姓名" :value="masterInfo.name" />
          <van-cell title="联系电话" :value="masterInfo.phone" />
          <van-cell title="服务区域" :value="masterInfo.service_area" />
          <van-cell title="技能等级" :value="masterInfo.skill_level" />
        </van-cell-group>
      </van-cell-group>

      <!-- 维护记录 -->
      <van-cell-group v-if="maintenanceRecords.length > 0" inset class="maintenance-records-card">
        <van-cell-group title="维护记录">
          <van-cell 
            v-for="record in maintenanceRecords" 
            :key="record.id"
            :title="record.type_text"
            :label="record.description"
            :value="record.created_at"
          />
        </van-cell-group>
      </van-cell-group>

      <!-- 数据图表 -->
      <van-cell-group v-if="chartData.length > 0" inset class="chart-card">
        <van-cell-group title="用水量趋势">
          <div class="chart-container">
            <canvas ref="usageChart" width="300" height="200"></canvas>
          </div>
        </van-cell-group>
      </van-cell-group>
    </div>

    <!-- 无数据状态 -->
    <van-empty 
      v-else 
      image="error" 
      description="未找到客户信息" 
      class="empty-container"
    >
      <van-button type="primary" @click="loadClientDetail">重新加载</van-button>
    </van-empty>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { clientDetailApi, deviceControlApi, realtimeDataApi } from '@/api/salesman'

export default {
  name: 'ClientDetail',
  setup() {
    const route = useRoute()
    const clientId = route.params.id

    // 响应式数据
    const loading = ref(true)
    const controlLoading = ref(false)
    const refreshLoading = ref(false)
    const resetLoading = ref(false)

    // 客户信息
    const clientInfo = reactive({
      id: '',
      name: '',
      phone: '',
      type: '',
      type_text: '',
      created_at: ''
    })

    // 设备信息
    const deviceInfo = reactive({
      device_id: '',
      device_name: '',
      status: '',
      status_text: '',
      install_date: '',
      model: ''
    })

    // 实时数据
    const realtimeData = reactive({
      tds: 0,
      temperature: 0,
      todayUsage: 0,
      filterStatus: '',
      filterStatusText: ''
    })

    // 师傅信息
    const masterInfo = reactive({
      id: '',
      name: '',
      phone: '',
      service_area: '',
      skill_level: ''
    })

    // 维护记录
    const maintenanceRecords = ref([])

    // 图表数据
    const chartData = ref([])

    // 设备控制状态
    const devicePowerStatus = ref(false)
    const deviceLockStatus = ref(false)

    // 图表引用
    const usageChart = ref(null)

    // 加载客户详情数据
    const loadClientDetail = async () => {
      try {
        loading.value = true
        const response = await clientDetailApi.getClientDetail(clientId)
        
        if (response.code === 0 && response.data) {
          const data = response.data

          // 更新客户信息
          Object.assign(clientInfo, data.client_info || {})
          
          // 更新设备信息
          Object.assign(deviceInfo, data.device_info || {})
          
          // 更新师傅信息
          Object.assign(masterInfo, data.master_info || {})
          
          // 更新维护记录
          maintenanceRecords.value = data.maintenance_records || []
          
          // 更新图表数据
          chartData.value = data.chart_data || []

          // 如果有设备，加载实时数据
          if (deviceInfo.device_id) {
            await loadRealtimeData()
          }

          // 绘制图表
          if (chartData.value.length > 0) {
            nextTick(() => {
              drawChart()
            })
          }

        } else {
          showToast(response.message || '加载客户信息失败')
        }
      } catch (error) {
        console.error('加载客户详情失败:', error)
        showToast('网络错误，请稍后重试')
      } finally {
        loading.value = false
      }
    }

    // 加载实时数据
    const loadRealtimeData = async () => {
      try {
        if (!deviceInfo.device_id) return

        const response = await realtimeDataApi.getRealtimeData(deviceInfo.device_id)
        
        if (response.code === 0 && response.data) {
          Object.assign(realtimeData, response.data)
          
          // 更新设备控制状态
          devicePowerStatus.value = response.data.power_status === 'on'
          deviceLockStatus.value = response.data.lock_status === 'locked'
        }
      } catch (error) {
        console.error('加载实时数据失败:', error)
      }
    }

    // 刷新实时数据
    const refreshRealtimeData = async () => {
      try {
        refreshLoading.value = true
        await loadRealtimeData()
        showToast('数据刷新成功')
      } catch (error) {
        showToast('刷新失败')
      } finally {
        refreshLoading.value = false
      }
    }

    // 设备开关控制
    const handlePowerToggle = async (value) => {
      try {
        controlLoading.value = true
        
        const action = value ? 'power_on' : 'power_off'
        const response = await deviceControlApi.controlDevice(deviceInfo.device_id, action)
        
        if (response.code === 0) {
          showToast(value ? '设备已开启' : '设备已关闭')
        } else {
          devicePowerStatus.value = !value // 回滚状态
          showToast(response.message || '操作失败')
        }
      } catch (error) {
        devicePowerStatus.value = !value // 回滚状态
        showToast('操作失败，请稍后重试')
      } finally {
        controlLoading.value = false
      }
    }

    // 设备锁定控制
    const handleLockToggle = async (value) => {
      try {
        controlLoading.value = true
        
        const action = value ? 'lock' : 'unlock'
        const response = await deviceControlApi.controlDevice(deviceInfo.device_id, action)
        
        if (response.code === 0) {
          showToast(value ? '设备已锁定' : '设备已解锁')
        } else {
          deviceLockStatus.value = !value // 回滚状态
          showToast(response.message || '操作失败')
        }
      } catch (error) {
        deviceLockStatus.value = !value // 回滚状态
        showToast('操作失败，请稍后重试')
      } finally {
        controlLoading.value = false
      }
    }

    // 复位滤芯
    const resetFilter = async () => {
      try {
        const confirmed = await showConfirmDialog({
          title: '确认操作',
          message: '确定要复位滤芯吗？此操作将重置滤芯使用记录。'
        })

        if (confirmed) {
          resetLoading.value = true
          
          const response = await deviceControlApi.controlDevice(deviceInfo.device_id, 'reset_filter')
          
          if (response.code === 0) {
            showToast('滤芯复位成功')
            await loadRealtimeData() // 刷新数据
          } else {
            showToast(response.message || '复位失败')
          }
        }
      } catch (error) {
        if (error !== 'cancel') {
          showToast('操作失败，请稍后重试')
        }
      } finally {
        resetLoading.value = false
      }
    }

    // 绘制用水量趋势图表
    const drawChart = () => {
      const canvas = usageChart.value
      if (!canvas || chartData.value.length === 0) return

      const ctx = canvas.getContext('2d')
      const width = canvas.width
      const height = canvas.height

      // 清空画布
      ctx.clearRect(0, 0, width, height)

      // 设置样式
      ctx.strokeStyle = '#1989fa'
      ctx.fillStyle = 'rgba(25, 137, 250, 0.1)'
      ctx.lineWidth = 2

      // 计算坐标
      const maxValue = Math.max(...chartData.value.map(item => item.usage))
      const stepX = width / (chartData.value.length - 1)
      const stepY = (height - 40) / maxValue

      // 绘制折线和填充区域
      ctx.beginPath()
      chartData.value.forEach((item, index) => {
        const x = index * stepX
        const y = height - 20 - (item.usage * stepY)

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      // 绘制填充区域
      ctx.lineTo(width, height - 20)
      ctx.lineTo(0, height - 20)
      ctx.closePath()
      ctx.fill()

      // 绘制折线
      ctx.beginPath()
      chartData.value.forEach((item, index) => {
        const x = index * stepX
        const y = height - 20 - (item.usage * stepY)

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.stroke()

      // 绘制数据点
      ctx.fillStyle = '#1989fa'
      chartData.value.forEach((item, index) => {
        const x = index * stepX
        const y = height - 20 - (item.usage * stepY)
        
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, 2 * Math.PI)
        ctx.fill()
      })
    }

    // 组件挂载后加载数据
    onMounted(() => {
      loadClientDetail()
    })

    return {
      loading,
      controlLoading,
      refreshLoading,
      resetLoading,
      clientInfo,
      deviceInfo,
      realtimeData,
      masterInfo,
      maintenanceRecords,
      chartData,
      devicePowerStatus,
      deviceLockStatus,
      usageChart,
      loadClientDetail,
      refreshRealtimeData,
      handlePowerToggle,
      handleLockToggle,
      resetFilter
    }
  }
}
</script>

<style scoped>
.client-detail-container {
  background-color: #f7f8fa;
  min-height: 100vh;
}

.loading-container {
  padding: 100px 0;
  text-align: center;
}

.content-container {
  padding: 0 0 20px 0;
}

.client-info-card,
.device-info-card,
.realtime-data-card,
.control-panel-card,
.master-info-card,
.maintenance-records-card,
.chart-card {
  margin: 16px 0;
}

.control-buttons {
  display: flex;
  gap: 12px;
  padding: 16px;
  justify-content: center;
}

.chart-container {
  padding: 16px;
  background: white;
}

.empty-container {
  padding: 100px 0;
}

/* 状态标签样式 */
.van-tag {
  font-size: 12px;
}

/* 卡片间距调整 */
.van-cell-group {
  margin-bottom: 0;
}

.van-cell-group--inset {
  margin: 16px;
}

/* 图表样式 */
canvas {
  max-width: 100%;
  height: auto;
}
</style>