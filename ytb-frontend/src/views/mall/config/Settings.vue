<template>
  <div class="mall-settings">
    <el-card>
      <template #header>
        <span>商城基础设置</span>
      </template>

      <el-alert
        v-if="loadError"
        type="error"
        :closable="false"
        class="mb-16"
        :title="loadError"
      />

      <el-skeleton v-if="loading" :rows="6" animated />

      <el-form
        v-else
        :model="form"
        label-width="120px"
        style="max-width: 600px"
      >
        <el-form-item label="商城名称">
          <el-input v-model="form.mall_name" placeholder="请输入商城名称" />
        </el-form-item>

        <el-form-item label="商城Logo">
          <el-upload
            class="logo-uploader"
            action="/api/upload"
            :show-file-list="false"
            :on-success="handleLogoSuccess"
            :before-upload="beforeLogoUpload"
          >
            <img v-if="form.mall_logo" :src="form.mall_logo" class="logo" />
            <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item label="商城描述">
          <el-input
            v-model="form.mall_description"
            type="textarea"
            :rows="3"
            placeholder="请输入商城描述"
          />
        </el-form-item>

        <el-form-item label="客服电话">
          <el-input v-model="form.service_phone" placeholder="请输入客服电话" />
        </el-form-item>

        <el-form-item label="客服微信">
          <el-input v-model="form.service_wechat" placeholder="请输入客服微信" />
        </el-form-item>

        <el-form-item label="商城状态">
          <el-switch
            v-model="form.mall_status"
            active-text="开启"
            inactive-text="关闭"
          />
        </el-form-item>

        <el-form-item label="允许商户入驻">
          <el-switch
            v-model="form.allow_merchant"
            active-text="允许"
            inactive-text="禁止"
          />
        </el-form-item>

        <el-form-item label="商户商品审核">
          <el-switch
            v-model="form.merchant_audit"
            active-text="需要审核"
            inactive-text="自动通过"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSave" :loading="saving">
            保存设置
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
import { Plus } from '@element-plus/icons-vue'
import { getMallBasicSettings, updateMallBasicSettings } from '@/api/v1/mallConfig'

const loading = ref(false)
const saving = ref(false)
const loadError = ref('')

const toBoolean = (value, defaultValue = true) => {
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

const defaultForm = () => ({
  mall_name: '',
  mall_logo: '',
  mall_description: '',
  service_phone: '',
  service_wechat: '',
  mall_status: true,
  allow_merchant: true,
  merchant_audit: true
})

const form = reactive(defaultForm())
let originalFormSnapshot = defaultForm()

const syncForm = (data = {}) => {
  const merged = {
    ...defaultForm(),
    ...data,
    mall_status: toBoolean(data.mall_status, true),
    allow_merchant: toBoolean(data.allow_merchant, true),
    merchant_audit: toBoolean(data.merchant_audit, true)
  }
  Object.assign(form, merged)
  originalFormSnapshot = JSON.parse(JSON.stringify(merged))
}

const loadSettings = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const response = await getMallBasicSettings()
    if (response && (response.code === 0 || response.code === 200)) {
      syncForm(response.data || {})
    } else {
      throw new Error(response?.message || '获取商城设置失败')
    }
  } catch (error) {
    const message = error.message || '加载商城设置失败'
    loadError.value = message
    ElMessage.error(message)
  } finally {
    loading.value = false
  }
}

const handleLogoSuccess = (response, file) => {
  if (response?.data?.url) {
    form.mall_logo = response.data.url
  } else if (file?.raw) {
    form.mall_logo = URL.createObjectURL(file.raw)
  } else {
    ElMessage.warning('Logo上传成功但未返回地址，请手动输入')
  }
}

const beforeLogoUpload = (file) => {
  const isValidType = ['image/jpeg', 'image/png'].includes(file.type)
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isValidType) {
    ElMessage.error('Logo只能是 JPG/PNG 格式!')
  }
  if (!isLt2M) {
    ElMessage.error('Logo大小不能超过 2MB!')
  }
  return isValidType && isLt2M
}

const buildPayload = () => ({
  mall_name: form.mall_name,
  mall_logo: form.mall_logo,
  mall_description: form.mall_description,
  service_phone: form.service_phone,
  service_wechat: form.service_wechat,
  mall_status: form.mall_status ? 1 : 0,
  allow_merchant: form.allow_merchant ? 1 : 0,
  merchant_audit: form.merchant_audit ? 1 : 0
})

const handleSave = async () => {
  saving.value = true
  try {
    const payload = buildPayload()
    const response = await updateMallBasicSettings(payload)
    if (response && (response.code === 0 || response.code === 200)) {
      ElMessage.success('保存成功')
      syncForm(response.data || {})
    } else {
      throw new Error(response?.message || '保存商城设置失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '保存商城设置失败')
  } finally {
    saving.value = false
  }
}

const handleReset = () => {
  Object.assign(form, JSON.parse(JSON.stringify(originalFormSnapshot)))
  ElMessage.info('已重置为上次保存的配置')
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.mall-settings {
  padding: 20px;
}

.mb-16 {
  margin-bottom: 16px;
}

.logo-uploader .logo {
  width: 100px;
  height: 100px;
  display: block;
}

.logo-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.logo-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.logo-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
  line-height: 100px;
}
</style>
