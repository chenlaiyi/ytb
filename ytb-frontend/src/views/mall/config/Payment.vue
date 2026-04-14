<template>
  <div class="payment-config">
    <div class="page-header">
      <h1>支付配置</h1>
      <p>配置商城支付方式与启用状态</p>
    </div>

    <el-alert
      v-if="loadError"
      type="error"
      :closable="false"
      class="mb-16"
      :title="loadError"
    />

    <el-skeleton v-if="loading" :rows="6" animated />

    <el-card v-else>
      <template #header>
        <span>支付方式配置</span>
      </template>

      <el-form :model="form" label-width="120px">
        <el-form-item label="微信支付">
          <el-switch v-model="form.wechat_enabled" />
          <span class="form-tip">启用微信支付</span>
        </el-form-item>

        <el-form-item label="支付宝支付">
          <el-switch v-model="form.alipay_enabled" />
          <span class="form-tip">启用支付宝支付</span>
        </el-form-item>

        <el-form-item label="余额支付">
          <el-switch v-model="form.balance_enabled" />
          <span class="form-tip">启用账户余额支付</span>
        </el-form-item>

        <el-form-item label="货到付款">
          <el-switch v-model="form.cod_enabled" />
          <span class="form-tip">启用货到付款</span>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSave">
            保存配置
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getMallPaymentSettings, updateMallPaymentSettings } from '@/api/v1/mallConfig'

const loading = ref(false)
const saving = ref(false)
const loadError = ref('')

const defaultForm = () => ({
  wechat_enabled: true,
  alipay_enabled: true,
  balance_enabled: true,
  cod_enabled: false
})

const form = reactive(defaultForm())
let originalSnapshot = defaultForm()

const normalizeBoolean = (value, defaultValue = false) => {
  if (value === null || value === undefined || value === '') {
    return defaultValue
  }
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    return value === 1
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === '1' || normalized === 'true' || normalized === 'yes'
  }
  return defaultValue
}

const syncForm = (data = {}) => {
  const merged = {
    ...defaultForm(),
    ...data,
    wechat_enabled: normalizeBoolean(data.wechat_enabled, true),
    alipay_enabled: normalizeBoolean(data.alipay_enabled, true),
    balance_enabled: normalizeBoolean(data.balance_enabled, true),
    cod_enabled: normalizeBoolean(data.cod_enabled, false)
  }
  Object.assign(form, merged)
  originalSnapshot = JSON.parse(JSON.stringify(merged))
}

const loadConfig = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const response = await getMallPaymentSettings()
    if (response && (response.code === 0 || response.code === 200)) {
      syncForm(response.data || {})
    } else {
      throw new Error(response?.message || '获取支付配置失败')
    }
  } catch (error) {
    loadError.value = error.message || '加载支付配置失败'
    ElMessage.error(loadError.value)
  } finally {
    loading.value = false
  }
}

const buildPayload = () => ({
  wechat_enabled: form.wechat_enabled ? 1 : 0,
  alipay_enabled: form.alipay_enabled ? 1 : 0,
  balance_enabled: form.balance_enabled ? 1 : 0,
  cod_enabled: form.cod_enabled ? 1 : 0
})

const handleSave = async () => {
  saving.value = true
  try {
    const payload = buildPayload()
    const response = await updateMallPaymentSettings(payload)
    if (response && (response.code === 0 || response.code === 200)) {
      ElMessage.success('支付配置保存成功')
      syncForm(response.data || {})
    } else {
      throw new Error(response?.message || '保存支付配置失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '保存支付配置失败')
  } finally {
    saving.value = false
  }
}

const handleReset = () => {
  Object.assign(form, JSON.parse(JSON.stringify(originalSnapshot)))
  ElMessage.info('已恢复至上次保存的配置')
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.payment-config {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 22px;
  color: #303133;
  margin: 0 0 8px;
}

.page-header p {
  color: #909399;
  margin: 0;
}

.form-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}

.mb-16 {
  margin-bottom: 16px;
}
</style>
