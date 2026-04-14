<template>
  <el-form-item 
    :label="field.label" 
    :prop="field.name"
    :required="field.required"
  >
    <div class="field-wrapper">
      <el-input
        v-model="phoneValue"
        :placeholder="field.placeholder || `请输入${field.label}`"
        :readonly="readonly"
        :disabled="disabled"
        :maxlength="field.max_length || 11"
        :show-word-limit="field.show_word_limit"
        clearable
        @blur="handleBlur"
        @focus="handleFocus"
        @input="handleInput"
      >
        <template #prefix>
          <el-icon class="input-icon"><PhoneFilled /></el-icon>
        </template>
        
        <template v-if="field.show_verify_button" #suffix>
          <el-button
            :loading="verifying"
            :disabled="!isValidPhone || countdown > 0"
            type="text"
            size="small"
            @click="sendVerifyCode"
          >
            {{ countdownText }}
          </el-button>
        </template>
      </el-input>
      
      <!-- 验证码输入框 -->
      <el-input
        v-if="field.show_verify_input && showVerifyInput"
        v-model="verifyCode"
        placeholder="请输入验证码"
        :maxlength="6"
        class="verify-input"
        @blur="handleVerifyBlur"
      >
        <template #prefix>
          <el-icon class="input-icon"><Key /></el-icon>
        </template>
      </el-input>
      
      <div v-if="field.help_text || phoneFormatHint" class="help-text">
        <div v-if="field.help_text">{{ field.help_text }}</div>
        <div v-if="phoneFormatHint" class="format-hint">{{ phoneFormatHint }}</div>
      </div>
    </div>
  </el-form-item>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { PhoneFilled, Key } from '@element-plus/icons-vue'

const props = defineProps({
  field: {
    type: Object,
    required: true
  },
  modelValue: {
    type: [String, Number],
    default: ''
  },
  readonly: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus', 'input', 'verify-send', 'verify-success'])

const phoneValue = computed({
  get: () => props.modelValue || '',
  set: (value) => {
    // 只允许数字输入
    const cleaned = value.replace(/[^\d]/g, '')
    emit('update:modelValue', cleaned)
  }
})

const verifyCode = ref('')
const verifying = ref(false)
const countdown = ref(0)
const showVerifyInput = ref(false)
let countdownTimer = null

// 验证手机号格式
const isValidPhone = computed(() => {
  const phone = phoneValue.value
  return /^1[3-9]\d{9}$/.test(phone)
})

// 手机号格式提示
const phoneFormatHint = computed(() => {
  const phone = phoneValue.value
  if (phone && !isValidPhone.value) {
    return '请输入正确的11位手机号码'
  }
  return ''
})

// 倒计时文本
const countdownText = computed(() => {
  if (verifying.value) {
    return '发送中...'
  }
  if (countdown.value > 0) {
    return `${countdown.value}秒后重发`
  }
  return '获取验证码'
})

// 发送验证码
const sendVerifyCode = async () => {
  if (!isValidPhone.value) return
  
  verifying.value = true
  
  try {
    emit('verify-send', phoneValue.value)
    
    // 模拟发送成功，开始倒计时
    startCountdown()
    showVerifyInput.value = true
    
  } catch (error) {
    console.error('发送验证码失败:', error)
  } finally {
    verifying.value = false
  }
}

// 开始倒计时
const startCountdown = () => {
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

// 验证码验证
const handleVerifyBlur = () => {
  if (verifyCode.value && verifyCode.value.length === 6) {
    emit('verify-success', {
      phone: phoneValue.value,
      code: verifyCode.value
    })
  }
}

const handleBlur = (event) => {
  emit('blur', event)
}

const handleFocus = (event) => {
  emit('focus', event)
}

const handleInput = (value) => {
  emit('input', value)
}

// 组件卸载时清理定时器
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style scoped>
.field-wrapper {
  width: 100%;
}

.input-icon {
  color: #c0c4cc;
  font-size: 16px;
}

.verify-input {
  margin-top: 8px;
}

.help-text {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.format-hint {
  color: #f56c6c;
  margin-top: 2px;
}

:deep(.el-input__inner) {
  padding-left: 32px;
}

:deep(.el-input__prefix) {
  left: 8px;
}

:deep(.el-input__suffix .el-button) {
  padding: 0 8px;
  font-size: 12px;
  color: #409eff;
  border: none;
}

:deep(.el-input__suffix .el-button:hover) {
  background: transparent;
  color: #66b1ff;
}

:deep(.el-input__suffix .el-button.is-disabled) {
  color: #c0c4cc;
}
</style> 