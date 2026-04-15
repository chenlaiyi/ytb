<template>
  <div class="add-client-container">
    <!-- 移除头部导航条，界面更简洁 -->
    
    <div class="content">
      <Form @submit="onSubmit">
        <CellGroup inset>
          <Field
            v-model="formData.name"
            name="name"
            label="客户姓名"
            placeholder="请输入客户姓名"
            :rules="[{ required: true, message: '请输入客户姓名' }]"
          />
          <Field
            v-model="formData.phone"
            name="phone"
            label="手机号码"
            placeholder="请输入手机号码"
            type="tel"
            :rules="[
              { required: true, message: '请输入手机号码' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
            ]"
          />
          <Field
            v-model="formData.address"
            name="address"
            label="联系地址"
            placeholder="请输入联系地址"
            :rules="[{ required: true, message: '请输入联系地址' }]"
          />
          <Field
            v-model="formData.remark"
            name="remark"
            label="备注"
            type="textarea"
            placeholder="请输入备注信息(选填)"
            autosize
            maxlength="200"
            show-word-limit
          />
        </CellGroup>
        
        <div class="form-divider">添加设备(选填)</div>
        
        <CellGroup inset>
          <Cell title="是否添加设备" is-link center>
            <template #right-icon>
              <Switch v-model="addDevice" size="24" />
            </template>
          </Cell>
        </CellGroup>
        
        <CellGroup inset v-if="addDevice">
          <Field
            v-model="deviceData.deviceNumber"
            name="deviceNumber"
            label="设备编号"
            placeholder="请输入设备编号"
            :rules="addDevice ? [{ required: true, message: '请输入设备编号' }] : []"
          >
            <template #button>
              <Button size="small" type="primary" @click="scanCode">扫码</Button>
            </template>
          </Field>
          
          <Field
            v-model="deviceData.deviceModel"
            name="deviceModel"
            label="设备型号"
            placeholder="请选择设备型号"
            readonly
            is-link
            @click="showModelPicker = true"
            :rules="addDevice ? [{ required: true, message: '请选择设备型号' }] : []"
          />
          
          <Popup v-model:show="showModelPicker" position="bottom">
            <Picker
              v-model="selectedModel"
              :columns="modelOptions"
              @confirm="onModelConfirm"
              @cancel="showModelPicker = false"
            />
          </Popup>
          
          <Field
            v-model="deviceData.installAddress"
            name="installAddress"
            label="安装地址"
            placeholder="请输入安装地址"
            :rules="addDevice ? [{ required: true, message: '请输入安装地址' }] : []"
          />
        </CellGroup>
        
        <div style="margin: 24px 16px">
          <Button round block type="primary" native-type="submit" :loading="submitting">
            {{ submitting ? '提交中...' : '提交' }}
          </Button>
        </div>
      </Form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { 
  NavBar, 
  Form, 
  Field, 
  CellGroup,
  Cell,
  Button,
  Switch,
  Popup,
  Picker,
  showToast,
  showSuccessToast
} from 'vant'

const router = useRouter()
const submitting = ref(false)
const addDevice = ref(false)
const showModelPicker = ref(false)
const selectedModel = ref('')

// 客户表单数据
const formData = reactive({
  name: '',
  phone: '',
  address: '',
  remark: ''
})

// 设备表单数据
const deviceData = reactive({
  deviceNumber: '',
  deviceModel: '',
  installAddress: ''
})

// 设备型号选项
const modelOptions = [
  '智能净水器 S1',
  '智能净水器 S1 Mini',
  '智能净水器 S2',
  '智能净水器 S2 Pro',
  '智能净水器 S3'
]

// 扫描二维码
const scanCode = () => {
  // 实际项目中应调用设备扫码 API
  showToast('启动扫码')
  
  // 模拟扫码结果
  setTimeout(() => {
    deviceData.deviceNumber = 'TW2023' + Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    showSuccessToast('扫码成功')
  }, 1500)
}

// 选择设备型号
const onModelConfirm = (value) => {
  deviceData.deviceModel = value.selectedValues[0]
  showModelPicker.value = false
}

// 提交表单
const onSubmit = () => {
  // 验证设备信息（如果需要添加设备）
  if (addDevice.value) {
    if (!deviceData.deviceNumber) {
      showToast('请输入设备编号')
      return
    }
    if (!deviceData.deviceModel) {
      showToast('请选择设备型号')
      return
    }
    if (!deviceData.installAddress) {
      showToast('请输入安装地址')
      return
    }
  }
  
  submitting.value = true
  
  // 构造提交数据
  const submitData = {
    client: { ...formData },
    device: addDevice.value ? { ...deviceData } : null
  }
  
  console.log('提交数据:', submitData)
  
  // 实际项目中应调用API提交数据
  // 模拟提交
  setTimeout(() => {
    submitting.value = false
    showSuccessToast('添加成功')
    
    // 清空表单
    Object.keys(formData).forEach(key => {
      formData[key] = ''
    })
    Object.keys(deviceData).forEach(key => {
      deviceData[key] = ''
    })
    addDevice.value = false
    
    // 返回客户列表
    router.replace('/salesman/clients')
  }, 1500)
}
</script>

<style scoped>
.add-client-container {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-top: 20px; /* 添加顶部内边距替代导航条空间 */
}

.content {
  padding: 16px 0;
}

.form-divider {
  padding: 16px 16px 8px;
  color: #969799;
  font-size: 14px;
  font-weight: bold;
}

:deep(.van-field__right-icon) {
  display: flex;
  align-items: center;
}
</style> 