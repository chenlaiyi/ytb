<template>
  <el-dialog
    v-model="visible"
    :title="'设备控制 - ' + (device?.board_code || '')"
    width="750px"
    @close="$emit('close')"
  >
    <el-tabs v-model="activeTab">
      <!-- 系统控制 -->
      <el-tab-pane label="系统控制" name="system">
        <div class="control-section">
          <h4>电源与状态</h4>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-card shadow="hover" class="control-card">
                <div class="control-item">
                  <span class="label">设备电源</span>
                  <el-switch
                    v-model="controls.power"
                    active-text="开启"
                    inactive-text="关闭"
                    @change="sendCommand('power', { enabled: controls.power })"
                    :loading="loading.power"
                  />
                </div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover" class="control-card">
                <div class="control-item">
                  <span class="label">设备锁定</span>
                  <el-switch
                    v-model="controls.lock"
                    active-text="锁定"
                    inactive-text="解锁"
                    @change="sendCommand('lock', { enabled: controls.lock })"
                    :loading="loading.lock"
                  />
                </div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover" class="control-card">
                <div class="control-item">
                  <span class="label">童锁开关</span>
                  <el-switch
                    v-model="controls.childLock"
                    active-text="开启"
                    inactive-text="关闭"
                    @change="sendCommand('child_lock', { enabled: controls.childLock })"
                    :loading="loading.childLock"
                  />
                </div>
              </el-card>
            </el-col>
          </el-row>

          <h4 style="margin-top: 20px;">快捷操作</h4>
          <el-row :gutter="20">
            <el-col :span="6">
              <el-button type="primary" @click="sendCommand('query')" :loading="loading.query" style="width: 100%;">
                <el-icon><Refresh /></el-icon> 实时查询
              </el-button>
            </el-col>
            <el-col :span="6">
              <el-button type="warning" @click="confirmFlush" :loading="loading.flush" style="width: 100%;">
                <el-icon><RefreshRight /></el-icon> 强制冲洗
              </el-button>
            </el-col>
            <el-col :span="6">
              <el-button type="info" @click="confirmDrain" :loading="loading.drain" style="width: 100%;">
                <el-icon><Setting /></el-icon> 排水控制
              </el-button>
            </el-col>
            <el-col :span="6">
              <el-button type="danger" @click="confirmDeactivate" :loading="loading.deactivate" style="width: 100%;">
                <el-icon><Close /></el-icon> 停用设备
              </el-button>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>

      <!-- 计费设置 -->
      <el-tab-pane label="计费设置" name="billing">
        <div class="control-section">
          <h4>计费模式</h4>
          <el-form label-width="120px">
            <el-form-item label="当前模式">
              <el-radio-group v-model="billingForm.mode">
                <el-radio label="01">时长计费</el-radio>
                <el-radio label="02">流量计费</el-radio>
                <el-radio label="03">零售模式</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="sendCommand('billing_mode', { mode: billingForm.mode })" :loading="loading.billingMode">
                应用计费模式
              </el-button>
            </el-form-item>
          </el-form>

          <el-divider />

          <h4>时长充值（包年模式）</h4>
          <el-form label-width="120px">
            <el-form-item label="服务到期日">
              <el-date-picker
                v-model="billingForm.expireDate"
                type="date"
                placeholder="选择到期日期"
                format="YYYY-MM-DD"
                value-format="YYYYMMDD"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="success" @click="sendCommand('recharge_time', { expire_date: billingForm.expireDate })" :loading="loading.rechargeTime">
                充值时长
              </el-button>
            </el-form-item>
          </el-form>

          <el-divider />

          <h4>流量设置（流量模式）</h4>
          <el-form label-width="120px">
            <el-form-item label="剩余流量(L)">
              <el-input-number v-model="billingForm.surplusFlow" :min="0" :max="99999" :step="100" />
            </el-form-item>
            <el-form-item>
              <el-button type="success" @click="sendCommand('surplus_flow', { flow: billingForm.surplusFlow })" :loading="loading.surplusFlow">
                设置剩余流量
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- 功能开关 -->
      <el-tab-pane label="功能开关" name="features">
        <div class="control-section">
          <h4>温控功能</h4>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-card shadow="hover" class="control-card">
                <div class="control-item">
                  <span class="label">加热开关</span>
                  <el-switch
                    v-model="controls.heating"
                    active-text="开"
                    inactive-text="关"
                    @change="sendCommand('heating', { enabled: controls.heating })"
                    :loading="loading.heating"
                  />
                </div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover" class="control-card">
                <div class="control-item">
                  <span class="label">制冷开关</span>
                  <el-switch
                    v-model="controls.cooling"
                    active-text="开"
                    inactive-text="关"
                    @change="sendCommand('cooling', { enabled: controls.cooling })"
                    :loading="loading.cooling"
                  />
                </div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover" class="control-card">
                <div class="control-item">
                  <span class="label">休眠模式</span>
                  <el-switch
                    v-model="controls.sleepMode"
                    active-text="开"
                    inactive-text="关"
                    @change="sendCommand('sleep_mode', { enabled: controls.sleepMode })"
                    :loading="loading.sleepMode"
                  />
                </div>
              </el-card>
            </el-col>
          </el-row>

          <h4 style="margin-top: 20px;">定时功能</h4>
          <el-form label-width="100px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="定时开机">
                  <el-switch v-model="scheduleForm.onEnabled" style="margin-right: 10px;" />
                  <el-time-picker
                    v-model="scheduleForm.onTime"
                    format="HH:mm"
                    value-format="HH:mm"
                    :disabled="!scheduleForm.onEnabled"
                  />
                </el-form-item>
                <el-button size="small" type="primary" @click="sendCommand('scheduled_on', { enabled: scheduleForm.onEnabled, time: scheduleForm.onTime })" :loading="loading.scheduledOn">
                  保存
                </el-button>
              </el-col>
              <el-col :span="12">
                <el-form-item label="定时关机">
                  <el-switch v-model="scheduleForm.offEnabled" style="margin-right: 10px;" />
                  <el-time-picker
                    v-model="scheduleForm.offTime"
                    format="HH:mm"
                    value-format="HH:mm"
                    :disabled="!scheduleForm.offEnabled"
                  />
                </el-form-item>
                <el-button size="small" type="primary" @click="sendCommand('scheduled_off', { enabled: scheduleForm.offEnabled, time: scheduleForm.offTime })" :loading="loading.scheduledOff">
                  保存
                </el-button>
              </el-col>
            </el-row>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- 滤芯管理 -->
      <el-tab-pane label="滤芯管理" name="filter">
        <div class="control-section">
          <h4>滤芯重置</h4>
          <el-table :data="filterList" border style="width: 100%;">
            <el-table-column prop="name" label="滤芯" width="100" />
            <el-table-column label="当前状态" width="200">
              <template #default="{ row }">
                <el-progress :percentage="row.percent" :status="getProgressStatus(row.percent)" />
                <span class="filter-info">{{ row.remaining }} / {{ row.total }} 天</span>
              </template>
            </el-table-column>
            <el-table-column label="自定义重置" width="300">
              <template #default="{ row }">
                <el-input-number v-model="row.newFlux" :min="0" :max="9999" size="small" style="width: 80px;" /> /
                <el-input-number v-model="row.newFluxMax" :min="1" :max="9999" size="small" style="width: 80px;" /> 天
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="resetFilter(row)" :loading="loading[`filter${row.id}`]">
                  重置
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div style="margin-top: 15px;">
            <el-button type="warning" @click="resetAllFilters" :loading="loading.filterResetAll">
              重置所有滤芯
            </el-button>
          </div>
        </div>
      </el-tab-pane>

      <!-- 显示设置 -->
      <el-tab-pane label="显示设置" name="display">
        <div class="control-section">
          <h4>屏幕显示</h4>
          <el-form label-width="150px">
            <el-form-item label="LOGO编号">
              <el-select v-model="displayForm.logo" placeholder="选择LOGO" style="width: 200px;">
                <el-option v-for="i in 10" :key="i" :label="'LOGO ' + i" :value="String(i).padStart(2, '0')" />
              </el-select>
              <el-button type="primary" style="margin-left: 10px;" @click="sendCommand('logo', { logo: displayForm.logo })" :loading="loading.logo">
                设置
              </el-button>
            </el-form-item>
            <el-form-item label="显示滤芯寿命">
              <el-switch
                v-model="controls.filterDisplay"
                @change="sendCommand('filter_display', { enabled: controls.filterDisplay })"
                :loading="loading.filterDisplay"
              />
            </el-form-item>
            <el-form-item label="显示原水TDS">
              <el-switch
                v-model="controls.rawTdsDisplay"
                @change="sendCommand('raw_tds_display', { enabled: controls.rawTdsDisplay })"
                :loading="loading.rawTdsDisplay"
              />
            </el-form-item>
          </el-form>

          <el-divider />

          <h4>服务信息</h4>
          <el-form label-width="150px">
            <el-form-item label="售后服务电话">
              <el-input v-model="displayForm.servicePhone" placeholder="输入电话号码" style="width: 200px;" />
              <el-button type="primary" style="margin-left: 10px;" @click="sendCommand('service_phone', { phone: displayForm.servicePhone })" :loading="loading.servicePhone">
                设置
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- 高级设置 -->
      <el-tab-pane label="高级设置" name="advanced">
        <div class="control-section">
          <el-alert type="warning" title="高级设置仅供专业人员使用，错误配置可能影响设备正常运行" show-icon :closable="false" style="margin-bottom: 20px;" />

          <h4>系统参数</h4>
          <el-form label-width="150px">
            <el-form-item label="上报周期(分钟)">
              <el-input-number v-model="advancedForm.reportingCycle" :min="1" :max="1440" :step="60" />
              <el-button type="primary" style="margin-left: 10px;" @click="sendCommand('reporting_cycle', { minutes: advancedForm.reportingCycle })" :loading="loading.reportingCycle">
                设置
              </el-button>
            </el-form-item>
            <el-form-item label="流量系数(50-200)">
              <el-input-number v-model="advancedForm.flowParam" :min="50" :max="200" :step="1" />
              <el-button type="primary" style="margin-left: 10px;" @click="sendCommand('flow_param', { value: advancedForm.flowParam })" :loading="loading.flowParam">
                设置
              </el-button>
              <span class="tip">用于校准流量计，默认100</span>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 操作日志 -->
    <div v-if="commandLogs.length > 0" class="command-log">
      <h4>操作记录</h4>
      <div class="log-list">
        <div v-for="(log, index) in commandLogs" :key="index" class="log-item" :class="log.success ? 'success' : 'error'">
          <span class="time">{{ log.time }}</span>
          <span class="cmd">{{ log.command }}</span>
          <span class="result">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, RefreshRight, Setting, Close } from '@element-plus/icons-vue'
import request from '@/utils/request'

const props = defineProps({
  modelValue: Boolean,
  device: Object
})

const emit = defineEmits(['update:modelValue', 'close', 'refresh'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const activeTab = ref('system')
const commandLogs = ref([])

// 开关状态
const controls = reactive({
  power: false,
  lock: false,
  childLock: false,
  heating: false,
  cooling: false,
  sleepMode: false,
  filterDisplay: true,
  rawTdsDisplay: true
})

// 计费表单
const billingForm = reactive({
  mode: '01',
  expireDate: '',
  surplusFlow: 0
})

// 定时表单
const scheduleForm = reactive({
  onEnabled: false,
  onTime: '08:00',
  offEnabled: false,
  offTime: '22:00'
})

// 显示设置
const displayForm = reactive({
  logo: '01',
  servicePhone: ''
})

// 高级设置
const advancedForm = reactive({
  reportingCycle: 360,
  flowParam: 100
})

// 滤芯列表
const filterList = ref([
  { id: 1, name: 'PP棉', remaining: 0, total: 365, percent: 0, newFlux: 365, newFluxMax: 365 },
  { id: 2, name: '活性炭', remaining: 0, total: 365, percent: 0, newFlux: 365, newFluxMax: 365 },
  { id: 3, name: 'RO膜', remaining: 0, total: 730, percent: 0, newFlux: 730, newFluxMax: 730 },
  { id: 4, name: '后置炭', remaining: 0, total: 365, percent: 0, newFlux: 365, newFluxMax: 365 },
  { id: 5, name: '矿化球', remaining: 0, total: 365, percent: 0, newFlux: 365, newFluxMax: 365 }
])

// 加载状态
const loading = reactive({})

// 初始化设备数据
watch(() => props.device, (device) => {
  if (device) {
    controls.power = device.is_power_on
    controls.lock = device.is_locked
    billingForm.mode = device.billing_mode === 'time' ? '01' : (device.billing_mode === 'flow' ? '02' : '03')
    billingForm.surplusFlow = device.surplus_flow || 0
    
    // 初始化滤芯数据
    if (device.filters) {
      device.filters.forEach((f, i) => {
        if (filterList.value[i]) {
          filterList.value[i].remaining = f.remaining || 0
          filterList.value[i].total = f.total || 365
          filterList.value[i].percent = f.percent || 0
          filterList.value[i].newFlux = f.total || 365
          filterList.value[i].newFluxMax = f.total || 365
        }
      })
    }
  }
}, { immediate: true })

// 发送命令
const sendCommand = async (command, params = {}) => {
  if (!props.device?.id) return

  loading[command] = true
  try {
    const res = await request({
      url: `/api/admin/water-purifier/${props.device.id}/advanced-control`,
      method: 'post',
      data: { command, params }
    })

    const success = res.code === 0
    const message = res.message || (success ? '操作成功' : '操作失败')
    
    // 添加日志
    commandLogs.value.unshift({
      time: new Date().toLocaleTimeString(),
      command: getCommandLabel(command),
      message,
      success
    })
    
    // 保持最多10条日志
    if (commandLogs.value.length > 10) {
      commandLogs.value.pop()
    }

    if (success) {
      ElMessage.success(message)
      emit('refresh')
    } else {
      ElMessage.error(message)
    }
  } catch (error) {
    console.error('命令发送失败:', error)
    ElMessage.error(error.message || '命令发送失败')
    
    commandLogs.value.unshift({
      time: new Date().toLocaleTimeString(),
      command: getCommandLabel(command),
      message: error.message || '请求失败',
      success: false
    })
  } finally {
    loading[command] = false
  }
}

// 重置单个滤芯
const resetFilter = async (filter) => {
  loading[`filter${filter.id}`] = true
  try {
    await sendCommand('filter_reset', {
      filter_index: filter.id,
      flux: filter.newFlux,
      flux_max: filter.newFluxMax
    })
    // 更新本地状态
    filter.remaining = filter.newFlux
    filter.total = filter.newFluxMax
    filter.percent = Math.round((filter.newFlux / filter.newFluxMax) * 100)
  } finally {
    loading[`filter${filter.id}`] = false
  }
}

// 重置所有滤芯
const resetAllFilters = async () => {
  try {
    await ElMessageBox.confirm('确定要重置所有滤芯吗？', '确认', { type: 'warning' })
    await sendCommand('filter_reset_all')
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

// 确认强制冲洗
const confirmFlush = async () => {
  try {
    await ElMessageBox.confirm('确定要强制冲洗吗？', '确认', { type: 'warning' })
    await sendCommand('flush')
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

// 确认排水
const confirmDrain = async () => {
  try {
    await ElMessageBox.confirm('确定要开启排水吗？', '确认', { type: 'warning' })
    await sendCommand('drain', { enabled: true })
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

// 确认停用
const confirmDeactivate = async () => {
  try {
    await ElMessageBox.confirm('确定要停用设备吗？停用后需要重新激活。', '危险操作', { type: 'error' })
    await sendCommand('deactivate')
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

// 进度条状态
const getProgressStatus = (percent) => {
  if (percent <= 20) return 'exception'
  if (percent <= 50) return 'warning'
  return 'success'
}

// 获取命令标签
const getCommandLabel = (cmd) => {
  const labels = {
    power: '电源控制',
    lock: '锁定/解锁',
    flush: '强制冲洗',
    query: '实时查询',
    deactivate: '停用设备',
    billing_mode: '计费模式',
    recharge_time: '时长充值',
    surplus_flow: '剩余流量',
    reporting_cycle: '上报周期',
    flow_param: '流量系数',
    filter_reset: '滤芯重置',
    filter_reset_all: '重置所有滤芯',
    logo: 'LOGO设置',
    filter_display: '滤芯显示',
    raw_tds_display: 'TDS显示',
    service_phone: '服务电话',
    heating: '加热开关',
    cooling: '制冷开关',
    sleep_mode: '休眠模式',
    child_lock: '童锁',
    drain: '排水控制',
    scheduled_on: '定时开机',
    scheduled_off: '定时关机'
  }
  return labels[cmd] || cmd
}
</script>

<style scoped>
.control-section {
  padding: 10px 0;
}

.control-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 14px;
  border-left: 3px solid #409eff;
  padding-left: 10px;
}

.control-card {
  margin-bottom: 15px;
}

.control-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.control-item .label {
  font-size: 14px;
  color: #606266;
}

.filter-info {
  font-size: 12px;
  color: #909399;
  margin-left: 10px;
}

.tip {
  font-size: 12px;
  color: #909399;
  margin-left: 10px;
}

.command-log {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.command-log h4 {
  margin: 0 0 10px 0;
  font-size: 13px;
  color: #909399;
}

.log-list {
  max-height: 150px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  align-items: center;
  padding: 5px 10px;
  font-size: 12px;
  border-radius: 4px;
  margin-bottom: 5px;
}

.log-item.success {
  background: #f0f9eb;
  color: #67c23a;
}

.log-item.error {
  background: #fef0f0;
  color: #f56c6c;
}

.log-item .time {
  width: 70px;
  flex-shrink: 0;
}

.log-item .cmd {
  width: 100px;
  flex-shrink: 0;
  font-weight: 500;
}

.log-item .result {
  flex: 1;
}
</style>
