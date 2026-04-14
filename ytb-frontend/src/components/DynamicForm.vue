<template>
  <div class="dynamic-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      label-position="top"
    >
      <template v-for="field in fields" :key="field.id">
        <component
          :is="getFieldComponent(field.type)"
          :field="field"
          v-model="formData[field.name]"
          :readonly="readonly"
        />
      </template>
      
      <el-form-item v-if="!readonly && showSubmit">
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ submitText }}
        </el-button>
        <el-button v-if="showReset" @click="handleReset">
          重置
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  fields: {
    type: Array,
    default: () => []
  },
  modelValue: {
    type: Object,
    default: () => ({})
  },
  readonly: {
    type: Boolean,
    default: false
  },
  showSubmit: {
    type: Boolean,
    default: true
  },
  showReset: {
    type: Boolean,
    default: true
  },
  submitText: {
    type: String,
    default: '提交'
  },
  submitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'submit', 'reset', 'validate'])

const formRef = ref()
const formData = reactive({})

// 初始化表单数据
const initFormData = () => {
  props.fields.forEach(field => {
    if (props.modelValue[field.name] !== undefined) {
      formData[field.name] = props.modelValue[field.name]
    } else {
      // 设置默认值
      switch (field.type) {
        case 'checkbox':
          formData[field.name] = []
          break
        default:
          formData[field.name] = ''
      }
    }
  })
}

// 监听字段变化
watch(() => props.fields, () => {
  initFormData()
}, { immediate: true, deep: true })

// 监听外部数据变化
watch(() => props.modelValue, (newValue) => {
  Object.keys(newValue).forEach(key => {
    if (formData[key] !== newValue[key]) {
      formData[key] = newValue[key]
    }
  })
}, { deep: true })

// 监听表单数据变化
watch(formData, (newValue) => {
  emit('update:modelValue', { ...newValue })
}, { deep: true })

// 表单验证规则
const formRules = computed(() => {
  const rules = {}
  
  props.fields.forEach(field => {
    const fieldRules = []
    
    // 必填验证
    if (field.required) {
      fieldRules.push({
        required: true,
        message: `${field.label}不能为空`,
        trigger: ['blur', 'change']
      })
    }
    
    // 长度验证
    if (field.max_length) {
      fieldRules.push({
        max: field.max_length,
        message: `${field.label}不能超过${field.max_length}个字符`,
        trigger: 'blur'
      })
    }
    
    // 正则验证
    if (field.pattern) {
      fieldRules.push({
        pattern: new RegExp(field.pattern),
        message: `${field.label}格式不正确`,
        trigger: 'blur'
      })
    }
    
    // 邮箱验证
    if (field.type === 'email') {
      fieldRules.push({
        type: 'email',
        message: '请输入正确的邮箱地址',
        trigger: 'blur'
      })
    }
    
    // 手机号验证
    if (field.type === 'phone') {
      fieldRules.push({
        pattern: /^1[3-9]\d{9}$/,
        message: '请输入正确的手机号码',
        trigger: 'blur'
      })
    }
    
    if (fieldRules.length > 0) {
      rules[field.name] = fieldRules
    }
  })
  
  return rules
})

// 获取字段组件
const getFieldComponent = (type) => {
  const components = {
    text: 'FormFieldText',
    textarea: 'FormFieldTextarea',
    select: 'FormFieldSelect',
    radio: 'FormFieldRadio',
    checkbox: 'FormFieldCheckbox',
    date: 'FormFieldDate',
    phone: 'FormFieldPhone',
    email: 'FormFieldEmail'
  }
  return components[type] || 'FormFieldText'
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    emit('submit', { ...formData })
  } catch (error) {
    ElMessage.error('请检查表单填写是否正确')
  }
}

// 重置表单
const handleReset = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  emit('reset')
}

// 验证表单
const validate = async () => {
  if (!formRef.value) return false
  
  try {
    await formRef.value.validate()
    return true
  } catch (error) {
    return false
  }
}

// 验证特定字段
const validateField = (fieldName) => {
  if (formRef.value) {
    formRef.value.validateField(fieldName)
  }
}

// 清除验证
const clearValidate = (fieldNames) => {
  if (formRef.value) {
    formRef.value.clearValidate(fieldNames)
  }
}

// 暴露方法给父组件
defineExpose({
  validate,
  validateField,
  clearValidate,
  handleReset,
  formData: readonly(formData)
})
</script>

<style scoped>
.dynamic-form {
  padding: 16px;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #333;
}

:deep(.el-input) {
  width: 100%;
}

:deep(.el-select) {
  width: 100%;
}

:deep(.el-date-editor) {
  width: 100%;
}
</style> 