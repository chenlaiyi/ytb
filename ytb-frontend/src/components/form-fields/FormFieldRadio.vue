<template>
  <el-form-item 
    :label="field.label" 
    :prop="field.name"
    :required="field.required"
  >
    <div class="field-wrapper">
      <el-radio-group
        v-model="radioValue"
        :disabled="disabled || readonly"
        :size="field.size || 'default'"
        @change="handleChange"
      >
        <template v-if="field.display_type === 'button'">
          <el-radio-button
            v-for="option in options"
            :key="option.value"
            :value="option.value"
            :disabled="option.disabled"
          >
            {{ option.label }}
          </el-radio-button>
        </template>
        
        <template v-else>
          <el-radio
            v-for="option in options"
            :key="option.value"
            :value="option.value"
            :disabled="option.disabled"
          >
            {{ option.label }}
          </el-radio>
        </template>
      </el-radio-group>
      
      <div v-if="field.help_text" class="help-text">
        {{ field.help_text }}
      </div>
    </div>
  </el-form-item>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  field: {
    type: Object,
    required: true
  },
  modelValue: {
    type: [String, Number, Boolean],
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

const emit = defineEmits(['update:modelValue', 'change'])

const radioValue = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
  }
})

// 处理选项数据
const options = computed(() => {
  if (!props.field.options) return []
  
  // 如果是字符串数组，转换为对象数组
  if (Array.isArray(props.field.options)) {
    return props.field.options.map(option => {
      if (typeof option === 'string') {
        return { label: option, value: option }
      }
      return {
        label: option.label || option.value,
        value: option.value,
        disabled: option.disabled || false
      }
    })
  }
  
  // 如果是对象格式 {key: value}
  if (typeof props.field.options === 'object') {
    return Object.entries(props.field.options).map(([value, label]) => ({
      label: label,
      value: value
    }))
  }
  
  return []
})

const handleChange = (value) => {
  emit('change', value)
}
</script>

<style scoped>
.field-wrapper {
  width: 100%;
}

.help-text {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

:deep(.el-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

:deep(.el-radio) {
  margin-right: 0;
  white-space: normal;
}

:deep(.el-radio__label) {
  padding-left: 8px;
  font-size: 14px;
  line-height: 1.4;
}

:deep(.el-radio-button) {
  margin: 0;
}

/* 垂直布局 */
.field-wrapper :deep(.el-radio-group[data-layout="vertical"]) {
  flex-direction: column;
  align-items: flex-start;
}
</style> 